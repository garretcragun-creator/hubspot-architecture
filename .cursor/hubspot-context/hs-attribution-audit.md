# HubSpot Attribution System Audit

> Last updated: 2026-02-11 — Post-cleanup. Original audit plus consolidation results.

## Executive Summary

| Metric | Before | After |
|---|---|---|
| **Total attribution properties** | 152+ | ~65 active |
| **Properties archived (Tier 1)** | — | **43** (zero data loss) |
| **Properties blocked by workflow refs** | — | 4 (pending) |
| **Self-reported attribution fields** | 7 | 1 (`self_reported_attribution`, 7 records) |
| **Active attribution workflows** | 12 | 10 |
| **Inactive attribution workflows** | 3 | 1 (bridge — replaced by spec below) |

### Decision: Source of Truth (Option B)

**`stat_latest_source`** (your 23-value custom taxonomy) is the **single canonical source field**. Rationale:
- More granular than HubSpot's native 10-value `hs_analytics_source`
- Covers your specific channels (Hosted Event, Sponsored Webinar, Prospecting, etc.)
- Already has 100% fill rate on contacts, 86% on companies, 80% on deals
- `hs_analytics_source` remains as HubSpot-native backup but is **not** the operational truth

---

## New Simplified Architecture

### The "First Touch + Last Touch" Model

Instead of snapshotting attribution at every lifecycle stage (`cc_`, `ac_`, `oc_`, `dc_`, `cw_`, `fe_`), we keep only what matters:

```
CONTACT (source of truth):
  First Touch:           Last Touch (updated on each conversion):
  • stat_original_source  • stat_latest_source
  • cc_source             • medium
  • cc_medium             • lead_source_category
  • cc_offer              • latest_variant

COMPANY (copied from primary contact):
  • stat_latest_source    (86% fill)
  • stat_original_source  (68% fill)
  • medium                (90% fill)
  • ac_source, ac_medium  (66% fill — account-created snapshot)
  • source_history        (86% fill — accumulated trail)

DEAL (stamped at deal creation):
  • lead_source           (92% fill — primary deal attribution)
  • stat_latest_source    (80% fill)
  • medium, latest_variant (78%/74% fill)
  • oc_source, oc_medium, oc_variant (64% fill — from Disco Set)
```

### Data Flow (Simplified)

```
┌─────────────┐    Workflow: "Metadata source mapping"     ┌───────────────────┐
│  UTM Params  │───────────────────────────────────────────▶│  Contact:          │
│  (form/URL)  │    Maps raw UTMs to stat_latest_source    │  stat_latest_source│
└─────────────┘                                            │  medium            │
                                                           │  lead_source_cat   │
                                                           └────────┬───────────┘
                                                                    │
     Workflow: "Attribution Operator"                               │
     → Routes to First Touch / Last Touch runners                   │
     → First Touch stamps cc_source, cc_medium, cc_offer            │
     → Last Touch updates stat_latest_source, copies to Company     │
                                                                    │
     Workflow: "Disco Set → Send Slack & Set Attribution"           │
     → On discovery stage change:                                   │
       - Stamps oc_ fields on contact + company                    │
       - Copies stat_latest_source, medium, lead_source_category    │
         to Company AND Deal                                        │
       - Sets lead_source on Deal                                   │
                                                                    ▼
┌───────────────────┐         ┌───────────────────┐
│   Company:         │         │   Deal:            │
│   stat_latest_src  │         │   lead_source      │
│   stat_original    │         │   stat_latest_src   │
│   medium           │         │   medium            │
│   ac_source/medium │         │   oc_source/medium  │
│   source_history   │         │   source_history    │
└───────────────────┘         └───────────────────┘
```

### Full Attribution Taxonomy (from visual flowchart, 2026-02-12)

The canonical mapping flows left-to-right through 9 columns:

**HubSpot Campaign → UTM Campaign → Offer → Last Referrer → Variant → Medium → UTM Source → Stat Latest Source → Source Category**

> **Key distinction:** The `medium` property on a contact stores the **platform/channel detail** (e.g., "Google", "LinkedIn", "Programmatic"). The `UTM Source` column is the intermediate classification code (e.g., "paidsearch", "paidsocial") that maps to the `stat_latest_source` value. These are two different things.

#### Paid Digital

| Variant | Medium (platform) | UTM Source | Source | Category |
|---|---|---|---|---|
| keyword | google, bing | paidsearch | **Paid Search** | Paid Digital |
| ad format - ad name | linkedin, facebook, instagram | paidsocial | **Paid Social** | Paid Digital |
| ad size - ad name | Programmatic, CTV, GDN | display | **Display** | Paid Digital |
| ad name | google, linkedin, facebook, instagram | retargeting | **Retargeting** | Paid Digital |
| email name - date | sponsored-email | email | **Sponsored Email** | Paid Digital |
| review name - date | paid-review | review-site | **Paid Review** | Paid Digital |

