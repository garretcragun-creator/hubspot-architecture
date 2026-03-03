#!/usr/bin/env node
/**
 * Copy Pending Target Account Owner → Company Owner
 * -------------------------------------------------
 * For all target accounts that have NO company owner (hubspot_owner_id),
 * sets hubspot_owner_id to the value in "Pending Target Account Owner".
 *
 * Usage:
 *   node scripts/copy-pending-target-owner-to-company-owner.js           # dry-run (no writes)
 *   node scripts/copy-pending-target-owner-to-company-owner.js --commit  # execute updates
 *
 * Requires: .env with HUBSPOT_ACCESS_TOKEN
 *
 * Property: "Pending Target Account Owner" — internal name assumed to be
 *   pending_target_account_owner (custom company property). If your portal
 *   uses a different internal name, set PENDING_OWNER_PROP below.
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

// Source property: label "Pending Target Account Owner". Adjust internal name if different in your portal.
const PENDING_OWNER_PROP = "pending_target_account_owner";
const COMPANY_OWNER_PROP = "hubspot_owner_id";

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
            reject(new Error(`HTTP ${res.statusCode}: ${d.substring(0, 500)}`));
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

async function searchAll(objectType, filterGroups, properties) {
  const all = [];
  let after;
  for (let i = 0; i < 200; i++) {
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
  const mode = COMMIT ? "LIVE" : "DRY-RUN";
  console.log("\n" + "=".repeat(60));
  console.log("  Copy Pending Target Account Owner → Company Owner");
  console.log("  " + mode);
  console.log("=".repeat(60));

  if (!COMMIT) {
    console.log("\n  DRY-RUN: no changes will be written. Use --commit to execute.\n");
  }

  // 1. Fetch valid owner IDs for validation (optional but useful)
  let validOwnerIds = new Set();
  try {
    const ownersRes = await hubspot("GET", "/crm/v3/owners?limit=500");
    const owners = ownersRes.results || [];
    owners.forEach((o) => validOwnerIds.add(String(o.id)));
    console.log(`  Loaded ${validOwnerIds.size} HubSpot owner IDs for validation.\n`);
  } catch (e) {
    console.warn("  Could not load owners (validation skipped):", e.message);
  }

  // 2. Find target accounts with no company owner
  const filterGroups = [
    {
      filters: [
        { propertyName: "hs_is_target_account", operator: "EQ", value: "true" },
        { propertyName: COMPANY_OWNER_PROP, operator: "NOT_HAS_PROPERTY" },
      ],
    },
  ];
  const properties = ["name", COMPANY_OWNER_PROP, PENDING_OWNER_PROP];

  console.log("  Searching: companies where hs_is_target_account = true and hubspot_owner_id is unset...");
  let companies;
  try {
    companies = await searchAll("companies", filterGroups, properties);
  } catch (e) {
    if (e.message.includes("404") || e.message.includes("property") || e.message.includes("Invalid")) {
      console.error("\n  Error: Could not find company property '" + PENDING_OWNER_PROP + "'.");
      console.error("  If 'Pending Target Account Owner' has a different internal name in your portal,");
      console.error("  edit this script and set PENDING_OWNER_PROP to that internal name.\n");
    }
    throw e;
  }

  console.log("  Found " + companies.length + " unassigned target accounts.\n");

  if (companies.length === 0) {
    console.log("  Nothing to update. Exiting.\n");
    return;
  }

  const updates = [];
  const skipped = { noPending: 0, invalidOwner: 0 };

  for (const c of companies) {
    const pendingVal = (c.properties || {})[PENDING_OWNER_PROP];
    if (pendingVal === undefined || pendingVal === null || String(pendingVal).trim() === "") {
      skipped.noPending++;
      continue;
    }
    const ownerId = String(pendingVal).trim();
    if (validOwnerIds.size > 0 && !validOwnerIds.has(ownerId)) {
      skipped.invalidOwner++;
      console.log("  Skip (invalid owner ID): company " + c.id + " '" + (c.properties?.name || "") + "' → pending_owner='" + ownerId + "'");
      continue;
    }
    updates.push({
      id: c.id,
      properties: { [COMPANY_OWNER_PROP]: ownerId },
    });
  }

  console.log("  Companies to update (set Company owner = Pending Target Account Owner): " + updates.length);
  console.log("  Skipped (no Pending value): " + skipped.noPending);
  console.log("  Skipped (invalid owner ID): " + skipped.invalidOwner);

  if (updates.length > 0) {
    console.log("\n  Sample of companies that will be updated:");
    updates.slice(0, 10).forEach((u) => {
      const c = companies.find((x) => x.id === u.id);
      const name = (c && c.properties && c.properties.name) || u.id;
      console.log("    " + u.id + "  " + name + "  → owner " + u.properties[COMPANY_OWNER_PROP]);
    });
    if (updates.length > 10) {
      console.log("    ... and " + (updates.length - 10) + " more.");
    }
  }

  if (COMMIT && updates.length > 0) {
    console.log("\n  Applying " + updates.length + " company updates...");
    for (let i = 0; i < updates.length; i += 100) {
      const batch = updates.slice(i, i + 100);
      await hubspot("POST", "/crm/v3/objects/companies/batch/update", { inputs: batch });
    }
    console.log("  Done.\n");
  } else if (updates.length > 0) {
    console.log("\n  Run with --commit to apply these updates.\n");
  }
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
