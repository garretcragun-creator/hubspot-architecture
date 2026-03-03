# NeighborHealth: Website Locations vs NPPES

NeighborHealth’s website lists **11 locations**. NPPES has **5 NPIs** under the legal name **NEIGHBORHEALTH CORPORATION**, at **3 distinct addresses**. This doc maps the relationship and how to reverse-engineer finding these locations.

---

## What’s in NPPES (5 NPIs, 3 addresses)

| NPI       | Location address   | City       | State |
|-----------|--------------------|------------|-------|
| 1316994411 | 10 GOVE ST         | EAST BOSTON | MA   |
| 1821204306 | 10 GOVE ST         | EAST BOSTON | MA   |
| 1174701213 | 10 GOVE ST         | EAST BOSTON | MA   |
| 1255949327 | 20 MAVERICK SQ     | EAST BOSTON | MA   |
| 1487806725 | 26 STURGIS ST      | WINTHROP    | MA   |

All share main phone **617-569-5800**. All have `organizational_subpart: NO` and no `other_names` in NPPES.

---

## Website locations you mentioned (subset of 11)

| Site / program              | Address              | In NPPES? | Note |
|-----------------------------|----------------------|-----------|------|
| (Main / Taylor)             | 10 Gove St           | Yes       | 3 NPIs at this address. |
| 20 Maverick Square           | 20 Maverick Sq       | Yes       | 1 NPI (1255949327). |
| (Winthrop)                  | 26 Sturgis St        | Yes       | 1 NPI (1487806725). |
| Everett Neighborhood PACE    | 801 Broadway         | No        | Everett, MA; not found under any org name/address in NPPES. |
| South End                   | 1601 Washington St   | No        | Boston 02118; no NPI-2 at this address in NPPES. |
| South End                   | 400 Shawmut Ave      | No        | Boston; no NPI-2 at this address in NPPES. |
| Winthrop                    | 17 Main St           | No        | Winthrop; no NPI-2 at 17 Main in NPPES. |
| Neighborhood PACE           | 10 Garofalo St       | No        | Revere (or nearby); no NPI-2 with Garofalo in address in NPPES. |

So: **3 of the website addresses** (10 Gove, 20 Maverick, 26 Sturgis) appear in NPPES as NEIGHBORHEALTH CORPORATION. The others (801 Broadway, 1601 Washington, 400 Shawmut, 17 Main, 10 Garofalo) **do not** appear as organization (NPI-2) locations in NPPES under that name or at that address.

---

## Why the gap?

1. **One legal entity, many sites**  
   NeighborHealth (and the 2020 merger with South End Community Health Center) operates many **programs/campuses** (e.g. PACE, specific clinics). NPPES registers **organizations** and often one NPI per **type of service** or **billing location**, not per “site” or “program” in the marketing sense. So 11 “locations” can be serviced by fewer NPIs at fewer registered addresses.

2. **PACE / programs**  
   “Everett Neighborhood PACE” and “Neighborhood PACE at 10 Garofalo” are program names. They may:
   - Bill under an existing NPI (e.g. 10 Gove or 20 Maverick) and not have their own NPI-2, or  
   - Be registered under a different legal name (e.g. a PACE-specific entity) we didn’t find with simple name/address searches.

3. **South End post-merger**  
   South End Community Health Center merged into NeighborHealth. 1601 Washington and 400 Shawmut may still be registered under an old legal name, or under a different NPI we didn’t find (e.g. different city/zip in NPPES), or may not be separate NPI-2s at all.

4. **Address variation**  
   NPPES may list a different street form (e.g. “ST” vs “STREET”), or a single “main” address per NPI while other sites are just service locations.

So: **website “11 locations” = operational sites/programs; NPPES “5 NPIs at 3 addresses” = what’s actually registered.** The rest of the 11 are either under those same NPIs, under other legal names we didn’t match, or not present as NPI-2 locations.

---

## How to reverse-engineer finding these locations

### 1. **Treat “known parent” as NeighborHealth when appropriate**