#### Owned Digital

| Variant | Medium (platform) | UTM Source | Source | Category |
|---|---|---|---|---|
| email name - date | marketing-email | email | **Email** | Owned Digital |

#### Organic Digital

| Variant | Medium (platform) | UTM Source | Source | Category |
|---|---|---|---|---|
| post name - date | youtube, facebook, instagram | organicsocial | **Organic Social** | Organic Digital |
| search term or page | yahoo, google, bing | search | **Organic Search** | Organic Digital |

#### Direct Digital

| Variant | Medium (platform) | UTM Source | Source | Category |
|---|---|---|---|---|
| AI channel | *(AI platform name)* | LLMs | **LLMs** | Direct Digital |
| media publication name | *(publication name)* | Press Release | **Press Release** | Direct Digital |
| Web | Web | Web | **Web Link** | Direct Digital |
| Direct | Direct | Direct | **Direct** | Direct Digital |
| *(system)* | *(vendor name)* | Integration | **Integration** | Direct Digital |

#### Field & Events

| Variant | Medium (platform) | UTM Source | Source | Category |
|---|---|---|---|---|
| event name - date | client summit, industry summit | event | **Hosted Event** | Field & Events |
| webinar name - date | thought leadership, sales-focused, other | webinar | **Hosted Webinar** | Field & Events |
| event name - date | NAC, MGMA, AGMA | conference | **Sponsored Event** | Field & Events |
| webinar name - date | NAC, MGMA, AGMA | webinar | **Sponsored Webinar** | Field & Events |

#### Sales

| Variant | Medium (platform) | UTM Source | Source | Category |
|---|---|---|---|---|
| List Name | New Import, AGMA, Transfer | *(n/a)* | **List Import** | Sales |
| Meeting Name | Meeting Name | *(n/a)* | **Meeting Attendee** | Sales |
| outreach type | re-activation | *(n/a)* | **Prospecting** | Sales (existing contact) |
| outreach type | Artisan, Sequence, One-Off | *(n/a)* | **Prospecting** | Sales (new contact) |

#### Partner & Affiliate

| Variant | Medium (platform) | UTM Source | Source | Category |
|---|---|---|---|---|
| Customer name | Customer Referral | *(n/a)* | **Referral** | Partner & Affiliate |
| Employee Name | Employee Referral | *(n/a)* | **Referral** | Partner & Affiliate |
| Partner Name | Partner Referral | *(n/a)* | **Partner** | Partner & Affiliate |
| Affiliate Name | Affiliate | *(n/a)* | **Affiliate** | Partner & Affiliate |

#### Quick-Reference: Source → Category

| Source | Category |
|---|---|
| Paid Search | Paid Digital |
| Paid Social | Paid Digital |
| Display | Paid Digital |
| Retargeting | Paid Digital |
| Sponsored Email | Paid Digital |
| Paid Review | Paid Digital |
| Email | Owned Digital |
| Organic Social | Organic Digital |
| Organic Search | Organic Digital |
| LLMs | Direct Digital |
| Press Release | Direct Digital |
| Web Link | Direct Digital |
| Direct | Direct Digital |
| Integration | Direct Digital |
| Hosted Event | Field & Events |
| Hosted Webinar | Field & Events |
| Sponsored Event | Field & Events |
| Sponsored Webinar | Field & Events |
| List Import | Sales |
| Meeting Attendee | Sales |
| Prospecting | Sales |
| Referral | Partner & Affiliate |
| Partner | Partner & Affiliate |
| Affiliate | Partner & Affiliate |

#### Quick-Reference: Source → Valid Medium Values (what the `medium` property stores)

The `medium` property stores the **platform or channel detail** — not the UTM source classification code.

| Source | Valid `medium` Values |
|---|---|
| Paid Search | google, bing |
| Paid Social | linkedin, facebook, instagram, tiktok, reddit, pinterest, x |
| Display | Programmatic, CTV, GDN |
| Retargeting | google, linkedin, facebook, instagram |
| Sponsored Email | sponsored-email |
| Paid Review | paid-review |
| Email | marketing-email |
| Organic Social | youtube, facebook, instagram, linkedin, x, twitter, reddit, tiktok, pinterest |
| Organic Search | yahoo, google, bing, duckduckgo |
| LLMs | *(AI platform name)* |
| Press Release | *(publication name)* |
| Web Link | Web |
| Direct | Direct |
| Integration | End-User, Email Extension, Sales Extension, *(vendor)* |
| Hosted Event | *(event name — e.g., client summit, industry summit)* |
| Hosted Webinar | *(webinar type — thought leadership, sales-focused, other)* |
| Sponsored Event | *(conference name — NAC, MGMA, AGMA)* |
| Sponsored Webinar | *(conference name — NAC, MGMA, AGMA)* |
| List Import | *(import source — Apollo, Salesforce, CRM UI, etc.)* |
| Meeting Attendee | Meeting Name, Meeting Attendee |
| Prospecting | Artisan, Sequence, One-Off, re-activation |
| Referral | Customer Referral, Employee Referral |
| Partner | Partner Referral |
| Affiliate | Affiliate |

