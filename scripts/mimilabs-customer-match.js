#!/usr/bin/env node
/**
 * Mimilabs Match Effectiveness — HubSpot customers vs NPPES (Mimilabs data source)
 * -------------------------------------------------------------------------------
 * Extracts 10–15 customer companies from HubSpot (closed-won deals), looks up each
 * by organization name in the NPPES Registry API (same data Mimilabs uses), and
 * reports match rate, completeness (address/phone), and a per-company comparison.
 *
 * Usage:  node scripts/mimilabs-customer-match.js
 * Requires: .env with HUBSPOT_ACCESS_TOKEN
 *
 * Output: data/mimilabs-match-report.md (and data/mimilabs-match-report.json)
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

// ─── Config ──────────────────────────────────────────────────────────
const envPath = path.join(__dirname, "..", ".env");
let TOKEN;
try {
  TOKEN = fs.readFileSync(envPath, "utf8").match(/HUBSPOT_ACCESS_TOKEN=(.+)/)[1].trim();
} catch (e) {
  console.error("Missing .env or HUBSPOT_ACCESS_TOKEN");
  process.exit(1);
}

const DATA_DIR = path.join(__dirname, "..", "data");
const REPORT_MD = path.join(DATA_DIR, "mimilabs-match-report.md");
const REPORT_JSON = path.join(DATA_DIR, "mimilabs-match-report.json");

const CLOSED_WON_STAGE_IDS = [
  "77f2e34f-14fa-409c-9850-692b7c2c7321", // New Customer - Closed Won Onboarding
  "81d05856-d5e1-4929-90ba-89134bf3a674", // New Customer - Closed Won Engagement
  "937266522",                             // Expansion - Closed Won Onboarding
  "1025177200",                           // Expansion - Closed Won Engagement
];

const TARGET_CUSTOMER_COUNT = 15;
const NPPES_LIMIT = 10;

// ─── HubSpot API ─────────────────────────────────────────────────────
function hubspot(method, urlPath, body) {
  return new Promise((resolve, reject) => {
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
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(d ? JSON.parse(d) : {});
        } else {
          reject(new Error(`HubSpot ${res.statusCode}: ${d.substring(0, 400)}`));
        }
      });
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function searchDealsClosedWon(limit) {
  const filterGroups = CLOSED_WON_STAGE_IDS.map((stageId) => ({
    filters: [{ propertyName: "dealstage", operator: "EQ", value: stageId }],
  }));
  const res = await hubspot("POST", "/crm/v3/objects/deals/search", {
    filterGroups,
    properties: ["dealname", "dealstage", "pipeline", "closedate"],
    limit,
  });
  return res.results || [];
}

async function getDealToCompanyIds(dealIds) {
  const companyIdSet = new Set();
  for (const dealId of dealIds) {
    try {
      const res = await hubspot(
        "GET",
        `/crm/v4/objects/deals/${dealId}/associations/companies?limit=1`
      );
      const ids = (res.results || []).map((r) => r.toObjectId);
      ids.forEach((id) => companyIdSet.add(id));
    } catch (_) {
      // skip deal if associations fail
    }
  }
  return Array.from(companyIdSet);
}

async function getCompanies(companyIds, properties) {
  if (companyIds.length === 0) return [];
  const res = await hubspot("POST", "/crm/v3/objects/companies/batch/read", {
    inputs: companyIds.map((id) => ({ id })),
    properties,
  });
  return res.results || [];
}

// ─── NPPES API (same data source as Mimilabs) ─────────────────────────
function nppesSearch(params) {
  const q = new URLSearchParams(params).toString();
  return new Promise((resolve, reject) => {
    const url = `https://npiregistry.cms.hhs.gov/api/?version=2.1&${q}`;
    https
      .get(url, (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(d));
          } catch (e) {
            reject(new Error("NPPES JSON parse error: " + d.substring(0, 200)));
          }
        });
      })
      .on("error", reject);
  });
}

function parseNppesResult(nppesRes) {
  const count = nppesRes.result_count || 0;
  const list = nppesRes.results || [];
  const first = list[0];
  if (!first) return { count, npi: null, name: null, address: null, phone: null, city: null, state: null };

  const basic = first.basic || {};
  const addresses = first.addresses || [];
  const primary = addresses.find((a) => a.address_purpose === "LOCATION") || addresses[0] || {};
  const telephone = primary.telephone_number || null;
  const line1 = [primary.address_1, primary.address_2].filter(Boolean).join(", ") || null;
  const npi = first.number != null ? String(first.number) : (basic.npi != null ? String(basic.npi) : null);
  const orgName = basic.organization_name || basic.name || null;

  return {
    count,
    npi,
    name: orgName,
    address: line1 || null,
    city: primary.city || null,
    state: primary.state || null,
    postal: primary.postal_code || null,
    phone: telephone || null,
  };
}

function normalizeForSearch(name) {
  if (!name || typeof name !== "string") return "";
  return name
    .replace(/,?\s+(inc\.?|llc|corp\.?|l\.?l\.?c\.?|co\.?)$/i, "")
    .trim()
    .slice(0, 80);
}

/** Return search variants: full normalized, then without " - Parent", then without parentheticals. */
function searchVariants(name) {
  const n = normalizeForSearch(name);
  const variants = [n];
  const withoutParent = n.replace(/\s*-\s*Parent\s*$/i, "").trim();
  if (withoutParent && withoutParent !== n) variants.push(withoutParent);
  const withoutParens = withoutParent.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
  if (withoutParens && !variants.includes(withoutParens)) variants.push(withoutParens);
  return variants;
}

