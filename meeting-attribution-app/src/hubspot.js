/**
 * HubSpot API helpers
 * Uses raw https (same pattern as scripts/weekly-audit.js and scripts/conference-match.js).
 * Auth: Private App token via HUBSPOT_ACCESS_TOKEN env var.
 */

const https = require('https');

const TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
const HOST = 'api.hubapi.com';

// ─── Rate-limit guard (max 8 in-flight, respects Retry-After) ──────────────
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
const CONTACT_PROPS = [
  'stat_latest_source',
  'stat_original_source',
  'conference_interactions',
  'engagements_last_meeting_booked_source',
  'engagements_last_meeting_booked_medium',
  'engagements_last_meeting_booked_campaign',
  'latest_source_history',
  'hs_latest_source',
  'hs_analytics_source',
  'firstname',
  'lastname',
  'email',
].join(',');

async function getContact(contactId) {
  const data = await request('GET', `/crm/v3/objects/contacts/${contactId}?properties=${CONTACT_PROPS}`);
  return data.properties || {};
}

// ─── Companies ──────────────────────────────────────────────────────────────
const COMPANY_PROPS = ['name', 'stat_latest_source', 'stat_original_source'].join(',');

async function getCompany(companyId) {
  const data = await request('GET', `/crm/v3/objects/companies/${companyId}?properties=${COMPANY_PROPS}`);
  return data.properties || {};
}

// ─── Meetings ───────────────────────────────────────────────────────────────
const MEETING_PROPS = [
  'hs_meeting_title',
  'hs_meeting_start_time',
  'hs_meeting_end_time',
  'hubspot_owner_id',
  'meeting_source',
].join(',');

async function getMeeting(meetingId) {
  const data = await request('GET', `/crm/v3/objects/meetings/${meetingId}?properties=${MEETING_PROPS}`);
  return data.properties || {};
}

async function patchMeeting(meetingId, properties) {
  return request('PATCH', `/crm/v3/objects/meetings/${meetingId}`, { properties });
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
    console.warn(`[hubspot] getAssociations meetings→${toObjectType} for ${meetingId}: ${err.message}`);
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

// ─── Recent engagements: outbound calls/emails in the last 14 days ──────────
async function getRecentOutboundActivity(contactId) {
  const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
  const activities = [];

  // Calls
  try {
    const callBody = {
      filterGroups: [{
        filters: [
          { propertyName: 'associations.contactId', operator: 'EQ', value: String(contactId) },
          { propertyName: 'hs_call_direction', operator: 'EQ', value: 'OUTBOUND' },
          { propertyName: 'hs_timestamp', operator: 'GTE', value: String(cutoff) },
        ],
      }],
      properties: ['hs_call_direction', 'hs_timestamp'],
      sorts: [{ propertyName: 'hs_timestamp', direction: 'DESCENDING' }],
      limit: 5,
    };
    const callData = await request('POST', '/crm/v3/objects/calls/search', callBody);
    (callData.results || []).forEach(() => activities.push({ type: 'call', direction: 'OUTBOUND' }));
  } catch (e) {
    console.warn(`[hubspot] calls search for contact ${contactId}: ${e.message}`);
  }

  // Emails (sequences/one-off outbound)
  try {
    const emailBody = {
      filterGroups: [{
        filters: [
          { propertyName: 'associations.contactId', operator: 'EQ', value: String(contactId) },
          { propertyName: 'hs_timestamp', operator: 'GTE', value: String(cutoff) },
        ],
      }],
      properties: ['hs_timestamp', 'hs_email_direction'],
      sorts: [{ propertyName: 'hs_timestamp', direction: 'DESCENDING' }],
      limit: 5,
    };
    const emailData = await request('POST', '/crm/v3/objects/emails/search', emailBody);
    (emailData.results || []).forEach((e) => {
      const dir = e.properties?.hs_email_direction;
      if (dir === 'EMAIL' || dir === 'OUTBOUND') {
        activities.push({ type: 'email', direction: 'OUTBOUND' });
      }
    });
  } catch (e) {
    console.warn(`[hubspot] emails search for contact ${contactId}: ${e.message}`);
  }

  return activities;
}

module.exports = {
  getContact,
  getCompany,
  getMeeting,
  patchMeeting,
  patchCompany,
  getMeetingAssociations,
  getOwnerById,
  getRecentOutboundActivity,
};
