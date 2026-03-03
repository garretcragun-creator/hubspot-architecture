#!/usr/bin/env node
/**
 * Conference Attendee → HubSpot Matcher (with Learning)
 * ─────────────────────────────────────────────────────
 * Two-phase tool with recursive learning: each review cycle teaches the
 * system via data/match-knowledge.json, reducing review burden over time.
 *
 * Usage:
 *   node scripts/conference-match.js match  --csv <path> [options]
 *   node scripts/conference-match.js commit --reviewed <path> --list-name "Name"
 *
 * Match options:
 *   --company-col <col>  CSV column for company (default: "Company")
 *   --title-col <col>    CSV column for job title (default: "Title")
 *   --email-col <col>    CSV column for email, if present (optional)
 *   --target-only        Only match against HubSpot target accounts
 *   --output <path>      Review CSV path (default: ./conference-match-review.csv)
 *
 * Commit options:
 *   --reviewed <path>    Human-reviewed CSV (approved column filled Y/N)
 *   --list-name <name>   Static HubSpot list to create
 *
 * Requires: .env with HUBSPOT_ACCESS_TOKEN
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

// ─── Config ──────────────────────────────────────────────────────────
const TOKEN = fs
  .readFileSync(path.join(__dirname, "..", ".env"), "utf8")
  .match(/HUBSPOT_ACCESS_TOKEN=(.+)/)[1]
  .trim();

const MAX_CONCURRENT = 8;
const COMPANY_PROPS = ["name", "domain", "num_associated_contacts", "lifecyclestage", "hs_object_id", "hs_is_target_account"];
const CONTACT_PROPS = ["firstname", "lastname", "email", "jobtitle", "hs_object_id", "is_decision_maker_title", "influence_score"];

// ─── CLI args ────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const MODE = args[0];

function getArg(name, defaultVal) {
  const idx = args.indexOf("--" + name);
  return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : defaultVal;
}
function hasFlag(name) { return args.includes("--" + name); }

// ─── Data directories ───────────────────────────────────────────────
const DATA_DIR       = path.join(__dirname, "..", "data");
const IMPORTS_DIR    = path.join(DATA_DIR, "imports");
const LISTS_DIR      = path.join(DATA_DIR, "lists");
const KNOWLEDGE_PATH = path.join(DATA_DIR, "match-knowledge.json");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadKnowledge() {
  try {
    return JSON.parse(fs.readFileSync(KNOWLEDGE_PATH, "utf8"));
  } catch (_) {
    return { version: 1, lastUpdated: null, companyMappings: {}, contactPreferences: {} };
  }
}

function saveKnowledge(kb) {
  kb.lastUpdated = new Date().toISOString().slice(0, 10);
  ensureDir(DATA_DIR);
  fs.writeFileSync(KNOWLEDGE_PATH, JSON.stringify(kb, null, 2), "utf8");
}

// ─── CSV helpers ─────────────────────────────────────────────────────
function parseCSV(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows = [];
  let i = 0;
  const len = text.length;

  while (i < len) {
    const row = [];
    let parsing = true;
    while (parsing && i < len) {
      if (text[i] === '"') {
        i++;
        let f = "";
        while (i < len) {
          if (text[i] === '"') {
            if (i + 1 < len && text[i + 1] === '"') { f += '"'; i += 2; }
            else { i++; break; }
          } else { f += text[i]; i++; }
        }
        row.push(f);
      } else {
        let f = "";
        while (i < len && text[i] !== "," && text[i] !== "\n" && text[i] !== "\r") {
          f += text[i]; i++;
        }
        row.push(f);
      }
      if (i < len && text[i] === ",") i++;
      else parsing = false;
    }
    while (i < len && (text[i] === "\n" || text[i] === "\r")) i++;
    if (row.length > 0 && row.some((f) => f.trim())) rows.push(row);
  }
  return rows;
}

function esc(val) {
  val = String(val ?? "");
  return val.includes(",") || val.includes('"') || val.includes("\n")
    ? '"' + val.replace(/"/g, '""') + '"'
    : val;
}

function csvLine(fields) { return fields.map(esc).join(","); }

// ─── Rate-limited HTTP (mirrors weekly-audit.js) ────────────────────
let queue = [];
let inFlight = 0;

function hubspot(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const run = () => {
      inFlight++;
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
          inFlight--;
          drain();
          if (res.statusCode === 429) {
            const wait = parseInt(res.headers["retry-after"] || "2", 10);
            setTimeout(() => hubspot(method, urlPath, body).then(resolve, reject), wait * 1000);
            return;
          }
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(d ? JSON.parse(d) : {});
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${d.substring(0, 300)}`));
          }
        });
      });
      req.on("error", (e) => { inFlight--; drain(); reject(e); });
      if (body) req.write(JSON.stringify(body));
      req.end();
    };
    if (inFlight < MAX_CONCURRENT) run();
    else queue.push(run);
  });
}

function drain() {
  while (queue.length && inFlight < MAX_CONCURRENT) queue.shift()();
}

// ─── Normalisation & scoring ─────────────────────────────────────────
const STRIP = /\b(inc|incorporated|llc|corp|corporation|ltd|limited|llp|co|company|group|holdings?|the|of|and|&)\b/gi;

function norm(name) {
  return (name || "").toLowerCase().replace(/[,.'"''""\-()\/]/g, " ").replace(STRIP, "").replace(/\s+/g, " ").trim();
}

const COMMON_WORDS = new Set([
  "health", "healthcare", "medical", "hospital", "clinic", "clinics",
  "center", "centers", "centre", "centres",
  "community", "services", "service", "system", "systems",
  "foundation", "department", "public", "county",
  "network", "partners", "regional", "rural", "national", "general",
  "board", "association", "associates", "institute", "district",
  "care", "wellness", "behavioral", "primary", "integrated",
  "san", "los", "university", "college",
]);

function scoreCompany(csv, hs) {
  const a = norm(csv), b = norm(hs);
  if (!a || !b) return "NONE";
  if (a === b) return "HIGH";

  const w1 = a.split(" ").filter((w) => w.length > 2);
  const w2 = b.split(" ").filter((w) => w.length > 2);
  if (!w1.length || !w2.length) return "NONE";

  const d1 = w1.filter((w) => !COMMON_WORDS.has(w));
  const d2 = w2.filter((w) => !COMMON_WORDS.has(w));

  if (d1.length > 0 && d2.length > 0) {
    const s1 = new Set(d1), s2 = new Set(d2);
    const overlap = [...s1].filter((w) => s2.has(w)).length;
    const minSet = Math.min(s1.size, s2.size);
    if (overlap === minSet && minSet >= 2) return "MEDIUM";
    if (overlap >= 2 && overlap / Math.max(s1.size, s2.size) >= 0.6) return "MEDIUM";
  }

  return "NONE";
}

function scoreTitle(csv, hs) {
  const a = norm(csv), b = norm(hs);
  if (!a || !b) return "NONE";
  if (a === b) return "EXACT";
  if (a.includes(b) || b.includes(a)) return "PARTIAL";
  const w1 = new Set(a.split(" ").filter((w) => w.length > 2));
  const w2 = new Set(b.split(" ").filter((w) => w.length > 2));
  const overlap = [...w1].filter((w) => w2.has(w)).length;
  return overlap > 0 ? "PARTIAL" : "NONE";
}

const SALUTATIONS = new Set([
  "mr", "mrs", "ms", "miss", "dr", "dr.", "mr.", "mrs.", "ms.",
  "prof", "prof.", "capt", "sir", "madam", "mx", "mx.", "staff",
]);
function isSalutation(t) {
  const s = (t || "").toLowerCase().trim();
  return SALUTATIONS.has(s) || s.length <= 3;
}

// Titles that HubSpot may flag as decision-maker but are not targets
const EXCLUDED_TITLE_PATTERNS = [
  /\bcmo\b/, /\bchief medical officer\b/,
  /\bcfo\b/, /\bchief financial officer\b/, /\bfinancial analyst\b/,
  /\bchief people officer\b/, /\bcpo\b/,
  /\bhuman resources\b/, /\bhr\b/, /\bpeople operations\b/,
  /\bconsultant\b/,
  /\bretired\b/, /\bemeritus\b/,
  /\bboard\s+(member|director|chair|trustee)\b/, /\bboard\s+of\b/,
  /\bcommunity\s+(affairs|engagement|relations|outreach)\b/,
  /\bnurse\b/, /\bnursing\b/, /\b(?:rn|lpn|cnm|cno)\b/,
];

function isExcludedTitle(title) {
  const t = (title || "").toLowerCase();
  return EXCLUDED_TITLE_PATTERNS.some((p) => p.test(t));
}

// ─── Progress ────────────────────────────────────────────────────────
function prog(cur, total, label) {
  process.stdout.write(`\r  ${label}: ${cur}/${total} (${Math.round((cur / total) * 100)}%)`);
  if (cur === total) process.stdout.write("\n");
}

// ─── Fetch all target accounts from HubSpot (paginated) ─────────────
async function fetchTargetAccounts() {
  const all = [];
  let after = undefined;
  for (let page = 0; page < 50; page++) {
    const body = {
      filterGroups: [{ filters: [{ propertyName: "hs_is_target_account", operator: "EQ", value: "true" }] }],
      properties: COMPANY_PROPS,
      limit: 100,
    };
    if (after) body.after = after;
    const res = await hubspot("POST", "/crm/v3/objects/companies/search", body);
    all.push(...(res.results || []));
    if (res.paging && res.paging.next && res.paging.next.after) {
      after = res.paging.next.after;
    } else {
      break;
    }
  }
  return all;
}

// =====================================================================
//  MATCH MODE
// =====================================================================
async function matchMode() {
  const csvPath    = getArg("csv");
  const compCol    = getArg("company-col", "Company");
  const titleCol   = getArg("title-col", "Title");
  const emailCol   = getArg("email-col");
  const targetOnly = hasFlag("target-only");
  const output     = getArg("output", path.join(IMPORTS_DIR, "conference-match-review.csv"));

  if (!csvPath) {
    console.error("Usage: node conference-match.js match --csv <path>");
    process.exit(1);
  }

  console.log("\n📋 Conference Attendee → HubSpot Matcher\n");
  if (targetOnly) console.log("  Mode: TARGET ACCOUNTS ONLY (hs_is_target_account = true)\n");

  // ── 1. Parse CSV ──────────────────────────────────────────────────
  const rows    = parseCSV(fs.readFileSync(path.resolve(csvPath), "utf8"));
  const headers = rows[0].map((h) => h.trim());
  const data    = rows.slice(1);

  const ci = headers.indexOf(compCol);
  const ti = headers.indexOf(titleCol);
  const ei = emailCol ? headers.indexOf(emailCol) : -1;

  if (ci === -1) {
    console.error(`Column "${compCol}" not found. Available: ${headers.join(", ")}`);
    process.exit(1);
  }

  console.log(`  Rows: ${data.length} | Company col: "${compCol}" | Title col: "${titleCol}"${ei !== -1 ? ` | Email col: "${emailCol}"` : ""}`);

  // ── 1b. Load knowledge ────────────────────────────────────────────
  const kb = loadKnowledge();
  const confirmedCount = Object.values(kb.companyMappings).filter((m) => m.status === "confirmed").length;
  const rejectedCount  = Object.values(kb.companyMappings).filter((m) => m.status === "rejected").length;
  const pinnedCount    = Object.values(kb.contactPreferences).reduce((s, p) => s + (p.include || []).length, 0);
  if (confirmedCount || rejectedCount || pinnedCount) {
    console.log(`  📚 Knowledge: ${confirmedCount} confirmed companies, ${rejectedCount} rejected pairs, ${pinnedCount} pinned contacts`);
  }

  // ── 2. Deduplicate companies ──────────────────────────────────────
  const compMap = {};
  for (let r = 0; r < data.length; r++) {
    const c = (data[r][ci] || "").trim();
    if (!c) continue;
    const k = norm(c);
    if (!compMap[k]) compMap[k] = { original: c, rowIdxs: [] };
    compMap[k].rowIdxs.push(r);
  }
  const uniqCompanies = Object.values(compMap);
  console.log(`  Unique companies in CSV: ${uniqCompanies.length}\n`);

  // ── 2b. Optional: direct email lookup (fast path) ─────────────────
  const emailHits = {};
  if (ei !== -1) {
    const emailRows = data
      .map((row, idx) => ({ idx, email: (row[ei] || "").trim().toLowerCase() }))
      .filter((e) => e.email && e.email.includes("@"));
    const uniqueEmails = [...new Set(emailRows.map((e) => e.email))];
    console.log(`  🔍 Searching ${uniqueEmails.length} unique emails first...\n`);
    let done = 0;
    await Promise.all(
      uniqueEmails.map(async (email) => {
        try {
          const res = await hubspot("POST", "/crm/v3/objects/contacts/search", {
            filterGroups: [{ filters: [{ propertyName: "email", operator: "EQ", value: email }] }],
            properties: CONTACT_PROPS.concat(["company"]),
            limit: 1,
          });
          if (res.results && res.results.length) {
            const contact = res.results[0];
            for (const er of emailRows.filter((e) => e.email === email)) {
              emailHits[er.idx] = contact;
            }
          }
        } catch (_) { /* skip */ }
        done++;
        if (done % 50 === 0 || done === uniqueEmails.length) prog(done, uniqueEmails.length, "Emails searched");
      })
    );
    console.log(`  ✅ Email matches: ${Object.keys(emailHits).length}\n`);
  }

  // ── 3. Company matching (knowledge first, then fuzzy) ─────────────
  const companyHits = {}; // normKey → { hsCompany, confidence }
  const unknownCompanies = [];
  let knownHits = 0;

  for (const entry of uniqCompanies) {
    const key = norm(entry.original);
    const mapping = kb.companyMappings[key];
    if (mapping && mapping.status === "confirmed") {
      companyHits[key] = {
        hsCompany: {
          id: mapping.hsCompanyId,
          properties: { name: mapping.hsCompanyName, domain: mapping.hsCompanyDomain || "", hs_object_id: mapping.hsCompanyId },
        },
        confidence: "LEARNED",
      };
      knownHits++;
    } else {
      unknownCompanies.push(entry);
    }
  }

  if (knownHits) console.log(`  📚 ${knownHits} companies matched from knowledge file`);

  if (targetOnly) {
    console.log("  🔍 Pulling target accounts from HubSpot...\n");
    const targetAccounts = await fetchTargetAccounts();
    console.log(`  ✅ ${targetAccounts.length} target accounts in HubSpot\n`);
    console.log("  🔗 Matching CSV companies against target accounts (local)...\n");

    for (const entry of unknownCompanies) {
      const entryKey = norm(entry.original);
      let best = null, bestConf = "NONE";
      for (const ta of targetAccounts) {
        const rejKey = entryKey + "|" + ta.id;
        if (kb.companyMappings[rejKey] && kb.companyMappings[rejKey].status === "rejected") continue;
        const c = scoreCompany(entry.original, ta.properties.name);
        if (c === "HIGH") { best = ta; bestConf = c; break; }
        if (c === "MEDIUM" && bestConf !== "HIGH") { best = ta; bestConf = c; }
      }
      if (best && bestConf !== "NONE") {
        companyHits[entryKey] = { hsCompany: best, confidence: bestConf };
      }
    }
  } else {
    console.log("  🔍 Searching HubSpot for companies...\n");
    let searched = 0;
    await Promise.all(
      unknownCompanies.map(async (entry) => {
        const entryKey = norm(entry.original);
        try {
          const res = await hubspot("POST", "/crm/v3/objects/companies/search", {
            query: entry.original,
            properties: COMPANY_PROPS,
            limit: 5,
          });
          let best = null, bestConf = "NONE";
          for (const r of res.results || []) {
            const rejKey = entryKey + "|" + r.id;
            if (kb.companyMappings[rejKey] && kb.companyMappings[rejKey].status === "rejected") continue;
            const c = scoreCompany(entry.original, r.properties.name);
            if (c === "HIGH" || (c === "MEDIUM" && bestConf !== "HIGH")) {
              best = r; bestConf = c;
            }
          }
          if (best && bestConf !== "NONE") {
            companyHits[entryKey] = { hsCompany: best, confidence: bestConf };
          }
        } catch (_) { /* skip */ }
        searched++;
        if (searched % 100 === 0 || searched === unknownCompanies.length) {
          prog(searched, unknownCompanies.length, "Companies searched");
        }
      })
    );
  }

  const matched = Object.values(companyHits);
  const highN    = matched.filter((m) => m.confidence === "HIGH").length;
  const medN     = matched.filter((m) => m.confidence === "MEDIUM").length;
  const learnedN = matched.filter((m) => m.confidence === "LEARNED").length;
  console.log(`  ✅ Matched: ${matched.length} companies (${learnedN} LEARNED, ${highN} HIGH, ${medN} MEDIUM)`);
  console.log(`  ❌ Unmatched: ${uniqCompanies.length - matched.length}\n`);

  // ── 4. Fetch contacts for matched companies ───────────────────────
  console.log("  👥 Fetching decision-maker contacts...\n");

  const companyContacts = {};
  const matchedIds = [...new Set(matched.map((m) => m.hsCompany.id))];
  let fetched = 0;

  await Promise.all(
    matchedIds.map(async (compId) => {
      try {
        const assoc = await hubspot("GET", `/crm/v4/objects/companies/${compId}/associations/contacts`);
        const ids = (assoc.results || []).map((r) => r.toObjectId);
        if (ids.length === 0) { companyContacts[compId] = []; return; }

        const batch = await hubspot("POST", "/crm/v3/objects/contacts/batch/read", {
          properties: CONTACT_PROPS,
          inputs: ids.slice(0, 100).map((id) => ({ id: String(id) })),
        });
        companyContacts[compId] = batch.results || [];
      } catch (_) {
        companyContacts[compId] = [];
      }

      fetched++;
      if (fetched % 25 === 0 || fetched === matchedIds.length) {
        prog(fetched, matchedIds.length, "Company contacts fetched");
      }
    })
  );

  const totalContacts = Object.values(companyContacts).reduce((s, a) => s + a.length, 0);
  console.log(`\n  📊 Total contacts pulled: ${totalContacts}\n`);

  // ── 5. Build review CSV (deduplicated by company) ─────────────────

  // 5a. Group CSV rows by matched HubSpot company
  const companyGroups = {}; // hsCompanyId → { match, normKey, csvRef }
  for (const [normKey, match] of Object.entries(companyHits)) {
    const compId = match.hsCompany.id;
    if (!companyGroups[compId]) {
      const entry = compMap[normKey];
      const firstRow = entry ? entry.rowIdxs[0] : 0;
      companyGroups[compId] = {
        match,
        normKey,
        csvRow: firstRow + 2,
        csvCompany: entry ? entry.original : "",
        csvTitle: entry && ti !== -1 ? (data[firstRow][ti] || "").trim() : "",
        csvAttendees: entry ? entry.rowIdxs.length : 0,
      };
    }
  }

  // Human-facing review CSV: only the columns needed for the two decisions
  const REVIEW_HEADERS = [
    "csv_company", "match_confidence",
    "hs_company_name", "hs_contact_name", "hs_contact_email", "hs_contact_title",
    "company_match", "include",
  ];
  const reviewLines = [csvLine(REVIEW_HEADERS)];
  const meta = []; // sidecar: full system data per review row

  let stats = { emailMatch: 0, knownCompany: 0, dmContacts: 0, pinnedContacts: 0, companyOnly: 0, noMatch: 0 };

  function addRow(reviewFields, metaObj) {
    reviewLines.push(csvLine(reviewFields));
    meta.push(metaObj);
  }

  // 5b. Email hits (per-CSV-row)
  for (let r = 0; r < data.length; r++) {
    if (!emailHits[r]) continue;
    const company = (data[r][ci] || "").trim();
    const title   = ti !== -1 ? (data[r][ti] || "").trim() : "";
    const c = emailHits[r];
    const p = c.properties;
    stats.emailMatch++;
    addRow(
      [company, "HIGH", p.company || "", [p.firstname, p.lastname].filter(Boolean).join(" "), p.email || "", p.jobtitle || "", "", ""],
      { csvRow: r + 2, csvCompany: company, csvTitle: title, csvAttendees: 1,
        matchType: "EMAIL", matchConfidence: "HIGH",
        hsCompanyName: p.company || "", hsCompanyId: "", hsCompanyDomain: "",
        hsContactId: p.hs_object_id, isDecisionMaker: p.is_decision_maker_title === "true",
        titleRelevance: scoreTitle(title, p.jobtitle || "") },
    );
  }

  // 5c. Company-matched contacts (deduplicated by company)
  for (const [compId, group] of Object.entries(companyGroups)) {
    const { match, csvRow, csvCompany, csvTitle, csvAttendees } = group;
    const hs = match.hsCompany.properties;
    const isLearned = match.confidence === "LEARNED";

    if (isLearned) stats.knownCompany++;

    const allContacts = companyContacts[compId] || [];
    const prefs = kb.contactPreferences[compId] || {};
    const includeSet = new Set(prefs.include || []);
    const excludeSet = new Set(prefs.exclude || []);

    const dmContacts = [];
    const pinnedExtras = [];
    const seenIds = new Set();

    for (const c of allContacts) {
      const cid = c.properties.hs_object_id || c.id;
      if (excludeSet.has(String(cid))) continue;
      seenIds.add(String(cid));

      const isDM = c.properties.is_decision_maker_title === "true";
      const isPinned = includeSet.has(String(cid));
      const excluded = isExcludedTitle(c.properties.jobtitle);

      if (isPinned) {
        // Pinned contacts always show, regardless of title
        if (isDM) dmContacts.push({ c, isPinned: true, matchType: "PINNED" });
        else pinnedExtras.push({ c, isPinned: true, matchType: "PINNED" });
      } else if (isDM && !excluded) {
        dmContacts.push({ c, isPinned: false, matchType: "CONTACT" });
      }
    }

    for (const pid of includeSet) {
      if (!seenIds.has(pid) && !excludeSet.has(pid)) {
        pinnedExtras.push({
          c: { properties: { hs_object_id: pid, firstname: "", lastname: "", email: "(pinned - fetch needed)", jobtitle: "", is_decision_maker_title: "", influence_score: "" } },
          isPinned: true,
          matchType: "PINNED",
        });
      }
    }

    const contactsToShow = [...pinnedExtras, ...dmContacts];

    contactsToShow.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      const ia = parseInt(a.c.properties.influence_score || "0", 10);
      const ib = parseInt(b.c.properties.influence_score || "0", 10);
      if (ia !== ib) return ib - ia;
      const tsA = scoreTitle(csvTitle, a.c.properties.jobtitle || "");
      const tsB = scoreTitle(csvTitle, b.c.properties.jobtitle || "");
      const ord = { EXACT: 0, PARTIAL: 1, NONE: 2 };
      return (ord[tsA] ?? 9) - (ord[tsB] ?? 9);
    });

    if (contactsToShow.length === 0) {
      stats.companyOnly++;
      const mType = isLearned ? "KNOWN" : "COMPANY";
      addRow(
        [csvCompany, match.confidence, hs.name, "", "", "", isLearned ? "Y" : "", ""],
        { csvRow, csvCompany, csvTitle, csvAttendees,
          matchType: mType, matchConfidence: match.confidence,
          hsCompanyName: hs.name, hsCompanyId: compId, hsCompanyDomain: hs.domain || "",
          hsContactId: "", isDecisionMaker: false, titleRelevance: "no_dm_contacts" },
      );
      continue;
    }

    for (const { c, matchType, isPinned } of contactsToShow) {
      const cp = c.properties;
      const isDM = cp.is_decision_maker_title === "true";
      if (matchType === "PINNED") stats.pinnedContacts++;
      else stats.dmContacts++;

      const mType = isLearned ? "KNOWN" : matchType;
      const prefillCompany = isLearned ? "Y" : "";
      const prefillInclude = isPinned ? "Y" : "";
      addRow(
        [csvCompany, match.confidence, hs.name, [cp.firstname, cp.lastname].filter(Boolean).join(" "), cp.email || "", cp.jobtitle || "", prefillCompany, prefillInclude],
        { csvRow, csvCompany, csvTitle, csvAttendees,
          matchType: mType, matchConfidence: match.confidence,
          hsCompanyName: hs.name, hsCompanyId: compId, hsCompanyDomain: hs.domain || "",
          hsContactId: cp.hs_object_id, isDecisionMaker: isDM,
          titleRelevance: scoreTitle(csvTitle, cp.jobtitle || "") },
      );
    }
  }

  for (const entry of uniqCompanies) {
    if (!companyHits[norm(entry.original)]) stats.noMatch++;
  }

  ensureDir(path.dirname(output));
  fs.writeFileSync(output, reviewLines.join("\n"), "utf8");

  const metaPath = output.replace(/\.csv$/i, ".meta.json");
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), "utf8");

  // ── 6. Summary ────────────────────────────────────────────────────
  console.log("─".repeat(55));
  console.log("  📊 Results Summary");
  console.log(`     Total CSV rows:              ${data.length}`);
  console.log(`     Email matches (direct):      ${stats.emailMatch}`);
  console.log(`     Known companies (learned):   ${stats.knownCompany}`);
  console.log(`     Decision-maker contacts:     ${stats.dmContacts}`);
  console.log(`     Pinned contacts (learned):   ${stats.pinnedContacts}`);
  console.log(`     Company only (no DM hits):   ${stats.companyOnly}`);
  console.log(`     No HubSpot match:            ${stats.noMatch}`);
  console.log();
  console.log(`  📁 Review CSV:  ${output}`);
  console.log(`     Metadata:    ${metaPath}`);
  console.log(`     Actionable rows: ${reviewLines.length - 1}`);
  console.log();
  console.log("  ➡️  Next: open the CSV, fill 'company_match' and 'include' columns (Y/N), then run:");
  console.log(`     node scripts/conference-match.js commit --reviewed "${output}" --list-name "Your List Name"`);
  console.log("─".repeat(55));
}

