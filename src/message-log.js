/**
 * Message activity log — in-memory tracker for App Home visibility
 * ─────────────────────────────────────────────────────────────────
 * Tracks every DM sent, rep response, and auto-fallback so the
 * Slack App Home tab can display a dashboard. Entries auto-prune
 * after 7 days.
 *
 * NOTE: This is in-memory only — data is lost on process restart.
 */

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Sorted newest-first (unshift on insert, pop on prune)
const _log = [];

/**
 * Log that a DM was sent to a rep.
 *
 * @param {object} opts
 * @param {string}      opts.meetingId
 * @param {string}      opts.repEmail
 * @param {string|null} opts.repSlackId
 * @param {string}      opts.meetingTitle
 * @param {string}      opts.inferredSource
 * @param {'attribution'|'outcome'} opts.messageType
 */
function logSent({ meetingId, repEmail, repSlackId, meetingTitle, inferredSource, messageType }) {
  _prune();
  _log.unshift({
    meetingId,
    repEmail: repEmail || '',
    repSlackId: repSlackId || null,
    meetingTitle: meetingTitle || '(untitled)',
    inferredSource: inferredSource || '',
    messageType: messageType || 'attribution',
    sentAt: Date.now(),
    status: 'pending',
    respondedAt: null,
    chosenValue: null,
  });
}

/**
 * Mark a message as responded by the rep.
 *
 * @param {object} opts
 * @param {string} opts.meetingId
 * @param {'attribution'|'outcome'} opts.messageType
 * @param {string} opts.chosenValue
 */
function logResponded({ meetingId, messageType, chosenValue }) {
  const entry = _log.find(
    (e) => e.meetingId === meetingId && e.messageType === (messageType || 'attribution') && e.status === 'pending'
  );
  if (entry) {
    entry.status = 'responded';
    entry.respondedAt = Date.now();
    entry.chosenValue = chosenValue;
  }
}

/**
 * Mark a message as auto-set by the fallback timer.
 *
 * @param {object} opts
 * @param {string} opts.meetingId
 * @param {'attribution'|'outcome'} opts.messageType
 * @param {string} opts.chosenValue
 */
function logAutoSet({ meetingId, messageType, chosenValue }) {
  const entry = _log.find(
    (e) => e.meetingId === meetingId && e.messageType === (messageType || 'attribution') && e.status === 'pending'
  );
  if (entry) {
    entry.status = 'auto-set';
    entry.respondedAt = Date.now();
    entry.chosenValue = chosenValue;
  }
}

/** Return all entries (newest first), pruned to 7 days. */
function getAll() {
  _prune();
  return [..._log];
}

/** Return only pending entries. */
function getPending() {
  return getAll().filter((e) => e.status === 'pending');
}

/** Return only responded entries. */
function getResponded() {
  return getAll().filter((e) => e.status === 'responded');
}

/** Return only auto-set entries. */
function getAutoSet() {
  return getAll().filter((e) => e.status === 'auto-set');
}

/** Remove entries older than 7 days from the tail. */
function _prune() {
  const cutoff = Date.now() - MAX_AGE_MS;
  while (_log.length > 0 && _log[_log.length - 1].sentAt < cutoff) {
    _log.pop();
  }
}

module.exports = { logSent, logResponded, logAutoSet, getAll, getPending, getResponded, getAutoSet };
