# Touchpoint Object — Architecture

> Status: FINAL DRAFT — February 12, 2026

---

## How It Works (30-second version)

```
Layer 1: Something happens
  (web visit, conference, sequence enrollment, referral, import)
                    ↓
Layer 2: A Touchpoint record is created
  (one record per interaction — source, medium, date)
                    ↓
Layer 3: Contact summary is updated
  (stat_latest_source, medium, category synced from latest Touchpoint)
```

Each marketing or sales interaction creates a **separate, timestamped record** instead of overwriting a single property. The Contact's `stat_latest_source` is now a summary of the most recent Touchpoint — not the source of truth itself.

---

## 1. Object Schema

### Definition

| Attribute | Value |
|---|---|
| **Object Name** | Touchpoint |
| **Singular / Plural** | Touchpoint / Touchpoints |
| **Primary Display Property** | `name` |
| **Pipeline** | None |

### Properties (9 total)

| Property | Internal Name | Type | Required | Description |
|---|---|---|---|---|
| **Name** | `name` | string | Yes | Auto-generated: `{source} · {medium} — {YYYY-MM-DD}` |
| **Touchpoint Date** | `touchpoint_date` | datetime | Yes | When the interaction happened |
| **Source** | `source` | enumeration | Yes | One of 24 values (see Canonical Source List below) |
| **Category** | `category` | enumeration | Yes | One of 7 values — **always set as a locked pair with source** |
| **Medium** | `medium` | string | No | Platform/channel detail (Google, NAC, Artisan, etc.) |
| **Campaign ID** | `campaign_id` | string | No | UTM campaign, event date (MM.YYYY), or ad identifier |
| **Offer** | `offer` | string | No | Content asset consumed (case study name, webinar title) |
| **Offer Type** | `offer_type` | enumeration | No | Demo, Case Study, Webinar, Article, Calculator, Event, Learn More |
| **Trigger Type** | `trigger_type` | enumeration | Yes | What created this record (see below) |

### Trigger Type Values (5)

| Value | Fires When |
|---|---|
| `web_source` | HubSpot detects a new traffic source (`hs_latest_source` changes). Also covers form submissions and imports. |
| `event_attendance` | Hapily event stamp changes on the Contact |
| `sequence_enrollment` | Contact enrolled in a HubSpot sequence |
| `referral` | Rep sets `referral_type` on the Contact |
| `import` | Contact created via bulk import (Apollo, Salesforce, CSV) |

---

## 2. Canonical Source List

> ⚠️ **CRITICAL**: These 24 values MUST be identical across three dropdowns:
> - Touchpoint `source`
> - Contact `stat_latest_source`
> - Meeting `meeting_source` *(alignment deferred to Phase 3 — see §5)*
>
> Adding or renaming a value requires updating ALL THREE. The weekly audit script should validate this.

| Paid Digital | Owned Digital | Organic Digital | Direct Digital |
|---|---|---|---|
| Paid Search | Email | Organic Social | LLMs |
| Paid Social | | Organic Search | Press Release |
| Display | | | Web Link |
| Retargeting | | | Direct |
| Sponsored Email | | | Integration |
| Paid Review | | | |

| Field & Events | Sales | Partner & Affiliate |
|---|---|---|
| Hosted Event | List Import | Referral |
| Hosted Webinar | Meeting Attendee | Partner |
| Sponsored Event | Prospecting | Affiliate |
| Sponsored Webinar | | |

**Category** (7 values): Paid Digital, Owned Digital, Organic Digital, Direct Digital, Field & Events, Sales, Partner & Affiliate

**Source → Category is deterministic.** Every source maps to exactly one category. Workflows must always set both as a locked pair — never one without the other.

---

## 3. Associations