// =====================================================================
//  COMMIT MODE (with learning)
// =====================================================================
async function commitMode() {
  const reviewedPath = getArg("reviewed");
  const listName     = getArg("list-name");
  const source       = getArg("source", listName);

  if (!reviewedPath || !listName) {
    console.error('Usage: node conference-match.js commit --reviewed <path> --list-name "Name"');
    process.exit(1);
  }

  console.log("\n📋 Committing approved contacts to HubSpot\n");

  // Read simplified review CSV + sidecar metadata
  const resolvedPath = path.resolve(reviewedPath);
  const metaPath = resolvedPath.replace(/\.csv$/i, ".meta.json");

  const rows    = parseCSV(fs.readFileSync(resolvedPath, "utf8"));
  const headers = rows[0].map((h) => h.trim());
  const data    = rows.slice(1);
  const compMatchIdx = headers.indexOf("company_match");
  const includeIdx   = headers.indexOf("include");

  if (compMatchIdx === -1 || includeIdx === -1) {
    console.error('Review CSV must have "company_match" and "include" columns');
    process.exit(1);
  }

  let meta;
  try {
    meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
  } catch (_) {
    console.error(`Metadata file not found: ${metaPath}\n  (Generated alongside the review CSV during match mode)`);
    process.exit(1);
  }

  if (meta.length !== data.length) {
    console.error(`Row count mismatch: review CSV has ${data.length} data rows, metadata has ${meta.length}.`);
    process.exit(1);
  }

  // Pair each review row with its metadata + both decisions
  const paired = data.map((row, i) => ({
    companyMatch: (row[compMatchIdx] || "").trim().toUpperCase(),
    include:      (row[includeIdx] || "").trim().toUpperCase(),
    meta: meta[i],
  }));

  // ── 1. Create HubSpot list ────────────────────────────────────────
  const contactIds = [
    ...new Set(
      paired
        .filter((p) => p.include === "Y" && p.meta.hsContactId)
        .map((p) => p.meta.hsContactId)
    ),
  ];

  console.log(`  Approved unique contacts: ${contactIds.length}\n`);

  if (contactIds.length > 0) {
    console.log(`  Creating list: "${listName}"...`);
    const list = await hubspot("POST", "/crm/v3/lists/", {
      name: listName,
      objectTypeId: "0-1",
      processingType: "MANUAL",
    });
    const listId = (list.list && list.list.listId) || list.listId;
    if (!listId) {
      console.error("  ⚠️  List created but could not extract ID. Response:", JSON.stringify(list).substring(0, 500));
      process.exit(1);
    }
    console.log(`  ✅ List created (ID: ${listId})\n`);

    const BATCH = 250;
    for (let i = 0; i < contactIds.length; i += BATCH) {
      const batch = contactIds.slice(i, i + BATCH);
      await hubspot("PUT", `/crm/v3/lists/${listId}/memberships/add`, batch);
      console.log(`  Added batch ${Math.floor(i / BATCH) + 1}: ${batch.length} contacts`);
    }
    console.log(`\n  ✅ ${contactIds.length} contacts added to "${listName}"\n`);
  } else {
    console.log("  No contacts to add to list.\n");
  }

  // ── 2. Save final list CSV to data/lists/ ──────────────────────────
  const includedPairs = paired.filter((p) => p.include === "Y");
  if (includedPairs.length > 0) {
    const slug = listName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const listCsvPath = path.join(LISTS_DIR, slug + ".csv");
    ensureDir(LISTS_DIR);
    const FINAL_HEADERS = ["csv_company", "hs_company_name", "hs_contact_name", "hs_contact_email", "hs_contact_title", "hs_company_id", "hs_contact_id"];
    const csvCompIdx = headers.indexOf("csv_company");
    const hsCompIdx  = headers.indexOf("hs_company_name");
    const nameIdx    = headers.indexOf("hs_contact_name");
    const emailIdx   = headers.indexOf("hs_contact_email");
    const titleIdx   = headers.indexOf("hs_contact_title");
    const listLines = [csvLine(FINAL_HEADERS)];
    for (let i = 0; i < data.length; i++) {
      if (paired[i].include !== "Y") continue;
      const row = data[i];
      const m = meta[i];
      listLines.push(csvLine([
        row[csvCompIdx] || "", row[hsCompIdx] || "",
        row[nameIdx] || "", row[emailIdx] || "", row[titleIdx] || "",
        m.hsCompanyId, m.hsContactId,
      ]));
    }
    fs.writeFileSync(listCsvPath, listLines.join("\n"), "utf8");
    console.log(`  📁 Final list saved: ${listCsvPath} (${includedPairs.length} rows)\n`);
  }

  // ── 3. Learn from review decisions ────────────────────────────────
  console.log("  📚 Extracting corrections for knowledge file...\n");

  const kb = loadKnowledge();
  let learned = { companiesConfirmed: 0, companiesRejected: 0, contactsIncluded: 0, contactsExcluded: 0 };

  for (const { companyMatch, include, meta: m } of paired) {
    if (!m.hsCompanyId || !m.csvCompany) continue;

    const normCsv   = norm(m.csvCompany);
    const companyId  = m.hsCompanyId;
    const contactId  = m.hsContactId;
    const matchType  = m.matchType;

    // Company-level learning
    if (companyMatch === "Y") {
      if (!kb.companyMappings[normCsv] || kb.companyMappings[normCsv].status !== "confirmed") {
        kb.companyMappings[normCsv] = {
          hsCompanyId: companyId,
          hsCompanyName: m.hsCompanyName,
          hsCompanyDomain: m.hsCompanyDomain,
          status: "confirmed",
          source,
        };
        learned.companiesConfirmed++;
      }
    } else if (companyMatch === "N" && matchType !== "KNOWN" && matchType !== "PINNED") {
      const rejKey = normCsv + "|" + companyId;
      if (!kb.companyMappings[rejKey]) {
        kb.companyMappings[rejKey] = { status: "rejected", source };
        learned.companiesRejected++;
      }
    }

    // Contact-level learning (only when company is confirmed)
    if (contactId && companyMatch !== "N") {
      if (!kb.contactPreferences[companyId]) kb.contactPreferences[companyId] = {};
      const prefs = kb.contactPreferences[companyId];

      if (include === "Y") {
        if (!prefs.include) prefs.include = [];
        if (!prefs.include.includes(contactId)) {
          prefs.include.push(contactId);
          learned.contactsIncluded++;
        }
        if (prefs.exclude) prefs.exclude = prefs.exclude.filter((id) => id !== contactId);
      } else if (include === "N") {
        if (!prefs.exclude) prefs.exclude = [];
        if (!prefs.exclude.includes(contactId)) {
          prefs.exclude.push(contactId);
          learned.contactsExcluded++;
        }
        if (prefs.include) prefs.include = prefs.include.filter((id) => id !== contactId);
      }
    }
  }

  saveKnowledge(kb);

  console.log("  📚 Knowledge updated:");
  console.log(`     Companies confirmed:  +${learned.companiesConfirmed}`);
  console.log(`     Companies rejected:   +${learned.companiesRejected}`);
  console.log(`     Contacts included:    +${learned.contactsIncluded}`);
  console.log(`     Contacts excluded:    +${learned.contactsExcluded}`);
  console.log(`\n  📁 Knowledge file: ${KNOWLEDGE_PATH}\n`);
}

// ─── Main ────────────────────────────────────────────────────────────
if (MODE === "match") {
  matchMode().catch((e) => { console.error("\nFatal:", e.message); process.exit(1); });
} else if (MODE === "commit") {
  commitMode().catch((e) => { console.error("\nFatal:", e.message); process.exit(1); });
} else {
  console.log(`
Conference Attendee → HubSpot Matcher (with Learning)

Usage:
  node scripts/conference-match.js match  --csv <path> [options]
  node scripts/conference-match.js commit --reviewed <path> --list-name "Name"

Match options:
  --company-col <col>   Company column name (default: "Company")
  --title-col <col>     Title column name (default: "Title")
  --email-col <col>     Email column name, if available (optional)
  --target-only         Only match against HubSpot target accounts
  --output <path>       Review CSV output path

Commit options:
  --reviewed <path>     Path to human-reviewed CSV
  --list-name <name>    HubSpot static list name to create
  --source <name>       Label for knowledge file entries (default: list name)
`);
}
