# Mimilabs Databases — Join Keys & Properties for Multi-Table Queries

> To **join multiple tables** from the Mimilabs data lakehouse, you need the right **unique identifiers on every HubSpot record**. This doc lists available schemas/tables (from the [mimi-example-library](https://github.com/mimilabs/mimi-example-library)), **join keys** per schema, and **recommended HubSpot properties** so you can gather data across tables.

---

## 1. How Mimilabs is organized

- **Workspace:** `mimi_ws_1` (data lakehouse).
- **Query pattern:** `SELECT ... FROM mimi_ws_1.{schema}.{table}`.
- **Convention:** Column names are **snake_case** (e.g. `provider_business_practice_location_address_state_name`).
- **Source:** Mimilabs MCP (`https://mimilabs.ai/api/mcp`) runs SQL against these tables; the [example library](https://github.com/mimilabs/mimi-example-library) mirrors schema/table structure.

---

## 2. Schemas (databases) available

From the mimi-example-library repository structure (top-level folders = schemas):

| Schema | Description / source |
|--------|----------------------|
| **nppes** | NPI registry (CMS NPPES) — providers, addresses, practice locations, taxonomies. |
| **hrsa** | HRSA (e.g. HPSA, MUA, unmet need) — often geographic or facility-based. |
| **datacmsgov** | data.cms.gov — Medicare utilization, FQHC, home health, nursing home, etc. |
| **datahealthcaregov** | data.healthcare.gov — plans, formulary, provider directories. |
| **datamedicaidgov** | Medicaid data. |
| **cmscoding** | CMS coding (e.g. HCPCS, ICD). |
| **cmsdataresearch** | CMS research datasets. |
| **cmsinnovation** | CMS innovation center. |
| **cmspayment** | CMS payment data. |
| **openpayments** | Open Payments (physician/teaching hospital payments). |
| **provdatacatalog** | Provider data catalog. |
| **ahrq** | AHRQ (e.g. MEPS, CCSR). |
| **cdc** | CDC health data. |
| **census** | Census data. |
| **epa** | EPA. |
| **fda** | FDA. |
| **nlm** | NLM. |
| **partcd** | Part C/D. |
| **payermrf** | Payer MRF. |
| **prescriptiondrugplan** | Prescription drug plans. |
| **grahamcenter**, **hhsoig**, **huduser**, **medlineplus**, **nasbo**, **nber**, **neighborhoodatlas**, **palmettogba**, **stategov**, **surgoventures**, **synmedpuf**, **synthea**, **umn_ihdc**, **zillow** | Additional schemas (see repo). |

---

## 3. Universal join key: NPI

For **provider/organization**-level joins across most healthcare tables, the common key is **NPI** (National Provider Identifier).

| Identifier | Scope | Use for joins |
|------------|--------|----------------|
| **npi** | All NPPES tables; many CMS and Open Payments tables | Primary key for provider/org. Store on **Company** and **Location** (per site when you have subpart NPI). |
| **mimi_src_file_date** | Many tables | Snapshot date; use for “latest” record (e.g. `WHERE mimi_src_file_date = (SELECT MAX(mimi_src_file_date) FROM ...)`). |

**Recommendation:** On every HubSpot record you want to enrich or join to Mimilabs, store **NPI** (`npi`). That single property lets you join to NPPES and most provider-linked CMS and Open Payments tables.

---

## 4. Per-schema tables and join keys

### 4.1 nppes (NPI registry)

| Table | Unique identifier(s) | Key columns (examples) | Join to HubSpot |
|-------|----------------------|------------------------|------------------|
| **npidata** | `npi` | `npi`, `entity_type_code`, `provider_business_practice_location_*`, `healthcare_provider_taxonomies`, `npi_deactivation_date`, `mimi_src_file_date` | Company/Location `npi` |
| **pl** (practice location) | `npi` (+ address/location) | `npi`, `provider_practice_location_address_*`, `provider_secondary_practice_location_address_*`, `mimi_src_file_date` | Location = one per practice location; join on `npi` (or NPI + sequence if multiple) |
| **npi_to_address** | `npi` (+ address key) | Links NPI to address entities | `npi` |
| **address_key** | address key | Address normalization | Join via npi_to_address |
| **othername** | `npi` | DBA, former name | `npi` |
| **endpoint** | `npi` | Digital endpoints | `npi` |
| **deactivated** | `npi` | Deactivation info | `npi` |
| **fhir_*** | `npi` | FHIR-style name/address/telecom/qualification | `npi` |

**Relevant columns (npidata / pl):** Provider/organization name, business practice location address (line1, city, state, zip), telephone, fax, taxonomy; secondary practice location fields on `pl`. All join on **npi**.

---

### 4.1.1 Querying child or sub-locations of an org (Mimilabs MCP)

**Yes.** The MCP runs SQL over the same NPPES data; you can get child locations in two ways:

| Type | What it is | How to query |
|------|------------|--------------|
| **Practice locations (same NPI)** | One NPI can have a **primary** practice address on the main record plus **additional** practice locations. | **Primary:** `SELECT ... FROM mimi_ws_1.nppes.npidata WHERE npi = ?` (primary address columns on that row). **Additional:** `SELECT ... FROM mimi_ws_1.nppes.pl WHERE npi = ?` — returns one row per additional practice location for that NPI. Use `mimi_src_file_date = (SELECT MAX(...) FROM ...)` for latest snapshot. |
| **Subpart NPIs (child orgs with own NPI)** | Orgs (Type 2) can have **subparts** that have their own NPI (e.g. Adelante Healthcare has many NPIs, one per location/subpart). | NPPES has `is_org_subpart`, `parent_LBN`, `parent_TIN` on the record. To list “all subpart NPIs under parent,” query by **parent legal business name** (e.g. `WHERE provider_organization_legal_business_name LIKE '%Adelante Healthcare%'`) or by state/zip and filter by name — there is not always a dedicated `parent_npi` column in the bulk data. So “child/subpart” list = all NPIs sharing the same organization name (and optionally same EIN/parent). |

So: for **one NPI**, use **`npidata`** (primary location) + **`pl`** (other practice locations). For **one org name** (all locations including subparts), query **`npidata`** (and optionally **`pl`**) filtered by organization name to get all NPIs and their addresses.

---

### 4.1.2 Recommended process: company name + full address → then all sites

**Best process when you have company name and one known address (e.g. from HubSpot or a customer):**

| Step | Input | Action | Output |
|------|--------|--------|--------|
| **1. Resolve this site** | Company name + **full address** (street, city, state, zip) | Query NPPES (or Mimilabs `npidata` / `pl`) by **address** — e.g. city, state, zip, and filter by address line containing street number/name (or use NPPES API: city, state, postal_code, then filter results by address). | **NPI** for that location and the **legal business name** as stored in NPPES (e.g. "ADELANTE HEALTHCARE, INC."). |
| **2. Find all sites** | **Legal business name** from step 1 | Query NPPES (or Mimilabs `npidata`) by **legal business name** (exact or normalized: trim punctuation, handle "INC" / "LLC"). No state/zip filter — search nationally. | **All NPIs** (and their addresses) for that org — covers multiple states and all subpart locations. |

**Why this order:**  
- Address is unique enough to get the right NPI and the **exact legal name** NPPES uses (which often differs from the name you have, e.g. "Adelante Healthcare" vs "ADELANTE HEALTHCARE, INC.").  
- Once you have the legal name, searching by it returns every site/subpart NPI, including in other states.

**Implementation:**  
- **NPPES API:** Search by city + state + postal_code, then filter result addresses for the street; take the first match’s `number` (NPI) and `basic.organization_name` (legal name). Then search again by `organization_name` = that legal name (and paginate if needed).  
- **Mimilabs MCP:** Same logic in SQL — `WHERE` on address columns + city/state/zip to get one row (NPI + legal name); then `WHERE provider_organization_legal_business_name = '<legal_name>'` (or `LIKE`) to get all rows for that org.

---

### 4.2 datacmsgov (data.cms.gov)

Many tables are provider or facility keyed. Common identifiers:

| Identifier | Tables (examples) | Use |
|------------|-------------------|-----|
| **npi** | orderandreferring, optout, mupdme_prvdr, mupphy_prvdr, mupihp_prvdr, pc_fqhc, pc_homehealth, pc_homeinfusion, nursinghome_ae_perf, etc. | Provider/org lookup |
| **ccn** (CMS Certification Number) | Facility-level tables (e.g. nursing home, some FQHC-related) | Facility; crosswalk NPI↔CCN available in some datasets |
| **pecos_id** | Medicare enrollment (if present in a table) | Enrollment linkage |

**Tables of interest for FQHC/org:**  
`pc_fqhc`, `pc_fqhc_owner`, `pc_homehealth`, `pc_homeinfusion`, `orderandreferring`, `mupdme`, `mupphy`, `mupihp`, `mupohp`, `nursinghome_ae_perf`, `optout`, `geovariation`, `datacatalog`.  
Join to HubSpot via **npi** (and optionally CCN if you add it for facilities).

---

### 4.3 datahealthcaregov

| Table | Unique identifier(s) | Relevant columns |
|-------|----------------------|-------------------|
| **provider_base** | `npi` (or provider id) | Provider directory base |
| **provider_addresses** | Provider key + address | Addresses; join via provider key (often NPI) |
| **provider_plans** | Provider + plan | Plan participation |
| **plan**, **plan_formulary_base**, **formulary_details** | Plan identifiers | Less relevant for org/location join |

Use **npi** (or the provider key that maps to NPI) to join provider_base / provider_addresses / provider_plans.

---

### 4.4 openpayments

| Table | Unique identifier(s) | Notes |
|-------|----------------------|--------|
| **general** | Physician NPI, teaching hospital ID | Payments to physicians |
| **ownership** | NPI / entity | Ownership interests |
| **research** | NPI / entity | Research payments |

Joins: **npi** for physician/org; teaching hospital ID if you track hospitals separately.

---

### 4.5 hrsa

| Table | Unique identifier(s) | Notes |
|-------|----------------------|--------|
| **hpsa_fct_det_dh**, **hpsa_fct_det_mh**, **hpsa_fct_det_pc** | HPSA geography/facility | Often state/county/FIPS or HRSA facility ID |
| **mua_det** | MUA geography | Geographic |
| **unmet_need_score** | Geography / facility | Need scores |

HRSA tables are often **geographic or facility-based**, not keyed by NPI alone. To join: use **state/county/FIPS** or **HRSA facility ID** if you have it (e.g. for FQHCs). Optional HubSpot: `state`, `address_state`, `zip`, or `hrsa_id` (FQHC-only).

---

### 4.6 ahrq, cdc, census, fda, nlm, etc.

- **AHRQ:** MEPS, CCSR — often person/encounter or diagnosis; crosswalks to provider/org may use NPI or other IDs.
- **CDC / Census:** Geographic (state, county, FIPS). Join on **state/county/zip** if you store them.
- **FDA:** Drug/device. Join to provider only where a table exposes NPI.
- **NLM:** Terminology; NPI in provider-oriented tables.

For multi-table joins **centered on the same provider/org**, **npi** remains the main key; add **state**, **zip**, or **county** when you need geographic or HRSA-style joins.

---

## 5. Properties to put on every record (minimum for joins)

To be able to join **any** of the provider/org tables and pull in data across Mimilabs:

| HubSpot object | Property (internal name) | Type | Purpose |
|----------------|--------------------------|------|--------|
| **Company** | `npi` | string | Join to nppes.npidata, nppes.pl, datacmsgov, datahealthcaregov, openpayments (org/physician). |
| **Location** | `npi` | string | Join to NPPES (org or subpart), practice location tables, CMS provider tables. |
| **Company** (optional) | `hrsa_id` | string | FQHC-only; join to HRSA tables when key is HRSA facility ID. |
| **Company** / **Location** (optional) | `state`, `zip` | string | Geographic joins (HRSA, census, CDC, state-level CMS). |
| **Company** / **Location** (optional) | `ccn` | string | Facility-level CMS tables when CCN is the key. |

**Minimum for cross-table joins:** **npi** on Company and Location. Add **hrsa_id**, **state**, **zip**, or **ccn** only when you need those specific schemas or tables.

---

## 6. Example: joining multiple tables

```sql
-- Example: NPI + practice location address + taxonomy (all keyed by npi)
SELECT
  n.npi,
  n.provider_organization_legal_business_name,
  n.entity_type_code,
  n.healthcare_provider_taxonomies,
  pl.provider_practice_location_address__first_line,
  pl.provider_practice_location_address__city,
  pl.provider_practice_location_address__state_name,
  pl.provider_practice_location_address__postal_code,
  pl.provider_practice_location_address__telephone_number
FROM mimi_ws_1.nppes.npidata n
LEFT JOIN mimi_ws_1.nppes.pl pl
  ON n.npi = pl.npi
  AND pl.mimi_src_file_date = (SELECT MAX(mimi_src_file_date) FROM mimi_ws_1.nppes.pl)
WHERE n.npi = '1234567890'
  AND n.npi_deactivation_date IS NULL
  AND n.mimi_src_file_date = (SELECT MAX(mimi_src_file_date) FROM mimi_ws_1.nppes.npidata);
```

Here the only value you need from HubSpot is **npi**; everything else comes from Mimilabs.

---

## 7. Summary: what you need on every record

| Goal | Properties on Company / Location |
|------|-----------------------------------|
| Join to **all NPPES** tables (npidata, pl, othername, endpoint, etc.) | **npi** |
| Join to **datacmsgov** provider/FQHC tables | **npi** (optional: **ccn** for facility tables) |
| Join to **datahealthcaregov** provider tables | **npi** |
| Join to **openpayments** | **npi** |
| Join to **hrsa** (FQHC/geographic) | **hrsa_id** (FQHC) and/or **state** / **zip** |
| Join to **census/cdc/state**-level data | **state**, **zip** (or county/FIPS if you add them) |

**Single property that unlocks most joins:** **npi** on Company and Location. Add **hrsa_id**, **state**, **zip**, or **ccn** as needed for HRSA, geographic, or facility-specific tables.

---

## 8. Getting full column lists per table

- **Mimilabs data catalog:** [hi.mimilabs.ai/datacatalog](https://www.mimilabs.ai/datacatalog) — browse schemas and tables for column-level metadata.
- **MCP / SQL:** Use `DESCRIBE mimi_ws_1.{schema}.{table}` or equivalent if the MCP supports it; otherwise run a small `SELECT * FROM mimi_ws_1.{schema}.{table} LIMIT 1` to infer headers.
- **Example library:** Each table folder in [mimi-example-library](https://github.com/mimilabs/mimi-example-library) may have README or example SQL showing columns (e.g. `nppes/npidata`, `nppes/pl`).

---

## 9. References

- Mimilabs MCP: `https://mimilabs.ai/api/mcp`
- Example library (schemas/tables): [mimilabs/mimi-example-library](https://github.com/mimilabs/mimi-example-library)
- Data catalog: [mimilabs data catalog](https://www.mimilabs.ai/datacatalog) (hi.mimilabs.ai/datacatalog)
- NPI = universal key for FQHC + non-FQHC: `docs/identifiers-fqhc-non-fqhc.md`
- HubSpot ↔ Mimilabs mapping: `docs/mimilabs-hubspot-property-mapping.md`
