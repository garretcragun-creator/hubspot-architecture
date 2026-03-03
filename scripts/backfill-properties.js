#!/usr/bin/env node
/**
 * HubSpot Property Backfill Script
 * ---------------------------------
 * Backfills two properties:
 *   1. meeting_source  — on Discovery Call meetings (empty only)
 *   2. lead_source     — on New Customer pipeline deals (empty only)
 *
 * Usage:
 *   node scripts/backfill-properties.js            # dry-run (read-only)
 *   node scripts/backfill-properties.js --commit   # live write
 *
 * Requires: .env with HUBSPOT_ACCESS_TOKEN
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

// ─── Config ──────────────────────────────────────────────────────────
const TOKEN = fs
  .readFileSync(path.join(__dirname, "..", ".env"), "utf8")
  .match(/HUBSPOT_ACCESS_TOKEN=(.+)/)[1]
  .trim();

const COMMIT = process.argv.includes("--commit");
const NOW = new Date();
const TIMESTAMP = NOW.toISOString().replace(/[:.]/g, "-");
const CSV_PATH = path.join(__dirname, `backfill-report-${TIMESTAMP}.csv`);

const NEW_CUSTOMER_PIPELINE = "8366c2b0-71b4-40e3-929b-31c05ddd68b4";

// ─── 24-value → 18-value meeting_source mapping ─────────────────────
const SOURCE_TO_MEETING_SOURCE = {
  "Prospecting":       "Cold Call",
  "Hosted Event":      "Conference",
  "Sponsored Event":   "Conference",
  "Hosted Webinar":    "Webinar",
  "Sponsored Webinar": "Webinar",
  "Paid Search":       "Paid Search",
  "Organic Search":    "Organic Search",
  "Paid Social":       "Paid Social",
  "Organic Social":    "Social Media",
  "Email":             "Email Campaign",
  "Partner":           "Partner",
  "Referral":          "Word of mouth",
  "Direct":            "Direct Traffic",
  "Integration":       "Customer Import",
  "Meeting Attendee":  "Meeting Attendee Integration",
  "Display":           "Digital Marketing",
  "Retargeting":       "Digital Marketing",
  "Sponsored Email":   "Digital Marketing",
  "Paid Review":       "Digital Marketing",
  "LLMs":              "Digital Marketing",
  "Press Release":     "Digital Marketing",
  "Web Link":          "Digital Marketing",
  "List Import":       "Other",
  "Affiliate":         "Other",
};

// ─── 18-value contact leadsource → 24-value deal lead_source mapping ─
const LEADSOURCE_TO_DEAL_SOURCE = {
  "Cold Call":                    "Prospecting",
  "Conference":                   "Sponsored Event",
  "Webinar":                      "Sponsored Webinar",
  "Paid Search":                  "Paid Search",
  "Organic Search":               "Organic Search",
  "Paid Social":                  "Paid Social",
  "Social Media":                 "Organic Social",
  // "Email Campaign" → "Email" — excluded (not a valid deal source)
  "Partner":                      "Partner",
  "Word of mouth":                "Referral",
  "Direct Traffic":               "Direct",
  // "Customer Import" → "Integration" — excluded (not a valid deal source)
  // "Meeting Attendee Integration" → "Meeting Attendee" — excluded (not a valid deal source)
  "Open House":                   "Hosted Event",
  "External Referral":            "Referral",
  "Employee Referral":            "Referral",
  "Janium":                       "Prospecting",
  // "Customer End-User" → "Integration" — excluded (not a valid deal source)
  // "Digital Marketing" and "Other" are ambiguous — skip, fall through
};

// Values already in the 24-value taxonomy (no mapping needed)
const CANONICAL_24 = new Set([
  "Prospecting", "Hosted Event", "Sponsored Event", "Hosted Webinar",
  "Sponsored Webinar", "Paid Search", "Organic Search", "Paid Social",
  "Organic Social", "Email", "Partner", "Referral", "Direct",
  "Integration", "Meeting Attendee", "Display", "Retargeting",
  "Sponsored Email", "Paid Review", "LLMs", "Press Release",
  "Web Link", "List Import", "Affiliate",
]);

// ─── Values that are NOT valid deal sources ──────────────────────────
// These describe how a contact entered the system, not what drove the deal.
const INVALID_DEAL_SOURCES = new Set([
  "Email",
  "Integration",
  "List Import",
  "Web Link",
  "Meeting Attendee",
]);

// ─── Rate-limited HTTP helper ────────────────────────────────────────
let requestQueue = [];
let inFlight = 0;
const MAX_CONCURRENT = 8;

function hubspot(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const run = () => {
      inFlight++;
      const options = {
        hostname: "api.hubapi.com",
        path: urlPath,
        method,
        headers: {
          Authorization: "Bearer " + TOKEN,
          "Content-Type": "application/json",
        },
      };
      const req = https.request(options, (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => {
          inFlight--;
          drainQueue();
          if (res.statusCode === 429) {
            const retry = parseInt(res.headers["retry-after"] || "2", 10);
            setTimeout(() => hubspot(method, urlPath, body).then(resolve, reject), retry * 1000);
            return;
          }
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(d ? JSON.parse(d) : {});
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${d.substring(0, 300)}`));
          }
        });
      });
      req.on("error", (e) => { inFlight--; drainQueue(); reject(e); });
      if (body) req.write(JSON.stringify(body));
      req.end();
    };

    if (inFlight < MAX_CONCURRENT) {
      run();
    } else {
      requestQueue.push(run);
    }
  });
}

function drainQueue() {
  while (requestQueue.length > 0 && inFlight < MAX_CONCURRENT) {
    requestQueue.shift()();
  }
}

// ─── Search with pagination ──────────────────────────────────────────
async function searchAll(objectType, filterGroups, properties, limit = 100) {
  const allResults = [];
  let after = undefined;
  for (let page = 0; page < 100; page++) {
    const body = { filterGroups, properties, limit };
    if (after) body.after = after;
    const result = await hubspot("POST", `/crm/v3/objects/${objectType}/search`, body);
    allResults.push(...(result.results || []));
    if (result.paging && result.paging.next && result.paging.next.after) {
      after = result.paging.next.after;
    } else {
      break;
    }
  }
  return allResults;
}

// ─── Association + property helpers with caching ─────────────────────
const assocCache = new Map();
const propCache = new Map();

async function getAssociatedIds(objectType, objectId, toObjectType) {
  const key = `${objectType}:${objectId}:${toObjectType}`;
  if (assocCache.has(key)) return assocCache.get(key);
  try {
    const result = await hubspot(
      "GET",
      `/crm/v4/objects/${objectType}/${objectId}/associations/${toObjectType}`
    );
    const ids = (result.results || []).map((r) => r.toObjectId);
    assocCache.set(key, ids);
    return ids;
  } catch (_) {
    assocCache.set(key, []);
    return [];
  }
}

async function getObjectProps(objectType, objectId, properties) {
  const key = `${objectType}:${objectId}:${properties.sort().join(",")}`;
  if (propCache.has(key)) return propCache.get(key);
  try {
    const props = properties.join(",");
    const result = await hubspot("GET", `/crm/v3/objects/${objectType}/${objectId}?properties=${props}`);
    propCache.set(key, result);
    return result;
  } catch (_) {
    propCache.set(key, null);
    return null;
  }
}

// ─── Batch update ────────────────────────────────────────────────────
async function batchUpdate(objectType, updates) {
  if (updates.length === 0) return;
  for (let i = 0; i < updates.length; i += 100) {
    const batch = updates.slice(i, i + 100);
    await hubspot("POST", `/crm/v3/objects/${objectType}/batch/update`, {
      inputs: batch,
    });
  }
}

// ─── Utility ─────────────────────────────────────────────────────────
function parseSourceHistory(historyValue) {
  if (!historyValue) return null;
  const entries = historyValue.split(";").map((s) => s.trim()).filter(Boolean);
  return entries.length > 0 ? entries[entries.length - 1] : null;
}

function csvEscape(val) {
  const s = String(val || "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

// ─── Audit log ───────────────────────────────────────────────────────
const auditRows = [];

function logChange(recordId, objectType, property, oldValue, newValue, derivedFrom, status, companyId = "") {
  auditRows.push({ recordId, objectType, property, oldValue, newValue, derivedFrom, status, companyId });
}

function writeAuditCsv() {
  const header = "record_id,object_type,company_id,property,old_value,new_value,derived_from,status";
  const rows = auditRows.map((r) =>
    [r.recordId, r.objectType, r.companyId, r.property, r.oldValue, r.newValue, r.derivedFrom, r.status]
      .map(csvEscape)
      .join(",")
  );
  fs.writeFileSync(CSV_PATH, [header, ...rows].join("\n"), "utf8");
}

// =====================================================================
//  PART 1: Meeting Source Backfill
// =====================================================================
async function backfillMeetingSource() {
  console.log("\n── Part 1: Meeting Source ──────────────────────────────");

  const meetings = await searchAll(
    "meetings",
    [{
      filters: [
        { propertyName: "hs_activity_type", operator: "EQ", value: "Discovery Call" },
        { propertyName: "hs_meeting_title", operator: "HAS_PROPERTY" },
        { propertyName: "hs_meeting_title", operator: "NOT_CONTAINS_TOKEN", value: "Gong" },
        { propertyName: "meeting_source", operator: "NOT_HAS_PROPERTY" },
      ],
    }],
    ["hs_meeting_title", "hs_activity_type", "meeting_source", "hs_meeting_start_time"]
  );

  console.log(`   Found ${meetings.length} Discovery Call meetings missing meeting_source`);

  const updates = [];
  let resolved = 0;
  let skipped = 0;

  for (const meeting of meetings) {
    const meetingId = meeting.id;
    let source = null;
    let derivedFrom = "";
    let companyId = "";

    // Fallback chain: company → contact → contact source history
    const contactIds = await getAssociatedIds("meetings", meetingId, "contacts");
    let primaryContactProps = null;

    if (contactIds.length > 0) {
      const contact = await getObjectProps("contacts", contactIds[0], [
        "stat_latest_source", "latest_source_history",
      ]);
      if (contact) primaryContactProps = contact.properties;

      const companyIds = await getAssociatedIds("contacts", contactIds[0], "companies");
      if (companyIds.length > 0) {
        companyId = companyIds[0];
        const company = await getObjectProps("companies", companyIds[0], ["stat_latest_source"]);
        if (company && company.properties.stat_latest_source) {
          source = company.properties.stat_latest_source;
          derivedFrom = `company:${companyIds[0]}:stat_latest_source`;
        }
      }
    }

    if (!source && primaryContactProps && primaryContactProps.stat_latest_source) {
      source = primaryContactProps.stat_latest_source;
      derivedFrom = `contact:${contactIds[0]}:stat_latest_source`;
    }

    if (!source && primaryContactProps) {
      const fromHistory = parseSourceHistory(primaryContactProps.latest_source_history);
      if (fromHistory) {
        source = fromHistory;
        derivedFrom = `contact:${contactIds[0]}:latest_source_history`;
      }
    }

    if (source) {
      const mapped = SOURCE_TO_MEETING_SOURCE[source];
      if (mapped) {
        updates.push({ id: meetingId, properties: { meeting_source: mapped } });
        logChange(meetingId, "meeting", "meeting_source", "", mapped, derivedFrom, COMMIT ? "applied" : "dry-run", companyId);
        resolved++;
      } else {
        logChange(meetingId, "meeting", "meeting_source", "", "", `unmapped source: ${source}`, "skipped", companyId);
        skipped++;
      }
    } else {
      logChange(meetingId, "meeting", "meeting_source", "", "", "no source found", "skipped", companyId);
      skipped++;
    }
  }

  console.log(`   Resolved: ${resolved} | Skipped: ${skipped}`);

  if (COMMIT && updates.length > 0) {
    console.log(`   Writing ${updates.length} meeting_source updates...`);
    await batchUpdate("meetings", updates);
    console.log(`   Done.`);
  }

  return { resolved, skipped, total: meetings.length };
}

// =====================================================================
//  PART 2: Deal Source Backfill
// =====================================================================
async function backfillDealSource() {
  console.log("\n── Part 2: Deal Source ─────────────────────────────────");

  const deals = await searchAll(
    "deals",
    [{
      filters: [
        { propertyName: "pipeline", operator: "EQ", value: NEW_CUSTOMER_PIPELINE },
        { propertyName: "lead_source", operator: "NOT_HAS_PROPERTY" },
      ],
    }],
    [
      "dealname", "lead_source", "oc_source", "source_history",
      "stat_latest_source", "pipeline", "dealstage",
    ]
  );

  console.log(`   Found ${deals.length} New Customer deals missing lead_source`);

  const updates = [];
  let resolved = 0;
  let skipped = 0;
  const sourceBreakdown = { leadsource: 0, oc_source: 0, source_history: 0, company: 0 };

  for (const deal of deals) {
    const dealId = deal.id;
    const props = deal.properties;
    let source = null;
    let derivedFrom = "";

    // Helper: check if a resolved source is valid for deals
    function isValidDealSource(val) {
      return val && !INVALID_DEAL_SOURCES.has(val);
    }

    // Look up associated company early so it's available for all CSV rows
    const companyIds = await getAssociatedIds("deals", dealId, "companies");
    const companyId = companyIds.length > 0 ? companyIds[0] : "";

    // ── Step 1: Contact leadsource (safest per user) ──
    const contactIds = await getAssociatedIds("deals", dealId, "contacts");
    if (contactIds.length > 0) {
      for (const cid of contactIds.slice(0, 5)) {
        const contact = await getObjectProps("contacts", cid, ["leadsource"]);
        if (contact && contact.properties.leadsource) {
          const raw = contact.properties.leadsource;
          let candidate = null;
          let candidateFrom = "";
          if (CANONICAL_24.has(raw)) {
            candidate = raw;
            candidateFrom = `contact:${cid}:leadsource (canonical)`;
          } else {
            const mapped = LEADSOURCE_TO_DEAL_SOURCE[raw];
            if (mapped) {
              candidate = mapped;
              candidateFrom = `contact:${cid}:leadsource="${raw}" → "${mapped}"`;
            }
          }
          if (isValidDealSource(candidate)) {
            source = candidate;
            derivedFrom = candidateFrom;
            sourceBreakdown.leadsource++;
            break;
          }
        }
      }
    }

    // ── Step 2: Deal oc_source ──
    if (!source && props.oc_source) {
      const entries = props.oc_source.split(";").map((s) => s.trim()).filter(Boolean);
      // Try entries from most recent to oldest, skip invalid
      for (let i = entries.length - 1; i >= 0; i--) {
        if (isValidDealSource(entries[i])) {
          source = entries[i];
          derivedFrom = `deal:${dealId}:oc_source`;
          sourceBreakdown.oc_source++;
          break;
        }
      }
    }

    // ── Step 3: Deal source_history (last valid entry) ──
    if (!source && props.source_history) {
      const allEntries = props.source_history.split(";").map((s) => s.trim()).filter(Boolean);
      for (let i = allEntries.length - 1; i >= 0; i--) {
        if (isValidDealSource(allEntries[i])) {
          source = allEntries[i];
          derivedFrom = `deal:${dealId}:source_history`;
          sourceBreakdown.source_history++;
          break;
        }
      }
    }

    // ── Step 4: Company stat_latest_source ──
    if (!source && companyId) {
      const company = await getObjectProps("companies", companyId, ["stat_latest_source"]);
      if (company && isValidDealSource(company.properties.stat_latest_source)) {
        source = company.properties.stat_latest_source;
        derivedFrom = `company:${companyId}:stat_latest_source`;
        sourceBreakdown.company++;
      }
    }

    if (source) {
      updates.push({ id: dealId, properties: { lead_source: source } });
      logChange(dealId, "deal", "lead_source", "", source, derivedFrom, COMMIT ? "applied" : "dry-run", companyId);
      resolved++;
    } else {
      logChange(dealId, "deal", "lead_source", "", "", "no source found", "skipped", companyId);
      skipped++;
    }
  }

  console.log(`   Resolved: ${resolved} | Skipped: ${skipped}`);
  console.log(`   Source breakdown:`);
  console.log(`     contact leadsource:  ${sourceBreakdown.leadsource}`);
  console.log(`     deal oc_source:      ${sourceBreakdown.oc_source}`);
  console.log(`     deal source_history: ${sourceBreakdown.source_history}`);
  console.log(`     company:             ${sourceBreakdown.company}`);

  if (COMMIT && updates.length > 0) {
    console.log(`   Writing ${updates.length} deal source updates...`);
    await batchUpdate("deals", updates);
    console.log(`   Done.`);
  }

  return { resolved, skipped, total: deals.length };
}

// =====================================================================
//  MAIN
// =====================================================================
async function main() {
  const start = Date.now();
  const mode = COMMIT ? "LIVE" : "DRY-RUN";
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  HubSpot Property Backfill — ${mode}`);
  console.log(`  ${NOW.toISOString()}`);
  console.log(`${"=".repeat(60)}`);

  if (!COMMIT) {
    console.log("\n  ⚠  DRY-RUN MODE — no changes will be written to HubSpot.");
    console.log("     Pass --commit to apply changes.\n");
  }

  const meetingSourceResult = await backfillMeetingSource();
  const dealSourceResult = await backfillDealSource();

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  writeAuditCsv();

  console.log(`\n${"=".repeat(60)}`);
  console.log(`  SUMMARY (${mode})`);
  console.log(`${"=".repeat(60)}`);
  console.log(`  Meeting Source:  ${meetingSourceResult.resolved} resolved / ${meetingSourceResult.skipped} skipped / ${meetingSourceResult.total} total`);
  console.log(`  Deal Source:     ${dealSourceResult.resolved} resolved / ${dealSourceResult.skipped} skipped / ${dealSourceResult.total} total`);
  console.log(`\n  Audit log: ${CSV_PATH}`);
  console.log(`  Completed in ${elapsed}s\n`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
