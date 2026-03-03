# Build: Discovery Meeting Attribution — Inferred Source + Slack Confirmation

Use this prompt with Claude Code (or another coding agent) to build the Discovery Meeting Attribution flow: when a **discovery meeting** is created, the app **infers** the likely attribution source from contact/company context, sends a Slack message to the **HubSpot user who created the meeting** asking them to confirm or change it (“Yes” or a dropdown), and updates the meeting attribution source. If the rep doesn’t respond within **1 hour**, the app sets the meeting source to the inferred value (or the more likely of **Conference** or **Prospecting**).

---

## Context to load before building

1. **Product/process:** `docs/meeting-attribution-timwoods-and-slack-app.md` — why we’re building this and what it replaces.
2. **HubSpot schema:** `.cursor/hubspot-context/hs-schema.md` — **Meetings** (custom `meeting_source`, standard `hubspot_owner_id`, `hs_meeting_title`, `hs_meeting_start_time`, `hs_meeting_end_time`), **Contacts** (attribution and engagement properties below), **Companies**.
3. **Canonical source taxonomy:** `.cursor/hubspot-context/hs-attribution-audit.md` — **Full Attribution Taxonomy** and **Quick-Reference: Source → Category**. The **Source** column (e.g. Paid Search, Prospecting, Sponsored Event, Hosted Webinar) is the **only** list to use for attribution. There are **23 sources**; use them exactly for dropdown options and for writing to `meeting_source`. Do **not** use the old 18-value meeting_source list from the schema; align the app (and optionally HubSpot’s `meeting_source` property) to these 23 values.
4. **Existing patterns:** This repo uses **Node.js** and `.env` for secrets. Use the same style as `scripts/weekly-audit.js` or `scripts/conference-match.js`.

---

## What you are building

### 1. Webhook: discovery meeting created

- **Endpoint:** `POST /webhook/meeting-created`.
- **Input (JSON):** Caller (Zapier or HubSpot workflow) sends at least:
  - `meetingId` (HubSpot meeting object ID) — **required**
  - Optionally: `companyId`, `contactId`, `meetingTitle`, `meetingStartTime`, `meetingEndTime`, `ownerId` (HubSpot owner ID), `ownerEmail`.
- **Validation:** Require `meetingId`. If `contactId`, `companyId`, or owner is missing, **fetch from HubSpot** using the meeting object and its associations (see §4).
- **Idempotency:** If the same `meetingId` is sent again within ~5 minutes, do not send a second Slack message; optionally update state and return 200.

### 2. Inference: “Where did this meeting likely come from?”

Before sending Slack, the app must **infer** a likely attribution source using contact (and optionally company) context. Use **only** the **23 canonical source values** from `hs-attribution-audit.md` (e.g. Prospecting, Sponsored Event, Hosted Webinar, Paid Search, Referral, …).

**Data to use (HubSpot APIs):**

- **Meeting → Contact / Company:** From the meeting, get associated contact(s) and company (e.g. `GET /crm/v4/objects/meetings/{meetingId}/associations/contacts` and `.../associations/companies`). Use the **primary** or **first** contact if multiple.
- **Contact properties** (fetch with `GET /crm/v3/objects/contacts/{contactId}?properties=...`):
  - **Attribution:** `stat_latest_source`, `stat_original_source` — strongest signal; if set, consider as candidate.
  - **Conference:** `conference_interactions` (checkbox) — if any value is set, strong signal toward **Sponsored Event** or **Hosted Event** (use your rules: e.g. NAC/MGMA/AGMA → Sponsored Event; client/industry summit → Hosted Event).
  - **Last meeting booking (UTM):** `engagements_last_meeting_booked_source`, `engagements_last_meeting_booked_medium`, `engagements_last_meeting_booked_campaign` — if the meeting was just booked via a link, these can indicate channel (map to canonical source if possible).
  - **Traffic / website:** `hs_latest_source`, `hs_analytics_source` — latest/first known traffic source; map to Organic Search, Paid Search, etc. per attribution taxonomy.
  - **Source history:** `latest_source_history` (checkbox) — list of sources that influenced the contact; consider most recent or most relevant.
