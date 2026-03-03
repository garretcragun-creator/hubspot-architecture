# Campaigns

## Manual association (contacts & opportunities)

HubSpot supports **manually adding contacts and opportunities (deals) to campaigns**. This capability was added in a recent product update; previously it was not possible.

- **Contacts:** Manual campaign associations are stored in the contact property `hs_manual_campaign_ids` (HubSpot-calculated).
- **Deals:** Manual campaign associations are stored in the deal property `hs_manual_campaign_ids` (HubSpot-calculated).

Use the Campaigns UI or the appropriate HubSpot API to add/remove contacts or deals from campaigns. Attribution and reporting will reflect these manual associations.

---

## Campaign as attribution container (unified source/medium/budget)

Using the **Campaign object** as the central attribution container can simplify the current setup and may **avoid building a custom "marketing touchpoint" object**.

### Current fragmentation

| Channel | Today | Where attribution lives |
|--------|--------|---------------------------|
| Conferences / webinars | Hapily event + Hapily registrant | Event workflow → contact properties |
| Quarterly ad campaigns | HubSpot campaigns | Campaign + segment; contact props from UTMs/workflows |
| Source / medium | Meeting, company, opportunity properties | `stat_latest_source`, `medium`, lifecycle stamps |

### Proposed model: one campaign per initiative

- **One campaign record per initiative** (e.g. "HIMSS 2026", "Q1 LinkedIn", "Webinar – Case Study X").
- **Custom properties on the Campaign** (Marketing Hub Professional/Enterprise):
  - **Source** (dropdown) — same 23 values as `stat_latest_source` (see `hs-attribution-audit.md`). Ensures apples-to-apples reporting.
  - **Medium** (single-line text) — granular (e.g. event name, platform, sequence name).
  - **Budget** (number) — optional; enables spend vs outcome by campaign/source.
  - Optional: Category (or derive from Source), Offer, dates.
- **Associate contacts and/or deals to campaigns** when they're influenced (manual or via workflow).
- **Single sync rule:** When a contact (or deal) is added to a campaign, set `stat_latest_source` (and `medium`, `lead_source_category`) from the **campaign's** properties — so contact/deal stay in sync with the canonical campaign metadata.

### Does it simplify?

| Aspect | Custom Touchpoint object | Campaign as container |
|--------|---------------------------|------------------------|
| New object | Yes (build + maintain) | No — use native Campaign |
| One record per… | Interaction (many per contact) | Initiative (many contacts per campaign) |
| First/last touch | By touchpoint date | By campaign association (confirm if HubSpot stores association date) |
| Source/medium/budget | On each touchpoint | On campaign; set once per initiative |
| Hapily | Would create touchpoints from events | Already creates campaigns; add contact→campaign when they register/attend |
| Reporting | Custom reports / rollups | Native campaign reports + custom props (verify in portal) |

**Yes, it can simplify:** one system for "which initiatives influenced this contact/deal," with source/medium/budget on the campaign. You keep `stat_latest_source` as the contact-level source of truth but **derive** it from campaign (e.g. "when added to campaign → copy campaign.source to contact"), instead of maintaining separate paths for events, ads, and meetings.

### What to confirm in HubSpot

1. **Campaign custom properties** — Settings → Properties → Campaign properties: create Source (dropdown, same options as `stat_latest_source`), Medium (text), Budget (number). Already supported on Marketing Hub Professional+.
2. **Association timestamp** — When a contact/deal is associated to a campaign, does HubSpot expose an "associated at" date (e.g. in API or reports)? Needed if you want "last touch = most recently associated campaign."
3. **Reporting** — Can reports and dashboards filter/group by campaign custom properties (Source, Budget) for apples-to-apples comparison.

### Relation to Touchpoint architecture

The Touchpoint spec in `touchpoint-architecture.md` is **one record per interaction** (timeline per contact). The Campaign approach is **one record per initiative** (many contacts per campaign). For "which channel/initiative drove this, with consistent source/medium and budget," Campaign is enough and avoids a new object. If you later need full interaction-level history (e.g. 5 touchpoints per contact with exact dates), you could still introduce Touchpoints; starting with Campaign as the attribution container is the simpler first step.

### Implementation sketch

