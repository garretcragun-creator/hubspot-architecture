# Discovery Meeting Attribution — TIMWOODS Analysis & Slack App ROI

> **Scope:** The current path from “HubSpot discovery meeting created” → rep selects **meeting source** (where the meeting was set) → later, rep selects **meeting outcome** (what happened). Today this runs through Zapier + 2 Slack workflows + Google Sheet + more Zaps. This doc assesses waste and whether a single Slack Block Kit app is worth the build.

---

## 1. Current Flow (Simplified)

```
HubSpot: Meeting created (Discovery Call or "Intro" in title)
    ↓
Zap: Filter → Webhook
    ↓
Slack Workflow 1: "Meeting source" — dropdown to rep → writes to Google Sheet (company ID, meeting ID, source)
    ↓
Zap: Reorganize sheet row → map source to Meeting + Company in HubSpot
    ↓
Zap: If meeting >30 days out → Delay until 30 days out → Delay 30 days → Webhook
    ↓
Slack Workflow 2: "Meeting outcome" — form to rep (outcome dropdown) → meeting ID, company ID → map outcome to Meeting
```

**Why it’s messy:** Slack Workflow Builder + Zapier Slack integration can’t do rich forms, can’t reliably “wait until meeting ends,” and can’t write straight to HubSpot. So you get: extra systems (Sheet), duplicate prompts (source now, outcome later), and timing hacks (31-day Zap limit → “delay until 30 days out, then delay 30 days”).

---

## 2. TIMWOODS — Where the Waste Shows Up

| Waste | What’s happening | Impact |
|-------|------------------|--------|
| **Transport** | Data moves: HubSpot → Zap → Webhook → Slack → **Google Sheet** → Zapier → HubSpot. Same logical action (rep picks source) touches 5+ systems. | More failure points; harder to debug; Sheet is an unnecessary waypoint. |
| **Inventory** | Rows in a Google Sheet exist only to carry (company ID, meeting ID, source) from Slack to HubSpot. No other use. | Stale/orphan rows; no single source of truth; audit confusion. |
| **Motion** | Rep gets **two** separate Slack experiences (source dropdown vs outcome form), at **two** different times, with different UIs. Context switch each time. | Cognitive load; “which Slack message was for what?”; more clicks and reads. |
| **Waiting** | (1) Zap can’t delay >31 days → you “delay until 30 days out” then “delay 30 days” so outcome prompt is approximate, not “when meeting actually ended.” (2) Rep may respond to Slack hours/days later. (3) Outcome workflow is time-based, not event-based. | Outcome prompt can fire before or long after the meeting; reps learn to ignore or forget. |
| **Overprocessing** | Zapier “reorganizes” the dropdown input before mapping. Meeting source uses **18 values** (meeting_source) while attribution taxonomy is **24 values** (stat_latest_source) — mapping layer adds complexity and inconsistency (see hs-schema.md). | Extra steps; alignment issues already called out in attribution audit. |
| **Overproduction** | Intermediate artifacts: Sheet row per meeting, multiple Zap steps, two Slack workflows. Only the final state (Meeting + Company in HubSpot) is needed. | More to maintain, more to break. |
| **Defects** | (1) **Taxonomy mismatch:** meeting_source ≠ stat_latest_source. (2) **Timing:** “Meeting ended” is approximated by “30 days after book” for far-out meetings. (3) **Wrong record:** Rep could pick wrong meeting/company in a form. (4) **Stale outcomes:** Weekly audit already flags “Stale Meetings (Demo/Discovery)” with no outcome — evidence of drop-off. | Bad attribution data; incomplete outcome data; reporting noise. |
| **Skills** | Rep must understand: “First message = source, second message (much later) = outcome,” and when each appears. No single task “complete this meeting: source + outcome.” | Training burden; inconsistent behavior. |

---

## 3. Rough Quantification (You Can Replace With Your Numbers)

### Time

- **Per meeting (rep):**  
  - Today: 2 separate Slack interactions, different flows, possible lookup (which meeting?). Estimate **2–4 min** per meeting (open, read, choose, submit) × 2 ≈ **4–8 min**.  
  - With one Block Kit app: **one** message with source + outcome (or source now, outcome later in same thread). Estimate **1–3 min** per meeting.
- **Savings per meeting:** ~2–5 min rep time.
- **If you have 20 discovery meetings/month:** ~40–100 min/month rep time (and that’s only for the ones that get both prompts; many may never get the outcome prompt at the right time).
- **Ops/admin:** Debugging “why didn’t this meeting get source?” or “why did outcome Zap fire too early?” + Sheet cleanup + Zap maintenance. Estimate **1–3 hours/month** depending on volume and issues.

### Data integrity

