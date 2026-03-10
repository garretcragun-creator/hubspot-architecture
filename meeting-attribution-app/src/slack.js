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
// Attribution flow (source)
const ACTION_CONFIRM_YES = 'meeting_source_confirm_yes';
const ACTION_SELECT_OTHER = 'meeting_source_select_other';

// Post-meeting outcome flow
const ACTION_OUTCOME_YES    = 'post_meeting_held_yes';
const ACTION_OUTCOME_SELECT = 'post_meeting_outcome_select';

// HubSpot enumeration values for hs_meeting_outcome
const OUTCOME_OPTIONS = [
  { label: 'Held',        value: 'COMPLETED'    },
  { label: 'No Show',     value: 'NO_SHOW'      },
  { label: 'Rescheduled', value: 'RESCHEDULED'  },
  { label: 'Cancelled',   value: 'CANCELLED'    },
];

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

// ─── Post-meeting Block Kit builders ─────────────────────────────────────────
/**
 * Encode post-meeting metadata into a value string.
 * Format: "pm_{meetingId}|{inferredOutcome}"
 */
function encodePmMeta(meetingId, inferredOutcome) {
  return `pm_${meetingId}|${inferredOutcome}`;
}

function decodePmMeta(raw) {
  // Strip "pm_" prefix if present
  const stripped = raw.startsWith('pm_') ? raw.slice(3) : raw;
  const [meetingId, ...rest] = stripped.split('|');
  const inferredOutcome = rest.join('|');
  return { meetingId, inferredOutcome };
}

/**
 * Build Block Kit blocks for the post-meeting outcome DM.
 *
 * @param {object} opts
 * @param {string}  opts.meetingId
 * @param {string}  opts.meetingTitle
 * @param {boolean} opts.held           - Gong inference: true = held, false = no-show
 * @param {string}  opts.inferredOutcome - COMPLETED | NO_SHOW | RESCHEDULED | CANCELLED
 * @param {number}  opts.confidence     - 0–100
 * @param {string}  opts.reason         - one-line Gong inference reason
 */
