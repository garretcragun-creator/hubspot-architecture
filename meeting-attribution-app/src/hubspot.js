/**
 * HubSpot API helpers
 * Uses raw https (same pattern as scripts/weekly-audit.js and scripts/conference-match.js).
 * Auth: Private App token via HUBSPOT_ACCESS_TOKEN env var.
 *
 * NOTE: This file intentionally excludes HubSpot's attribution_properties group
 * (stat_latest_source, stat_original_source, latest_source_history, hs_latest_source,
 * hs_analytics_source, utm_*, ac_*, cc_*, dc_*, etc.) from all reads. Those are
 * HubSpot-calculated rollup fields and are NOT reliable signals for meeting-source
 * attribution. We use first-party behavioral properties instead.
 */

const https = require('https');

const TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
const HOST = 'api.hubapi.com';

// ─── Rate-limit guard (max 8 in-flight, respects Retry-After) ─────────────
let inFlight = 0;
const MAX_CONCURRENT = 8;
const queue = [];

function drain() {
  while (queue.length && inFlight < MAX_CONCURRENT) {
    const { run } = queue.shift();
    run();
  }
}

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const run = () => {
      inFlight++;
      const opts = {
        hostname: HOST,
        path,
        method,
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
      };
      const req = https.request(opts, (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          inFlight--;
          drain();
          if (res.statusCode === 429) {
            const after = parseInt(res.headers['retry-after'] || '2', 10);
            setTimeout(() => request(method, path, body).then(resolve, reject), after * 1000);
            return;
          }
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(raw ? JSON.parse(raw) : {});
          } else {
            reject(new Error(`HubSpot HTTP ${res.statusCode} ${method} ${path}: ${raw.slice(0, 300)}`));
          }
        });
      });
      req.on('error', (e) => { inFlight--; drain(); reject(e); });
      if (body) req.write(JSON.stringify(body));
      req.end();
    };
    if (inFlight < MAX_CONCURRENT) run();
    else queue.push({ run });
  });
}

// ─── Contacts ───────────────────────────────────────────────────────────────
// First-party behavioral properties only — no attribution_properties group.
const CONTACT_PROPS = [
  // Identity
  'firstname',
  'lastname',
  'email',

  // ── Event / hapily interactions (first-party custom props) ─────────────
  'conference_interactions',            // multi-select — set by team at conferences
  'number_of_hapily_event_interactions',// count of hapily event interactions
  'event_leadcapture_trigger',          // trigger type that captured the event lead
  'hapily_registration_trigger',        // trigger for hapily event registration
  'session_registration_trigger',       // trigger for hapily session registration
  'latest_event_lead_type',             // type label for the latest event lead
  'latest_event_lead_interest',         // interest area captured at latest event

  // ── Webinar (first-party) ──────────────────────────────────────────────
  'last_registered_webinar_date',       // date of last webinar registration
  'last_registered_webinar_name',       // name of that webinar
  'zoom_webinar_attendance_count',      // # webinars the contact actually attended

  // ── Meeting booking link UTM (meeting_info group — NOT attribution_properties)
  'engagements_last_meeting_booked_source',
  'engagements_last_meeting_booked_medium',
  'engagements_last_meeting_booked_campaign',

  // ── First-party web analytics (analyticsinformation group — NOT attribution_properties)
  'hs_analytics_last_referrer',         // last referrer domain
  'hs_analytics_last_url',              // last page visited
  'hs_analytics_last_timestamp',        // when they last visited
].join(',');

async function getContact(contactId) {
  const data = await request(
    'GET',
    `/crm/v3/objects/contacts/${contactId}?properties=${CONTACT_PROPS}`
  );
  return data.properties || {};
}

// ─── Companies ──────────────────────────────────────────────────────────────
const COMPANY_PROPS = ['name', 'domain'].join(',');

