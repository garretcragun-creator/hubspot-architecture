/**
 * 1-hour fallback scheduler
 * ─────────────────────────
 * When a meeting webhook fires, scheduleJob() queues a job for +1 hour.
 * If the rep responds (Yes or dropdown) before the timer fires, markResponded()
 * cancels the timer. Otherwise runFallback() applies the inferred source to
 * HubSpot automatically.
 */

const { patchMeeting, patchCompany } = require('./hubspot');
const { toHubSpotSource } = require('./inference');

// Map of meetingId → { timer, meetingId, companyId, inferredSource, fallbackFn }
const _jobs = new Map();

const DELAY_MS = 60 * 60 * 1000; // 1 hour

/**
 * Schedule a 1-hour fallback for the given meeting.
 *
 * @param {object} opts
 * @param {string}   opts.meetingId       - HubSpot meeting ID
 * @param {string|null} opts.companyId    - HubSpot company ID (may be null)
 * @param {string}   opts.inferredSource  - canonical source from inference engine
 * @param {Function} opts.onFallback      - async fn called when fallback fires:
 *                                          receives { meetingId, companyId, inferredSource }
 *                                          Use this hook to send the Slack update.
 */
function scheduleJob({ meetingId, companyId, inferredSource, onFallback }) {
  // Cancel any existing job for this meeting before setting a new one
  cancelJob(meetingId);

  const timer = setTimeout(async () => {
    _jobs.delete(meetingId);
    await runFallback({ meetingId, companyId, inferredSource, onFallback });
  }, DELAY_MS);

  // Unref so the timer doesn't keep the process alive if everything else exits
  if (timer.unref) timer.unref();

  _jobs.set(meetingId, { timer, meetingId, companyId, inferredSource, onFallback });
  console.log(`[scheduler] job scheduled for meeting ${meetingId} (fires in 1 h)`);
}

/**
 * Cancel the pending fallback for a meeting (call when rep responds).
 *
 * @param {string} meetingId
 * @returns {boolean} true if a job was cancelled, false if none existed
 */
function markResponded(meetingId) {
  return cancelJob(meetingId);
}

/**
 * Internal: cancel a scheduled job.
 */
function cancelJob(meetingId) {
  const job = _jobs.get(meetingId);
  if (!job) return false;
  clearTimeout(job.timer);
  _jobs.delete(meetingId);
  console.log(`[scheduler] job cancelled for meeting ${meetingId} (rep responded)`);
  return true;
}

/**
 * Internal: execute the fallback — patch HubSpot + call onFallback hook.
 * Errors are caught and logged so they don't crash the process.
 */
async function runFallback({ meetingId, companyId, inferredSource, onFallback }) {
  console.log(
    `[scheduler] fallback firing for meeting ${meetingId} — setting source to "${inferredSource}"`
  );

  // Translate canonical app source → HubSpot enum value
  const hsSource = toHubSpotSource(inferredSource);

  const patches = [
    patchMeeting(meetingId, { meeting_source: hsSource }),
  ];

  if (companyId) {
    patches.push(
      patchCompany(companyId, {
        stat_latest_source: hsSource,
        discovery_source: hsSource,
      })
    );
  }

  const results = await Promise.allSettled(patches);
  const meetingPatchOk = results[0].status === 'fulfilled';

  for (const r of results) {
    if (r.status === 'rejected') {
      console.error(`[scheduler] HubSpot patch failed: ${r.reason?.message || r.reason}`);
    }
  }

  // Notify caller (e.g. update the Slack message to show auto-set)
  if (typeof onFallback === 'function') {
    try {
      await onFallback({ meetingId, companyId, inferredSource, patchOk: meetingPatchOk });
    } catch (err) {
      console.error(`[scheduler] onFallback hook for meeting ${meetingId}: ${err.message}`);
    }
  }
}

/**
 * Return the number of currently pending attribution jobs (useful for health checks).
 */
function pendingCount() {
  return _jobs.size;
}

// ─── Post-meeting outcome fallback ────────────────────────────────────────────
// Separate Map so post-meeting keys never collide with attribution keys.
const _postJobs = new Map();

/**
 * Schedule a 1-hour fallback for the post-meeting outcome flow.
 * If the rep responds before the timer fires, markPostMeetingResponded()
 * cancels it. Otherwise runPostFallback() applies the Gong-inferred outcome.
 *
 * @param {object} opts
 * @param {string}   opts.meetingId         - HubSpot meeting ID
 * @param {string}   opts.inferredOutcome   - COMPLETED | NO_SHOW | RESCHEDULED | CANCELLED
 * @param {Function} opts.onFallback        - async fn called on expiry:
 *                                            receives { meetingId, inferredOutcome }
 */
function schedulePostMeetingJob({ meetingId, inferredOutcome, onFallback }) {
  // Cancel any existing post-meeting job for this meeting
  cancelPostMeetingJob(meetingId);

  const timer = setTimeout(async () => {
    _postJobs.delete(meetingId);
    await runPostFallback({ meetingId, inferredOutcome, onFallback });
  }, DELAY_MS);

  if (timer.unref) timer.unref();

  _postJobs.set(meetingId, { timer, meetingId, inferredOutcome, onFallback });
  console.log(`[scheduler] post-meeting job scheduled for meeting ${meetingId} (fires in 1 h)`);
}

/**
 * Cancel the pending post-meeting fallback (call when rep responds).
 * @param {string} meetingId
 * @returns {boolean}
 */
function markPostMeetingResponded(meetingId) {
  return cancelPostMeetingJob(meetingId);
}

function cancelPostMeetingJob(meetingId) {
  const job = _postJobs.get(meetingId);
  if (!job) return false;
  clearTimeout(job.timer);
  _postJobs.delete(meetingId);
  console.log(`[scheduler] post-meeting job cancelled for meeting ${meetingId} (rep responded)`);
  return true;
}

async function runPostFallback({ meetingId, inferredOutcome, onFallback }) {
  console.log(
    `[scheduler] post-meeting fallback firing for meeting ${meetingId} — outcome "${inferredOutcome}"`
  );

  // Patch hs_meeting_outcome in HubSpot
  const { patchMeetingOutcome } = require('./hubspot');
  let patchOk = false;
  try {
    await patchMeetingOutcome(meetingId, inferredOutcome);
    patchOk = true;
  } catch (err) {
    console.error(`[scheduler] patchMeetingOutcome ${meetingId}: ${err.message}`);
  }

  // Notify caller (e.g. update the Slack message to show auto-set)
  if (typeof onFallback === 'function') {
    try {
      await onFallback({ meetingId, inferredOutcome, patchOk });
    } catch (err) {
      console.error(`[scheduler] post-meeting onFallback for meeting ${meetingId}: ${err.message}`);
    }
  }
}

/**
 * Return number of currently pending post-meeting jobs.
 */
function pendingPostCount() {
  return _postJobs.size;
}

module.exports = {
  scheduleJob,
  markResponded,
  pendingCount,
  schedulePostMeetingJob,
  markPostMeetingResponded,
  pendingPostCount,
};
