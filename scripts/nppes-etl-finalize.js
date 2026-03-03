/**
 * NPPES ETL — Step 4: Finalize (all sites for matched org)
 *
 * Called when Claude (or a previous step) has set matchFound=true and we have npi + legalBusinessName.
 * Runs one more NPPES call by legal name to get all sites; outputs siteCount and locationsJson.
 *
 * INPUTS:
 *   npi (string), legalBusinessName (string)
 *
 * OUTPUTS:
 *   npi, legalBusinessName, siteCount, locationsJson, executionSummary
 *
 * Callback: callback({ outputFields: { ... } }).
 */

const axios = require('axios');

const NPPES_BASE = 'https://npiregistry.cms.hhs.gov/api/';
const MAX_JSON_CHARS = 65000;

function nppesGet(params) {
  const q = new URLSearchParams({
    version: '2.1',
    enumeration_type: 'NPI-2',
    limit: '200',
    ...params
  });
  return axios.get(NPPES_BASE + '?' + q.toString(), { timeout: 8000 });
}

exports.main = async (event, callback) => {
  const input = event.inputFields || {};
  const npi = String(input.npi || '').trim();
  const legalBusinessName = String(input.legalBusinessName || '').trim();

  let siteCount = 0;
  let locationsJson = '[]';
  let executionSummary = '';

  if (!legalBusinessName) {
    executionSummary = 'Finalize: no legal name provided';
    return callback({
      outputFields: {
        npi,
        legalBusinessName: '',
        siteCount: 0,
        locationsJson: '[]',
        executionSummary
      }
    });
  }

  try {
    const res = await nppesGet({ organization_name: legalBusinessName });
    const results = res.data.results || [];
    siteCount = results.length;

    const locations = results.map((r) => {
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
    if (locationsJson.length > MAX_JSON_CHARS) {
      locationsJson = JSON.stringify(locations.slice(0, 500).map((l) => ({ ...l, _truncated: true })));
    }

    executionSummary = 'OK npi=' + npi + ' sites=' + siteCount;
  } catch (err) {
    executionSummary = 'Finalize NPPES error: ' + (err.message || 'unknown');
  }

  callback({
    outputFields: {
      npi,
      legalBusinessName,
      siteCount,
      locationsJson,
      executionSummary
    }
  });
};