function buildPostMeetingBlocks({
  meetingId,
  meetingTitle,
  held,
  inferredOutcome,
  confidence,
  reason,
}) {
  const meta = encodePmMeta(meetingId, inferredOutcome);
  const confLabel = confidence >= 70 ? 'high' : confidence >= 50 ? 'medium' : 'low';
  const heldText = held ? 'held' : 'did not hold';

  const options = OUTCOME_OPTIONS.map((o) => ({
    text: { type: 'plain_text', text: o.label, emoji: false },
    value: o.value,
  }));

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:stopwatch: *Your discovery meeting just ended!*\n*Meeting:* ${meetingTitle || '(untitled)'}`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `Based on Gong data, it looks like it likely *${heldText}* (${confLabel} confidence).\nIs that right?`,
      },
    },
    {
      type: 'actions',
      block_id: `pm_${meta}`,
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: 'Yes, that\'s right', emoji: false },
          style: 'primary',
          action_id: ACTION_OUTCOME_YES,
          value: meta,
        },
        {
          type: 'static_select',
          placeholder: { type: 'plain_text', text: 'Something else…', emoji: false },
          action_id: ACTION_OUTCOME_SELECT,
          options,
        },
      ],
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `_Gong inference: ${reason}_`,
        },
      ],
    },
  ];
}

/**
 * Build "confirmed outcome" blocks shown after rep (or fallback) has set the outcome.
 */
function buildPostMeetingConfirmedBlocks({ meetingTitle, outcome, setBy }) {
  const label = OUTCOME_OPTIONS.find((o) => o.value === outcome)?.label || outcome;
  const who = setBy === 'auto' ? 'Auto-set (no response in 1 h)' : 'Set by you';
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:white_check_mark: *Meeting outcome recorded for "${meetingTitle || 'disco call'}"*\n*Outcome:* ${label}\n_${who}_`,
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

  return { ok: postRes.ok, ts: postRes.ts, channel, userId };
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
 * Register Bolt action handlers for the attribution (source) flow.
 *
 * @param {object} app
 * @param {object} opts
 * @param {Function} opts.onAction  - async ({ meetingId, companyId, chosenSource, body }) => void
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

/**
 * Register Bolt action handlers for the post-meeting outcome flow.
 *
 * @param {object} app
 * @param {object} opts
 * @param {Function} opts.onOutcome  - async ({ meetingId, chosenOutcome, body }) => void
 */
function registerPostMeetingActionHandlers(app, { onOutcome }) {
  // "Yes, that's right" button — confirm inferred outcome
  app.action(ACTION_OUTCOME_YES, async ({ ack, body, payload }) => {
    await ack();
    const { meetingId, inferredOutcome } = decodePmMeta(payload.value);
    await onOutcome({ meetingId, chosenOutcome: inferredOutcome, body });
  });

  // "Something else…" dropdown — rep picks a different outcome
  app.action(ACTION_OUTCOME_SELECT, async ({ ack, body, payload }) => {
    await ack();
    const chosenOutcome = payload.selected_option?.value;
    if (!chosenOutcome) {
      console.warn('[slack] OUTCOME_SELECT fired with no selected_option');
      return;
    }
    // block_id = "pm_{meta}" — strip prefix
    const rawBlockId = body.actions?.[0]?.block_id || '';
    const metaPart = rawBlockId.startsWith('pm_')
      ? rawBlockId.slice('pm_'.length)
      : rawBlockId;
    const { meetingId } = decodePmMeta(metaPart);
    await onOutcome({ meetingId, chosenOutcome, body });
  });
}

// ─── App Home tab ───────────────────────────────────────────────────────────

/**
 * Human-readable relative time string.
 * @param {number} ms - timestamp to compare against now
 * @returns {string}
 */
function _relativeTime(ms) {
  if (!ms) return '';
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/**
 * Build a single entry block for the App Home.
 * @param {object} entry - log entry
 * @param {boolean} isAdmin - whether to show rep mention
 * @returns {object} Block Kit section block
 */
function _buildEntryBlock(entry, isAdmin) {
  const typeLabel = entry.messageType === 'outcome' ? 'Outcome' : 'Source';
  const repDisplay = isAdmin
    ? (entry.repSlackId ? `<@${entry.repSlackId}>` : entry.repEmail)
    : null;

  if (entry.status === 'pending') {
    const ago = _relativeTime(entry.sentAt);
    const repLine = repDisplay ? ` to ${repDisplay}` : '';
    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${entry.meetingTitle}*\n${typeLabel} check sent${repLine} ${ago}\nInferred: _${entry.inferredSource}_`,
      },
    };
  }

  if (entry.status === 'responded') {
    const ago = _relativeTime(entry.respondedAt);
    const repLine = repDisplay ? ` by ${repDisplay}` : '';
    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${entry.meetingTitle}*\n${typeLabel} confirmed${repLine} ${ago}\nChosen: *${entry.chosenValue}*  (inferred: _${entry.inferredSource}_)`,
      },
    };
  }

  // auto-set
  const ago = _relativeTime(entry.respondedAt);
  const repLine = repDisplay ? ` for ${repDisplay}` : '';
  return {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*${entry.meetingTitle}*\n${typeLabel} auto-applied${repLine} ${ago}\nAuto-set: *${entry.chosenValue}*`,
    },
  };
}

/**
 * Build Block Kit blocks for the App Home tab.
 *
 * @param {object[]} entries - from messageLog.getAll() (already filtered for role)
 * @param {object} opts
 * @param {boolean} opts.isAdmin - true → full dashboard, false → personal view
 * @returns {object[]} Block Kit blocks array
 */
function buildAppHomeBlocks(entries, { isAdmin }) {
  const pending   = entries.filter((e) => e.status === 'pending');
  const responded = entries.filter((e) => e.status === 'responded');
  const autoSet   = entries.filter((e) => e.status === 'auto-set');

  const blocks = [];
  const MAX_PER_SECTION = 20;

  // ── Header ──
  blocks.push({
    type: 'header',
    text: {
      type: 'plain_text',
      text: isAdmin ? 'Meeting Attribution Dashboard' : 'Your Attribution Messages',
      emoji: false,
    },
  });
  blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*Last 7 days:*  ${pending.length} awaiting  |  ${responded.length} responded  |  ${autoSet.length} auto-set`,
    },
  });
  blocks.push({ type: 'divider' });

  // ── Awaiting Response ──
  blocks.push({
    type: 'header',
    text: { type: 'plain_text', text: 'Awaiting Response', emoji: false },
  });

  if (pending.length === 0) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: '_No messages awaiting response._' },
    });
  } else {
    for (const entry of pending.slice(0, MAX_PER_SECTION)) {
      blocks.push(_buildEntryBlock(entry, isAdmin));
    }
    if (pending.length > MAX_PER_SECTION) {
      blocks.push({
        type: 'context',
        elements: [{ type: 'mrkdwn', text: `_...and ${pending.length - MAX_PER_SECTION} more_` }],
      });
    }
  }
  blocks.push({ type: 'divider' });

  // ── Responded ──
  blocks.push({
    type: 'header',
    text: { type: 'plain_text', text: 'Responded', emoji: false },
  });

  if (responded.length === 0) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: '_No responses yet._' },
    });
  } else {
    for (const entry of responded.slice(0, MAX_PER_SECTION)) {
      blocks.push(_buildEntryBlock(entry, isAdmin));
    }
    if (responded.length > MAX_PER_SECTION) {
      blocks.push({
        type: 'context',
        elements: [{ type: 'mrkdwn', text: `_...and ${responded.length - MAX_PER_SECTION} more_` }],
      });
    }
  }
  blocks.push({ type: 'divider' });

  // ── Auto-Set ──
  blocks.push({
    type: 'header',
    text: { type: 'plain_text', text: 'Auto-Set (No Response)', emoji: false },
  });

  if (autoSet.length === 0) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: '_No auto-set messages._' },
    });
  } else {
    for (const entry of autoSet.slice(0, MAX_PER_SECTION)) {
      blocks.push(_buildEntryBlock(entry, isAdmin));
    }
    if (autoSet.length > MAX_PER_SECTION) {
      blocks.push({
        type: 'context',
        elements: [{ type: 'mrkdwn', text: `_...and ${autoSet.length - MAX_PER_SECTION} more_` }],
      });
    }
  }

  // ── Footer ──
  blocks.push({ type: 'divider' });
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `_Last refreshed: <!date^${Math.floor(Date.now() / 1000)}^{date_short_pretty} at {time}|${new Date().toISOString()}>_`,
      },
    ],
  });

  return blocks;
}

