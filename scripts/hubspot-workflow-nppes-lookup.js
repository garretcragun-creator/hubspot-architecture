/**
 * HubSpot Workflow Custom Code: NPPES lookup by company name + address, then all sites by legal name
 *
 * DEPLOY: Copy this ENTIRE file into your workflow's Custom code action (replace all) and save.
 *
 * PROCESS:
 * 1. Resolve this site: query NPPES by address (city, state, zip) → get NPI + legal business name.
 * 2. Find all sites: query NPPES by legal business name (no state filter) → all NPIs/locations for the org.
 *
 * SETUP IN HUBSPOT
 * ---------------
 * 1. Add a Custom code action to your workflow (e.g. triggered by Company/Location or by Deal with associated Company).
 *
 * 2. Inputs (add as "Property" or "Formatted data" and set Property name in the workflow):
 *    Map from Company (or Associated company if workflow is Deal-based). Schema internal names per hs-schema.md:
 *    - companyName (string) — map from Company property "name".
 *    - address (string)   — map from Company "address" (optionally concat with "address2").
 *    - city (string)      — Company "city".
 *    - state (string)    — Company "state" (2-letter e.g. "AZ").
 *    - zip (string)      — Company "zip".
 *
 * 3. Data outputs (define these in the action so you can use them in later steps):
 *    - npi (string) — NPI for the location that matched the address.
 *    - legalBusinessName (string) — Legal business name from NPPES (use for "all sites" logic).
 *    - siteCount (number) — Total number of sites (NPIs) found for this org.
 *    - locationsJson (string) — JSON array of { npi, address, city, state, zip, phone } for each site (max ~65k chars).
 *    - executionSummary (string) — Short status you can map to a property to see what happened, e.g. "OK npi=123" or "ERROR: missing city/state".
 *
 * 4. No secrets required — uses public NPPES API. For Mimilabs MCP you would add a secret and call that API instead.
 *
 * LIMITS: 20s timeout; NPPES returns max 200 per request. For orgs with 200+ sites, only first 200 are returned.
 *
 * CALLBACK: HubSpot expects a single argument: callback({ outputFields: { npi, legalBusinessName, ... } }). Do not use callback(null, result).
 */

const axios = require('axios');

const NPPES_BASE = 'https://npiregistry.cms.hhs.gov/api/';

function nppesGet(params) {
  const q = new URLSearchParams({
    version: '2.1',
    enumeration_type: 'NPI-2',
    limit: '200',
    ...params
  });
  return axios.get(NPPES_BASE + '?' + q.toString(), { timeout: 8000 });
}

function normalizeAddr(s) {
  if (!s || typeof s !== 'string') return '';
  return s.replace(/\s+/g, ' ').trim().toLowerCase();
}

/**
 * Scrub company name from HubSpot: trim, collapse whitespace, normalize punctuation.
 * Preserves casing so "INC" vs "Inc" in NPPES can still match.
 */
function scrubCompanyName(s) {
  if (s == null || typeof s !== 'string') return '';
  return s
    .replace(/\s+/g, ' ')
    .replace(/,+/g, ',')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\.{2,}/g, '.')
    .replace(/^\s+|\s+$/g, '')
    .replace(/^[,.\-]+|[,.\-]+$/g, '')
    .trim();
}

