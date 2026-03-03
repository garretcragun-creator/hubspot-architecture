/**
 * Attribution Inference Engine
 * ─────────────────────────────
 * Determines the most likely attribution source for a discovery meeting
 * from contact/company context. Returns one of the 24 canonical source
 * values from hs-attribution-audit.md.
 *
 * Default rule (when no signal wins clearly):
 *   → "Sponsored Event" if conference_interactions is set on the contact
 *   → "Prospecting"     otherwise
 */

// ─── Canonical 24-source taxonomy (from hs-attribution-audit.md) ────────────
// Note: the build prompt says 23; the audit table lists 24.
// All 24 are included here. Use these EXACT strings for meeting_source,
// stat_latest_source, and discovery_source property values.
const CANONICAL_SOURCES = [
  // Paid Digital
  'Paid Search',
  'Paid Social',
  'Display',
  'Retargeting',
  'Sponsored Email',
  'Paid Review',
  // Owned Digital
  'Email',
  // Organic Digital
  'Organic Social',
  'Organic Search',
  // Direct Digital
  'LLMs',
  'Press Release',
  'Web Link',
  'Direct',
  'Integration',
  // Field & Events
  'Hosted Event',
  'Hosted Webinar',
  'Sponsored Event',
  'Sponsored Webinar',
  // Sales
  'List Import',
  'Meeting Attendee',
  'Prospecting',
  // Partner & Affiliate
  'Referral',
  'Partner',
  'Affiliate',
];

const CANONICAL_SET = new Set(CANONICAL_SOURCES);

// ─── HubSpot native source → canonical mapping ──────────────────────────────
// hs_latest_source / hs_analytics_source values from HubSpot
const HS_NATIVE_TO_CANONICAL = {
  ORGANIC_SEARCH: 'Organic Search',
  PAID_SEARCH: 'Paid Search',
  PAID_SOCIAL: 'Paid Social',
  ORGANIC_SOCIAL: 'Organic Social',
  SOCIAL_MEDIA: 'Organic Social',
  EMAIL: 'Email',
  REFERRAL: 'Referral',
  DIRECT_TRAFFIC: 'Direct',
  OFFLINE: 'List Import',
  OTHER_CAMPAIGNS: null, // too vague
  BLOG: 'Organic Search',
  CONTENT: 'Organic Search',
};

// ─── Meeting booking source/medium → canonical mapping ───────────────────────
// engagements_last_meeting_booked_source / _medium values (UTM-derived)
function mapMeetingBooked(medium, source) {
  const m = (medium || '').toLowerCase();
  const s = (source || '').toLowerCase();

  if (s === 'paidsearch' || m.includes('google') || m.includes('bing')) return 'Paid Search';
  if (s === 'paidsocial' || m === 'linkedin' || m === 'facebook' || m === 'instagram') return 'Paid Social';
  if (s === 'display' || m === 'programmatic' || m === 'ctv' || m === 'gdn') return 'Display';
  if (s === 'retargeting') return 'Retargeting';
  if (s === 'email' && m === 'sponsored-email') return 'Sponsored Email';
  if (s === 'email' || m === 'marketing-email') return 'Email';
  if (s === 'organicsocial') return 'Organic Social';
  if (s === 'search') return 'Organic Search';
  if (s === 'conference' || m.includes('nac') || m.includes('mgma') || m.includes('agma')) return 'Sponsored Event';
  if (s === 'event') return 'Hosted Event';
  if (s === 'webinar') return 'Hosted Webinar';
  if (s === 'web' || m === 'web') return 'Web Link';
  if (s === 'direct' || m === 'direct') return 'Direct';
  if (m === 'customer referral' || m === 'employee referral') return 'Referral';
  if (m === 'partner referral') return 'Partner';
  if (m === 'affiliate') return 'Affiliate';
  if (m === 'artisan' || m === 'sequence' || m === 'one-off' || m === 're-activation') return 'Prospecting';
  return null;
}

function mapHsNative(val) {
  if (!val) return null;
  return HS_NATIVE_TO_CANONICAL[val.toUpperCase()] || null;
}