| From | To | Cardinality | When Set |
|---|---|---|---|
| **Touchpoint** | **Contact** | Many-to-One | At Touchpoint creation |
| **Touchpoint** | **Company** | Many-to-One | By "Touchpoint → Contact Sync" workflow (from Contact's primary company) |
| **Touchpoint** | **Deal** | Many-to-Many | By Deal workflow at deal creation (associates all Contact Touchpoints with the Deal) |

### Deal Attribution Flow

```
Contact accumulates Touchpoints over time
         ↓
Deal created → workflow associates Contact's Touchpoints with the Deal
         ↓
Rep views Touchpoint timeline on the Deal card
         ↓
Rep selects "Primary Driver" dropdown at close
```

---

## 4. Workflows (5 total)

### Overview

```
TOUCHPOINT CREATORS:
  1. "Web Source → Touchpoint"     ← hs_latest_source changes (includes imports)
  2. "Event → Touchpoint"          ← latest_hapily_event_name changes
  3. "Sequence → Touchpoint"       ← sequence enrollment
  4. "Referral → Touchpoint"       ← referral_type changes

SYNC:
  5. "Touchpoint → Contact Sync"   ← Touchpoint record created
```

### 1. Web Source → Touchpoint (Contact-based, custom code)

| Attribute | Value |
|---|---|
| **Trigger** | `hs_latest_source` property changes |
| **Custom Code** | Yes — simplified classifier |
| **Job** | Classify source/medium/category from HubSpot data + UTMs + referrer → create Touchpoint record → associate with Contact |

**Deduplication rule:** Before creating, check if a Touchpoint with the same `source` + `medium` already exists for this Contact within the last 24 hours. If yes, skip.

This is the main engine. It handles web visits, form submissions, paid clicks, organic traffic, direct visits, and imports — anything that causes HubSpot to update `hs_latest_source`.

### 2. Event → Touchpoint (Contact-based, no code)

| Attribute | Value |
|---|---|
| **Trigger** | `latest_hapily_event_name` property changes |
| **Actions** | Branch on event name: sponsored conference list → Sponsored Event/Webinar; else → Hosted Event/Webinar. Create Touchpoint. Set medium = event name, campaign_id = event date (MM.YYYY). |

**Requires:** `latest_hapily_event_name` and `latest_hapily_event_type` properties on Contact (set by existing Event workflow #9).

### 3. Sequence → Touchpoint (Contact-based, no code)

| Attribute | Value |
|---|---|
| **Trigger** | `hs_sequences_is_enrolled` becomes `true` |
| **Actions** | Create Touchpoint: source = Prospecting, category = Sales, medium = Sequence, campaign_id = sequence name (if available). |

### 4. Referral → Touchpoint (Contact-based, no code)

| Attribute | Value |
|---|---|
| **Trigger** | `referral_type` property value **changes** (not just "becomes known" — handles corrections) |
| **Actions** | Branch on `referral_type`: Customer → Referral; Employee → Referral; Partner → Partner; Affiliate → Affiliate. Set medium = Customer Referral / Employee Referral / Partner Referral / Affiliate. Set campaign_id = `referral_name`. |

**Requires:** `referral_type` (dropdown) and `referral_name` (text) properties on Contact.

### 5. Touchpoint → Contact Sync (Touchpoint-based, no code)

| Attribute | Value |
|---|---|
| **Trigger** | Touchpoint record created |
| **Actions** | See below |

**Actions:**
1. Check: Is this Touchpoint's `touchpoint_date` ≥ the Contact's `latest_touchpoint_date`?
   - **No** → Skip (a more recent Touchpoint already synced)
   - **Yes** → Continue:
2. Copy `source` → Contact `stat_latest_source`
3. Copy `category` → Contact `lead_source_category`
4. Copy `medium` → Contact `medium`
5. Copy `campaign_id` → Contact `campaign_id`
6. Copy `offer` → Contact `offer` (if not blank)
7. Copy `offer_type` → Contact `offer_type` (if not blank)
8. Set Contact `latest_touchpoint_date` = Touchpoint `touchpoint_date`
9. Associate Touchpoint with Contact's primary Company

**Why the timestamp guard matters:** If two Touchpoints are created in quick succession, workflow execution order isn't guaranteed. The timestamp check ensures the most recent Touchpoint always wins, regardless of processing order.

### Existing: Map Lead Source To Meeting Source (ID 103049203)

| Attribute | Value |
|---|---|
| **Trigger** | Meeting created and associated with Contact |
| **Actions** | Copy Contact's `stat_latest_source` → Meeting's `meeting_source` |
| **Status** | ✅ Active — keep as-is for now |

This workflow continues to work. With Touchpoints keeping `stat_latest_source` accurate, the meeting mapping becomes more reliable. The `meeting_source` dropdown alignment is deferred to Phase 3 (see §5).

### Needed: Deal → Touchpoint Association

| Attribute | Value |
|---|---|
| **Trigger** | Deal created |
| **Actions** | Find all Touchpoints associated with the Deal's primary Contact → associate them with the Deal |
| **Note** | Can also run at Disco Set (discovery stage change) to capture Touchpoints created between Deal creation and discovery |

---

## 5. Meeting Object

### Data Flow

```
Touchpoint → "Touchpoint → Contact Sync" → Contact stat_latest_source
                                                    │
Meeting created ── "Map Lead Source To Meeting" ────┘──→ meeting_source
```

- Meetings do **NOT** create Touchpoints (a meeting is a conversion, not a source)
- Exception: When a contact is CREATED because of a meeting (e.g., Grain), HubSpot sets `hs_latest_source = OFFLINE` + Grain vendor code. Workflow 1 classifies this as Meeting Attendee and creates a Touchpoint.

### `meeting_source` Dropdown Alignment — Deferred to Phase 3

The `meeting_source` dropdown currently has 18 values that don't match the 24-source taxonomy. Other processes depend on the current hard-coded values, so this change is deferred.

**Phase 3 action:** Replace the 18-value dropdown with the canonical 24 source values. Update any processes that reference the old values (workflows, reports, integrations). Once aligned, "Map Lead Source To Meeting Source" becomes a simple 1:1 copy.

### `hs_meeting_source` (Standard — Do Not Touch)

This is a different property. It tracks **how** the meeting was created (CRM UI, Integration, Meetings link). It's set automatically by HubSpot. Not related to attribution.

---

## 6. Lead Object

### Data Flow

```
Touchpoint → "Touchpoint → Contact Sync" → Contact stat_latest_source
                                                    │
                                           Lead reads from Contact:
                                             • contact_original_source
                                             • contact_attribution_changed
```

- **No** Touchpoint ↔ Lead association (Contact is the bridge)
- **No** Touchpoints created from Lead stage changes (pipeline stages are sales activity, not marketing source)
- The Lead's existing `contact_attribution_changed` timestamp fires when the Contact's attribution updates — no modification needed

---

## 7. New Properties

### On Contact (5 new)

| Property | Internal Name | Type | Purpose |
|---|---|---|---|
| `referral_type` | `referral_type` | Dropdown (Customer, Employee, Partner, Affiliate) | Rep-reported referral source |
| `referral_name` | `referral_name` | Single-line text | Name of the referrer |
| `latest_hapily_event_name` | `latest_hapily_event_name` | Single-line text | Set by Event workflow #9 |
| `latest_hapily_event_type` | `latest_hapily_event_type` | Dropdown (Conference, Webinar) | Set by Event workflow #9 |
| `latest_touchpoint_date` | `latest_touchpoint_date` | Datetime | Timestamp guard — set by "Touchpoint → Contact Sync" |

**Note:** `campaign_id` replaces the existing `latest_variant` property (same purpose, clearer name). Rename rather than create new.

### On Deal (1 new)

| Property | Internal Name | Type | Purpose |
|---|---|---|---|
| `primary_driver` | `primary_driver` | Dropdown (24 source values) | Rep selects the source that was the primary driver at close |

---

## 8. What Gets Retired (Phase 3)

### Properties

| Property | Object | Replaced By |
|---|---|---|
| `source_history` | Contact, Company, Deal | Touchpoint records |
| `latest_variant` | Contact | Renamed to `campaign_id` |
| `attribution_changed` | Contact | Touchpoint creation IS the event |
| `cc_source`, `cc_medium`, `cc_offer` | Contact | First Touchpoint record |
| `ac_source`, `ac_medium` | Company | Touchpoint records on Company |
| `oc_source`, `oc_medium`, `oc_variant` | Contact | Touchpoint at discovery stage |

### Workflows

| Workflow | Replaced By |
|---|---|
| Attribution Operator (v1) | "Web Source → Touchpoint" |
| First Touch Runner | First Touchpoint IS the first touch |
| Last Touch Runner | Latest Touchpoint IS the last touch |
| Source History Sync (Append-Only Bridge) | "Touchpoint → Contact Sync" handles Company via associations |

---

## 9. Hardening Rules

These rules prevent the system from being broken by someone unfamiliar with the process.

### Rule 1: Source taxonomy is locked across 3 dropdowns

The 24 source values must be identical on Touchpoint `source`, Contact `stat_latest_source`, and Meeting `meeting_source` (after Phase 3 alignment). Adding or renaming a value requires updating all three. The weekly audit script validates this.

### Rule 2: Source and Category are always set as a locked pair

Every workflow that creates a Touchpoint must set BOTH `source` AND `category`. No path should set one without the other. Category is deterministic from source — it is never set independently.

### Rule 3: Touchpoints are immutable

Once created, a Touchpoint record should never be edited. If a Touchpoint was misclassified, create a corrected one and delete the bad one. Set property permissions so non-admin users cannot edit Touchpoint records.

### Rule 4: One Touchpoint per source per day per contact

The deduplication rule in Workflow 1 ("Web Source → Touchpoint") prevents duplicates from rapid-fire `hs_latest_source` changes within a session. Deterministic workflows (2-4) use HubSpot's "only enroll if not previously enrolled" or property-change triggers that naturally prevent duplicates.

### Rule 5: Timestamp guard on sync

"Touchpoint → Contact Sync" only updates the Contact if the Touchpoint's date is ≥ the Contact's `latest_touchpoint_date`. This prevents an older Touchpoint from overwriting a newer one due to workflow execution order.

### Rule 6: Company association reflects the company at the time

If a Contact changes companies, historical Touchpoints remain associated with the original company. This is correct — the Touchpoint happened while the contact was at that company. Do not re-associate.

---

## 10. Migration Plan

### Phase 1: Build (Week 1)

1. Create Touchpoint custom object with 9 properties
2. Create 5 new Contact properties + 1 Deal property
3. Build Workflows 2-4 (Event, Sequence, Referral → Touchpoint) — no custom code
4. Build Workflow 5 (Touchpoint → Contact Sync)
5. Update Event workflow #9 to set `latest_hapily_event_name` and `latest_hapily_event_type`
6. Build Deal → Touchpoint association workflow

**Done when:** All workflows active, Touchpoints being created for events/sequences/referrals.

### Phase 2: Classify (Week 2)

7. Deploy Workflow 1 (Web Source → Touchpoint) with simplified classifier
8. Test with new contacts only — monitor for deduplication issues
9. Backfill existing contacts: create 2 Touchpoints per contact from `stat_original_source` (first touch) and `stat_latest_source` (last known touch)

**Done when:** All new and existing contacts have Touchpoints. `stat_latest_source` is being set from Touchpoints, not the old attribution operator.

### Phase 3: Migrate (Week 3+)

10. Disable legacy workflows (Attribution Operator v1, First Touch Runner, Last Touch Runner, Bridge)
11. Align `meeting_source` dropdown with 24-source taxonomy (coordinate with dependent processes)
12. Archive legacy properties (`source_history`, `attribution_changed`, lifecycle-stamped fields)
13. Update dashboards and reports to use Touchpoint data
