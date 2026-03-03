const axios = require('axios');

// --- Configuration ---
const CONTACT_OBJECT_TYPE = '0-1';
const HAPILY_EVENT_OBJECT_TYPE = '2-54709572';
const BASE_URL = 'https://api.hubapi.com';
const CAMPAIGN_EVENT_ID_PROPERTY = 'hapily_event_id';

/** Get ILS Segment ID from a list object (create/search response). HubSpot may return listId or ilsSegmentId. */
function getListId(listObj) {
  if (!listObj) return null;
  return listObj.listId ?? listObj.ilsSegmentId ?? listObj.id ?? null;
}

exports.main = async (event, callback) => {
  const accessToken = process.env.HS_PRIVATE_APP_TOKEN;
  if (!accessToken) throw new Error('Missing secret HS_PRIVATE_APP_TOKEN');

  const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
  const eventId = event.object?.objectId;
  if (!eventId) throw new Error('No Event ID found.');

  try {
    // 1. Fetch Event Name
    console.log(`Fetching Event ${eventId}...`);
    const eventRes = await axios.get(
      `${BASE_URL}/crm/v3/objects/${HAPILY_EVENT_OBJECT_TYPE}/${eventId}`,
      { params: { properties: 'name' }, headers }
    );
    const eventName = eventRes.data.properties?.name || `Event ${eventId}`;

    // 2. Find existing list by name, or create if not found (skip create-first to avoid duplicate lists)
    const listName = `${eventName} (Final Attendees)`;
    let listId = await findListIdByName(listName, headers);

    if (!listId) {
      console.log(`Creating list: ${listName}`);
      const listRes = await axios.post(
        `${BASE_URL}/crm/v3/lists`,
        {
          name: listName,
          objectTypeId: CONTACT_OBJECT_TYPE,
          processingType: 'MANUAL'
        },
        { headers }
      );
      listId = getListId(listRes.data?.list) ?? getListId(listRes.data);
      console.log(`Created new list: ${listId}`);
    } else {
      console.log(`Using existing list: ${listId}`);
    }

    if (!listId) throw new Error('Critical Error: List ID is undefined after search/create.');

    // 3. Fetch All Associated Contacts (v4 Associations API)
    const uniqueContactIds = await fetchContactIdsForEvent(headers, String(eventId));
    console.log(`Unique contacts to add: ${uniqueContactIds.length}`);

    // 4. Add Contacts to List (Batched)
    if (uniqueContactIds.length > 0) {
      const BATCH_SIZE = 100;
      for (let i = 0; i < uniqueContactIds.length; i += BATCH_SIZE) {
        const batch = uniqueContactIds.slice(i, i + BATCH_SIZE).map(String);
        console.log(`Adding batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} contacts)...`);
        await axios.put(
          `${BASE_URL}/crm/v3/lists/${listId}/memberships/add`,
          batch,
          { headers }
        );
      }
      console.log('All add requests completed.');
    } else {
      console.log('No contacts found to add.');
    }

    // 5. Link to Campaign
    console.log('Searching for matching Campaign...');
    const campRes = await axios.get(
      `${BASE_URL}/marketing/v3/campaigns`,
      {
        params: { limit: 50, sort: '-createdAt', properties: CAMPAIGN_EVENT_ID_PROPERTY },
        headers
      }
    );

    const campaign = campRes.data?.results?.find(
      (c) => String(c.properties?.[CAMPAIGN_EVENT_ID_PROPERTY]) === String(eventId)
    );

    if (campaign) {
      console.log(`Linking List to Campaign: ${campaign.properties?.hs_name}`);
      await axios.put(
        `${BASE_URL}/marketing/v3/campaigns/${campaign.id}/assets/OBJECT_LIST/${listId}`,
        {},
        { headers }
      );
    } else {
      console.log('WARNING: Campaign not found. Skipping link.');
    }

    callback({
      outputFields: { listId: listId, status: 'Success' }
    });
  } catch (e) {
    console.error('Error:', e.message);
    if (e.response) console.error(JSON.stringify(e.response?.data));
    throw e;
  }
};

/**
 * Find list by exact name and object type. Uses HubSpot's "Fetch List by Name" endpoint.
 * The old approach used GET /crm/v3/lists and read res.data.lists — if the API returns
 * a different shape (e.g. results), we were matching against an empty array and never
 * found the existing list (e.g. "Annual Report Webinar (Final Attendees)").
 */
async function findListIdByName(targetName, headers) {
  const encodedName = encodeURIComponent(targetName);
  const url = `${BASE_URL}/crm/v3/lists/object-type-id/${CONTACT_OBJECT_TYPE}/name/${encodedName}`;
  try {
    const res = await axios.get(url, { headers });
    return getListId(res.data?.list) ?? null;
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw err;
  }
}

/** Fetch contact IDs associated to this Hapily event (v4 Associations API, paginated). */
async function fetchContactIdsForEvent(headers, eventId) {
  const ids = [];
  let after = undefined;
  do {
    const reqUrl = `${BASE_URL}/crm/v4/objects/${HAPILY_EVENT_OBJECT_TYPE}/${eventId}/associations/contacts`;
    const res = await axios.get(reqUrl, { headers, params: after ? { after } : {} });
    const results = res.data?.results || [];
    results.forEach((r) => {
      const id = r.toObjectId ?? r.id;
      if (id != null) ids.push(String(id));
    });
    after = res.data?.paging?.next?.after ?? undefined;
  } while (after);
  return [...new Set(ids)];
}
