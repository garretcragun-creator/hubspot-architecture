#!/usr/bin/env node
/**
 * Location bulk NPI — Export/import via CSV, or enter via plain text (Slack-friendly).
 * ----------------------------------------------------------------------------------
 * For 2+ locations, avoids opening each record. Options:
 *   A) CSV: export → fill NPI column → import.
 *   B) Plain text: location name and NPI on separate lines (e.g. paste from Slack reply);
 *      script matches names to HubSpot Locations for the company and updates NPI.
 *
 * Requires:
 *   .env with HUBSPOT_ACCESS_TOKEN
 *   .env with HUBSPOT_LOCATION_OBJECT_TYPE = Location custom object type ID.
 *
 * Export:
 *   node scripts/location-bulk-npi.js export --company=COMPANY_ID
 *   node scripts/location-bulk-npi.js export --missing-npi [--out=path.csv]
 *
 * Import from CSV:
 *   node scripts/location-bulk-npi.js import --file=data/locations-npi-export.csv
 *
 * Import from text (location name + NPI on alternating lines, or "Name: NPI" per line):
 *   node scripts/location-bulk-npi.js from-text --company=COMPANY_ID --text="Main Campus\n1234567890\nDowntown\n0987654321"
 *   node scripts/location-bulk-npi.js from-text --company=COMPANY_ID --file=data/npi-paste.txt
 *
 * Output: export writes CSV; import/from-text update HubSpot.
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const DEFAULT_EXPORT_PATH = path.join(DATA_DIR, "locations-npi-export.csv");
const BATCH_SIZE = 100;

// ─── Config ──────────────────────────────────────────────────────────
const envPath = path.join(__dirname, "..", ".env");
let TOKEN, LOCATION_OBJECT_TYPE;
try {
  const env = fs.readFileSync(envPath, "utf8");
  const m = env.match(/HUBSPOT_ACCESS_TOKEN=(.+)/);
  if (!m) throw new Error("HUBSPOT_ACCESS_TOKEN missing");
  TOKEN = m[1].trim();
  const m2 = env.match(/HUBSPOT_LOCATION_OBJECT_TYPE=(.+)/);
  LOCATION_OBJECT_TYPE = m2 ? m2[1].trim() : null;
} catch (e) {
  console.error("Missing .env or HUBSPOT_ACCESS_TOKEN. Optionally set HUBSPOT_LOCATION_OBJECT_TYPE for Location object type ID.");
  process.exit(1);
}

if (!LOCATION_OBJECT_TYPE) {
  console.error("Set HUBSPOT_LOCATION_OBJECT_TYPE in .env to your Location custom object type ID (e.g. 2-12345678).");
  process.exit(1);
}

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

function getLocationIdsForCompany(companyId) {
  return hubspot(
    "GET",
    `/crm/v4/objects/companies/${companyId}/associations/${LOCATION_OBJECT_TYPE}?limit=500`
  ).then((r) => (r.results || []).map((a) => a.toObjectId));
}

function batchReadLocations(ids, properties = ["name", "npi", "hs_object_id"]) {
  if (ids.length === 0) return Promise.resolve([]);
  return hubspot("POST", `/crm/v3/objects/${LOCATION_OBJECT_TYPE}/batch/read`, {
    properties,
    inputs: ids.map((id) => ({ id })),
  }).then((r) => r.results || []);
}

function searchLocationsMissingNpi(limit = 500) {
  return hubspot("POST", `/crm/v3/objects/${LOCATION_OBJECT_TYPE}/search`, {
    filterGroups: [
      {
        filters: [
          { propertyName: "npi", operator: "NOT_HAS_PROPERTY" },
        ],
      },
    ],
    properties: ["name", "npi", "hs_object_id"],
    limit,
  }).then((r) => r.results || []);
}

function writeExportCsv(filePath, locations) {
  const header = "hs_object_id,name,npi\n";
  const rows = locations.map((loc) => {
    const id = loc.id || loc.properties?.hs_object_id || "";
    const name = (loc.properties?.name || "").replace(/"/g, '""');
    const npi = (loc.properties?.npi || "").replace(/"/g, '""');
    return `${id},"${name}","${npi}"`;
  });
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(filePath, header + rows.join("\n"), "utf8");
  console.log(`Wrote ${locations.length} rows to ${filePath}`);
}

function parseCsv(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headerLine = lines[0];
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const parts = [];
    let inQuotes = false;
    let cur = "";
    for (let j = 0; j < line.length; j++) {
      const c = line[j];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if (c === "," && !inQuotes) {
        parts.push(cur.trim());
        cur = "";
      } else {
        cur += c;
      }
    }
    parts.push(cur.trim());
    const obj = {};
    headerLine.split(",").forEach((h, idx) => {
      obj[h.trim()] = parts[idx] !== undefined ? parts[idx] : "";
    });
    rows.push(obj);
  }
  return rows;
}

function batchUpdateLocations(updates) {
  const inputs = updates.map((u) => ({
    id: u.id,
    properties: { npi: String(u.npi || "").trim() },
  }));
  return hubspot("POST", `/crm/v3/objects/${LOCATION_OBJECT_TYPE}/batch/update`, {
    inputs,
  });
}

/**
 * Parse plain text into location name + NPI pairs.
 * Accepts:
 *   - Alternating lines: "Location A\n1234567890\nLocation B\n0987654321"
 *   - Or "Location A: 1234567890" or "Location A	1234567890" per line.
 * NPI is normalized to 10 digits; lines that are 10 digits are treated as NPI (previous line = name).
 */
