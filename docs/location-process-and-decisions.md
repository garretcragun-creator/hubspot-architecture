# Location Process & Design Decisions

> **Purpose:** Single source for the Location creation flow, Deal ↔ Location associations, open questions (verify with Ian), NPI policy, pilot approach, and Company object audit. Keeps `location-mvp-architecture.md`, `location-erd.md`, and `location-minimum-process.md` aligned with actual build.

---

## 1. Process: Deal closed won → Location creation

**Flow (workflow-driven, not manual):**

1. **Deal moves to Closed Won** (e.g. Closed Won - Onboarding / Engagement).
2. **Workflow triggers API call** that finds **all locations** for the deal’s company (e.g. NPPES or internal location API). API returns an array of: **NPI × address × phone × location type (parent or child)**.
3. **Array is reviewed and cleaned** by the **assigned CS rep** in **Slack** (not in HubSpot first).
4. **CS submits** from Slack (e.g. approve/edit then submit).
5. **Webhook fires** and creates **Location records** in HubSpot — **one record per NPI** in the submitted array. All created in one batch; associated to the Company.

**Select scope (recommended):** To avoid skewed "revenue per location" and cluttered onboarding, add a **"Select Scope"** step: CS chooses **which** of the returned locations are actually part of this Deal. Only those are associated to the Deal and treated as active for onboarding; unselected locations are created but set to status "Prospect" or "Not Active." See `docs/location-pre-launch-gaps-and-recommendations.md` §3.

**Slack volume threshold (recommended):** If the API returns more than a set number of locations (e.g. 10), do not rely only on the Slack modal (character limits, poor scrolling). Trigger a different flow: e.g. link to a web view/spreadsheet for review, or export to CSV and have CS upload a cleaned CSV. See `docs/location-pre-launch-gaps-and-recommendations.md` §4.

**We do not need to know “which deal created the location.”** Locations are created in one batch at close; creation is tied to the deal close event and Company, not to a single deal record for reporting.

**Naming:** We use **Location** / **locations** (not “sites”) for this object and in process docs. The legacy HubSpot object remains “Sites” (`2-56022093`) until we migrate or deprecate.

---

## 2. Deal ↔ Location associations

**Why we need Deal ↔ Location:**

- The location API returns **all locations** for the company. **Not all of those will be in the original deal** (e.g. only some sites are in scope for the first contract).
- We **create all Location records up front** (one per NPI from the cleaned array).
- **Some locations will not be associated with a deal until they “go live”** (e.g. phased rollout by site).
- A **Location can be associated with multiple Deals** (e.g. deal closed lost, new deal created; or expansion deals that add the same location).

**Design:**

| Aspect | Decision |
|--------|----------|
| **Cardinality** | **Deal ↔ Location: many-to-many.** One deal can have many locations; one location can be on many deals. |
| **When associated** | At creation: optionally associate the Locations that are in scope for the closing deal. Later: associate additional Locations to the same deal (or to a new deal) when they go live. |
| **Primary trigger** | Deal closed won → API → CS review in Slack → webhook creates Location records → (same or follow-up step) associate selected Locations to that Deal. |
| **Reporting** | “Locations on this deal” = Deal → Location association. “Deals this location is on” = Location → Deal. No “source deal” required on Location. |

**Implementation:** Add a **custom association type** Deal ↔ Location (e.g. labels: **Location** / **Deal**). Configure workflow or webhook to create Locations then create associations from the Deal to the Locations that are in scope for that deal. **Recommended:** Implement "Select Scope" in Slack so CS selects which locations are part of this Deal; associate only those to the Deal; set unselected locations to onboarding_status "Prospect" or "Not Active" so they do not pollute onboarding dashboards or dilute revenue-per-location. Document “go live” process: when a location goes live, CS (or process) associates that Location to the relevant Deal(s). See `docs/location-pre-launch-gaps-and-recommendations.md` §3.

---

## 3. Deal–Company validation

**Requirement:** Before calling the location API or creating Locations, **confirm the Deal is associated with the correct Company.** If the deal has no associated Company or the wrong Company, do not create Locations; create an alert or task for CS to fix the Deal–Company association, then re-run or trigger again.

