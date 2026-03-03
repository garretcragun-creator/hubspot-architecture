/**
 * Attribution Inference Engine
 * ─────────────────────────────
 * Determines the most likely attribution source for a discovery meeting
 * from first-party contact/behavioral context.
 *
 * Signal hierarchy (highest confidence wins if ≥ 50):
 *
 *   1.  conference_interactions set                  → Sponsored Event   (80)
 *   2.  hapily trigger props set                     → Hosted/Sponsored  (78)
 *   3.  hapily_registrant custom objects present     → Hosted/Sponsored  (75)
 *   4.  number_of_hapily_event_interactions > 0      → Hosted/Sponsored  (72)
 *   5.  zoom_webinar_attendance_count > 0            → Hosted Webinar    (70)
 *   6.  last_registered_webinar_date within 90 days  → Hosted Webinar    (68)
 *   7.  Outbound call(s) before meeting              → Prospecting       (65)
 *   8.  Meeting booking UTM                          → mapped            (60)
 *   9.  Outbound email(s) before meeting             → mapped / Prosp.   (55–60)
 *  10.  hs_analytics_last_referrer                   → weak digital src  (30)
 *
 * IMPORTANT: HubSpot attribution_properties group fields (stat_latest_source,
 * stat_original_source, latest_source_history, hs_latest_source,
 * hs_analytics_source, utm_*, ac_*, cc_*, dc_*, etc.) are intentionally
 * excluded — they are HubSpot-calculated rollup fields that reflect CRM history,
 * not the true source of a specific discovery meeting.
 *
 * Default (no signal ≥ 50):
 *   → "Sponsored Event"  if conference_interactions is set
 *   → "Prospecting"      otherwise
 */

// ─── Canonical 24-source taxonomy ────────────────────────────────────────────
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

// ─── Meeting booking UTM → canonical (meeting_info group, NOT attribution_properties)
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
  if (
    s === 'conference' ||
    m.includes('nac') ||
    m.includes('mgma') ||
    m.includes('agma') ||
    m.includes('conference')
  ) return 'Sponsored Event';
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

// ─── Web referrer → canonical (analyticsinformation group, weak signal) ──────
function mapReferrer(referrer, lastUrl) {
  const r = (referrer || '').toLowerCase();
  const u = (lastUrl || '').toLowerCase();

  // Event/webinar page on site
  if (u.includes('/event') || u.includes('/webinar') || u.includes('/conference')) {
    return 'Hosted Event';
  }
  if (r.includes('google.com') || r.includes('bing.com') || r.includes('yahoo.com')) {
    return 'Organic Search';
  }
  if (r.includes('linkedin.com')) return 'Organic Social';
  if (r.includes('facebook.com') || r.includes('instagram.com')) return 'Organic Social';
  if (r.includes('twitter.com') || r.includes('x.com')) return 'Organic Social';
  return null;
}

// ─── Email subject keyword analysis ──────────────────────────────────────────
const EVENT_KEYWORDS =
  /\b(event|conference|summit|expo|symposium|forum|tradeshow|trade show|meetup|nac|mgma|agma|gartner)\b/i;
const WEBINAR_KEYWORDS =
  /\b(webinar|workshop|training|masterclass|virtual session)\b/i;

/**
 * Look for event/webinar keywords in outbound email subjects.
 * Returns a signal object, or null if subjects are generic outreach.
 */
function inferFromEmailSubjects(recentEmails) {
  for (const email of recentEmails) {
    const subj = email.subject || '';
    if (!subj) continue;
    if (EVENT_KEYWORDS.test(subj)) {
      return {
        source: 'Sponsored Event',
        reason: `outbound email subject suggests event follow-up: "${subj.slice(0, 60)}"`,
      };
    }
    if (WEBINAR_KEYWORDS.test(subj)) {
      return {
        source: 'Hosted Webinar',
        reason: `outbound email subject suggests webinar follow-up: "${subj.slice(0, 60)}"`,
      };
    }
  }
  return null;
}

