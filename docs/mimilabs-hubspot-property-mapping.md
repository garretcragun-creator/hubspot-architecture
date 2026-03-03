# Mimilabs → HubSpot Property Mapping

> Map Mimilabs (NPPES / healthcare) organization and location fields to HubSpot **Company** and **Location** so enrichment can be applied consistently.  
> Mimilabs MCP (`https://mimilabs.ai/api/mcp`) runs SQL over 50+ US government healthcare datasets, including **NPPES** (National Plan and Provider Enumeration System). Organization and practice-location fields below are derived from NPPES and the [NLM NPI Organization API](https://clinicaltables.nlm.nih.gov/apidoc/npi_org/v3/doc.html) field descriptions.

---

## 1. Source: What Mimilabs Can Provide

### 1.1 Organizations (NPI Type 2 — “Organization”)

One record per organization (legal entity). Matches the **parent** in a parent-child view; map to HubSpot **Company**.

| Source field (NPPES / NLM API style) | Description | Typical use |
|--------------------------------------|-------------|-------------|
| **NPI** | 10-digit National Provider Identifier (unique org ID) | Lookup key; store on Company for enrichment. |
| **name.full** | Full legal business name | Company name. |
| **name_other.full** | Other name (DBA, former name, etc.); may be multiple | Secondary name / DBA. |
| **addr_practice** (object) | **Primary practice location** (see §1.2) | Often the “main” address; can map to Company address or first Location. |
| **addr_practice.line1** | Street address line 1 | Address. |
| **addr_practice.line2** | Line 2 (suite, etc.) | Address. |
| **addr_practice.city** | City | City. |
| **addr_practice.state** | State | State. |
| **addr_practice.zip** | ZIP | Zip. |
| **addr_practice.phone** | Practice phone | Phone. |
| **addr_practice.fax** | Practice fax | Fax. |
| **addr_practice.country** | Country | Country. |
| **addr_mailing** (object) | Mailing address (can be PO Box) | Mailing address. |
| **addr_mailing.line1**, **.line2**, **.city**, **.state**, **.zip**, **.phone**, **.fax**, **.country** | Same structure as practice | Mailing fields. |
| **licenses** | Taxonomy / specialty (can be multiple) | Provider type, specialty. |
| **licenses.taxonomy.code** | Taxonomy code | Specialty code. |
| **licenses.taxonomy.classification** | Classification text | Company type / specialty. |
| **misc.EIN** | Employer Identification Number | EIN (rarely populated). |
| **misc.enumeration_date** | When NPI was issued | Enumerated date. |
| **misc.last_update_date** | Last NPPES update | Last updated. |
| **misc.is_org_subpart** | Organization subpart flag | Subpart indicator. |
| **misc.parent_LBN** | Parent legal business name | Parent org name. |
| **misc.parent_TIN** | Parent TIN | Parent org TIN. |
| **misc.auth_official** (object) | Authorized official | Contact info for authorized official. |
| **misc.auth_official.first**, **.last**, **.title**, **.phone** | Name and phone | Optional contact mapping. |

### 1.2 Child locations (practice locations)

- **Primary practice location** is part of the main NPI record (`addr_practice` above).
- **Additional practice locations** are in NPPES **Practice Location Reference File** (one row per extra location per NPI). Same address structure: line1, line2, city, state, zip, phone, fax, country.

| Source concept | Description | HubSpot target |
|----------------|-------------|----------------|
| Primary practice address | `addr_practice.*` on the org record | Company address and/or first **Location** record. |
| Other practice locations | Rows in Practice Location Reference File keyed by NPI | Additional **Location** records (one per site). |

So: **one organization (NPI)** → one HubSpot **Company**; **each practice location** (primary + additional) → one HubSpot **Location** linked to that Company.

---

## 2. Consistent mapping: Organization → Company

Use these for **enriching HubSpot Company** from Mimilabs organization (NPI) data.

| Mimilabs / NPPES source | HubSpot object | HubSpot property (internal name) | Notes |
|-------------------------|----------------|-----------------------------------|-------|
| NPI | Company | `npi` or `stat_organization_id`* | Unique key; prefer one canonical ID per object. |
| name.full | Company | `name` | Legal business name. |
| name_other.full (e.g. DBA) | Company | Custom, e.g. `dba_name` or store in notes | If you need DBA separately. |
| addr_practice.line1 + line2 | Company | `address` (or `street_address`) | Concatenate; or use single `address` from API if provided. |
| addr_practice.city | Company | `city` | |
| addr_practice.state | Company | `state` | |
| addr_practice.zip | Company | `zip` | |
| addr_practice.phone | Company | `phone` | Primary practice phone. |
| addr_practice.fax | Company | `fax` (if exists) | |
| addr_practice.country | Company | `country` | |
| licenses.taxonomy.classification | Company | Custom, e.g. `provider_type` or `npi_provider_type` | Org type/specialty. |
| misc.enumeration_date | Company | Custom, e.g. `npi_enumeration_date` | Optional. |
| misc.last_update_date | Company | Custom, e.g. `npi_last_updated` | Optional. |

\* Align with existing `.cursor/hubspot-context/hs-schema.md`: you already have `stat_organization_id` for Stat; decide whether NPI is stored there or in a separate `npi` property.

---

## 3. Consistent mapping: Practice location → Location (custom object)

Use these for **enriching HubSpot Location** from Mimilabs primary or additional practice location.

| Mimilabs / NPPES source | HubSpot object | HubSpot property (internal name) | Notes |
|-------------------------|----------------|-----------------------------------|-------|
| NPI (parent org) | Location | — | Link via Company; Company has NPI. |
| Practice location identifier* | Location | `npi` (or NPI + sequence for multiple sites) | Unique per location; used as lookup key for Mimilabs. |
| addr_practice / location line1 + line2 | Location | `address` | Street address. |
| city | Location | `address_city` (or single `address` line) | If Location has separate city. |
| state | Location | `address_state` | If Location has separate state. |
| zip | Location | `address_zip` or `zip` | |
| phone | Location | `phone` | Site phone. |
| fax | Location | `fax` (if you add it) | Optional. |
| country | Location | `country` | |
| Display label | Location | `name` | e.g. "Main Campus", "Clinic – Downtown", or "{{city}}, {{state}}". |

\* For **primary** practice location this can be the org NPI; for **additional** locations use NPI + sequence/index or the identifier Mimilabs returns for each practice location row.

---

## 4. Recommended HubSpot property set for mapping

### 4.1 Company (existing + optional new)

- **Existing (check hs-schema.md):** `name`, `address`, `city`, `state`, `zip`, `phone`, `domain`, `stat_organization_id`.
- **Add if not present:**  
  - `npi` (string) — NPI for Mimilabs lookup and dedup.  
  - Optional: `npi_provider_type`, `npi_enumeration_date`, `npi_last_updated`, `dba_name`, `fax`, `country`.

### 4.2 Location (custom object — Phase 1)

From `docs/location-erd.md`, ensure these exist for consistent mapping:

| Property (internal name) | Type | Mimilabs source |
|--------------------------|------|------------------|
| `name` | string | Derived (e.g. city + state or friendly label). |
| `address` | string | addr_practice.line1 (+ line2). |
| `phone` | string | addr_practice.phone. |
| `npi` | string | NPI (lookup for Mimilabs); universal for FQHCs and non-FQHCs. |
| `address_city` | string | addr_practice.city (optional if you use one `address` line). |
| `address_state` | string | addr_practice.state. |
| `address_zip` | string | addr_practice.zip. |
| `country` | string | addr_practice.country. |
| `fax` | string | Optional. |

---

## 5. Mimilabs MCP usage note

- Mimilabs exposes data via **SQL** over NPPES and other datasets. Table/column names may be **snake_case** (e.g. `provider_first_line_business_practice_location_address`). Map those to the field names above (e.g. that column → `addr_practice.line1`).
- Use **NPI** (and, for multiple locations, practice location key) as the **lookup** when calling Mimilabs; then map returned columns to the HubSpot properties in §§2–4.
- Authenticated API key: 1,000 rows/query; anonymous: 30 rows/query ([mimilabs.ai MCP](https://www.mimilabs.ai/mcp)).

---

## 6. Summary table: one place to implement

| Source (Mimilabs/NPPES) | HubSpot object | HubSpot property |
|-------------------------|----------------|------------------|
| NPI | Company | `npi` or `stat_organization_id` |
| name.full | Company | `name` |
| addr_practice.line1+2, city, state, zip | Company | `address`, `city`, `state`, `zip` |
| addr_practice.phone | Company | `phone` |
| Same (per practice location) | Location | `address`, `phone`, `address_city`, `address_state`, `address_zip`, `name`, `npi` |

Use this as the single reference when building the Mimilabs → HubSpot enrichment (workflows, scripts, or MCP tools). **Identifier:** Use **NPI** for both FQHCs and non-FQHCs; HRSA ID is FQHC-only and not used for Mimilabs — see `docs/identifiers-fqhc-non-fqhc.md`.

---

## 7. Data verification (trust before scale)

Before relying on Mimilabs at scale, verify **match accuracy**, **completeness**, and **freshness**. See **`docs/mimilabs-data-verification.md`** for:

- Key-only matching (no name/address lookup)
- Pilot on a gold set (10–20 known-good records)
- Fill-blanks-only overwrite policy for MVP
- Validation rules (country, state, phone format)
- Ongoing monitoring and optional integration with the weekly audit
