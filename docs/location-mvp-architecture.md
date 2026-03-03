# Location Object — MVP Architecture

> **Scope:** First custom object only. Only properties, associations, and labels we will **100% use** in Phase 1. No “nice to have” or easy-to-pull fields.  
> Department and Phase 2+ (champion association, extra fields) are out of scope for this doc.
>
> **Build & rollout:** All processes and rollout activities for the Location object **must align with** the PPT (People, Process, Technology) and ADKAR adoption framework in **§2** below. Use it to structure the plan, survive stakeholder scrutiny, and ensure net-organizational benefit.
>
> **Canonical process:** `docs/location-process-and-decisions.md` — deal close → API → Slack review → webhook (one Location per NPI); Deal ↔ Location; NPI policy; pilot; Company audit.

---

## 1. Object definition (MVP) (MVP)

| Attribute | Value |
|-----------|--------|
| **Object name** | Location |
| **Singular / plural** | Location / Locations |
| **Primary display property** | `name` |
| **Purpose** | One physical site of a customer; replaces parent-child Company as “site.” |

---

## 2. Build & rollout framework: PPT + ADKAR

Use this framework to structure the Location build and rollout. **PPT** ensures we build the right thing (future-proofing and business benefit); **ADKAR** ensures the team actually uses it. All process docs (e.g. `docs/location-minimum-process.md`, playbooks) should fall in line with these guidelines.

### 2.1 Strategic framework: PPT (People, Process, Technology)

Stakeholders often focus on **Technology** (fields, object); projects usually fail because of **Process** (bad workflows) or **People** (lack of training). Address all three.

#### Process (the "Why" and "How")

| Element | Location MVP application |
|--------|---------------------------|
| **Current state** | Site data today: parent-child Companies as "sites," or spreadsheets/other tools; manual reporting; no single source of truth per physical site. |
| **Future state** | Deal closed won → API returns array (NPI × address × phone × location type) → CS reviews in Slack → webhook creates Location records (one per NPI), associated to Company; optionally to Deal. See `docs/location-process-and-decisions.md` §1. |
| **Net-org benefit** | (1) **Fewer clicks** — Company record shows location count and roll-ups without opening child records. (2) **Better reporting** — accurate per-site onboarding and revenue. (3) **Automation** — deal close creates Location and task; NPI triggers enrichment; no manual address/phone entry. |
| **Metric to watch** | Time saved per record (e.g. minutes per new customer) or increase in data accuracy (e.g. % of Companies with at least one Location and NPI filled). |
| **The "Stop" list** | **Verify with CS leader Ian** what we stop doing. Document in `docs/location-process-and-decisions.md` §5 and here when finalized. |

#### Technology (the "What")

| Element | Location MVP application |
|--------|---------------------------|
| **Data architecture** | **Company → Location** one-to-many. **Location → Contact** many-to-one (Primary contact). **Deal ↔ Location** many-to-many (locations on deal; location on multiple deals). See `docs/location-process-and-decisions.md` §2. Document HubSpot delete behavior for Company. |
| **Automation** | Deal closed won → workflow triggers API → array → CS review in Slack → webhook creates Location records (one per NPI), associates to Company (and optionally to Deal). Check: Deal must have correct Company. On Location edit: NPI enrichment; onboarding_status → Company roll-up. See `docs/location-process-and-decisions.md` §1, §3. |
| **Future-proofing** | Use **picklists** (enumerations) not free text where possible: e.g. `onboarding_status` (Not started, In progress, Complete). Allow "Other" or an escape valve only where edge cases are real; keep reporting clean. Avoid hard-coding process steps in workflow names; use stage IDs from `.cursor/hubspot-context/hs-pipeline.md`. |

#### People (the "Who")

