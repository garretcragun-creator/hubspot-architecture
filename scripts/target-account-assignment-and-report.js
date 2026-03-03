#!/usr/bin/env node
/**
 * Target Account Assignment: Unclaim + Pending → Owner, then report
 * ------------------------------------------------------------------
 * 1. Pull all target accounts.
 * 2. Accounts with current owner:
 *    - Claimed → leave as is.
 *    - Unclaimed → unassign (clear company owner).
 *    - Unsure → leave for now.
 * 3. For accounts with no company owner (after step 2), set company owner
 *    = Pending Target Account Owner.
 * 4. Output table: Rep | Claimed Accounts | New March Targets | Total Targets
 *
 * Usage:
 *   node scripts/target-account-assignment-and-report.js           # dry-run
 *   node scripts/target-account-assignment-and-report.js --commit  # execute
 *
 * Requires: .env with HUBSPOT_ACCESS_TOKEN
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const TOKEN = fs
  .readFileSync(path.join(__dirname, "..", ".env"), "utf8")
  .match(/HUBSPOT_ACCESS_TOKEN=(.+)/)[1]
  .trim();

const COMMIT = process.argv.includes("--commit");

const COMPANY_OWNER_PROP = "hubspot_owner_id";
const PENDING_OWNER_PROP = "pending_target_account_owner";
const CLAIM_STATUS_PROP = "account_claim_status";

const CLAIMED = "Claimed";
const UNCLAIMED = "Unclaimed";
const UNSURE = "Unsure";

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

function normClaimStatus(val) {
  if (val === undefined || val === null) return "";
  return String(val).trim();
}

async function main() {
  const mode = COMMIT ? "LIVE" : "DRY-RUN";
  console.log("\n" + "=".repeat(60));
  console.log("  Target Account Assignment: Unclaim + Pending → Owner");
  console.log("  " + mode);
  console.log("=".repeat(60));
  if (!COMMIT) {
    console.log("\n  DRY-RUN: no changes written. Use --commit to execute.\n");
  }

  // Owners (for names and validation)
  const ownersRes = await hubspot("GET", "/crm/v3/owners?limit=500");
  const owners = (ownersRes.results || []).reduce((acc, o) => {
    acc[String(o.id)] = o.firstName && o.lastName ? `${o.firstName} ${o.lastName}` : o.email || o.id;
    return acc;
  }, {});
  const validOwnerIds = new Set(Object.keys(owners));

  // 1. All target accounts with owner, pending owner, claim status
  const targetAccounts = await searchAll(
    "companies",
    [{ filters: [{ propertyName: "hs_is_target_account", operator: "EQ", value: "true" }] }],
    ["name", COMPANY_OWNER_PROP, PENDING_OWNER_PROP, CLAIM_STATUS_PROP]
  );

  console.log("  Total target accounts:", targetAccounts.length);

  const withOwner = targetAccounts.filter((c) => {
    const v = (c.properties || {})[COMPANY_OWNER_PROP];
    return v !== undefined && v !== null && String(v).trim() !== "";
  });
  const withClaim = targetAccounts.map((c) => {
    const p = c.properties || {};
    const claim = normClaimStatus(p[CLAIM_STATUS_PROP]);
    const currentOwner = (p[COMPANY_OWNER_PROP] != null && String(p[COMPANY_OWNER_PROP]).trim() !== "")
      ? String(p[COMPANY_OWNER_PROP]).trim()
      : null;
    const pendingOwner = (p[PENDING_OWNER_PROP] != null && String(p[PENDING_OWNER_PROP]).trim() !== "")
      ? String(p[PENDING_OWNER_PROP]).trim()
      : null;
    return {
      id: c.id,
      name: p.name,
      currentOwner,
      pendingOwner,
      claimStatus: claim,
    };
  });

  // 2. Phase A: Unassign where owner set AND claim = Unclaimed
  const toUnassign = withClaim.filter((c) => c.currentOwner && c.claimStatus === UNCLAIMED);
  console.log("  With owner + Unclaimed (will unassign):", toUnassign.length);

  if (COMMIT && toUnassign.length > 0) {
    for (let i = 0; i < toUnassign.length; i += 100) {
      const batch = toUnassign.slice(i, i + 100).map((c) => ({
        id: c.id,
        properties: { [COMPANY_OWNER_PROP]: "" },
      }));
      await hubspot("POST", "/crm/v3/objects/companies/batch/update", { inputs: batch });
    }
  }

  // After Phase A: "no owner" = never had owner OR we just unassigned them
  const unassignedAfterA = new Set(
    withClaim.filter((c) => !c.currentOwner || c.claimStatus === UNCLAIMED).map((c) => c.id)
  );

  // 3. Phase B: No owner (after A) + has Pending → set company owner = Pending. Track by owner for New March.
  const toAssignFromPending = withClaim.filter(
    (c) => unassignedAfterA.has(c.id) && c.pendingOwner && validOwnerIds.has(c.pendingOwner)
  );
  console.log("  Unassigned (after A) + Pending set (will assign):", toAssignFromPending.length);

  const newMarchByOwner = {};
  toAssignFromPending.forEach((c) => {
    newMarchByOwner[c.pendingOwner] = (newMarchByOwner[c.pendingOwner] || 0) + 1;
  });

  if (COMMIT && toAssignFromPending.length > 0) {
    for (let i = 0; i < toAssignFromPending.length; i += 100) {
      const batch = toAssignFromPending.slice(i, i + 100).map((c) => ({
        id: c.id,
        properties: { [COMPANY_OWNER_PROP]: c.pendingOwner },
      }));
      await hubspot("POST", "/crm/v3/objects/companies/batch/update", { inputs: batch });
    }
  }

  // 4. Report: use current state so Total matches HubSpot. Re-fetch if we made changes.
  let forReport = withClaim;
  if (COMMIT && (toUnassign.length > 0 || toAssignFromPending.length > 0)) {
    const refetch = await searchAll(
      "companies",
      [{ filters: [{ propertyName: "hs_is_target_account", operator: "EQ", value: "true" }] }],
      [COMPANY_OWNER_PROP, PENDING_OWNER_PROP, CLAIM_STATUS_PROP]
    );
    forReport = refetch.map((c) => {
      const p = c.properties || {};
      const claim = normClaimStatus(p[CLAIM_STATUS_PROP]);
      const currentOwner = (p[COMPANY_OWNER_PROP] != null && String(p[COMPANY_OWNER_PROP]).trim() !== "")
        ? String(p[COMPANY_OWNER_PROP]).trim()
        : null;
      const pendingOwner = (p[PENDING_OWNER_PROP] != null && String(p[PENDING_OWNER_PROP]).trim() !== "")
        ? String(p[PENDING_OWNER_PROP]).trim()
        : null;
      return { id: c.id, currentOwner, pendingOwner, claimStatus: claim };
    });
  } else {
    // Dry-run: simulate final owner so Total matches what HubSpot would show after run
    forReport = withClaim.map((c) => {
      let finalOwner = c.currentOwner;
      if (c.claimStatus === UNCLAIMED) {
        finalOwner = c.pendingOwner || null;
      } else if (!c.currentOwner && c.pendingOwner) {
        finalOwner = c.pendingOwner;
      }
      return { id: c.id, currentOwner: finalOwner, pendingOwner: c.pendingOwner, claimStatus: c.claimStatus };
    });
  }

  // Total Targets = all target accounts with this owner (for reference)
  const totalByOwner = {};
  forReport.filter((c) => c.currentOwner).forEach((c) => {
    totalByOwner[c.currentOwner] = (totalByOwner[c.currentOwner] || 0) + 1;
  });
  // Claimed Accounts = claim=Claimed and that owner
  const claimedByOwner = {};
  forReport
    .filter((c) => c.claimStatus === CLAIMED && c.currentOwner)
    .forEach((c) => {
      claimedByOwner[c.currentOwner] = (claimedByOwner[c.currentOwner] || 0) + 1;
    });
  // New March = Pending Target Account Owner field: count per rep (from same report dataset)
  const newMarchByOwnerFromField = {};
  forReport.forEach((c) => {
    if (!c.pendingOwner || !validOwnerIds.has(c.pendingOwner)) return;
    newMarchByOwnerFromField[c.pendingOwner] = (newMarchByOwnerFromField[c.pendingOwner] || 0) + 1;
  });

  // All rep IDs that have Claimed or New March (from Pending field) or any assigned total
  const repIds = new Set([
    ...Object.keys(totalByOwner),
    ...Object.keys(claimedByOwner),
    ...Object.keys(newMarchByOwnerFromField),
  ]);

  const rows = [...repIds].map((ownerId) => {
    const claimed = claimedByOwner[ownerId] || 0;
    const newMarch = newMarchByOwnerFromField[ownerId] || 0;
    const total = totalByOwner[ownerId] || 0;
    return {
      ownerId,
      name: owners[ownerId] || ownerId,
      claimed,
      newMarch,
      total: claimed + newMarch, // Total = Claimed + New March (matches your view)
    };
  });
  rows.sort((a, b) => (b.total !== a.total ? b.total - a.total : (a.name || "").localeCompare(b.name || "")));

  // Table output (match image: Rep | Claimed Accounts | New March Targets | Total Targets)
  console.log("\n  " + "Rep".padEnd(22) + "Claimed Accounts".padStart(18) + "New March Targets".padStart(20) + "Total Targets".padStart(14));
  console.log("  " + "-".repeat(74));
  for (const r of rows) {
    const name = (r.name || r.ownerId).substring(0, 20);
    console.log("  " + name.padEnd(22) + String(r.claimed).padStart(18) + String(r.newMarch).padStart(20) + String(r.total).padStart(14));
  }
  console.log("  " + "-".repeat(74));
  const totClaimed = rows.reduce((s, r) => s + r.claimed, 0);
  const totNewMarch = rows.reduce((s, r) => s + r.newMarch, 0);
  const totTotal = rows.reduce((s, r) => s + r.total, 0);
  console.log("  " + "TOTAL".padEnd(22) + String(totClaimed).padStart(18) + String(totNewMarch).padStart(20) + String(totTotal).padStart(14));
  console.log("");
  console.log("  (New March = Pending Target Account Owner field. Total = Claimed + New March.)");
  console.log("");
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
