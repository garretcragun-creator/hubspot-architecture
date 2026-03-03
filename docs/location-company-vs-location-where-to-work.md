# Company vs Location: Where to Work

> **Purpose:** Clarify where each role spends time (Company vs Location), when to use each record, and what to do when someone works on the wrong record. Prevents duplicate or conflicting data and keeps roll-ups accurate. Canonical process: `docs/location-process-and-decisions.md`.

---

## 1. Where does each person spend their time?

| Role | Primarily on | Why |
|------|----------------|-----|
| **Sales** | **Company** (and Deal, Contact) | Account and deal view; no Location creation or edit. Sales do not open Location records in Phase 1. |
| **CS** | **Both** — **Company** for account-level view (location count, roll-ups, overall onboarding status); **Location** for site-specific work (Primary contact, onboarding_status, NPI/HRSA, per-site revenue when needed). | Company = "how is the whole account doing?" Location = "what’s the status of this site? who’s the contact here?" |
| **Billing / Ops** | **Location** for entering potential/captured revenue per site; **Company** to view roll-ups (total revenue, % captured). | Revenue is entered on Location; Company shows the sum and %. |
| **Leadership / Ops** | **Company** for dashboards and reports (location count, onboarding status, revenue %). May drill into Location for specific site issues. | Roll-ups live on Company; Location is detail. |

**Rule of thumb:** If it’s about **one physical site** (that site’s address, phone, NPI, Primary contact, onboarding status, revenue at that site), work on **Location**. If it’s about the **whole account** (how many sites, total revenue, overall status) or linking deals/contacts to the account, work on **Company**.

---

## 2. When to work on Company vs Location

| Task or question | Record to use | Do not |
|-------------------|----------------|--------|
| "What’s the onboarding status of this site?" | **Location** — update `onboarding_status` on the Location. | Do not set onboarding status on Company (roll-up comes from Location). |
| "Who’s the main contact for this site?" | **Location** — set **Primary contact** association on the Location. | Do not store "site contact" only on Company (we use Location → Contact). |
| "What’s the address/phone/NPI for this site?" | **Location** — view or correct on Location. NPI is set at creation (webhook); address/phone from enrichment or manual fix. | Do not enter site address/phone/NPI on Company (Company may have one org-level address; site-level lives on Location). |
| "How many locations does this account have? What’s total revenue?" | **Company** — view roll-ups: `location_count`, `location_total_potential_revenue`, `location_total_captured_revenue`, `location_pct_revenue_captured`, `location_onboarding_status`. | Do not count or sum Locations manually; use Company roll-ups. |
| "Which locations are on this deal?" | **Deal** — view Deal → Location associations. Or **Location** — view Location → Deal. | — |
| "Enter revenue for this site." | **Location** — enter `potential_revenue` and `captured_revenue` on the Location. | Do not enter per-site revenue on Company (Company shows roll-up only). |
| "Add a new location (new NPI) for this company." | **Location** — create new Location record (or use "add location" flow), associate to Company (and optionally to Deal). | Do not create a child Company as "site"; we use Location. |

**Summary:** Site-specific data → **Location**. Account-level view and roll-ups → **Company**. Deal/Contact associations → **Deal** and **Contact**; Location links to both where needed.

---

## 3. What happens if they work on the wrong record?

| Mistake | Consequence | What to do |
|---------|-------------|------------|
| **Onboarding status entered on Company instead of Location** | Company roll-up `location_onboarding_status` is driven by Location(s). If status is only on Company (e.g. a custom field), roll-up and Location data are out of sync; reporting by location is wrong. | **Fix:** Enter the status on the correct **Location** record(s). Remove or ignore the incorrect Company value. Document in playbook: "Onboarding status lives on Location; Company shows roll-up only." |
| **Address / phone / NPI entered on Company instead of Location** | That **site’s** Location record doesn’t get the data; enrichment may not run for that site; "location by address" reporting is incomplete. Company may already have one address (org-level); mixing site data there causes confusion. | **Fix:** Copy or move the correct address/phone/NPI to the **Location** record. If NPI was set on Company by mistake, consider copying to Location (if one primary site) or document which Location it applies to. Update data policy so NPI is set on Location at creation. |
| **Revenue entered on Company instead of Location** | Per-site revenue is missing on Location; Company roll-up (sum of Location revenue) is then wrong or missing for that site. | **Fix:** Enter the revenue on the correct **Location** record. Company roll-up will update. Remove any duplicate revenue value from Company if it was stored in a custom field. |
| **Primary contact set only on Company** | We use **Location → Contact** (Primary contact) for "who’s the contact for this site?" If contact is only on Company, we lose site-level contact; reporting and workflows that use Location Primary contact won’t see it. | **Fix:** Set the **Primary contact** association on the **Location** record. Optionally keep Company-level "primary" for account-wide use, but Location Primary contact is the source for "contact at this site." |
| **New site created as child Company instead of Location** | We’re moving away from parent-child Company as sites. Creating a child Company as a "site" duplicates the model and breaks roll-ups (which count Location records, not child Companies). | **Fix:** Create a **Location** record and associate it to the parent Company. Do not use child Company for new sites. Document in "Stop" list: we do not create child Companies as sites. |

**Prevention:** Training, clear record labels and descriptions in HubSpot ("Location = one site; update status here"), and a short **"Wrong record" playbook** (e.g. in `docs/location-npi-operational-playbook.md` or this doc): (1) Identify the correct record (Company vs Location). (2) Move or copy data to the correct record. (3) Remove or correct data on the wrong record if it causes conflict. (4) Note in ticket or process if it keeps happening (training gap).

---

## 4. Reference

- **Process & decisions:** `docs/location-process-and-decisions.md`
- **Minimum process:** `docs/location-minimum-process.md` §6 (Where this lives in HubSpot)
- **MVP architecture:** `docs/location-mvp-architecture.md`