// ─── Simple name similarity (0–1) ─────────────────────────────────────
function nameSimilarity(a, b) {
  if (!a || !b) return 0;
  const na = a.toLowerCase().replace(/\s+/g, " ").trim();
  const nb = b.toLowerCase().replace(/\s+/g, " ").trim();
  if (na === nb) return 1;
  const wordsA = new Set(na.split(" ").filter(Boolean));
  const wordsB = new Set(nb.split(" ").filter(Boolean));
  let match = 0;
  wordsA.forEach((w) => {
    if (wordsB.has(w) || Array.from(wordsB).some((wb) => wb.includes(w) || w.includes(wb))) match++;
  });
  const jaccard = match / (wordsA.size + wordsB.size - match) || 0;
  return jaccard;
}

// ─── Main ───────────────────────────────────────────────────────────
async function main() {
  console.log("Fetching closed-won deals...");
  const deals = await searchDealsClosedWon(50);
  const dealIds = deals.map((d) => d.id);
  if (dealIds.length === 0) {
    console.error("No closed-won deals found.");
    process.exit(1);
  }

  console.log("Resolving company IDs from deals...");
  const companyIds = await getDealToCompanyIds(dealIds);
  const uniqIds = companyIds.slice(0, TARGET_CUSTOMER_COUNT);

  const companyProps = ["name", "domain", "address", "city", "state", "phone", "hs_object_id"];
  console.log("Fetching company details...");
  const companies = await getCompanies(uniqIds, companyProps);

  if (companies.length === 0) {
    console.error("No companies found.");
    process.exit(1);
  }

  const results = [];
  for (const co of companies) {
    const name = (co.properties && co.properties.name) || co.properties?.name || "";
    const searchName = normalizeForSearch(name);
    if (!searchName) {
      results.push({
        hubspot_id: co.id,
        hubspot_name: name || "(no name)",
        hubspot_domain: (co.properties && co.properties.domain) || null,
        search_used: null,
        nppes_count: 0,
        match: null,
        best_similarity: 0,
        note: "Skipped: no company name to search",
      });
      continue;
    }

    const variants = searchVariants(name);
    let nppesRes = { result_count: 0, results: [] };
    let lastUsedVariant = searchName;

    for (const variant of variants) {
      if (variant.length < 2) continue;
      try {
        const res = await nppesSearch({
          organization_name: variant,
          enumeration_type: "NPI-2",
          limit: NPPES_LIMIT,
        });
        if ((res.result_count || 0) > 0) {
          nppesRes = res;
          lastUsedVariant = variant;
          break;
        }
      } catch (_) {
        // try next variant
      }
    }

    const parsed = parseNppesResult(nppesRes);
    const list = nppesRes.results || [];
    let bestSim = 0;
    let bestResult = parsed;
    if (list.length > 0) {
      for (const r of list) {
        const basic = r.basic || {};
        const orgName = basic.organization_name || basic.name || "";
        const sim = nameSimilarity(name, orgName);
        if (sim > bestSim) {
          bestSim = sim;
          const addr = (r.addresses || []).find((a) => a.address_purpose === "LOCATION") || r.addresses?.[0] || {};
          bestResult = {
            count: list.length,
            npi: r.number != null ? String(r.number) : (basic.npi != null ? String(basic.npi) : null),
            name: orgName,
            address: [addr.address_1, addr.address_2].filter(Boolean).join(", ") || null,
            city: addr.city || null,
            state: addr.state || null,
            postal: addr.postal_code || null,
            phone: addr.telephone_number || null,
          };
        }
      }
    }

    const hasMatch = bestResult.count > 0;
    const hasAddress = !!(bestResult.address && bestResult.address.length > 2);
    const hasPhone = !!(bestResult.phone && bestResult.phone.replace(/\D/g, "").length >= 10);

    results.push({
      hubspot_id: co.id,
      hubspot_name: name,
      hubspot_domain: (co.properties && co.properties.domain) || null,
      hubspot_address: (co.properties && co.properties.address) || null,
      hubspot_city: (co.properties && co.properties.city) || null,
      hubspot_state: (co.properties && co.properties.state) || null,
      search_used: searchName,
      search_variant_matched: list.length > 0 ? lastUsedVariant : null,
      nppes_count: bestResult.count,
      best_similarity: Math.round(bestSim * 100) / 100,
      match: hasMatch
        ? {
            npi: bestResult.npi,
            name: bestResult.name,
            address: bestResult.address,
            city: bestResult.city,
            state: bestResult.state,
            postal: bestResult.postal,
            phone: bestResult.phone,
          }
        : null,
      has_address: hasAddress,
      has_phone: hasPhone,
      note: hasMatch ? null : "No NPPES organization found for this name",
    });
  }

  // Summary stats
  const withMatch = results.filter((r) => r.match != null);
  const withAddress = results.filter((r) => r.has_address);
  const withPhone = results.filter((r) => r.has_phone);
  const matchRate = results.length ? (withMatch.length / results.length) * 100 : 0;
  const addressFillRate = withMatch.length ? (withAddress.length / withMatch.length) * 100 : 0;
  const phoneFillRate = withMatch.length ? (withPhone.length / withMatch.length) * 100 : 0;

  const report = {
    run_at: new Date().toISOString(),
    source: "NPPES Registry API (same data source as Mimilabs)",
    total_companies: results.length,
    matched: withMatch.length,
    match_rate_pct: Math.round(matchRate * 10) / 10,
    with_address: withAddress.length,
    with_phone: withPhone.length,
    address_fill_rate_pct: withMatch.length ? Math.round(addressFillRate * 10) / 10 : null,
    phone_fill_rate_pct: withMatch.length ? Math.round(phoneFillRate * 10) / 10 : null,
    results,
  };

  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2), "utf8");

  // Markdown report
  const md = [
    "# Mimilabs Match Effectiveness — Customer Sample",
    "",
    `**Run:** ${report.run_at}`,
    `**Data source:** ${report.source} (organization search by company name)`,
    "",
    "## Summary",
    "",
    "| Metric | Value |",
    "|--------|--------|",
    `| Companies sampled | ${report.total_companies} |`,
    `| Matched (≥1 NPPES org) | ${report.matched} |`,
    `| Match rate | ${report.match_rate_pct}% |`,
    `| With address (of matched) | ${report.with_address} |`,
    `| With phone (of matched) | ${report.with_phone} |`,
    `| Address fill rate (of matched) | ${report.address_fill_rate_pct != null ? report.address_fill_rate_pct + "%" : "—"} |`,
    `| Phone fill rate (of matched) | ${report.phone_fill_rate_pct != null ? report.phone_fill_rate_pct + "%" : "—"} |`,
    "",
    "## Per-company results",
    "",
  ];

  results.forEach((r) => {
    md.push(`### ${(r.hubspot_name || "(no name)").replace(/\|/g, " ")}`);
    md.push("");
    md.push(`- **HubSpot ID:** ${r.hubspot_id} | **Domain:** ${r.hubspot_domain || "—"}`);
    md.push(`- **Search used:** \`${r.search_used || "—"}\`${r.search_variant_matched ? ` → matched on \`${r.search_variant_matched}\`` : ""}`);
    md.push(`- **NPPES results:** ${r.nppes_count} | **Best name similarity:** ${(r.best_similarity * 100).toFixed(0)}%`);
    if (r.match) {
      md.push(`- **Matched NPI:** ${r.match.npi} — ${r.match.name || "—"}`);
      md.push(`- **Address:** ${r.match.address || "—"} ${[r.match.city, r.match.state].filter(Boolean).join(", ")}`);
      md.push(`- **Phone:** ${r.match.phone || "—"}`);
      md.push(`- **Completeness:** Address ${r.has_address ? "✓" : "✗"} | Phone ${r.has_phone ? "✓" : "✗"}`);
    } else {
      md.push(`- **Note:** ${r.note || "No match"}`);
    }
    md.push("");
  });

  md.push("---");
  md.push("");
  md.push("*Report generated by `scripts/mimilabs-customer-match.js`. Use this to assess match effectiveness before scaling Mimilabs enrichment.*");

  fs.writeFileSync(REPORT_MD, md.join("\n"), "utf8");

  console.log(`\nDone. Matched ${report.matched}/${report.total_companies} (${report.match_rate_pct}%).`);
  console.log(`Address fill (of matched): ${report.address_fill_rate_pct != null ? report.address_fill_rate_pct + "%" : "—"}`);
  console.log(`Phone fill (of matched): ${report.phone_fill_rate_pct != null ? report.phone_fill_rate_pct + "%" : "—"}`);
  console.log(`Report: ${REPORT_MD}`);
  console.log(`JSON:  ${REPORT_JSON}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
