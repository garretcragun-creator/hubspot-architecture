/**
 * Discovery Meeting Attribution App — entry point
 * ─────────────────────────────────────────────────
 * HTTP server that:
 *   POST /webhook/meeting-created  — receives meeting-created events
 *   POST /slack/events             — Slack Events API (handled by Bolt)
 *   POST /slack/actions            — Slack Interactivity (handled by Bolt)
 *
 * Uses @slack/bolt ExpressReceiver so custom routes and Bolt live on one port.
 */

require('dotenv').config();

const { App, ExpressReceiver } = require('@slack/bolt');

const {
  getContact,
  getCompany,
  getMeeting,
  patchMeeting,
  patchMeetingOutcome,
  patchCompany,
  getMeetingAssociations,
  getOwnerById,
  getRecentOutboundActivity,
  getHapilyRegistrants,
  getNewMeetings,
} = require('./hubspot');

const { getCallsInWindow, inferMeetingHeld } = require('./gong');

const { inferSource } = require('./inference');
const { scheduleJob, markResponded, schedulePostMeetingJob, markPostMeetingResponded } = require('./scheduler');
const {
  buildAttributionBlocks,
  sendAttributionDM,
  updateAttributionMessage,
  registerActionHandlers,
  buildPostMeetingBlocks,
  buildPostMeetingConfirmedBlocks,
  registerPostMeetingActionHandlers,
} = require('./slack');

// ─── Config ──────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '3000', 10);
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

if (!SLACK_SIGNING_SECRET || !SLACK_BOT_TOKEN) {
  console.error('[index] SLACK_SIGNING_SECRET and SLACK_BOT_TOKEN are required');
  process.exit(1);
}
if (!process.env.HUBSPOT_ACCESS_TOKEN) {
  console.error('[index] HUBSPOT_ACCESS_TOKEN is required');
  process.exit(1);
}

// ─── Idempotency guard ───────────────────────────────────────────────────────
// meetingId → timestamp of first webhook receipt
const _seen = new Map();
const IDEMPOTENCY_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

function isDuplicate(meetingId) {
  const ts = _seen.get(meetingId);
  if (!ts) return false;
  return Date.now() - ts < IDEMPOTENCY_WINDOW_MS;
}

function markSeen(meetingId) {
  _seen.set(meetingId, Date.now());
  // Expire entry after window to avoid unbounded growth
  setTimeout(() => _seen.delete(meetingId), IDEMPOTENCY_WINDOW_MS + 1000);
}

// ─── In-memory store: meetingId → { channel, ts, meetingTitle } ─────────────
// Needed so action handlers and fallback can update the Slack message.
const _msgStore = new Map();

// ─── Post-meeting store: meetingId → { channel, ts, meetingTitle } ───────────
// Same shape as _msgStore but for the outcome DM sent at meeting end time.
const _postMsgStore = new Map();

// ─── Bolt + Express setup ────────────────────────────────────────────────────
const receiver = new ExpressReceiver({
  signingSecret: SLACK_SIGNING_SECRET,
  endpoints: {
    events: '/slack/events',
    actions: '/slack/actions',
    commands: '/slack/commands',
  },
});

const app = new App({
  token: SLACK_BOT_TOKEN,
  receiver,
});

// Body parser for custom (non-Slack) routes — Bolt only handles Slack payloads
const express = require('express');
receiver.router.use(express.json());

// ─── Shared action handler ───────────────────────────────────────────────────
/**
 * Called by both "Yes" button and "Something else" dropdown.
 * Handles HubSpot patch + scheduler cancel + Slack message update.
 */
async function handleRepAction({ meetingId, companyId, chosenSource, body }) {
  markResponded(meetingId);

  // Get stored Slack message ref
  const msgRef = _msgStore.get(meetingId);

  // Determine channel + ts from stored ref OR from body (interactive payload)
  const channel = msgRef?.channel || body?.container?.channel_id;
  const ts = msgRef?.ts || body?.container?.message_ts;
  const meetingTitle = msgRef?.meetingTitle || '(meeting)';

  console.log(
    `[index] rep action for meeting ${meetingId}: source="${chosenSource}" channel=${channel} ts=${ts}`
  );

  // Patch HubSpot
  const patches = [
    patchMeeting(meetingId, { meeting_source: chosenSource }).catch((err) =>
      console.error(`[index] patchMeeting ${meetingId}: ${err.message}`)
    ),
  ];
  if (companyId) {
    patches.push(
      patchCompany(companyId, {
        stat_latest_source: chosenSource,
        discovery_source: chosenSource,
      }).catch((err) =>
        console.error(`[index] patchCompany ${companyId}: ${err.message}`)
      )
    );
  }
  await Promise.allSettled(patches);

  // Update Slack message
  if (channel && ts) {
    await updateAttributionMessage(app, {
      channel,
      ts,
      meetingTitle,
      source: chosenSource,
      setBy: 'rep',
    }).catch((err) => console.error(`[index] updateAttributionMessage: ${err.message}`));
  }
}