- If the **company** in HubSpot is NeighborHealth (or East Boston Neighborhood Health Center / South End Community Health Center), you can:
  - Use the **5 NPIs** (or the 3 unique addresses) as the “canonical” NPPES set.
  - For **any** of the 11 website addresses, you can **assign** them to that parent (e.g. “NeighborHealth Corporation”) in your own data model, even when NPPES has no separate row for that address.

So one form of reverse-engineering is: **list of (address, program name) → parent org (NeighborHealth) → use existing NPPES NPIs for that parent.**

### 2. **Curated mapping table (address → NPI or parent)**

- Build a small table (e.g. in config or in HubSpot) that maps:
  - **Normalized address** (e.g. “801 Broadway”, “Everett”, “MA”) → **parent legal name** “NEIGHBORHEALTH CORPORATION” and/or **preferred NPI** (e.g. 1821204306 for billing or 1316994411 for clinic).
  - Same for 1601 Washington St, 400 Shawmut, 17 Main St, 10 Garofalo St.
- In your ETL or workflow:
  - First try NPPES (by address + city/state, then by legal name).
  - If no NPPES match but the address is in your **curated list** for NeighborHealth (or another known system), set **parent org** and optionally **NPI** from the table.

That way you “find” the location by **recognition**, not only by NPPES.

### 3. **Use Claude to suggest search terms, then NPPES**

- For a given **site name + address** (e.g. “Everett Neighborhood PACE, 801 Broadway, Everett, MA”):
  - **Claude step:** “Given this site name and address, suggest 3 possible legal business names or program names to search in NPPES.”
  - **NPPES step:** Search by `organization_name` + state (and optionally city/postal_code) for each suggested term.
  - **Claude or rules:** From results, pick the best match or “same system” (e.g. NEIGHBORHEALTH CORPORATION) and attach that NPI.
- This can surface NPIs that are under a different legal name (e.g. “Everett PACE LLC”) that we didn’t search manually.

### 4. **NPPES by address only, then match by name**

- For each of the 11 addresses:
  - Query NPPES by **city + state** (and postal_code if you have it), then filter results where **address_1** (and address_2) match the street (normalize “St”/“Street”, numbers, etc.).
  - If you get one or more NPIs at that address, use **Claude (or rules)** to decide if the org name matches “NeighborHealth” / “East Boston Neighborhood” / “South End Community Health” and assign the NPI.
- This reverses “address → NPI” when the address *is* in NPPES under any org; combined with (1) or (2), you can still assign a parent when the address isn’t in NPPES.

### 5. **ETL pipeline integration**

- **Extract:** Include not only company name + address, but also **optional “known system” or “known parent NPI”** (e.g. from a lookup table keyed by domain or company name).
- **Claude Search Terms:** Continue to suggest legal names for NPPES; for known systems like NeighborHealth, you can **also** inject “NEIGHBORHEALTH CORPORATION” and “East Boston Neighborhood Health Center” into the list.
- **After NPPES + Claude Assess:** If no match but **curated map** says this address belongs to NeighborHealth, set **npi** to one of the 5 (e.g. primary 1821204306) and **legalBusinessName** to “NEIGHBORHEALTH CORPORATION”, and set a flag like **matchedByCuration** so you know it wasn’t from NPPES.

---

## Summary

- **Relationship:** The 11 website locations are **operational sites/programs**; NPPES has **5 NPIs at 3 addresses** for NEIGHBORHEALTH CORPORATION. The other 8 (or so) sites are either served by those same NPIs, under a different legal name in NPPES, or not present as separate NPI-2 addresses.
- **Reverse-engineering:** You can “find” these locations by: (1) assigning them to NeighborHealth when you know the company; (2) a curated **address → parent/NPI** table; (3) Claude-suggested NPPES search terms; (4) NPPES by city/state + address filter + name match; (5) using that curated map in your ETL when NPPES returns no match.

If you want, we can add a small **curated location map** (e.g. JSON or CSV) for NeighborHealth’s 11 addresses and wire it into the ETL so those addresses resolve to NEIGHBORHEALTH CORPORATION and a chosen NPI.
