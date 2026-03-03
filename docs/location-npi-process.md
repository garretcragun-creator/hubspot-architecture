# Location NPI Process — Step-by-Step (TIMWOODS-Compliant)

> **Single canonical process** for adding NPI to Locations after deal close. Designed to minimize the 8 wastes (TIMWOODS) and keep CS effort to one batch of input per account.

---

## TIMWOODS: How This Process Avoids the 8 Wastes

| Waste | What we avoid | How the process does it |
|-------|----------------|-------------------------|
| **T**ransport | Moving data between systems | One system of record (HubSpot). NPI entered only in HubSpot or in a CSV that imports into HubSpot. Slack/Monday only notify + link; no NPI typed there. |
| **I**nventory | Work piling up, batch delays | One task per account, due in 2–3 days. CS does one batch of NPI entry (single record or one CSV) so there’s no “partial” state. Enrichment runs as soon as NPI is present (no overnight batch). |
| **M**otion | Extra clicks, opening many records | **Bulk-first:** 2+ locations → CSV export → fill NPI in sheet → import (or script). No opening each Location. Single location → one record, one link from task. |
| **W**aiting | Idle time, handoffs | Task created at close; assignee gets Slack + link. No “wait for export” if using script (export runs in seconds). Enrichment triggers on save/import. |
| **O**verprocessing | Doing more than needed | No address/phone entry (Mimilabs fills from NPI). Fill-blanks-only enrichment (no overwrite). No “verify Mimilabs” step for every record. Task can auto-complete when NPI is set. |
| **O**verproduction | Creating more than needed | Create only the Location(s) we need. One default Location at close; CS adds more only when account is multi-site, then uses bulk NPI for that batch. |
| **D**efects | Errors, rework | Single place to enter (no sync errors). 10-digit NPI validation; script strips non-digits. Fill-blanks-only so we don’t overwrite good data. |
| **S**kills | Under/overuse of people | CS does only what only they can do: get NPI from customer and enter it (or confirm). Automation does: create Location, copy NPI from Company when present, enrichment, roll-ups, task completion. |

---

## The Process (Efficient, Single Path)

### Step 0 — Trigger (automated)

