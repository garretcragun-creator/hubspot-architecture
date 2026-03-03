# Location: Pre-Launch Gaps and Alternative Solutions

> **Purpose:** Critical gaps and "gotchas" identified before launch, with recommended or alternative solutions. Use these to harden the design and avoid operational failure. Canonical process: `docs/location-process-and-decisions.md`; MVP: `docs/location-mvp-architecture.md`.

---

## 1. The "Address Blob" Trap (Critical Data Architecture Risk)

**The gap:** The plan defines **address** on the Location object as a single string (text) field.

**Why it fails operationally:**

- **Reporting paralysis:** You cannot report on "Locations by State," "Revenue by Zip Code," or "Territory Alignment" (e.g., assigning a Midwest CS rep to Midwest locations) if the address is trapped in a single text block.
- **Integration nightmares:** Mapping tools, direct mail vendors, or tax calculation tools will require retroactive parsing of thousands of text strings if you add them later.

**Recommendation (alternative solution):**

Even for MVP, **break the address into discrete properties**. Mimilabs provides City, State, Zip; map them to separate HubSpot properties:

| Property (internal name) | Type | Notes |
|--------------------------|------|--------|
| `address_street` | text | Street address line(s). |
| `address_city` | text | City. |
| `address_state` | picklist/dropdown | Standardize state (e.g. 2-letter code) for reporting and territory. |
| `address_zip` | text | Zip / postal code. |
| `address_country` | text or picklist | Country. |

- Use a **calculated property** to display **Full Address** for the UI (concatenation of street, city, state, zip, country).
- Underlying data stays **structured** for reporting and integrations.

**Action:** Decide: keep single `address` for MVP or adopt split address in Phase 1. If split, update `docs/location-mvp-architecture.md` §3 (Properties), enrichment mapping, and ERD. See also `docs/mimilabs-hubspot-property-mapping.md`.

---

## 2. The NPI "Uniqueness" Reality Check

**The gap:** Consideration to set **`npi`** as **unique** at the HubSpot property level to prevent duplicates.

**Why it fails operationally:**

- **Shared NPIs:** In healthcare, clinic chains (e.g. urgent cares, therapy groups) often **bill under a single Organizational NPI (Type 2)** for all physical locations.
- **The crash:** If you enforce **global** uniqueness, the **second** location for that group will **fail to create** (webhook errors or form block). You cannot onboard multi-site chains that share one NPI.

**Recommendation (alternative solution):**

- **Do NOT** enforce global uniqueness on the `npi` property in HubSpot.
- **Do** enforce **compound uniqueness in the webhook script:** Before creating a Location, check if **NPI + Address (e.g. Street)** already exists. If same NPI + same address → flag as duplicate (or skip). If same NPI but **different address** → **allow it** (shared billing NPI, different physical site).
- **Phase 2:** Add a **"Site NPI" vs "Billing NPI"** distinction if needed (facility-specific ID vs shared billing ID). For Phase 1, allow shared NPI across locations with different addresses.

**Action:** Update `docs/location-process-and-decisions.md` §9: recommend **no** HubSpot-level unique on `npi`; document webhook logic for compound uniqueness (NPI + address_street or equivalent). Update pre-mortem in `docs/location-mvp-architecture.md` §2.3.

---

## 3. The "Deal Scope" Logic Flaw

**The gap:** The workflow retrieves **all** locations for the Company from the API and creates them. Documentation implies associating them to the Deal is standard. If **all** created locations are associated to the Deal, reporting and CS workload break.

**Why it fails operationally:**

- **Skewed reporting:** A hospital system with 50 locations but a **5-site pilot** deal would show 50 locations on the Deal → "Revenue per Location" is diluted; it looks like a huge deal with tiny revenue per site.
- **"Zombie" data:** Hundreds of locations that are not yet active customers clutter the CRM and pollute onboarding dashboards.

**Recommendation (alternative solution):**

- **Add a "Select Scope" step in Slack:** The Slack modal (or flow) should let the CS rep **select which** of the returned locations are **actually part of this specific Deal**. Only those are associated to the Deal and treated as "in scope" for onboarding.
- **Status distinction:** Create **all** location records (for data completeness), but set **onboarding_status** of the **unselected** ones to **"Prospect"** or **"Not Active"** (or a dedicated value) instead of "Not Started," so they do not appear in active-onboarding dashboards.
- **Associate to Deal only the selected locations** so "Locations on this deal" and "Revenue per Location" reflect true deal scope.

**Action:** Update `docs/location-process-and-decisions.md` §1 and §2: add "Select Scope" in Slack; only associate selected locations to Deal; set unselected to Prospect/Not Active. Update Slack/webhook spec and playbook.

---

