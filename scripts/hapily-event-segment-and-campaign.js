/**
 * HubSpot Workflow Custom Code: Create Segment + Campaign when Hapily Event is created
 *
 * DEPLOY: HubSpot runs the code that is IN THE WORKFLOW, not this file. After any change here,
 * copy this ENTIRE file into your workflow's Custom code action (replace all) and save.
 *
 * Paste this into a Custom code action that runs after a "Hapily event created" trigger.
 *
 * SETUP IN HUBSPOT
 * ---------------
 * 1. Trigger: Object created → Hapily event (object type 2-54709572).
 *
 * 2. Optional inputs (Property name in workflow = key in code):
 *    - eventId: Hapily event record ID (if not provided, uses enrolled object objectId).
 *    - campaignGoal, funnelStage, campaignNotes (optional).
 *
 * 3. Secrets: Add a secret (e.g. HS_PRIVATE_APP_TOKEN) with your Private App
 *    access token. Required scopes:
 *    - crm.lists.read, crm.lists.write (create segment)
 *    - marketing.campaigns.read, marketing.campaigns.write (create campaign, add asset)
 *
 * 4. Data outputs: Define these so you can use them later in the workflow if needed:
 *    - listId (number)
 *    - campaignGuid (string)
 *
 * OBJECT IDs (from your hs-schema)
 * -------------------------------
 * - Contact: 0-1 (use "contacts" in v4 Associations API)
 * - Hapily event: 2-54709572
 * - Hapily registrant: 2-54709567
 * - Registrant → Contact "Registered Contact" / "Event Registration": association type 91
 *
 * SEGMENT STRATEGY
 * ------------------------
 * Use hapily_registrant (not event→contacts): (1) get registrant IDs for this event,
 * (2) get contact IDs from registrants via association type 91 (Registered Contact),
 * (3) create MANUAL list and add those contacts, (4) create campaign and attach list.
 */

const axios = require('axios');

const CONTACT_OBJECT_TYPE = '0-1';
const HAPILY_EVENT_OBJECT_TYPE = '2-54709572';
const HAPILY_REGISTRANT_OBJECT_TYPE = '2-54709567';
/** Association type 91: "Registered Contact" (paired with "Event Registration") — hapily_registrant_contact_regist */
const REGISTRANT_TO_CONTACT_ASSOCIATION_TYPE_ID = 91;
const BASE_URL = 'https://api.hubapi.com';

/** Get ILS Segment ID from a list object (create response). HubSpot may return listId or ilsSegmentId. */
function getListId(listObj) {
  if (!listObj) return null;
  return listObj.listId ?? listObj.ilsSegmentId ?? listObj.id ?? null;
}

// Campaign properties (from HubSpot Campaigns Export). Use exact option labels or internal values as in your portal.
const CAMPAIGN_TYPE_EVENT = 'Event / Conference';       // campaign_type: Event / Conference
const DEFAULT_CAMPAIGN_GOAL = 'Increase Lead Volume';   // campaign_goal
const DEFAULT_FUNNEL_STAGE = 'Awareness';               // funnel_stage