exports.main = async (event, callback) => {
  const rawCompanyName = (event.inputFields && event.inputFields.companyName) || '';
  const companyName = scrubCompanyName(rawCompanyName);
  const address = (event.inputFields && event.inputFields.address) || '';
  const city = (event.inputFields && event.inputFields.city) || '';
  const state = (event.inputFields && event.inputFields.state) || '';
  const zip = (event.inputFields && event.inputFields.zip) || '';

  let npi = '';
  let legalBusinessName = '';
  let siteCount = 0;
  let locationsJson = '[]';
  let executionSummary = '';

  const summary = (status, detail) => {
    executionSummary = [status, detail].filter(Boolean).join(' ');
    return executionSummary;
  };

  try {
    if (!city || !state) {
      summary('ERROR: missing city/state', 'city="' + String(city || '').slice(0, 30) + '" state="' + String(state || '').slice(0, 30) + '"');
      if (typeof console !== 'undefined' && console.log) {
        const safe = (s) => (s != null && typeof s === 'string' ? s.slice(0, 80) : String(s));
        console.log(JSON.stringify({
          msg: 'NPPES_MISSING_INPUT',
          city: Boolean(city),
          state: Boolean(state),
          inputs: {
            companyName: safe(rawCompanyName),
            address: safe(address),
            city: safe(city),
            state: safe(state),
            zip: safe(zip)
          }
        }));
      }
      return callback({
        outputFields: {
          npi: '',
          legalBusinessName: '',
          siteCount: 0,
          locationsJson: '[]',
          executionSummary
        }
      });
    }

    // Step 1: Resolve this site — search by city, state, zip; filter by address to get NPI + legal name
    const res1 = await nppesGet({ city, state, postal_code: zip });
    const results1 = res1.data.results || [];
    const addrNorm = normalizeAddr(address);
    const match = results1.find((r) => {
      if (!addrNorm) return results1.indexOf(r) === 0;
      const addrs = (r.addresses || []).map((a) =>
        normalizeAddr([a.address_1, a.address_2].filter(Boolean).join(' '))
      );
      const hasNumber = /\d+/.exec(addrNorm);
      const num = hasNumber ? hasNumber[0] : '';
      return addrs.some((a) => {
        if (!a) return false;
        if (num && a.includes(num) && addrNorm.length >= 5) return a.includes(addrNorm.slice(0, 15)) || a.includes(addrNorm.split(/\s+/).slice(0, 3).join(' '));
        return a.includes(addrNorm.slice(0, 12));
      });
    });
    const first = match || results1[0];
    if (first) {
      npi = first.number || '';
      legalBusinessName = (first.basic && (first.basic.organization_name || first.basic.name)) || '';
    }

    // Fallback: if no match by address but we have a scrubbed company name, try search by organization name
    if (!legalBusinessName && companyName) {
      let resName = await nppesGet({ organization_name: companyName, state, postal_code: zip || undefined });
      let resultsName = resName.data.results || [];
      // NPPES often has "X CORPORATION" or "X CORP"; try adding CORPORATION if no results (e.g. NeighborHealth -> NEIGHBORHEALTH CORPORATION)
      if (resultsName.length === 0 && !/\b(CORPORATION|CORP|INC|LLC|L\.L\.C\.)\b/i.test(companyName)) {
        const nameVariant = companyName.trim() + ' CORPORATION';
        resName = await nppesGet({ organization_name: nameVariant, state, postal_code: zip || undefined });
        resultsName = resName.data.results || [];
      }
      const firstByName = resultsName[0];
      if (firstByName) {
        npi = firstByName.number || '';
        legalBusinessName = (firstByName.basic && (firstByName.basic.organization_name || firstByName.basic.name)) || '';
      }
    }

    if (!legalBusinessName) {
      summary('NO_MATCH', 'city=' + city + ' state=' + state);
      if (typeof console !== 'undefined' && console.log) {
        console.log(JSON.stringify({ msg: 'NPPES_NO_MATCH', city, state, hadAddress: Boolean(address) }));
      }
      return callback({
        outputFields: {
          npi: npi || '',
          legalBusinessName: '',
          siteCount: 0,
          locationsJson: '[]',
          executionSummary
        }
      });
    }

    // Step 2: Find all sites — search by legal business name (exact from NPPES)
    const res2 = await nppesGet({ organization_name: legalBusinessName });
    const results2 = res2.data.results || [];
    siteCount = results2.length;

    const locations = results2.map((r) => {
      const loc = (r.addresses || []).find((a) => (a.address_purpose || '').toUpperCase() === 'LOCATION') || r.addresses?.[0] || {};
      const line1 = [loc.address_1, loc.address_2].filter(Boolean).join(', ');
      return {
        npi: r.number,
        address: line1 || '',
        city: loc.city || '',
        state: loc.state || '',
        zip: loc.postal_code || '',
        phone: loc.telephone_number || ''
      };
    });

    locationsJson = JSON.stringify(locations);
    if (locationsJson.length > 65000) {
      locationsJson = JSON.stringify(locations.slice(0, 500).map((l) => ({ ...l, _truncated: true })));
    }

    summary('OK', 'npi=' + (npi || '') + ' sites=' + siteCount);

    return callback({
      outputFields: {
        npi: npi || '',
        legalBusinessName,
        siteCount,
        locationsJson,
        executionSummary
      }
    });
  } catch (err) {
    summary('ERROR', err.message || 'lookup failed');
    if (typeof console !== 'undefined' && console.error) {
      console.error(JSON.stringify({ msg: 'NPPES_LOOKUP_ERROR', error: err.message }));
    }
    return callback({
      outputFields: {
        npi: '',
        legalBusinessName: '',
        siteCount: 0,
        locationsJson: '[]',
        executionSummary
      }
    });
  }
};
