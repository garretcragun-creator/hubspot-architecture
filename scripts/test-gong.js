/**
 * scripts/test-gong.js
 * ─────────────────────
 * Quick smoke test for Gong credentials + inference logic.
 * Run from the meeting-attribution-app directory:
 *
 *   GONG_ACCESS_KEY=xxx GONG_ACCESS_SECRET=yyy HUBSPOT_ACCESS_TOKEN=yyy \
 *     node scripts/test-gong.js <meetingId>
 *
 * If a HubSpot meetingId is supplied the script fetches real start/end times
 * AND participant emails from HubSpot, then queries Gong with the email filter.
 * Without a meetingId it queries the last 4 hours as a connectivity check
 * (no email filter applied).
 */

require('dotenv').config();

const { getCallsInWindow, inferMeetingHeld } = require('../src/gong');

// Pull real meeting times from HubSpot
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

// Pull participant emails (owner + associated contacts) from HubSpot
async function getParticipantEmails(meetingId) {
  const { getMeetingContactEmails, getMeetingAssociations, getOwnerById, getMeeting } =
    require('../src/hubspot');

  // Contact emails via the new helper
  const contactEmails = await getMeetingContactEmails(meetingId);

  // Owner email
  let ownerEmail = null;
  try {
    const props = await getMeeting(meetingId);
    if (props.hubspot_owner_id) {
      const owner = await getOwnerById(props.hubspot_owner_id);
      ownerEmail = owner?.email || null;
    }
  } catch (err) {
    console.warn(`  Could not fetch owner email: ${err.message}`);
  }

  const all = [...new Set([ownerEmail, ...contactEmails].filter(Boolean))];
  return all;
}

(async () => {
  const meetingId = process.argv[2] || null;

  let startMs, endMs, label, participantEmails = [];

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

    console.log('\nFetching participant emails…');
    try {
      participantEmails = await getParticipantEmails(meetingId);
      console.log(`  Emails (${participantEmails.length}): ${participantEmails.join(', ') || '(none)'}`);
    } catch (err) {
      console.warn(`  Could not fetch participant emails: ${err.message} — will query without filter`);
    }
  } else {
    // Fallback: query the last 4 hours as a connectivity check
    endMs   = Date.now();
    startMs = endMs - 4 * 60 * 60 * 1000;
    label   = 'last 4 hours (connectivity check)';
    console.log(`\nNo meetingId supplied — querying Gong for ${label} (no email filter)`);
  }

  if (!startMs) {
    console.error('No start time available — cannot query Gong.');
    process.exit(1);
  }

  console.log('\nQuerying Gong…');
  let calls;
  try {
    calls = await getCallsInWindow(startMs, endMs || startMs, participantEmails);
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