Document this check in the workflow spec and in the pre-mortem (see `docs/location-mvp-architecture.md` §2.3).

---

## 4. Parent Company NPI vs parent Location

**Open decision:**

- Does the **parent Company** record have an **NPI** (e.g. one “org-level” NPI), or do we **never** store NPI on Company and only on Location?
- If the **parent** (legal/org) **functions as a site** (e.g. HQ with its own NPI), do we:
  - Create a **Location** record for that parent/site (with its NPI), **or**
  - Keep parent as Company-only with optional Company NPI?

**Options to decide:**

| Option | Company has NPI? | Parent-as-site | Notes |
|--------|-------------------|----------------|-------|
| A | No | Create a Location for parent too (one record per NPI, including parent) | All “sites” are Locations; Company is pure parent. |
| B | Yes (optional) | Company NPI = parent; create Location only for child sites | Roll-ups and reporting: Company NPI for parent, Locations for children. |
| C | Yes (optional) | Create Location for parent as well; Company NPI optional copy | Redundant NPI on Company for convenience; single source of truth per site is Location. |

**Action:** Decide and document in ERD and MVP; update API/webhook logic to include or exclude “parent” in the location array accordingly.

---

## 5. “Stop” list — verify with CS (Ian)

**We do not yet know** what current behaviors or tools this **replaces**. To finalize the “Stop” list (PPT Process), **verify with CS leader Ian:**

- What do we **stop** doing when Location + this process go live? (e.g. parent-child Companies as locations, a specific spreadsheet, a project tracker, manual address/phone entry, etc.)
- Any existing dashboards or reports that **must be replaced** by Location/Company roll-up–based reports? (See §8.)

Document Ian’s answers in this section and in `docs/location-mvp-architecture.md` §2.1 (Process – Stop list).

---

## 6. Pilot: one CS rep as champion

**Recommendation:** Run the pilot with **one CS rep** as the primary user and champion.

| Pros | Cons / mitigations |
|------|---------------------|
| Single point of feedback; consolidated, clear signal | One person’s workflow may not represent all segments |
| Champion can advocate and train others at rollout | Choose a rep who handles a mix of deal types / company sizes |
| Easier to debug (one Slack thread, one assignee) | After pilot, expand to 2–3 reps or “next 10 customers” before full rollout |

**Pilot definition:**

- **Who:** One assigned CS rep (champion).
- **Scope:** All deals that close to Closed Won (Onboarding/Engagement) and are assigned to that rep (or a defined subset of deals assigned to them).
- **Duration:** Until N locations created and reviewed (e.g. 5–10 companies) and feedback captured.
- **Success:** Process works end-to-end (Slack review → webhook → Location records → Deal associations); champion signs off; then expand.

Document in `docs/location-mvp-architecture.md` §2.2 (ADKAR – Ability) and in the rollout playbook.

---

## 7. Dashboards and reports

**Requirement:** Build **new dashboards and reports** that use Location and Company roll-ups (location count, onboarding status, revenue %, etc.) and **prepare to replace existing dashboards** that today use other data sources (e.g. spreadsheets, parent-child Company views).

- **Do not only add** new dashboards; identify which **existing** dashboards/reports will be replaced and by what (so no duplicate/competing sources of truth).
- Include this in implementation checklist and in handoff to Ian/CS.

---

## 8. Organizations building new locations

**Consideration:** After go-live, **organizations may add new locations** (new NPIs, new sites). The current flow is triggered by **deal close** (first batch per company). We need a process for:

- **New location added later** (e.g. new NPI for same company): Who triggers? (CS, or “add location” action in HubSpot, or integration.) How do we run the same NPI/address/phone validation and optional enrichment?
- **Deal ↔ Location:** When the new location goes live, associate it to the relevant Deal(s) as in §2.

Document as “Phase 1.1” or “Ongoing: adding new locations” in the playbook; keep Phase 1 scope as “locations created at deal close” and add a short section on post-go-live new locations.

---

## 8.1 Backfill: migrating existing (legacy) customers

**Requirement:** Do not leave existing customers behind once the Location model is live for new deals. Define a **backfill plan** to migrate **legacy customers** to the new Location structure (e.g. immediately after or in parallel with the pilot). Include: scope (which Companies/Deals are "legacy"), data source (same API or manual list), process (who runs it, Slack vs batch, how Deal ↔ Location is set for past deals), and validation (sample check, CS sign-off). See `docs/location-pre-launch-gaps-and-recommendations.md` §6.