async function getCompany(companyId) {
  const data = await request(
    'GET',
    `/crm/v3/objects/companies/${companyId}?properties=${COMPANY_PROPS}`
  );
  return data.properties || {};
}

// ─── Meetings ───────────────────────────────────────────────────────────────
const MEETING_PROPS = [
  'hs_meeting_title',
  'hs_meeting_start_time',
  'hs_meeting_end_time',
  'hs_createdate',         // when the meeting object was created in HubSpot
  'hubspot_owner_id',
  'meeting_source',
  'hs_activity_type',      // "Discovery Call", "Demo Call", etc.
].join(',');

async function getMeeting(meetingId) {
  const data = await request(
    'GET',
    `/crm/v3/objects/meetings/${meetingId}?properties=${MEETING_PROPS}`
  );
  return data.properties || {};
}

async function patchMeeting(meetingId, properties) {
  return request('PATCH', `/crm/v3/objects/meetings/${meetingId}`, { properties });
}

/**
 * Patch hs_meeting_outcome on a meeting.
 * Valid values: COMPLETED | NO_SHOW | RESCHEDULED | CANCELLED
 *
 * @param {string} meetingId
 * @param {string} outcome   - one of the four enumeration values above
 */
async function patchMeetingOutcome(meetingId, outcome) {
  return patchMeeting(meetingId, { hs_meeting_outcome: outcome });
}

// ─── Companies PATCH ────────────────────────────────────────────────────────
async function patchCompany(companyId, properties) {
  return request('PATCH', `/crm/v3/objects/companies/${companyId}`, { properties });
}

// ─── Associations (v4) ──────────────────────────────────────────────────────
async function getMeetingAssociations(meetingId, toObjectType) {
  try {
    const data = await request(
      'GET',
      `/crm/v4/objects/meetings/${meetingId}/associations/${toObjectType}`
    );
    return (data.results || []).map((r) => String(r.toObjectId));
  } catch (err) {
    console.warn(
      `[hubspot] getAssociations meetings→${toObjectType} for ${meetingId}: ${err.message}`
    );
    return [];
  }
}

/**
 * Return the email addresses of all contacts associated with a meeting.
 * Used to filter Gong calls by participant email so we match the right call.
 * Returns [] on any error so callers can proceed without email data.
 *
 * @param {string} meetingId
 * @returns {Promise<string[]>} lowercased email strings
 */
async function getMeetingContactEmails(meetingId) {
  try {
    // Step 1: get associated contact IDs via v4 associations
    const assocData = await request(
      'GET',
      `/crm/v4/objects/meetings/${meetingId}/associations/contacts`
    );
    const contactIds = (assocData.results || []).map((r) => String(r.toObjectId));
    if (contactIds.length === 0) return [];

    // Step 2: batch-read just the email property for those contacts
    const batchData = await request('POST', '/crm/v3/objects/contacts/batch/read', {
      inputs: contactIds.map((id) => ({ id })),
      properties: ['email'],
    });
    return (batchData.results || [])
      .map((c) => c.properties?.email)
      .filter(Boolean)
      .map((e) => e.toLowerCase());
  } catch (err) {
    console.warn(`[hubspot] getMeetingContactEmails for ${meetingId}: ${err.message}`);
    return [];
  }
}

// ─── Hapily event registrants (custom object 2-54709567) ────────────────────
/**
 * Fetch hapily_registrant records associated to a contact via the v4
 * associations API, then batch-read their properties.
 *
 * hapily custom object type IDs (from hs-schema.md):
 *   hapily_registrant: 2-54709567
 *   hapily_event:      2-54709572
 *   hapily_session:    2-54709569
 *
 * Returns an array of registrant property objects. Returns [] on any error
 * so callers can proceed without event data.
 */