function parseLocationNpiText(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const pairs = [];
  const npiOnly = /^\d{10}$/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // "Name: NPI" or "Name	NPI" (tab); NPI can have spaces/dashes
    const colonMatch = line.match(/^(.+?)[:\t]\s*([\d\s\-]+)$/);
    if (colonMatch) {
      const npi = colonMatch[2].replace(/\D/g, "").slice(0, 10);
      if (npi.length === 10) pairs.push({ name: colonMatch[1].trim(), npi });
      continue;
    }
    const digits = line.replace(/\D/g, "");
    const isNpi = digits.length === 10 && npiOnly.test(digits);
    if (isNpi && pairs.length > 0 && !pairs[pairs.length - 1].npi) {
      pairs[pairs.length - 1].npi = digits.slice(0, 10);
      continue;
    }
    if (isNpi && (pairs.length === 0 || pairs[pairs.length - 1].npi)) {
      pairs.push({ name: "", npi: digits.slice(0, 10) });
      continue;
    }
    pairs.push({ name: line, npi: "" });
  }
  return pairs.filter((p) => p.npi && p.npi.length === 10);
}

/** Match location name to a HubSpot Location (case-insensitive, contains or equals). */
function matchLocationByName(locations, name) {
  const n = (name || "").trim().toLowerCase();
  if (!n) return null;
  const exact = locations.find((l) => (l.properties?.name || "").trim().toLowerCase() === n);
  if (exact) return exact;
  const contains = locations.find((l) => (l.properties?.name || "").toLowerCase().includes(n) || n.includes((l.properties?.name || "").toLowerCase()));
  return contains || null;
}

async function runFromText(args) {
  const companyId = args.find((a) => a.startsWith("--company="))?.split("=")[1];
  const textArg = args.find((a) => a.startsWith("--text="));
  const fileArg = args.find((a) => a.startsWith("--file="));
  let text = "";
  if (textArg) {
    text = textArg.replace(/^--text=/, "").replace(/\\n/g, "\n");
  } else if (fileArg) {
    const path = fileArg.split("=")[1];
    if (!fs.existsSync(path)) {
      console.error("File not found: " + path);
      process.exit(1);
    }
    text = fs.readFileSync(path, "utf8");
  } else {
    console.error("Use --company=COMPANY_ID with --text=\"...\" or --file=path.txt");
    process.exit(1);
  }
  if (!companyId) {
    console.error("Use --company=COMPANY_ID");
    process.exit(1);
  }

  const pairs = parseLocationNpiText(text);
  if (pairs.length === 0) {
    console.log("No location/NPI pairs parsed. Use alternating lines: location name, then NPI (10 digits).");
    process.exit(1);
  }

  const locationIds = await getLocationIdsForCompany(companyId);
  if (locationIds.length === 0) {
    console.log("No locations associated to company " + companyId);
    process.exit(1);
  }
  const locations = await batchReadLocations(locationIds);

  const updates = [];
  const unmatched = [];
  for (const p of pairs) {
    const loc = matchLocationByName(locations, p.name);
    if (loc) {
      updates.push({ id: loc.id, npi: p.npi });
    } else {
      unmatched.push(p.name || p.npi);
    }
  }

  if (unmatched.length > 0) {
    console.warn("Could not match to a Location for this company: " + unmatched.join(", "));
  }
  if (updates.length === 0) {
    console.log("No Location records updated. Check that location names match HubSpot Location names.");
    process.exit(1);
  }

  await batchUpdateLocations(updates);
  console.log("Updated " + updates.length + " Location(s) with NPI.");
}

