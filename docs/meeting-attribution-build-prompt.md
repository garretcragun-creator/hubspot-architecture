# Build: Discovery Meeting Attribution — Slack Block Kit App + Backend

Use this prompt with Claude Code (or another coding agent) to implement the full Discovery Meeting Attribution flow: a small backend that receives webhooks, sends Slack Block Kit messages for **meeting source** and **meeting outcome**, and writes directly to HubSpot. No Google Sheet, no Zapier reorganize step, no 31-day delay workaround.

---

## Context to load before building

1. **Product/process doc:** `docs/meeting-attribution-timwoods-and-slack-app.md` in this repo — explains current flow, TIMWOODS waste, and what this app replaces.
2. **HubSpot schema (meetings & attribution):** `.cursor/hubspot-context/hs-schema.md` — sections **Meetings** and **attribution_properties**.
3. **Canonical source taxonomy:** `.cursor/hubspot-context/hs-attribution-audit.md` — **Full Attribution Taxonomy** and **Quick-Reference: Source → Category**. Use the **Source** column (e.g. Paid Search, Prospecting, Meeting Attendee) as the single canonical list for the meeting source dropdown. The meeting object’s custom property is `meeting_source` (attribution); the company should also receive the same value (e.g. copy to `stat_latest_source` or a meeting-attribution field per your audit).
4. **Existing scripts:** This repo uses **Node.js** and `.env` for secrets (e.g. `HUBSPOT_ACCESS_TOKEN`). Prefer the same pattern: `.env` for `HUBSPOT_ACCESS_TOKEN`, `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, and any base URLs. See `scripts/weekly-audit.js` or `scripts/conference-match.js` for token loading style.

---

## What you are building

### 1. Webhook receiver (HTTP server)

- **Endpoint:** `POST /webhook/meeting-created` (or `/api/webhook/meeting-created`).
- **Input (JSON):** The caller (Zapier or HubSpot workflow) will send a payload when a **discovery meeting** is created. Expect at least:
  - `meetingId` (HubSpot meeting object ID)
  - `companyId` (HubSpot company ID, optional if you can fetch from meeting associations)
  - `meetingTitle` (e.g. `hs_meeting_title`)
  - `meetingStartTime` (ISO 8601; for scheduling the outcome prompt)
  - `meetingEndTime` (ISO 8601; optional; if missing, derive from start + 30 min or 1 hour)
  - `ownerId` or `ownerEmail` or `ownerSlackUserId` — used to DM the right rep in Slack (see below).
- **Validation:** Require `meetingId` and at least one of `meetingStartTime` / `meetingEndTime`. If `companyId` or owner is missing, either reject with 400 or fetch from HubSpot using the meeting ID and associations.
- **Idempotency:** If the same `meetingId` is sent again within a short window (e.g. 5 minutes), either ignore or update — do not send duplicate Slack messages. Use an in-memory set or a small DB/key-value store keyed by `meetingId` + time window.

### 2. Slack app (Block Kit)

- **Slack app type:** Use a **Slack Bot** with Bot User OAuth Token (`xoxb-...`). Scopes needed: `chat:write`, `chat:write.public`, `users:read.email` (if you look up Slack user by email), `im:write` (to open DMs). Optionally `channels:read` if you post to a channel instead of DM.
- **Where to send:** Prefer **DM to the meeting owner** so the rep gets one message per meeting. If you don’t have a Slack user ID, use `users.lookupByEmail` with the owner’s email (from HubSpot) or pass `ownerSlackUserId` in the webhook.
- **First message (meeting source):**
  - Text: e.g. “New discovery meeting: **{meetingTitle}** — Where was this meeting set?”
  - One **Block Kit** block: **static_select** (dropdown) with the **canonical meeting source options**. Use the exact **Source** labels from `hs-attribution-audit.md` (e.g. Paid Search, Paid Social, Prospecting, Meeting Attendee, Hosted Event, …). Each option’s `value` must be the **internal value** that HubSpot’s `meeting_source` property expects (check HubSpot Settings → Objects → Meetings → Property `meeting_source` for option values, or use the same string as label if your taxonomy is aligned).
  - **action_id:** e.g. `meeting_source_select`.
  - Include `meetingId` and `companyId` in the block’s `value` or in metadata so the submission handler knows which meeting/company to update.
- **Submission handler (source):** When the user selects a value and submits (use Slack’s **block_actions** or **message** payload), parse the selected option, then:
  - **PATCH** HubSpot meeting: `PATCH /crm/v3/objects/meetings/{meetingId}` with body `{ "properties": { "meeting_source": "<selected_value>" } }`.
  - Optionally **PATCH** HubSpot company: update the company’s attribution field (e.g. `stat_latest_source`) with the same value so meeting and company stay in sync. Use the company ID from the webhook or from the meeting’s associations.
  - Optionally update the Slack message to “Source set: {value}” so the rep sees confirmation.
- **Second message (meeting outcome):** Send this **after the meeting end time**. Do not rely on Zapier’s 31-day limit — schedule it in your app.
  - **Scheduling:** When you process the “meeting created” webhook, compute a “send at” time (e.g. `meetingEndTime + 15 minutes` or “next 9am after meeting end”). Use a **scheduler** (in-memory with `setTimeout`/cron, or a queue like Bull/BullMQ, or a serverless cron that reads “pending outcome” meetings from a store). At that time, send a **new** Slack message (or a reply in the same DM thread): “How did **{meetingTitle}** go?” with a **static_select** for outcome.
  - **Outcome options:** Use HubSpot’s `hs_meeting_outcome` enum values. From the schema they are: `SCHEDULED`, `COMPLETED`, `RESCHEDULED`, `NO_SHOW`, `CANCELED`, `COMPLETED - PROGRESSED`, `COMPLETED - STALLED`, `COMPLETED - STEP BACK`. Use human-friendly labels in the dropdown (e.g. “Completed”, “No-show”, “Rescheduled”) and map to these API values when PATCHing.
  - **action_id:** e.g. `meeting_outcome_select`.
  - **Submission handler (outcome):** On submit, **PATCH** HubSpot meeting: `PATCH /crm/v3/objects/meetings/{meetingId}` with body `{ "properties": { "hs_meeting_outcome": "<selected_value>" } }`. Optionally update the Slack message to “Outcome recorded: {label}”.

### 3. Slack event handling

- **Request verification:** Verify Slack requests using `SLACK_SIGNING_SECRET` (compare `X-Slack-Signature` with HMAC-SHA256 of raw body). Reject if invalid.
- **URL verification:** If Slack sends `type: url_verification`, respond with `{ "challenge": "<challenge>" }`.
- **Events:** Subscribe to **block_actions** (and optionally `message` if you use shortcuts). Handle `action_id` `meeting_source_select` and `meeting_outcome_select`; extract `meetingId`/`companyId` from the action’s value or from stored state keyed by `channel_id` + `message_ts` (if you store it when sending the message).

### 4. HubSpot API

- **Base URL:** `https://api.hubapi.com`
- **Auth:** Private App access token in `HUBSPOT_ACCESS_TOKEN`. Header: `Authorization: Bearer <token>`.
- **Meetings:** Object type is `meetings`. Custom property for attribution: `meeting_source`. Standard property for outcome: `hs_meeting_outcome`.
- **Associations:** To get company from meeting: `GET /crm/v4/objects/meetings/{id}/associations/companies` (or v3 equivalent). Use this if the webhook doesn’t send `companyId`.
- **Error handling:** On 4xx/5xx from HubSpot, log and optionally post a Slack message to an ops channel or to the rep (“Couldn’t update HubSpot — please set meeting source in HubSpot.”).

