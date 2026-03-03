# Location: Other Objects, Engagements, and Integrations

> How other HubSpot objects (meetings, calls, leads, engagements, etc.) and external tools (Gong, Chili Piper, Apollo) interact with the **Location** object. Use this to align workflows, syncs, and reporting. Canonical process: `docs/location-process-and-decisions.md`.

---

## 1. Other HubSpot objects and Location

| Object | Current state (Sites) | Location consideration | Decision / action |
|--------|------------------------|-------------------------|-------------------|
| **Contacts** | Contact ↔ Site (existing) | We have **Location → Contact** (Primary contact). Semantics: who is the contact? See §6. | Done in Phase 1; meaning of "Primary contact" to be decided (§6). |
| **Meetings** (0-47) | Sites has `meeting_event_to_sites` | Associate Meeting → Location? | **No.** Do not associate meetings to Location. Activities stay on Contact/Company only. |
| **Calls** (0-48) | Sites has `call_to_sites` | Associate Call → Location? | **No.** Do not associate calls to Location. |
| **Emails** (0-49), **Notes** (0-46), **Tasks** (0-27), **Communications** (0-18), **Postal mail** (0-116) | Sites has associations to these engagement types | Optional: Location ↔ engagement type. | Phase 1 = no engagement associations. Phase 2+: add only if reporting/routing requires "activity by location." |
| **Leads** | Lead → Company (and Contact) | Associate Lead → Location? | **No.** Do not associate leads to Location. Lead → Company is enough. |
| **Invoices** | If present (e.g. Stripe, custom object) | Invoicing may be per location. | **Decide:** If you have an invoice object, document links to Deal/Company/Location and roll-ups. |
| **Tickets** | Support object | Ticket → Location for support by location. | **Phase 2.** Associate Ticket → Location in Phase 2 when support workflows/reporting need it. Not in Phase 1. |

**Reference:** Existing **Sites** object (`2-56022093`) has associations to calls, notes, etc. We are **not** replicating Meeting, Call, or Lead associations for Location. Ticket → Location in Phase 2. See `.cursor/hubspot-context/hs-schema.md` Association Map.

---

## 2. Gong

- **What Gong does:** Syncs call and meeting data into HubSpot (creates/updates engagements: calls, meetings, etc.); may set properties from transcripts or metadata.
- **Considerations:**
  1. **Engagement → Location:** We are **not** associating meetings or calls to Location (§1). Gong-created engagements stay on Contact/Company only. No Gong change required for Location.
  2. **No conflict with Location properties:** Gong doesn't write to Location object; ensure no Gong workflow or property overwrites Company/Contact fields we use for Location roll-ups or NPI.
  3. **Filtering Gong meetings:** Existing logic (e.g. `scripts/backfill-properties.js`) may filter out "Gong" meetings by title; no change needed for Location.
- **Action:** None for Phase 1; no Meeting/Call → Location association.

---

## 3. Chili Piper

- **What Chili Piper does:** Routing and scheduling (e.g. round-robin, meeting booking); may create or update Deals, Contacts, or Companies in HubSpot.
- **Considerations:**
  1. **Routing logic:** Routing is typically by Company or Contact. Ensure routing rules don't assume parent-child Company structure; if they only use Company/Contact, Location doesn't affect routing unless we explicitly add "route by location" later.
  2. **Deal/Contact creation:** When Chili Piper creates a Deal or Contact, it associates to Company (standard). Our **deal-close** flow creates Locations; no conflict. Locations are created when deal closes, not when deal is created.
  3. **Passing location into Chili Piper:** If we ever need to route or schedule by location (e.g. "book with rep for this location"), we'd need to pass a Location identifier or Company + location context into Chili Piper; document as future option, not Phase 1.
- **Action:** Confirm with ops that Chili Piper routing uses only Company/Contact (or Deal); no change for Phase 1 unless routing by location is required.

---

## 4. Apollo: imports and enrichment

- **What Apollo does:** Imports and enriches contacts and companies; sets properties (e.g. `apollo_campaign`, company signals). Used in workflows (e.g. Lead Object – Apollo Import, lifecycle). See `.cursor/hubspot-context/hs-automation.md`, `hs-schema.md`.
- **Considerations:**

| Topic | Consideration | Decision / action |
|-------|----------------|-------------------|
| **Enrichment order** | Apollo and our NPI/Mimi Labs enrichment may both touch Company or Contact. | Define order: e.g. Apollo runs first (or on import); our enrichment runs when **Location** exists and has NPI (or when Company has NPI). Avoid overwriting each other; use fill-blanks-only for our enrichment. |
| **Location creation** | We do **not** auto-create Location records from Apollo imports. Locations are created at **deal close** via our API → Slack → webhook flow. | Apollo-imported Companies will have **no** Location records until a deal closes and the flow runs. That's by design. |
| **Associations when Apollo imports** | Apollo-imported Contact is associated to Company (standard). How do we handle **Contact ↔ Location**? | **Options:** (a) Leave Contact without Location association until deal close and CS sets Primary contact. (b) When a Contact is associated to a Company that **already has** Locations, run a workflow that suggests or sets Primary location (e.g. by domain, or manual pick). (c) If Apollo sends address/NPI, try to match to an existing Location and create association. Document chosen option; Phase 1 typically (a) or (b). |
| **Duplicate / conflict** | Apollo may create Companies that already exist (e.g. by domain). | Use existing deduplication and merge processes. After merge, Location records (when present) stay associated to the surviving Company. |

- **Action:** (1) Document enrichment order (Apollo vs our Location/NPI enrichment) in playbook. (2) Decide how Apollo-imported Contacts get **Primary location** when the Company already has Locations: manual only, or workflow that suggests/sets. (3) Add to Company audit (`docs/location-process-and-decisions.md` §10) any Company properties that Apollo sets that might be replaced or affected by Location roll-ups.

---

## 6. Contact on Location: who is the Primary contact?

**Open decision:** What does the **Contact** associated to a Location (Primary contact) represent?

| Option | Meaning | Implications |
|--------|---------|--------------|
| **A. Person who works at that location** | The contact is someone at or responsible for that site (e.g. site manager, on-the-ground lead). | One key person per location. Other company contacts (HQ, decision makers) stay Company/Deal only. |
| **B. Company decision maker who influences how that location buys** | The contact is a buyer/champion at the company level whose decisions affect this location (e.g. VP who signs for multiple sites). | Same contact can be Primary contact for multiple Locations. Location = where the buying decision applies, not necessarily where the person works. |

**Also to decide:** Should the **company primary contact** be **added to all Locations** for that company?

- **If yes:** One contact (e.g. main champion) could be set as Primary contact on every Location. Simplifies "who do we call?" but may not reflect site-specific roles.
- **If no:** Each Location has its own Primary contact (or none); we don't auto-copy the company primary to all locations. Better for multi-site accounts where each site has a different lead.

Document the chosen semantics in `docs/location-process-and-decisions.md` and in training so CS and Sales know who to set as Primary contact and whether to add the company primary to all locations.

---

## 7. Reference

- **Process & decisions:** `docs/location-process-and-decisions.md`
- **MVP architecture:** `docs/location-mvp-architecture.md`
- **HubSpot schema (Sites associations):** `.cursor/hubspot-context/hs-schema.md` — Association Map
- **Automation (Apollo workflows):** `.cursor/hubspot-context/hs-automation.md`
