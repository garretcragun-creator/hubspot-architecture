#!/usr/bin/env node
/**
 * Data Integrity Audit: Target Account Assignment
 * -----------------------------------------------
 * Scope: Target accounts that are NOT current customers AND have NO open opportunities.
 *
 * Two integrity checks:
 *   GAP 1 – Claim Status is empty or "Unclaimed"
 *            → Rep was supposed to mark every assigned account; this is a data gap.
 *
 *   GAP 2 – Pending Target Account Owner is set but does NOT match Company Owner
 *            → Assignment mismatch; pending field points at a different rep than the owner.
 *
 * Usage: node scripts/data-integrity-audit-target-assignments.js
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const TOKEN = fs
  .readFileSync(path.join(__dirname, "..", ".env"), "utf8")
  .match(/HUBSPOT_ACCESS_TOKEN=(.+)/)[1]
  .trim();

const COMPANY_OWNER_PROP  = "hubspot_owner_id";
const PENDING_OWNER_PROP  = "pending_target_account_owner";
const CLAIM_STATUS_PROP   = "account_claim_status";
const LIFECYCLE_PROP      = "lifecyclestage";

// ─── HTTP / rate-limit helpers ─────────────────────────────────────────────

let inFlight = 0;
const MAX_CONCURRENT = 8;
let requestQueue = [];

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
            reject(new Error(`HTTP ${res.statusCode}: ${d.substring(0, 500)}`));
          }
        });
      });
      req.on("error", (e) => { inFlight--; drainQueue(); reject(e); });
      if (body) req.write(JSON.stringify(body));
      req.end();
    };
    if (inFlight < MAX_CONCURRENT) run();
    else requestQueue.push(run);
  });
}

function drainQueue() {
  while (requestQueue.length > 0 && inFlight < MAX_CONCURRENT) {
    requestQueue.shift()();
  }
}

async function searchAll(objectType, filterGroups, properties) {
  const all = [];
  let after;
  for (let i = 0; i < 300; i++) {
    const body = { filterGroups, properties, limit: 100 };
    if (after) body.after = after;
    const res = await hubspot("POST", `/crm/v3/objects/${objectType}/search`, body);
    all.push(...(res.results || []));
    if (!res.paging?.next?.after) break;
    after = res.paging.next.after;
  }
  return all;
}

// Chunk an array into sub-arrays of at most `size` elements
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ─── Deal association helpers ───────────────────────────────────────────────

/**
 * Returns a Set of company IDs that have at least one open (non-closed) deal.
 */
