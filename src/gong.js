/**
 * Gong API helpers
 * ─────────────────
 * getCallsInWindow(meetingStartMs, meetingEndMs)
 *   — returns Gong call records that overlap the meeting window (±60 min buffer).
 *
 * inferMeetingHeld(calls)
 *   — returns { held: boolean, confidence: number (0–100), reason: string }
 *
 * Auth: Basic auth with GONG_ACCESS_KEY : GONG_ACCESS_SECRET
 * Docs: https://us-66463.api.gong.io/v2/calls
 */

const https = require('https');

const GONG_HOST = 'api.gong.io';

// Expand the search window by this much on each side so we catch calls that
// start a little early or end a little late relative to the scheduled slot.
const WINDOW_BUFFER_MS = 60 * 60 * 1000; // ±60 minutes

// Calls shorter than this are treated as a ring/connection-check, not a real meeting.
const MIN_CALL_DURATION_S = 60; // 1 minute

// ─── Auth ────────────────────────────────────────────────────────────────────
function basicAuthHeader() {
  const key    = process.env.GONG_ACCESS_KEY;
  const secret = process.env.GONG_ACCESS_SECRET;
  if (!key || !secret) {
    throw new Error('[gong] GONG_ACCESS_KEY and GONG_ACCESS_SECRET are required');
  }
  return 'Basic ' + Buffer.from(`${key}:${secret}`).toString('base64');
}

// ─── Low-level GET ────────────────────────────────────────────────────────────
/**
 * GET /v2/<path> with query params, returns parsed JSON.
 * Throws on non-2xx.
 */
function gongGet(path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const fullPath = qs ? `${path}?${qs}` : path;

  return new Promise((resolve, reject) => {
    const options = {
      hostname: GONG_HOST,
      path: fullPath,
      method: 'GET',
      headers: {
        Authorization: basicAuthHeader(),
        Accept: 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(
            new Error(`[gong] GET ${path} → HTTP ${res.statusCode}: ${raw.slice(0, 300)}`)
          );
        }
        try {
          resolve(JSON.parse(raw));
        } catch {
          reject(new Error(`[gong] JSON parse error for GET ${path}: ${raw.slice(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────
/**
 * Fetch all Gong calls that fall within
 *   [meetingStartMs - BUFFER, meetingEndMs + BUFFER]
 *
 * Gong paginates results via a cursor; this function follows all pages.
 *
 * @param {number} meetingStartMs - Unix ms of scheduled meeting start
 * @param {number} meetingEndMs   - Unix ms of scheduled meeting end
 * @returns {Promise<Array>}        array of Gong call objects
 */
async function getCallsInWindow(meetingStartMs, meetingEndMs) {
  const from = new Date(meetingStartMs - WINDOW_BUFFER_MS).toISOString();
  const to   = new Date((meetingEndMs || meetingStartMs) + WINDOW_BUFFER_MS).toISOString();

  console.log(`[gong] fetching calls from ${from} to ${to}`);

  let allCalls = [];
  let cursor;

  do {
    const params = { fromDateTime: from, toDateTime: to };
    if (cursor) params.cursor = cursor;

    const data = await gongGet('/v2/calls', params);
    const calls = data.calls || [];
    allCalls = allCalls.concat(calls);
    cursor = data.records?.cursor || null;
  } while (cursor);

  console.log(`[gong] retrieved ${allCalls.length} call(s) in window`);
  return allCalls;
}

/**
 * Infer whether the discovery meeting was actually held based on Gong call data.
 *
 * Rules (in priority order):
 *  1. No calls found → no-show (low confidence)
 *  2. At least one call ≥ MIN_CALL_DURATION_S → held (high confidence)
 *  3. Calls exist but all very short → likely no-show (medium confidence)
 *
 * @param {Array} calls - from getCallsInWindow()
 * @returns {{ held: boolean, confidence: number, reason: string }}
 */
function inferMeetingHeld(calls) {
  if (!calls || calls.length === 0) {
    return {
      held: false,
      confidence: 55,
      reason: 'No Gong call found in the meeting window',
    };
  }

  // Find calls that lasted long enough to be a real conversation
  const substantial = calls.filter((c) => (c.duration || 0) >= MIN_CALL_DURATION_S);

  if (substantial.length > 0) {
    const longest = substantial.reduce(
      (best, c) => (c.duration > best.duration ? c : best),
      substantial[0]
    );
    const minutes = Math.round(longest.duration / 60);
    return {
      held: true,
      confidence: 85,
      reason: `Gong call found (${minutes} min)`,
    };
  }

  // Calls exist but all very short — likely a ring or failed connection
  const shortestDur = Math.round(calls[0]?.duration || 0);
  return {
    held: false,
    confidence: 65,
    reason: `Gong call found but very short (${shortestDur}s) — likely no-show`,
  };
}

module.exports = { getCallsInWindow, inferMeetingHeld };
