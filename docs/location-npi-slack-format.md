# Location NPI — Slack Reply Format (No CSV)

> CS can reply in Slack with **location name and NPI on separate lines**. No CSV, no export/import. The text is parsed and HubSpot Location records are updated by matching location name to the Company’s Locations.

---

## 1. Message the system sends (when deal closes)

Send one message (e.g. in #onboarding or DM to the assignee) that includes:

- **Company name** and **link to Company** (or Deal).
- **Company ID** (needed for parsing — see §3). Optionally include it in the message so a bot or script knows which company, e.g. “Company ID: 12345” or in a block button value.
- **Instructions** and an example:

```
New customer: Acme Health. Add NPIs for their locations.
Reply to this thread with location name and NPI on separate lines (one pair per location), e.g.:

Main Campus
1234567890
Downtown Clinic
0987654321
```

---

## 2. Format CS uses in their reply

**Accepted formats:**

| Format | Example |
|--------|--------|
| **Alternating lines** (name, then NPI) | `Main Campus` then `1234567890` then `Downtown` then `0987654321` |
| **One line per location** (name + NPI) | `Main Campus: 1234567890` and `Downtown Clinic: 0987654321` |

- **Location name** must match the **Location record name** in HubSpot for that Company (e.g. “Main Campus”, “Acme Health - Primary”). Matching is case-insensitive; partial match is used if no exact match.
- **NPI** = 10 digits. Spaces or dashes are stripped (e.g. `123-456-7890` → `1234567890`).

**Example reply (thread reply):**

```
Main Campus
1234567890
Downtown Clinic
0987654321
West Side
1112223333
```

---

## 3. How the reply gets applied to HubSpot

**Option A — Manual (no bot yet)**  
CS or ops copies the reply text and runs:

```bash
node scripts/location-bulk-npi.js from-text --company=COMPANY_ID --text="Main Campus
1234567890
Downtown Clinic
0987654321"
```

Or save the reply to a file and run:

```bash
node scripts/location-bulk-npi.js from-text --company=COMPANY_ID --file=data/npi-paste.txt
```

**Option B — Slack app / Zapier / Make**  
When someone replies in the thread:

1. Read the reply body and the **company ID** (from the parent message, e.g. stored when the workflow sent the Slack message, or from a link like `.../company/12345`).
2. Call the script (e.g. via CLI or a small HTTP endpoint that wraps it) with `--company=COMPANY_ID` and `--text=<reply text>`.
3. Post back in the thread: “Updated 3 locations with NPI” or “Could not match: Downtown Clinic — check the name in HubSpot.”

The script matches each “location name” to a HubSpot Location associated to that Company and sets the `npi` property. Enrichment (address/phone from Mimilabs) can run when NPI is set (workflow or scheduled job).

---

## 4. Including company ID in the Slack message

So that a bot or the person running the script knows which company:

- **In the message body:** e.g. “Company ID: 123456789” or “HubSpot Company: https://app.hubspot.com/contacts/PORTAL/company/123456789”.
- **In a block element:** e.g. a button with `value: company_id=123456789` so the bot gets it when the message is sent or when someone clicks (depending on your integration).
- **From the HubSpot workflow:** When the workflow runs “Send Slack message,” pass the Company ID as a custom property or in the link URL; your Slack app or Zapier can store “thread_ts → company_id” when posting the message, then when a reply arrives in that thread, look up company_id and call the script.

---

## 5. References

- **Process (step-by-step):** `docs/location-npi-process.md`
- **Script (from-text):** `scripts/location-bulk-npi.js` — `from-text --company=ID --text="..."` or `--file=path.txt`
