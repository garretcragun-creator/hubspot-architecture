/**
 * Gong API helpers
 * ─────────────────
 * getCallsInWindow(meetingStartMs, meetingEndMs, participantEmails?)
 *   — returns Gong call records that overlap the meeting window (±60 min buffer).
 *   — if participantEmails is provided, filters to calls where at least one
 *     participant email matches (via /v2/calls/extensive party data).
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

// ─── Low-level POST ───────────────────────────────────────────────────────────
/**
 * POST /v2/<path> with a JSON body, returns parsed JSON.
 * Throws on non-2xx.
 */
function gongPost(path, body) {
  const payload = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const options = {
      hostname: GONG_HOST,
      path,
      method: 'POST',
      headers: {
        Authorization: basicAuthHeader(),
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(
            new Error(`[gong] POST ${path} → HTTP ${res.statusCode}: ${raw.slice(0, 300)}`)
          );
        }
        try {
          resolve(JSON.parse(raw));
        } catch {
          reject(new Error(`[gong] JSON parse error for POST ${path}: ${raw.slice(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────
/**
 * Fetch all Gong calls that fall within
 *   [meetingStartMs - BUFFER, meetingEndMs + BUFFER]
 *
 * If participantEmails is provided, a second request to /v2/calls/extensive
 * fetches party (participant) data and filters to calls where at least one
 * email matches. This prevents false positives from unrelated calls in the
 * same time window. Falls back to returning all calls if the extensive fetch
 * fails or if no calls match (prevents false no-show inferences).
 *
 * Gong paginates results via a cursor; this function follows all pages.
 *
 * @param {number}   meetingStartMs     - Unix ms of scheduled meeting start
 * @param {number}   meetingEndMs       - Unix ms of scheduled meeting end
 * @param {string[]} participantEmails  - emails to filter by (owner + contacts)
 * @returns {Promise<Array>}              array of Gong call objects
 */
async function getCallsInWindow(meetingStartMs, meetingEndMs, participantEmails = []) {
  const from = new Date(meetingStartMs - WINDOW_BUFFER_MS).toISOString();
  const to   = new Date((meetingEndMs || meetingStartMs) + WINDOW_BUFFER_MS).toISOString();

  const emailSet = new Set(participantEmails.map((e) => e.toLowerCase()));
  const hasEmailFilter = emailSet.size > 0;

  console.log(
    `[gong] fetching calls from ${from} to ${to}` +
    (hasEmailFilter ? ` (will filter by ${emailSet.size} participant email(s))` : '')
  );

  // ── Step 1: basic call list in time window ─────────────────────────────────
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

  // ── Step 2: if no email filter (or no calls to filter), return as-is ───────
  if (!hasEmailFilter || allCalls.length === 0) return allCalls;

  // ── Step 3: fetch extensive data for party/participant emails ──────────────
  // /v2/calls/extensive returns metaData (same basic fields) + parties array
  const callIds = allCalls.map((c) => c.id).filter(Boolean);
  let extensiveCalls = [];
  try {
    const extData = await gongPost('/v2/calls/extensive', {
      filter: { callIds },
      contentSelector: {
        context: 'Extended',
        exposedFields: { parties: true },
      },
    });
    extensiveCalls = extData.calls || [];
  } catch (err) {
    console.warn(
      `[gong] /v2/calls/extensive failed: ${err.message} — returning unfiltered calls`
    );
    return allCalls; // graceful fallback
  }

  // ── Step 4: keep only calls where a participant email matches ──────────────
  const matchingIds = new Set(
    extensiveCalls
      .filter((ec) => {
        const parties = ec.parties || [];
        return parties.some(
          (p) => p.emailAddress && emailSet.has(p.emailAddress.toLowerCase())
        );
      })
      .map((ec) => ec.metaData?.id || ec.id)
  );

  if (matchingIds.size === 0) {
    // Gong may not have email data for all participants — don't incorrectly
    // infer a no-show just because email metadata is missing.
    console.warn(
      '[gong] no calls matched participant email filter — returning unfiltered (Gong may lack email data)'
    );
    return allCalls;
  }

  const filtered = allCalls.filter((c) => matchingIds.has(c.id));
  console.log(`[gong] ${filtered.length}/${allCalls.length} call(s) matched participant email filter`);
  return filtered;
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