- **Engagements / sales activity (optional but recommended):** Use HubSpot’s engagements or timeline API to get **recent** activities (calls, emails, meetings, notes) for the contact, **sorted by date**. Examples:
  - **Calls API:** `GET /crm/v3/objects/calls` with search/association to contact, or use engagements v1 if still available.
  - **Timeline:** If you have access to timeline/activity, use “recent activities” for the contact.  
  Logic: if the **most recent touchpoint** (e.g. last 7–14 days) is a **sales sequence**, **cold call**, or **outbound email**, weight toward **Prospecting**. If it’s a **webinar** or **event** registration/attendance, weight toward **Hosted Webinar** or **Hosted Event** / **Sponsored Event**.

**Inference rules (implement in code):**

1. **Order touchpoints/signals by date** (most recent first). Prefer **recent** over old (e.g. last 30–90 days).
2. **Score or rank** signals: e.g. `stat_latest_source` set → high weight; `conference_interactions` set → high weight for event; recent sequence/call → Prospecting; UTM from meeting link → map to source.
3. **If one clear winner** → use that as **inferred source**.
4. **If ambiguous or no data** → default to **Prospecting** or **Sponsored Event** (e.g. “Conference”). Document the rule (e.g. “default to Prospecting unless conference_interactions is set, then Sponsored Event”). Prefer **Conference** (Sponsored Event) when the contact has conference interactions; otherwise **Prospecting**.

**Output:** A single **inferred source** value (one of the 23 canonical labels). Store it with the meeting so the Slack message and the 1-hour fallback can use it.

### 3. Resolve meeting owner → Slack user

- The **meeting** has `hubspot_owner_id` (owner of the meeting record). Fetch owner email: `GET /crm/v3/owners` or `/owners/v2/owners` and find the owner by ID; use `email`.
- Use Slack’s `users.lookupByEmail` with that email to get **Slack user ID** so you can open a DM. If lookup fails, log and optionally post to a fallback channel or skip Slack (and still set meeting source after 1 hour).

### 4. Slack message (Block Kit)

**Copy:** “Congrats on setting a disco call. It looks like this likely came from **{inferred_source}**. Is that accurate?”

**Blocks:**

1. **Section** (or **mrkdwn**) with that text; substitute `{inferred_source}` with the inferred value (e.g. “Prospecting” or “Sponsored Event”).
2. **Actions** block with:
   - **Button:** “Yes” — `action_id` e.g. `meeting_source_confirm_yes`. Value or metadata must include `meetingId`, `companyId` (if used), and the **inferred source** value so the handler can set `meeting_source` to that.
   - **Static select (dropdown):** “Something else” or “Other” — `action_id` e.g. `meeting_source_select_other`. Options = **all 23 canonical source values** (so the rep can pick any). Option values must be the **internal value** HubSpot expects for `meeting_source` (if different from label, map in code; see “Property names” below).

**Submission:**

- **Yes:** On `meeting_source_confirm_yes`, PATCH the meeting: `properties.meeting_source` = inferred source. Also PATCH the associated company `stat_latest_source` and **`discovery_source`** ("Discovery Source") with same value. Update Slack message to “Source set: {inferred_source}” and remove buttons (or acknowledge in thread).
- **Dropdown:** On `meeting_source_select_other`, PATCH the meeting and the associated company (`stat_latest_source` and **`discovery_source`**) with the **selected** value. Update message to “Source set: {selected_value}”.

**1-hour fallback:** When the webhook runs, schedule a job for **current time + 1 hour**. When it runs:
- If the rep **has already** responded (Yes or dropdown), do nothing.
- If **no response yet**, set `meeting_source` to the **inferred source** (or, if you documented a tie-break, the more likely of **Sponsored Event** or **Prospecting**). **Also set the company's `stat_latest_source` and `discovery_source`** to that same value. Optionally update the Slack message to “We set the meeting source to {value} based on the best guess. You can still change it in HubSpot.”

