#!/usr/bin/env node
/**
 * Look up an organization by name in NPPES (same data as Mimilabs) and list all practice locations.
 * Reads config from config/data-providers.json (Mimilabs URL/auth for future MCP use).
 *
 * Usage: node scripts/lookup-org-locations.js "Grace Health"
 *        node scripts/lookup-org-locations.js "Adelante Healthcare" --fuzzy
 *        node scripts/lookup-org-locations.js --zip 23123 "CENTRAL VIRGINIA HEALTH SERVICES"
 *          (search NPPES by zip first, then filter organizations by name; list all locations in all zip codes)
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const configPath = path.join(__dirname, "..", "config", "data-providers.json");
const args = process.argv.slice(2);
const zipFirst = args.indexOf("--zip");
const zipCode = zipFirst >= 0 && args[zipFirst + 1] ? args[zipFirst + 1].trim() : null;
const orgName = args.find((a) => !a.startsWith("--") && a !== (zipCode || "")) || "Grace Health";
const fuzzy = args.includes("--fuzzy");

let config = {};
try {
  config = JSON.parse(fs.readFileSync(configPath, "utf8"));
} catch (e) {
  console.warn("No config/data-providers.json found; using NPPES API only.");
}

function nppesSearch(params) {
  const q = new URLSearchParams({ version: "2.1", enumeration_type: "NPI-2", limit: "200", ...params });
  return new Promise((resolve, reject) => {
    const req = https.request(
      "https://npiregistry.cms.hhs.gov/api/?" + q.toString(),
      { method: "GET" },
      (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(d));
          } catch (e) {
            reject(new Error("NPPES parse error: " + d.substring(0, 200)));
          }
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

/** Normalize for matching: strip punctuation, collapse spaces, lower case. */
function normalizeForMatch(s) {
  return (s || "").toLowerCase().replace(/[.,]/g, "").replace(/\s+/g, " ").trim();
}

/** True if org name matches query (query words all appear in name, order-independent). */
function orgNameMatches(query, orgName) {
  if (!query || !orgName) return false;
  const q = normalizeForMatch(query).split(/\s+/).filter((w) => w.length >= 2);
  const n = normalizeForMatch(orgName);
  if (!q.length) return true;
  return q.every((w) => n.includes(w));
}

/** Simple similarity: share of query words that appear in name (case-insensitive). */
function wordMatchScore(query, name) {
  if (!name) return 0;
  const qWords = query.toLowerCase().split(/\s+/).filter(Boolean);
  const nLower = name.toLowerCase();
  let matches = 0;
  for (const w of qWords) {
    if (w.length >= 2 && nLower.includes(w)) matches++;
  }
  return qWords.length ? matches / qWords.length : 0;
}

/** Search variants for fuzzy: first word, first two words, without common suffixes. */
function fuzzySearchVariants(name) {
  const n = name.trim().replace(/,?\s+(inc\.?|llc|llc\.?|corp\.?|l\.?l\.?c\.?|co\.?)$/i, "").trim();
  const words = n.split(/\s+/).filter(Boolean);
  const variants = [n];
  if (words.length > 1) variants.push(words[0]);
  if (words.length > 2) variants.push(words.slice(0, 2).join(" "));
  if (words[0].length > 4) variants.push(words[0].slice(0, 4)); // e.g. "Adel" for Adelante
  return [...new Set(variants)];
}

async function main() {
  console.log("Looking up:", orgName, zipCode ? "(zip-first: " + zipCode + ", then match by name; all locations in all zips)" : "", fuzzy ? "(fuzzy)" : "");
  console.log("Config loaded:", config.mimilabs ? "yes (" + config.mimilabs.url + ")" : "no");
  console.log("");

  let allResults = [];

  if (zipCode) {
    // Search by zip first, then filter organizations by name. List all practice locations (all zip codes).
    const res = await nppesSearch({ postal_code: zipCode });
    const inZip = res.results || [];
    allResults = inZip.filter((r) => {
      const basic = r.basic || {};
      const name = basic.organization_name || basic.name || "";
      return orgNameMatches(orgName, name);
    });
    if (inZip.length > 0 && allResults.length === 0) {
      console.log("In zip", zipCode, "found", inZip.length, "organization(s); none matched \"" + orgName + "\".");
      return;
    }
    if (inZip.length === 0) {
      console.log("No organizations found in zip", zipCode + ".");
      return;
    }
  } else {
  let searchTerms = [orgName];

  if (fuzzy) {
    searchTerms = fuzzySearchVariants(orgName);
    console.log("Fuzzy search variants:", searchTerms.join(", "));
    console.log("");
    const seen = new Set();
    for (const term of searchTerms) {
      const res = await nppesSearch({ organization_name: term });
      (res.results || []).forEach((r) => {
        const id = r.number;
        if (!seen.has(id)) {
          seen.add(id);
          allResults.push(r);
        }
      });
    }
    // Rank by word match to original query
    allResults.sort((a, b) => {
      const nameA = (a.basic || {}).organization_name || (a.basic || {}).name || "";
      const nameB = (b.basic || {}).organization_name || (b.basic || {}).name || "";
      return wordMatchScore(orgName, nameB) - wordMatchScore(orgName, nameA);
    });
  } else {
    const res = await nppesSearch({ organization_name: orgName });
    allResults = res.results || [];
  }
  }

  const total = allResults.length;

  if (total === 0) {
    console.log("No organizations found for \"" + orgName + "\".");
    return;
  }

  console.log("Found", total, "organization(s). Practice locations below.\n");

  for (let i = 0; i < allResults.length; i++) {
    const r = allResults[i];
    const npi = r.number;
    const basic = r.basic || {};
    const name = basic.organization_name || basic.name || "(no name)";
    const addresses = r.addresses || [];
    const locs = addresses.filter((a) => (a.address_purpose || "").toUpperCase() === "LOCATION");

    const score = fuzzy ? wordMatchScore(orgName, name) : 1;
    if (fuzzy) console.log("(match score:", (score * 100).toFixed(0) + "%)");

    console.log("--- Organization", i + 1, "---");
    console.log("NPI:", npi);
    console.log("Name:", name);
    console.log("Practice locations:", locs.length);
    for (let j = 0; j < locs.length; j++) {
      const a = locs[j];
      const line1 = [a.address_1, a.address_2].filter(Boolean).join(", ");
      const cityStateZip = [a.city, a.state, a.postal_code].filter(Boolean).join(", ");
      const phone = a.telephone_number || "";
      console.log("  Location", j + 1 + ":", line1 || "(no address)", cityStateZip, "| Tel:", phone);
    }
    console.log("");
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
