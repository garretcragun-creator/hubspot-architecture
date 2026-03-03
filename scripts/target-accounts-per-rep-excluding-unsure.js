#!/usr/bin/env node
/**
 * Target accounts per rep, excluding Unsure + open opp + customer
 * --------------------------------------------------------------
 * Read-only. Counts target accounts by owner, excluding:
 *   - Account claim status = Unsure
 *   - Open opportunity (company has deal with no closedate)
 *   - Current customer (lifecyclestage = customer)
 *
 * Usage: node scripts/target-accounts-per-rep-excluding-unsure.js
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const TOKEN = fs
  .readFileSync(path.join(__dirname, "..", ".env"), "utf8")
  .match(/HUBSPOT_ACCESS_TOKEN=(.+)/)[1]
  .trim();

const COMPANY_OWNER_PROP = "hubspot_owner_id";
const CLAIM_STATUS_PROP = "account_claim_status";

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
  for (let i = 0; i < 300; i++) {
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
  console.log("\n  Target accounts per rep (excl. Unsure, open opp, customer)\n");

  const ownersRes = await hubspot("GET", "/crm/v3/owners?limit=500");
  const owners = (ownersRes.results || []).reduce((acc, o) => {
    acc[String(o.id)] = o.firstName && o.lastName ? `${o.firstName} ${o.lastName}` : o.email || o.id;
    return acc;
  }, {});

  const targetAccounts = await searchAll(
    "companies",
    [{ filters: [{ propertyName: "hs_is_target_account", operator: "EQ", value: "true" }] }],
    ["name", COMPANY_OWNER_PROP, CLAIM_STATUS_PROP, "lifecyclestage"]
  );

  const withOwner = targetAccounts
    .filter((c) => {
      const v = (c.properties || {})[COMPANY_OWNER_PROP];
      return v != null && String(v).trim() !== "";
    })
    .map((c) => {
      const p = c.properties || {};
      return {
        id: c.id,
        ownerId: String(p[COMPANY_OWNER_PROP]).trim(),
        claimStatus: (p[CLAIM_STATUS_PROP] != null ? String(p[CLAIM_STATUS_PROP]).trim() : ""),
        lifecyclestage: (p.lifecyclestage || "").toLowerCase(),
      };
    });

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
      const assoc = await hubspot("POST", "/crm/v4/associations/deals/companies/batch/read", {
        inputs: batch.map((id) => ({ id: String(id) })),
      });
      for (const r of assoc.results || []) {
        for (const to of r.to || []) {
          if (to.toObjectId != null) companyIdsWithOpenOpp.add(String(to.toObjectId));
        }
      }
    }
  }

  const excludedCustomer = withOwner.filter((c) => c.lifecyclestage === "customer");
  const excludedOpenOpp = withOwner.filter((c) => companyIdsWithOpenOpp.has(String(c.id)));
  const excludedUnsure = withOwner.filter((c) => c.claimStatus === "Unsure");

  const excludedIds = new Set([
    ...excludedCustomer.map((c) => c.id),
    ...excludedOpenOpp.map((c) => c.id),
    ...excludedUnsure.map((c) => c.id),
  ]);

  const included = withOwner.filter((c) => !excludedIds.has(c.id));

  const countByOwner = {};
  included.forEach((c) => {
    countByOwner[c.ownerId] = (countByOwner[c.ownerId] || 0) + 1;
  });

  const rows = Object.entries(countByOwner).map(([ownerId, count]) => ({
    ownerId,
    name: owners[ownerId] || ownerId,
    count,
  }));
  rows.sort((a, b) => (b.count !== a.count ? b.count - a.count : (a.name || "").localeCompare(b.name || "")));

  const total = rows.reduce((s, r) => s + r.count, 0);

  console.log("  Excluded: customer:", excludedCustomer.length, "| open opp:", excludedOpenOpp.length, "| Unsure:", excludedUnsure.length);
  console.log("  Included (counted per rep):", included.length);
  console.log("");
  console.log("  " + "Rep".padEnd(24) + "Count".padStart(8));
  console.log("  " + "-".repeat(34));
  for (const r of rows) {
    console.log("  " + (r.name || r.ownerId).substring(0, 22).padEnd(24) + String(r.count).padStart(8));
  }
  console.log("  " + "-".repeat(34));
  console.log("  " + "TOTAL".padEnd(24) + String(total).padStart(8));
  console.log("");
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
