/**
 * AWS Lambda entry point for NPPES lookup (HubSpot integration).
 *
 * Configure the Lambda:
 *   Runtime: Node.js 18.x or 20.x  (not Python)
 *   Handler: hubspotLambdaNppesHandler.handler
 *
 * Event shape (from API Gateway or direct invoke):
 *   { inputFields: { companyName, address, city, state, zip } }
 *   or top-level: { companyName, address, city, state, zip }
 *   or { body: "{\"inputFields\":{...}}" }  (API Gateway stringified body)
 */

const nppesLookup = require('./hubspot-workflow-nppes-lookup.js');

const INPUT_KEYS = ['companyName', 'address', 'city', 'state', 'zip'];

function normalizeEvent(event) {
  let inputFields = event.inputFields || event.input_fields;

  if (event.body) {
    try {
      const parsed = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
      inputFields = parsed.inputFields || parsed.input_fields || parsed;
    } catch (_) {
      inputFields = {};
    }
  }

  inputFields = inputFields || {};

  // If HubSpot sends flat payload, map top-level keys into inputFields
  for (const key of INPUT_KEYS) {
    if (event[key] !== undefined && event[key] !== null && (inputFields[key] === undefined || inputFields[key] === '')) {
      inputFields[key] = event[key];
    }
  }

  return { inputFields };
}

exports.handler = function handler(event, context, callback) {
  const normalized = normalizeEvent(event);
  const inFields = normalized.inputFields;

  // Minimal log so we can see what was received (stay under 4KB total)
  const safe = (s) => (s != null && typeof s === 'string' ? s.slice(0, 80) : String(s));
  console.log(JSON.stringify({
    msg: 'NPPES_LAMBDA_IN',
    hasCity: Boolean(inFields.city),
    hasState: Boolean(inFields.state),
    hasCompanyName: Boolean(inFields.companyName),
    inputs: {
      companyName: safe(inFields.companyName),
      address: safe(inFields.address),
      city: safe(inFields.city),
      state: safe(inFields.state),
      zip: safe(inFields.zip)
    }
  }));

  const wrappedEvent = { inputFields: inFields };

  nppesLookup.main(wrappedEvent, (err, result) => {
    // HubSpot uses callback({ outputFields }) (single arg); Node convention is (err, result)
    if (err instanceof Error) {
      console.log(JSON.stringify({ msg: 'NPPES_LAMBDA_ERR', error: err.message }));
      return callback(err);
    }
    const out = (err && typeof err === 'object' && err.outputFields)
      ? err.outputFields
      : (result?.outputFields ?? result ?? {});

    console.log(JSON.stringify({
      msg: 'NPPES_LAMBDA_OUT',
      npi: out.npi ? String(out.npi).slice(0, 20) : '',
      legalName: out.legalBusinessName ? String(out.legalBusinessName).slice(0, 40) : '',
      siteCount: out.siteCount
    }));

    return callback(null, {
      statusCode: 200,
      body: JSON.stringify(out),
      headers: { 'Content-Type': 'application/json' }
    });
  });
};