// ─── Signal collection ───────────────────────────────────────────────────────
// Returns { source, reason, confidence (0–100) }
function collectSignals(contact, company, recentActivity) {
  const signals = [];

  // 1. conference_interactions (multi-select checkbox — any value = strong event signal)
  const confInteractions = contact?.conference_interactions;
  if (confInteractions && String(confInteractions).trim() !== '') {
    signals.push({
      source: 'Sponsored Event',
      confidence: 75,
      reason: `conference_interactions set (${String(confInteractions).slice(0, 60)})`,
    });
  }

  // 2. stat_latest_source — canonical field, highest confidence if set
  const statLatest = contact?.stat_latest_source;
  if (statLatest && CANONICAL_SET.has(statLatest)) {
    signals.push({
      source: statLatest,
      confidence: 85,
      reason: `contact stat_latest_source="${statLatest}"`,
    });
  }

  // 3. Meeting booking UTM (fired when contact books via a meetings link)
  const bookedMedium = contact?.engagements_last_meeting_booked_medium;
  const bookedSource = contact?.engagements_last_meeting_booked_source;
  if (bookedMedium || bookedSource) {
    const mapped = mapMeetingBooked(bookedMedium, bookedSource);
    if (mapped) {
      signals.push({
        source: mapped,
        confidence: 70,
        reason: `meeting booked via medium="${bookedMedium}" source="${bookedSource}"`,
      });
    }
  }

  // 4. Recent outbound sales activity → Prospecting
  if (recentActivity && recentActivity.length > 0) {
    signals.push({
      source: 'Prospecting',
      confidence: 65,
      reason: `recent outbound ${recentActivity[0].type} in last 14 days`,
    });
  }

  // 5. hs_latest_source (HubSpot native — less granular)
  const hsLatest = contact?.hs_latest_source || contact?.hs_analytics_source;
  if (hsLatest) {
    const mapped = mapHsNative(hsLatest);
    if (mapped) {
      signals.push({
        source: mapped,
        confidence: 45,
        reason: `hs_latest_source="${hsLatest}"`,
      });
    }
  }

  // 6. stat_original_source — first-touch, lower weight
  const statOriginal = contact?.stat_original_source;
  if (statOriginal && CANONICAL_SET.has(statOriginal)) {
    signals.push({
      source: statOriginal,
      confidence: 30,
      reason: `contact stat_original_source="${statOriginal}"`,
    });
  }

  // 7. latest_source_history (semicolon-separated multi-select on contact)
  const history = contact?.latest_source_history;
  if (history && String(history).trim()) {
    const vals = String(history).split(';').map((v) => v.trim()).filter(Boolean);
    const canonical = vals.find((v) => CANONICAL_SET.has(v));
    if (canonical) {
      signals.push({
        source: canonical,
        confidence: 25,
        reason: `contact latest_source_history includes "${canonical}"`,
      });
    }
  }

  // 8. Company fallback (lower confidence — company attribution lags)
  const companySource = company?.stat_latest_source;
  if (companySource && CANONICAL_SET.has(companySource)) {
    signals.push({
      source: companySource,
      confidence: 20,
      reason: `company stat_latest_source="${companySource}"`,
    });
  }

  return signals;
}

// ─── Main inference function ─────────────────────────────────────────────────
/**
 * @param {object|null} contact   - contact properties from HubSpot
 * @param {object|null} company   - company properties from HubSpot
 * @param {Array}       recentActivity - recent outbound calls/emails [{type, direction}]
 * @returns {{ source: string, reason: string, confidence: number }}
 */
function inferSource(contact, company, recentActivity = []) {
  const signals = collectSignals(contact || {}, company || {}, recentActivity);

  if (signals.length === 0) {
    // Absolute default — no data at all
    const defaultSrc = 'Prospecting';
    return {
      source: defaultSrc,
      reason: 'no contact/company signals found; defaulting to Prospecting',
      confidence: 0,
    };
  }

  // Pick highest-confidence signal
  signals.sort((a, b) => b.confidence - a.confidence);
  const best = signals[0];

  // If best signal is weak (< 50 confidence), apply default rule:
  //   conference_interactions set → Sponsored Event, else Prospecting
  if (best.confidence < 50) {
    const hasConference =
      contact?.conference_interactions &&
      String(contact.conference_interactions).trim() !== '';
    const fallback = hasConference ? 'Sponsored Event' : 'Prospecting';
    return {
      source: fallback,
      reason: `low-confidence signals; conference_interactions ${hasConference ? 'set' : 'not set'} → default to ${fallback}`,
      confidence: best.confidence,
    };
  }

  return {
    source: best.source,
    reason: best.reason,
    confidence: best.confidence,
  };
}

module.exports = { inferSource, CANONICAL_SOURCES };
