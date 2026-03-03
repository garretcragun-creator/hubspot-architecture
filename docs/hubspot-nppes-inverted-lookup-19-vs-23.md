# HubSpot NPPES Inverted Lookup — 19 vs 23 Location Inconsistency

## Root cause

The **expansion step uses a single exact legal business name** from the one “best match” record. NPPES returns only records that match that string **exactly**. The same organization can be registered under **two slightly different legal names**:

| Variant | Count in NPPES (zip 23123) | In HubSpot result? |
|--------|----------------------------|---------------------|
| `CENTRAL VIRGINIA HEALTH SERVICES INC` (no comma) | 19 | ✅ Yes — expansion uses this name |
| `CENTRAL VIRGINIA HEALTH SERVICES, INC.` (comma + period) | 4 | ❌ No — exact search misses these |

**What the script does:**

1. **GEO:** Query NPPES by zip → returns **all** orgs in that zip (both name variants).
2. **findBestMatch:** Picks **one** record with the highest Dice similarity to the input name.
3. **Legal name:** `legalName = bestMatch.record.basic.organization_name` → e.g. `"CENTRAL VIRGINIA HEALTH SERVICES INC"`.
4. **Expand:** `nppesGet({ organization_name: legalName })` → **exact** match. NPPES returns only NPIs whose registered legal name is exactly that string.
5. The 4 NPIs registered as **"CENTRAL VIRGINIA HEALTH SERVICES, INC."** are never returned, so they are missing from the 19.

So the inconsistency is **not** a bug in matching or truncation — it’s that **expansion is done with one exact legal name**, and the other legal-name variant’s locations are excluded.

---

## Fix options

### Option A: Expand with multiple name variants (recommended)

After you have `legalName` from the best match:

1. Build a small set of **normalized variants** (e.g. strip punctuation, normalize "INC" / ", INC." / "INC.").
2. For each variant, call `nppesGet({ organization_name: variant })`.
3. Merge results by NPI (dedupe) and use that as the full location list.

Example variant logic:

```javascript
function getLegalNameVariants(legalName) {
  const base = legalName.replace(/,?\s*inc\.?$/i, '').trim();
  return [
    legalName,
    base + ' INC',
    base + ' INC.',
    base + ', INC.',
    base + ', INC'
  ];
}
```

Then loop over variants, call NPPES, merge `results` by `r.number`, then map to your location JSON.

### Option B: Don’t rely on a single winner for expansion

- After the GEO search, **don’t** pick one best match and expand only from it.
- Instead, **filter** all GEO results by a similarity threshold (e.g. score >= 0.65).
- Treat all of those as the same org and use their **combined** NPI list as your locations (each NPI is one location).  
  That gives you 23 locations without a second NPPES call, but you lose the “one legal name” expansion pattern.

### Option C: Normalize legal name before expansion

- Before calling NPPES for expansion, **normalize** the legal name (e.g. remove comma before INC, standardize period).
- Then call NPPES **once** with the normalized name.  
  This only works if NPPES returns both variants for a normalized query; in practice the API often does **exact** match, so Option A is more reliable.

---

## Summary

| Cause | Expansion uses one exact `organization_name`. The other variant (", INC.") has 4 NPIs that never get returned. |
| Fix | Expand using multiple legal-name variants and merge by NPI (Option A), or expand from all high-scoring GEO matches (Option B). |
