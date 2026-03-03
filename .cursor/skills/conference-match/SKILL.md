---
name: conference-match
description: Match conference attendee CSVs against HubSpot CRM to build contact lists. Use when the user mentions conference matching, event attendee lists, HIMSS, trade show lists, or wants to match a CSV of companies/titles against HubSpot.
---

# Conference Attendee → HubSpot Matcher

Runs `scripts/conference-match.js` to match conference/event CSV data against HubSpot companies and contacts, then creates a static contact list after human review. The system **learns from each review cycle** -- confirmed and rejected matches are saved to a knowledge file so future runs auto-resolve known companies and contacts.

## Prerequisites

- `.env` with `HUBSPOT_ACCESS_TOKEN` (scopes: `crm.objects.companies.read`, `crm.objects.contacts.read`, `crm.lists.write`)
- Input CSV with at least a **company name** column

## Workflow

```
Task Progress:
- [ ] Step 1: Validate the CSV
- [ ] Step 2: Run match mode
- [ ] Step 3: Human reviews output CSV
- [ ] Step 4: Run commit mode (creates list + saves learning)
- [ ] Step 5: Verify list in HubSpot
```

### Step 1: Validate the CSV

Inspect the CSV to identify column names:

```bash
head -5 "<path-to-csv>"
```

Confirm which columns hold **company name** (default: `"Company"`), **job title** (default: `"Title"`), and optionally **email**.

### Step 2: Run match mode

**Recommended:** Use `--target-only` to pull target accounts from HubSpot (`hs_is_target_account = true`) and match locally. This is fast (~10s) and uses HubSpot as the source of truth.

```bash
node scripts/conference-match.js match \
  --csv "<path-to-csv>" \
  --company-col "Company" \
  --title-col "Title" \
  --target-only \
  --output "./conference-match-review.csv"
```

Without `--target-only`, the tool searches HubSpot for every unique company in the CSV (slower, ~1 min per 500 companies, but finds all CRM matches regardless of target account status).

If the CSV has an email column, add `--email-col "Email"` for a direct-lookup fast path before company matching.

On subsequent runs, the tool consults `data/match-knowledge.json` and auto-resolves previously confirmed companies and pinned contacts -- only genuinely unknown companies require fuzzy matching.

### Step 3: Human review (MANUAL)

Open the review CSV. Key behaviors to know:

- **Decision-maker filtering:** Only contacts with `is_decision_maker_title = true` in HubSpot are shown (plus any pinned contacts from prior reviews).
- **All contacts per company:** Each matched company lists ALL its decision-maker contacts, not just one. This gives the reviewer full visibility.
- **`csv_attendees` column:** Shows how many CSV rows matched this company, for context.

The reviewer should:

1. **AUTO-APPROVE** rows where `match_confidence = LEARNED` (previously confirmed) or `match_confidence = HIGH` (exact name match)
2. **CAREFULLY REVIEW** rows where `match_confidence = MEDIUM` -- verify the CSV company is actually the same org as the HubSpot company
3. **Fill** the `approved` column: `Y` to include, `N` to exclude, blank to skip
4. **Save** the file

**To pin a contact not in the output:** Add a row manually with the `hs_company_id`, `hs_contact_id`, and `approved = Y`. The commit phase will save it as a pinned contact for future runs.

### Step 4: Run commit mode

```bash
node scripts/conference-match.js commit \
  --reviewed "./conference-match-review.csv" \
  --list-name "HIMSS 2026 Attendees" \
  --source "HIMSS 2026"
```

This does two things:
1. **Creates a HubSpot static list** with all contacts where `approved = Y`
2. **Saves learning** to `data/match-knowledge.json`:
   - `Y` on a company row → confirmed mapping (auto-matched next time)
   - `N` on a company-only row → rejected pair (skipped next time)
   - `Y` on a contact row → pinned include (always shown next time)
   - `N` on a contact row → excluded (hidden next time)

### Step 5: Verify

Confirm the list appears in HubSpot under **Contacts → Lists** with the expected contact count.

## The Learning Loop

```
Run 1:  Fuzzy match everything → human reviews all 300 rows → commit saves decisions
Run 2:  200 rows auto-resolved (KNOWN/PINNED) → human reviews 30 new rows → commit saves
Run N:  Review burden → 0 as knowledge grows
```

The knowledge file at `data/match-knowledge.json` persists between runs and stores:

- **Company mappings:** normalized CSV name → HubSpot company ID (confirmed or rejected)
- **Contact preferences:** HubSpot company ID → arrays of included/excluded contact IDs

The file is human-readable JSON and can be manually edited if needed.

## Key Columns in the Review CSV

| Column | Meaning |
|---|---|
| `match_type` | `EMAIL` (direct hit), `KNOWN` (from knowledge file), `PINNED` (contact from knowledge), `CONTACT` (fuzzy company match + DM contact), `COMPANY` (company match, no contacts) |
| `match_confidence` | `LEARNED` (from knowledge), `HIGH` (exact name), `MEDIUM` (fuzzy -- needs review) |
| `is_decision_maker` | `true`/`false` -- from HubSpot `is_decision_maker_title` property |
| `title_relevance` | `EXACT`, `PARTIAL`, `NONE` -- how well the CSV title matches the contact's title |
| `csv_attendees` | Number of CSV rows that matched this company |
| `approved` | **Blank -- human fills Y or N** |

## Adapting for Different CSVs

| Scenario | Flags |
|---|---|
| Target accounts only (recommended) | `--target-only` |
| All HubSpot companies (broader) | Omit `--target-only` |
| Has email addresses | Add `--email-col "Email"` |
| Different column names | `--company-col "Organization" --title-col "Job Title"` |
| Label for knowledge entries | `--source "Event Name 2026"` |

## What the Tool Does NOT Do

- **Does not create contacts.** Without name + email, creating contacts pollutes the CRM.
- **Does not modify existing records.** Read-only (except list creation in commit mode).
- **Does not auto-approve.** Human review is mandatory between match and commit.
- **No ML/model training.** Learning is deterministic lookups from a human-curated corrections file.