async function getHapilyRegistrants(contactId) {
  try {
    // Step 1: get contact → hapily_registrant associations
    const assocData = await request(
      'GET',
      `/crm/v4/objects/contacts/${contactId}/associations/2-54709567`
    );
    const ids = (assocData.results || []).map((r) => String(r.toObjectId));
    if (ids.length === 0) return [];

    // Step 2: batch-read registrant records (cap at 10 to avoid large payloads)
    const trimmedIds = ids.slice(0, 10);
    const batchData = await request('POST', '/crm/v3/objects/2-54709567/batch/read', {
      inputs: trimmedIds.map((id) => ({ id })),
      properties: [
        'hs_object_id',
        'hs_createdate',
        'event_name',
        'event_type',
        'event_date',
        'attendance_status',
      ],
    });
    return (batchData.results || []).map((r) => r.properties || {});
  } catch (err) {
    console.warn(`[hubspot] getHapilyRegistrants for contact ${contactId}: ${err.message}`);
    return [];
  }
}

// ─── Owners ─────────────────────────────────────────────────────────────────
let _ownersCache = null;
let _ownersCacheTs = 0;
const OWNERS_TTL_MS = 10 * 60 * 1000; // 10 min

async function getOwners() {
  if (_ownersCache && Date.now() - _ownersCacheTs < OWNERS_TTL_MS) return _ownersCache;
  const data = await request('GET', '/crm/v3/owners?limit=500');
  _ownersCache = data.results || [];
  _ownersCacheTs = Date.now();
  return _ownersCache;
}

async function getOwnerById(ownerId) {
  const owners = await getOwners();
  return owners.find((o) => String(o.id) === String(ownerId)) || null;
}

// ─── Recent outbound activity (calls + emails before meeting creation) ───────
/**
 * Fetch outbound calls and emails for a contact, filtered to a 30-day window
 * that ENDS at beforeTimestampMs (i.e., activity that occurred before the
 * meeting was booked).
 *
 * Strategy: use the v4 associations API to get IDs, then batch/read the objects
 * and filter client-side. The v3 search API does not reliably support
 * associations.contactId as a filter property for calls/emails.
 *
 * @param {string|number} contactId
 * @param {number} beforeTimestampMs  - Unix ms; only fetch activity before this (default: now)
 * @returns {Array<{ type: 'call'|'email', direction: string, timestampMs: number, subject?: string }>}
 */