## 4. The Slack Interface Bottleneck (User Experience)

**The gap:** The process relies on a CS rep reviewing a **JSON array in a Slack modal**.

**Why it fails operationally:**

- **Volume threshold:** Reviewing 3 locations in Slack is fine; reviewing **50** is not. Slack modals have character limits and poor scrolling for tabular data.
- **Blind approvals:** On large lists, CS may hit "Submit" without reviewing → bad data (e.g. closed clinics, wrong addresses) gets imported.

**Recommendation (alternative solution):**

- **Set a volume threshold:** If `location_count` (or array length) **> 10** (or another agreed number), the bot should **trigger a different flow:**
  - **Option A:** Provide a **link to a temporary web view or spreadsheet** for review, then submit from there.
  - **Option B (simpler):** **Auto-export to CSV** and ask the rep to **upload the "Cleaned" CSV** back to the thread (or to a form). Webhook then processes the CSV.
- **Protect the process:** Do not force a "Chat UI" to do a "Spreadsheet Job."

**Action:** Document threshold (e.g. 10) and high-volume flow (Option A or B) in workflow spec and in `docs/location-process-and-decisions.md` §1. Implement in Slack app or workflow.

---

## 5. The "Manual Revenue" Trap

**The gap:** `potential_revenue` and `captured_revenue` are **manual** fields on Location.

**Why it fails operationally:**

- **Stale data:** Manual revenue on secondary objects is often neglected; no one updates 20 Location records every month.
- **ROI visibility:** Net-org benefit and roll-ups depend on these; if data is stale, reporting is useless.

**Recommendation (alternative solution):**

- **Automate "Potential":** Derive `potential_revenue` from the **Deal** where possible (e.g. **Deal Amount / Location Count** for locations in scope). Even a rough automatic split is better than a blank field. Set at creation or when Deal is associated.
- **Validation rule:** Require `potential_revenue` to be filled (or confirmed) before `onboarding_status` can be moved to **"Complete."** Make it a **required gate** in workflow or playbook so completion implies at least one revenue figure.

**Action:** Document in `docs/location-process-and-decisions.md` and playbook: (1) optional auto-split of Deal amount to Location potential_revenue; (2) gate: cannot set onboarding_status = Complete without potential_revenue (or explicit override). Update MVP implementation checklist if needed.

---

## 6. Backfill Plan (Legacy Customers)

**The gap:** Pilot and "new" deal-close flow are defined, but **existing (legacy) customers** are not yet on the Location model. Leaving them behind creates a two-tier CRM and broken roll-ups for old accounts.

**Recommendation:**

- **Define a backfill plan** to migrate **existing customers** to the new Location structure **immediately after (or in parallel with) the pilot.**
- Include: (1) **Scope** — which Companies/Deals are "legacy" and need Locations created retroactively. (2) **Data source** — same API (NPI/address) or manual list? (3) **Process** — who runs it (CS, Ops), Slack vs batch, and how Deal ↔ Location associations are set for past deals. (4) **Validation** — how to confirm backfilled Locations match reality (sample check, CS sign-off).
- Do not leave "Legacy" customers without Location records once the new model is live for new deals.

**Action:** Add a **Backfill** subsection to `docs/location-process-and-decisions.md` (e.g. after §8 Organizations building new locations) or a short **Backfill** doc; reference from implementation checklist and rollout playbook.

---

## 7. Summary of Action Items

| # | Gap | Recommendation |
|---|-----|-----------------|
| 1 | Address blob | Split address: `address_street`, `address_city`, `address_state` (picklist), `address_zip`, `address_country`; calculated Full Address for UI. |
| 2 | NPI global unique | Do **not** set NPI unique in HubSpot. Use **compound uniqueness in webhook** (NPI + address); allow shared NPI across locations with different addresses. Phase 2: Site NPI vs Billing NPI. |
| 3 | Deal scope | **Select Scope** in Slack: CS selects which locations are in this Deal. Associate only those to Deal; set others to "Prospect" / "Not Active." |
| 4 | Slack volume | **Volume threshold** (e.g. >10 locations): trigger different flow — web view/spreadsheet or CSV export + upload. |
| 5 | Manual revenue | **Automate** potential_revenue from Deal (e.g. Deal Amount / Location Count). **Validation:** require potential_revenue before onboarding_status = Complete. |
| 6 | Legacy customers | **Backfill plan:** define how to migrate existing customers to Location model after pilot; scope, data source, process, validation. |

---

## 8. Reference

- **Process & decisions:** `docs/location-process-and-decisions.md`
- **MVP architecture:** `docs/location-mvp-architecture.md`
- **Mimilabs mapping:** `docs/mimilabs-hubspot-property-mapping.md`
