/**
 * NPPES ETL — Step 0: Claude Search Terms
 *
 * Asks Claude for 3 likely legal-name search terms (exact name, formal name, parent/alternates)
 * for the given company name + city/state. Use before Extract so the pipeline can use these
 * for NPPES name queries instead of only hardcoded variants.
 *
 * INPUTS:
 *   companyName (string), city (string), state (string)
 *
 * OUTPUTS:
 *   searchTermsJson (string) — JSON array of strings, e.g. ["NeighborHealth", "NEIGHBORHEALTH CORPORATION", "East Boston Neighborhood Health Center"]
 *
 * SECRET: ANTHROPIC_API_KEY (set in the workflow action's secrets).
 *
 * Callback: callback({ outputFields: { ... } }).
 */

const axios = require('axios');

async function getSearchTermsFromClaude(companyName, city, state, apiKey) {
  try {
    const prompt = `
I am searching the NPPES NPI Registry for a healthcare organization.
The user provided name is: "${companyName}"
The location is: "${city}, ${state}"

This name might be a DBA, a rebrand, a colloquial name, or an old name (acquired).
Provide a JSON object with a single key "search_terms" containing an array of strings.
The array should include:
1. The exact name provided.
2. The most likely formal "Legal Business Name".
3. Any known parent companies or alternate legal names for this entity in this region.

Limit to the top 3 most likely legal names. Return ONLY JSON.
`;

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-haiku-20240307',
        max_tokens: 150,
        messages: [{ role: 'user', content: prompt }]
      },
      {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        timeout: 10000
      }
    );

    const content = response.data?.content?.[0]?.text || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const terms = parsed.search_terms || [companyName];
      return Array.isArray(terms) ? terms : [companyName];
    }
    return [companyName];
  } catch (error) {
    if (typeof console !== 'undefined' && console.error) {
      console.error('Claude Search Terms API Error:', error.message);
    }
    return [companyName];
  }
}

exports.main = async (event, callback) => {
  const input = event.inputFields || {};
  const companyName = String(input.companyName || '').trim();
  const city = String(input.city || '').trim();
  const state = String(input.state || '').trim();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return callback({
      outputFields: {
        searchTermsJson: JSON.stringify(companyName ? [companyName] : [])
      }
    });
  }

  const searchTerms = await getSearchTermsFromClaude(companyName, city, state, apiKey);
  const searchTermsJson = JSON.stringify(searchTerms);

  callback({
    outputFields: {
      searchTermsJson
    }
  });
};