---

## 8.2 Address structure (alternative)

**Current MVP:** Single `address` (text) on Location. **Risk:** Reporting by state/zip/territory and integrations (mapping, direct mail, tax) require parsing later. **Recommendation:** Split into `address_street`, `address_city`, `address_state` (picklist), `address_zip`, `address_country`; use a calculated "Full Address" for the UI. See `docs/location-pre-launch-gaps-and-recommendations.md` §1.

---

## 8.3 Revenue: automation and validation (alternative)

**Current MVP:** `potential_revenue` and `captured_revenue` are manual. **Risk:** Stale data; roll-ups and ROI visibility break. **Recommendation:** (1) Automate `potential_revenue` where possible (e.g. Deal Amount / in-scope Location count at creation). (2) Require `potential_revenue` to be filled (or confirmed) before `onboarding_status` can be set to "Complete" (validation gate). See `docs/location-pre-launch-gaps-and-recommendations.md` §5.

---

## 9. NPI: validation, lock, data policy, uniqueness, duplicates/invalid

### 9.1 HubSpot requirements vs NPI

- **HubSpot custom objects** require a **primary display property** (we use **`name`**). They do **not** require a unique “business key” property.
- **Unique property:** HubSpot supports marking a **property as unique** (per object type). Only **new** properties can be set unique; max 10 per object. If we want **no two Location records with the same NPI**, we can set **`npi` as unique** when creating the Location object (then one NPI = one Location globally in HubSpot).
- **Uniqueness scope:** If we need “unique per Company” (same NPI allowed on different Companies but not twice under one Company), HubSpot’s native unique is **global** per object. So: either **NPI unique globally** (one Location per NPI across the portal) or **no unique constraint** and we enforce “no duplicate NPI per Company” via workflow + reporting + alerts.

**Recommendation:** Set **`npi` as unique** at creation if the business rule is “one Location record per NPI across the org.” If the rule is “one NPI per Company” (same NPI could exist under different Companies), do **not** set NPI as unique; use workflows + duplicate report + alerts instead.

**Alternative recommendation (pre-launch):** In healthcare, **shared NPIs** are common (e.g. clinic chains billing under one Organizational NPI for all sites). If you enforce **global** uniqueness, the second location for that group will fail to create. **Do NOT** set `npi` as unique in HubSpot. Instead, enforce **compound uniqueness in the webhook:** before creating a Location, check if **NPI + Address (e.g. Street)** already exists — same NPI + same address = duplicate (flag or skip); same NPI + different address = allow (shared billing NPI). Phase 2: consider "Site NPI" vs "Billing NPI." See `docs/location-pre-launch-gaps-and-recommendations.md` §2.

### 9.2 Validate NPIs

- **Format:** 10 digits (and optionally NPI check digit if you validate). Validate in:
  - **Webhook** before creating/updating Location records (reject or flag invalid).
  - **HubSpot:** Optional workflow or form validation so that if someone types NPI in the UI, invalid format is blocked or warned.
- **External check:** Optional call to NPPES or Mimi Labs to confirm NPI exists; flag “invalid” if not found.

### 9.3 Lock property (prevent edits)

- **HubSpot:** Use **property-level permissions** or **read-only** so that only certain roles (e.g. admin, or no one after creation) can edit **`npi`**. Option: make `npi` editable only at creation (e.g. set by webhook only; UI read-only after that).
- **Data policy:** Internal doc: “NPI is set at Location creation from approved API data; do not change unless correcting a data error, and then only via [defined process].”

### 9.4 Duplicate or invalid NPI: flag, alert, fix