Store “pending” state per meeting (e.g. `meetingId` → `{ inferredSource, messageTs, channelId, respondedAt }`) in memory or a small store; clear or set `respondedAt` when the rep clicks Yes or the dropdown. The 1-hour job checks `respondedAt` before PATCHing.

### 5. HubSpot API details

- **Base URL:** `https://api.hubapi.com`
- **Auth:** `Authorization: Bearer <HUBSPOT_ACCESS_TOKEN>` (Private App token).
- **Meetings:** Object type `meetings`. **Custom** property for attribution: **`meeting_source`** (enumeration). **Standard** properties: `hs_meeting_title`, `hs_meeting_start_time`, `hs_meeting_end_time`, **`hubspot_owner_id`**.
- **Contacts:** `stat_latest_source`, `stat_original_source`, `conference_interactions`, `engagements_last_meeting_booked_source`, `engagements_last_meeting_booked_medium`, `engagements_last_meeting_booked_campaign`, `latest_source_history`, `hs_latest_source`, `hs_analytics_source`.
- **Associations:** `GET /crm/v4/objects/meetings/{meetingId}/associations/contacts`, `.../associations/companies`.
- **Owners:** `GET /crm/v3/owners` (or v2) to get owner `email` from `hubspot_owner_id`.
- **PATCH meeting:** `PATCH /crm/v3/objects/meetings/{meetingId}` with body `{ "properties": { "meeting_source": "<canonical_value>" } }`.
- **PATCH company (required when company is associated):** Set both **`stat_latest_source`** and **`discovery_source`** (company property label: "Discovery Source") to the same canonical value. Example: `PATCH /crm/v3/objects/companies/{companyId}` with `{ "properties": { "stat_latest_source": "<value>", "discovery_source": "<value>" } }`. If the internal name for "Discovery Source" in your portal is different (e.g. `discovery_source`), confirm in HubSpot Settings → Companies → Properties.

### 6. Property names and values

- **`meeting_source`** (meetings): Use the **23 canonical Source labels** from the attribution audit. HubSpot enum **internal values** may be lowercase or different (e.g. “Paid Search” vs “paid_search”). Check **Settings → Data Management → Objects → Meetings → meeting_source** for the exact option values. If the property still has the old 18 options, **document** that the portal admin should add the 23 options (or the app sends the value and HubSpot may accept it if you’ve added options); otherwise map the 23 labels to whatever internal values exist.
- **`stat_latest_source`** (contacts/companies): Same 23 sources. Use the same internal value as on meetings when copying to company.
- **`discovery_source`** (companies): Company property **"Discovery Source"**. Set this whenever you set meeting attribution (Yes, dropdown, or 1-hour fallback), using the same canonical value as `meeting_source` and `stat_latest_source`. If your portal uses a different internal name, check Settings → Data Management → Companies.
- **Do not** use `hs_meeting_source` for attribution — that’s the **technical** “how the meeting was created” (e.g. MEETINGS_PUBLIC, CRM_UI). Attribution is **only** `meeting_source` (custom).

### 7. Things to watch out for

- **Rate limits:** HubSpot has rate limits; batch property requests when possible; don’t loop per-engagement in a tight loop.
- **Engagements API:** HubSpot’s v1 engagements API may be deprecated or limited; prefer crm/v3 objects (calls, emails, etc.) and associations to get recent activity if available.
- **conference_interactions:** This is a **multi-select checkbox**; any value means “had conference interaction” — use it as a strong signal for event-based source (Sponsored Event / Hosted Event).
- **Missing contact:** If the meeting has no associated contact, run inference on **company** only (company’s `stat_latest_source`, etc.) or default to Prospecting/Sponsored Event.
- **Slack message update:** After the rep clicks, **update** the original message (e.g. `chat.update`) so the buttons disappear and the message shows the result; avoid duplicate updates.
- **1-hour scheduler:** Use a persistent store (file, SQLite, or Redis) if the process may restart; otherwise in-memory is fine for a single-instance deployment. Run a tick every 1–5 minutes to process “due” jobs.

### 8. Design recommendations

