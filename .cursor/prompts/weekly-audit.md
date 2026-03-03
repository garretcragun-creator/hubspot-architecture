# Weekly HubSpot Audit

Run the weekly data-quality audit and act on the results.

## Step 1 — Run the audit script

```bash
node scripts/weekly-audit.js
```

This runs 8 parallel checks against the live HubSpot API and writes a report to `.cursor/hubspot-context/weekly-audit-report.md`. It takes ~10–20 seconds.

## Step 2 — Read the report

Open and read `.cursor/hubspot-context/weekly-audit-report.md`.

## Step 3 — Act on results

Follow these rules strictly:

### AUTO-FIX items → Execute immediately
- Delete unnamed/inactive workflows.
- Archive properties with 0% fill rate that are not referenced by active workflows.
- No confirmation needed. Log what you did.

### REVIEW items → Summarize and recommend
- Present each issue with a clear recommendation and the record count.
- Do NOT execute changes. Wait for my approval.
- Group by severity: critical (>90d overdue, missing attribution on closed-won) → warning → minor.

### INFO items → Include in summary only
- Mention these in a one-line status. No action needed.

### ERROR items → Note and skip
- If an API check failed, note it. Do not retry unless I ask.

## Step 4 — Update the knowledge layer

If AUTO-FIX actions changed the portal (deleted workflows, archived properties), update the relevant files:
- `.cursor/hubspot-context/hs-automation.md` — if workflows were deleted
- `.cursor/hubspot-context/hs-schema.md` — if properties were archived
- `.cursor/hubspot-context/hs-attribution-audit.md` — if attribution properties changed

## Step 5 — Summary

End with a table:

| Category | Count | Action Taken |
|---|---|---|
| Auto-fixed | N | brief description |
| Needs review | N | waiting for approval |
| Clean | N | no issues |
| Errors | N | API failures |

## Context files (already loaded via .cursorrules)
- Schema: `.cursor/hubspot-context/hs-schema.md`
- Pipelines: `.cursor/hubspot-context/hs-pipeline.md`
- Automation: `.cursor/hubspot-context/hs-automation.md`
- Attribution: `.cursor/hubspot-context/hs-attribution-audit.md`

## Guardrails
- **NEVER** merge companies without my approval.
- **NEVER** delete contacts or deals.
- **NEVER** modify active workflows.
- **NEVER** change deal stages or lifecycle stages.
- **NEVER** recreate archived attribution properties (see `.cursorrules`).
- **ONLY** delete workflows that are both unnamed AND inactive.
- **ONLY** archive properties that have 0% fill rate AND are not used by any active workflow.
