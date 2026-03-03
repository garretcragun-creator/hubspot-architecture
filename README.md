# Meeting Attribution App

A lightweight Node.js service that sends a Slack DM to the HubSpot meeting owner whenever a discovery meeting is created, infers the likely attribution source from contact/company context, and writes the confirmed source directly back to HubSpot — replacing the current Zapier + Google Sheet + Slack Workflow chain.

---

## How it works

```
HubSpot "meeting created" webhook
    ↓
POST /webhook/meeting-created
    ↓
Fetch meeting + contact + company + owner from HubSpot
    ↓
Run inference engine (24 canonical sources, weighted signals)
    ↓
Slack DM to owner — "Looks like Sponsored Event. Accurate?"
    ↓
Rep clicks "Yes" or picks from dropdown
    ↓
PATCH meeting_source (meeting) + stat_latest_source + discovery_source (company)
    ↓
Slack message updated to show confirmed source

If no rep response within 1 hour:
    → Auto-PATCH all three properties with inferred source
    → Slack message updated to show "Auto-set"
```

---

## Webhook contract

### `POST /webhook/meeting-created`

Accepts JSON from HubSpot (or your Zap). Responds `200 { "ok": true }` immediately; all processing is async.

**Required field (one of):**

| Field | Type | Notes |
|-------|------|-------|
| `meetingId` | string / number | HubSpot meeting object ID |
| `objectId` | string / number | HubSpot webhook native field name |

**Example payload:**
```json
{ "meetingId": "12345678" }
```

Duplicate `meetingId` values within a 5-minute window are silently dropped.

---

## HubSpot properties written

| Object | Property | Internal name | Notes |
|--------|----------|---------------|-------|
| Meeting | Meeting Source | `meeting_source` | Custom single-select; **must list all 24 canonical values** |
| Contact/Company | Latest Attribution Source | `stat_latest_source` | Custom single-select |
| Company | Discovery Source | `discovery_source` | Create only if not already on your portal (see below) |

### Pre-requisite: company property `discovery_source` (only if missing)

**If you already have a Company property "Discovery Source" (internal name `discovery_source`), skip this.**

Otherwise: HubSpot → Settings → Properties → Company → Create property:
- **Label:** Discovery Source
- **Internal name:** `discovery_source`
- **Type:** Single-line text (or Single-select with the 24 canonical values)

### Pre-requisite: ensure `meeting_source` has all 24 values (only if missing)

**If your Meetings property `meeting_source` already includes all 24 canonical sources, skip this.**

Otherwise: the current dropdown may have ~18 values. Add the missing ones so the app can write any of the 24 canonical sources without a validation error.

**All 24 canonical source values:**
```
Paid Search, Paid Social, Display, Retargeting, Sponsored Email, Paid Review,
Email, Organic Social, Organic Search, LLMs, Press Release, Web Link, Direct,
Integration, Hosted Event, Hosted Webinar, Sponsored Event, Sponsored Webinar,
List Import, Meeting Attendee, Prospecting, Referral, Partner, Affiliate
```

---

## Inference engine

Signals are evaluated in confidence order. The highest-confidence signal ≥ 50 wins. If all signals are < 50, the fallback rule applies:

| Signal | Confidence | Source |
|--------|-----------|--------|
| `stat_latest_source` on contact (canonical) | 85 | value as-is |
| `conference_interactions` set on contact | 75 | Sponsored Event |
| Meeting booking UTM (`engagements_last_meeting_booked_*`) | 70 | mapped |
| Recent outbound call/email in last 14 days | 65 | Prospecting |
| `hs_latest_source` / `hs_analytics_source` | 45 | mapped |
| `stat_original_source` on contact | 30 | value as-is |
| `latest_source_history` on contact | 25 | first canonical match |
| `stat_latest_source` on company | 20 | value as-is |

**Default rule (confidence < 50):** Sponsored Event if `conference_interactions` is set; otherwise Prospecting.

---

## Slack app setup

### Required OAuth scopes (Bot Token)

| Scope | Why |
|-------|-----|
| `chat:write` | Post and update messages |
| `im:write` | Open DM channels |
| `users:read.email` | Look up rep by email |
| `users:read` | Look up users |

### App settings

1. **Interactivity & Shortcuts** → Enable → set Request URL to:
   ```
   https://your-host.com/slack/actions
   ```
2. **Event Subscriptions** → Enable → Request URL:
   ```
   https://your-host.com/slack/events
   ```
   Subscribe to bot events: `message.im` (optional — only if you want to handle DM replies)

