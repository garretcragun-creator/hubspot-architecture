#!/usr/bin/env node
/**
 * Target Accounts February Report
 * Pulls from HubSpot API and reports by owner:
 * - Assigned target accounts worked in February
 * - Of those, how many had a discovery meeting set in February
 * - How many had a deal created in February
 * - Total pipeline from target accounts in February
 *
 * Usage: node scripts/target-accounts-feb-report.js [YYYY]
 * Default year: 2026 (or current year if in Feb)
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const TOKEN = fs
  .readFileSync(path.join(__dirname, "..", ".env"), "utf8")
  .match(/HUBSPOT_ACCESS_TOKEN=(.+)/)[1]
  .trim();

const YEAR = parseInt(process.argv[2] || "2026", 10);
const FEB_START = `${YEAR}-02-01T00:00:00.000Z`;
const FEB_END = `${YEAR}-02-29T23:59:59.999Z`;

// Lead pipeline: "Open" stage (internal id) — leads not in this stage are considered "worked"
const LEAD_STAGE_OPEN_ID = "new-stage-id";

function hubspot(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: "api.hubapi.com",
      path: urlPath,
      method,
      headers: {
        Authorization: "Bearer " + TOKEN,
        "Content-Type": "application/json",
      },
    };
    const req = https.request(opts, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => {
        if (res.statusCode === 429) {
          const wait = parseInt(res.headers["retry-after"] || "2", 10);
          return setTimeout(() => hubspot(method, urlPath, body).then(resolve, reject), wait * 1000);
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(d ? JSON.parse(d) : {});
        } else {
          reject(new Error(`${res.statusCode}: ${d.substring(0, 300)}`));
        }
      });
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function searchAll(objectType, filterGroups, properties, sort = "hs_lastmodifieddate") {
  const all = [];
  let after;
  for (let i = 0; i < 100; i++) {
    const body = { filterGroups, properties, limit: 100, sorts: [{ propertyName: sort, direction: "DESCENDING" }] };
    if (after) body.after = after;
    const res = await hubspot("POST", `/crm/v3/objects/${objectType}/search`, body);
    const results = res.results || [];
    all.push(...results);
    if (!res.paging?.next?.after) break;
    after = res.paging.next.after;
  }
  return all;
}

async function getAssociations(fromType, fromId, toType) {
  const res = await hubspot("GET", `/crm/v4/objects/${fromType}/${fromId}/associations/${toType}?limit=500`);
  return (res.results || []).map((r) => r.toObjectId);
}

function inFebruary(isoStr) {
  if (!isoStr) return false;
  const d = new Date(isoStr);
  return d.getUTCFullYear() === YEAR && d.getUTCMonth() === 1;
}

async function main() {
  console.log("\nFetching data from HubSpot...\n");

  // 1. Owners
  const ownersRes = await hubspot("GET", "/crm/v3/owners?limit=200");
  const owners = (ownersRes.results || []).reduce((acc, o) => {
    acc[o.id] = o.firstName && o.lastName ? `${o.firstName} ${o.lastName}` : o.email || o.id;
    return acc;
  }, {});

  // 2. Target accounts with an owner (assigned)
  const targetAccounts = await searchAll(
    "companies",
    [
      {
        filters: [
          { propertyName: "hs_is_target_account", operator: "EQ", value: "true" },
          { propertyName: "hubspot_owner_id", operator: "HAS_PROPERTY" },
        ],
      },
    ],
    ["name", "hubspot_owner_id", "hs_lastmodifieddate", "hs_object_id"]
  );

  const targetByOwner = {};
  const targetIds = new Set();
  for (const c of targetAccounts) {
    const id = c.id;
    const ownerId = c.properties.hubspot_owner_id || "";
    targetIds.add(id);
    if (!targetByOwner[ownerId]) targetByOwner[ownerId] = [];
    targetByOwner[ownerId].push({
      id,
      name: c.properties.name,
      hs_lastmodifieddate: c.properties.hs_lastmodifieddate,
    });
  }

  // 3. "Worked" = has at least one associated lead that is NOT in Open stage
  const companyToLeadIds = {};
  const allLeadIds = new Set();
  for (const c of targetAccounts) {
    const leadIds = await getAssociations("companies", c.id, "leads");
    if (leadIds.length) {
      companyToLeadIds[c.id] = leadIds;
      leadIds.forEach((lid) => allLeadIds.add(lid));
    }
  }

  const leadIdToStage = {};
  const leadChunks = [...allLeadIds];
  for (let i = 0; i < leadChunks.length; i += 100) {
    const chunk = leadChunks.slice(i, i + 100);
    const batch = await hubspot("POST", "/crm/v3/objects/leads/batch/read", {
      properties: ["hs_pipeline_stage"],
      inputs: chunk.map((id) => ({ id })),
    });
    for (const r of batch.results || []) {
      leadIdToStage[r.id] = (r.properties || {}).hs_pipeline_stage;
    }
  }

  const leadIdsNotOpen = new Set();
  for (const [lid, stage] of Object.entries(leadIdToStage)) {
    if (stage && stage !== LEAD_STAGE_OPEN_ID) leadIdsNotOpen.add(lid);
  }

  const workedInFebByOwner = {};
  const workedCompanyIds = new Set();
  for (const [ownerId, companies] of Object.entries(targetByOwner)) {
    const worked = companies.filter((c) => (companyToLeadIds[c.id] || []).some((lid) => leadIdsNotOpen.has(lid)));
    if (worked.length) {
      workedInFebByOwner[ownerId] = worked;
      worked.forEach((c) => workedCompanyIds.add(c.id));
    }
  }

  // 4. Meetings in February (discovery) associated to companies
  const meetingsInFeb = await searchAll(
    "meetings",
    [
      {
        filters: [
          { propertyName: "hs_meeting_start_time", operator: "GTE", value: Date.parse(FEB_START).toString() },
          { propertyName: "hs_meeting_start_time", operator: "LTE", value: Date.parse(FEB_END).toString() },
        ],
      },
    ],
    ["hs_object_id", "hs_meeting_start_time", "hs_activity_type", "hubspot_owner_id"],
    "hs_meeting_start_time"
  );

  const discoveryTypes = ["discovery call", "discovery", "demo call", "initial meeting"];
  const meetingIdsDiscovery = meetingsInFeb
    .filter((m) => {
      const t = (m.properties.hs_activity_type || "").toLowerCase();
      return !t || discoveryTypes.some((d) => t.includes(d));
    })
    .map((m) => m.id);

  const companyToMeetingsInFeb = {};
  for (const meetingId of meetingIdsDiscovery) {
    const companyIds = await getAssociations("meetings", meetingId, "companies");
    for (const cid of companyIds) {
      if (!companyToMeetingsInFeb[cid]) companyToMeetingsInFeb[cid] = [];
      companyToMeetingsInFeb[cid].push(meetingId);
    }
  }

  const companiesWithDiscoveryMeetingFeb = new Set(Object.keys(companyToMeetingsInFeb).filter((id) => workedCompanyIds.has(id)));

  const discoveryByOwner = {};
  for (const [ownerId, worked] of Object.entries(workedInFebByOwner)) {
    const withDiscovery = worked.filter((c) => companiesWithDiscoveryMeetingFeb.has(c.id));
    discoveryByOwner[ownerId] = withDiscovery.length;
  }

  // 5. Deals created in February
  const dealsInFeb = await searchAll(
    "deals",
    [
      {
        filters: [
          { propertyName: "createdate", operator: "GTE", value: Date.parse(FEB_START).toString() },
          { propertyName: "createdate", operator: "LTE", value: Date.parse(FEB_END).toString() },
        ],
      },
    ],
    ["hs_object_id", "amount", "createdate", "dealname", "hubspot_owner_id"],
    "createdate"
  );

  const dealToCompanies = {};
  for (const deal of dealsInFeb) {
    const companyIds = await getAssociations("deals", deal.id, "companies");
    dealToCompanies[deal.id] = companyIds;
  }

  const targetDealsInFeb = dealsInFeb.filter((d) => (dealToCompanies[d.id] || []).some((cid) => targetIds.has(cid)));

  const dealCountByOwner = {};
  const pipelineByOwner = {};
  for (const deal of targetDealsInFeb) {
    const ownerId = deal.properties.hubspot_owner_id || "";
    dealCountByOwner[ownerId] = (dealCountByOwner[ownerId] || 0) + 1;
    const amt = parseFloat(deal.properties.amount || "0") || 0;
    pipelineByOwner[ownerId] = (pipelineByOwner[ownerId] || 0) + amt;
  }

  const totalPipeline = targetDealsInFeb.reduce((s, d) => s + (parseFloat(d.properties.amount || "0") || 0), 0);

  // 6. Build report by owner
  const allOwnerIds = new Set([
    ...Object.keys(targetByOwner),
    ...Object.keys(workedInFebByOwner),
    ...Object.keys(dealCountByOwner),
  ]);

  const rows = [];
  for (const ownerId of allOwnerIds) {
    const name = owners[ownerId] || ownerId || "Unassigned";
    const assigned = (targetByOwner[ownerId] || []).length;
    const worked = (workedInFebByOwner[ownerId] || []).length;
    const discovery = discoveryByOwner[ownerId] ?? 0;
    const deals = dealCountByOwner[ownerId] ?? 0;
    const pipeline = pipelineByOwner[ownerId] ?? 0;
    rows.push({ name, ownerId, assigned, worked, discovery, deals, pipeline });
  }
  rows.sort((a, b) => (b.worked !== a.worked ? b.worked - a.worked : b.pipeline - a.pipeline));

  // Output
  const lines = [
    "# Target Accounts — February " + YEAR + " Report",
    "",
    "| Owner | Assigned target accounts | Worked | Discovery meeting set (Feb) | Deals created (Feb) | Pipeline (Feb) |",
    "|-------|--------------------------|--------|-----------------------------|---------------------|----------------|",
  ];

  let totWorked = 0,
    totDiscovery = 0,
    totDeals = 0,
    totPipe = 0;
  for (const r of rows) {
    lines.push(`| ${r.name} | ${r.assigned} | ${r.worked} | ${r.discovery} | ${r.deals} | ${r.pipeline.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })} |`);
    totWorked += r.worked;
    totDiscovery += r.discovery;
    totDeals += r.deals;
    totPipe += r.pipeline;
  }
  lines.push(`| **Total** | ${targetAccounts.length} | **${totWorked}** | **${totDiscovery}** | **${totDeals}** | **${totPipe.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}** |`);
  lines.push("");
  lines.push("**Definitions:**");
  lines.push("- **Assigned target accounts:** Companies with `hs_is_target_account = true` and an owner.");
  lines.push("- **Worked:** Assigned target accounts that have at least one associated lead whose stage is **not** Open (i.e. lead has been moved to Attempting, Connected, Meeting Set, In Progress, Qualified, Disqualified, or Cold).");
  lines.push("- **Discovery meeting set (Feb):** Of those worked, count that have at least one meeting in February " + YEAR + " (discovery/demo/initial meeting type).");
  lines.push("- **Deals created (Feb):** Deals created in February " + YEAR + " associated with any assigned target account.");
  lines.push("- **Pipeline (Feb):** Sum of deal amount for those deals.");
  lines.push("");

  const reportPath = path.join(__dirname, "..", "data", "target-accounts-feb-report.md");
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, lines.join("\n"), "utf8");

  console.log(lines.join("\n"));
  console.log("\nReport saved to:", reportPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
