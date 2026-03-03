# Phase 1 — Minimum Mimilabs Enrichment Properties

> **Scope:** Only properties we **enrich from Mimilabs/NPPES** in Phase 1. No “nice to have.” Fill-blanks-only; key = NPI. See `docs/mimilabs-data-verification.md`.

---

## 1. Location (custom object)

**Lookup:** Location has `npi` set → call Mimilabs/NPPES by NPI (practice location); write only where **target is currently blank**.

| # | HubSpot property | Type | Mimilabs/NPPES source | Phase 1 |
|---|------------------|------|------------------------|---------|
| 1 | **address** | string | Practice location: line1 (+ line2 if needed), single line | ✅ Enrich |
| 2 | **phone** | string (phonenumber) | Practice location phone | ✅ Enrich |

**Not in Phase 1:** `name` (from workflow/CS), `npi` (from CS), `hrsa_id` (from CS, FQHC only), onboarding/revenue (from CS). **Excluded from MVP:** separate city/state/zip, fax — see `docs/location-mvp-architecture.md`. If you add `address_city`, `address_state`, `address_zip` later, they can be enriched in a later phase.

**Minimum = 2 properties:** `address`, `phone`.

---

## 2. Company

**Lookup:** Company has `npi` set → call Mimilabs/NPPES by NPI (organization); write only where **target is currently blank**.

| # | HubSpot property | Type | Mimilabs/NPPES source | Phase 1 |
|---|------------------|------|------------------------|---------|
| 1 | **address** | string | Org primary practice: line1 (+ line2), single line | ✅ Enrich |
| 2 | **phone** | string (phonenumber) | Org primary practice phone | ✅ Enrich |

**Optional (if you use them in reports/filters and they exist in your schema):**

| # | HubSpot property | Mimilabs source | Phase 1 |
|---|------------------|-----------------|---------|
| 3 | **city** | addr_practice.city | Optional |
| 4 | **state** | addr_practice.state | Optional |
| 5 | **zip** | addr_practice.zip | Optional |
| 6 | **name** | name.full (legal business name) | Optional — only to fill blank or confirm; risk of overwriting Sales/CS name |

**Not in Phase 1:** fax, DBA, taxonomy/provider type, enumeration date, mailing address, authorized official. Add in a later phase if needed.

**Minimum = 2 properties:** `address`, `phone`. Optionally add `city`, `state`, `zip` (and cautiously `name`) if already on Company and you want them filled from Mimilabs.

---

## 3. Summary table

| Object | Minimum Phase 1 (enrich from Mimilabs) | Optional Phase 1 |
|--------|----------------------------------------|------------------|
| **Location** | `address`, `phone` | — |
| **Company** | `address`, `phone` | `city`, `state`, `zip` (and `name` with care) |

---

## 4. Rules

- **Key:** Enrich only when `npi` is set on the record (Company or Location). No matching by name/address.
- **Fill blanks only:** Do not overwrite existing non-empty values. See `docs/mimilabs-data-verification.md`.
- **Source:** NPPES organization (Company) or NPPES practice location (Location). Mimilabs column names are snake_case (e.g. `provider_business_practice_location_address_*`, `provider_practice_location_address__telephone_number`); map to the HubSpot properties above.
- **Validation:** Apply country/state/phone format checks before writing; flag bad rows. See verification doc §6.

---

## 5. References

- **MVP architecture (Location props):** `docs/location-mvp-architecture.md`
- **Full mapping (all possible fields):** `docs/mimilabs-hubspot-property-mapping.md`
- **Verification (key-only, fill-blanks):** `docs/mimilabs-data-verification.md`
- **HubSpot Company schema:** `.cursor/hubspot-context/hs-schema.md` (address, city, state, zip, phone)
