/**
 * Slack messaging — Block Kit builder + action handlers
 * ──────────────────────────────────────────────────────
 * Exports:
 *   buildAttributionBlocks(opts)  — returns Slack Block Kit blocks array
 *   sendAttributionDM(app, opts)  — sends the DM to the rep; returns { ok, ts, channel }
 *   updateAttributionMessage(app, opts) — edits the message after rep action or fallback
 *   registerActionHandlers(app, { onAction })
 *                                 — wires bolt action IDs to a shared handler
 */

const { CANONICAL_SOURCES } = require('./inference');

// ─── Block IDs / Action IDs ──────────────────────────────────────────────────
const ACTION_CONFIRM_YES = 'meeting_source_confirm_yes';
const ACTION_SELECT_OTHER = 'meeting_source_select_other';

/**
 * Encode metadata into a block_id / value string.
 * Format: "meeting_{meetingId}|{companyId}|{inferredSource}"
 * companyId may be empty string if unknown.
 */
function encodeMeta(meetingId, companyId, inferredSource) {
  return `${meetingId}|${companyId || ''}|${inferredSource}`;
}

function decodeMeta(raw) {
  const [meetingId, companyId, ...rest] = raw.split('|');
  // inferredSource may itself contain no pipes, but join just in case
  const inferredSource = rest.join('|');
  return { meetingId, companyId: companyId || null, inferredSource };
}

// ─── Block Kit builder ───────────────────────────────────────────────────────
/**
 * Build Block Kit blocks for the attribution DM.
 *
 * @param {object} opts
 * @param {string}      opts.meetingId
 * @param {string|null} opts.companyId
 * @param {string}      opts.inferredSource   - canonical source string
 * @param {string}      opts.meetingTitle     - hs_meeting_title
 * @param {string}      opts.meetingTime      - formatted start time string
 * @param {string}      opts.reason           - one-line inference reason (for tooltip / mrkdwn)
 * @param {number}      opts.confidence       - 0–100
 */
function buildAttributionBlocks({
  meetingId,
  companyId,
  inferredSource,
  meetingTitle,
  meetingTime,
  reason,
  confidence,
}) {
  const meta = encodeMeta(meetingId, companyId, inferredSource);

  // Source dropdown options — all 24 canonical values
  const options = CANONICAL_SOURCES.map((src) => ({
    text: { type: 'plain_text', text: src, emoji: false },
    value: src,
  }));

  const confLabel =
    confidence >= 70 ? 'high' : confidence >= 50 ? 'medium' : 'low';

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:tada: *Congrats on setting a disco call!*\n*Meeting:* ${meetingTitle || '(untitled)'}\n*When:* ${meetingTime || '(unknown)'}`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `It looks like this likely came from *${inferredSource}* (${confLabel} confidence).\nIs that accurate?`,
      },
    },
    {
      type: 'actions',
      block_id: `meeting_${meta}`,
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: 'Yes, that\'s right', emoji: false },
          style: 'primary',
          action_id: ACTION_CONFIRM_YES,
          value: meta,
        },
        {
          type: 'static_select',
          placeholder: { type: 'plain_text', text: 'Something else…', emoji: false },
          action_id: ACTION_SELECT_OTHER,
          options,
        },
      ],
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `_Inference: ${reason}_`,
        },
      ],
    },
  ];
}

/**
 * Build "confirmed" blocks shown after rep (or fallback) has set the source.
 */
function buildConfirmedBlocks({ meetingTitle, source, setBy }) {
  const who = setBy === 'auto' ? 'Auto-set (no response in 1 h)' : 'Set by you';
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:white_check_mark: *Attribution recorded for "${meetingTitle || 'disco call'}"*\n*Source:* ${source}\n_${who}_`,
      },
    },
  ];
}

// ─── DM sender ───────────────────────────────────────────────────────────────
/**
 * Send the attribution DM to the rep via their Slack email.
 *
 * @param {object} app           - @slack/bolt App instance
 * @param {object} opts
 * @param {string}   opts.ownerEmail
 * @param {object[]} opts.blocks  - from buildAttributionBlocks()
 * @returns {{ ok: boolean, ts: string, channel: string }}
 */
async function sendAttributionDM(app, { ownerEmail, blocks }) {
  // 1. Resolve email → Slack user ID
  let userId;
  try {
    const res = await app.client.users.lookupByEmail({ email: ownerEmail });
    userId = res.user?.id;
  } catch (err) {
    throw new Error(`Cannot look up Slack user for email "${ownerEmail}": ${err.message}`);
  }
  if (!userId) throw new Error(`No Slack user found for email "${ownerEmail}"`);

  // 2. Open DM channel
  const openRes = await app.client.conversations.open({ users: userId });
  const channel = openRes.channel?.id;
  if (!channel) throw new Error(`Could not open DM channel with ${userId}`);

  // 3. Post message
  const postRes = await app.client.chat.postMessage({
    channel,
    text: `Attribution check for your disco call`,
    blocks,
  });

  return { ok: postRes.ok, ts: postRes.ts, channel };
}

// ─── Message updater ─────────────────────────────────────────────────────────
/**
 * Replace the attribution message with the "confirmed" state.
 *
 * @param {object} app
 * @param {object} opts
 * @param {string}   opts.channel
 * @param {string}   opts.ts
 * @param {string}   opts.meetingTitle
 * @param {string}   opts.source         - the final chosen/inferred source
 * @param {'rep'|'auto'} opts.setBy
 */
async function updateAttributionMessage(app, { channel, ts, meetingTitle, source, setBy }) {
  await app.client.chat.update({
    channel,
    ts,
    text: `Attribution recorded: ${source}`,
    blocks: buildConfirmedBlocks({ meetingTitle, source, setBy }),
  });
}

// ─── Action handler registration ─────────────────────────────────────────────
/**
 * Register Bolt action handlers.
 *
 * @param {object} app
 * @param {object} opts
 * @param {Function} opts.onAction  - async ({ meetingId, companyId, chosenSource, ack, respond, body }) => void
 *                                    Called for both "Yes" and "Something else" actions.
 *                                    Caller is responsible for ack(), HubSpot patch, scheduler.markResponded().
 */
function registerActionHandlers(app, { onAction }) {
  // "Yes, that's right" button
  app.action(ACTION_CONFIRM_YES, async ({ ack, body, payload }) => {
    await ack();
    const { meetingId, companyId, inferredSource } = decodeMeta(payload.value);
    await onAction({ meetingId, companyId, chosenSource: inferredSource, body });
  });

  // "Something else…" dropdown
  app.action(ACTION_SELECT_OTHER, async ({ ack, body, payload }) => {
    await ack();
    // payload.selected_option.value for static_select
    const chosenSource = payload.selected_option?.value;
    if (!chosenSource) {
      console.warn('[slack] SELECT_OTHER fired with no selected_option');
      return;
    }
    // block_id = "meeting_{meta}" — strip prefix
    const rawBlockId = body.actions?.[0]?.block_id || '';
    const metaPart = rawBlockId.startsWith('meeting_')
      ? rawBlockId.slice('meeting_'.length)
      : rawBlockId;
    const { meetingId, companyId } = decodeMeta(metaPart);
    await onAction({ meetingId, companyId, chosenSource, body });
  });
}

module.exports = {
  buildAttributionBlocks,
  buildConfirmedBlocks,
  sendAttributionDM,
  updateAttributionMessage,
  registerActionHandlers,
  ACTION_CONFIRM_YES,
  ACTION_SELECT_OTHER,
};
