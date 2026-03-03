#!/usr/bin/env node
/**
 * HubSpot Weekly Data-Quality Audit
 * ----------------------------------
 * Runs 8 parallel checks against the HubSpot API and writes a concise
 * markdown report to .cursor/hubspot-context/weekly-audit-report.md
 *
 * Usage:  node scripts/weekly-audit.js
 * Requires: .env with HUBSPOT_ACCESS_TOKEN
 *
 * Design goals:
 *   • All checks run via Promise.all (parallel)
 *   • Simple rate-limit guard (100 req / 10 s)
 *   • Output is a slim markdown report — no raw JSON dumps
 *   • Each issue is tagged AUTO-FIX or REVIEW so the AI knows its lane
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

// ─── Config ──────────────────────────────────────────────────────────
const TOKEN = fs
  .readFileSync(path.join(__dirname, "..", ".env"), "utf8")
  .match(/HUBSPOT_ACCESS_TOKEN=(.+)/)[1]
  .trim();

const REPORT_PATH = path.join(
  __dirname,
  "..",
  ".cursor",
  "hubspot-context",
  "weekly-audit-report.md"
);

const NOW = new Date();
const TODAY = NOW.toISOString().slice(0, 10);
const STALE_DAYS = 30; // deals/meetings older than this are flagged
const SAMPLE_SIZE = 50; // max records to list per check (keeps report lean)

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
            // rate limited — wait and retry
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

// ─── Search helper ───────────────────────────────────────────────────
function search(objectType, filterGroups, properties, limit = 10) {
  return hubspot("POST", `/crm/v3/objects/${objectType}/search`, {
    filterGroups,
    properties,
    limit,
  });
}

// ─── Utility ─────────────────────────────────────────────────────────
function daysAgo(n) {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  return d.valueOf();
}

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toISOString().slice(0, 10);
}

// =====================================================================
//  CHECK 1: Attribution Gaps
// =====================================================================
async function checkAttribution() {
  const label = "Attribution Gaps";
  try {
    const [contactGaps, dealGaps] = await Promise.all([
      // Contacts missing stat_latest_source
      search(
        "contacts",
        [{ filters: [{ propertyName: "stat_latest_source", operator: "NOT_HAS_PROPERTY" }] }],
        ["firstname", "lastname", "email", "lifecyclestage", "createdate"],
        SAMPLE_SIZE
      ),
      // Deals missing stat_latest_source
      search(
        "deals",
        [{ filters: [{ propertyName: "stat_latest_source", operator: "NOT_HAS_PROPERTY" }] }],
        ["dealname", "dealstage", "amount", "closedate", "pipeline"],
        SAMPLE_SIZE
      ),
    ]);

    const items = [];
    if (contactGaps.total > 0)
      items.push({
        tag: "REVIEW",
        msg: `${contactGaps.total} contacts missing \`stat_latest_source\``,
        sample: contactGaps.results.slice(0, 10).map((r) => {
          const p = r.properties;
          return `  - ${p.firstname || ""} ${p.lastname || ""} (${p.email || "no email"}) — ${p.lifecyclestage || "no stage"}, created ${fmtDate(p.createdate)}`;
        }),
      });
    if (dealGaps.total > 0)
      items.push({
        tag: "REVIEW",
        msg: `${dealGaps.total} deals missing \`stat_latest_source\``,
        sample: dealGaps.results.slice(0, 10).map((r) => {
          const p = r.properties;
          return `  - ${p.dealname} — stage: ${p.dealstage}, close: ${fmtDate(p.closedate)}, amount: ${p.amount || "—"}`;
        }),
      });

    return { label, ok: items.length === 0, items };
  } catch (e) {
    return { label, ok: false, items: [{ tag: "ERROR", msg: e.message, sample: [] }] };
  }
}

// =====================================================================
//  CHECK 2: Cross-Object Data Drift (6 dimensions)
// =====================================================================

// Source → Category mapping (from attribution taxonomy flowchart, 2026-02-12)
const SOURCE_TO_CATEGORY = {
  "Paid Search":        "Paid Digital",
  "Paid Social":        "Paid Digital",
  "Display":            "Paid Digital",
  "Retargeting":        "Paid Digital",
  "Sponsored Email":    "Paid Digital",
  "Paid Review":        "Paid Digital",
  "Email":              "Owned Digital",
  "Organic Social":     "Organic Digital",
  "Organic Search":     "Organic Digital",
  "LLMs":               "Direct Digital",
  "Press Release":      "Direct Digital",
  "Web Link":           "Direct Digital",
  "Direct":             "Direct Digital",
  "Integration":        "Direct Digital",
  "Hosted Event":       "Field & Events",
  "Hosted Webinar":     "Field & Events",
  "Sponsored Event":    "Field & Events",
  "Sponsored Webinar":  "Field & Events",
  "List Import":        "Sales",
  "Meeting Attendee":   "Sales",
  "Prospecting":        "Sales",
  "Referral":           "Partner & Affiliate",
  "Partner":            "Partner & Affiliate",
  "Affiliate":          "Partner & Affiliate",
};

// Source → Valid `medium` property values (from taxonomy flowchart, 2026-02-12)
// Medium stores the PLATFORM/CHANNEL detail, not the UTM source classification code.
// Matching is case-insensitive substring. Null/dynamic sources skip validation.
const SOURCE_TO_VALID_MEDIUMS = {
  "Paid Search":        ["google", "bing"],
  "Paid Social":        ["linkedin", "facebook", "instagram", "tiktok", "reddit", "pinterest", "x", "twitter"],
  "Display":            ["programmatic", "ctv", "gdn", "display"],
  "Retargeting":        ["google", "linkedin", "facebook", "instagram", "retargeting"],
  "Sponsored Email":    ["sponsored-email", "sponsored email"],
  "Paid Review":        ["paid-review", "paid review", "g2", "capterra", "trustpilot", "review"],
  "Email":              ["marketing-email", "marketing email", "email"],
  "Organic Social":     ["youtube", "facebook", "instagram", "linkedin", "x", "twitter", "reddit", "tiktok", "pinterest", "social"],
  "Organic Search":     ["yahoo", "google", "bing", "duckduckgo", "search"],
  "LLMs":               ["ai", "chatgpt", "claude", "perplexity", "llm"],
  "Press Release":      ["press"],                    // + dynamic publication names — relaxed check
  "Web Link":           ["web"],
  "Direct":             ["direct", "meeting link"],
  "Integration":        ["end-user", "email extension", "sales extension", "integration", "synctimes"],
  // Dynamic-medium sources — skip validation (medium = event/conference/vendor name):
  // Hosted Event, Hosted Webinar, Sponsored Event, Sponsored Webinar
  // List Import, Meeting Attendee, Prospecting, Referral, Partner, Affiliate
};

function mediumFitsSource(medium, source) {
  if (!medium || !source) return true; // can't evaluate if either is missing
  const validMediums = SOURCE_TO_VALID_MEDIUMS[source];
  if (!validMediums) return true; // Sales/Partner sources — no medium expected, skip
  const medLower = medium.toLowerCase().trim();
  // Exact match on canonical value, or substring match for flexibility
  return validMediums.some((vm) => medLower === vm || medLower.includes(vm));
}

// Lifecycle stage hierarchy (lower index = earlier stage)
const LIFECYCLE_ORDER = [
  "subscriber", "lead", "marketingqualifiedlead",
  "salesqualifiedlead", "opportunity", "customer", "evangelist",
];

function lcIndex(stage) {
  const idx = LIFECYCLE_ORDER.indexOf((stage || "").toLowerCase());
  return idx === -1 ? -1 : idx;
}

async function checkCrossObjectDrift() {
  const label = "Cross-Object Drift";
  try {
    // ── Sample contacts ──
    const contacts = await hubspot("POST", "/crm/v3/objects/contacts/search", {
      filterGroups: [{ filters: [{ propertyName: "stat_latest_source", operator: "HAS_PROPERTY" }] }],
      properties: [
        "firstname", "lastname", "email", "hs_object_id",
        "stat_latest_source", "lead_source_category", "medium",
        "lifecyclestage", "hs_lead_status", "hubspot_owner_id",
      ],
      sorts: [{ propertyName: "lastmodifieddate", direction: "DESCENDING" }],
      limit: 30,
    });

    // ── Sample companies (separate, for within-company checks) ──
    const companies = await hubspot("POST", "/crm/v3/objects/companies/search", {
      filterGroups: [{ filters: [{ propertyName: "stat_latest_source", operator: "HAS_PROPERTY" }] }],
      properties: [
        "name", "stat_latest_source", "latest_lead_source_category",
        "lead_source_category", "medium",
      ],
      sorts: [{ propertyName: "hs_lastmodifieddate", direction: "DESCENDING" }],
      limit: 30,
    });

    // Drift buckets
    const drift = {
      lifecycle: [],             // company lifecycle behind contact
      leadStatus: [],            // lead status mismatch contact ↔ company
      owner: [],                 // contact owner ≠ company owner
      contactSourceCategory: [], // contact source doesn't match its own category
      companySourceCategory: [], // company source doesn't match its own category
      contactMediumSource: [],   // contact medium doesn't fit its own source
      companyMediumSource: [],   // company medium doesn't fit its own source
    };

    // ── Within-Contact checks + Contact↔Company relational checks ──
    for (const c of contacts.results) {
      const cp = c.properties;
      const contactName = `${cp.firstname || ""} ${cp.lastname || ""}`.trim() || cp.email || "Unknown";

      // 4a. Contact: source→category fit
      const cSrc = cp.stat_latest_source;
      const cCat = cp.lead_source_category;
      if (cSrc && cCat && SOURCE_TO_CATEGORY[cSrc] && SOURCE_TO_CATEGORY[cSrc] !== cCat) {
        drift.contactSourceCategory.push(
          `  - **${contactName}**: source \`${cSrc}\` → expected \`${SOURCE_TO_CATEGORY[cSrc]}\`, actual \`${cCat}\``
        );
      }

      // 5a. Contact: medium→source fit
      const cMed = cp.medium;
      if (!mediumFitsSource(cMed, cSrc)) {
        drift.contactMediumSource.push(
          `  - **${contactName}**: medium \`${cMed}\` doesn't fit source \`${cSrc}\``
        );
      }

      // ── Relational checks (need company) ──
      let companyProps = null;
      try {
        const assoc = await hubspot("GET",
          `/crm/v4/objects/contacts/${cp.hs_object_id}/associations/companies`
        );
        if (!assoc.results || assoc.results.length === 0) continue;
        const companyId = assoc.results[0].toObjectId;
        const company = await hubspot("GET",
          `/crm/v3/objects/companies/${companyId}?properties=name,lifecyclestage,hubspot_owner_id,hs_lead_status`
        );
        companyProps = company.properties;
      } catch (_) {
        continue;
      }

      const coName = companyProps.name || "Unknown Company";

      // 1. Lifecycle stage: company should be >= contact
      const cLC = lcIndex(cp.lifecyclestage);
      const coLC = lcIndex(companyProps.lifecyclestage);
      if (cLC > 0 && coLC >= 0 && coLC < cLC) {
        drift.lifecycle.push(
          `  - **${contactName}** is \`${cp.lifecyclestage}\` but **${coName}** is \`${companyProps.lifecyclestage}\``
        );
      }

      // 2. Lead status: should reflect across contact ↔ company
      const cLS = cp.hs_lead_status;
      const coLS = companyProps.hs_lead_status;
      if (cLS && !coLS) {
        drift.leadStatus.push(
          `  - **${contactName}** lead status = \`${cLS}\`, but **${coName}** has none`
        );
      } else if (!cLS && coLS) {
        drift.leadStatus.push(
          `  - **${coName}** lead status = \`${coLS}\`, but contact **${contactName}** has none`
        );
      } else if (cLS && coLS && cLS !== coLS) {
        drift.leadStatus.push(
          `  - **${contactName}** lead status = \`${cLS}\` ≠ **${coName}** = \`${coLS}\``
        );
      }

      // 3. Owner mismatch
      const cOwner = cp.hubspot_owner_id;
      const coOwner = companyProps.hubspot_owner_id;
      if (cOwner && coOwner && cOwner !== coOwner) {
        drift.owner.push(
          `  - **${contactName}** owner \`${cOwner}\` ≠ **${coName}** owner \`${coOwner}\``
        );
      }

      // Stop early if we have enough
      const totalDrift = Object.values(drift).reduce((s, a) => s + a.length, 0);
      if (totalDrift >= 50) break;
    }

    // ── Within-Company checks (independent sample) ──
    for (const co of companies.results) {
      const p = co.properties;
      const coName = p.name || "Unknown Company";
      const coSrc = p.stat_latest_source;
      const coCat = p.latest_lead_source_category || p.lead_source_category;
      const coMed = p.medium;

      // 4b. Company: source→category fit
      if (coSrc && coCat && SOURCE_TO_CATEGORY[coSrc] && SOURCE_TO_CATEGORY[coSrc] !== coCat) {
        drift.companySourceCategory.push(
          `  - **${coName}**: source \`${coSrc}\` → expected \`${SOURCE_TO_CATEGORY[coSrc]}\`, actual \`${coCat}\``
        );
      }

      // 5b. Company: medium→source fit
      if (!mediumFitsSource(coMed, coSrc)) {
        drift.companyMediumSource.push(
          `  - **${coName}**: medium \`${coMed}\` doesn't fit source \`${coSrc}\``
        );
      }
    }

    const items = [];
    const addDrift = (key, desc, tag = "REVIEW") => {
      if (drift[key].length > 0) {
        items.push({
          tag,
          msg: `${drift[key].length} ${desc}`,
          sample: drift[key].slice(0, 5),
        });
      }
    };

    addDrift("lifecycle", "lifecycle stage gaps (company behind contact)");
    addDrift("leadStatus", "lead status mismatches (contact ↔ company)");
    addDrift("owner", "owner mismatches (contact ≠ company)");
    addDrift("contactSourceCategory", "contacts where source doesn't match its own category");
    addDrift("companySourceCategory", "companies where source doesn't match its own category");
    addDrift("contactMediumSource", "contacts where medium doesn't fit its own source");
    addDrift("companyMediumSource", "companies where medium doesn't fit its own source");

    return { label, ok: items.length === 0, items };
  } catch (e) {
    return { label, ok: false, items: [{ tag: "ERROR", msg: e.message, sample: [] }] };
  }
}

// =====================================================================
//  CHECK 3: Stale Meetings (demo/discovery calls, past, no outcome)
// =====================================================================
async function checkStaleMeetings() {
  const label = "Stale Meetings (Demo/Discovery)";
  try {
    // Only flag demo calls and discovery calls — other meeting types are out of scope
    const [demoResults, discoveryResults] = await Promise.all([
      search(
        "meetings",
        [{
          filters: [
            { propertyName: "hs_meeting_start_time", operator: "LT", value: String(daysAgo(1)) },
            { propertyName: "hs_meeting_outcome", operator: "NOT_HAS_PROPERTY" },
            { propertyName: "hs_activity_type", operator: "EQ", value: "Demo Call" },
          ],
        }],
        ["hs_meeting_title", "hs_meeting_start_time", "hs_meeting_outcome", "hs_activity_type", "hubspot_owner_id"],
        SAMPLE_SIZE
      ),
      search(
        "meetings",
        [{
          filters: [
            { propertyName: "hs_meeting_start_time", operator: "LT", value: String(daysAgo(1)) },
            { propertyName: "hs_meeting_outcome", operator: "NOT_HAS_PROPERTY" },
            { propertyName: "hs_activity_type", operator: "EQ", value: "Discovery Call" },
          ],
        }],
        ["hs_meeting_title", "hs_meeting_start_time", "hs_meeting_outcome", "hs_activity_type", "hubspot_owner_id"],
        SAMPLE_SIZE
      ),
    ]);

    const totalCount = (demoResults.total || 0) + (discoveryResults.total || 0);
    const allResults = [...(demoResults.results || []), ...(discoveryResults.results || [])];

    const items = [];
    if (totalCount > 0) {
      items.push({
        tag: "REVIEW",
        msg: `${totalCount} past demo/discovery calls with no outcome logged (${demoResults.total || 0} demo, ${discoveryResults.total || 0} discovery)`,
        sample: allResults.slice(0, 10).map((r) => {
          const p = r.properties;
          return `  - "${p.hs_meeting_title || "(untitled)"}" (${p.hs_activity_type || "—"}) on ${fmtDate(p.hs_meeting_start_time)}`;
        }),
      });
    }
    return { label, ok: items.length === 0, items };
  } catch (e) {
    return { label, ok: false, items: [{ tag: "ERROR", msg: e.message, sample: [] }] };
  }
}

// =====================================================================
//  CHECK 4: Stale Deals (open + past close date)
// =====================================================================
async function checkStaleDeals() {
  const label = "Stale Deals";
  try {
    const result = await search(
      "deals",
      [{
        filters: [
          { propertyName: "closedate", operator: "LT", value: String(daysAgo(0)) },
          { propertyName: "hs_is_closed", operator: "EQ", value: "false" },
        ],
      }],
      ["dealname", "dealstage", "closedate", "amount", "hubspot_owner_id", "pipeline"],
      SAMPLE_SIZE
    );

    const items = [];
    if (result.total > 0) {
      // Sub-categorize by age
      const critical = []; // > 90 days overdue
      const warning = []; // 30-90 days
      const minor = []; // < 30 days

      for (const r of result.results) {
        const p = r.properties;
        const overdueDays = Math.floor((NOW - new Date(p.closedate)) / 86400000);
        const line = `  - **${p.dealname}** — close: ${fmtDate(p.closedate)} (${overdueDays}d overdue), amount: ${p.amount || "—"}`;
        if (overdueDays > 90) critical.push(line);
        else if (overdueDays > 30) warning.push(line);
        else minor.push(line);
      }

      if (critical.length)
        items.push({ tag: "REVIEW", msg: `${critical.length} deals > 90 days overdue (of ${result.total} total stale)`, sample: critical.slice(0, 5) });
      if (warning.length)
        items.push({ tag: "REVIEW", msg: `${warning.length} deals 30–90 days overdue`, sample: warning.slice(0, 5) });
      if (minor.length)
        items.push({ tag: "INFO", msg: `${minor.length} deals < 30 days overdue`, sample: minor.slice(0, 3) });
    }
    return { label, ok: items.length === 0, items };
  } catch (e) {
    return { label, ok: false, items: [{ tag: "ERROR", msg: e.message, sample: [] }] };
  }
}

// =====================================================================
//  CHECK 5: Empty Companies (0 contacts, 0 deals)
// =====================================================================
async function checkEmptyCompanies() {
  const label = "Empty Companies";
  try {
    const result = await search(
      "companies",
      [{
        filters: [
          { propertyName: "num_associated_contacts", operator: "EQ", value: "0" },
          { propertyName: "num_associated_deals", operator: "EQ", value: "0" },
        ],
      }],
      ["name", "domain", "createdate", "hs_lastmodifieddate", "lifecyclestage", "hs_num_child_companies"],
      SAMPLE_SIZE
    );

    const items = [];
    if (result.total > 0) {
      // Separate parent companies (which may be empty themselves but have children) from truly empty
      const trulyEmpty = [];
      const emptyParents = [];
      for (const r of result.results) {
        const p = r.properties;
        const line = `  - **${p.name || "(unnamed)"}** — domain: ${p.domain || "none"}, created: ${fmtDate(p.createdate)}`;
        if (parseInt(p.hs_num_child_companies || "0", 10) > 0) {
          emptyParents.push(line);
        } else {
          trulyEmpty.push(line);
        }
      }

      if (trulyEmpty.length)
        items.push({
          tag: "REVIEW",
          msg: `${result.total} companies with 0 contacts & 0 deals (${trulyEmpty.length} shown, no children)`,
          sample: trulyEmpty.slice(0, 10),
        });
      if (emptyParents.length)
        items.push({
          tag: "INFO",
          msg: `${emptyParents.length} empty parent companies (have children, may be intentional)`,
          sample: emptyParents.slice(0, 5),
        });
    }
    return { label, ok: items.length === 0, items };
  } catch (e) {
    return { label, ok: false, items: [{ tag: "ERROR", msg: e.message, sample: [] }] };
  }
}

// =====================================================================
//  CHECK 6: Duplicate Companies (same domain)
// =====================================================================
async function checkDuplicateCompanies() {
  const label = "Duplicate Companies";
  try {
    // Fetch recently modified companies with domains
    const result = await hubspot("POST", "/crm/v3/objects/companies/search", {
      filterGroups: [{ filters: [{ propertyName: "domain", operator: "HAS_PROPERTY" }] }],
      properties: ["name", "domain", "num_associated_contacts", "num_associated_deals", "hs_parent_company_id"],
      sorts: [{ propertyName: "hs_lastmodifieddate", direction: "DESCENDING" }],
      limit: 100,
    });

    // Group by domain
    const domainMap = {};
    for (const r of result.results) {
      const d = (r.properties.domain || "").toLowerCase().trim();
      if (!d) continue;
      if (!domainMap[d]) domainMap[d] = [];
      domainMap[d].push(r.properties);
    }

    const dupes = Object.entries(domainMap)
      .filter(([_, companies]) => companies.length > 1)
      .map(([domain, companies]) => {
        // Check if they're already in a parent/child relationship
        const ids = companies.map((c) => c.hs_object_id);
        const parentIds = companies.map((c) => c.hs_parent_company_id).filter(Boolean);
        const isHierarchy = parentIds.some((pid) => ids.includes(pid));
        return { domain, companies, isHierarchy };
      });

    const items = [];
    const realDupes = dupes.filter((d) => !d.isHierarchy);
    const hierarchyDupes = dupes.filter((d) => d.isHierarchy);

    if (realDupes.length > 0) {
      items.push({
        tag: "REVIEW",
        msg: `${realDupes.length} domains shared by multiple companies (NOT in parent/child relationship)`,
        sample: realDupes.slice(0, 8).map((d) => {
          const names = d.companies.map((c) =>
            `${c.name} (${c.num_associated_contacts || 0} contacts, ${c.num_associated_deals || 0} deals)`
          ).join(" vs. ");
          return `  - **${d.domain}**: ${names}`;
        }),
      });
    }
    if (hierarchyDupes.length > 0) {
      items.push({
        tag: "INFO",
        msg: `${hierarchyDupes.length} shared domains are parent/child (expected)`,
        sample: hierarchyDupes.slice(0, 3).map((d) => `  - ${d.domain}: ${d.companies.map((c) => c.name).join(", ")}`),
      });
    }

    return { label, ok: items.length === 0, items };
  } catch (e) {
    return { label, ok: false, items: [{ tag: "ERROR", msg: e.message, sample: [] }] };
  }
}

// =====================================================================
//  CHECK 7: Workflow Health
// =====================================================================
async function checkWorkflowHealth() {
  const label = "Workflow Health";
  try {
    // Paginate — API max is 100 per page
    let flows = [];
    let after = undefined;
    for (let page = 0; page < 10; page++) {
      const url = `/automation/v4/flows?limit=100${after ? "&after=" + after : ""}`;
      const result = await hubspot("GET", url);
      flows = flows.concat(result.results || []);
      if (result.paging && result.paging.next && result.paging.next.after) {
        after = result.paging.next.after;
      } else {
        break;
      }
    }

    const active = flows.filter((f) => f.isEnabled);
    const inactive = flows.filter((f) => !f.isEnabled);
    const unnamed = inactive.filter((f) => !f.name || f.name.trim() === "" || f.name.startsWith("Unnamed"));

    const items = [];
    items.push({
      tag: "INFO",
      msg: `Workflow inventory: ${active.length} active, ${inactive.length} inactive`,
      sample: [],
    });

    if (unnamed.length > 0) {
      items.push({
        tag: "AUTO-FIX",
        msg: `${unnamed.length} unnamed/inactive workflows — safe to delete`,
        sample: unnamed.slice(0, 5).map((f) => `  - ID: ${f.id} (created: ${fmtDate(f.createdAt)})`),
      });
    }

    // Flag inactive workflows that were active recently (last 60 days)
    const recentlyDisabled = inactive.filter((f) => {
      if (!f.updatedAt) return false;
      return (NOW - new Date(f.updatedAt)) < 60 * 86400000;
    });
    if (recentlyDisabled.length > 0) {
      items.push({
        tag: "REVIEW",
        msg: `${recentlyDisabled.length} workflows disabled in the last 60 days (intentional?)`,
        sample: recentlyDisabled.slice(0, 5).map((f) => `  - "${f.name || "(unnamed)"}" (ID: ${f.id}) — updated: ${fmtDate(f.updatedAt)}`),
      });
    }

    return { label, ok: unnamed.length === 0 && recentlyDisabled.length === 0, items };
  } catch (e) {
    return { label, ok: false, items: [{ tag: "ERROR", msg: e.message, sample: [] }] };
  }
}

// =====================================================================
//  CHECK 8: Orphan Companies (companies with 0 associated contacts)
// =====================================================================
async function checkOrphanCompanies() {
  const label = "Orphan Companies";
  try {
    const result = await search(
      "companies",
      [{
        filters: [
          { propertyName: "num_associated_contacts", operator: "EQ", value: "0" },
        ],
      }],
      ["name", "domain", "createdate", "hs_lastmodifieddate", "num_associated_deals", "hs_num_child_companies", "lifecyclestage"],
      SAMPLE_SIZE
    );

    const items = [];
    if (result.total > 0) {
      // Separate parent companies (have children) from truly orphaned
      const trulyOrphan = [];
      const parentOrphan = [];

      for (const r of result.results) {
        const p = r.properties;
        const hasChildren = parseInt(p.hs_num_child_companies || "0", 10) > 0;
        const hasDeals = parseInt(p.num_associated_deals || "0", 10) > 0;
        const line = `  - **${p.name || "(unnamed)"}** — domain: ${p.domain || "none"}, deals: ${p.num_associated_deals || 0}, stage: ${p.lifecyclestage || "—"}, created: ${fmtDate(p.createdate)}`;

        if (hasChildren) {
          parentOrphan.push(line);
        } else {
          trulyOrphan.push(line);
        }
      }

      if (trulyOrphan.length > 0) {
        items.push({
          tag: "REVIEW",
          msg: `${result.total} companies with 0 associated contacts (${trulyOrphan.length} shown, no children)`,
          sample: trulyOrphan.slice(0, 10),
        });
      }
      if (parentOrphan.length > 0) {
        items.push({
          tag: "INFO",
          msg: `${parentOrphan.length} parent companies with 0 direct contacts (have child companies — may be intentional)`,
          sample: parentOrphan.slice(0, 5),
        });
      }
    }
    return { label, ok: items.length === 0, items };
  } catch (e) {
    return { label, ok: false, items: [{ tag: "ERROR", msg: e.message, sample: [] }] };
  }
}

// =====================================================================
//  MAIN — Run all checks in parallel, write report
// =====================================================================
async function main() {
  const start = Date.now();
  console.log(`🔍 HubSpot Weekly Audit — ${TODAY}\n`);
  console.log("Running 8 checks in parallel...\n");

  const results = await Promise.all([
    checkAttribution(),
    checkCrossObjectDrift(),
    checkStaleMeetings(),
    checkStaleDeals(),
    checkEmptyCompanies(),
    checkDuplicateCompanies(),
    checkWorkflowHealth(),
    checkOrphanCompanies(),
  ]);

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  // ── Build markdown report ──────────────────────────────────────────
  const lines = [
    `# HubSpot Weekly Audit Report`,
    ``,
    `> Generated: ${NOW.toISOString()} | Duration: ${elapsed}s`,
    ``,
    `## Summary`,
    ``,
    `| Check | Status | Action Items |`,
    `|---|---|---|`,
  ];

  let totalAutoFix = 0;
  let totalReview = 0;

  for (const r of results) {
    const autoFix = r.items.filter((i) => i.tag === "AUTO-FIX").length;
    const review = r.items.filter((i) => i.tag === "REVIEW").length;
    const errors = r.items.filter((i) => i.tag === "ERROR").length;
    totalAutoFix += autoFix;
    totalReview += review;

    let status = "✅ Clean";
    if (errors > 0) status = "⚠️ Error";
    else if (review > 0 || autoFix > 0) status = "🔴 Issues";
    else if (r.items.some((i) => i.tag === "INFO")) status = "ℹ️ Info";

    const actions = [];
    if (autoFix) actions.push(`${autoFix} auto-fixable`);
    if (review) actions.push(`${review} need review`);
    if (errors) actions.push(`${errors} errors`);

    lines.push(`| ${r.label} | ${status} | ${actions.join(", ") || "—"} |`);
  }

  lines.push(``);
  lines.push(`**Totals:** ${totalAutoFix} auto-fixable | ${totalReview} need human review`);
  lines.push(``);
  lines.push(`---`);

  // ── Detail sections ────────────────────────────────────────────────
  for (const r of results) {
    if (r.items.length === 0) continue;
    lines.push(``);
    lines.push(`## ${r.label}`);
    lines.push(``);
    for (const item of r.items) {
      lines.push(`### \`${item.tag}\` ${item.msg}`);
      if (item.sample && item.sample.length > 0) {
        lines.push(``);
        lines.push(item.sample.join("\n"));
        lines.push(``);
      }
    }
    lines.push(`---`);
  }

  // ── Instructions for AI ────────────────────────────────────────────
  lines.push(``);
  lines.push(`## Action Guide`);
  lines.push(``);
  lines.push(`- **AUTO-FIX**: These items are safe to execute without human approval.`);
  lines.push(`- **REVIEW**: Present these to the user with a recommendation. Do NOT auto-execute.`);
  lines.push(`- **INFO**: Context only — no action needed unless the user asks.`);
  lines.push(`- **ERROR**: An API call failed. Note it and move on.`);

  const report = lines.join("\n");

  // ── Write report ───────────────────────────────────────────────────
  fs.writeFileSync(REPORT_PATH, report, "utf8");
  console.log(`✅ Report written to: ${REPORT_PATH}`);
  console.log(`⏱  Completed in ${elapsed}s`);
  console.log(`📊 ${totalAutoFix} auto-fixable | ${totalReview} need review\n`);

  // Also print the summary to terminal
  console.log("─".repeat(60));
  for (const r of results) {
    const icon = r.ok ? "✅" : "🔴";
    const counts = r.items
      .filter((i) => i.tag !== "INFO")
      .map((i) => `${i.tag}: ${i.msg.split(" ")[0]}`)
      .join(", ");
    console.log(`${icon} ${r.label}: ${counts || "clean"}`);
  }
  console.log("─".repeat(60));
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
