# HubSpot Workflow: NPPES Lookup (Company + Address → NPI + All Sites)

Use the **Custom code** action in a HubSpot workflow to run the “company name + full address → get NPI and legal name → find all sites” process inside HubSpot.

---

## Requirements

- **Operations Hub Professional or Enterprise** (Custom code actions are not available on other tiers).
- Workflow with **Custom code** step.

---

## What the code does

1. **Resolve this site** — Calls the public NPPES API with `city`, `state`, `zip` (and optional `address`) from the workflow. Picks the matching org and returns its **NPI** and **legal business name**.
2. **Find all sites** — Calls NPPES again with that **legal business name** and returns every NPI (and address/phone) for that org, including other states.

Outputs: `npi`, `legalBusinessName`, `siteCount`, `locationsJson` (JSON array of locations).

**Company name:** The script scrubs the HubSpot company name (trim, collapse spaces, normalize punctuation) before use. If the address-based match fails, it falls back to an NPPES search by the scrubbed company name + state/zip.

---

## HubSpot schema: property names (Company)

Per your HubSpot schema (`.cursor/hubspot-context/hs-schema.md`), use these **Company** internal names when mapping into the code:

| Code input name | HubSpot Company property (internal name) | Description |
|-----------------|-----------------------------------------|-------------|
| `companyName`   | `name`                                  | Company name |
| `address`       | `address`                               | Street address (line 1). Optionally concatenate with `address2` in the workflow if you use line 2. |
| `city`          | `city`                                  | City |
| `state`         | `state`                                 | State/region (2-letter preferred, e.g. AZ) |
| `zip`           | `zip`                                   | Postal code |

---

## Workflow runs on Opportunity (Deal)

Deals do **not** have address or company name on the deal record; those live on the **associated Company**. Do one of the following:

1. **Recommended: Pull from associated Company in the Custom code step**  
   In the workflow, add the Custom code action. Under **Properties to include in code**, add inputs from **Associated company** (or "Related record" → Company). Select the Company properties `name`, `address`, `city`, `state`, `zip` and set each **Code input name** to: `companyName`, `address`, `city`, `state`, `zip` (see table above). No separate "copy to deal" step is required.

2. **Alternative: Copy to Deal first**  
   Add a step before the Custom code that copies the associated Company's `name`, `address`, `city`, `state`, `zip` into Deal properties (e.g. custom Deal properties). Then in the Custom code step, map those Deal properties to the same code input names.

The NPPES lookup should always be driven by **Company** data; when the enrollment is the opportunity, use the **associated Company** as the source.

---

## Setup in HubSpot

1. **Workflow**  
   Create or open a workflow (e.g. **Deal-based** for opportunities, or Company-based if enrolling companies).

2. **Add Custom code**  
   In the workflow, add the **Custom code** action.

3. **Inputs**  
   Map workflow data into the code via **Properties to include in code**:
   - If **Company-based**: choose the enrolled **Company** and select `name`, `address`, `city`, `state`, `zip`. Set **Code input names** to: `companyName`, `address`, `city`, `state`, `zip`.
   - If **Deal-based**: choose **Associated company** and select the same Company properties, then set the same Code input names.

   | Code input name | Description              | Example                          |
   |-----------------|--------------------------|----------------------------------|
   | `companyName`   | Company name (for reference) | Adelante Healthcare          |
   | `address`       | Street address           | 3033 North Central Avenue       |
   | `city`          | City                     | Phoenix                          |
   | `state`         | State (2-letter)         | AZ                               |
   | `zip`           | Postal code              | 85012                            |

   See the **HubSpot schema** table above for the exact Company property internal names (`name`, `address`, `city`, `state`, `zip`).

4. **Data outputs**  
   In the Custom code action, define these **Data outputs** so later steps can use them:

   | Variable ID       | Data type | Description                          |
   |-------------------|-----------|--------------------------------------|
   | `npi`             | String    | NPI for the location that matched the address. |
   | `legalBusinessName` | String  | Legal business name from NPPES.       |
   | `siteCount`       | Number    | Total number of sites (NPIs) for this org. |
   | `locationsJson`   | String    | JSON array of `{ npi, address, city, state, zip, phone }` per site. |
   | `executionSummary` | String   | Short status (e.g. "OK npi=123 sites=5", "ERROR: missing city/state", "NO_MATCH"). **Map this to a property** to see what happened when the workflow log only shows SUCCESS. |

5. **Paste the code**  
   Open `scripts/hubspot-workflow-nppes-lookup.js`, copy the **entire** file, and paste it into the Custom code editor. Save.

6. **No secrets**  
   The script uses the **public NPPES API** only. No HubSpot secrets are required. To use Mimilabs MCP instead, you’d add a secret and change the HTTP calls in the code.

---

## Using the outputs

- **Set Company/Location NPI** — Use an **Edit records** action after the Custom code; set the Company (or Location) property `npi` from the output `npi`.
- **Create multiple Location records** — Use a follow-up Custom code or an integration to parse `locationsJson` and create/update Location records with each NPI (HubSpot workflows can’t loop over JSON directly; you may need one code step that creates records via API, or process the list elsewhere).
- **Branch by site count** — Use **If/then** on `siteCount` (e.g. if `siteCount` > 1, send to “multi-location” path).

---

## Limits

- **Execution time:** 20 seconds. The script does 2 NPPES requests; usually enough. If the second call is slow, you may hit the limit for very large result sets.
- **String output:** HubSpot caps a single output at **65,000 characters**. `locationsJson` is truncated if the org has hundreds of sites so it stays under that limit.
- **NPPES:** 200 results per request. Orgs with more than 200 sites will only get the first 200 in `locationsJson` and `siteCount`.

---

## File

- **Script:** `scripts/hubspot-workflow-nppes-lookup.js`  
- **Process reference:** `docs/mimilabs-databases-join-guide.md` (§4.1.2)
