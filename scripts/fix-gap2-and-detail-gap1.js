#!/usr/bin/env node
/**
 * 1. Promote Pending → Company Owner for all in-scope GAP 2 accounts
 *    (non-customer, no open opps, pending set, no company owner)
 *
 * 2. Surface detailed info for in-scope GAP 1 accounts
 *    (non-customer, no open opps, has owner, claim empty/unclaimed, pending ≠ owner)
 *
 * Usage:
 *   node scripts/fix-gap2-and-detail-gap1.js           # dry-run (no writes)
 *   node scripts/fix-gap2-and-detail-gap1.js --commit  # execute GAP 2 promotion
 */

const https = require("https");
const fs    = require("fs");
const path  = require("path");

const TOKEN = fs
  .readFileSync(path.join(__dirname, "..", ".env"), "utf8")
  .match(/HUBSPOT_ACCESS_TOKEN=(.+)/)[1].trim();

const COMMIT = process.argv.includes("--commit");

const OWNER_PROP   = "hubspot_owner_id";
const PENDING_PROP = "pending_target_account_owner";
const CLAIM_PROP   = "account_claim_status";
const LIFECYCLE    = "lifecyclestage";

// ─── HTTP helpers ──────────────────────────────────────────────────────────
let inFlight = 0, requestQueue = [];
function hubspot(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const run = () => {
      inFlight++;
      const req = https.request({
        hostname: "api.hubapi.com", path: urlPath, method,
        headers: { Authorization: "Bearer " + TOKEN, "Content-Type": "application/json" },
      }, (res) => {
        let d = "";
        res.on("data", c => d += c);
        res.on("end", () => {
          inFlight--;
          while (requestQueue.length && inFlight < 8) requestQueue.shift()();
          if (res.statusCode === 429) {
            const retry = parseInt(res.headers["retry-after"] || "2", 10);
            setTimeout(() => hubspot(method, urlPath, body).then(resolve, reject), retry * 1000);
            return;
          }
          if (res.statusCode >= 200 && res.statusCode < 300) resolve(d ? JSON.parse(d) : {});
          else reject(new Error(`HTTP ${res.statusCode}: ${d.slice(0, 400)}`));
        });
      });
      req.on("error", e => { inFlight--; while (requestQueue.length && inFlight < 8) requestQueue.shift()(); reject(e); });
      if (body) req.write(JSON.stringify(body));
      req.end();
    };
    if (inFlight < 8) run(); else requestQueue.push(run);
  });
}

async function searchAll(filterGroups, properties) {
  const all = []; let after;
  for (let i = 0; i < 300; i++) {
    const body = { filterGroups, properties, limit: 100 };
    if (after) body.after = after;
    const res = await hubspot("POST", "/crm/v3/objects/companies/search", body);
    all.push(...(res.results || []));
    if (!res.paging?.next?.after) break;
    after = res.paging.next.after;
  }
  return all;
}

