# HubSpot Weekly Audit Report

> Generated: 2026-02-12T18:20:37.796Z | Duration: 9.6s

## Summary

| Check | Status | Action Items |
|---|---|---|
| Attribution Gaps | 🔴 Issues | 2 need review |
| Cross-Object Drift | 🔴 Issues | 3 need review |
| Stale Meetings (Demo/Discovery) | 🔴 Issues | 1 need review |
| Stale Deals | 🔴 Issues | 1 need review |
| Empty Companies | ✅ Clean | — |
| Duplicate Companies | 🔴 Issues | 1 need review |
| Workflow Health | 🔴 Issues | 1 auto-fixable, 1 need review |
| Orphan Companies | 🔴 Issues | 1 need review |

**Totals:** 1 auto-fixable | 10 need human review

---

## Attribution Gaps

### `REVIEW` 21779 contacts missing `stat_latest_source`

  - Jody Deteres (jdeteres@sblhs.org) — 1077045801, created 2017-10-13
  - Heather Summers (heather.summers@chickasaw.net) — 1077045801, created 2017-10-13
  - Sarah Baylous (sbaylous@anhc.org) — marketingqualifiedlead, created 2017-10-13
  - Brad Clark (no email) — customer, created 2017-10-24
  - Regina Bonnevie Rogers (rbbonnevie@pchsweb.org) — lead, created 2017-10-24
  - Steve Barnes (steve.barnes@neenan.com) — subscriber, created 2017-10-27
  - Julie Pool (julie.pool@onechc.org) — opportunity, created 2017-10-27
  - Lindsay Rucinsky (lindsayrucinsky@sweetmedicalcenter.org) — marketingqualifiedlead, created 2017-10-27
  - George Olson (golson@sterlinghealth.net) — marketingqualifiedlead, created 2017-10-27
  - Chad Vargas (chad.vargas@gracelight.org) — opportunity, created 2018-10-17

### `REVIEW` 336 deals missing `stat_latest_source`

  - Castle — stage: 6f75eed0-c3f8-49f9-a9af-84791515bb90, close: 2023-12-11, amount: 1000
  - Ohio Clinic — stage: 6f75eed0-c3f8-49f9-a9af-84791515bb90, close: 2023-12-11, amount: —
  - East Arkansas — stage: 6f75eed0-c3f8-49f9-a9af-84791515bb90, close: 2023-12-11, amount: 1000
  - Native American Community Clinic — stage: 6f75eed0-c3f8-49f9-a9af-84791515bb90, close: 2023-12-11, amount: 1000
  - Change Inc. — stage: 6f75eed0-c3f8-49f9-a9af-84791515bb90, close: 2023-12-11, amount: 1000
  - Queens Care — stage: 6f75eed0-c3f8-49f9-a9af-84791515bb90, close: 2023-12-11, amount: 1000
  - AVV Health — stage: 6f75eed0-c3f8-49f9-a9af-84791515bb90, close: 2023-12-11, amount: 77310
  - QueensCare — stage: 6f75eed0-c3f8-49f9-a9af-84791515bb90, close: 2023-12-11, amount: —
  - EAST ARKANSAS FAMILY HEALTH CENTER, INC. - New Deal — stage: 6f75eed0-c3f8-49f9-a9af-84791515bb90, close: 2023-12-11, amount: —
  - Native American Community Clinic — stage: 6f75eed0-c3f8-49f9-a9af-84791515bb90, close: 2023-12-11, amount: —

---

## Cross-Object Drift

### `REVIEW` 13 lead status mismatches (sampled 30 recent contacts)

  - **Tatiana Madrid** lead status = `NEW`, but **Adelante Healthcare - Surprise** has none
  - **Alexis Camarena** lead status = `NEW`, but **Adelante Healthcare - Parent** has none
  - **Tim Weets** lead status = `IN_PROGRESS` ≠ **Edwards County Medical Center** = `CONNECTED`
  - **Jennifer Faluade** lead status = `NEW`, but **Adelante Healthcare - Parent** has none
  - **Diana Hernandez** lead status = `NEW`, but **Adelante Healthcare - Parent** has none

### `REVIEW` 16 source category mismatches across objects (sampled 30 recent contacts)

  - **Tatiana Madrid** category `Organic Digital` ≠ **Adelante Healthcare - Surprise** category `Direct Digital`
  - **Alexis Camarena** category `Organic Digital` ≠ **Adelante Healthcare - Parent** category `Paid Digital`
  - **Tim Weets** category `Organic Digital` ≠ **Edwards County Medical Center** category `Field & Events`
  - **Kiosk Login** category `Direct Digital` ≠ **Lasante Health Center - Parent** category `Organic Digital`
  - **Jennifer Faluade** category `Organic Digital` ≠ **Adelante Healthcare - Parent** category `Paid Digital`

