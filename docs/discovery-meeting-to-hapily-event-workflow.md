# Discovery Meeting → Hapily Event Association Workflow

**Goal:** Associate a discovery meeting to a specific Hapily event when:
1. A contact on the meeting is associated to that Hapily event (registered, attended, etc.), and  
2. The Hapily event end date/time ended **less than 90 days ago**, and  
3. The contact was **not a customer at the time the meeting was booked** (using meeting create date).

---

## Why This Matters

- **Attribution:** Tie discovery calls to the event that influenced them (e.g. conference, webinar).  
- **Reporting:** Report on “discovery meetings from HIMSS” or “discovery from [Event Name]” using the existing Meeting ↔ Hapily event association (`hapily_event_to_meeting_event`).  
- **90-day window:** Only recent events count; older events are not linked.  
- **Non-customer at book time:** Avoid crediting an event for a meeting with someone who was already a customer when the meeting was created/booked. We use **meeting create date** (`hs_createdate`), not start time, so we aren’t influenced by meetings scheduled far in advance.

---

## Schema Reference (from `hs-schema.md`)

| Item | Value |
|------|--------|
| **Meetings** | Object type `meetings` (0-47) |
| **Hapily event** | Custom object type `2-54709572` |
| **Meeting ↔ Hapily event** | Association `hapily_event_to_meeting_event` (ONE_TO_MANY both ways) |
| **Contact ↔ Hapily event** | e.g. `hapily_event_contact_registered`, `hapily_event_contact_attended`, etc. |
| **Discovery meeting** | `hs_activity_type` = `Discovery Call` (optionally also Demo Call, Initial Meeting) |
| **Hapily event end** | Property `end_datetime` on Hapily event |
| **Meeting date (for recency & “not customer”)** | `hs_createdate` — when the meeting was created/booked (not start time, so we aren’t influenced by far-future schedules) |
| **Contact “not customer at book time”** | `lifecyclestage` ≠ customer **or** `hs_v2_date_entered_customer` is empty **or** meeting create date &lt; `hs_v2_date_entered_customer` |

---

## Workflow Design

### Trigger and enrollment (Contact-based)

HubSpot workflows **cannot enroll the Meeting object**. Use a **Contact-based** workflow instead:

- **Enrollment object:** Contact  
- **Trigger:** **Meeting booked** (or **Meeting scheduled**). This enrolls the **contact** who booked the meeting.  
- **Optional enrollment filter:** e.g. Contact’s `lifecyclestage` is not Customer (to avoid running for existing customers), or leave open and let the code’s “not customer at schedule time” logic handle it.

The custom code receives the enrolled **contact**, finds that contact’s **most recent discovery meeting** (within a recency window, e.g. 14 days), then runs the association logic for that meeting.

### Logic (per enrolled contact)

1. **Find meeting:** Get the contact’s most recent **discovery** meeting (Discovery Call, Demo Call, or Initial Meeting) that was created or starts within the last 14 days (or is in the future). If none, exit.  
2. **Get contacts** on that meeting (Meeting → Contact).  
3. **For each contact** on the meeting:  
   - Get **Hapily events** associated to that contact (any relationship: registered, attended, etc.).  
   - For each event, load **`end_datetime`**.  
   - **Filter events:**  
     - Event has ended: `end_datetime` ≤ now.  
     - Ended “less than 90 days ago”: `end_datetime` ≥ (now − 90 days).  
   - **Filter “contact not customer at meeting book time”:**  
     - Contact’s `lifecyclestage` is not `customer`, **or**  
     - Contact has no `hs_v2_date_entered_customer`, **or**  
     - Meeting’s **create date** (`hs_createdate`) &lt; contact’s `hs_v2_date_entered_customer`.  
   - From the events that pass both filters, choose **one** (e.g. the event with the **most recent** `end_datetime`).  
4. **Associate** the meeting to that Hapily event using `hapily_event_to_meeting_event`.

