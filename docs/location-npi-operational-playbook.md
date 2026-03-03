# Location NPI — Operational Playbook (Least Work, Least Waste)

> **Goal:** One required human action (enter NPI) at the right moment, in the right place — using HubSpot, Slack, and optionally Monday.com. No duplicate data entry, no extra steps for Sales.
>
> **Canonical process (step-by-step, TIMWOODS-compliant):** **`docs/location-npi-process.md`**. Use this playbook for implementation detail and reference.

---

## 1. Should we create the task when a deal is closed won?

**Yes.** Create the task (and the Location record) **when the deal moves to Closed Won**, so:

- The same event drives both “new customer” and “set up Location + NPI.”
- CS sees one prompt at the start of onboarding, not a separate process.
- Nothing depends on Sales; they just close the deal as today.

**Trigger in HubSpot**

- **Event:** Deal stage changes to **Closed Won - Onboarding** or **Closed Won - Engagement**.
- **Stage IDs** (from `hs-pipeline.md`):
  - New Customer — Closed Won - Onboarding: `77f2e34f-14fa-409c-9850-692b7c2c7321`
  - New Customer — Closed Won - Engagement: `81d05856-d5e1-4929-90ba-89134bf3a674`
  - Expansion — Closed Won - Onboarding: `937266522`
  - Expansion — Closed Won - Engagement: `1025177200`
- **Actions:** (1) Create Location, (2) Associate Location → Company, (3) Create task “Add NPI for [Company name]” with link to Company and one-line rule: “1 location → enter NPI on Location. 2+ locations → use bulk NPI (see process doc).” (4) Optional Slack. See **`docs/location-npi-process.md`**.

Apply the same logic for both New Customer and Expansion pipelines so every closed-won deal gets one Location and one NPI task.

---

## 2. Where do we get the NPI?

**Preferred order (least effort first):**

| Source | When to use | Effort |
|--------|-------------|--------|
| **Already on Company** | If the Company already has `npi` (e.g. from a previous match or enrichment), workflow copies it to the new Location. Task can say “Confirm NPI” or auto-complete. | Zero — no CS entry. |
| **Customer provides it** | Contract, welcome email, kickoff call, or customer portal. CS asks once during onboarding: “What’s the NPI for this location?” | One ask; CS enters in HubSpot. |
| **Lookup by organization name** | If customer doesn’t know NPI, use NPPES/Mimilabs lookup by legal org name (same approach as `scripts/mimilabs-customer-match.js`). CS or a script fills NPI; CS confirms. | One lookup; then enter or confirm in HubSpot. |

**Do not** make CS type address or phone — Mimilabs fills those from NPI (fill-blanks-only). See `docs/mimilabs-data-verification.md` and `docs/location-minimum-process.md`.

**NPI format:** 10 digits. Optional: add a HubSpot field validation or workflow check to warn if not 10 digits.

---

## 3. Who should do it?

**Customer Success.** They own post-close onboarding and are the natural owners of “set up this location so we can enrich and roll up.”

- **Sales:** Zero touch. No task, no form, no Location fields.
- **CS:** One action — enter (or confirm) NPI on the Location. Optionally set Primary contact and onboarding_status; for FQHCs only, optional HRSA ID.

Assign the HubSpot task to the **deal owner** (who often becomes the CSM) or to a dedicated onboarding queue/round-robin if you use one.

---

## 4. How should the prompt be delivered?

**Single source of truth for the action:** the **HubSpot task**. All other channels only **remind** and **deep-link** to that task or the Location — no second place to enter data.

| Channel | Role | What to do |
|---------|------|------------|
| **HubSpot** | Primary | Create a **task** when the deal closes: “Enter NPI for [Company name].” Task is tied to the **Deal** (and/or Company). Description or custom property includes a **link to the Location record** (or Company if you want them to open Company first and then the associated Location). Task assignee = CS. Due date = e.g. 2–3 business days after close so it’s in the first onboarding window. |
| **Slack** | Notification | When the task is created (or when the deal closes), optionally send a **Slack message** to the assignee or a #onboarding channel: “New closed-won: [Company]. Please enter NPI: [link to Location or task].” Message is a reminder + link; they do the data entry in HubSpot. |
| **Monday.com** | Optional mirror | If CS lives in Monday.com, create a **Monday task/item** that mirrors the HubSpot task (e.g. “Enter NPI – [Company name]”) with a link to the HubSpot Location or task. **Do not** ask them to type NPI in Monday — they click through and enter in HubSpot so you have one system of record and no sync of field values. |

**Recommendation:** Start with **HubSpot task + Slack notification**. Add Monday.com only if CS strongly prefers seeing new customers in Monday; keep data entry in HubSpot either way.

---

## 5. How do they enter the data?

**Use bulk entry for multi-location orgs (2+ locations); use single-record entry only for 1 location.**

### 5a. Bulk entry (2+ locations)

**Preferred: Slack reply.** CS replies to the Slack message with **location name and NPI on separate lines** (e.g. `Main Campus` then `1234567890`). No CSV. The text is parsed and HubSpot Locations are updated by matching name to the Company’s Locations. See **`docs/location-npi-slack-format.md`**. To apply the reply: run `node scripts/location-bulk-npi.js from-text --company=COMPANY_ID --text="..."` (or paste into `--file=path.txt`), or connect a Slack app that calls the script when someone replies.

