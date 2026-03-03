/**
 * HubSpot Workflow Custom Code: Associate Discovery Meeting to Hapily Event
 *
 * Use in a CONTACT-based workflow triggered by "Meeting booked" (or similar). The enrollment
 * object is the Contact; the code finds that contact's most recent discovery meeting and
 * associates it to a Hapily event when conditions are met.
 *
 * Logic:
 * - Find the contact's most recent discovery meeting (Discovery Call, Demo Call, or Initial Meeting).
 * - A contact on the meeting is associated to a Hapily event, AND
 * - The event end_datetime ended less than 90 days ago, AND
 * - The contact was not a customer at the time the meeting was scheduled
 * → Associate the meeting to that Hapily event (one event per meeting; most recent qualifying event wins).
 *
 * SETUP IN HUBSPOT
 * ---------------
 * 1. Workflow: CONTACT-based. Trigger: "Meeting booked" (enrolls the contact who booked).
 * 2. Optional enrollment filter: e.g. lifecyclestage not Customer, or leave open.
 * 3. Secret: HS_PRIVATE_APP_TOKEN. Scopes: crm.objects.contacts.read, crm.objects.custom.read,
 *    crm.schemas.custom.read, crm.objects.meetings.read, associations read/write for meetings and hapily_event.
 * 4. Optional input: associationTypeId (number) — if set, skips lookup of Meeting↔Hapily event type.
 *
 * OBJECT TYPES (from hs-schema.md)
 * -------------------------------
 * - meetings: 0-47
 * - contacts: 0-1
 * - Hapily event: 2-54709572
 * - Association: hapily_event_to_meeting_event (Meeting ↔ Hapily event)
 */

const axios = require('axios');

const BASE_URL = 'https://api.hubapi.com';
const MEETINGS_OBJECT_TYPE = '0-47';
const CONTACTS_OBJECT_TYPE = '0-1';
const HAPILY_EVENT_OBJECT_TYPE = '2-54709572';
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
/** Only consider discovery meetings created or starting within this window (avoids processing old meetings). */
const MEETING_RECENCY_DAYS = 14;
const MEETING_RECENCY_MS = MEETING_RECENCY_DAYS * 24 * 60 * 60 * 1000;

const DISCOVERY_ACTIVITY_TYPES = ['discovery call', 'demo call', 'initial meeting'];

function parseTimestamp(value) {
  if (value == null || value === '') return null;
  const ms = typeof value === 'number' ? value : parseInt(String(value), 10);
  return isNaN(ms) ? null : ms;
}

/** Get association type ID for meetings <-> hapily_event (hapily_event_to_meeting_event). */
async function getMeetingToHapilyEventTypeId(headers) {
  const res = await axios.get(
    `${BASE_URL}/crm/v3/associations/${MEETINGS_OBJECT_TYPE}/${HAPILY_EVENT_OBJECT_TYPE}/types`,
    { headers }
  );
  const types = res.data?.types || res.data?.results || [];
  const match = (t) => {
    const label = (t.label || '').toLowerCase();
    const name = String(t.name || '').toLowerCase();
    return label.includes('meeting') || name.includes('hapily_event_to_meeting');
  };
  const found = types.find(match) || types[0];
  return found ? Number(found.typeId) : null;
}

/** Get meeting IDs associated to a contact. */
async function getContactMeetingIds(headers, contactId) {
  const ids = [];
  let after = undefined;
  do {
    const url = `${BASE_URL}/crm/v4/objects/${CONTACTS_OBJECT_TYPE}/${contactId}/associations/${MEETINGS_OBJECT_TYPE}`;
    const res = await axios.get(url, { headers, params: after ? { after } : {} });
    const results = res.data?.results || [];
    results.forEach((r) => {
      const id = r.toObjectId ?? r.id;
      if (id != null) ids.push(String(id));
    });
    after = res.data?.paging?.next?.after;
  } while (after);
  return ids;
}