async function getCompaniesWithOpenDeals(companyIds) {
  const hasOpenDeal = new Set();
  if (companyIds.length === 0) return hasOpenDeal;

  // Step 1: batch-read company→deal associations (100 per call)
  const dealIdsByCompany = {}; // companyId → Set<dealId>
  const chunks = chunk(companyIds, 100);
  for (const batch of chunks) {
    const body = { inputs: batch.map((id) => ({ id })) };
    let res;
    try {
      res = await hubspot("POST", "/crm/v4/associations/companies/deals/batch/read", body);
    } catch (e) {
      // If the portal has no deals at all this endpoint may return 404; treat as no associations
      if (e.message.includes("404")) break;
      throw e;
    }
    for (const result of res.results || []) {
      const cid = String(result.from?.id || "");
      if (!cid) continue;
      if (!dealIdsByCompany[cid]) dealIdsByCompany[cid] = new Set();
      for (const to of result.to || []) {
        if (to.toObjectId) dealIdsByCompany[cid].add(String(to.toObjectId));
      }
    }
  }

  // Step 2: collect all unique deal IDs
  const allDealIds = [...new Set(Object.values(dealIdsByCompany).flatMap((s) => [...s]))];
  if (allDealIds.length === 0) return hasOpenDeal;

  // Step 3: batch-read deal properties to find open ones (hs_is_closed = false)
  const openDealIds = new Set();
  for (const batch of chunk(allDealIds, 100)) {
    const body = { inputs: batch.map((id) => ({ id })), properties: ["hs_is_closed", "dealstage"] };
    let res;
    try {
      res = await hubspot("POST", "/crm/v3/objects/deals/batch/read", body);
    } catch (e) {
      if (e.message.includes("404")) break;
      throw e;
    }
    for (const deal of res.results || []) {
      const isClosed = (deal.properties?.hs_is_closed || "").toLowerCase();
      if (isClosed !== "true") openDealIds.add(String(deal.id));
    }
  }

  // Step 4: mark companies that have any open deal
  for (const [cid, dealIds] of Object.entries(dealIdsByCompany)) {
    for (const did of dealIds) {
      if (openDealIds.has(did)) { hasOpenDeal.add(cid); break; }
    }
  }

  return hasOpenDeal;
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("  Data Integrity Audit: Target Account Assignments");
  console.log("  Scope: non-customers · no open opportunities · target accounts");
  console.log("=".repeat(70) + "\n");

  // 0. Owner map (id → name)
  const ownersRes = await hubspot("GET", "/crm/v3/owners?limit=500");
  const owners = (ownersRes.results || []).reduce((acc, o) => {
    acc[String(o.id)] = (o.firstName && o.lastName)
      ? `${o.firstName} ${o.lastName}`
      : (o.email || String(o.id));
    return acc;
  }, {});

  function ownerName(id) { return id ? (owners[String(id)] || String(id)) : "(none)"; }

  // 1. Fetch all target accounts that are NOT customers
  //    HubSpot search: hs_is_target_account = true AND lifecyclestage != customer
  console.log("  Fetching target accounts (excluding customers)...");
  const targetAccounts = await searchAll(
    "companies",
    [
      {
        filters: [
          { propertyName: "hs_is_target_account", operator: "EQ",      value: "true"     },
          { propertyName: LIFECYCLE_PROP,          operator: "NEQ",     value: "customer" },
        ],
      },
      // Also capture accounts where lifecyclestage is not set at all (NOT_IN handled separately below)
    ],
    ["name", COMPANY_OWNER_PROP, PENDING_OWNER_PROP, CLAIM_STATUS_PROP, LIFECYCLE_PROP]
  );

  // Also pull target accounts where lifecycle stage has no value (not set)
  const targetAccountsNoLifecycle = await searchAll(
    "companies",
    [
      {
        filters: [
          { propertyName: "hs_is_target_account", operator: "EQ",           value: "true" },
          { propertyName: LIFECYCLE_PROP,          operator: "NOT_HAS_PROPERTY"            },
        ],
      },
    ],
    ["name", COMPANY_OWNER_PROP, PENDING_OWNER_PROP, CLAIM_STATUS_PROP, LIFECYCLE_PROP]
  );

  // Merge, deduplicate by id
  const seen = new Set();
  const allNonCustomer = [];
  for (const c of [...targetAccounts, ...targetAccountsNoLifecycle]) {
    if (!seen.has(c.id)) { seen.add(c.id); allNonCustomer.push(c); }
  }
  console.log(`  Non-customer target accounts: ${allNonCustomer.length}`);

  // 2. Find which of these have open deals → exclude them
  console.log("  Checking deal associations for open opportunities...");
  const allIds = allNonCustomer.map((c) => c.id);
  const companiesWithOpenDeals = await getCompaniesWithOpenDeals(allIds);
  console.log(`  Accounts with at least one open opportunity: ${companiesWithOpenDeals.size}`);

  const inScope = allNonCustomer.filter((c) => !companiesWithOpenDeals.has(c.id));
  console.log(`  In-scope accounts (non-customer, no open opps): ${inScope.length}\n`);

  // 3. Parse properties
  function str(val) { return (val != null ? String(val).trim() : ""); }

  const records = inScope.map((c) => {
    const p  = c.properties || {};
    const owner   = str(p[COMPANY_OWNER_PROP]);
    const pending = str(p[PENDING_OWNER_PROP]);
    const claim   = str(p[CLAIM_STATUS_PROP]);
    return { id: c.id, name: str(p.name) || c.id, owner, pending, claim };
  });

  // ── GAP 1: Claim Status is empty or "Unclaimed" AND pending ≠ owner ─────
  // Empty/Unclaimed is acceptable if the Pending Target Account Owner matches
  // the Company Owner — the assignment is consistent even without an explicit
  // claim. It's only a gap when those two fields don't align (or pending is
  // missing), meaning we can't confirm the account is correctly placed.
  const gap1 = records.filter((r) => {
    if (!r.owner) return false; // no owner assigned — no rep to hold accountable
    if (r.claim !== "" && r.claim !== "Unclaimed") return false; // Claimed/Unsure → fine
    // Empty or Unclaimed: only a gap if pending doesn't match owner
    return r.pending !== r.owner;
  });

  // ── GAP 2: Pending ≠ Company Owner (when Pending is set) ────────────────
  const gap2 = records.filter((r) => r.pending !== "" && r.pending !== r.owner);

  // ── Breakdown for GAP 1 by rep ──────────────────────────────────────────
  const gap1ByRep = {};
  gap1.forEach((r) => {
    if (!gap1ByRep[r.owner]) gap1ByRep[r.owner] = { empty: 0, unclaimed: 0, accounts: [] };
    if (r.claim === "") gap1ByRep[r.owner].empty++;
    else                gap1ByRep[r.owner].unclaimed++;
    gap1ByRep[r.owner].accounts.push(r);
  });

  const gap2ByRep = {};
  gap2.forEach((r) => {
    const key = r.owner || "(no owner)";
    if (!gap2ByRep[key]) gap2ByRep[key] = [];
    gap2ByRep[key].push(r);
  });

  // ─── Report ─────────────────────────────────────────────────────────────

  console.log("═".repeat(70));
  console.log("  GAP 1 — Claim Status missing or Unclaimed");
  console.log("  (Rep was assigned the account but never properly marked claim status)");
  console.log("═".repeat(70));
  console.log(`  Accounts flagged: ${gap1.length}\n`);

  if (gap1.length === 0) {
    console.log("  ✓ No gaps. Every assigned account has Claimed or Unsure.\n");
  } else {
    // Summary by rep
    const repIds1 = Object.keys(gap1ByRep).sort((a, b) => {
      const total = (g) => (gap1ByRep[g]?.empty || 0) + (gap1ByRep[g]?.unclaimed || 0);
      return total(b) - total(a);
    });
    console.log(
      "  " + "Rep".padEnd(26) +
      "Empty".padStart(8) + "Unclaimed".padStart(12) + "Total".padStart(8)
    );
    console.log("  " + "-".repeat(54));
    for (const ownerId of repIds1) {
      const g = gap1ByRep[ownerId];
      const total = g.empty + g.unclaimed;
      console.log(
        "  " + ownerName(ownerId).substring(0, 24).padEnd(26) +
        String(g.empty).padStart(8) +
        String(g.unclaimed).padStart(12) +
        String(total).padStart(8)
      );
    }
    console.log("  " + "-".repeat(54));
    const totEmpty     = gap1.filter((r) => r.claim === "").length;
    const totUnclaimed = gap1.filter((r) => r.claim === "Unclaimed").length;
    console.log(
      "  " + "TOTAL".padEnd(26) +
      String(totEmpty).padStart(8) +
      String(totUnclaimed).padStart(12) +
      String(gap1.length).padStart(8)
    );

    // Detail list
    console.log("\n  Detail:");
    console.log("  " + "-".repeat(70));
    for (const ownerId of repIds1) {
      console.log(`\n  Rep: ${ownerName(ownerId)}`);
      for (const r of gap1ByRep[ownerId].accounts) {
        const claimLabel = r.claim === "" ? "(empty)" : r.claim;
        const pendingLabel = r.pending ? ownerName(r.pending) : "(none)";
        console.log(
          `    [${r.id}]  ${r.name.substring(0, 40).padEnd(42)}` +
          `claim=${claimLabel.padEnd(12)}  pending=${pendingLabel}`
        );
      }
    }
    console.log("");
  }

  console.log("═".repeat(70));
  console.log("  GAP 2 — Pending Target Account Owner ≠ Company Owner");
  console.log("  (Pending field points at a different rep than the current owner)");
  console.log("═".repeat(70));
  console.log(`  Accounts flagged: ${gap2.length}\n`);

  if (gap2.length === 0) {
    console.log("  ✓ No mismatches. Every set Pending owner matches the Company Owner.\n");
  } else {
    const repIds2 = Object.keys(gap2ByRep).sort((a, b) => gap2ByRep[b].length - gap2ByRep[a].length);
    console.log("  " + "Company Owner".padEnd(26) + "Count".padStart(8));
    console.log("  " + "-".repeat(34));
    for (const ownerId of repIds2) {
      console.log("  " + ownerName(ownerId).substring(0, 24).padEnd(26) + String(gap2ByRep[ownerId].length).padStart(8));
    }
    console.log("  " + "-".repeat(34));
    console.log("  " + "TOTAL".padEnd(26) + String(gap2.length).padStart(8));

    // Detail list
    console.log("\n  Detail:");
    console.log("  " + "-".repeat(70));
    for (const ownerId of repIds2) {
      console.log(`\n  Company Owner: ${ownerName(ownerId)}`);
      for (const r of gap2ByRep[ownerId]) {
        console.log(
          `    [${r.id}]  ${r.name.substring(0, 38).padEnd(40)}` +
          `  pending=${ownerName(r.pending)}`
        );
      }
    }
    console.log("");
  }

  // ── Summary ─────────────────────────────────────────────────────────────
  console.log("═".repeat(70));
  console.log("  SUMMARY");
  console.log("═".repeat(70));
  console.log(`  In-scope accounts (non-customer, no open opps): ${inScope.length}`);
  console.log(`  GAP 1 – Missing/Unclaimed claim status:         ${gap1.length}`);
  console.log(`  GAP 2 – Pending ≠ Company Owner:               ${gap2.length}`);
  console.log(`  Both gaps:                                      ${gap1.filter((r) => gap2.some((g) => g.id === r.id)).length}`);
  console.log(`  Any gap:                                        ${new Set([...gap1.map((r) => r.id), ...gap2.map((r) => r.id)]).size}`);
  console.log(`  Clean (no gaps):                                ${inScope.length - new Set([...gap1.map((r) => r.id), ...gap2.map((r) => r.id)]).size}`);
  console.log("");
}

main().catch((e) => {
  console.error("\nFatal error:", e.message);
  process.exit(1);
});
