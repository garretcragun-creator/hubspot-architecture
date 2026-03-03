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
  patchCompany,
  getMeetingAssociations,
  getOwnerById,
  getRecentOutboundActivity,
  getHapilyRegistrants,
  getNewMeetings,
} = require('./hubspot');

const { inferSource } = require('./inference');
const { scheduleJob, markResponded } = require('./scheduler');
const {
  buildAttributionBlocks,
  sendAttributionDM,
  updateAttributionMessage,
  registerActionHandlers,
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

// ─── Core meeting processor ───────────────────────────────────────────────────
/**
 * Fetch, infer, and dispatch a Slack DM for a single meeting.
 * Called both by the webhook handler and the built-in poller.
 */
async function processMeeting(meetingId) {
  // 1. Fetch meeting
  const meeting = await getMeeting(meetingId);
  const meetingTitle = meeting.hs_meeting_title || '(untitled)';
  const meetingStartMs = parseInt(meeting.hs_meeting_start_time || '0', 10);
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

  // hs_createdate = when HubSpot created the meeting object (Unix ms string)
  const meetingCreatedMs = parseInt(meeting.hs_createdate || String(Date.now()), 10);

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

  // 7. Schedule 1-hour fallback
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