### `REVIEW` 11 medium/source mismatches across objects (sampled 30 recent contacts)

  - **Ruth Bessette** medium `Integration` ≠ **Foundation Health Partners - Parent** medium `Web`
  - **Samantha Young** medium `Search` ≠ **Happi - 2597 (Sparkman)** medium `Web`
  - **Kiosk Login** medium `Integration` ≠ **Lasante Health Center - Parent** medium `Search`
  - **Erica Martinez** medium `Direct` ≠ **Columbia Valley Community Health East Wenatchee - Medical** medium `Web`
  - **Megan Murray** medium `Web` ≠ **Kaniksu Sandpoint - Parent** medium `Search`

---

## Stale Meetings (Demo/Discovery)

### `REVIEW` 34 past demo/discovery calls with no outcome logged (1 demo, 33 discovery)

  - "(untitled)" (Demo Call) on 2025-10-02
  - "KPHC <> Stat.io | Intro Call" (Discovery Call) on 2025-09-12
  - "Mountainlands <> Stat | Intro Meeting" (Discovery Call) on 2025-09-16
  - "Moses Weitzman <> Stat | Intro Call" (Discovery Call) on 2025-09-08
  - "Stat.io intro " (Discovery Call) on 2025-09-10
  - "Stat Intro - DePaul Community Health Centers " (Discovery Call) on 2025-10-07
  - "Stanford Healthcare <> Stat | Intro Call" (Discovery Call) on 2025-11-07
  - ""Avengers Assemble" Meeting 1- Stat Introduction" (Discovery Call) on 2025-10-02
  - "Stat intro" (Discovery Call) on 2025-09-25
  - "Stat intro" (Discovery Call) on 2025-09-25

---

## Stale Deals

### `REVIEW` 3 deals > 90 days overdue (of 3 total stale)

  - **Family Health Expansion** — close: 2021-03-31 (1778d overdue), amount: 54000
  - **El Dorado** — close: 2024-11-04 (465d overdue), amount: 0
  - **Adelante Phase 02 Org Wide - Wickenberg, Goodyear, Buckeye, Gila Bend** — close: 2025-08-04 (191d overdue), amount: 0

---

## Duplicate Companies

### `REVIEW` 2 domains shared by multiple companies (NOT in parent/child relationship)

  - **opendoorhealth.com**: Open Door Community Health Centers (225 contacts, 0 deals) vs. Open Door Community Health Centers - Parent (63 contacts, 2 deals)
  - **uchcbronx.org**: Union Community Health Center, Inc. (103 contacts, 0 deals) vs. Union Community Health Center (Uchc Bronx) - Parent (14 contacts, 3 deals)

### `INFO` 5 shared domains are parent/child (expected)

  - adelantehealthcare.org: Adelante Healthcare - Parent, Adelante Healthcare - Surprise
  - foundationhealth.org: Foundation Health Partners - Parent, Fairbanks Memorial Hospital
  - houstonmethodist.org: Houston Methodist - Parent, Methodist Hospital, Houston Methodist - Creekside, Houston Methodist - Cypress

---

## Workflow Health

### `INFO` Workflow inventory: 169 active, 62 inactive
### `AUTO-FIX` 2 unnamed/inactive workflows — safe to delete

  - ID: 1739490209 (created: 2025-12-09)
  - ID: 1760508259 (created: 2026-01-15)

### `REVIEW` 53 workflows disabled in the last 60 days (intentional?)

  - "Auto Assign Company Owner Based on Task (John)" (ID: 554085443) — updated: 2025-12-18
  - "Set Date | Today" (ID: 561085326) — updated: 2025-12-18
  - "Handle NPS Responses" (ID: 564187775) — updated: 2025-12-18
  - "NPS Survey" (ID: 564361657) — updated: 2025-12-18
  - "Event | Mobly | Conference Interactions" (ID: 1606229324) — updated: 2025-12-18

---

## Orphan Companies

### `REVIEW` 2443 companies with 0 associated contacts (50 shown, no children)

  - **Southeastern Endocrine** — domain: seedreed.com, deals: 0, stage: —, created: 2017-10-13
  - **Laramie Physicians For Women & Children** — domain: www.laramiephysicians.com, deals: 0, stage: —, created: 2017-10-13
  - **Ellis Hospital** — domain: ellismedicine.org, deals: 0, stage: —, created: 2017-10-13
  - **Ultimate Medical Academy** — domain: ultimatemedical.edu, deals: 0, stage: —, created: 2017-10-13
  - **Evanscillesurgical.com** — domain: evanscillesurgical.com, deals: 0, stage: —, created: 2017-10-13
  - **Southern California Orthopedic Institute** — domain: scoi.com, deals: 0, stage: —, created: 2017-10-13
  - **Southern Maryland Medical Group** — domain: smmgmd.com, deals: 0, stage: —, created: 2017-10-13
  - **Medical Health Associates Of Western New York** — domain: mhawny.com, deals: 0, stage: —, created: 2017-10-13
  - **Pivant** — domain: pivant.com, deals: 0, stage: —, created: 2017-10-13
  - **California Medical Association** — domain: cmanet.org, deals: 0, stage: —, created: 2017-10-13

---

## Action Guide

- **AUTO-FIX**: These items are safe to execute without human approval.
- **REVIEW**: Present these to the user with a recommendation. Do NOT auto-execute.
- **INFO**: Context only — no action needed unless the user asks.
- **ERROR**: An API call failed. Note it and move on.