- **Stale / missing outcomes:** Your weekly audit already has a check for demo/discovery meetings with no outcome. That’s a direct signal of outcome-flow failure (timing, rep didn’t respond, wrong Slack workflow).
- **Source:** Any meeting that never gets a source response, or gets the wrong value because of the 18→24 mapping or rep confusion, degrades `meeting_source` and downstream company attribution.
- **Ranges (illustrative):**  
  - If **10–25%** of discovery meetings lack source or outcome, that’s a material attribution and pipeline hygiene gap.  
  - You can measure: % of discovery meetings (last 90 days) with `meeting_source` set, and % with `hs_meeting_outcome` set; compare to total discovery meetings created.

---

## 4. What a Single Slack Block Kit App Would Replace

| Current piece | With Block Kit app |
|---------------|--------------------|
| Zap: meeting created → webhook | Keep **one** webhook from HubSpot (or Zap) that sends “new discovery meeting” to your app. |
| Slack Workflow 1 (source dropdown) | **One** Block Kit message: e.g. “Discovery meeting: [title] — Where was it set?” with a **single select** using your **canonical** source list (e.g. stat_latest_source values). |
| Google Sheet | **Removed.** App receives submission → calls HubSpot API to set `meeting_source` (and company if you want) directly. |
| Zap that “reorganizes” and maps to HubSpot | **Removed.** App does the mapping once, server-side. |
| Zap branch “if >30 days out” + double delay | Replace with **scheduling in your app**: when meeting start time is known, schedule “send outcome prompt” for e.g. meeting end + 15 min (or next morning). No 31-day Zap limit. |
| Slack Workflow 2 (outcome form) | **Same** Block Kit thread (or one follow-up message): “How did it go?” with outcome dropdown (e.g. COMPLETED, NO_SHOW, RESCHEDULED, etc.). |
| Second Zap writing outcome to HubSpot | **Removed.** App writes `hs_meeting_outcome` (and any other fields) via API. |

**Single surface for the rep:** One Slack message (or one thread) per meeting: “Set source” now, “Set outcome” when you send the follow-up. No Sheet, no second workflow, no reorganize Zap.

---

## 5. Is It Worth the Development Effort?

### When it’s **worth it**

- You have **≥15–20 discovery meetings per month** (so rep time + ops time adds up).
- You care about **attribution quality** (e.g. stat_latest_source / meeting_source alignment) and **outcome completeness** (your stale-meeting check suggests you do).
- You’re already feeling **TIMWOODS** pain: Sheet, two Slack flows, Zap timing, and mapping inconsistencies.
- You can afford **one** small backend (e.g. Node/Python) that:  
  - Receives webhooks (meeting created, optional: “meeting ended” if you add that later),  
  - Sends Block Kit messages and handles submissions,  
  - Calls HubSpot APIs to set meeting (and optionally company) properties.

**Rough effort:**  
- **Slack app (Block Kit + shortcuts or bot):** 1–2 days (auth, one “new meeting” message, source dropdown, outcome message/dropdown, submission handlers).  
- **HubSpot API integration:** ~0.5–1 day (get meeting/company IDs from webhook or HubSpot, PATCH meeting/company).  
- **Scheduling (outcome prompt after meeting end):** ~0.5–1 day (e.g. in-memory scheduler, or queue + worker, or serverless cron).  
- **Align dropdown with stat_latest_source:** use the same 23/24 values so no extra mapping.  

Total in the **3–5 day** range for a focused dev, plus testing and rollout.

### When it might **not** be worth it

- Discovery volume is very low (**&lt;10/month**) and attribution/outcome quality is “nice to have.”
- No one can own the app (build + run + fix when Slack/HubSpot change).
- You’re about to change CRM or meeting tool; then a bigger redesign may be better than optimizing this stack.

---

## 6. Recommendation

- **Yes, it’s worth it** if you have meaningful discovery volume and care about attribution and outcome data. The current design introduces real **transport**, **motion**, **waiting**, **overprocessing**, and **defects** (TIMWOODS), and your weekly audit already surfaces **stale meeting outcomes**.
- A **single Slack Block Kit app** that:
  - Sends one message (or thread) per discovery meeting with **source** (canonical taxonomy) and **outcome** (at the right time, not tied to Zap’s 31-day limit),
  - Writes **directly to HubSpot** (meeting + company),
  - **Drops** the Google Sheet and the “reorganize” Zap,
  will reduce rep time, improve data integrity, and simplify ops. The build is on the order of **3–5 days** for a small, maintainable service.

**Next step:** Run the weekly audit and pull a report of discovery meetings in the last 90 days with missing `meeting_source` or `hs_meeting_outcome`. That number is your baseline to improve and to justify the app. If you want, we can turn this into a short technical spec (webhook payload, Block Kit JSON sketch, and HubSpot PATCH calls) for the Slack app.