async function runExport(args) {
  const companyId = args.find((a) => a.startsWith("--company="))?.split("=")[1];
  const missingNpi = args.includes("--missing-npi");
  const outFile =
    args.find((a) => a.startsWith("--out="))?.split("=")[1] || DEFAULT_EXPORT_PATH;

  let locations = [];
  if (companyId) {
    const ids = await getLocationIdsForCompany(companyId);
    if (ids.length === 0) {
      console.log("No locations associated to company " + companyId);
      return;
    }
    locations = await batchReadLocations(ids);
  } else if (missingNpi) {
    const results = await searchLocationsMissingNpi();
    locations = results;
    if (locations.length === 0) {
      console.log("No locations found with missing NPI.");
      return;
    }
  } else {
    console.error("Use --company=COMPANY_ID or --missing-npi for export.");
    process.exit(1);
  }

  writeExportCsv(outFile, locations);
}

async function runImport(args) {
  const fileArg = args.find((a) => a.startsWith("--file="));
  const filePath = fileArg ? fileArg.split("=")[1] : DEFAULT_EXPORT_PATH;
  if (!fs.existsSync(filePath)) {
    console.error("File not found: " + filePath);
    process.exit(1);
  }

  const rows = parseCsv(filePath);
  const idKey = "hs_object_id";
  const npiKey = "npi";
  if (!rows.length || !rows[0][idKey]) {
    console.error("CSV must have header with hs_object_id and npi.");
    process.exit(1);
  }

  const updates = rows
    .map((r) => ({
      id: (r[idKey] || "").trim(),
      npi: (r[npiKey] ?? "").trim().replace(/\D/g, ""),
    }))
    .filter((u) => u.id && u.npi.length >= 10);

  if (updates.length === 0) {
    console.log("No rows with valid hs_object_id and 10-digit NPI to update.");
    return;
  }

  let done = 0;
  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const chunk = updates.slice(i, i + BATCH_SIZE);
    await batchUpdateLocations(chunk);
    done += chunk.length;
    console.log("Updated " + done + " / " + updates.length);
  }
  console.log("Import complete. " + done + " Location(s) updated with NPI.");
}

const cmd = process.argv[2];
const rest = process.argv.slice(3);
if (cmd === "export") {
  runExport(rest).catch((e) => {
    console.error(e.message || e);
    process.exit(1);
  });
} else if (cmd === "import") {
  runImport(rest).catch((e) => {
    console.error(e.message || e);
    process.exit(1);
  });
} else if (cmd === "from-text") {
  runFromText(rest).catch((e) => {
    console.error(e.message || e);
    process.exit(1);
  });
} else {
  console.log("Usage:");
  console.log("  node scripts/location-bulk-npi.js export --company=COMPANY_ID");
  console.log("  node scripts/location-bulk-npi.js export --missing-npi [--out=path.csv]");
  console.log("  node scripts/location-bulk-npi.js import --file=data/locations-npi-export.csv");
  console.log("  node scripts/location-bulk-npi.js from-text --company=COMPANY_ID --text=\"Location A\\n1234567890\\nLocation B\\n0987654321\"");
  console.log("  node scripts/location-bulk-npi.js from-text --company=COMPANY_ID --file=data/npi-paste.txt");
  process.exit(1);
}