### Bridge Workflow Replacement

**Old workflow** (`Map Lead Source to Company & Deal`, ID 89825188 / v4 1692915868): 88 actions, 22 branches, DISABLED since Sept 2025. **DO NOT re-enable.**

**New workflow** (`Source History Sync (Append-Only Bridge)`, ID 1775371301): 5 actions, CREATED 2026-02-11. Currently DISABLED — enable after review.

**Design principle:** A deal has multiple contacts with different sources. A CEO's "Referral" matters more than a Nurse's "Organic Search." The bridge should NEVER overwrite deal-level attribution — it should only accumulate history. The Disco Set workflow stamps deal source once at discovery. The rep picks the "Primary Driver" at close.

| Action | What | Target | Why |
|---|---|---|---|
| 1 | Copy `stat_latest_source` | → Company | Safe — 1:1 primary contact relationship |
| 2 | Copy `medium` | → Company | Same |
| 3 | Append `stat_latest_source` | → Company `source_history` | Full trail of all sources |
| 4 | **Append** `stat_latest_source` | → Deal `source_history` | **Append-only** — preserves all contact sources on the deal without overwriting |
| 5 | Copy `lead_source_category` | → Company `latest_lead_source_category` | Category rollup |

**What this does NOT do (by design):**
- ❌ Does NOT set Deal `stat_latest_source` (Disco Set handles this once at discovery)
- ❌ Does NOT set Deal `lead_source` (Disco Set handles this once)
- ❌ Does NOT overwrite anything on the Deal — only appends to history
- ❌ No branching, no role evaluation, no complexity

**Deal attribution flow:**
```
Contact sources accumulate in Deal source_history
         ↓
Disco Set stamps Deal stat_latest_source ONCE at discovery
         ↓
Rep reviews source_history on the deal card
         ↓
Rep selects "Primary Driver" at close (final attribution call)
```

---

## Properties Archived (2026-02-11)

### Tier 1: Zero-data properties — 43 archived

| Object | Count | Properties |
|---|---|---|
| **Contact** | 19 | `cc_self_reported_attribution`, `ac_self_reported_attribution`, `oc_self_reported_attribution`, `dc_self_reported_attribution`, `cw_self_reported_attribution`, `fe_self_reported_attribution`, `fe_source`, `cw_source`, `cw_medium`, `fe_medium`, `cw_offer`, `fe_offer`, `campaign`, `cc_campaign`, `ac_campaign`, `dc_campaign`, `fe_campaign`, `cw_lead_source_category`, `proposed_attribution_fix` |
| **Company** | 13 | `oc_offer`, `oc_offer_type`, `oc_offer_type_history`, `oc_variant`, `dc_offer`, `dc_variant`, `cw_medium`, `cw_offer`, `cw_offer_type_history`, `cw_variant`, `opportunity_source`, `company_attribution_errors`★, `suggested_attribution_fixes`★ |
| **Deal** | 15 | `stat_original_source`, `oc_offer`, `dc_offer_type`, `dc_offer_type_history`, `dc_variant`, `cw_lead_source_category`, `cw_medium`, `cw_offer`, `cw_offer_type_history`, `cw_source_history`, `cw_variant`, `cw_offer_type`, `original_offer_type`★, `lead_source_category`, `deal_hygiene_issues` |

★ = 4 properties blocked by workflow references (need workflow cleanup first):
- `companies.company_attribution_errors` (used in 1 place)
- `companies.suggested_attribution_fixes` (used in 1 place)
- `deals.oc_offer` (used in 1 place — likely Disco Set)
- `deals.original_offer_type` (used in 1 place)

### Tier 2: Low-data properties (1-5 records) — pending manual review

| Object | Property | Records | Action |
|---|---|---|---|
| Contact | `oc_lead_source_category` | 2 | Clear & archive |
| Contact | `utm_offer` | 1 | Clear & archive |
| Company | `oc_medium` | 4 | Clear & archive |
| Company | `cw_lead_source_category` | 1 | Clear & archive |
| Company | `company_offer` | 5 | Clear & archive |
| Company | `dc_offer_type` | 5 | Clear & archive |
| Company | `cw_source_history` | 1 | Clear & archive |
| Company | `original_offer_type` | 1 | Clear & archive |
| Deal | `dc_offer` | 5 | Clear & archive |