### 5. Scheduling “outcome prompt after meeting end”

- **Requirement:** No 31-day Zap limit. Your app must schedule the outcome message for a time after `meetingEndTime` (e.g. +15 min or next business morning).
- **Options:**
  - **Simple (single process):** In-memory scheduler: store `{ meetingId, companyId, meetingTitle, ownerSlackUserId, sendAt }` in memory or a JSON file; run a setInterval (e.g. every 1 minute) that checks for `sendAt <= now` and sends the outcome prompt, then marks as sent. Persist to a file or SQLite so restarts don’t lose jobs.
  - **Robust:** Use a queue (e.g. Bull/BullMQ with Redis) with delayed jobs, or a small table “pending_outcome_prompts” and a cron job that selects `send_at <= now()` and sends.
- **Edge cases:** If the meeting is in the past when the webhook fires (e.g. backfill), send the outcome prompt immediately or within 1 minute.

### 6. Project layout and run instructions

- **Place the app** in a new directory under this repo, e.g. `meeting-attribution-app/`, so it stays next to existing scripts and docs.
- **Tech stack:** Node.js (match repo). Use Express or Fastify for the HTTP server. Use `@slack/bolt` or raw `@slack/web-api` + Express; Bolt is easier for events and shortcuts.
- **Environment:** `.env` in the app root (or repo root) with:
  - `HUBSPOT_ACCESS_TOKEN`
  - `SLACK_BOT_TOKEN` (xoxb-...)
  - `SLACK_SIGNING_SECRET`
  - Optional: `PORT`, `BASE_URL` (for webhook URL), `SLACK_OPS_CHANNEL_ID` for error notifications.