1. Add Campaign properties: `attribution_source` (dropdown, 23 values), `attribution_medium` (text), `campaign_budget` (number). Optionally `attribution_category` (or derived from source).
2. When creating campaigns (Hapily event script, ad campaigns, webinars): set these properties on the campaign.
3. When adding a contact or deal to a campaign (manual or workflow): workflow copies `campaign.attribution_source` → contact `stat_latest_source`, `campaign.attribution_medium` → contact `medium`, and category to contact/deal as needed.
4. Optionally: "Set contact attribution from latest campaign" (e.g. when association is created, or nightly from `hs_manual_campaign_ids`) so contact always reflects the most recent campaign's metadata.
5. Reporting: use campaign lists and reports grouped by `attribution_source` / `campaign_budget` for channel and spend comparison.

---

## Credit distribution with campaigns

With Touchpoints, credit distribution (last touch, first touch, linear, time decay) uses each touchpoint’s **date**. With campaigns, the same idea applies, but **HubSpot does not expose when a contact or deal was associated to a campaign** in the standard APIs. So you have to choose how much “order” you need and where to store it.

### Options by model

| Model | What it means | With campaigns |
|------|----------------|----------------|
| **Last touch** | 100% credit to the most recent touch | ✅ Straightforward: whenever a contact/deal is **added** to a campaign, copy that campaign’s `attribution_source` (and medium) to the contact/deal. No association date needed. For deals, “primary driver” at close = 100% to that source. |
| **First touch** | 100% credit to the first touch | ⚠️ Needs “order”: either (a) only set contact attribution when it’s **blank** (first campaign association wins), or (b) store association date yourself and later compute “first” (see below). |
| **Linear** | Equal credit to every touch | ⚠️ Needs **list** of campaigns per contact/deal. You can get “which campaigns” from `hs_manual_campaign_ids` or associations API. Without dates you can still do “1/N credit per campaign” for reporting, but you can’t distinguish first vs last for time decay. |
| **Time decay / position-based** | More weight to recent (or first+last) | ❌ Needs **association date** for each campaign. Not available from HubSpot unless you store it yourself. |

### Practical approach: last touch + primary driver (no dates)

- **Contact:** When a contact is added to a campaign (manual or workflow), a workflow runs and copies that campaign’s `attribution_source` → `stat_latest_source`, `attribution_medium` → `medium`, category → `lead_source_category`. That contact now has “100% last touch” to that campaign. If they’re later added to another campaign, overwrite again — the latest association wins. No need to store when they were added.
- **Deal:** At close, rep selects **Primary driver** (dropdown, same 23 sources). That’s 100% credit to one source for that deal. For pipeline/revenue reporting, sum by `primary_driver` (or by `stat_latest_source` at discovery if you don’t use primary driver yet).
- **Reporting:** “Revenue by source” = sum deal amount by primary driver (or by contact’s stat_latest_source). “Spend by source” = sum campaign budget by `attribution_source`. That’s apples-to-apples without any multi-touch logic.

This matches how your attribution audit already works: single source of truth per contact/deal, with primary driver at close as the final say.

### If you want multi-touch credit distribution later

You need **when** each contact (or deal) was associated to each campaign:

1. **Store association date when you add them (recommended)**  
   When a workflow or script adds a contact/deal to a campaign, also set a contact (or deal) property, e.g. `last_campaign_association_date` and `last_campaign_id` (or campaign guid). That gives you “last” explicitly. For **first** and **linear**, you’d need a full history: either  
   - a **contact property** that appends “campaignId:date” (e.g. text/textarea, append-only), or  
   - a **lightweight custom object** “Campaign association” (contact, campaign, associated_at) created each time you add someone to a campaign (via workflow or API). Then you can run a report or offline job: for each deal, load all campaign associations with dates, apply linear or time decay, and assign fractional credit per campaign/source for reporting.

2. **Use Touchpoints only for multi-touch**  
   If you need full interaction-level timelines (first / last / linear / time decay) with minimal custom logic, the Touchpoint object in `touchpoint-architecture.md` is built for that: one record per interaction with a date. Campaigns would still be the place for initiative-level metadata (source, medium, budget); Touchpoints would be the place for “this contact had these touches on these dates” and credit distribution would run over Touchpoint records.

### Summary

- **Last touch + primary driver:** No association dates needed. Implement with “on add to campaign → copy campaign attribution to contact/deal” and “primary driver at close.” Covers most reporting (revenue by source, spend by source).
- **First touch / linear / time decay:** Need per-contact (or per-deal) campaign association dates. Either store them when you add to campaign (property or small “campaign association” object) and run attribution in reports or a separate job, or introduce Touchpoints for interaction-level credit distribution.