3. Install the app to your workspace and copy the **Bot User OAuth Token** and **Signing Secret** to `.env`.

---

## Setup & run

```bash
# 1. Install dependencies
npm install

# 2. Environment variables
# If you already have a repo-level .env (e.g. ../.env) with HUBSPOT_ACCESS_TOKEN, SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET:
cp ../.env .env
# Or symlink: ln -s ../.env .env
#
# Otherwise: copy the template and fill in:
# cp .env.example .env
# Then set HUBSPOT_ACCESS_TOKEN, SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET

# 3. Start
npm start

# Development (auto-restart on file change, Node ≥ 18)
npm run dev
```

The server listens on `PORT` (default 3000).

**Health check:** `GET /health` → `{ "ok": true, "uptime": ... }`

### Expose locally for development

```bash
npx ngrok http 3000
```

Use the ngrok HTTPS URL as your Slack Interactivity Request URL and for your HubSpot webhook.

### Deploy on Railway

**Option A — From GitHub (if your code is in a repo):**

1. **Account:** Go to [railway.app](https://railway.app), sign in with GitHub.

2. **New project:** New Project → **Deploy from GitHub repo** → select the repo that contains `meeting-attribution-app` (e.g. `Hubspot_Architecture`).

3. **Root directory:** In the new service, open **Settings** → **Source** → set **Root Directory** to:
   ```
   meeting-attribution-app
   ```
   (so Railway runs `npm install` and `npm start` from that folder.)

4. **Variables:** In the service, open **Variables** and add:
   - `HUBSPOT_ACCESS_TOKEN` = your Private App token
   - `SLACK_BOT_TOKEN` = your Slack bot token (xoxb-...)
   - `SLACK_SIGNING_SECRET` = your Slack app Signing Secret  
   Optionally: `PORT` (Railway usually sets this automatically).

5. **Build / start:** Railway will run `npm install` and use `npm start` from the root directory. If your `package.json` has no `start` script, add: `"start": "node src/index.js"`.

6. **Public URL:** In the service, open **Settings** → **Networking** → **Generate Domain**. You’ll get a URL like `https://meeting-attribution-app-production-xxxx.up.railway.app`.

7. **Slack:** In your Slack app, set **Interactivity & Shortcuts** → Request URL to:
   ```
   https://<your-railway-domain>/slack/actions
   ```
   and **Event Subscriptions** (if used) to:
   ```
   https://<your-railway-domain>/slack/events
   ```

8. **HubSpot / Zap:** Point the “meeting created” webhook at:
   ```
   POST https://<your-railway-domain>/webhook/meeting-created
   ```
   with body `{ "meetingId": "{{hs_object_id}}" }`.

**Health check:** `GET https://<your-railway-domain>/health` → `{ "ok": true }`.

**Option B — From your machine (no GitHub):**

1. **Install Railway CLI:** [railway.app/help/cli](https://docs.railway.app/guides/cli) or `npm i -g @railway/cli`.

2. **Log in and create a project:**
   ```bash
   cd meeting-attribution-app
   railway login
   railway init
   ```
   Follow the prompts (create a new project, add a service).

3. **Set variables in the dashboard:** Railway dashboard → your service → **Variables** → add `HUBSPOT_ACCESS_TOKEN`, `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`.

4. **Deploy from this folder:**
   ```bash
   railway up
   ```
   The CLI uploads the current directory (`meeting-attribution-app`) and runs the build there. No GitHub needed.

5. **Generate domain:** In the dashboard, **Settings** → **Networking** → **Generate Domain**. Use that URL for Slack and the webhook (same as step 6–8 above).

---

## HubSpot webhook / Zap trigger

Send `POST /webhook/meeting-created` with `{ "meetingId": "{{hs_object_id}}" }` whenever a discovery meeting is created. The app fetches all other data (contact, company, owner) from HubSpot directly.

Filter criteria (in Zap or HubSpot workflow):
- Object type: Meeting
- Trigger: Created
- Filter: `hs_meeting_title` contains "Discovery" OR "Intro" (match your naming convention)

---

## Notes

- **In-memory scheduler:** The 1-hour fallback timer lives in process memory. A restart before the timer fires will lose pending jobs. For production use, replace the `setTimeout` in `scheduler.js` with a persistent queue (Redis + Bull, BullMQ, or a database-backed job table).
- **`discovery_source` 404s:** If the Company property doesn't exist yet, `patchCompany` will log a warning but won't crash the app — errors are caught per-patch. If you already have the property, no action needed.
- **Rate limiting:** The HubSpot client enforces max 8 concurrent requests and respects `Retry-After` on 429 responses.
