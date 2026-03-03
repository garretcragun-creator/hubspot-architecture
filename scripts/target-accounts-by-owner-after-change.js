#!/usr/bin/env node
/**
 * Target Account Count by Owner (After Pending-Owner Copy)
 * --------------------------------------------------------
 * Reports how many target accounts each owner will own AFTER copying
 * Pending Target Account Owner → Company owner (the 40-company update).
 * Excludes:
 *   - Target accounts that have an open opportunity (deal with no closedate)
 *   - Target accounts that are current customers (lifecyclestage = customer)
 *   - Target accounts where Account Claim Status = Unclaimed (unassigned / don't want)
 *
 * Usage: node scripts/target-accounts-by-owner-after-change.js
 * Requires: .env with HUBSPOT_ACCESS_TOKEN
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const TOKEN = fs
  .readFileSync(path.join(__dirname, "..", ".env"), "utf8")
  .match(/HUBSPOT_ACCESS_TOKEN=(.+)/)[1]
  .trim();

const PENDING_OWNER_PROP = "pending_target_account_owner";
const COMPANY_OWNER_PROP = "hubspot_owner_id";
const CLAIM_STATUS_PROP = "account_claim_status";
const UNCLAIMED_VALUES = ["Unclaimed"];

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
            reject(new Error(`HTTP ${res.statusCode}: ${d.substring(0, 400)}`));
          }
        });
      });
      req.on("error", (e) => {
        inFlight--;
        drainQueue();
        reject(e);
      });
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
  for (let i = 0; i < 500; i++) {
    const body = { filterGroups, properties, limit: 100 };
    if (after) body.after = after;
    const res = await hubspot("POST", `/crm/v3/objects/${objectType}/search`, body);
    const results = res.results || [];
    all.push(...results);
    if (!res.paging?.next?.after) break;
    after = res.paging.next.after;
  }
  return all;
}

async function main() {
  console.log("\n  Target accounts per owner (after Pending copy + unassign Unclaimed)");
  console.log("  Excluding: open opp, customer, or claim status = Unclaimed\n");

  // 1. Owners (for names)
  const ownersRes = await hubspot("GET", "/crm/v3/owners?limit=500");
  const owners = (ownersRes.results || []).reduce((acc, o) => {
    acc[String(o.id)] = o.firstName && o.lastName ? `${o.firstName} ${o.lastName}` : o.email || o.id;
    return acc;
  }, {});

  // 2. All target accounts with owner fields, lifecyclestage, and claim status
  const targetAccounts = await searchAll(
    "companies",
    [{ filters: [{ propertyName: "hs_is_target_account", operator: "EQ", value: "true" }] }],
    ["name", COMPANY_OWNER_PROP, PENDING_OWNER_PROP, "lifecyclestage", CLAIM_STATUS_PROP]
  );

  // Owner after change: hubspot_owner_id if set, else pending_target_account_owner
  const companiesWithOwner = targetAccounts
    .map((c) => {
      const props = c.properties || {};
      const ownerId = props[COMPANY_OWNER_PROP] || props[PENDING_OWNER_PROP];
      if (ownerId === undefined || ownerId === null || String(ownerId).trim() === "") return null;
      const claimStatus = (props[CLAIM_STATUS_PROP] || "").trim();
      const isUnclaimed = UNCLAIMED_VALUES.some((u) => claimStatus === u || claimStatus.toLowerCase() === u.toLowerCase());
      return {
        id: c.id,
        name: props.name,
        ownerId: String(ownerId).trim(),
        lifecyclestage: (props.lifecyclestage || "").toLowerCase(),
        isUnclaimed,
      };
    })
    .filter(Boolean);

  // 3. Companies that have an open opportunity (deal with no closedate)
  const openDeals = await searchAll(
    "deals",
    [{ filters: [{ propertyName: "closedate", operator: "NOT_HAS_PROPERTY" }] }],
    ["dealname"]
  );
  const openDealIds = openDeals.map((d) => d.id);

  const companyIdsWithOpenOpp = new Set();
  if (openDealIds.length > 0) {
    for (let i = 0; i < openDealIds.length; i += 100) {
      const batch = openDealIds.slice(i, i + 100);
      const body = { inputs: batch.map((id) => ({ id: String(id) })) };
      const assoc = await hubspot("POST", "/crm/v4/associations/deals/companies/batch/read", body);
      for (const r of assoc.results || []) {
        for (const to of r.to || []) {
          if (to.toObjectId != null) companyIdsWithOpenOpp.add(String(to.toObjectId));
        }
      }
    }
  }

  // 4. Exclude: current customer OR has open opportunity OR claim status = Unclaimed
  const excludedCustomer = companiesWithOwner.filter((c) => c.lifecyclestage === "customer");
  const excludedOpenOpp = companiesWithOwner.filter((c) => companyIdsWithOpenOpp.has(String(c.id)));
  const excludedUnclaimed = companiesWithOwner.filter((c) => c.isUnclaimed);
  const excluded = new Set([
    ...excludedCustomer.map((c) => c.id),
    ...excludedOpenOpp.map((c) => c.id),
    ...excludedUnclaimed.map((c) => c.id),
  ]);

  const included = companiesWithOwner.filter((c) => !excluded.has(c.id));

  // 5. Count by owner
  const countByOwner = {};
  for (const c of included) {
    countByOwner[c.ownerId] = (countByOwner[c.ownerId] || 0) + 1;
  }

  // Sort by count descending, then by owner name
  const rows = Object.entries(countByOwner).map(([ownerId, count]) => ({
    ownerId,
    name: owners[ownerId] || ownerId,
    count,
  }));
  rows.sort((a, b) => (b.count !== a.count ? b.count - a.count : (a.name || "").localeCompare(b.name || "")));

  const total = rows.reduce((s, r) => s + r.count, 0);

  console.log("  Open deals (no closedate) used for exclusion:", openDealIds.length);
  console.log("  Companies with open opp (excluded):", companyIdsWithOpenOpp.size);
  console.log("  Target accounts excluded as customer:", excludedCustomer.length);
  console.log("  Target accounts excluded (claim = Unclaimed):", excludedUnclaimed.length);
  console.log("  Target accounts excluded (open opp or customer or Unclaimed):", excluded.size);
  console.log("  Target accounts included (counted per owner):", included.length);
  console.log("");

  console.log("  Count by owner (excl. open opp, customer, Unclaimed):");
  console.log("  " + "-".repeat(50));
  for (const r of rows) {
    console.log("    " + String(r.count).padStart(5) + "  " + (r.name || r.ownerId));
  }
  console.log("  " + "-".repeat(50));
  console.log("    " + String(total).padStart(5) + "  TOTAL");
  console.log("");
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