### Tier 3: Historical data — keep read-only, stop populating

| Object | Property | Records | Notes |
|---|---|---|---|
| Contact | `original_lead_source_category` | 8,159 | Historical — not on recent records |
| Contact | `ac_lead_source_category` | 5,850 | Historical |
| Contact | `original_variant` | 8,278 | Historical |
| Contact | `utm_source/medium/campaign/content/term` | ~40 each | Raw UTMs — older records only |
| Contact | `oc_source` | 48 | From before bridge disabled |
| Contact | `ac_offer` | 15 | Low volume |
| Contact | `self_reported_attribution` | 7 | The sole survivor of the 7 SR fields |
| Contact | `attribution_data_hygiene_issues` | 1,945 | Hygiene system — still active |
| Contact | `deal_attribution_ping` | 685 | Monitoring signal |
| Company | `ac_lead_source_category` | 3,313 | Historical |
| Company | `ac_offer_type` | 43 | Low volume |
| Company | `latest_offer_type_history` | 70 | Moderate |

---

## Active Workflow Roster (Post-Cleanup)

| # | Workflow | Status | Actions | Role | Keep? |
|---|---|---|---|---|---|
| 1 | First Touch Runner | ✅ Active | 1 | Stamps first-touch fields | ✅ Keep |
| 2 | Last Touch Runner | ✅ Active | 8 | Updates latest, copies to Company | ✅ Keep — but review for simplification |
| 3 | Attribution Operator | ✅ Active | 1 | Routes contacts to FT/LT runners | ✅ Keep |
| 4 | Contact Attribution Hygiene | ✅ Active | 3 | Custom code hygiene checks | 🟡 Review — may be unnecessary with simpler arch |
| 5 | Contact Attribution Fields Change → Flag It | ✅ Active | 4 | Date-stamps changes | 🟡 Review — monitoring overhead |
| 6 | Lifecycle Stage – Attribution | ✅ Active | 2 | Lifecycle-based attribution | ✅ Keep |
| 7 | Disco Set → Slack & Attribution | ✅ Active | 30+ | Discovery set → stamps oc_, copies to company/deal | ✅ Keep — primary bridge currently |
| 8 | Map Lead Source to Company & Deal | ❌ Inactive | 88 | Old bridge — **DO NOT re-enable** | 🔴 Delete & replace with lean spec above |
| 9 | Event → Set Latest Attribution | ✅ Active | 1 | Hapily event attribution | ✅ Keep |
| 10 | Prospecting – Attribution & Stage | ✅ Active | 2 | Prospecting lifecycle | ✅ Keep |
| 11 | Map Lead Source To Meeting Source | ✅ Active | 1 | Meeting source mapping | ✅ Keep |
| 12 | Metadata source mapping | ✅ Active | 1 | Raw UTM → standardized taxonomy | ✅ Keep — core intake |
| 13 | Webinar registrations (analog) | ✅ Active | 1 | Niche webinar attribution | ✅ Keep |

---

## Remaining Work

### Immediate
1. **Build the lean bridge workflow** (7 actions — see spec above) in HubSpot UI
2. **Delete the old bridge workflow** (88 actions, ID 89825188 / v4 1692915868)
3. **Clear & archive Tier 2 properties** (9 properties, 1-5 records each)

### Short-Term
4. **Review Disco Set workflow** — it has 30+ actions and may be doing redundant work now that the lean bridge handles source syncing
5. **Review Contact Attribution Hygiene workflow** — the elaborate 20-issue-type hygiene system may be unnecessary with the simpler architecture
6. **Decide on `lead_source_category` mapping** — move it upstream to "Metadata source mapping" so it's set once on contact creation

### Long-Term
7. **Consider event-based attribution** — replace remaining lifecycle stamps with an Attribution Event custom object
8. **Retire hygiene subsystem** — once architecture is stable, the self-monitoring system becomes unnecessary overhead

---

## TIMWOODS Waste Reduction Scorecard

| Waste Type | Before | After | Status |
|---|---|---|---|
| **Overproduction** | 152 properties | ~65 active | 🟢 57% reduction |
| **Over-processing** | 6 lifecycle-specific stamp sets | 2 (first touch + last touch) | 🟢 Eliminated |
| **Defects** | 4 type mismatches across objects | 2 remaining (stat_latest_source, stat_original_source) | 🟡 Improved |
| **Motion** | 88-action bridge + 30-action Disco Set | 7-action bridge + Disco Set | 🟢 92% action reduction |
| **Inventory** | 41 contact-only silos | ~15 (historical, read-only) | 🟡 Improved |
| **Transport** | 4 parallel tracking systems | 1 canonical (`stat_latest_source`) | 🟢 Eliminated |
| **Skills** | 20 hygiene issue types, 9 monitoring fields | Pending review | 🟡 Pending |
