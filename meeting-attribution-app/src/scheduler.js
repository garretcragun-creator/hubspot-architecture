/**
 * 1-hour fallback scheduler
 * ─────────────────────────
 * When a meeting webhook fires, scheduleJob() queues a job for +1 hour.
 * If the rep responds (Yes or dropdown) before the timer fires, markResponded()
 * cancels the timer. Otherwise runFallback() applies the inferred source to
 * HubSpot automatically.
 */

const { patchMeeting, patchCompany } = require('./hubspot');

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

  const patches = [];

  // 1. Patch meeting_source
  patches.push(
    patchMeeting(meetingId, { meeting_source: inferredSource }).catch((err) =>
      console.error(`[scheduler] patchMeeting ${meetingId}: ${err.message}`)
    )
  );

  // 2. Patch company stat_latest_source + discovery_source (if we have a company)
  if (companyId) {
    patches.push(
      patchCompany(companyId, {
        stat_latest_source: inferredSource,
        discovery_source: inferredSource,
      }).catch((err) =>
        console.error(`[scheduler] patchCompany ${companyId}: ${err.message}`)
      )
    );
  }

  await Promise.allSettled(patches);

  // 3. Notify caller (e.g. update the Slack message to show auto-set)
  if (typeof onFallback === 'function') {
    try {
      await onFallback({ meetingId, companyId, inferredSource });
    } catch (err) {
      console.error(`[scheduler] onFallback hook for meeting ${meetingId}: ${err.message}`);
    }
  }
}

/**
 * Return the number of currently pending jobs (useful for health checks).
 */
function pendingCount() {
  return _jobs.size;
}

module.exports = { scheduleJob, markResponded, pendingCount };
