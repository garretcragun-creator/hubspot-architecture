# Unique Identifiers — FQHC vs Non-FQHC

> **TL;DR:** Use **NPI** as the single enrichment key for Mimilabs (works for both FQHCs and non-FQHCs). **HRSA ID** is FQHC-only; use it only for HRSA/340B tracking if needed.

---

## 1. NPI (National Provider Identifier) — Universal

| Attribute | Value |
|-----------|--------|
| **Who has it** | All HIPAA-covered healthcare providers that bill Medicare, Medicaid, or other health plans — **both FQHCs and non-FQHCs**. |
| **Type 2 NPI** | Organization-level (legal entity). One per organization; subparts that bill separately can have their own. |
| **Format** | 10-digit number (no intelligence: no region/specialty encoded). |
| **Source** | NPPES (National Plan and Provider Enumeration System), maintained by CMS. |
| **Use for** | Billing/transactions; **Mimilabs/NPPES lookup** (address, phone, taxonomy). |

**For your use case:** NPI is the **only identifier that works across FQHCs and non-FQHCs** for Mimilabs enrichment, because Mimilabs (and the public NPPES API) is keyed by NPI.

---

## 2. HRSA ID — FQHC (and related programs) only

| Attribute | Value |
|-----------|--------|
| **Who has it** | Organizations in HRSA programs (e.g. FQHCs, 340B covered entities, certain health centers). |
| **Use for** | HRSA reporting, 340B eligibility/exclusion file, federal grant and program tracking. |
| **Not used for** | NPPES/Mimilabs lookup (those systems are NPI-based). |

So **HRSA ID does not apply to non-FQHCs**. If you only store HRSA ID, you can’t enrich non-FQHC customers from Mimilabs.

---

## 3. Recommendation for Location and Company

| Purpose | Identifier | Where to store | Applies to |
|--------|------------|----------------|------------|
| **Enrichment key (Mimilabs/NPPES)** | **NPI** | Location: `npi` (or primary enrichment key). Company: `npi`. | FQHCs and non-FQHCs. |
| **FQHC-specific tracking** | **HRSA ID** | Optional: Location `hrsa_id`, Company `hrsa_id`. | FQHCs only. |

- **Enrichment:** Always use **NPI** to call Mimilabs/NPPES. One field (e.g. `npi`) on Location and Company.
- **Optional:** Add **HRSA ID** as a separate property for FQHC accounts only (reporting, 340B, etc.). Do not use HRSA ID for Mimilabs lookup.

---

## 4. Naming in HubSpot

- **Location / Company:** Use a property **NPI** (`npi`) for the Mimilabs enrichment key. Label: e.g. “NPI (enrichment key)” so CS knows it’s the 10-digit number used for address/phone lookup.
- **Optional:** **HRSA ID** (`hrsa_id`) — “HRSA ID (FQHC only)” for programs/reporting. Leave blank for non-FQHCs.

If you already have a property called “Location ID” or “HRSA ID” that was intended as the enrichment key, **repurpose it to store NPI** for enrichment and add a separate “HRSA ID” only if you need FQHC-specific tracking.

---

## 5. Reference

- NPI: [CMS NPI Standard](https://www.cms.gov/Regulations-and-Guidance/Administrative-Simplification/NationalProvIdentStand), [NPPES Registry](https://npiregistry.cms.hhs.gov/).
- HRSA: program-specific (e.g. 340B, health center designations). Not in NPPES.