- **README:** In `meeting-attribution-app/README.md`, document:
  - How to create the Slack app and install to workspace (scopes, subscribe to events, enable Interactivity).
  - Webhook payload shape for `POST /webhook/meeting-created` so Zapier/HubSpot can be configured.
  - How to run locally (`node server.js` or `npm start`) and how to deploy (e.g. Fly.io, Railway, or a single VPS with PM2). Mention that the endpoint must be HTTPS for Slack events.

---

## Acceptance criteria (checklist for the agent)

- [ ] **Webhook:** `POST /webhook/meeting-created` accepts JSON with `meetingId`, `meetingStartTime` or `meetingEndTime`, and owner identifier; validates and returns 400 if required fields missing; optionally fetches company ID from HubSpot if not in payload.
- [ ] **Slack – source message:** On webhook, app DMs the meeting owner (or posts to a configurable channel) with a Block Kit message: “New discovery meeting: {title} — Where was it set?” and a single select dropdown of **canonical** meeting source values (from `hs-attribution-audit.md`).
- [ ] **Slack – source submit:** On selection, app PATCHes HubSpot meeting `meeting_source` and optionally company `stat_latest_source`; responds to Slack so the message updates or acknowledges.
- [ ] **Scheduling:** App schedules “send outcome prompt” for after meeting end (e.g. end + 15 min); no reliance on Zapier 31-day limit.
- [ ] **Slack – outcome message:** At scheduled time, app sends a second message (or reply in thread) with outcome dropdown (HubSpot `hs_meeting_outcome` values with friendly labels).
- [ ] **Slack – outcome submit:** On selection, app PATCHes HubSpot meeting `hs_meeting_outcome`.
- [ ] **Slack security:** All Slack requests verified with `SLACK_SIGNING_SECRET`; URL verification handled.
- [ ] **Idempotency:** Duplicate webhook for same `meetingId` within a short window does not create duplicate Slack messages.
- [ ] **Docs:** README explains Slack app setup, webhook contract, and how to run/deploy.
- [ ] **Schema alignment:** Meeting source dropdown uses the **same** source list as `stat_latest_source` (23 values from attribution audit) so there is no separate mapping layer.

**Note on `meeting_source` options:** The HubSpot Meetings property `meeting_source` currently has 18 values (see hs-schema.md). The app should use the **23-value** taxonomy from the attribution audit. If HubSpot’s dropdown doesn’t yet have those options, add them in HubSpot Settings → Objects → Meetings → meeting_source, or document that a one-time property update may be needed.

---

## Optional enhancements (only after core is done)

- **Slash command** (e.g. `/meeting-source`) that opens a modal or sends a message for the rep to set source/outcome for a meeting they specify (e.g. by meeting ID or title search).
- **Post to channel:** Configurable channel (e.g. `#discovery-meetings`) instead of DM, with @mention of owner.
- **HubSpot “Meeting ended” webhook:** If HubSpot ever supports “meeting ended” events, replace the time-based scheduler with an event-driven webhook.

---

## Copy-paste prompt (for Claude Code)

```
Build the Discovery Meeting Attribution Slack app and backend as specified in docs/meeting-attribution-build-prompt.md in this repo.

Use the repo’s existing context:
- docs/meeting-attribution-timwoods-and-slack-app.md (why we’re building this)
- .cursor/hubspot-context/hs-attribution-audit.md (canonical source taxonomy — use the Source column for the meeting source dropdown)
- .cursor/hubspot-context/hs-schema.md (Meetings: meeting_source, hs_meeting_outcome; Companies: stat_latest_source)

Implement:
1. HTTP server with POST /webhook/meeting-created (JSON: meetingId, companyId optional, meetingTitle, meetingStartTime/meetingEndTime, owner id or email).
2. Slack Block Kit: DM (or channel) to owner with “Where was this meeting set?” → static_select with canonical meeting source options; on submit PATCH HubSpot meeting (meeting_source) and company (stat_latest_source).
3. Scheduler: after meeting end (e.g. end + 15 min), send second Slack message “How did it go?” with outcome dropdown (hs_meeting_outcome values); on submit PATCH meeting hs_meeting_outcome.
4. Slack request verification (signing secret), URL verification, idempotency for duplicate webhooks.
5. README with Slack app setup, webhook payload, run/deploy instructions.

Put the app in meeting-attribution-app/ (Node.js, Express or Fastify, .env for HUBSPOT_ACCESS_TOKEN, SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET). Match the acceptance criteria in the build prompt doc.
```

---

*End of prompt*