function chunk(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

async function getCompaniesWithOpenDeals(ids) {
  const hasOpen = new Set();
  if (!ids.length) return hasOpen;
  const dealsByCompany = {};
  for (const batch of chunk(ids, 100)) {
    let res;
    try { res = await hubspot("POST", "/crm/v4/associations/companies/deals/batch/read", { inputs: batch.map(id => ({ id })) }); }
    catch (e) { if (e.message.includes("404")) break; throw e; }
    for (const r of res.results || []) {
      const cid = String(r.from?.id || "");
      if (!cid) continue;
      if (!dealsByCompany[cid]) dealsByCompany[cid] = new Set();
      for (const t of r.to || []) if (t.toObjectId) dealsByCompany[cid].add(String(t.toObjectId));
    }
  }
  const allDealIds = [...new Set(Object.values(dealsByCompany).flatMap(s => [...s]))];
  if (!allDealIds.length) return hasOpen;
  const openIds = new Set();
  for (const batch of chunk(allDealIds, 100)) {
    let res;
    try { res = await hubspot("POST", "/crm/v3/objects/deals/batch/read", { inputs: batch.map(id => ({ id })), properties: ["hs_is_closed"] }); }
    catch (e) { if (e.message.includes("404")) break; throw e; }
    for (const d of res.results || []) {
      if ((d.properties?.hs_is_closed || "").toLowerCase() !== "true") openIds.add(String(d.id));
    }
  }
  for (const [cid, dids] of Object.entries(dealsByCompany))
    for (const did of dids) if (openIds.has(did)) { hasOpen.add(cid); break; }
  return hasOpen;
}

function fmt(ts) {
  if (!ts) return "(none)";
  const d = new Date(isNaN(ts) ? ts : Number(ts));
  return isNaN(d) ? "(none)" : d.toISOString().slice(0, 10);
}
function str(v) { return v != null ? String(v).trim() : ""; }

// ─── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("  GAP 2: Promote Pending → Company Owner  |  GAP 1: Account Detail");
  console.log("  Mode: " + (COMMIT ? "LIVE" : "DRY-RUN (use --commit to write changes)"));
  console.log("=".repeat(70) + "\n");

  // Owners map
  const ownersRes = await hubspot("GET", "/crm/v3/owners?limit=500");
  const owners = (ownersRes.results || []).reduce((acc, o) => {
    acc[String(o.id)] = (o.firstName && o.lastName) ? `${o.firstName} ${o.lastName}` : (o.email || String(o.id));
    return acc;
  }, {});
  const ownerName = id => id ? (owners[String(id)] || String(id)) : "(none)";

  // ── Fetch in-scope accounts ──────────────────────────────────────────────
  const props = ["name", OWNER_PROP, PENDING_PROP, CLAIM_PROP, LIFECYCLE];

  const [nonCust, noLifecycle] = await Promise.all([
    searchAll([{ filters: [
      { propertyName: "hs_is_target_account", operator: "EQ",  value: "true" },
      { propertyName: LIFECYCLE,              operator: "NEQ", value: "customer" },
    ]}], props),
    searchAll([{ filters: [
      { propertyName: "hs_is_target_account", operator: "EQ",              value: "true" },
      { propertyName: LIFECYCLE,              operator: "NOT_HAS_PROPERTY"              },
    ]}], props),
  ]);

  const seen = new Set();
  const allNonCust = [];
  for (const c of [...nonCust, ...noLifecycle])
    if (!seen.has(c.id)) { seen.add(c.id); allNonCust.push(c); }

  const openDeals = await getCompaniesWithOpenDeals(allNonCust.map(c => c.id));
  const inScope = allNonCust.filter(c => !openDeals.has(c.id));

  const records = inScope.map(c => {
    const p = c.properties || {};
    return {
      id:      c.id,
      name:    str(p.name) || c.id,
      owner:   str(p[OWNER_PROP]),
      pending: str(p[PENDING_PROP]),
      claim:   str(p[CLAIM_PROP]),
    };
  });

  const gap2 = records.filter(r => r.pending !== "" && r.pending !== r.owner);
  const gap1 = records.filter(r => {
    if (!r.owner) return false;
    if (r.claim !== "" && r.claim !== "Unclaimed") return false;
    return r.pending !== r.owner;
  });

  // ════════════════════════════════════════════════════════════════════════
  // PART 1: GAP 2 — Promote Pending → Company Owner
  // ════════════════════════════════════════════════════════════════════════
  console.log("═".repeat(70));
  console.log("  GAP 2: Promoting Pending Target Account Owner → Company Owner");
  console.log("═".repeat(70));
  console.log(`  In-scope accounts with this gap: ${gap2.length}\n`);

  if (gap2.length === 0) {
    console.log("  Nothing to promote.\n");
  } else {
    console.log("  " + "Company".padEnd(44) + "Pending (will become owner)");
    console.log("  " + "-".repeat(70));
    for (const r of gap2)
      console.log("  " + r.name.slice(0, 42).padEnd(44) + ownerName(r.pending));
    console.log("  " + "-".repeat(70));

    if (COMMIT) {
      console.log(`\n  Writing ${gap2.length} updates...`);
      for (const batch of chunk(gap2, 100)) {
        await hubspot("POST", "/crm/v3/objects/companies/batch/update", {
          inputs: batch.map(r => ({ id: r.id, properties: { [OWNER_PROP]: r.pending } })),
        });
      }
      console.log("  ✓ Done. Company Owner set for all GAP 2 accounts.\n");
    } else {
      console.log("\n  (Dry-run — run with --commit to apply.)\n");
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // PART 2: GAP 1 — Fetch rich detail for review
  // ════════════════════════════════════════════════════════════════════════
  console.log("═".repeat(70));
  console.log("  GAP 1: Account Detail (assigned owner, no valid claim, no pending)");
  console.log("═".repeat(70));
  console.log(`  Accounts: ${gap1.length}\n`);

  if (gap1.length === 0) {
    console.log("  No GAP 1 accounts found.\n");
    return;
  }

  // Fetch enriched properties for GAP 1 accounts
  const detailProps = [
    "name",
    OWNER_PROP, PENDING_PROP, CLAIM_PROP, LIFECYCLE,
    "hs_last_sales_activity_timestamp",   // Last sales activity date
    "notes_last_contacted",               // Last contacted
    "hs_next_open_task_date",             // Next scheduled activity
    "notes_next_activity_date",           // Next activity date (alt field)
    "num_associated_contacts",            // How many contacts are on this account
    "num_associated_deals",               // Total deals ever
    "hs_num_open_deals",                  // Open deals (sanity check — should be 0)
    "hs_analytics_last_visit_timestamp",  // Last website visit
    "city", "state",                      // Location context
    "createdate",                         // When added to HubSpot
  ];

  const enriched = [];
  for (const batch of chunk(gap1, 100)) {
    const res = await hubspot("POST", "/crm/v3/objects/companies/batch/read", {
      inputs: batch.map(r => ({ id: r.id })),
      properties: detailProps,
    });
    enriched.push(...(res.results || []));
  }

  // Map enriched back to gap1 order
  const enrichedById = Object.fromEntries(enriched.map(c => [c.id, c.properties || {}]));

  for (const r of gap1) {
    const p = enrichedById[r.id] || {};
    const location = [str(p.city), str(p.state)].filter(Boolean).join(", ") || "(unknown)";
    const lifecycle = str(p[LIFECYCLE]) || "(not set)";
    const lastSales   = fmt(p.hs_last_sales_activity_timestamp);
    const lastContact = fmt(p.notes_last_contacted);
    const nextTask    = fmt(p.hs_next_open_task_date) !== "(none)"
                          ? fmt(p.hs_next_open_task_date)
                          : fmt(p.notes_next_activity_date);
    const lastVisit   = fmt(p.hs_analytics_last_visit_timestamp);
    const contacts    = str(p.num_associated_contacts) || "0";
    const deals       = str(p.num_associated_deals)    || "0";
    const created     = fmt(p.createdate);

    console.log(`  ┌─ [${r.id}] ${r.name}`);
    console.log(`  │  Owner:             ${ownerName(r.owner)}`);
    console.log(`  │  Claim status:      ${r.claim || "(empty)"}`);
    console.log(`  │  Pending owner:     ${r.pending ? ownerName(r.pending) : "(none)"}`);
    console.log(`  │  Lifecycle stage:   ${lifecycle}`);
    console.log(`  │  Location:          ${location}`);
    console.log(`  │  Last sales act.:   ${lastSales}`);
    console.log(`  │  Last contacted:    ${lastContact}`);
    console.log(`  │  Next activity:     ${nextTask}`);
    console.log(`  │  Last web visit:    ${lastVisit}`);
    console.log(`  │  Contacts / Deals:  ${contacts} contacts, ${deals} deal(s)`);
    console.log(`  └─ Added to HubSpot:  ${created}`);
    console.log("");
  }
}

main().catch(e => { console.error("\nFatal:", e.message); process.exit(1); });
