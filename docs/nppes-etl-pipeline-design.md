# NPPES ETL Pipeline: Multi-Step Workflow with Claude

Pipeline that extracts company/address data from HubSpot, calls NPPES, and uses Claude to assess results and decide the next strategy. Each step is a **separate Custom code** action so each stays under the 20s limit.

---

## Overview

```
[Trigger] → Claude Search Terms (optional) → Extract → NPPES (R1) → Claude (R1) → Branch
                                                              ↓ no match
                                                    NPPES (R2) → Claude (R2) → Branch
                                                              ↓
                                                    Finalize (all sites) → Set properties / end
```

- **Claude Search Terms (optional):** Asks Claude for 3 likely legal-name search terms (exact name, formal name, parent/alternates) from company name + city/state. Outputs `searchTermsJson` for Extract. Uses **ANTHROPIC_API_KEY**; model: Claude 3 Haiku (fast/cheap).
- **Extract:** Normalize HubSpot fields, build payload. If `searchTermsJson` is provided (from previous step), use it as `nameVariants`; otherwise use hardcoded variants (name, name + " CORPORATION", etc.).
- **NPPES (per round):** Run one NPPES query based on current strategy (address-only, name-only, name variant, etc.); output raw results (truncated to fit HubSpot string limit).
- **Claude (per round):** Given payload + NPPES results, decide: (a) **match** → output NPI + legal name, or (b) **no match** → output next strategy + suggested query for the next NPPES step.
- **Finalize:** Given a chosen NPI + legal business name, one more NPPES call to get all sites for that org; output `npi`, `legalBusinessName`, `siteCount`, `locationsJson`.

HubSpot workflows cannot loop back; the “loop” is implemented as a **fixed chain** of (NPPES → Claude) pairs (e.g. 2–3 rounds), with branching on “match found?” after each Claude step.

---

## Data Flow (Schema)

All data between steps is passed via **workflow Data outputs / inputs**. Use a single JSON blob for the “state” so you don’t need 20+ separate outputs.

### 0. Claude Search Terms step (optional)

**Inputs:**

| Code input name | Source | Description |
|----------------|--------|-------------|
| `companyName`  | Company `name` | User-provided or display name |
| `city`         | Company `city` | |
| `state`        | Company `state` | |

**Secret:** `ANTHROPIC_API_KEY`

**Outputs:**

| Variable ID        | Type   | Description |
|--------------------|--------|-------------|
| `searchTermsJson`  | String | JSON array of up to 3 search strings, e.g. `["NeighborHealth", "NEIGHBORHEALTH CORPORATION", "East Boston Neighborhood Health Center"]` |

When this step runs first, pass `searchTermsJson` into **Extract** as an input; Extract will use it as `nameVariants` instead of hardcoded variants.

### 1. Extract step

**Inputs (from HubSpot or from previous step):**

| Code input name   | HubSpot source (Company) | Notes |
|-------------------|---------------------------|-------|
| `companyName`     | `name`                    | |
| `address`         | `address`                 | Optional: concat with `address2` |
| `city`            | `city`                    | |
| `state`           | `state`                   | 2-letter preferred |
| `zip`             | `zip`                     | |
| `domain`          | `domain`                  | Optional, for match hints |
| `phone`          | `phone`                   | Optional |
| `searchTermsJson` | Claude Search Terms step  | Optional; when present, used as nameVariants |

**Outputs:** (unchanged)

| Variable ID       | Type   | Description |
|-------------------|--------|-------------|
| `extractPayload`  | String | JSON: `{ companyName, address, city, state, zip, domain?, phone?, nameVariants[] }`. Scrubbed/normalized. `nameVariants` = e.g. [name, name + " CORPORATION", name + " INC"] for later rounds. |
| `round`           | Number | `1` (so first NPPES uses strategy "address_first"). |
| `nppesStrategy`   | String | `address_first` (city+state+zip; optional address filter in Claude). |
| `matchFound`      | String | `"false"` (no match yet). |

---

### 2. NPPES step (used each round: R1, R2, R3)

**Inputs:**

| Code input name   | Source              | Description |
|-------------------|---------------------|-------------|
| `extractPayload`  | Previous step       | From Extract or passed through. |
| `nppesStrategy`   | Extract or Claude   | `address_first` \| `name_exact` \| `name_variant` \| `name_fuzzy`. |
| `suggestedQuery`  | Claude (if any)     | Optional: organization_name or other params for this round. |
| `round`           | Previous step       | 1, 2, or 3. |

**Outputs:**

| Variable ID        | Type   | Description |
|--------------------|--------|-------------|
| `nppesResultsJson` | String | NPPES API `results` array, stringified. Truncate to &lt; 65k chars (e.g. first 80 records + summary). |
| `nppesResultCount` | Number | `results.length` from NPPES. |
| `extractPayload`   | String | Pass-through (so next step has same payload). |
| `round`            | Number | Pass-through. |

**Strategy → NPPES params:**

- `address_first`: `city`, `state`, `postal_code` from payload; no `organization_name`.
- `name_exact`: `organization_name` = payload.companyName, `state`, `postal_code`.
- `name_variant`: `organization_name` = suggestedQuery (e.g. companyName + " CORPORATION"), `state`, `postal_code`.
- `name_fuzzy`: `organization_name` = suggestedQuery from Claude, optional state/zip.

---

### 3. Claude Assess step (per round)

**Inputs:**