registerActionHandlers(app, { onAction: handleRepAction });

// ─── Post-meeting outcome action handler ─────────────────────────────────────
/**
 * Called by both "Yes" button and "Something else" dropdown on the outcome DM.
 * Handles HubSpot patch + scheduler cancel + Slack message update.
 */
async function handleOutcomeAction({ meetingId, chosenOutcome, body }) {
  markPostMeetingResponded(meetingId);

  const msgRef = _postMsgStore.get(meetingId);
  const channel = msgRef?.channel || body?.container?.channel_id;
  const ts      = msgRef?.ts      || body?.container?.message_ts;
  const meetingTitle = msgRef?.meetingTitle || '(meeting)';

  console.log(
    `[index] outcome action for meeting ${meetingId}: outcome="${chosenOutcome}" channel=${channel} ts=${ts}`
  );

  // Patch hs_meeting_outcome in HubSpot
  await patchMeetingOutcome(meetingId, chosenOutcome).catch((err) =>
    console.error(`[index] patchMeetingOutcome ${meetingId}: ${err.message}`)
  );

  // Update Slack message to confirmed state
  if (channel && ts) {
    await app.client.chat.update({
      channel,
      ts,
      text: `Meeting outcome recorded: ${chosenOutcome}`,
      blocks: buildPostMeetingConfirmedBlocks({ meetingTitle, outcome: chosenOutcome, setBy: 'rep' }),
    }).catch((err) => console.error(`[index] chat.update outcome: ${err.message}`));
  }
}

registerPostMeetingActionHandlers(app, { onOutcome: handleOutcomeAction });

// ─── Core meeting processor ───────────────────────────────────────────────────
/**
 * Fetch, infer, and dispatch a Slack DM for a single meeting.
 * Called both by the webhook handler and the built-in poller.
 */