/** Find the most recent discovery meeting for this contact (within recency window). Uses meeting create date so we aren't influenced by meetings scheduled far in advance. */
async function findRecentDiscoveryMeeting(headers, contactId) {
  const meetingIds = await getContactMeetingIds(headers, contactId);
  if (meetingIds.length === 0) return null;
  const res = await axios.post(
    `${BASE_URL}/crm/v3/objects/${MEETINGS_OBJECT_TYPE}/batch/read`,
    {
      properties: ['hs_activity_type', 'hs_createdate'],
      inputs: meetingIds.map((id) => ({ id })),
    },
    { headers }
  );
  const nowMs = Date.now();
  const cutoffMs = nowMs - MEETING_RECENCY_MS;
  const meetings = (res.data?.results || [])
    .filter((m) => {
      const type = (m.properties?.hs_activity_type || '').toLowerCase();
      if (!DISCOVERY_ACTIVITY_TYPES.some((t) => type.includes(t))) return false;
      const createdMs = parseTimestamp(m.properties?.hs_createdate);
      if (createdMs == null) return false;
      return createdMs >= cutoffMs;
    })
    .sort((a, b) => {
      const aCreated = parseTimestamp(a.properties?.hs_createdate) ?? 0;
      const bCreated = parseTimestamp(b.properties?.hs_createdate) ?? 0;
      return bCreated - aCreated;
    });
  return meetings.length ? meetings[0] : null;
}

/** Get contact IDs associated to the meeting. */
async function getMeetingContactIds(headers, meetingId) {
  const ids = [];
  let after = undefined;
  do {
    const url = `${BASE_URL}/crm/v4/objects/${MEETINGS_OBJECT_TYPE}/${meetingId}/associations/${CONTACTS_OBJECT_TYPE}`;
    const res = await axios.get(url, { headers, params: after ? { after } : {} });
    const results = res.data?.results || [];
    results.forEach((r) => {
      const id = r.toObjectId ?? r.id;
      if (id != null) ids.push(String(id));
    });
    after = res.data?.paging?.next?.after;
  } while (after);
  return ids;
}

/** Get Hapily event IDs associated to a contact (any association type: registered, attended, etc.). */
async function getContactHapilyEventIds(headers, contactId) {
  const ids = [];
  let after = undefined;
  do {
    const url = `${BASE_URL}/crm/v4/objects/${CONTACTS_OBJECT_TYPE}/${contactId}/associations/${HAPILY_EVENT_OBJECT_TYPE}`;
    const res = await axios.get(url, { headers, params: after ? { after } : {} });
    const results = res.data?.results || [];
    results.forEach((r) => {
      const id = r.toObjectId ?? r.id;
      if (id != null) ids.push(String(id));
    });
    after = res.data?.paging?.next?.after;
  } while (after);
  return ids;
}

/** Fetch contact properties: lifecyclestage, hs_v2_date_entered_customer. */
async function getContactProperties(headers, contactIds) {
  if (contactIds.length === 0) return {};
  const props = 'lifecyclestage,hs_v2_date_entered_customer';
  const res = await axios.post(
    `${BASE_URL}/crm/v3/objects/contacts/batch/read`,
    {
      properties: props.split(','),
      inputs: contactIds.map((id) => ({ id })),
    },
    { headers }
  );
  const out = {};
  (res.data?.results || []).forEach((c) => {
    const id = c.id ?? c.objectId;
    if (id != null) out[String(id)] = c.properties || {};
  });
  return out;
}

