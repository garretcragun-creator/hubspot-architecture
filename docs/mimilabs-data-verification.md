# Mimilabs Data Verification — Match, Completeness & Freshness

> **Goal:** Ensure Mimilabs enrichment can be trusted before scaling: correct organization/location matching, acceptable completeness, and freshness. Avoid going sideways from wrong matches, mostly-empty data, or stale records.

---

## 1. What “trustworthy” means

| Risk | What goes wrong | What we need to verify |
|------|------------------|-------------------------|
| **Wrong match** | Mimilabs returns data for a different org/location than the one in HubSpot (e.g. wrong NPI, wrong practice location). | Enrichment is consistently keyed to the **same** entity we think we’re enriching. |
| **Empty / low completeness** | Address, phone, etc. are blank more often than not. | Fill rates for key fields are above an agreed threshold. |
| **Out of date** | NPPES or other source data is stale; we overwrite good data with old data. | We know how fresh the source is and whether we should overwrite or only fill blanks. |

Verification should cover **match accuracy**, **completeness**, and **freshness** so the data can be trusted.

---

## 2. Verification approach (high level)

1. **Pilot on a controlled set** — Use a small, known set of Companies/Locations (e.g. 10–20) where you already know the correct NPI and address/phone. Enrich from Mimilabs and compare.
2. **Human-in-the-loop (HITL) before trust** — Until metrics are green, every enriched record (or a sample) is reviewed before treating it as trusted; optionally only fill blanks instead of overwriting.
3. **Validation rules and safeguards** — Define rules that block or flag bad writes (e.g. country/state mismatch, impossible phone format).
4. **Ongoing monitoring** — After rollout, track match rate, fill rate, and freshness so trust is maintained.

---

## 3. Match verification — “Are we enriching the right org/location?”

### 3.1 Use a stable key

- **Company:** Enrich only when you have a **canonical key** Mimilabs understands (e.g. **NPI** for organizations). Store it on Company (e.g. `npi`).
- **Location:** Use a key that uniquely identifies the **site** — for Mimilabs/NPPES that is **NPI** (organization or subpart). Store it in `npi` on Location and send only that for lookup. (HRSA ID is FQHC-only and not used for Mimilabs; see `docs/identifiers-fqhc-non-fqhc.md`.)
- **Rule:** Never enrich by name/address alone for matching; use the key. Name/address are **outputs** to validate, not inputs to find the record.

### 3.2 Pilot: known-good sample

1. **Build a gold set (10–20 records)**  
   Companies/Locations where you **manually verified** the correct NPI (and location key if applicable) and correct address/phone (from NPPES registry or your own records).

   **Quick pilot from HubSpot customers:** Run the script to sample closed-won customer companies and match them to NPPES (same data as Mimilabs):
   ```bash
   node scripts/mimilabs-customer-match.js
   ```
   Report is written to `data/mimilabs-match-report.md` and `data/mimilabs-match-report.json`. Use it to measure match rate, address/phone fill rate, and which search variants (e.g. stripping " - Parent") improve matching.

2. **Run enrichment**  
   For each record, call Mimilabs with the **key only** (NPI). Write returned address/phone to a **staging property** or a copy (e.g. `address_mimilabs`, `phone_mimilabs`) so you don’t overwrite known-good data yet.

3. **Compare**  
   - Does Mimilabs return data for **every** key? (If not, document “no result” rate.)  
   - When it returns data, does **organization/location name** (and address if you have it in gold) match the expected entity?  
   - Track: **Match accuracy %** = (records where returned entity is correct) / (records with a non-empty response).

4. **Decide**  
   If match accuracy is below a threshold (e.g. &lt; 95%), do **not** auto-overwrite production fields; keep HITL or key-only enrichment with validation (see below).

### 3.3 Safeguards in production

- **Key required:** Enrichment workflow/script runs only when `npi` (Location) or Company NPI is present and non-empty.
- **Optional: no overwrite of trusted data** — If a field (e.g. `address`) was already set by a human or a previous trusted run, only fill when **current value is blank** (configurable).
- **Log keys and results** — For each enrichment call, log: key used, Mimilabs response (at least name + address/phone), and whether you wrote to HubSpot. Enables spot-checks and repeatability.

---

## 4. Completeness verification — “Is the data there?”

### 4.1 Define “key fields”

For **Location** MVP these are: `address`, `phone`. (And `name` if you derive it from Mimilabs; otherwise it’s CS-supplied.)

### 4.2 Measure fill rate

- **Per field:** % of enriched records where the field is non-empty after enrichment.  
- **Pilot:** On the gold set, after enrichment, compute fill rate for address and phone.  
- **Production:** Periodically (e.g. weekly) compute fill rate for Locations that have `npi` set and have been “enriched” (e.g. have `address` or `phone` populated and a “last enriched” timestamp if you add one).

### 4.3 Thresholds

- Define a minimum acceptable fill rate (e.g. **≥ 70%** for address, **≥ 60%** for phone) before treating enrichment as “trusted” for automation.
- If below threshold: keep HITL, or only fill blanks, and investigate (wrong key? Mimilabs coverage gap?).