// ─── Hapily trigger → event type mapping ──────────────────────────────────────
function mapHapilyTrigger(triggerVal) {
  const t = (triggerVal || '').toLowerCase();
  if (t.includes('conference') || t.includes('sponsor') || t.includes('external')) {
    return 'Sponsored Event';
  }
  if (t.includes('webinar')) return 'Hosted Webinar';
  return 'Hosted Event'; // hapily trigger present but unspecified → assume hosted
}

// ─── Signal collection ────────────────────────────────────────────────────────
/**
 * @param {object} contact           - contact properties (first-party only)
 * @param {object} company           - company properties (reserved for future use)
 * @param {Array}  recentActivity    - outbound calls/emails before meeting creation
 * @param {Array}  hapilyRegistrants - hapily_registrant custom object records
 * @param {number} meetingCreatedMs  - Unix ms; when the meeting object was created
 */
function collectSignals(contact, company, recentActivity, hapilyRegistrants, meetingCreatedMs) {
  const signals = [];
  const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

  // ── 1. conference_interactions (explicit field set by team at conferences) ──
  const confInteractions = contact?.conference_interactions;
  if (confInteractions && String(confInteractions).trim() !== '') {
    signals.push({
      source: 'Sponsored Event',
      confidence: 80,
      reason: `conference_interactions set: "${String(confInteractions).slice(0, 60)}"`,
    });
  }

  // ── 2. Hapily trigger properties (first-party event leadcapture) ───────────
  const leadTrigger = contact?.event_leadcapture_trigger;
  const hapilyTrigger = contact?.hapily_registration_trigger;
  const sessionTrigger = contact?.session_registration_trigger;
  const firstTrigger = leadTrigger || hapilyTrigger || sessionTrigger;
  if (firstTrigger && String(firstTrigger).trim()) {
    const src = mapHapilyTrigger(firstTrigger);
    signals.push({
      source: src,
      confidence: 78,
      reason: `hapily trigger set: "${String(firstTrigger).slice(0, 60)}"`,
    });
  }

  // ── 3. Hapily registrant custom object records ─────────────────────────────
  if (hapilyRegistrants && hapilyRegistrants.length > 0) {
    const anySponsored = hapilyRegistrants.some((r) => {
      const t = (r.event_type || '').toLowerCase();
      return t.includes('sponsor') || t.includes('external') || t.includes('conference');
    });
    const src = anySponsored ? 'Sponsored Event' : 'Hosted Event';
    signals.push({
      source: src,
      confidence: 75,
      reason: `${hapilyRegistrants.length} hapily_registrant record(s) found`,
    });
  }

  // ── 4. hapily event interaction count ─────────────────────────────────────
  const hapilyCount = parseInt(contact?.number_of_hapily_event_interactions || '0', 10);
  if (hapilyCount > 0) {
    const latestType = (contact?.latest_event_lead_type || '').toLowerCase();
    const src =
      latestType.includes('sponsor') || latestType.includes('conference')
        ? 'Sponsored Event'
        : 'Hosted Event';
    signals.push({
      source: src,
      confidence: 72,
      reason:
        `number_of_hapily_event_interactions=${hapilyCount}` +
        (contact?.latest_event_lead_type
          ? ` (latest_event_lead_type="${contact.latest_event_lead_type}")`
          : ''),
    });
  }

  // ── 5. Zoom webinar attendance ─────────────────────────────────────────────
  const webinarAttendance = parseInt(contact?.zoom_webinar_attendance_count || '0', 10);
  if (webinarAttendance > 0) {
    signals.push({
      source: 'Hosted Webinar',
      confidence: 70,
      reason: `zoom_webinar_attendance_count=${webinarAttendance}`,
    });
  }

  // ── 6. Webinar registration within 90 days before meeting ─────────────────
  const webinarDateRaw = contact?.last_registered_webinar_date;
  if (webinarDateRaw) {
    const webinarMs = parseInt(webinarDateRaw, 10);
    const webinarName = contact?.last_registered_webinar_name || 'unknown webinar';
    if (
      webinarMs > 0 &&
      webinarMs >= meetingCreatedMs - NINETY_DAYS_MS &&
      webinarMs <= meetingCreatedMs
    ) {
      signals.push({
        source: 'Hosted Webinar',
        confidence: 68,
        reason: `registered for "${webinarName}" within 90 days before meeting`,
      });
    }
  }

  // ── 7. Recent outbound calls before meeting ───────────────────────────────
  const recentCalls = (recentActivity || []).filter((a) => a.type === 'call');
  if (recentCalls.length > 0) {
    signals.push({
      source: 'Prospecting',
      confidence: 65,
      reason: `${recentCalls.length} outbound call(s) in 30 days before meeting was booked`,
    });
  }

  // ── 8. Meeting booking UTM (meeting_info group — NOT attribution_properties)
  const bookedMedium = contact?.engagements_last_meeting_booked_medium;
  const bookedSource = contact?.engagements_last_meeting_booked_source;
  if (bookedMedium || bookedSource) {
    const mapped = mapMeetingBooked(bookedMedium, bookedSource);
    if (mapped) {
      signals.push({
        source: mapped,
        confidence: 60,
        reason: `meeting booked via medium="${bookedMedium}" source="${bookedSource}"`,
      });
    }
  }

  // ── 9. Recent outbound emails before meeting (subject analysis) ───────────
  const recentEmails = (recentActivity || []).filter((a) => a.type === 'email');
  if (recentEmails.length > 0) {
    const fromSubjects = inferFromEmailSubjects(recentEmails);
    if (fromSubjects) {
      // Email subject indicates event/webinar context — higher confidence
      signals.push({
        source: fromSubjects.source,
        confidence: 60,
        reason: fromSubjects.reason,
      });
    } else {
      // Generic outreach with no event/webinar keywords → Prospecting
      signals.push({
        source: 'Prospecting',
        confidence: 55,
        reason: `${recentEmails.length} outbound email(s) in 30 days before meeting was booked`,
      });
    }
  }

  // ── 10. Last web referrer (analyticsinformation group, weak signal) ────────
  const lastReferrer = contact?.hs_analytics_last_referrer;
  const lastUrl = contact?.hs_analytics_last_url;
  if (lastReferrer || lastUrl) {
    const mapped = mapReferrer(lastReferrer, lastUrl);
    if (mapped) {
      signals.push({
        source: mapped,
        confidence: 30,
        reason:
          `last referrer="${lastReferrer || ''}"` +
          (lastUrl ? ` last_url="${lastUrl.slice(0, 80)}"` : ''),
      });
    }
  }

  return signals;
}