- **Single message:** One Slack message per discovery meeting: congrats + inferred source + “Yes” + “Other” dropdown. No separate “outcome” flow in this prompt (that can be a follow-up).
- **Dropdown:** Show all 23 options in the “Something else” dropdown so the rep doesn’t have to remember; group by category in the audit doc if the UI allows (e.g. “Sales”, “Field & Events”) for readability.
- **Inference transparency:** Optionally include in the Slack message a short line like “Based on: contact source + conference” so the rep understands why you inferred that (helps trust and corrections).
- **Defaults:** Document clearly: “When inference is ambiguous, we default to Sponsored Event if `conference_interactions` is set, else Prospecting.”
- **Errors:** If HubSpot PATCH fails, log and optionally notify (e.g. Slack to ops channel or to the rep) and retry once.

### 9. Project layout and run

- **Directory:** `meeting-attribution-app/` (Node.js).
- **.env:** `HUBSPOT_ACCESS_TOKEN`, `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`; optional `PORT`, `SLACK_OPS_CHANNEL_ID`.
- **README:** Describe webhook payload, inference rules, Slack setup (scopes, events, Interactivity), and how to run/deploy (local + HTTPS for Slack).

---

## Acceptance criteria

- [ ] Webhook accepts `meetingId`; fetches meeting, associations (contact, company), and owner; infers source from contact (and company) context; resolves owner to Slack user; sends one Slack message with inferred source, “Yes” button, and “Other” dropdown (23 sources).
- [ ] “Yes” sets `meeting_source` and company `stat_latest_source` and `discovery_source` ("Discovery Source") to inferred source; dropdown sets all three to selected source; Slack message is updated after action.
- [ ] 1-hour delayed job: if no response, set `meeting_source` and company **`stat_latest_source`** and **`discovery_source`** to inferred source (or Prospecting/Sponsored Event per rules); optionally update Slack message.
- [ ] All source values are from the **23-value canonical taxonomy** in `hs-attribution-audit.md`; property names `meeting_source`, `stat_latest_source`, and company **`discovery_source`** ("Discovery Source") used correctly; no use of `hs_meeting_source` for attribution.
- [ ] Idempotency for duplicate webhooks; Slack request verification (signing secret); README with setup and payload.

---

## Copy-paste prompt (for Claude Code)

```
Build the Discovery Meeting Attribution app as specified in docs/meeting-attribution-build-prompt-inferred.md.

Flow:
1. POST /webhook/meeting-created receives meetingId (required). Fetch meeting, associations (contact, company), and owner from HubSpot.
2. Infer attribution source from contact context: stat_latest_source, stat_original_source, conference_interactions, engagements_last_meeting_booked_*, hs_latest_source, latest_source_history, and recent sales activity/touchpoints ordered by date. If ambiguous, default to Prospecting or Sponsored Event (Conference); prefer Sponsored Event when conference_interactions is set.
3. Resolve meeting owner (hubspot_owner_id) to Slack user via owners API + users.lookupByEmail. DM the owner with Block Kit: “Congrats on setting a disco call. It looks like this likely came from {inferred_source}. Is that accurate?” — “Yes” button + “Other” dropdown with all 23 canonical source values from hs-attribution-audit.md.
4. On “Yes”: PATCH meeting meeting_source and company stat_latest_source and discovery_source ("Discovery Source") to inferred value. On dropdown selection: PATCH meeting and company (stat_latest_source + discovery_source) to selected value. Update Slack message after action.
5. Schedule a 1-hour job; if rep has not responded, set meeting_source and company stat_latest_source + discovery_source to inferred (or Conference/Prospecting per rules) and optionally update Slack.

Use property names: meeting_source (meetings); stat_latest_source and discovery_source (companies). Confirm "Discovery Source" internal name in HubSpot (e.g. discovery_source) if needed. Handle missing contact/owner, Slack lookup failures, and idempotency. Put app in meeting-attribution-app/, Node.js, .env for HUBSPOT_ACCESS_TOKEN, SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET. README with webhook contract, inference rules, and run/deploy instructions.
```

---

*End of prompt*