### 4.4 Report

- Add a simple **completeness report** (script or manual): of all Locations with `npi` set, how many have non-empty `address`, non-empty `phone`? Share with CS so they know what to expect.

---

## 5. Freshness verification — “Is the data current?”

### 5.1 Source freshness

- **NPPES** updates monthly (and has a “last updated” per record). Mimilabs may cache; ask or document “data as of” for the API/dataset you use.
- **Rule of thumb:** If Mimilabs doesn’t expose “last updated” per record, treat source as “monthly” and avoid overwriting recently verified data with enrichment unless you’re only filling blanks.

### 5.2 Overwrite policy

- **Option A — Fill blanks only:** Only write to HubSpot when the target property is currently empty. Safest; avoids overwriting good data with stale data.  
- **Option B — Overwrite with age guard:** Only overwrite if Mimilabs returns a “last updated” newer than HubSpot’s value, or if HubSpot value is older than X days.  
- **Option C — Full overwrite:** Always overwrite. Only acceptable if you’ve validated that Mimilabs is sufficiently fresh and accurate.

Recommendation: **Option A for MVP**; move to B if you add “last updated” from Mimilabs and still need to correct stale data.

### 5.3 Monitoring

- If you add a **last enriched date** on Location (and optionally Company), you can report “% of keyed records enriched in last 30 days” and avoid treating long-unrefreshed data as “current” for critical decisions.

---

## 6. Validation rules (before writing to HubSpot)

Run these on the **Mimilabs response** before writing to HubSpot; fail or flag so bad data doesn’t get in.

| Rule | Example | Action |
|------|--------|--------|
| **Country consistency** | If Company/Location is US-only, country from Mimilabs should be US (or blank). | If country is non-US and you’re US-only, flag or skip write. |
| **State format** | State should be 2-letter or known list. | If state looks wrong (e.g. full name when you expect code), flag. |
| **Phone format** | Phone should be parseable (e.g. 10 digits for US). | If invalid, flag or don’t write phone. |
| **Address sanity** | Address line not empty and not a single character. | If obviously bad, flag. |
| **Name/organization match** | Optional: compare returned org/location name to HubSpot name (fuzzy). | If wildly different, flag for review (possible wrong match). |

Implement in the enrichment script or workflow; log flagged rows for review.

---

## 7. Pilot checklist (before trusting at scale)

Use this before enabling fully automated enrichment without HITL:

- [ ] **Gold set** — 10–20 Companies/Locations with manually verified NPI/location key and address/phone.
- [ ] **Key-only enrichment** — Enrichment uses only NPI; no matching by name/address.
- [ ] **Staging or copy fields** — Write Mimilabs results to staging/copy properties first, or fill-blanks-only.
- [ ] **Match accuracy** — Measured on gold set; ≥ 95% (or your threshold) for “returned entity is correct.”
- [ ] **Completeness** — Fill rate for address and phone above your threshold (e.g. ≥ 70% / ≥ 60%).
- [ ] **Validation rules** — Country, state, phone format, address sanity (and optional name check) in place; flagged rows reviewed.
- [ ] **Overwrite policy** — Documented (e.g. fill blanks only for MVP).
- [ ] **Logging** — Key, response summary, and write decision logged for a sample or all records.
- [ ] **CS buy-in** — CS knows which fields come from Mimilabs and that HITL or spot-checks are in place until metrics are green.

---

## 8. Ongoing monitoring (after rollout)

- **Weekly or monthly:**  
  - **Match:** Spot-check a random sample of enriched records (e.g. 5–10) — is the address/phone plausible for that Company/Location?  
  - **Completeness:** % of Locations with `npi` that have address / phone filled.
  - **Freshness:** If you have “last enriched” or “last updated,” % enriched in last 30 days.
- **Alerts:** If completeness drops below threshold or a validation rule starts flagging many rows, pause auto-overwrite and review.
- **Integration with weekly audit:** Optionally add a “Mimilabs health” section to `.cursor/hubspot-context/weekly-audit-report.md` (e.g. fill rate and count of keyed-but-unenriched records) once the Location object and enrichment exist.

---

## 9. Summary

| Pillar | How to verify | Before trusting at scale |
|--------|----------------|---------------------------|
| **Match** | Key-only lookup; pilot on gold set; match accuracy %; optional name/organization check. | Match accuracy ≥ 95% on gold set; key required in production. |
| **Completeness** | Fill rate for address, phone (and name if from Mimilabs). | Above agreed threshold (e.g. 70% / 60%); report to CS. |
| **Freshness** | Overwrite policy (fill blanks vs overwrite); optional “last updated” / “last enriched.” | Policy documented; prefer fill-blanks-only for MVP. |
| **Safeguards** | Validation rules; logging; HITL until metrics green. | Rules in place; flagged rows reviewed; no full overwrite until validated. |

Keeping **key-only matching**, **fill-blanks-only** for MVP, **validation rules**, and **pilot metrics** ensures Mimilabs data is consistently matched and accurate enough to trust before scaling.