// ─── Main inference function ──────────────────────────────────────────────────
/**
 * @param {object|null} contact          - contact properties (first-party, no attribution_properties)
 * @param {object|null} company          - company properties (reserved)
 * @param {Array}       recentActivity   - outbound calls/emails before meeting creation
 * @param {Array}       hapilyRegistrants - hapily_registrant custom object records
 * @param {number}      meetingCreatedMs  - Unix ms when meeting was created in HubSpot
 * @returns {{ source: string, reason: string, confidence: number }}
 */
function inferSource(
  contact,
  company,
  recentActivity = [],
  hapilyRegistrants = [],
  meetingCreatedMs = Date.now()
) {
  const signals = collectSignals(
    contact || {},
    company || {},
    recentActivity,
    hapilyRegistrants,
    meetingCreatedMs
  );

  if (signals.length === 0) {
    return {
      source: 'Prospecting',
      reason: 'no first-party signals found; defaulting to Prospecting',
      confidence: 0,
    };
  }

  // Pick highest-confidence signal
  signals.sort((a, b) => b.confidence - a.confidence);
  const best = signals[0];

  // If best signal is below threshold (< 50), apply default rule
  if (best.confidence < 50) {
    const hasConference =
      contact?.conference_interactions &&
      String(contact.conference_interactions).trim() !== '';
    const fallback = hasConference ? 'Sponsored Event' : 'Prospecting';
    return {
      source: fallback,
      reason: `low-confidence signals (best: ${best.reason}); defaulting to ${fallback}`,
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
