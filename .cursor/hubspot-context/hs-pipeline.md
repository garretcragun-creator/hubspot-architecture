# HubSpot Pipelines Reference

> Auto-generated on 2026-02-11T21:09:23.117Z from portal API.

## Deal Pipelines

### 🔀 New Customer

| Attribute | Value |
|---|---|
| **Pipeline ID** | `8366c2b0-71b4-40e3-929b-31c05ddd68b4` |
| **Stages** | 9 |
| **Created** | 2023-12-05T21:49:59.471Z |
| **Updated** | 2025-08-15T21:43:59.702Z |

#### Flow

```
  ○ Opportunity [1%]
  │
  ▼
  ○ Discovery [25%]
  │
  ▼
  ○ Business Consideration [50%]
  │
  ▼
  ○ Negotiation/Proposal Ready [80%]
  │
  ▼
  ✅ Closed Won - Onboarding [100%]
  ✅ Closed Won - Engagement [100%]
  ❌ Closed Lost [0%]
  ❌ Closed Lost - Churn [0%]
  ❌ Nurture (12 mo+) [0%]
```

#### Stage Details

| # | Stage Name | Internal ID | Win Probability | Display Order |
|---|---|---|---|---|
| 1 | Opportunity | `939274936` | 0.01 | 0 |
| 2 | Discovery | `dd5c3cc4-11e0-4c4d-b53b-8042e0df7ca8` | 0.25 | 1 |
| 3 | Business Consideration | `5fa97649-4953-4304-931d-32c3ff1aa342` | 0.5 | 2 |
| 4 | Negotiation/Proposal Ready | `9154a8c3-526e-47eb-990c-3d35849b7a54` | 0.8 | 3 |
| 5 | Closed Won - Onboarding | `77f2e34f-14fa-409c-9850-692b7c2c7321` | 1.0 | 4 |
| 6 | Closed Won - Engagement | `81d05856-d5e1-4929-90ba-89134bf3a674` | 1.0 | 5 |
| 7 | Closed Lost | `6f75eed0-c3f8-49f9-a9af-84791515bb90` | 0.0 | 6 |
| 8 | Closed Lost - Churn | `a27a3afb-a313-4900-8ce5-67bf1806b561` | 0.0 | 7 |
| 9 | Nurture (12 mo+) | `146514244` | 0.0 | 8 |

### 🔀 Expansion

| Attribute | Value |
|---|---|
| **Pipeline ID** | `634917385` |
| **Stages** | 8 |
| **Created** | 2024-10-22T19:36:20.706Z |
| **Updated** | 2025-07-01T02:39:02.832Z |

#### Flow

```
  ○ Expansion Opportunity [1%]
  │
  ▼
  ○ Discovery [60%]
  │
  ▼
  ○ Business Consideration [70%]
  │
  ▼
  ○ Negotiation/Proposal Ready [80%]
  │
  ▼
  ✅ Closed Won - Onboarding [100%]
  ✅ Closed Won - Engagement [100%]
  ❌ Closed Lost [0%]
  ❌ Closed Lost - Churn [0%]
```

#### Stage Details

| # | Stage Name | Internal ID | Win Probability | Display Order |
|---|---|---|---|---|
| 1 | Expansion Opportunity | `937266517` | 0.01 | 0 |
| 2 | Discovery | `937266518` | 0.6 | 1 |
| 3 | Business Consideration | `937266521` | 0.7 | 2 |
| 4 | Negotiation/Proposal Ready | `937266519` | 0.8 | 3 |
| 5 | Closed Won - Onboarding | `937266522` | 1.0 | 4 |
| 6 | Closed Won - Engagement | `1025177200` | 1.0 | 5 |
| 7 | Closed Lost | `937266523` | 0.0 | 6 |
| 8 | Closed Lost - Churn | `1100624386` | 0.0 | 7 |

### 🔀 Renewal

| Attribute | Value |
|---|---|
| **Pipeline ID** | `735605689` |
| **Stages** | 3 |
| **Created** | 2025-05-12T20:15:23.148Z |
| **Updated** | 2025-05-12T20:18:05.150Z |

#### Flow

```
  ○ Negotiation [70%]
  │
  ▼
  ✅ Closed Won [100%]
  ❌ Closed Lost [0%]
```

#### Stage Details

| # | Stage Name | Internal ID | Win Probability | Display Order |
|---|---|---|---|---|
| 1 | Negotiation | `1071379754` | 0.7 | 0 |
| 2 | Closed Won | `1071379755` | 1.0 | 1 |
| 3 | Closed Lost | `1071379756` | 0.0 | 2 |

## Ticket Pipelines

> ⚠️ **Access Denied** — Ticket pipeline data could not be retrieved. The API token may lack `tickets-read` scope.

## Loss Analysis: Closed Lost Reasons

The `closed_lost_reason` property has the following configured values:

| # | Label | Internal Value |
|---|---|---|
| 1 | Value Misalignment | `Pricing` |
| 2 | No Urgent Pain | `Bad Timing` |
| 3 | Competitor | `Competitor` |
| 4 | Other | `Other` |
| 5 | Not At Power | `Not At Power` |
| 6 | Blocked By Stakeholder | `Blocked By Stakeholder` |
| 7 | Champion Left / Reorg | `Champion Left / Reorg` |
| 8 | Product Gaps | `Product Gaps` |
| 9 | Integration Limitation | `Integration Limitation` |
| 10 | Building In-House | `Building In-House` |
| 11 | Blocked By Legal | `Blocked By Legal` |
| 12 | Blocked By Procurement | `Blocked By Procurement` |
| 13 | External Factors | `External Factors` |

> **Insight:** 13 loss reasons configured. This suggests a mature sales process with structured loss tracking.

## Quick Reference: Stage IDs for API Usage

Use these IDs when creating or updating deals via API:

| Pipeline | Stage | Stage ID |
|---|---|---|
| New Customer | Opportunity | `939274936` |
| New Customer | Discovery | `dd5c3cc4-11e0-4c4d-b53b-8042e0df7ca8` |
| New Customer | Business Consideration | `5fa97649-4953-4304-931d-32c3ff1aa342` |
| New Customer | Negotiation/Proposal Ready | `9154a8c3-526e-47eb-990c-3d35849b7a54` |
| New Customer | Closed Won - Onboarding | `77f2e34f-14fa-409c-9850-692b7c2c7321` |
| New Customer | Closed Won - Engagement | `81d05856-d5e1-4929-90ba-89134bf3a674` |
| New Customer | Closed Lost | `6f75eed0-c3f8-49f9-a9af-84791515bb90` |
| New Customer | Closed Lost - Churn | `a27a3afb-a313-4900-8ce5-67bf1806b561` |
| New Customer | Nurture (12 mo+) | `146514244` |
| Expansion | Expansion Opportunity | `937266517` |
| Expansion | Discovery | `937266518` |
| Expansion | Business Consideration | `937266521` |
| Expansion | Negotiation/Proposal Ready | `937266519` |
| Expansion | Closed Won - Onboarding | `937266522` |
| Expansion | Closed Won - Engagement | `1025177200` |
| Expansion | Closed Lost | `937266523` |
| Expansion | Closed Lost - Churn | `1100624386` |
| Renewal | Negotiation | `1071379754` |
| Renewal | Closed Won | `1071379755` |
| Renewal | Closed Lost | `1071379756` |

