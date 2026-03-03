#!/usr/bin/env node
/**
 * Audit: What HubSpot actually has for target accounts (read-only)
 * ---------------------------------------------------------------
 * Fetches current state and prints per-owner counts and claim-status
 * breakdown so you can compare to the assignment report or to the UI.
 *
 * Usage: node scripts/audit-target-accounts-current-state.js
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const TOKEN = fs
  .readFileSync(path.join(__dirname, "..", ".env"), "utf8")
  .match(/HUBSPOT_ACCESS_TOKEN=(.+)/)[1]
  .trim();

const COMPANY_OWNER_PROP = "hubspot_owner_id";
const PENDING_OWNER_PROP = "pending_target_account_owner";
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
  console.log("\n  Audit: Target accounts in HubSpot (current state)\n");

  const ownersRes = await hubspot("GET", "/crm/v3/owners?limit=500");
  const owners = (ownersRes.results || []).reduce((acc, o) => {
    acc[String(o.id)] = o.firstName && o.lastName ? `${o.firstName} ${o.lastName}` : o.email || o.id;
    return acc;
  }, {});

  const targetAccounts = await searchAll(
    "companies",
    [{ filters: [{ propertyName: "hs_is_target_account", operator: "EQ", value: "true" }] }],
    ["name", COMPANY_OWNER_PROP, PENDING_OWNER_PROP, CLAIM_STATUS_PROP]
  );

  // Only those with an owner (what you see in "my target accounts" or by owner filter)
  const withOwner = targetAccounts.filter((c) => {
    const v = (c.properties || {})[COMPANY_OWNER_PROP];
    return v != null && String(v).trim() !== "";
  });

  const byOwner = {};
  const claimValuesSeen = new Set();

  withOwner.forEach((c) => {
    const ownerId = String((c.properties || {})[COMPANY_OWNER_PROP]).trim();
    const claim = ((c.properties || {})[CLAIM_STATUS_PROP] != null)
      ? String((c.properties || {})[CLAIM_STATUS_PROP]).trim()
      : "(empty)";
    claimValuesSeen.add(claim);
    if (!byOwner[ownerId]) {
      byOwner[ownerId] = { total: 0, Claimed: 0, Unclaimed: 0, Unsure: 0, "(empty)": 0, other: 0 };
    }
    byOwner[ownerId].total++;
    if (claim === "Claimed") byOwner[ownerId].Claimed++;
    else if (claim === "Unclaimed") byOwner[ownerId].Unclaimed++;
    else if (claim === "Unsure") byOwner[ownerId].Unsure++;
    else if (claim === "(empty)" || claim === "") byOwner[ownerId]["(empty)"]++;
    else byOwner[ownerId].other++;
  });

  const unassigned = targetAccounts.length - withOwner.length;
  console.log("  Total target accounts:", targetAccounts.length);
  console.log("  With a company owner:", withOwner.length);
  console.log("  Unassigned (no owner):", unassigned);
  console.log("  Claim status values seen in data:", [...claimValuesSeen].join(", ") || "(none)");
  console.log("");

  const repIds = Object.keys(byOwner).sort((a, b) => {
    const nameA = owners[a] || a;
    const nameB = owners[b] || b;
    return (byOwner[b].total - byOwner[a].total) || nameA.localeCompare(nameB);
  });

  console.log("  Per owner (what HubSpot has now):");
  console.log("  " + "Rep".padEnd(24) + "Total".padStart(8) + "Claimed".padStart(10) + "Unsure".padStart(8) + "Unclaimed".padStart(10) + "empty/other".padStart(12));
  console.log("  " + "-".repeat(72));
  for (const ownerId of repIds) {
    const r = byOwner[ownerId];
    const name = (owners[ownerId] || ownerId).substring(0, 22);
    const other = (r["(empty)"] || 0) + (r.other || 0);
    console.log(
      "  " + name.padEnd(24) +
      String(r.total).padStart(8) +
      String(r.Claimed).padStart(10) +
      String(r.Unsure).padStart(8) +
      String(r.Unclaimed).padStart(10) +
      String(other).padStart(12)
    );
  }
  console.log("  " + "-".repeat(72));
  const grandTotal = repIds.reduce((s, id) => s + byOwner[id].total, 0);
  console.log("  " + "TOTAL (assigned)".padEnd(24) + String(grandTotal).padStart(8));
  console.log("");
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
