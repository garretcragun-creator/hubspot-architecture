# NPPES ETL Pipeline (Multi-Step with Claude)

ETL-style pipeline: **Extract** from HubSpot → **NPPES** (per round) → **Claude assess** → branch; repeat up to 3 rounds; **Finalize** to get all sites. Each step is a separate Custom code action so each stays under the 20s limit.

---

## Design

See **[docs/nppes-etl-pipeline-design.md](../docs/nppes-etl-pipeline-design.md)** for:

- Data flow and schema (inputs/outputs per step)
- How the “loop” is implemented as a fixed chain of steps
- Optional HubSpot fields to improve match rate (domain, phone, address2)
- Branching logic (match found → Finalize; else next round or no match)

---

## Scripts (one Custom code action each)

| Step       | Script                            | Purpose |
|------------|-----------------------------------|---------|
| 0. Search terms (optional) | `nppes-etl-claude-search-terms.js` | Asks Claude for 3 likely legal-name search terms from company name + city/state. Outputs `searchTermsJson`. Secret: **ANTHROPIC_API_KEY**. |
| 1. Extract | `nppes-etl-extract.js`            | HubSpot fields → normalized JSON payload; uses `searchTermsJson` as nameVariants when provided. |
| 2. NPPES   | `nppes-etl-nppes.js`              | One NPPES call by strategy; outputs results JSON + count. |
| 3. Claude  | `nppes-etl-claude.js`             | Match or next strategy; requires **CLAUDE_API_KEY** or **ANTHROPIC_API_KEY**. |
| 4. Finalize| `nppes-etl-finalize.js`           | All sites by legal name; outputs siteCount, locationsJson. |

---

## Workflow layout (summary)

1. **Claude Search Terms (optional):** Inputs: companyName, city, state. Secret: ANTHROPIC_API_KEY. Output: searchTermsJson.
2. **Extract** — Inputs: companyName, address, city, state, zip; optional domain, phone, address2, **searchTermsJson**. When searchTermsJson is present (from previous step), it is used as nameVariants.
3. **NPPES R1** → **Claude R1** → branch (match → Finalize; else next round).
4. **NPPES R2** → **Claude R2** → branch (same).
5. **Finalize** → **Edit records**.

Use the same **NPPES** and **Claude** code for each round; wire different branches so R2 gets inputs from Claude R1, R3 from Claude R2.

---

## Requirements

- Operations Hub Professional or Enterprise (Custom code).
- HubSpot workflow secret: **CLAUDE_API_KEY** or **ANTHROPIC_API_KEY** for the Claude step.
- In each Custom code action, define the **Data outputs** listed in the design doc so the next step can use them.