/** Fetch Hapily event end_datetime for given event IDs. */
async function getEventEndDates(headers, eventIds) {
  if (eventIds.length === 0) return {};
  const seen = new Set();
  const ids = eventIds.filter((id) => {
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
  const res = await axios.post(
    `${BASE_URL}/crm/v3/objects/${HAPILY_EVENT_OBJECT_TYPE}/batch/read`,
    {
      properties: ['end_datetime'],
      inputs: ids.map((id) => ({ id })),
    },
    { headers }
  );
  const out = {};
  (res.data?.results || []).forEach((e) => {
    const id = e.id ?? e.objectId;
    if (id != null) out[String(id)] = e.properties?.end_datetime ?? null;
  });
  return out;
}

/** Contact was not a customer at the time of the meeting (using meeting create date = when it was booked). */
function wasNotCustomerAtMeetingTime(contactProps, meetingCreateDateMs) {
  const lifecycle = (contactProps.lifecyclestage || '').toLowerCase();
  if (lifecycle === 'customer') {
    const enteredCustomer = parseTimestamp(contactProps.hs_v2_date_entered_customer);
    if (enteredCustomer == null) return false;
    return meetingCreateDateMs < enteredCustomer;
  }
  return true;
}

/** Create association: meeting -> Hapily event. */
async function associateMeetingToEvent(headers, meetingId, eventId, associationTypeId) {
  await axios.put(
    `${BASE_URL}/crm/v4/objects/${MEETINGS_OBJECT_TYPE}/${meetingId}/associations/${HAPILY_EVENT_OBJECT_TYPE}/${eventId}`,
    [
      {
        associationCategory: 'HUBSPOT_DEFINED',
        associationTypeId,
      },
    ],
    { headers }
  );
}

exports.main = async (event, callback) => {
  const accessToken = process.env.HS_PRIVATE_APP_TOKEN;
  if (!accessToken) {
    return callback(new Error('Missing secret HS_PRIVATE_APP_TOKEN'));
  }

  const contactId = event.object?.objectId ?? event.object?.id ?? event.inputFields?.contactId;
  if (!contactId) {
    return callback(new Error('Missing contact ID: workflow must enroll the Contact object (e.g. trigger "Meeting booked").'));
  }

  const nowMs = Date.now();
  const ninetyDaysAgoMs = nowMs - NINETY_DAYS_MS;

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  let associationTypeId = event.inputFields?.associationTypeId != null
    ? Number(event.inputFields.associationTypeId)
    : null;
  if (associationTypeId == null || isNaN(associationTypeId)) {
    associationTypeId = await getMeetingToHapilyEventTypeId(headers);
  }
  if (associationTypeId == null) {
    return callback(new Error('Could not resolve association type ID for Meeting <-> Hapily event.'));
  }

  try {
    const meetingRecord = await findRecentDiscoveryMeeting(headers, String(contactId));
    if (!meetingRecord) {
      return callback(null, { outputFields: { associated: false, reason: 'no_recent_discovery_meeting' } });
    }

    const meetingId = meetingRecord.id ?? meetingRecord.objectId;
    const meetingCreateDateMs = parseTimestamp(meetingRecord.properties?.hs_createdate);
    const contactIds = await getMeetingContactIds(headers, String(meetingId));
    if (contactIds.length === 0) {
      return callback(null, { outputFields: { associated: false, reason: 'no_contacts' } });
    }
    const allEventIds = [];
    const contactToEventIds = {};
    for (const cid of contactIds) {
      const eventIds = await getContactHapilyEventIds(headers, cid);
      contactToEventIds[cid] = eventIds;
      allEventIds.push(...eventIds);
    }

    if (allEventIds.length === 0) {
      return callback(null, { outputFields: { associated: false, reason: 'no_events' } });
    }

    const contactProps = await getContactProperties(headers, contactIds);
    const eventEndDates = await getEventEndDates(headers, allEventIds);

    const qualifying = [];
    for (const contactId of contactIds) {
      const props = contactProps[contactId] || {};
      const meetingTime = meetingCreateDateMs != null ? meetingCreateDateMs : nowMs;
      if (!wasNotCustomerAtMeetingTime(props, meetingTime)) continue;

      for (const eventId of contactToEventIds[contactId] || []) {
        const endRaw = eventEndDates[eventId];
        const endMs = parseTimestamp(endRaw);
        if (endMs == null) continue;
        if (endMs > nowMs) continue;
        if (endMs < ninetyDaysAgoMs) continue;
        qualifying.push({ eventId, endMs });
      }
    }

    if (qualifying.length === 0) {
      return callback(null, {
        outputFields: {
          associated: false,
          reason: 'no_qualifying_event',
        },
      });
    }

    qualifying.sort((a, b) => b.endMs - a.endMs);
    const chosen = qualifying[0];
    await associateMeetingToEvent(headers, String(meetingId), String(chosen.eventId), associationTypeId);

    return callback(null, {
      outputFields: {
        associated: true,
        hapily_event_id: chosen.eventId,
        reason: 'associated',
      },
    });
  } catch (err) {
    const message = err.response?.data?.message || err.message;
    return callback(new Error(`Discovery→Hapily association failed: ${message}`));
  }
};
