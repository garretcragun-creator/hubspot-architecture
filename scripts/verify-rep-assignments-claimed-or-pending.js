#!/usr/bin/env node
/**
 * Verify: every assigned target account is either Claimed or assigned via Pending
 * -----------------------------------------------------------------------------
 * For each target account with a company owner, checks:
 *   - Either account_claim_status = Claimed (rep claimed it), OR
 *   - pending_target_account_owner = current company owner (assigned via pending)
 * Lists any accounts that don't meet either condition.
 *
 * Usage: node scripts/verify-rep-assignments-claimed-or-pending.js
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
  console.log("\n  Verify: Reps only on Claimed or Pending-assigned accounts\n");

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

  const withOwner = targetAccounts.filter((c) => {
    const v = (c.properties || {})[COMPANY_OWNER_PROP];
    return v != null && String(v).trim() !== "";
  });

  const ok = [];
  const notOk = [];

  withOwner.forEach((c) => {
    const p = c.properties || {};
    const owner = String(p[COMPANY_OWNER_PROP]).trim();
    const claim = (p[CLAIM_STATUS_PROP] != null ? String(p[CLAIM_STATUS_PROP]).trim() : "");
    const pending = (p[PENDING_OWNER_PROP] != null ? String(p[PENDING_OWNER_PROP]).trim() : "");

    const isClaimed = claim === "Claimed";
    const isAssignedViaPending = pending === owner;

    if (isClaimed || isAssignedViaPending) {
      ok.push({ id: c.id, name: p.name, owner, ownerName: owners[owner], claim, pending });
    } else {
      notOk.push({ id: c.id, name: p.name, owner, ownerName: owners[owner], claim, pending });
    }
  });

  console.log("  Target accounts with a company owner:", withOwner.length);
  console.log("  OK (Claimed OR assigned via Pending):", ok.length);
  console.log("  Not OK (owner is not Claimed and not Pending for that rep):", notOk.length);
  console.log("");

  if (notOk.length > 0) {
    console.log("  Accounts that need attention (assigned but not Claimed and not Pending=owner):");
    console.log("  " + "-".repeat(80));
    notOk.forEach((c) => {
      console.log("    " + c.id + "  " + (c.name || "(no name)").substring(0, 40) + "  owner=" + (c.ownerName || c.owner) + "  claim=" + (c.claim || "(empty)") + "  pending=" + (c.pending ? owners[c.pending] || c.pending : "(empty)"));
    });
    console.log("");
    console.log("  >>> Not good to go. Unassign these or set Pending to the current owner / set Claimed.");
    console.log("");
  } else {
    console.log("  >>> Good to go. Every assigned target account is either Claimed or assigned via Pending Target Account Owner.");
    console.log("");
  }
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