/**
 * Register the app_home_opened event handler.
 *
 * @param {object} app - Bolt App instance
 * @param {object} opts
 * @param {Function}    opts.getEntries       - () => Array of all log entries
 * @param {Function}    opts.getAdminSlackId  - () => string|null  (resolved lazily at event time)
 */
function registerAppHome(app, { getEntries, getAdminSlackId }) {
  app.event('app_home_opened', async ({ event, client }) => {
    if (event.tab !== 'home') return;

    try {
      const adminSlackId = typeof getAdminSlackId === 'function' ? getAdminSlackId() : null;
      const isAdmin = !!(adminSlackId && event.user === adminSlackId);
      const allEntries = getEntries();
      const entries = isAdmin
        ? allEntries
        : allEntries.filter((e) => e.repSlackId === event.user);

      const blocks = buildAppHomeBlocks(entries, { isAdmin });

      await client.views.publish({
        user_id: event.user,
        view: { type: 'home', blocks },
      });
    } catch (err) {
      console.error(`[slack] app_home_opened error: ${err.message}`);
    }
  });
}

module.exports = {
  // Attribution (source) flow
  buildAttributionBlocks,
  buildConfirmedBlocks,
  sendAttributionDM,
  updateAttributionMessage,
  registerActionHandlers,
  ACTION_CONFIRM_YES,
  ACTION_SELECT_OTHER,

  // Post-meeting outcome flow
  buildPostMeetingBlocks,
  buildPostMeetingConfirmedBlocks,
  registerPostMeetingActionHandlers,
  ACTION_OUTCOME_YES,
  ACTION_OUTCOME_SELECT,
  OUTCOME_OPTIONS,

  // App Home
  buildAppHomeBlocks,
  registerAppHome,
};