**Alternative: CSV.** Export Locations → fill NPI column in sheet → Import (Update by Record ID) or use `location-bulk-npi.js export` then `import`.

**HubSpot-native CSV flow** (if not using Slack reply)

1. In HubSpot: **Custom objects** → **Locations** → **Export**. Add a filter if needed (e.g. “Parent” [Company] or “NPI is empty”). Include **Record ID**, **Name**, **NPI**. Export.
2. Open the CSV in Excel or Google Sheets. Fill the **NPI** column (10 digits per row). Save as CSV.
3. **Import** → **Update existing records** → **Locations**. Upload CSV. Map **Record ID** → match key, **NPI** → `npi`. Run.

**Script flow** (CSV or text)

- **From Slack-style text:** `node scripts/location-bulk-npi.js from-text --company=COMPANY_ID --text="Main Campus\n1234567890\nDowntown\n0987654321"` or `--file=path.txt`.
- **From CSV:** `node scripts/location-bulk-npi.js export --company=COMPANY_ID` → fill `npi` in CSV → `node scripts/location-bulk-npi.js import --file=data/locations-npi-export.csv`.

Requires `.env`: `HUBSPOT_ACCESS_TOKEN`, `HUBSPOT_LOCATION_OBJECT_TYPE` (Location object type ID). See script header.

### 5b. Single-record entry (1 location only)

**Where:** On the **Location** record (link from task or Company → Locations). **What:** **NPI** (10-digit). Optionally Primary contact, onboarding_status, HRSA ID (FQHC). **How:** Open Location → type NPI → Save.

**Flow:**

```
Slack / Monday (optional): "New customer — enter NPI: [link]"
         │
         ▼
CS clicks link → HubSpot Location (or Deal → Company → Location)
         │
         ▼
CS enters NPI in Location record (or uses bulk CSV / script — §5a)
         │
         ▼
Enrichment runs (when npi present) → address/phone filled from Mimilabs
         │
         ▼
Task marked complete (manually or by workflow when npi is set)
```

**Marking the task complete:** (a) CS marks the HubSpot task complete when done, or (b) workflow marks it complete when the Location(s) have `npi` populated. For bulk, mark complete after import.

---

## 6. Summary: least work, least waste

| Question | Answer |
|----------|--------|
| **Create task when deal closed won?** | Yes. Trigger on Closed Won - Onboarding / Closed Won - Engagement (New Customer + Expansion). |
| **Where do we get NPI?** | Company (if already set) → customer (contract, call, portal) → NPPES lookup by org name. Never ask CS to type address/phone. |
| **Who does it?** | Customer Success. Sales = zero touch. |
| **How is the prompt delivered?** | **HubSpot task** (primary) with link to Company; **Slack** with **reply instructions**: “Reply with location name and NPI on separate lines.” Include Company ID in Slack so the reply can be parsed. **Monday.com** (optional) mirror with link only. See **`docs/location-npi-slack-format.md`**. |
| **How do they enter data?** | **1 location:** HubSpot Location record, NPI field. **2+ locations (preferred):** Reply in Slack with location name and NPI on separate lines; parsed and applied to HubSpot. **Fallback:** CSV export → fill NPI → import or `location-bulk-npi.js` (import or from-text). |

---

## 7. Implementation checklist

- [ ] **Workflow:** Deal stage = Closed Won (Onboarding or Engagement) → create Location, associate to Company, set default name (e.g. Company name + " - Primary").
- [ ] **Workflow:** Same trigger → create HubSpot task “Enter NPI for [Company name],” assign to deal owner (or CS queue), due in 2–3 business days, link to Location in task body or custom link.
- [ ] **Optional:** When task is created → send Slack message to assignee or #onboarding with link to Location/task.
- [ ] **Optional:** If Company has `npi` → copy to new Location and either skip creating the task or set task to “Confirm NPI” and link to Location.
- [ ] **Optional:** Workflow when Location.npi is set → mark the related task complete.
- [ ] **Bulk entry:** For 2+ locations, provide CS with export/import instructions or `location-bulk-npi.js`; link from task or Slack to playbook §5a. See **`docs/location-npi-process.md`** for the canonical process.
- [ ] **Monday.com (if used):** Create Monday item/task with link to HubSpot Location; do not add an NPI field in Monday — all entry in HubSpot.
- [ ] **CS one-pager:** “**1 location:** Open Location, enter NPI, save. **2+ locations:** Reply in Slack with location name and NPI on separate lines (see `location-npi-slack-format.md`). Or paste same text into `location-bulk-npi.js from-text --company=ID --text=\"...\"`. We pull address/phone from NPI automatically.”

---

## 8. References

- **Process (step-by-step, TIMWOODS):** `docs/location-npi-process.md`
- **Slack reply format (no CSV):** `docs/location-npi-slack-format.md`
- **Minimum process:** `docs/location-minimum-process.md`
- **MVP architecture:** `docs/location-mvp-architecture.md`
- **Deal stages:** `.cursor/hubspot-context/hs-pipeline.md`
- **NPI lookup by name (pilot script):** `scripts/mimilabs-customer-match.js`
- **Identifiers (FQHC vs non-FQHC):** `docs/identifiers-fqhc-non-fqhc.md`
