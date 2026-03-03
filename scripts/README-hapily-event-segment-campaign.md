# Hapily Event → Segment + Campaign Workflow

When a **Hapily event** is created, this workflow creates a **dynamic segment** (contacts associated to that event) and a **HubSpot campaign** with that segment attached.

## What the custom code does

1. **Segment (list)**  
   Creates a DYNAMIC list of **contacts** that are associated to the new Hapily event (any association type: registered, attended, etc.). Segment name: `{Event Name} — Registrants`.

2. **Campaign**  
   Creates a HubSpot marketing campaign with:
   - **hs_name** = Hapily event **name** (from event record)
   - **hs_start_date** / **hs_end_date** = Hapily event **start_datetime** / **end_datetime** (with display_* fallbacks)
   - **hs_campaign_status** = planned  
   - **campaign_type** = "Event / Conference"  
   - **campaign_goal** / **funnel_stage** = from input or defaults  
   - **hs_notes** = from input (optional)

3. **Association**  
   Associates the new segment to the campaign as an **OBJECT_LIST** asset so the campaign’s audience is “contacts associated to this event.”

## Workflow setup in HubSpot

### Trigger

- **Object created** → **Hapily event** (object type ID `2-54709572`).

### Custom code action

1. **Campaign name and dates** — The code fetches the Hapily event and uses **name** for the campaign name and **start_datetime** / **end_datetime** (with fallbacks to **display_start_date** / **display_end_date**) for campaign start/end. No workflow input mapping needed for these.
2. **Optional inputs** — **campaignGoal** (default "Increase Lead Volume"), **funnelStage** (default "Awareness"), **campaignNotes**. Use **eventName**, **eventStartDate**, or **eventEndDate** only if you want to override the values from the Hapily event.

2. **Secret**
   - Add a secret named **HS_PRIVATE_APP_TOKEN** with your **Private App** access token. The code reads it as `process.env.HS_PRIVATE_APP_TOKEN`.

3. **Private app scopes**
   - `crm.lists.read`, `crm.lists.write`
   - `crm.objects.custom.read` (for association types)
   - `marketing.campaigns.read`, `marketing.campaigns.write`

4. **Data outputs** (optional, for use in later actions)
   - **listId** (number) – created segment ID  
   - **campaignGuid** (string) – created campaign ID  

## Properties used (from schema)

| Object            | Property           | Internal name       | Use                          |
|-------------------|--------------------|---------------------|------------------------------|
| Hapily event      | Event Name         | `name`              | Segment name, campaign name   |
| Hapily event      | Start Date & Time  | `start_datetime`    | Campaign `hs_start_date`     |
| Hapily event      | Display Start Date | `display_start_date`| Alternative for start date   |
| Hapily registrant | (association only) | —                   | Contacts linked via event    |
| Contact           | (list member)      | —                   | Segment = contacts in list   |
| Campaign          | Name               | `hs_name`           | Set from event name          |
| Campaign          | Start date         | `hs_start_date`     | Set from event start         |
| Campaign          | End date           | `hs_end_date`       | Set from event end (optional)|
| Campaign          | Status             | `hs_campaign_status`| Set to `planned`             |
| Campaign          | Campaign Type      | `campaign_type`     | "Event / Conference"         |
| Campaign          | Campaign Goal      | `campaign_goal`     | Input or default             |
| Campaign          | Funnel Stage       | `funnel_stage`      | Input or default             |
| Campaign          | Notes              | `hs_notes`          | Optional input               |

## Object and association IDs

- **Contact:** `0-1`  
- **Hapily event:** `2-54709572`  
- **Contact ↔ Hapily event:** Association type ID is **fetched in the code** from  
  `GET /crm/v3/associations/0-1/2-54709572/types`  
  (e.g. `hapily_event_contact_registered`, `hapily_event_contact_attended`). No manual config needed.

## If the list filter fails

If the segment filter is rejected (e.g. wrong association category), try changing in the script:

- `associationCategory: 'HUBSPOT_DEFINED'`  
  to  
- `associationCategory: 'INTEGRATOR_DEFINED'`  

(event•hapily may define the association as integrator.)

## File

- **Script to paste into the workflow:** [hapily-event-segment-and-campaign.js](hapily-event-segment-and-campaign.js)