async function getRecentOutboundActivity(contactId, beforeTimestampMs = Date.now()) {
  const WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30-day lookback
  const cutoff = beforeTimestampMs - WINDOW_MS;
  const activities = [];

  console.log(`[hubspot] getRecentOutboundActivity contact=${contactId} window=${new Date(cutoff).toISOString()} → ${new Date(beforeTimestampMs).toISOString()}`);

  // ── Outbound calls ────────────────────────────────────────────────────────
  try {
    // Step 1: get all call IDs associated with this contact
    const assocData = await request(
      'GET',
      `/crm/v4/objects/contacts/${contactId}/associations/calls`
    );
    const callIds = (assocData.results || []).map((r) => String(r.toObjectId));
    console.log(`[hubspot] contact ${contactId}: ${callIds.length} associated call(s)`);

    if (callIds.length > 0) {
      // Step 2: batch-read up to 50 calls, filter client-side
      const batchData = await request('POST', '/crm/v3/objects/calls/batch/read', {
        inputs: callIds.slice(0, 50).map((id) => ({ id })),
        properties: ['hs_call_direction', 'hs_timestamp'],
      });
      (batchData.results || []).forEach((r) => {
        const dir = (r.properties?.hs_call_direction || '').toUpperCase();
        const rawTs = r.properties?.hs_timestamp;
        const ts = rawTs ? new Date(rawTs).getTime() : 0;
        console.log(`[hubspot]   call ${r.id}: dir="${dir}" ts=${new Date(ts).toISOString()}`);
        if (dir === 'OUTBOUND' && ts >= cutoff && ts < beforeTimestampMs) {
          activities.push({ type: 'call', direction: 'OUTBOUND', timestampMs: ts });
        }
      });
    }
  } catch (e) {
    console.warn(`[hubspot] calls for contact ${contactId}: ${e.message}`);
  }

  // ── Outbound emails (sequences / one-off sales emails) ────────────────────
  try {
    // Step 1: get all email IDs associated with this contact
    const assocData = await request(
      'GET',
      `/crm/v4/objects/contacts/${contactId}/associations/emails`
    );
    const emailIds = (assocData.results || []).map((r) => String(r.toObjectId));
    console.log(`[hubspot] contact ${contactId}: ${emailIds.length} associated email(s)`);

    if (emailIds.length > 0) {
      // Step 2: batch-read up to 50 emails, filter client-side
      const batchData = await request('POST', '/crm/v3/objects/emails/batch/read', {
        inputs: emailIds.slice(0, 50).map((id) => ({ id })),
        properties: ['hs_email_direction', 'hs_timestamp', 'hs_email_subject'],
      });
      (batchData.results || []).forEach((r) => {
        const dir = (r.properties?.hs_email_direction || '').toUpperCase();
        const rawTs = r.properties?.hs_timestamp;
        const ts = rawTs ? new Date(rawTs).getTime() : 0;
        console.log(`[hubspot]   email ${r.id}: dir="${dir}" ts=${new Date(ts).toISOString()} subj="${(r.properties?.hs_email_subject || '').slice(0, 60)}"`);
        // HubSpot "EMAIL" direction = outbound from rep; exclude INCOMING_EMAIL
        if (
          (dir === 'EMAIL' || dir === 'OUTBOUND' || dir === 'SENDING') &&
          ts >= cutoff &&
          ts < beforeTimestampMs
        ) {
          activities.push({
            type: 'email',
            direction: 'OUTBOUND',
            timestampMs: ts,
            subject: r.properties?.hs_email_subject || '',
          });
        }
      });
    }
  } catch (e) {
    console.warn(`[hubspot] emails for contact ${contactId}: ${e.message}`);
  }

  console.log(`[hubspot] contact ${contactId}: ${activities.length} qualifying outbound activities found`);
  return activities;
}

// ─── Poll for new meetings ────────────────────────────────────────────────────
/**
 * Search for meetings created after sinceMs (Unix ms).
 * Used by the built-in poller so no external webhook trigger is needed.
 *
 * @param {number} sinceMs
 * @returns {Array<{ id: string, createdMs: number }>}
 */
async function getNewMeetings(sinceMs) {
  const data = await request('POST', '/crm/v3/objects/meetings/search', {
    filterGroups: [
      {
        filters: [
          { propertyName: 'hs_createdate', operator: 'GT', value: String(sinceMs) },
          { propertyName: 'hs_activity_type', operator: 'EQ', value: 'Discovery Call' },
        ],
      },
      {
        // Pick up meetings with no activity type — processMeeting retries
        // up to 3× waiting for workflows to set it, and checks title for "Intro".
        filters: [
          { propertyName: 'hs_createdate', operator: 'GT', value: String(sinceMs) },
          { propertyName: 'hs_activity_type', operator: 'NOT_HAS_PROPERTY' },
        ],
      },
    ],
    properties: ['hs_object_id', 'hs_createdate'],
    sorts: [{ propertyName: 'hs_createdate', direction: 'ASCENDING' }],
    limit: 100,
  });
  return (data.results || []).map((r) => ({
    id: r.id,
    createdMs: parseInt(r.properties?.hs_createdate || '0', 10),
  }));
}

module.exports = {
  getContact,
  getCompany,
  getMeeting,
  patchMeeting,
  patchMeetingOutcome,
  patchCompany,
  getMeetingAssociations,
  getMeetingContactEmails,
  getOwnerById,
  getRecentOutboundActivity,
  getHapilyRegistrants,
  getNewMeetings,
};