async function processMeeting(meetingId) {
  // 1. Fetch meeting
  const meeting = await getMeeting(meetingId);

  // Only process Discovery Calls
  if (meeting.hs_activity_type !== 'Discovery Call') {
    console.log(`[meeting] ${meetingId} skipped — type is "${meeting.hs_activity_type || 'unset'}"`);
    return;
  }

  const meetingTitle = meeting.hs_meeting_title || '(untitled)';
  // HubSpot returns ISO 8601 strings for date properties (e.g. "2026-03-02T16:00:00Z")
  const meetingStartMs = meeting.hs_meeting_start_time
    ? new Date(meeting.hs_meeting_start_time).getTime()
    : 0;
  const meetingTime = meetingStartMs
    ? new Date(meetingStartMs).toLocaleString('en-US', {
        timeZone: 'America/New_York',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
      })
    : '(unknown)';
  const ownerId = meeting.hubspot_owner_id;

  // hs_createdate is also an ISO 8601 string from HubSpot
  const meetingCreatedMs = meeting.hs_createdate
    ? new Date(meeting.hs_createdate).getTime()
    : Date.now();

  // 2. Fetch associations
  const [contactIds, companyIds] = await Promise.all([
    getMeetingAssociations(meetingId, 'contacts'),
    getMeetingAssociations(meetingId, 'companies'),
  ]);

  const contactId = contactIds[0] || null;
  const companyId = companyIds[0] || null;

  // 3. Fetch contact, company, recent activity, hapily registrants in parallel
  const [contact, company, recentActivity, hapilyRegistrants] = await Promise.all([
    contactId ? getContact(contactId) : Promise.resolve({}),
    companyId ? getCompany(companyId) : Promise.resolve({}),
    contactId ? getRecentOutboundActivity(contactId, meetingCreatedMs) : Promise.resolve([]),
    contactId ? getHapilyRegistrants(contactId) : Promise.resolve([]),
  ]);

  // 4. Run inference
  const { source: inferredSource, reason, confidence } = inferSource(
    contact,
    company,
    recentActivity,
    hapilyRegistrants,
    meetingCreatedMs
  );

  console.log(
    `[meeting] ${meetingId} inferred source: "${inferredSource}" (confidence ${confidence}) — ${reason}`
  );

  // 5. Resolve owner email
  const owner = ownerId ? await getOwnerById(ownerId) : null;
  const ownerEmail = owner?.email;

  if (!ownerEmail) {
    console.warn(
      `[meeting] no owner email for ${meetingId} (ownerId=${ownerId}) — skipping DM`
    );
  }

  // 6. Build and send Slack DM
  let channel = null;
  let ts = null;

  if (ownerEmail) {
    const blocks = buildAttributionBlocks({
      meetingId,
      companyId,
      inferredSource,
      meetingTitle,
      meetingTime,
      reason,
      confidence,
    });

    try {
      const dmResult = await sendAttributionDM(app, { ownerEmail, blocks });
      channel = dmResult.channel;
      ts = dmResult.ts;
      console.log(`[meeting] DM sent to ${ownerEmail} — channel=${channel} ts=${ts}`);
    } catch (err) {
      console.error(`[meeting] sendAttributionDM: ${err.message}`);
    }
  }

  // Store message ref for later updates
  if (channel && ts) {
    _msgStore.set(meetingId, { channel, ts, meetingTitle });
  }

  // 7. Schedule post-meeting outcome check at meeting end time
  const meetingEndMs = meeting.hs_meeting_end_time
    ? new Date(meeting.hs_meeting_end_time).getTime()
    : 0;

  if (meetingEndMs > 0) {
    const delayMs = Math.max(0, meetingEndMs - Date.now()) + GONG_PROCESSING_DELAY_MS;
    const totalMin = Math.round(delayMs / 60000);
    console.log(
      `[meeting] scheduling post-meeting Gong check for ${meetingId} in ${totalMin} min ` +
      `(end + ${GONG_PROCESSING_DELAY_MS / 3600000}h Gong processing buffer)`
    );
    setTimeout(
      () =>
        processPostMeeting({
          meetingId,
          meetingTitle,
          meetingStartMs,
          meetingEndMs,
          ownerEmail,
        }).catch((err) =>
          console.error(`[post-meeting] processPostMeeting ${meetingId}: ${err.message}`, err)
        ),
      delayMs
    );
  } else {
    console.log(
      `[meeting] meeting ${meetingId} has no end time — skipping post-meeting Gong check`
    );
  }

  // 8. Schedule 1-hour fallback
  scheduleJob({
    meetingId,
    companyId,
    inferredSource,
    onFallback: async ({ meetingId: mid, companyId: cid, inferredSource: src }) => {
      const ref = _msgStore.get(mid);
      if (ref?.channel && ref?.ts) {
        await updateAttributionMessage(app, {
          channel: ref.channel,
          ts: ref.ts,
          meetingTitle: ref.meetingTitle,
          source: src,
          setBy: 'auto',
        }).catch((err) =>
          console.error(`[scheduler/fallback] updateAttributionMessage: ${err.message}`)
        );
      }
    },
  });
}

// ─── Post-meeting processor ───────────────────────────────────────────────────
/**
 * Called at meeting end time for a Discovery Call.
 * 1. Queries Gong for calls in the meeting window.
 * 2. Infers held/no-show.
 * 3. Sends outcome DM to the meeting owner.
 * 4. Schedules 1-hour fallback to auto-apply if rep doesn't respond.
 *
 * @param {object} opts
 * @param {string}  opts.meetingId
 * @param {string}  opts.meetingTitle
 * @param {number}  opts.meetingStartMs
 * @param {number}  opts.meetingEndMs
 * @param {string}  opts.ownerEmail
 */
