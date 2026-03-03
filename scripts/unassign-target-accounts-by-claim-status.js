#!/usr/bin/env node
/**
 * Unassign Target Accounts by Claim Status
 * ----------------------------------------
 * Clears the company owner (hubspot_owner_id) for target accounts where
 * "Target account claim status" indicates they don't want the account
 * (e.g. Released, Declined).
 *
 * Usage:
 *   node scripts/unassign-target-accounts-by-claim-status.js           # dry-run
 *   node scripts/unassign-target-accounts-by-claim-status.js --commit  # execute
 *
 * Requires: .env with HUBSPOT_ACCESS_TOKEN
 *
 * "Target account claim status" — in this portal the property is "Account Claim Status"
 *   (internal name: account_claim_status). Values: Unclaimed, Claimed, Unsure.
 *   We treat "Unclaimed" as don't want; add "Unsure" to RELEASE_VALUES if desired.
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const TOKEN = fs
  .readFileSync(path.join(__dirname, "..", ".env"), "utf8")
  .match(/HUBSPOT_ACCESS_TOKEN=(.+)/)[1]
  .trim();

const COMMIT = process.argv.includes("--commit");

// Account Claim Status — internal name (label: "Account Claim Status")
const CLAIM_STATUS_PROP = "account_claim_status";
// Values that mean "don't want the account" (match API option value exactly; case-sensitive in HubSpot).
const RELEASE_VALUES = ["Unclaimed"];

const COMPANY_OWNER_PROP = "hubspot_owner_id";

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

function isReleaseStatus(value) {
  if (value === undefined || value === null) return false;
  const v = String(value).trim();
  return RELEASE_VALUES.includes(v) || RELEASE_VALUES.some((r) => v.toLowerCase() === r.toLowerCase());
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
  console.log("  Unassign target accounts by claim status");
  console.log("  " + mode);
  console.log("=".repeat(60));
  console.log("\n  Claim status values treated as 'don't want':");
  RELEASE_VALUES.forEach((v) => console.log("    - " + v));
  console.log("");

  if (!COMMIT) {
    console.log("  DRY-RUN: no changes will be written. Use --commit to execute.\n");
  }

  // Target accounts that HAVE a company owner (we only unassign assigned ones)
  const filterGroups = [
    {
      filters: [
        { propertyName: "hs_is_target_account", operator: "EQ", value: "true" },
        { propertyName: COMPANY_OWNER_PROP, operator: "HAS_PROPERTY" },
        { propertyName: CLAIM_STATUS_PROP, operator: "HAS_PROPERTY" },
      ],
    },
  ];
  const properties = ["name", COMPANY_OWNER_PROP, CLAIM_STATUS_PROP];

  let companies;
  try {
    companies = await searchAll("companies", filterGroups, properties);
  } catch (e) {
    if (e.message.includes("property") || e.message.includes("Invalid") || e.message.includes("404")) {
      console.error("  Error: Could not find property '" + CLAIM_STATUS_PROP + "'.");
      console.error("  Check the internal name in HubSpot: Settings → Properties → Companies.\n");
    }
    throw e;
  }

  const toUnassign = companies.filter((c) => {
    const val = (c.properties || {})[CLAIM_STATUS_PROP];
    return isReleaseStatus(val);
  });

  console.log("  Target accounts with an owner and a claim status: " + companies.length);
  console.log("  Of those, claim status = 'don't want' (will unassign): " + toUnassign.length);

  if (toUnassign.length === 0) {
    console.log("\n  Nothing to unassign. Exiting.\n");
    return;
  }

  // Show distinct claim status values in the set we're unassigning (for verification)
  const statusCounts = {};
  toUnassign.forEach((c) => {
    const v = (c.properties || {})[CLAIM_STATUS_PROP] || "";
    statusCounts[v] = (statusCounts[v] || 0) + 1;
  });
  console.log("\n  Claim status values in this set:");
  Object.entries(statusCounts).forEach(([val, count]) => console.log("    " + count + "  " + val));

  console.log("\n  Sample of companies to unassign:");
  toUnassign.slice(0, 10).forEach((c) => {
    const name = (c.properties || {}).name || c.id;
    const status = (c.properties || {})[CLAIM_STATUS_PROP] || "";
    console.log("    " + c.id + "  " + name + "  (" + status + ")");
  });
  if (toUnassign.length > 10) {
    console.log("    ... and " + (toUnassign.length - 10) + " more.");
  }

  if (COMMIT && toUnassign.length > 0) {
    console.log("\n  Unassigning " + toUnassign.length + " companies (clearing hubspot_owner_id)...");
    const inputs = toUnassign.map((c) => ({
      id: c.id,
      properties: { [COMPANY_OWNER_PROP]: "" },
    }));
    for (let i = 0; i < inputs.length; i += 100) {
      const batch = inputs.slice(i, i + 100);
      await hubspot("POST", "/crm/v3/objects/companies/batch/update", { inputs: batch });
    }
    console.log("  Done.\n");
  } else if (toUnassign.length > 0) {
    console.log("\n  Run with --commit to unassign these companies.\n");
  }
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
