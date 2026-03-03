/**
 * NPPES ETL — Step 3: Claude assess (per round)
 *
 * Sends extractPayload + NPPES results to Claude; returns either a match (npi + legalBusinessName)
 * or next strategy + suggestedQuery for the next NPPES round.
 *
 * INPUTS:
 *   extractPayload, nppesResultsJson, nppesResultCount, round
 *
 * OUTPUTS:
 *   matchFound, npi, legalBusinessName, nppesStrategy, suggestedQuery, executionSummary, extractPayload, round
 *
 * SECRET: Set CLAUDE_API_KEY (or ANTHROPIC_API_KEY) in the workflow action's secrets.
 *
 * Callback: callback({ outputFields: { ... } }).
 */

const axios = require('axios');

const ANTHROPIC_BASE = 'https://api.anthropic.com/v1/messages';
const MAX_PROMPT_RESULTS = 8000;

exports.main = async (event, callback) => {
  const input = event.inputFields || {};
  const extractPayloadStr = input.extractPayload || '{}';
  let nppesResults = [];
  try {
    nppesResults = JSON.parse(input.nppesResultsJson || '[]');
  } catch (_) {}
  const nppesResultCount = parseInt(input.nppesResultCount, 10) || 0;
  const round = Math.max(1, parseInt(input.round, 10) || 1);

  const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return callback({
      outputFields: {
        matchFound: 'false',
        npi: '',
        legalBusinessName: '',
        nppesStrategy: round < 3 ? 'name_variant' : '',
        suggestedQuery: '',
        executionSummary: 'ERROR: Claude API key not set (CLAUDE_API_KEY or ANTHROPIC_API_KEY)',
        extractPayload: extractPayloadStr,
        round
      }
    });
  }

  const resultsSnippetRaw = JSON.stringify(nppesResults.slice(0, 50));
  let resultsSnippet = resultsSnippetRaw.length > MAX_PROMPT_RESULTS
    ? resultsSnippetRaw.slice(0, MAX_PROMPT_RESULTS) + '...'
    : resultsSnippetRaw;

  const systemPrompt = `You are a matching assistant. You must choose an NPI ONLY from the NPPES results list provided. Never invent or guess an NPI. Reply with valid JSON only, no markdown:
{
  "matchFound": true or false,
  "npi": "number from results or empty string",
  "legalBusinessName": "exact organization_name from that result or empty string",
  "nextStrategy": "address_first|name_exact|name_variant|name_fuzzy or empty",
  "suggestedQuery": "organization name to try next round if no match, or empty",
  "summary": "one line for logging"
}`;

  const userPrompt = `Company/address we are matching (round ${round}):
${extractPayloadStr}

NPPES results (count=${nppesResultCount}, showing up to 50):
${resultsSnippet}

Which single NPI best matches this company/address? If none match well, set matchFound to false and suggest nextStrategy and suggestedQuery (e.g. try "COMPANY NAME CORPORATION"). Reply with JSON only.`;

  let matchFound = 'false';
  let npi = '';
  let legalBusinessName = '';
  let nppesStrategy = '';
  let suggestedQuery = '';
  let executionSummary = '';

  try {
    const res = await axios.post(
      ANTHROPIC_BASE,
      {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        timeout: 15000
      }
    );
    const text = res.data?.content?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      matchFound = parsed.matchFound === true ? 'true' : 'false';
      npi = String(parsed.npi || '').trim();
      legalBusinessName = String(parsed.legalBusinessName || '').trim();
      nppesStrategy = String(parsed.nextStrategy || '').trim();
      suggestedQuery = String(parsed.suggestedQuery || '').trim();
      executionSummary = String(parsed.summary || '').trim();
      if (matchFound === 'true' && npi && !nppesResults.some(r => String(r.number) === npi)) {
        matchFound = 'false';
        npi = '';
        legalBusinessName = '';
        executionSummary = 'Claude returned NPI not in results; reset.';
      }
    }
  } catch (err) {
    executionSummary = 'Claude error: ' + (err.message || 'unknown');
  }

  if (!executionSummary) executionSummary = `Round ${round}: matchFound=${matchFound}`;

  const nextRound = matchFound === 'true' ? round : Math.min(3, round + 1);

  callback({
    outputFields: {
      matchFound,
      npi,
      legalBusinessName,
      nppesStrategy: nppesStrategy || (round < 3 ? 'name_variant' : ''),
      suggestedQuery,
      executionSummary,
      extractPayload: extractPayloadStr,
      round: nextRound
    }
  });
};
