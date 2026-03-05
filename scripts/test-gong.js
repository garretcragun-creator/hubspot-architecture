/**
 * scripts/test-gong.js
 * ─────────────────────
 * Quick smoke test for Gong credentials + inference logic.
 * Run from the meeting-attribution-app directory:
 *
 *   GONG_ACCESS_KEY=xxx GONG_ACCESS_SECRET=yyy node scripts/test-gong.js [meetingId]
 *
 * If a HubSpot meetingId is supplied the script fetches real start/end times
 * from HubSpot and queries the matching Gong window. Otherwise it queries
 * the last 4 hours as a connectivity check.
 */

require('dotenv').config();

const { getCallsInWindow, inferMeetingHeld } = require('../src/gong');

// Optional: pull real meeting times from HubSpot
async function getMeetingTimes(meetingId) {
  const { getMeeting } = require('../src/hubspot');
  const props = await getMeeting(meetingId);
  const startMs = props.hs_meeting_start_time
    ? new Date(props.hs_meeting_start_time).getTime() : null;
  const endMs = props.hs_meeting_end_time
    ? new Date(props.hs_meeting_end_time).getTime() : null;
  const title = props.hs_meeting_title || '(untitled)';
  return { startMs, endMs, title };
}

(async () => {
  const meetingId = process.argv[2] || null;

  let startMs, endMs, label;

  if (meetingId) {
    console.log(`\nFetching HubSpot meeting ${meetingId}…`);
    try {
      const { startMs: s, endMs: e, title } = await getMeetingTimes(meetingId);
      startMs = s;
      endMs   = e;
      label   = `"${title}"`;
      console.log(`  Title : ${title}`);
      console.log(`  Start : ${startMs ? new Date(startMs).toISOString() : '(none)'}`);
      console.log(`  End   : ${endMs   ? new Date(endMs).toISOString()   : '(none)'}`);
    } catch (err) {
      console.error(`  HubSpot fetch failed: ${err.message}`);
      process.exit(1);
    }
  } else {
    // Fallback: query the last 4 hours as a connectivity check
    endMs   = Date.now();
    startMs = endMs - 4 * 60 * 60 * 1000;
    label   = 'last 4 hours (connectivity check)';
    console.log(`\nNo meetingId supplied — querying Gong for ${label}`);
  }

  if (!startMs) {
    console.error('No start time available — cannot query Gong.');
    process.exit(1);
  }

  console.log('\nQuerying Gong…');
  let calls;
  try {
    calls = await getCallsInWindow(startMs, endMs || startMs);
  } catch (err) {
    console.error(`Gong API error: ${err.message}`);
    process.exit(1);
  }

  console.log(`\nGong returned ${calls.length} call(s) for ${label}`);
  calls.forEach((c, i) => {
    console.log(`  [${i + 1}] id=${c.id}  duration=${c.duration}s  started=${c.started}`);
  });

  const inference = inferMeetingHeld(calls);
  console.log('\nInference result:');
  console.log(`  held       : ${inference.held}`);
  console.log(`  confidence : ${inference.confidence}%`);
  console.log(`  reason     : ${inference.reason}`);
  console.log(`  → hs_meeting_outcome would be set to: ${inference.held ? 'COMPLETED' : 'NO_SHOW'}`);
  console.log('');
})();
