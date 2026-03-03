/**
 * NPPES ETL — Step 1: Extract
 *
 * Pulls HubSpot company/address fields, normalizes them, and builds a single payload + name variants
 * for the NPPES + Claude loop. Use after "Claude Search Terms" when you have it; otherwise use as first step.
 *
 * INPUTS (map from Company or Associated company):
 *   companyName, address, city, state, zip
 *   Optional: domain, phone, address2, searchTermsJson (from Claude Search Terms step)
 *
 * When searchTermsJson is provided (from Claude Search Terms), it is used as nameVariants; otherwise
 * fallback to hardcoded variants (name, name + " CORPORATION", name + " INC").
 *
 * OUTPUTS:
 *   extractPayload (string, JSON), round (number), nppesStrategy (string), matchFound (string)
 *
 * Callback: callback({ outputFields: { ... } }) — single argument for HubSpot.
 */

function scrub(s) {
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

function nameVariants(name) {
  if (!name || !name.trim()) return [];
  const n = name.trim();
  const variants = [n];
  if (!/\b(CORPORATION|CORP|INC|LLC|L\.L\.C\.)\b/i.test(n)) {
    variants.push(n + ' CORPORATION');
    variants.push(n + ' INC');
  }
  return variants;
}

exports.main = async (event, callback) => {
  const input = event.inputFields || {};
  const companyName = scrub(input.companyName || '');
  const address = [input.address, input.address2].filter(Boolean).join(' ');
  const city = scrub(input.city || '');
  const state = scrub(input.state || '');
  const zip = scrub(input.zip || '');
  const domain = scrub(input.domain || '');
  const phone = scrub(input.phone || '');

  let nameVariantsList = nameVariants(companyName);
  if (input.searchTermsJson) {
    try {
      const terms = JSON.parse(input.searchTermsJson);
      if (Array.isArray(terms) && terms.length > 0) {
        nameVariantsList = terms.map((t) => (t && String(t).trim()) || '').filter(Boolean);
      }
    } catch (_) {}
  }

  const payload = {
    companyName,
    address: address.trim() || '',
    city,
    state,
    zip,
    domain: domain || undefined,
    phone: phone || undefined,
    nameVariants: nameVariantsList
  };

  callback({
    outputFields: {
      extractPayload: JSON.stringify(payload),
      round: 1,
      nppesStrategy: 'address_first',
      matchFound: 'false'
    }
  });
};