async function processPostMeeting({ meetingId, meetingTitle, meetingStartMs, meetingEndMs, ownerEmail }) {
  console.log(`[post-meeting] processing outcome for meeting ${meetingId}`);

  // 1. Query Gong
  let calls = [];
  try {
    calls = await getCallsInWindow(meetingStartMs, meetingEndMs);
  } catch (err) {
    console.warn(`[post-meeting] getCallsInWindow for ${meetingId}: ${err.message} — proceeding without Gong data`);
  }

  // 2. Infer outcome
  const { held, confidence, reason } = inferMeetingHeld(calls);
  const inferredOutcome = held ? 'COMPLETED' : 'NO_SHOW';

  console.log(
    `[post-meeting] ${meetingId} inferred: ${inferredOutcome} (confidence ${confidence}) — ${reason}`
  );

  // 3. Send outcome DM to rep
  let channel = null;
  let ts = null;

  if (ownerEmail) {
    const blocks = buildPostMeetingBlocks({
      meetingId,
      meetingTitle,
      held,
      inferredOutcome,
      confidence,
      reason,
    });

    try {
      // Resolve email → user ID → DM channel (reuse pattern from sendAttributionDM)
      const lookupRes = await app.client.users.lookupByEmail({ email: ownerEmail });
      const userId = lookupRes.user?.id;
      if (userId) {
        const openRes = await app.client.conversations.open({ users: userId });
        channel = openRes.channel?.id;
        if (channel) {
          const postRes = await app.client.chat.postMessage({
            channel,
            text: `Outcome check for your disco call: ${meetingTitle || '(untitled)'}`,
            blocks,
          });
          ts = postRes.ts;
          console.log(`[post-meeting] DM sent to ${ownerEmail} — channel=${channel} ts=${ts}`);
        }
      }
    } catch (err) {
      console.error(`[post-meeting] sendDM for ${meetingId}: ${err.message}`);
    }
  } else {
    console.warn(`[post-meeting] no ownerEmail for ${meetingId} — skipping DM`);
  }

  // Store ref for later updates
  if (channel && ts) {
    _postMsgStore.set(meetingId, { channel, ts, meetingTitle });
  }

  // 4. Schedule 1-hour fallback
  schedulePostMeetingJob({
    meetingId,
    inferredOutcome,
    onFallback: async ({ meetingId: mid, inferredOutcome: outcome }) => {
      const ref = _postMsgStore.get(mid);
      if (ref?.channel && ref?.ts) {
        await app.client.chat.update({
          channel: ref.channel,
          ts: ref.ts,
          text: `Meeting outcome recorded: ${outcome}`,
          blocks: buildPostMeetingConfirmedBlocks({
            meetingTitle: ref.meetingTitle,
            outcome,
            setBy: 'auto',
          }),
        }).catch((err) =>
          console.error(`[scheduler/post-fallback] chat.update for ${mid}: ${err.message}`)
        );
      }
    },
  });
}

// ─── Webhook handler ─────────────────────────────────────────────────────────
receiver.router.post('/webhook/meeting-created', async (req, res) => {
  // Acknowledge quickly — HubSpot webhooks time out at ~5 s
  res.status(200).json({ ok: true });

  // Support both formats:
  //   Zapier / manual:        { "meetingId": "123" }
  //   HubSpot native webhook: [{ "objectId": 123, "subscriptionType": "meeting.creation" }]
  const rawBody = req.body || {};
  const firstEvent = Array.isArray(rawBody) ? rawBody[0] : rawBody;
  const body = firstEvent || {};
  const meetingId = String(body.meetingId || body.objectId || '').trim();

  if (!meetingId) {
    console.warn('[webhook] received payload with no meetingId — ignored');
    return;
  }

  if (isDuplicate(meetingId)) {
    console.log(`[webhook] duplicate meetingId ${meetingId} within 5 min — skipped`);
    return;
  }
  markSeen(meetingId);

  console.log(`[webhook] received meeting ${meetingId}`);
  processMeeting(meetingId).catch((err) =>
    console.error(`[webhook] processMeeting ${meetingId}: ${err.message}`, err)
  );
});

// ─── Health check ────────────────────────────────────────────────────────────
receiver.router.get('/health', (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// ─── Built-in meeting poller ──────────────────────────────────────────────────
// HubSpot has no "meeting created" workflow trigger, so we poll instead.
// Every 2 minutes, search for meetings created since the last check and process
// any new ones. The idempotency guard prevents double-processing if a webhook
// also fires for the same meeting.
const POLL_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

// How long to wait after meeting end before querying Gong.
// Gong can take up to 2-3 hours to finish processing a call recording.
const GONG_PROCESSING_DELAY_MS = 2 * 60 * 60 * 1000; // 2 hours
// On startup, look back 5 min to catch anything created while restarting
let _lastPolledMs = Date.now() - 5 * 60 * 1000;

async function pollForNewMeetings() {
  const since = _lastPolledMs;
  _lastPolledMs = Date.now(); // advance before fetch to avoid missing meetings on slow polls

  try {
    const newMeetings = await getNewMeetings(since);
    if (newMeetings.length > 0) {
      console.log(`[poller] found ${newMeetings.length} new meeting(s) since ${new Date(since).toISOString()}`);
    }
    for (const { id } of newMeetings) {
      if (isDuplicate(id)) {
        console.log(`[poller] meetingId ${id} already processing — skipped`);
        continue;
      }
      markSeen(id);
      processMeeting(id).catch((err) =>
        console.error(`[poller] processMeeting ${id}: ${err.message}`, err)
      );
    }
  } catch (err) {
    console.warn(`[poller] poll error: ${err.message}`);
  }
}

// ─── Start ───────────────────────────────────────────────────────────────────
(async () => {
  await app.start(PORT);
  console.log(`[index] meeting-attribution-app listening on port ${PORT}`);

  // Kick off the poller
  setInterval(pollForNewMeetings, POLL_INTERVAL_MS);
  console.log(`[poller] started — checking for new meetings every ${POLL_INTERVAL_MS / 1000}s`);
})();