| Stakeholder | WIIFM (What's In It For Me) |
|-------------|-----------------------------|
| **Sales** | Zero touch. Close the deal as today; no new steps. Deal close triggers Location creation and task so nothing is forgotten. |
| **CS (Customer Success)** | One field (NPI) at deal close; optional Primary contact. Address/phone auto-filled from Mimi Labs. One dropdown (onboarding_status) as they progress. No manual reporting or re-verification loops. |
| **Finance / Billing** | Enter potential/captured revenue on Location when known; Company roll-ups and % captured update automatically. Single source for location-level revenue. |
| **Leadership / Ops** | Dashboards and reports from Company roll-ups (location count, onboarding status, revenue capture %). No more manual aggregation. |

**ADKAR integration** — Plan rollout communication using the acronym below (§2.2).

### 2.2 Adoption: ADKAR model

When stakeholders ask, "How will we get people to actually fill this out?", use Prosci's ADKAR model.

| Phase | Action for Location rollout |
|-------|-----------------------------|
| **Awareness** | Communicate why the object exists: e.g. "To stop manual reporting and scattered site data; to give one place per physical site and auto-enrich from NPI." |
| **Desire** | Highlight personal benefits: "Sales: no new steps." "CS: enter NPI once; address/phone fill automatically." "Finance: enter revenue on Location; Company totals update automatically." |
| **Knowledge** | Provide training: where to find the Location record, when it's created, which fields to fill (NPI, optional Primary contact, onboarding_status). Loom/short guides; link from playbook. |
| **Ability** | Pilot with **one CS rep** as champion; then expand. See `docs/location-process-and-decisions.md` §6. Office hours; ensure API → Slack → webhook works before full rollout. |
| **Reinforcement** | Build dashboards from Location/Company roll-ups and **replace existing dashboards**; see `docs/location-process-and-decisions.md` §7. |

### 2.3 Pre-mortem: "Hole-poking" preparation

Stakeholders will poke holes in the plan. Prepare answers in advance, by PPT category.

| Category | Gotcha | Prepared answer |
|----------|--------|-----------------|
| **Process** | "What if we have multiple locations at close?" | API returns all locations for company; CS reviews in Slack; webhook creates one Location per NPI. Deal ↔ Location associates which are in scope; some associated to deals when they go live. See `docs/location-process-and-decisions.md` §2. |
| **Process** | "What if NPI is wrong or we don't have it?" | Enrichment is fill-blanks-only; no overwrite. If NPI is missing, CS enters when known; if wrong, correct NPI and re-run enrichment (or spot-fix). Document in playbook. |
| **Process** | "What do we stop doing?" | Verify with Ian (CS). Document in Stop list and `docs/location-process-and-decisions.md` §5. |
| **Technology** | "What happens if we delete the parent Company?" | Document HubSpot behavior (associations vs cascade). If Locations exist, consider blocking Company delete or archiving instead; document in implementation notes. |
| **Technology** | "What if Mimi Labs is down?" | Enrichment fails gracefully; CS can type address/phone in exception cases. Fill-blanks-only avoids overwriting good data when enrichment runs later. |
| **Technology** | "What about the existing Sites object?" | Decision required: migrate/consolidate vs run Location in parallel. See `docs/location-erd.md`. Document in "Stop" list once decided. |
| **People** | "Sales will forget to do X." | Sales touch = zero; no Location steps for Sales. Deal close triggers automation. |
| **People** | "CS won't enter NPI." | Task created at deal close: "Add NPI for [Company]"; link to Location. Dashboard of Companies with no Location or missing NPI; office hours and reinforcement so the object is the path of least resistance. |
| **Process** | "How do we know which deal created this Location?" | Not needed; locations created in one batch. We need **Deal ↔ Location** for "which locations on this deal" and "which deals for this location." See `docs/location-process-and-decisions.md` §2. |
| **Process** | "Deal has no Company or wrong Company at close." | Workflow must check: if Deal has no associated Company, do not create Location; create Task/alert only. Document in workflow spec. |
| **Process** | "Two deals close for same Company — duplicate Location names?" | Default name may repeat ("Company - Primary"). CS renames or we improve default (e.g. include deal name or "Site 1"/"Site 2"). Document in playbook. |
| **Technology** | "What if NPI is invalid or same NPI on two Locations?" | Validate 10-digit; **either** set NPI **unique** in HubSpot if one record per NPI globally **or** (recommended for shared-NPI chains) do **not** set unique; enforce **compound uniqueness in webhook** (NPI + address_street). Lock NPI (read-only after creation); data policy + alerts. See `docs/location-process-and-decisions.md` §9 and `docs/location-pre-launch-gaps-and-recommendations.md` §2. |
| **People** | "What if we don't build dashboards from Location/roll-ups?" | Reinforcement fails. **Replace** existing dashboards with Location/roll-up–based ones; see `docs/location-process-and-decisions.md` §7 and checklist. |

Update this table as new gotchas surface during rollout.

### 2.4 ERD review: PPT and pre-mortem alignment

Review of the current Location ERD and related docs against the PPT framework and pre-mortem. Use this to harden the design and docs before rollout.

#### Process (PPT) — weaknesses

| Issue | Where it appears | Risk / pre-mortem gap | Recommendation |
|-------|------------------|------------------------|-----------------|
| **Data flow contradicts Phase 1** | `location-erd.md` §4 Data Flow: "CS->>HubSpot: Create Location record" | Main ERD implies CS creates Location; Phase 1/MVP say workflow creates it. Confuses "what we stop doing" and who owns creation. | Align `location-erd.md` §4 with Phase 1: workflow creates Location and Task; CS sets NPI and optional Primary contact. Or label the diagram "Alternative / Phase 0" and add Phase 1 flow. |
| **"Stop" list not in ERD** | Stop list only in MVP §2.1 | Teams building from ERD alone won't see what to stop (parent-child Companies, spreadsheets, manual address/phone). | Add a short "Stop list" or "Replaced by" callout in `location-erd.md` §5 or §6; or reference MVP §2.1. |
| **Multiple deals, same Company** | Phase 1: one Location per deal close | If two deals close for same Company, workflow creates two Locations with same default name ("Company - Primary"). Duplicate names until CS renames. | Document: default name could include deal name or " - Site 1" / " - Site 2" (e.g. from count of existing Locations); or accept duplicates and add to pre-mortem with answer: "CS renames; Phase 2 may add smarter default." |
| **Deal → Location not modeled** | No Deal → Location in Phase 1 | "Which deal drove this Location?" requires Deal → Company → creation time. No direct reporting. | Add to pre-mortem: "How do we know which deal created a Location?" Answer: Via Deal's Company and workflow/creation timestamp. Optional Phase 2: add Deal → Location or `source_deal_id` on Location. |
| **Orphan / wrong Company** | Workflow assumes Deal has associated Company | If Deal has no Company or wrong Company, Location is created on wrong parent or workflow fails. | Add workflow guard: if Deal has no associated Company, do not create Location; create Task only (or alert). Document in implementation notes and pre-mortem. |
| **Company with zero Locations** | Roll-ups when location_count = 0 | `location_onboarding_status` when there are no Locations is undefined (blank vs "No locations"). | Define: if `location_count` = 0, set `location_onboarding_status` to blank or a dedicated option "No locations"; document in §7 workflow logic. |

#### Technology (PPT) — weaknesses

| Issue | Where it appears | Risk / pre-mortem gap | Recommendation |
|-------|------------------|------------------------|-----------------|
| **Company delete / cascade** | MVP §2.1 Technology; pre-mortem | ERD doesn't state HubSpot's delete behavior (association-only vs cascade). | In `location-erd.md` §6 or Phase 1 ERD: add "Implementation: document HubSpot behavior when Company is deleted (associations only vs cascade); decide whether to block delete when Locations exist." |
| **Location without Parent** | Cardinality Company 1 : 0..n Location | 0..n could be read as "Location can have zero Companies." Phase 1 intent: every Location has exactly one Company. | Clarify in ERD: "Every Location must be associated to exactly one Company in Phase 1." Or use 1..n from Company side and document "no orphan Locations." |
| **Sites vs Location** | `location-erd.md` note; pre-mortem | Decision (migrate vs parallel) is open. Two "site" concepts cause confusion. | Keep pre-mortem entry; add to ERD §5: "Decision required before full rollout: migrate/consolidate Sites (`2-56022093`) or run in parallel; document in Stop list once decided." |
| **onboarding_status edge cases** | Enum: Not started, In progress, Complete | No "On hold," "Churned before onboarding," or "Other." CS may need an escape valve. | Consider adding "On hold" or "Other" to enum (MVP §6); or document: "If status doesn't fit, use In progress and add a note." |
| **NPI format and duplicates** | Location.npi is text, no validation | Bad NPI (wrong length, non-numeric) can be entered; Mimi Labs may fail. Same NPI on two Locations under same Company = duplicate enrichment. | Add to pre-mortem: "What if NPI is invalid or duplicated?" Answer: Validate 10-digit in workflow or form; optionally warn if NPI already exists on another Location for same Company. Document in playbook. |

#### People (PPT) — weaknesses

| Issue | Where it appears | Risk / pre-mortem gap | Recommendation |
|-------|------------------|------------------------|-----------------|
| **People not in ERD** | ERD docs show objects only | Who creates/updates each object isn't in the ERD; WIIFM lives only in MVP §2. | Add a short "People (Phase 1)" subsection to `location-erd.md` or Phase 1 ERD: Sales = no touch; CS = NPI, Primary contact, onboarding_status; Finance = revenue on Location. |
| **Pilot definition** | location-erd.md §3: "~10 customers" | Pilot is by customer count; which CS/team is unclear. ADKAR Ability needs a clear pilot. | Define pilot: e.g. "First 10 customers whose deal closes after go-live" or "Customers assigned to [CS pod]"; add to MVP §2.2 Ability or rollout playbook. |
| **Reinforcement not built** | ADKAR Reinforcement = dashboards from new object | Implementation checklist doesn't include "Create Company dashboard (location_count, onboarding_status, revenue %)." Without it, adoption may lag. | Add to implementation checklist: "Create Company dashboard (or report) that uses location_count, location_onboarding_status, location_pct_revenue_captured so the object is the path of least resistance." Add pre-mortem: "What if we don't build the dashboards?" → Adoption will lag; add to checklist. |

#### Pre-mortem: new gotchas to add

Add these rows to the pre-mortem table (§2.3) when updating the doc:

| Category | Gotcha | Prepared answer |
|----------|--------|-----------------|
| **Process** | "How do we know which deal created this Location?" | Phase 1: via Deal's associated Company and creation timestamp. Optional later: Deal → Location association or source_deal_id on Location. |
| **Process** | "Deal has no Company or wrong Company at close." | Workflow must check: if Deal has no associated Company, do not create Location; create Task/alert only. Document in workflow spec. |
| **Process** | "Two deals close for same Company — duplicate Location names?" | Default name may repeat ("Company - Primary"). CS renames or we improve default (e.g. include deal name or "Site 1"/"Site 2"). Document in playbook. |
| **Technology** | "What if NPI is invalid or same NPI on two Locations?" | Validate 10-digit; **either** set NPI **unique** in HubSpot if one record per NPI globally **or** (recommended for shared-NPI chains) do **not** set unique; enforce **compound uniqueness in webhook** (NPI + address_street). Lock NPI (read-only after creation); data policy + alerts. See `docs/location-process-and-decisions.md` §9 and `docs/location-pre-launch-gaps-and-recommendations.md` §2. |
| **People** | "What if we don't build dashboards from Location/roll-ups?" | Reinforcement fails. **Replace** existing dashboards with Location/roll-up–based ones; see `docs/location-process-and-decisions.md` §7 and checklist. |

#### Summary

- **Process:** Align main ERD data flow with Phase 1 (workflow creates Location); document guards (Deal must have Company), default naming for multiple Locations, and Company roll-up when location_count = 0.
- **Technology:** Document delete behavior and "no orphan Locations"; decide Sites vs Location; consider onboarding_status escape valve and NPI validation/duplicate warning.
- **People:** Add a People subsection to the ERD; define pilot (who/count); add dashboard/report build to checklist and pre-mortem so Reinforcement is explicit.

---

## 3. Properties (MVP only)

**Only these.** All are used for creation, enrichment, roll-up, or CS workflow. For **alternative recommendations** (split address, NPI uniqueness, revenue automation), see `docs/location-pre-launch-gaps-and-recommendations.md`.

| # | Label | Internal name | Type | Required | Source | Why MVP |
|---|--------|----------------|------|----------|--------|--------|
| 1 | Name | `name` | string (text) | Yes | CS / workflow | Display; required for record creation and UI. |
| 2 | Address | `address` | string (text) | No | Mimilabs | Core location data; used for enrichment. **Alternative:** Split into address_street, address_city, address_state (picklist), address_zip, address_country for reporting/territory; see pre-launch doc §1. |
| 3 | Phone | `phone` | string (phonenumber) | No | Mimilabs | Core location data; used for enrichment. |
| 4 | NPI (enrichment key) | `npi` | string (text) | No | CS | 10-digit NPI for Mimilabs/NPPES lookup. **Universal for FQHCs and non-FQHCs.** See `docs/identifiers-fqhc-non-fqhc.md`. |
| 5 | HRSA ID (FQHC only) | `hrsa_id` | string (text) | No | CS | Optional; FQHC-only for HRSA/340B tracking. Not used for Mimilabs. |
| 6 | Onboarding status | `onboarding_status` | enumeration (select) | No | CS | Set when CS creates record at deal close; rolled up to Company. |
| 7 | Potential revenue | `potential_revenue` | number | No | CS / deal data | Revenue potential at this location; rolled up to Company. |
| 8 | Captured revenue | `captured_revenue` | number | No | CS / billing | Revenue captured at this location; rolled up to Company. |

**HubSpot default properties (do not create):** `createdate`, `hs_lastmodifieddate`, `hs_object_id`. Use `name` as primary display.

**Excluded from MVP (do not add yet):** Primary contact as a *property* (we use association only), customer status (not in use), fax, city/state/zip as separate fields, time zone, site type, any Phase 2+ fields.

**Identifiers:** Use **NPI** (`npi`) as the Mimilabs enrichment key for both FQHCs and non-FQHCs. **HRSA ID** (`hrsa_id`) is optional, FQHC-only — see `docs/identifiers-fqhc-non-fqhc.md`.

---

## 4. Associations (MVP only)

**Three association types:** Company ↔ Location, Location ↔ Contact, Deal ↔ Location.

| From | To | Cardinality | Label (from → to) | Label (to → from) | Why MVP |
|------|-----|-------------|-------------------|-------------------|--------|
| Company | Location | 1 → many | Location | Parent | Parent account; every Location belongs to one Company. |
| Location | Contact | many → 1 | Primary contact | Primary location | One primary contact per site; used for CS and enrichment flow. |
| Deal | Location | many ↔ many | Location | Deal | Which locations are on this deal; which deals this location is on. See `docs/location-process-and-decisions.md` §2. |

**Excluded from MVP:** Contact ↔ Location "Champion at happy location" (Phase 2).

---

## 5. Association labels (exact)

Use one association type per relationship. Define labels so they read clearly in the UI.

| Relationship | This object | Associated object | Label on this object’s side |
|--------------|-------------|-------------------|-----------------------------|
| Company → Location | Company | Location | **Location** |
| Company → Location | Location | Company | **Parent** |
| Location → Contact | Location | Contact | **Primary contact** |
| Location → Contact | Contact | Location | **Primary location** |
| Deal → Location | Deal | Location | **Location** |
| Deal → Location | Location | Deal | **Deal** |

Implementation: when creating the association type in HubSpot, set the two labels (A→B and B→A) as above.

---

## 6. Enumerations (MVP)

Define once and reuse in workflows/reports.

**`onboarding_status`** (select, single-value)

| Value | Description |
|-------|-------------|
| Not started | Record created but onboarding not started. |
| In progress | Onboarding in progress. |
| Complete | Onboarding complete. |

*(Adjust values to match your CS playbook; keep the list minimal.)*

---

## 7. Company roll-up properties (MVP)

**On the Company record.** These aggregate from associated Location records. Create the Company properties below; configure roll-up/calculation in HubSpot to use the **Company → Location** association.

| # | Label | Internal name | Type | Roll-up / calculation | Why MVP |
|---|--------|----------------|------|------------------------|--------|
| 1 | Overall onboarding status | `location_onboarding_status` | enumeration (select) | From Locations: “worst” status wins — if any **In progress** → In progress; else if any **Not started** → Not started; else **Complete**. Implement via workflow that sets this when Location onboarding_status changes. | Single view of account-level onboarding. |
| 2 | Total potential revenue | `location_total_potential_revenue` | number | **Sum** of `Location.potential_revenue` (associated Locations). | Company-level potential. |
| 3 | Total captured revenue | `location_total_captured_revenue` | number | **Sum** of `Location.captured_revenue` (associated Locations). | Company-level captured. |
| 4 | % of total revenue captured | `location_pct_revenue_captured` | number | **Calculated:** `location_total_captured_revenue / location_total_potential_revenue * 100` when `location_total_potential_revenue` > 0; else 0. | Company-level capture rate. |
| 5 | # of locations | `location_count` | number | **Count** of associated Location records. | Headline count of sites. |

**Implementation notes**

- **Overall onboarding status:** HubSpot roll-ups from custom objects typically support count/sum/min/max, not “most common” or custom logic for enums. Use a **workflow** that runs when a Location’s `onboarding_status` changes (or on a schedule): load Company’s associated Locations, then set `location_onboarding_status` to Complete only if all are Complete; In progress if any are In progress; otherwise Not started.
- **Total potential / Total captured:** Use HubSpot **roll-up properties** on Company, source = Location, property = `potential_revenue` (sum) and `captured_revenue` (sum).
- **% captured:** Use a **calculated property** (equation) on Company: `location_total_captured_revenue / location_total_potential_revenue * 100` with a guard for divide-by-zero (e.g. `if location_total_potential_revenue > 0 then … else 0`).
- **# of locations:** Use HubSpot **roll-up** on Company: count of associated Locations.

Put these Company properties in a group such as `location_rollups` or `companyinformation` so they stay together in the UI.

---

## 8. Implementation checklist (MVP)

- [ ] Create custom object **Location** with primary display property `name`.
- [ ] Create the **8 Location properties** in §2 (name, address, phone, npi, hrsa_id, onboarding_status, potential_revenue, captured_revenue).
- [ ] Create association type **Company ↔ Location** with labels “Location” / “Parent.”
- [ ] Create association type **Location ↔ Contact** with labels “Primary contact” / “Primary location.”
- [ ] Create association type **Deal ↔ Location** with labels "Location" / "Deal" (see `docs/location-process-and-decisions.md` §2).
- [ ] Add option set for **Location** `onboarding_status` per §5.
- [ ] Create **5 Company properties** in §7 (location_onboarding_status, location_total_potential_revenue, location_total_captured_revenue, location_pct_revenue_captured, location_count).
- [ ] Configure Company **roll-ups**: sum of Location potential_revenue → location_total_potential_revenue; sum of Location captured_revenue → location_total_captured_revenue; count of Locations → location_count.
- [ ] Configure Company **calculated property** for location_pct_revenue_captured (captured / potential * 100, guard for zero potential).
- [ ] Build **workflow** to set Company location_onboarding_status from Location onboarding_status (see §7).
- [ ] Do **not** create: customer_status, fax, address_city/state/zip, "Champion at happy location" for MVP.

- [ ] **NPI:** Validate 10-digit; decide: set unique (if one NPI per Location globally) **or** do not set unique and enforce compound uniqueness (NPI + address) in webhook for shared-NPI chains; lock property (read-only after creation); data policy; flag duplicate/invalid and define alert owner + fix process (see `docs/location-process-and-decisions.md` §9 and `docs/location-pre-launch-gaps-and-recommendations.md` §2).
- [ ] **Company audit:** Run through Company properties — replaced, roll-up, removed; impact on workflows, calculations, syncs, processes (see `docs/location-process-and-decisions.md` §10).
- [ ] **Reinforcement (ADKAR):** Build dashboards from Location/Company roll-ups and **replace existing dashboards**; see §2.4 and `docs/location-process-and-decisions.md` §7.
- [ ] **Pre-launch (optional):** Consider: split address (§1), Select Scope + status for unselected locations (§3), Slack volume threshold (§4), automate potential_revenue + validation gate for Complete (§5), backfill plan for legacy customers (§6). See `docs/location-pre-launch-gaps-and-recommendations.md`.

---

## 9. Reference

- **Pre-launch gaps and recommendations:** `docs/location-pre-launch-gaps-and-recommendations.md` — address split, NPI uniqueness, Deal scope, Slack volume, revenue automation, backfill.
- **Build & rollout framework (PPT + ADKAR):** §2 in this doc — use for stakeholder planning, adoption, and pre-mortem.
- **Process & decisions (canonical):** `docs/location-process-and-decisions.md` — deal close → API → Slack → webhook; Deal ↔ Location; NPI; pilot; Company audit.
- **Other objects and integrations:** `docs/location-integrations-and-objects.md` — meetings, calls, leads, Gong, Chili Piper, Apollo
- **Company vs Location (where to work):** `docs/location-company-vs-location-where-to-work.md`
- **Minimum process (lean / Six Sigma):** `docs/location-minimum-process.md` — minimum touch for CS and Sales; aligns with PPT/ADKAR in §2.
- **Identifiers (FQHC vs non-FQHC):** `docs/identifiers-fqhc-non-fqhc.md` — NPI = universal enrichment key; HRSA ID = FQHC-only.
- **ERD / phased plan:** `docs/location-erd.md`
- **Mimilabs → HubSpot mapping:** `docs/mimilabs-hubspot-property-mapping.md`
- **Mimilabs data verification (match, completeness, freshness):** `docs/mimilabs-data-verification.md`
- **HubSpot schema:** `.cursor/hubspot-context/hs-schema.md`
- **Pipelines (e.g. deal close stage):** `.cursor/hubspot-context/hs-pipeline.md`
