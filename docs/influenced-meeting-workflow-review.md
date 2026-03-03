# Code review: "Influenced Meeting" workflow script

## Will it work when a meeting is set today?

**Mostly yes**, after the fixes below. The idea is right: on a contact with a new meeting, look back 7 days at associated activities and set `influenced_meeting = true` on the relevant ones.

---

## Fixes required

### 1. **API base URL**

Use HubSpot’s API host, not `api.hubspot.com`:

```python
# Wrong
assoc_url = f"https://api.hubspot.com/crm/v3/objects/..."

# Right
BASE = "https://api.hubapi.com"
assoc_url = f"{BASE}/crm/v4/objects/contacts/{contact_id}/associations/{obj_type}"
```

Use this same `BASE` for all requests (`batch_url`, `update_url`).

### 2. **Associations endpoint: use v4 and correct response shape**

- Use **v4** for listing associations:  
  `GET /crm/v4/objects/contacts/{contactId}/associations/{toObjectType}`  
  (not v3).

- The list response does **not** have `id`. It has:
  - `toObjectId` = ID of the associated activity (call, email, etc.)
  - `fromObjectId` = contact ID

So:

```python
# Wrong
record_ids = [r['id'] for r in assoc_results]

# Right
record_ids = [r['toObjectId'] for r in assoc_results]
```

Without this, `record_ids` is wrong and the batch read/update will fail or update the wrong records.

### 3. **Batch read: include `influenced_meeting` (optional but useful)**

Add `influenced_meeting` to the properties you request so you can skip already-flagged records and avoid redundant updates:

```python
read_properties = ["hs_createdate", "influenced_meeting"]
if obj_type == 'calls':
    read_properties.append("hs_call_outcome")
# ...
```

Then when building `ids_to_flag`, skip if `props.get("influenced_meeting") == "true"`.

### 4. **Batch size**

HubSpot batch read/update limits (e.g. 100 per request). If a contact has more than 100 associations of one type, chunk the IDs:

```python
BATCH_SIZE = 100
for i in range(0, len(record_ids), BATCH_SIZE):
    chunk = record_ids[i:i + BATCH_SIZE]
    # batch read chunk, then batch update chunk
```

---

## Logic check (meeting “happened today”)

- **Window:** `start_date = now - 7 days` and “in window” = `start_date <= record_date <= now` is correct for “activities in the last 7 days.”
- **Trigger:** Run this when “a meeting is created” or “meeting is completed” for that contact, and pass the **contact** `hs_object_id` in `inputFields`. Then “meeting happened today” is “workflow ran today because of that meeting.”
- **Calls:** Filtering by `TARGET_CALL_OUTCOMES` (Connected, Left live message, Left voicemail) is correct; confirm the UUIDs match your portal’s call outcome options (Settings → Properties → Calls → Call outcome).
- **Communications:** Using `hs_communication_channel_type == 'LINKEDIN_MESSAGE'` is correct for LinkedIn; the body fallback is optional.
- **Emails / tasks:** You currently flag every email and task in the window. That can include noise (e.g. marketing emails, unrelated tasks). If you see false positives, add filters (e.g. direction = OUTGOING, or task completion).

---

## Summary

| Issue              | Fix                                                                 |
|--------------------|---------------------------------------------------------------------|
| Base URL           | Use `https://api.hubapi.com`                                        |
| Associations path  | Use v4: `/crm/v4/objects/contacts/{id}/associations/{obj_type}`      |
| Association IDs    | Use `r['toObjectId']`, not `r['id']`                               |
| Already flagged    | Read `influenced_meeting`, skip if already `"true"`                 |
| Large association list | Chunk `record_ids` in batches of 100 for read/update            |

With these changes, the script will correctly find activities associated with the contact in the last 7 days and set `influenced_meeting` on them when the meeting is set (e.g. today).
