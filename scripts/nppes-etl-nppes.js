/**
 * NPPES ETL — Step 2: NPPES query (per round)
 *
 * Runs one NPPES API call based on nppesStrategy and suggestedQuery.
 * Use once per round (R1, R2, R3); pass extractPayload + round through.
 *
 * INPUTS:
 *   extractPayload (string, JSON), nppesStrategy (string), suggestedQuery (string, optional), round (number)
 *
 * OUTPUTS:
 *   nppesResultsJson (string, truncated <65k), nppesResultCount (number), extractPayload, round
 *
 * Callback: callback({ outputFields: { ... } }).
 */

const axios = require('axios');

const NPPES_BASE = 'https://npiregistry.cms.hhs.gov/api/';
const MAX_RESULTS_CHARS = 60000;

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
  let payload;
  try {
    payload = JSON.parse(input.extractPayload || '{}');
  } catch (_) {
    payload = {};
  }
  const strategy = (input.nppesStrategy || 'address_first').toLowerCase();
  const suggestedQuery = (input.suggestedQuery || '').trim();
  const round = Math.max(1, parseInt(input.round, 10) || 1);

  let results = [];
  try {
    if (strategy === 'address_first' || strategy === 'address') {
      if (!payload.city || !payload.state) {
        return callback({
          outputFields: {
            nppesResultsJson: '[]',
            nppesResultCount: 0,
            extractPayload: input.extractPayload || '{}',
            round
          }
        });
      }
      const res = await nppesGet({
        city: payload.city,
        state: payload.state,
        postal_code: payload.zip || undefined
      });
      results = res.data.results || [];
    } else if (strategy === 'name_exact' && payload.companyName) {
      const res = await nppesGet({
        organization_name: payload.companyName,
        state: payload.state || undefined,
        postal_code: payload.zip || undefined
      });
      results = res.data.results || [];
    } else if ((strategy === 'name_variant' || strategy === 'name_fuzzy') && suggestedQuery) {
      const res = await nppesGet({
        organization_name: suggestedQuery,
        state: payload.state || undefined,
        postal_code: payload.zip || undefined
      });
      results = res.data.results || [];
    } else if (payload.companyName && (payload.nameVariants || [])[round]) {
      const variant = payload.nameVariants[round];
      const res = await nppesGet({
        organization_name: variant,
        state: payload.state || undefined,
        postal_code: payload.zip || undefined
      });
      results = res.data.results || [];
    }
  } catch (err) {
    results = [];
  }

  let jsonStr = JSON.stringify(results);
  if (jsonStr.length > MAX_RESULTS_CHARS) {
    const arr = results.slice(0, 60);
    jsonStr = JSON.stringify(arr);
  }

  callback({
    outputFields: {
      nppesResultsJson: jsonStr,
      nppesResultCount: results.length,
      extractPayload: input.extractPayload || '{}',
      round
    }
  });
};
