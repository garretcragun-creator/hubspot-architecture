# Location Process — Minimum Touch (Lean / Six Sigma)

> **Goal:** Full value from Location + enrichment with the **least possible** human effort. Efficient, accurate, and tight at scale — no tedious ongoing process for CS or Sales.  
> **Alignment:** This process aligns with the **PPT (People, Process, Technology)** and **ADKAR** framework in `docs/location-mvp-architecture.md` §2 and with **`docs/location-process-and-decisions.md`** (canonical process: deal close → API → Slack review → webhook).

---

## 1. Principle

- **Automate everything** that doesn’t require a human decision or a piece of information only humans have.
- **One moment, one place:** Required human input: **review and submit** the location array in **Slack** (no HubSpot data entry for creation). After that, CS only updates **onboarding_status** and optionally **Primary contact** in HubSpot.
- **No rework:** Key-based enrichment + fill-blanks-only; NPI validation and lock per data policy.
- **Sales touch = zero** for Location. CS touch = **minimum viable**: review array in Slack, submit; then optional NPI/primary contact/onboarding_status in HubSpot.

---

## 2. Who does what (minimum)

| Role | Touch point | Minimum action | Everything else |
|------|-------------|----------------|-----------------|
| **Sales** | None | Nothing. Close the deal as today. | Deal close triggers workflow. |
| **CS** | When deal closes | **In Slack:** Review and clean the location array (NPI × address × phone × location type) and **submit**. Optionally later in HubSpot: set **Primary contact**, update **onboarding_status**. For FQHCs only, optional **HRSA ID**. | Workflow triggers API; webhook creates Location records (one per NPI), associates to Company and optionally to Deal; enrichment fills address/phone; Company roll-ups update. |
| **Billing / Ops** (if revenue is used) | When revenue is known | Enter **potential revenue** and **captured revenue** on the Location (or feed via integration). | Roll-ups and % captured on Company are automatic. |

**Design rule:** If we can get it from the API (location array) or enrichment, we don’t ask CS to type it at creation. NPI is set from the submitted array; lock per data policy.

---

## 3. Minimum process flow

```
Deal closes (Closed Won - Onboarding / Engagement)
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  AUTOMATED (workflow)                                       │
│  • Check: Deal associated to correct Company                 │
│  • Call API: get all locations for Company                   │
│  • API returns array: NPI × address × phone × location type  │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  CS: REVIEW IN SLACK (assigned rep)                          │
│  • Review and clean the array                                │
│  • Submit (e.g. approve or edit then submit)                 │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  AUTOMATED (webhook)                                         │
│  • Create Location records (one per NPI in submitted array)  │
│  • Associate each Location → Company                          │
│  • Optionally associate selected Locations → Deal             │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  AUTOMATED (enrichment)                                      │
│  • When npi is present, fill address, phone where blank      │
│  • No overwrite of existing data                             │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  AUTOMATED (HubSpot)                                         │
│  • Company roll-ups update (location count, revenue, %)       │
│  • Company location_onboarding_status from Location status   │
└─────────────────────────────────────────────────────────────┘
```

**Ongoing:** CS updates **onboarding_status** in HubSpot when they move the account through onboarding (one dropdown). Locations can be associated to more deals when they “go live.” See `docs/location-process-and-decisions.md` §1, §2.

---

## 4. What we avoid (waste / inaccuracy)

| Avoid | Why |
|-------|-----|
| Asking CS to type address or phone at creation | API + webhook provide it; enrichment fills from NPI. |
| Asking Sales to create or edit Locations | Sales don’t own post-close setup. Zero touch. |
| Manual “verify enrichment” steps for every record | Fill-blanks-only; spot-check a sample. |
| Multiple places to update the same thing | One record: Location. Roll-ups propagate to Company. |
| Overwriting good data with enrichment | Fill blanks only. |
| Creating Location without a trigger | Deal close → API → Slack → webhook so nothing is forgotten. |

---

## 5. Minimum CS actions (summary)

1. **At deal close:** In **Slack**, review and clean the location array and **submit**. That creates all Location records (one per NPI). No HubSpot data entry required for creation.
2. **Optionally in HubSpot:** Set **Primary contact**, **onboarding_status**; for FQHCs, **HRSA ID**. Revenue when known (or Billing/Ops).
3. **As onboarding progresses:** Update **onboarding_status** (dropdown). Associate locations to deals when they go live if not already done.

**Canonical process and decisions:** **`docs/location-process-and-decisions.md`** — Deal ↔ Location associations, NPI policy, pilot (one CS rep), Company audit, adding new locations later.

---

## 6. Where this lives in HubSpot

- **Deal:** Deal close triggers workflow. **Deal ↔ Location** association links which locations are on this deal (many-to-many).
- **Company:** Roll-up and calculated properties show location count, revenue, %, overall onboarding status.
- **Location:** One record per NPI; created by webhook. CS uses for Primary contact, onboarding_status, optional HRSA ID; address/phone from enrichment.

**Where to work (Company vs Location) and what to do if someone uses the wrong record:** See **`docs/location-company-vs-location-where-to-work.md`**.

**Operational details:** See **`docs/location-npi-operational-playbook.md`** and **`docs/location-npi-process.md`** (update for Slack-first flow as needed).

---

## 7. Reference

- **Canonical process & decisions:** `docs/location-process-and-decisions.md` — flow, Deal ↔ Location, NPI, pilot, Company audit.
- **MVP architecture & PPT/ADKAR:** `docs/location-mvp-architecture.md` §2.
- **Verification (key-based, fill-blanks):** `docs/mimilabs-data-verification.md`
- **Identifiers (FQHC vs non-FQHC):** `docs/identifiers-fqhc-non-fqhc.md`
- **ERD / phased plan:** `docs/location-erd.md`