exports.main = async (event, callback) => {
  const accessToken = process.env.HS_PRIVATE_APP_TOKEN;
  if (!accessToken) {
    throw new Error('Missing secret HS_PRIVATE_APP_TOKEN');
  }

  const eventId = event.inputFields?.eventId ?? event.object?.objectId;
  if (!eventId) {
    throw new Error('Missing event ID: add an input named eventId or ensure the workflow enrolls the Hapily event.');
  }
  const campaignGoal = event.inputFields?.campaignGoal || DEFAULT_CAMPAIGN_GOAL;
  const funnelStage = event.inputFields?.funnelStage || DEFAULT_FUNNEL_STAGE;
  const campaignNotes = event.inputFields?.campaignNotes || null;

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };

  let listId = null;
  let campaignGuid = null;

  try {
    // Fetch Hapily event to get name and start/end dates for campaign
    const eventRes = await axios.get(
      `${BASE_URL}/crm/v3/objects/${HAPILY_EVENT_OBJECT_TYPE}/${eventId}`,
      {
        params: {
          properties: 'name,start_datetime,end_datetime,display_start_date,display_end_date'
        },
        headers
      }
    );
    const props = eventRes.data?.properties || {};
    const eventName = props.name || event.inputFields?.eventName || `Event ${eventId}`;
    const eventStartDate = props.start_datetime || props.display_start_date || event.inputFields?.eventStartDate || null;
    const eventEndDate = props.end_datetime || props.display_end_date || event.inputFields?.eventEndDate || null;

    // 1) Get registrant IDs for this event, then resolve contacts via association type 91 (Registered Contact).
    const contactIds = await fetchRegisteredContactIdsForEvent(headers, String(eventId));
    // 2) Create MANUAL list and add those contacts (avoids broken Lists API association filter).
    // Do NOT use processingType: 'DYNAMIC' or filterBranch — HubSpot returns ILS.ASSOCIATION_FILTER_DOES_NOT_MATCH_DEFINITION.
    const segmentName = `${eventName} — Registrants`;
    const listRes = await axios.post(
      `${BASE_URL}/crm/v3/lists`,
      {
        name: segmentName,
        objectTypeId: CONTACT_OBJECT_TYPE,
        processingType: 'MANUAL'
      },
      { headers }
    );
    listId = getListId(listRes.data?.list) ?? getListId(listRes.data) ?? null;
    if (listId == null) {
      throw new Error('List created but no listId in response: ' + JSON.stringify(listRes.data));
    }
    if (contactIds.length > 0) {
      const BATCH = 100;
      for (let i = 0; i < contactIds.length; i += BATCH) {
        const chunk = contactIds.slice(i, i + BATCH).map(String);
        await axios.put(
          `${BASE_URL}/crm/v3/lists/${listId}/memberships/add`,
          chunk,
          { headers }
        );
      }
    }

    // 2) Create HubSpot campaign (using your Campaign properties)
    const campaignProps = {
      hs_name: eventName,
      hs_campaign_status: 'planned',
      campaign_type: CAMPAIGN_TYPE_EVENT,
      campaign_goal: campaignGoal,
      funnel_stage: funnelStage
    };
    if (eventStartDate) {
      const d = parseDate(eventStartDate);
      if (d) campaignProps.hs_start_date = d;
    }
    if (eventEndDate) {
      const d = parseDate(eventEndDate);
      if (d) campaignProps.hs_end_date = d;
    }
    if (campaignNotes) campaignProps.hs_notes = campaignNotes;
    const campaignRes = await axios.post(
      `${BASE_URL}/marketing/v3/campaigns`,
      { properties: campaignProps },
      { headers }
    );
    campaignGuid = campaignRes.data?.id ?? campaignRes.data?.campaignGuid ?? null;
    if (!campaignGuid) {
      throw new Error('Campaign created but no id in response: ' + JSON.stringify(campaignRes.data));
    }

    // 3) Associate segment (list) with campaign (asset type OBJECT_LIST)
    await axios.put(
      `${BASE_URL}/marketing/v3/campaigns/${campaignGuid}/assets/OBJECT_LIST/${listId}`,
      {},
      { headers }
    );

    return callback({
      outputFields: {
        listId: listId,
        campaignGuid: campaignGuid
      }
    });
  } catch (err) {
    const message = err.response?.data?.message || err.message;
    console.error('Segment/Campaign creation failed:', message, err.response?.data);
    throw err;
  }
};

function parseDate(value) {
  if (value == null) return null;
  if (typeof value === 'number') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

/**
 * Fetch contact IDs for "Registered Contact" (association type 91) via hapily_registrant.
 * Flow: event → registrants → contacts (only where association type is 91).
 */
async function fetchRegisteredContactIdsForEvent(headers, eventId) {
  const registrantIds = await fetchRegistrantIdsForEvent(headers, eventId);
  if (registrantIds.length === 0) return [];
  return fetchContactIdsFromRegistrants(headers, registrantIds);
}

/** Get all hapily_registrant IDs associated to this Hapily event. */
async function fetchRegistrantIdsForEvent(headers, eventId) {
  const ids = [];
  let after = undefined;
  do {
    const url = `${BASE_URL}/crm/v4/objects/${HAPILY_EVENT_OBJECT_TYPE}/${eventId}/associations/${HAPILY_REGISTRANT_OBJECT_TYPE}`;
    const config = { headers, params: after ? { after } : {} };
    const res = await axios.get(url, config);
    const results = res.data?.results || [];
    results.forEach((r) => {
      const id = r.toObjectId ?? r.id;
      if (id != null) ids.push(String(id));
    });
    after = res.data?.paging?.next?.after ?? undefined;
  } while (after);
  return ids;
}

/**
 * Batch read registrant → contacts; return contact IDs only where association type is 91 (Registered Contact).
 * HubSpot batch read limit 1000 inputs per request.
 */
async function fetchContactIdsFromRegistrants(headers, registrantIds) {
  const contactIds = new Set();
  const BATCH_SIZE = 1000;
  for (let i = 0; i < registrantIds.length; i += BATCH_SIZE) {
    const chunk = registrantIds.slice(i, i + BATCH_SIZE);
    const body = { inputs: chunk.map((id) => ({ id })) };
    const res = await axios.post(
      `${BASE_URL}/crm/v4/associations/${HAPILY_REGISTRANT_OBJECT_TYPE}/contacts/batch/read`,
      body,
      { headers }
    );
    const results = res.data?.results || [];
    results.forEach((row) => {
      const toList = row.to ?? [];
      toList.forEach((t) => {
        const types = t.associationTypes || [];
        const hasRegisteredContact = types.some(
          (a) => Number(a.typeId) === REGISTRANT_TO_CONTACT_ASSOCIATION_TYPE_ID
        );
        if (hasRegisteredContact && t.toObjectId != null) {
          contactIds.add(String(t.toObjectId));
        }
      });
    });
  }
  return Array.from(contactIds);
}