### Edge Cases

- **Contact has no recent discovery meeting:** Skip; no association.  
- **Meeting has no contacts:** Skip; no association.  
- **Contact has no Hapily events:** Skip that contact.  
- **No event in 90-day window:** No association.  
- **Contact was already customer when meeting was booked (create date):** Do not associate to any event for that contact.  
- **Meeting already associated to a Hapily event:** Either leave as-is (no overwrite) or overwrite by design; document the choice.

---

## Implementation Options

### Option A: HubSpot workflow + Custom Code (recommended)

- **Workflow:** **Contact-based** (enrollment object = Contact).  
- **Trigger:** **Meeting booked** (or **Meeting scheduled**) — this enrolls the contact who booked.  
- **Action:** Single **Custom code** action that:  
  - Receives the enrolled **contact** (object ID).  
  - Finds that contact’s most recent **discovery** meeting (Discovery Call / Demo Call / Initial Meeting, **created** within the last 14 days).  
  - Fetches contacts on that meeting → for each contact, fetches associated Hapily events → gets `end_datetime` → applies 90-day and “not customer at book time” (using meeting create date) filters → picks one event → creates Meeting → Hapily event association.  
- **Secrets:** Private app token with scopes: `crm.objects.contacts.read`, `crm.objects.custom.read`, `crm.schemas.custom.read`, `crm.objects.meetings.read`, and associations read/write for meetings and the Hapily event object.

Use the script in `scripts/discovery-meeting-to-hapily-event.js` inside the workflow’s Custom code action.

### Option B: Multiple native branches (no code)

Possible but limited:  
- Trigger: Contact-based, “Meeting booked.”  
- You cannot natively “get all Hapily events for this contact” and then filter by `end_datetime` in a simple way. You’d need a property on Contact that holds “latest Hapily event ID” or “latest Hapily event end date” and branch on that — and even then, - “not customer at book time” requires comparing meeting create date to `hs_v2_date_entered_customer`, which is doable but verbose.  
- **Recommendation:** Use Option A for clarity and one place to maintain the 90-day and “not customer at book time” (meeting create date) rules.

---

## Coordination with Existing Workflows

- **Map Lead Source To Meeting Source** (103049203): Continues to set `meeting_source` from contact’s `stat_latest_source`; no conflict.  
- **Contact Associated With Happily Event → Set Latest Attribution** (100489130): Sets contact attribution from event; no conflict.  
- **Disco Set → Send Slack & Set Attribution** (92356496): Deal/contact attribution at discovery; no conflict.  
- This workflow only **adds** an association from the meeting to a Hapily event; it does not change `meeting_source` or other attribution properties unless you add that later.

---

## Setup Checklist

1. Create workflow: **Contact**-based (enrollment object = Contact).  
2. Set trigger: **Meeting booked** (or **Meeting scheduled**).  
3. (Optional) Add enrollment filter: e.g. `lifecyclestage` is not Customer.  
4. Add **Custom code** action; paste `scripts/discovery-meeting-to-hapily-event.js`.  
5. Add secret **HS_PRIVATE_APP_TOKEN** (private app token with scopes above).  
6. (Optional) Add workflow input **associationTypeId** if you prefer to pass the Meeting ↔ Hapily event association type ID instead of resolving it in code.  
7. Test with a contact who just booked a discovery meeting and is linked to a recent Hapily event (ended &lt; 90 days ago) where the contact was not yet customer when the meeting was created.  
8. Turn on workflow and monitor; add to `hs-automation.md` when active.

---

## Reporting

After the workflow is live:

- Use the standard **Meeting ↔ Hapily event** association (`hapily_event_to_meeting_event`) to report “Discovery meetings by Hapily event” or “Discovery meetings from events that ended in the last 90 days.”
- Filter meetings where `hs_activity_type` = Discovery Call (and same options as enrollment) and where the meeting is associated to at least one Hapily event.