| Question | Approach |
|----------|----------|
| **How to flag duplicate NPI?** | (1) If NPI is unique: HubSpot will prevent second record with same NPI. (2) If NPI is not unique: **report** or **workflow** that finds Locations with same NPI (e.g. “Duplicate NPI” list or dashboard filter). Option: workflow that sets a “Duplicate NPI” property when another Location with same NPI exists (e.g. same Company). |
| **How to flag invalid NPI?** | Workflow or integration: on save, validate format (and optionally external lookup); set **`npi_validation_status`** (e.g. Valid / Invalid / Unchecked) or a **`npi_invalid`** checkbox. Surface on record and in reports. |
| **Who gets the alert?** | Configurable: e.g. **Location record owner**, or **CS lead**, or a dedicated “Data quality” queue. Document in data policy. |
| **How do they fix it?** | **Duplicate:** Merge or delete duplicate Location; or reassign to correct Company; document in playbook. **Invalid:** Correct NPI (if typo) and re-validate; or remove NPI and re-submit from source; document in playbook. |

Add **NPI data policy** (and optional `npi_validation_status` / duplicate report) to implementation checklist and to `docs/location-mvp-architecture.md` §2.4 / §8.

---

## 10. Company object audit: properties, roll-ups, workflows, impact

**Requirement:** Before or during Location rollout, **audit the Company object** and document:

| Area | What to do |
|------|------------|
| **Properties replaced** | Which Company properties (if any) will be **replaced** by Location or roll-ups? (e.g. a current “site count” or “primary NPI” that becomes Location-driven.) |
| **Properties converted to roll-ups** | Which Company properties become **roll-ups** from Location? (We already have location_count, location_total_*_revenue, location_onboarding_status, location_pct_revenue_captured.) Any others? |
| **Properties removed** | Which Company properties will be **removed** or deprecated (e.g. duplicate of Location data)? |
| **Impact on workflows** | Which **workflows** use Company properties that change? Update enrollment, filters, and actions. |
| **Impact on calculations** | Which **calculated properties** or **equations** on Company reference changed or removed properties? |
| **Property syncs** | Any **syncs** (e.g. HubSpot ↔ external system) that read/write Company properties that are being replaced or removed? |
| **Processes** | Any **processes** (playbooks, CS steps) that assume the old Company shape? |

**Output:** A short **Company audit** doc or section (e.g. `docs/location-company-audit.md` or a section in this doc) listing: property-by-property decision (keep / replace / roll-up / remove), workflow IDs to update, and process changes. Reference from `docs/location-mvp-architecture.md` implementation checklist.


## 11. Company vs Location: where to work

Where does each person spend their time (Company vs Location)? When do they work on Location vs Company? What happens if they work on the wrong record?

**Full guide:** **`docs/location-company-vs-location-where-to-work.md`** — by role (Sales, CS, Billing/Ops, Leadership); when to use each record; mistakes (e.g. status or revenue on Company instead of Location) and how to fix; prevention and "wrong record" playbook.

**Summary:** Site-specific data (onboarding status, Primary contact, address/phone/NPI, revenue per site) → **Location**. Account-level view and roll-ups (location count, total revenue, overall status) → **Company**. If someone enters site data on Company, move/copy to the correct Location and document.

---

## 12. Other objects, engagements, and integrations

Meetings, calls, and leads do **not** associate to Location. Tickets associate to Location in **Phase 2**. Full detail: **`docs/location-integrations-and-objects.md`** — object decisions, Gong, Chili Piper, Apollo. **Open decision:** Who is the Contact on a Location (Primary contact)? — person who works at that location, or company decision maker who influences how that location buys? And should the company primary contact be added to all locations? See `docs/location-integrations-and-objects.md` §6.

---

## 13. Reference

- **Pre-launch gaps and recommendations:** `docs/location-pre-launch-gaps-and-recommendations.md` — address split, NPI uniqueness, Deal scope, Slack volume, revenue automation, backfill.
- **MVP architecture (PPT, ADKAR, pre-mortem):** `docs/location-mvp-architecture.md` §2
- **Other objects and integrations:** `docs/location-integrations-and-objects.md` — meetings, calls, leads, Gong, Chili Piper, Apollo
- **Company vs Location (where to work):** `docs/location-company-vs-location-where-to-work.md` — by role, when to use each record, wrong-record fixes
- **ERD:** `docs/location-erd.md`, `docs/location-phase1-erd.md`
- **Minimum process:** `docs/location-minimum-process.md`
- **Pipeline / deal stages:** `.cursor/hubspot-context/hs-pipeline.md`
- **HubSpot schema:** `.cursor/hubspot-context/hs-schema.md`