| Code input name    | Source    | Description |
|--------------------|-----------|-------------|
| `extractPayload`   | NPPES step| Normalized company/address. |
| `nppesResultsJson` | NPPES step| Raw NPPES results (truncated). |
| `nppesResultCount` | NPPES step| Total count from NPPES. |
| `round`            | NPPES step| 1, 2, or 3. |

**Outputs:**

| Variable ID        | Type   | Description |
|--------------------|--------|-------------|
| `matchFound`       | String | `"true"` \| `"false"`. |
| `npi`              | String | If match: chosen NPI from the results list. Else empty. |
| `legalBusinessName`| String | If match: legal name from that NPPES record. Else empty. |
| `nppesStrategy`    | String | For next round (if no match): e.g. `name_variant`, `name_fuzzy`. |
| `suggestedQuery`   | String | For next round: e.g. organization name to try. |
| `executionSummary` | String | Short note for logging, e.g. "Round 1: no address match; trying name variant". |
| `extractPayload`   | String | Pass-through. |
| `round`            | Number | Pass-through. |

**Claude system/user prompt (conceptual):**

- System: You only choose an NPI from the provided NPPES results list. Never invent an NPI. Output strict JSON: `{ "matchFound": boolean, "npi": "" | "number", "legalBusinessName": "" | "string", "nextStrategy": "" | "name_variant"|"name_fuzzy", "suggestedQuery": "" | "string", "summary": "string" }`.
- User: Here is the company/address we are matching: &lt;extractPayload&gt;. Here are the NPPES results for this round: &lt;nppesResultsJson&gt; (count = nppesResultCount). Which single NPI best matches, or should we try another strategy (e.g. name variant)?

---

### 4. Branch (HubSpot If/then)

- **If** `matchFound` equals `"true"` → go to **Finalize**.
- **Else if** `round` &lt; 3 → go to **NPPES** (next round); increment round in the NPPES step or in a tiny “Increment round” step if you want round in the UI.
- **Else** → no match path (e.g. set executionSummary, end or create task).

To keep round increment simple, you can have **separate branches**: “if matchFound → Finalize”, “else if round = 1 → NPPES R2”, “else if round = 2 → NPPES R3”, “else → no match”.

---

### 5. Finalize step

**Inputs:**

| Code input name     | Source   |
|---------------------|----------|
| `npi`               | Claude   |
| `legalBusinessName` | Claude   |

**Outputs:**

| Variable ID       | Type   | Description |
|-------------------|--------|-------------|
| `npi`             | String | Pass-through. |
| `legalBusinessName` | String | Pass-through. |
| `siteCount`       | Number | From second NPPES call (all sites by legal name). |
| `locationsJson`   | String | JSON array of { npi, address, city, state, zip, phone } for each site; truncate if &gt; 65k. |
| `executionSummary`| String | e.g. "OK npi=123 sites=5". |

**Logic:** One NPPES call with `organization_name` = legalBusinessName; map results to locations; set siteCount and locationsJson.

---

## HubSpot workflow layout (concrete)

1. **Enrollment:** Deal (or Company). Pull Company fields into first step via Associated company.
2. **Custom code: Extract**  
   Inputs: companyName, address, city, state, zip (and optionally domain, phone).  
   Outputs: extractPayload, round=1, nppesStrategy="address_first", matchFound="false".
3. **Custom code: NPPES R1**  
   Inputs: extractPayload, nppesStrategy, round.  
   Outputs: nppesResultsJson, nppesResultCount, extractPayload, round.
4. **Custom code: Claude R1**  
   Inputs: extractPayload, nppesResultsJson, nppesResultCount, round.  
   Outputs: matchFound, npi, legalBusinessName, nppesStrategy, suggestedQuery, executionSummary, extractPayload, round.
5. **Branch A:** If matchFound = "true" → **Finalize**.
6. **Branch B:** Else if round = 1 → **Custom code: NPPES R2** (same logic, uses suggestedQuery); then **Claude R2**; then branch again.
7. **Branch C:** Else if round = 2 → **Custom code: NPPES R3** → **Claude R3** → branch.
8. **Else:** No match (set property / task).
9. **Custom code: Finalize** (only when matchFound was true).  
   Inputs: npi, legalBusinessName.  
   Outputs: npi, legalBusinessName, siteCount, locationsJson, executionSummary.
10. **Edit records:** Set Company/Deal properties from Finalize outputs.

You can collapse R2/R3 into a single “NPPES” and single “Claude” step that read `round` and `suggestedQuery` from the previous Claude step; the code inside checks round and runs the right strategy.

---

## Optional: More HubSpot fields for match rate

- **domain** – Company `domain`; Claude can use to disambiguate (e.g. same name in two states).
- **phone** – Company `phone`; NPPES results include telephone; Claude can prefer same area code.
- **address2** – Concatenate with address for “full street” in payload.

These go into `extractPayload` and are passed to Claude so it can reason about match quality.

---

## Files to add (scripts)

- `scripts/nppes-etl-extract.js` – Extract step.
- `scripts/nppes-etl-nppes.js` – NPPES step (one script, behavior depends on nppesStrategy + suggestedQuery).
- `scripts/nppes-etl-claude.js` – Claude assess step (calls Claude API, returns match or next strategy).
- `scripts/nppes-etl-finalize.js` – Finalize step (all sites by legal name).

Each script is a single Custom code action; callback format is `callback({ outputFields: { ... } })` for HubSpot.