- **When:** Deal moves to **Closed Won - Onboarding** or **Closed Won - Engagement** (New Customer or Expansion).
- **System does:**
  1. Create **one** Location record; set `name` = Company name + " - Primary"; associate Location → Company.
  2. If Company already has `npi`, copy it to the new Location (then skip or soften the task — “Confirm NPI”).
  3. Create **one** HubSpot task: “Add NPI for [Company name],” assign to deal owner (or CS queue), due in 2 business days. Task body: link to **Company** and one-line rule: “1 location → enter NPI on Location. 2+ locations → reply in Slack with location name + NPI on separate lines (see process doc).”
  4. Send **Slack message** to assignee (or #onboarding) with **same link** and **reply instructions**: “Reply to this message with location name and NPI on separate lines, e.g. Main Campus / 1234567890.” Include **Company ID** in the message (e.g. “Company ID: 12345”) so the reply can be parsed and applied to the right Company’s Locations. See **`docs/location-npi-slack-format.md`**.

**No branching in the trigger.** One task, one Slack message with reply instructions; the rule tells CS whether to use single-record (1 location) or reply in Slack with name+NPI lines (2+ locations).

---

### Step 1 — CS: Get NPI (one time per account)

- **Who:** Customer Success (task assignee).
- **When:** Before or during first onboarding touch; by task due date.
- **Action:** Get NPI(s) from the customer **in one go** (contract, kickoff call, or portal). If the account has multiple locations, ask for “NPI per location” once and record in a list or sheet.
- **If NPI already on Company/location:** Confirm and move on (no re-entry).
- **If customer doesn’t have NPI:** Use NPPES lookup by org name (e.g. `scripts/mimilabs-customer-match.js` approach) or skip and leave blank until later.

**TIMWOODS:** One ask, one batch — reduces **Inventory** (no back-and-forth) and **Motion** (no repeated calls).

---

### Step 2 — CS: Enter NPI (one place, one method per account)

**Decision:** How many locations need NPI for this account?

| If | Then | Steps |
|----|------|--------|
| **1 location** | Single-record | Open Company → Locations → open the Location → enter NPI (10 digits) → Save. Use task link to Company. |
| **2+ locations** | **Slack reply (preferred)** or CSV | **Preferred:** Reply in the Slack thread with location name and NPI on separate lines (e.g. `Main Campus` then `1234567890`). No CSV. See **`docs/location-npi-slack-format.md`**. The reply is parsed and HubSpot Locations are updated (by script or by a bot that calls the script). **Alternative:** Export Locations → fill NPI in CSV → Import (or `location-bulk-npi.js` import). |

**Rules:**

- Enter **only NPI** (and optionally Primary contact, onboarding_status, HRSA ID for FQHC). Do **not** type address or phone — enrichment fills those.
- **2+ locations:** Prefer **Slack reply** (location name + NPI on separate lines) so CS never touches a CSV. If no Slack integration yet, paste the same text into `node scripts/location-bulk-npi.js from-text --company=ID --text="..."` or use CSV.
- After reply is processed (or single-record save, or CSV import), task completes when NPI is set (workflow or manual).

**TIMWOODS:** Slack reply removes **Motion** (no export/import, no opening records) and **Transport** (one message, parsed once). CSV remains fallback.

---

### Step 3 — System: Enrichment (automated)

- **When:** Whenever a Location has `npi` set (after save or after bulk import).
- **What:** Call Mimilabs/NPPES with NPI; fill **address** and **phone** only where currently blank. Do not overwrite existing values.
- **Who:** Automated (workflow or script). No CS action.

**TIMWOODS:** **Overprocessing** avoided (no manual address/phone); **Defects** avoided (fill-blanks-only).

---

### Step 4 — System: Roll-ups and task close (automated)

- Company roll-ups (location count, total potential/captured revenue, % captured, overall onboarding status) update from associated Locations.
- Task “Add NPI for [Company name]” is marked complete when the relevant Location(s) have `npi` set (workflow) or manually by CS after bulk import.

**No CS action** unless workflow is not built — then CS marks task complete after entering NPI.

---

## Process Summary (One-Pager for CS)

| Step | Who | Action |
|------|-----|--------|
| 0 | System | Deal closed won → create 1 Location, associate to Company, create task “Add NPI for [Company],” send Slack with reply instructions and Company ID. |
| 1 | CS | Get NPI(s) from customer once (or confirm if already on Company). |
| 2 | CS | **1 location:** Open Location from Company, enter NPI, Save. **2+ locations:** Reply in Slack with location name and NPI on separate lines (parsed automatically or via script). Fallback: CSV export/import. |
| 3 | System | Enrichment fills address/phone from NPI (fill blanks only). |
| 4 | System | Roll-ups update; task completes when NPI is set. |

**Rule:** Don’t type address or phone. For 2+ locations, prefer **Slack reply** (name + NPI on separate lines) — no CSV unless needed.

---

## Efficiency Checklist

- [ ] **One task per account** (not per location), with one link to Company and one-line rule (single vs bulk).
- [ ] **Bulk threshold = 2+ locations** (not 5+) so 2–4 location accounts don’t open multiple records.
- [ ] **One ask for NPI** — CS gets all NPIs in one customer touch (call/email/portal).
- [ ] **Single system of record** — NPI only in HubSpot. Slack reply is parsed and applied to HubSpot (no NPI stored in Slack).
- [ ] **Slack message** includes reply instructions and Company ID; see **`docs/location-npi-slack-format.md`**.
- [ ] **Task auto-complete** when Location(s) have NPI set (workflow).
- [ ] **Fill-blanks-only** enrichment; 10-digit NPI validation where possible.

---

## References

- **Slack reply format (no CSV):** `docs/location-npi-slack-format.md`
- **Playbook (detail):** `docs/location-npi-operational-playbook.md`
- **Minimum process / principles:** `docs/location-minimum-process.md`
- **Bulk script (CSV + from-text):** `scripts/location-bulk-npi.js`
- **Deal stages:** `.cursor/hubspot-context/hs-pipeline.md`
