# HubSpot Data Dictionary (Schema Reference)

> Auto-generated on 2026-02-11T21:09:23.101Z from portal API.

## Table of Contents

- [Contacts](#contacts)
- [Companies](#companies)
- [Deals](#deals)
- [Tickets](#tickets)
- [Sites](#sites)
- [Hapily_session](#hapily_session)
- [Hapily_event](#hapily_event)
- [Hapily_registrant](#hapily_registrant)
- [Leads](#leads)
- [Meetings](#meetings)
- [Calculated Properties (All Objects)](#calculated-properties)
- [Ghost Properties (Audit Flags)](#ghost-properties)
- [Association Map](#association-map)
- [Engagement / activity objects (calls, emails, etc.)](#engagement--activity-objects-calls-emails-etc)

---

## Engagement / activity objects (calls, emails, etc.)

**Custom properties on engagements/activities are supported.** You can create and use custom properties on all activity object types to tag which activities influenced pipeline (e.g. an "Influenced Meeting" flag on calls, emails, LinkedIn messages).

| Object | Object Type (API) | Type ID | Use for |
|--------|-------------------|---------|---------|
| Calls | `calls` | 0-48 | Logged calls |
| Emails | `emails` | 0-49 | Logged/tracked emails |
| Meetings | `meetings` | 0-47 | Calendar/scheduled meetings (see [Meetings](#meetings)) |
| Notes | `notes` | 0-46 | Notes |
| Tasks | `tasks` | 0-27 | Tasks |
| Communications | `communications` | 0-18 | LinkedIn messages, SMS, WhatsApp |

- **Create property (API):** `POST /crm/v3/properties/{objectType}` with the same scopes as other CRM properties. Use object type name (e.g. `calls`, `emails`, `meetings`, `notes`, `tasks`, `communications`).
- **UI:** Settings → Data Management → Properties; filter by object type (Calls, Emails, Meetings, etc.) and create a new property.
- **Example:** A boolean property "Influenced Meeting" (`influenced_meeting`) on each activity type lets you report on which activities (and to which contacts) led to meetings/pipeline.

---

## Contacts

| Attribute | Value |
|---|---|
| **Type** | Standard Object |

**Total Properties:** 595 | **Custom:** 198 | **Calculated:** 53

### Custom Properties

| Property Name | Internal Name | Type | Field Type | Group | Description |
|---|---|---|---|---|---|
| Company Campaign | `ac_campaign` | string | text | attribution_properties | The most recent campaign when an account was created. |
| Company Lead Source Category | `ac_lead_source_category` | enumeration | select | attribution_properties | The broader category that the lead source falls under when an account was created. |
| Company Medium | `ac_medium` | string | text | attribution_properties | The most recent medium when an account was created. |
| Company Offer | `ac_offer` | string | text | attribution_properties | Most recent offer when an account was created. |
| Company Self-Reported Attribution | `ac_self_reported_attribution` | string | text | attribution_properties | Most recent SRA when an account was created. |
| Company Source | `ac_source` | string | text | attribution_properties | The most recent source when an account was created. |
| Attribution Data Hygiene Issue # | `attribution_data_hygiene_issue__` | number | number | attribution_properties | The # of data hygiene issues found. |
| Attribution Data Hygiene Issues | `attribution_data_hygiene_issues` | enumeration | checkbox | attribution_properties | A multi-select checkbox of all data hygiene issues present in a contact, set by workflows. |
| Campaign | `campaign` | string | text | attribution_properties | Most recent campaign for this contact. |
| Contact Campaign | `cc_campaign` | string | text | attribution_properties | The most recent campaign when a contact was created. |
| Contact Medium | `cc_medium` | string | text | attribution_properties | The most recent medium when a contact was created. |
| Contact Offer | `cc_offer` | string | text | attribution_properties | The most recent offer when a contact was created. |
| Contact Self-Reported Attribution | `cc_self_reported_attribution` | string | text | attribution_properties | Most recent SRA when a contact was created. |
| Contact Source | `cc_source` | string | text | attribution_properties | The most recent channel when a contact was created. |
| Company Attribution Ping | `company_attribution_ping` | enumeration | booleancheckbox | attribution_properties | A property that triggers when a company attribution property changes. Used to trigger data hygiene workflows. |
| Customer Lead Source Category | `cw_lead_source_category` | enumeration | select | attribution_properties | The broader category that the lead source falls under when a deal was closed won. |
| Customer Medium | `cw_medium` | string | text | attribution_properties | Most recent medium when a deal was won. |
| Customer Offer | `cw_offer` | string | text | attribution_properties | Most recent offer when a deal was closed won. |
| Customer Offer Type | `cw_offer_type` | enumeration | select | attribution_properties | The offer type engaged with when a demo was set. |
| Customer Self-Reported Attribution | `cw_self_reported_attribution` | string | text | attribution_properties | Most recent SRA when a deal was won. |
| Customer Source | `cw_source` | string | text | attribution_properties | Most recent source when a deal was won. |
| Demo Campaign | `dc_campaign` | string | text | attribution_properties | Most recent campaign when a first disco call was scheduled. |
| Demo Lead Source Category | `dc_lead_source_category` | enumeration | select | attribution_properties | The broader category that the lead source falls under when a demo was set. |
| Demo Medium | `dc_medium` | string | text | attribution_properties | Most recent medium when a discovery call was scheduled. |
| Demo Offer | `dc_offer` | string | text | attribution_properties | Most recent offer when a discovery call was scheduled. |
| Demo Offer Type | `dc_offer_type` | enumeration | select | attribution_properties | The offer type engaged with when a discovery call was set. |
| DC Self-Reported Attribution | `dc_self_reported_attribution` | string | text | attribution_properties | Most recent SRA when a first demo was scheduled. |
| Deal Attribution Ping | `deal_attribution_ping` | enumeration | booleancheckbox | attribution_properties | A property that triggers when a deal attribution property changes. Used to trigger data hygiene workflows. |
| Expansion Campaign | `fe_campaign` | string | text | attribution_properties | Most recent campaign when a first expansion closed. |
| Expansion Medium | `fe_medium` | string | text | attribution_properties | Most recent medium was a first expansion was closed. |
| Expansion Offer | `fe_offer` | string | text | attribution_properties | Most recent offer when a first expansion closed. |
| Expansion Self-Reported Attribution | `fe_self_reported_attribution` | string | text | attribution_properties | Most recent SRA when a first expansion closed. |
| Expansion Source | `fe_source` | string | text | attribution_properties | Most recent source when a first expansion deal was closed. |
| Has Attribution Data Hygiene Issues | `has_attribution_data_hygiene_issues` | enumeration | booleancheckbox | attribution_properties |  |
| Last Attribution Evaluation Date | `last_attribution_evaluation_date` | datetime | date | attribution_properties |  |
| Latest Offer Type History | `latest_offer_type_history` | enumeration | checkbox | attribution_properties | The offer types that a a contact has interacted with. |
| Latest Source History | `latest_source_history` | enumeration | checkbox | attribution_properties | A record of all sources that influenced a contact. |
| Latest Variant | `latest_variant` | string | text | attribution_properties |  |
| Lead Source (Open Text) | `lead_source__open_text_` | string | text | attribution_properties | Used to route Metadata leads properly. |
| Latest Lead Source Category | `lead_source_category` | enumeration | select | attribution_properties | The broader category that the lead source falls under. |
| Latest Medium | `medium` | string | text | attribution_properties | Most recent medium of this contact. |
| Opportunity Campaign | `oc_campaign` | string | text | attribution_properties | Most recent campaign when an opportunity was created. |
| Opportunity Lead Source Category | `oc_lead_source_category` | enumeration | select | attribution_properties | The broader category that the lead source falls under when an opportunity was created. |
| Opportunity Medium | `oc_medium` | string | text | attribution_properties | Most recent medium when an opportunity was created. |
| Opportunity Offer | `oc_offer` | string | text | attribution_properties | Most recent offer when an opportunity was created. |
| Opportunity Offer Type | `oc_offer_type` | enumeration | select | attribution_properties | The offer type engaged with when an opportunity was created. |
| Opportunity Self-Reported Attribution | `oc_self_reported_attribution` | string | text | attribution_properties |  |
| Opportunity Source | `oc_source` | string | text | attribution_properties | Most recent source when an opportunity was created. |
| Offer | `offer` | string | text | attribution_properties | Most recent offer for this contact. |
| Latest Offer Type | `offer_type` | enumeration | select | attribution_properties |  |
| Open House Interaction | `open_house_interaction` | enumeration | checkbox | attribution_properties | Registered for Open House |
| Original Lead Source Category | `original_lead_source_category` | enumeration | select | attribution_properties | The original broader category that the lead source falls under. |
| Original Offer Type | `original_offer_type` | enumeration | select | attribution_properties |  |
| Original Variant | `original_variant` | string | text | attribution_properties | The first variant that a contact interacted with. |
| Proposed Attribution Fix | `proposed_attribution_fix` | string | textarea | attribution_properties | What the attribution hygiene workflow recommends fixing. |
| Self-Reported Attribution | `self_reported_attribution` | string | text | attribution_properties | Most recent SRA for this contact. |
| Stat Latest Source | `stat_latest_source` | enumeration | select | attribution_properties |  |
| Stat Original Source | `stat_original_source` | enumeration | select | attribution_properties |  |
| utm_campaign | `utm_campaign` | string | text | attribution_properties |  |
| utm_content | `utm_content` | string | text | attribution_properties |  |
| utm_medium | `utm_medium` | string | text | attribution_properties |  |
| utm_offer | `utm_offer` | string | text | attribution_properties |  |
| utm_source | `utm_source` | string | text | attribution_properties |  |
| utm_term | `utm_term` | string | text | attribution_properties |  |
| Apollo Campaign | `apollo_campaign` | string | text | contactinformation |  |
| Area of Interest | `area_of_interest` | enumeration | checkbox | contactinformation | What interests you most about SyncTimes? |
| Conference Interactions | `conference_interactions` | enumeration | checkbox | contactinformation | Checkbox of conferences where we have interacted with this individual for tracking purposes |
| Corporate Phone | `corporate_phone` | string | phonenumber | contactinformation |  |
| CW Campaign | `cw_campaign` | string | text | contactinformation | Most recent campaign when a deal was won. |
| Deal Enablement Interaction | `deal_enablement_interaction` | enumeration | checkbox | contactinformation |  |
| Email Lists | `email_lists` | string | text | contactinformation |  |
| Email Marketing Interaction | `email_marketing_interaction` | enumeration | checkbox | contactinformation | Interaction with an email campaign |
| Extension | `extension` | number | number | contactinformation |  |
| Future Education | `future_education` | enumeration | checkbox | contactinformation |  |
| Gift Claimed Amount | `gift_claimed_amount` | number | number | contactinformation |  |
| Gift Claimed Timestamp | `gift_claimed_timestamp` | date | date | contactinformation |  |
| Gift Delivered Timestamp | `gift_delivered_timestamp` | date | date | contactinformation |  |
| Gift Opened Timestamp | `gift_opened_timestamp` | date | date | contactinformation | The time and date that a gift was opened. |
| Gift Sent Timestamp | `gift_sent_timestamp` | date | date | contactinformation |  |
| Gift Status | `gift_status` | enumeration | select | contactinformation |  |
| Gifting Campaign | `gifting_campaign` | enumeration | select | contactinformation | The Snappy campaign being used. |
| Has 70+ MQL Score | `has_70__mql_score` | enumeration | booleancheckbox | contactinformation |  |
| Influence Score | `influence_score` | number | number | contactinformation | Determined by job seniority, this is a 0-3 score that indicates how much influence a contact likely has. It is used for  |
| Interest | `interest` | string | textarea | contactinformation |  |
| Is Decision Maker Title | `is_decision_maker_title` | enumeration | booleancheckbox | contactinformation |  |
| Is Engaged Decision Maker | `is_engaged_decision_maker` | enumeration | booleancheckbox | contactinformation |  |
| IsWorkflowUpdatingLifecycle | `isworkflowupdatinglifecycle` | enumeration | select | contactinformation | if the lifecycle stage is being updated, this is locked on so the workflow does not end early |
| Job Title custom | `job_title` | string | text | contactinformation |  |
| Last Disco End Time | `last_disco_end_time` | datetime | date | contactinformation |  |
| Last NPS Comment | `last_nps_comment` | string | textarea | contactinformation |  |
| Last NPS Score | `last_nps_score` | number | number | contactinformation |  |
| Last NPS Survey Date_NEW | `last_nps_survey_date_new` | datetime | date | contactinformation |  |
| Latest Event Lead Interest | `latest_event_lead_interest` | enumeration | checkbox | contactinformation | Indicates what the contact is interested in from the event interaction. |
| Latest Event Lead Next Steps | `latest_event_lead_next_steps` | string | textarea | contactinformation | Next steps for following up with the lead captured at an event. |
| Latest Event Lead Notes | `latest_event_lead_notes` | string | textarea | contactinformation | Notes captured during the latest event lead interaction. |
| Latest Event Lead Type | `latest_event_lead_type` | enumeration | select | contactinformation | Categorizes the type of lead captured at an event. |
| Latest Event Lead User | `latest_event_lead_user` | string | text | contactinformation | The user who captured the latest event lead. |
| Lead Source | `leadsource` | enumeration | select | contactinformation | Where did this lead/contact come from? How did we find them? |
| Marketing Test | `marketing_test` | enumeration | checkbox | contactinformation |  |
| Mobly Temperature | `mobly_temperature` | enumeration | checkbox | contactinformation | For leads scanned at events. The temperate will determine how the leads are treated by sales team in post conference fol |
| My Chosen Saturday Activity | `my_chosen_saturday_activity` | enumeration | checkbox | contactinformation |  |
| Name | `name` | string | text | contactinformation |  |
| Needs Attribution Evaluation | `needs_attribution_evaluation` | enumeration | booleancheckbox | contactinformation | Set by workflow when attribution-related fields have changed. |
| NeedsOnboardingSurvey | `needsonboardingsurvey` | string | text | contactinformation |  |
| Notes_Use | `notes_use` | string | textarea | contactinformation |  |
| Number of active associated leads | `number_of_active_associated_leads` | number | calculation_rollup | contactinformation |  |
| Number of guests | `number_of_guests` | number | number | contactinformation |  |
| Preferred Date | `preferred_date` | date | date | contactinformation |  |
| Preferred Demo Time | `preferred_demo_time` | enumeration | checkbox | contactinformation |  |
| Preferred Time | `preferred_time` | string | text | contactinformation |  |
| Primary Contact | `primary_contact` | enumeration | booleancheckbox | contactinformation |  |
| Prospecting Interactions | `prospecting_interaction` | enumeration | checkbox | contactinformation |  |
| Sales Ownership | `sales_ownership` | enumeration | select | contactinformation |  |
| Sales Team Member | `sales_team_member` | enumeration | select | contactinformation |  |
| Stat Squad Request | `stat_squad_request` | string | textarea | contactinformation |  |
| SyncTimes Competition Participant | `synctimes_competition_participant` | enumeration | booleancheckbox | contactinformation |  |
| SyncTimes User Id | `synctimes_user_id` | string | text | contactinformation | user id from SyncTimes |
| Testimonial Identified | `testimonial_identified` | string | text | contactinformation | Populated by Grain when a good quote is identified. |
| Testimonial Text | `testimonial_text` | string | textarea | contactinformation | AI-extracted testimonial from call transcript. |
| Type of Covered Entity | `type_of_covered_entity` | enumeration | select | contactinformation |  |
| Webinar Interactions | `webinar_interaction` | enumeration | checkbox | contactinformation | Which Webinars were they interacting with us on? |
| Webinar Requested | `webinar_requested` | enumeration | select | contactinformation |  |
| Weighted Engagement | `weighted_engagement` | number | calculation_equation | contactinformation | The overall engagement of a contact, factoring in their seniority and their engagement score from our lead scoring model |
| Contrast confirmed email | `contrast_confirmed_email` | bool | booleancheckbox | contrast | Contact email confirmation status |
| Contrast created contact | `contrast_created_contact` | bool | booleancheckbox | contrast | The contact has been created by Contrast |
| Contrast join date | `contrast_join_date` | date | date | contrast | Date contact registered on Contrast |
| Contrast last activity date | `contrast_last_activity_date` | date | date | contrast | Last registration/view date on Contrast |
| Contrast last event date | `contrast_last_event_date` | datetime | date | contrast | Date of the last event for the contact |
| Contrast last registration | `contrast_last_registration` | string | text | contrast | Last event registration on Contrast. |
| Contrast last registration date | `contrast_last_registration_date` | date | date | contrast | Date of the last event registration |
| Contrast last registration slug | `contrast_last_registration_slug` | string | text | contrast | Last event registration slug on Contrast. |
| Contrast live views | `contrast_live_views` | number | number | contrast | Number of times contact watched a live on Contrast |
| Contrast original campaign | `contrast_original_campaign` | string | text | contrast | utm_campaign value when contact registered on Contrast |
| Contrast original content | `contrast_original_content` | string | text | contrast | utm_content value when contact registered on Contrast |
| Contrast original medium | `contrast_original_medium` | string | text | contrast | utm_medium value when contact registered on Contrast |
| Contrast original source | `contrast_original_source` | string | text | contrast | utm_source value when contact registered on Contrast |
| Contrast original term | `contrast_original_term` | string | text | contrast | utm_term value when contact registered on Contrast |
| Contrast original video | `contrast_original_video` | string | text | contrast | First video watched on Contrast. |
| Contrast original video date | `contrast_original_video_date` | date | date | contrast | Date contact watched first video on Contrast |
| Contrast registrations | `contrast_registrations` | number | number | contrast | Number of times contact registered to watch a video on Contrast. |
| Contrast replay views | `contrast_replay_views` | number | number | contrast | Number of times contact watched a replay on Contrast. |
| Demo Source | `dc_source` | string | text | conversioninformation | Most recent source when a first demo was scheduled. |
| SyncTimes Entered MQL Date | `synctimes_entered_mql_date` | date | calculation_equation | conversioninformation |  |
| SyncTimes Entered SQL Date | `synctimes_entered_sql_date` | date | calculation_equation | conversioninformation |  |
| Emails Opened | `emails_opened` | number | number | emailinformation |  |
| Emails Received | `emails_received` | number | number | emailinformation |  |
| Event Lead Capture Notes | `event_leadcapture_notes` | string | text | event_hapily_triggers | Use this property on your event lead capture forms to capture notes. The "Create Event Lead" workflow action will copy t |
| Event Lead Capture Trigger | `event_leadcapture_trigger` | string | text | event_hapily_triggers | When a Event Record ID is placed into this field (usually via a hidden form field) event•hapily will create an Event Lea |
| Event Registration Trigger | `event_registration_trigger` | string | text | event_hapily_triggers | When an Event Record ID is placed into this field (usually via a hidden form field) event•hapily will create a registrat |
| hapily Registration Trigger | `hapily_registration_trigger` | string | text | event_hapily_triggers | Use to trigger a registration for an event or session depending on the options set. |
| Number Of Hapily Event Interactions | `number_of_hapily_event_interactions` | number | calculation_rollup | event_hapily_triggers | The number of conferences / tradeshows / summits that this contact has registered for or been scanned at. |
| Session Registration Trigger | `session_registration_trigger` | string | text | event_hapily_triggers | When a Session Record ID is placed into this field (usually via a hidden form field) event•hapily will create a registra |
| LINKEDIN_PROFILE_LINK | `linkedin_profile_link` | string | text | lead_ads | Lead Ad Properties |
| First Meeting Created Date | `first_meeting_booked_date` | date | date | meeting_info | The date that a contact's Meeting Status changed to Meeting Booked. |
| Meeting Attended Date | `meeting_attended_date` | date | date | meeting_info | The date that a prospect attended its first meeting. Note: this is the day they attended the meeting, not the day the me |
| Meeting No-Show Date | `meeting_no_show_date` | date | date | meeting_info | The date that a contact no-showed a meeting. Note: this is the day the Meeting Status property changed to No-Show, it's  |
| Meeting Status | `meeting_status` | enumeration | select | meeting_info |  |
| # Of Sales Meetings Held | `of_sales_meetings_held` | number | number | meeting_info | The number of sales meetings that a prospect has attended. |
| Mobly Date | `mobly_date` | datetime | date | mobly_ | Date of most recent Mobly scan. Allows sales team to sort by scan date.  |
| Mobly Email | `mobly_email` | string | text | mobly_ |  |
| Mobly Event | `mobly_event` | string | text | mobly_ |  |
| Hapily Owner | `mobly_owner` | string | text | mobly_ |  |
| OrgChartHub Is On Org Chart | `orgcharthub_contact_on_orgchart` | enumeration | booleancheckbox | orgcharthub | Whether this person is included in an OrgChartHub Org Chart |
| Actively Working | `actively_working__c` | enumeration | booleancheckbox | salesforceinformation |  |
| Attended Feb 2021 Webinar | `attended_feb_2021_webinar__c` | enumeration | booleancheckbox | salesforceinformation |  |
| Biz Dev Lead | `biz_dev_lead__c` | enumeration | booleancheckbox | salesforceinformation |  |
| Engagement Rating | `engagement_rating__c` | enumeration | select | salesforceinformation |  |
| Follow Up? | `follow_up__c` | enumeration | booleancheckbox | salesforceinformation |  |
| IT Contact | `it_contact__c` | enumeration | booleancheckbox | salesforceinformation |  |
| Status | `leadstatus` | enumeration | select | salesforceinformation |  |
| Linkedin | `linkedin__c` | string | text | salesforceinformation |  |
| Marketing Emails | `marketing_emails__c` | enumeration | booleancheckbox | salesforceinformation |  |
| Next Steps | `next_steps__c` | string | textarea | salesforceinformation |  |
| Notes | `notes__c` | string | textarea | salesforceinformation |  |
| Notes History | `notes_history__c` | string | textarea | salesforceinformation |  |
| Employees | `numberofemployees` | number | number | salesforceinformation |  |
| Operations Lead | `operations_lead__c` | enumeration | booleancheckbox | salesforceinformation |  |
| Partner | `partner__c` | enumeration | select | salesforceinformation |  |
| Partnerx | `partnerx__c` | enumeration | select | salesforceinformation |  |
| Personal Outreach List | `personal_contact_recommended__c` | enumeration | booleancheckbox | salesforceinformation |  |
| Priority | `priority__c` | enumeration | select | salesforceinformation |  |
| Rating | `rating` | enumeration | select | salesforceinformation |  |
| Registered Lead Finder | `registered_lead_finder__c` | enumeration | select | salesforceinformation |  |
| Total Patients | `total_patients__c` | number | number | salesforceinformation |  |
| Company LinkedIn URL | `company_linkedin_url` | string | text | socialmediainformation | The LinkedIn URL of the contact's company. |
| Last Registered Marketing Opt-In | `last_registered_marketing_optin` | string | text | webinargeek |  |
| Last Registered Webinar Custom Link Source | `last_registered_webinar_custom_link_source` | string | text | webinargeek |  |
| Last Registered Webinar Date | `last_registered_webinar_date` | datetime | date | webinargeek |  |
| Last Registered Webinar Link | `last_registered_webinar_link` | string | text | webinargeek |  |
| Last Registered Webinar Local Datetime | `last_registered_webinar_local_datetime` | string | text | webinargeek |  |
| Last Registered Webinar Name | `last_registered_webinar_name` | string | text | webinargeek |  |
| Last Viewed Webinar Date | `last_viewed_webinar_date` | datetime | date | webinargeek |  |
| Last Viewed Webinar Name | `last_viewed_webinar_name` | string | text | webinargeek |  |
| Total attendance duration percentage before Attendance API migration | `initial_zoom_webinar_attendance_average_duration` | number | number | zoom | This property represent contact property value 'zoom_webinar_attendance_average_duration' before migration to Attendance |
| Average Zoom webinar attendance duration | `zoom_webinar_attendance_average_duration` | number | number | zoom | The average amount of time this contact attends your Zoom webinars. 100% would mean the contact stays until the end of e |
| Total number of Zoom webinars attended | `zoom_webinar_attendance_count` | number | number | zoom | Total number of Zoom webinars this contact has attended. |
| Last registered Zoom webinar | `zoom_webinar_joinlink` | string | text | zoom | The name of the last Zoom webinar this contact registered for. This property is updated every time they register for a n |
| Total number of Zoom webinar registrations | `zoom_webinar_registration_count` | number | number | zoom | Total number of Zoom webinars this contact has registered for. |

### HubSpot-Defined Properties (by Group)

<details><summary><strong>analyticsinformation</strong> (24 properties)</summary>

| Property Name | Internal Name | Type | Description |
|---|---|---|---|
| Average Pageviews | `hs_analytics_average_page_views` | number | The average number of pages a contact sees. This is automatically set by HubSpot for each contact. |
| First Referring Site | `hs_analytics_first_referrer` | string | The first website that referred a contact to your website. This is automatically set by HubSpot for  |
| Time First Seen | `hs_analytics_first_timestamp` | datetime | The first time a contact has been seen. This is automatically set by HubSpot for each contact. |
| First Touch Converting Campaign | `hs_analytics_first_touch_converting_campaign` | string | The campaign responsible for the first touch creation of this contact |
| First Page Seen | `hs_analytics_first_url` | string | The first page a contact saw on your website. This is automatically set by HubSpot for each contact. |
| Time of First Session | `hs_analytics_first_visit_timestamp` | datetime | The first time a contact visited your website. This is automatically set by HubSpot for each contact |
| Last Referring Site | `hs_analytics_last_referrer` | string | The last website that referred a contact to your website. This is automatically set by HubSpot for e |
| Time Last Seen | `hs_analytics_last_timestamp` | datetime | The last time and date a contact has viewed a page on your website. |
| Last Touch Converting Campaign | `hs_analytics_last_touch_converting_campaign` | string | The campaign responsible for the last touch creation of this contact |
| Last Page Seen | `hs_analytics_last_url` | string | The last page a contact saw on your website. This is automatically set by HubSpot for each contact. |
| Time of Last Session | `hs_analytics_last_visit_timestamp` | datetime | The last time and date a contact visited your website. |
| Number of event completions | `hs_analytics_num_event_completions` | number | The sum of all events a contact has experienced. This is automatically set by HubSpot for each conta |
| Number of Pageviews | `hs_analytics_num_page_views` | number | The sum of all pages a contact has seen on your website. This is automatically set by HubSpot for ea |
| Number of Sessions | `hs_analytics_num_visits` | number | The sum of all sessions a contact has made to your website. This is automatically set by HubSpot for |
| Event Revenue | `hs_analytics_revenue` | number | Event revenue can be set on a contact though HubSpot's enterprise Events. http://help.hubspot.com/ar |
| Original Source | `hs_analytics_source` | enumeration | First known source the contact used to find your website. Set automatically, but may be updated manu |
| Original Traffic Source Composite Data | `hs_analytics_source_composite_data` | string | Represents a composite view of hs_analytics_source, hs_analytics_source_data_1 and hs_analytics_sour |
| Original Source Drill-Down 1 | `hs_analytics_source_data_1` | string | Additional information about the source through which a contact first found your website. This prope |
| Original Source Drill-Down 2 | `hs_analytics_source_data_2` | string | Additional information about the source through which a contact first found your website. This prope |
| Latest Traffic Source | `hs_latest_source` | enumeration | The source of the latest session for a contact |
| Latest Traffic Source Composite Data | `hs_latest_source_composite_data` | string | Represents the composite view of hs_latest_source, hs_latest_source_data_1 and hs_latest_source_data |
| Latest Traffic Source Drill-Down 1 | `hs_latest_source_data_1` | string | Additional information about the latest source for the last session the contact used to find your we |
| Latest Traffic Source Drill-Down 2 | `hs_latest_source_data_2` | string | Additional information about the source for the last session the contact used to find your website.  |
| Latest Traffic Source Date | `hs_latest_source_timestamp` | datetime | The time of the latest session for a contact |

</details>

<details><summary><strong>contactinformation</strong> (218 properties)</summary>

| Property Name | Internal Name | Type | Description |
|---|---|---|---|
| Street Address | `address` | string | A contact's street address, including apartment or unit # |
| Annual Revenue | `annualrevenue` | string | Annual company revenue |
| Primary Associated Company ID | `associatedcompanyid` | number | HubSpot defined ID of a contact's primary associated company in HubSpot. |
| Associated Company Last Updated | `associatedcompanylastupdated` | number | This field is meaningless on its own, and is solely used for triggering dynamic list updates when a  |
| City | `city` | string | A contact's city of residence |
| Close Date | `closedate` | datetime | The date that a contact became a customer. This property is set automatically by HubSpot when a deal |
| Company Name | `company` | string | The name of the contact's company. This is separate from the Name property of the contact's associat |
| Company size | `company_size` | string | A contact's company size. This property is required for the Facebook Ads Integration. This property  |
| Country/Region | `country` | string | The contact's country/region of residence. This might be set via import, form, or integration. |
| Create Date | `createdate` | datetime | The date that a contact entered the system |
| Date of birth | `date_of_birth` | string | A contact's date of birth. This property is required for the Facebook Ads Integration. This property |
| Days To Close | `days_to_close` | number | The days that elapsed from when a contact was created until they closed as a customer. This is set a |
| Degree | `degree` | string | A contact's degree. This property is required for the Facebook Ads Integration. This property will b |
| Email | `email` | string | A contact's email address |
| Fax Number | `fax` | string | A contact's primary fax number |
| Field of study | `field_of_study` | string | A contact's field of study. This property is required for the Facebook Ads Integration. This propert |
| Total Contact Score | `firmo_behavioral_contact_score` | number |  |
| Contact Score engagement | `firmo_behavioral_contact_score_engagement` | number |  |
| Contact Score fit | `firmo_behavioral_contact_score_fit` | number |  |
| First Opportunity Created Date | `first_deal_created_date` | datetime | The date the first deal for a contact was created. This is automatically set by HubSpot and can be u |
| First Name | `firstname` | string | A contact's first name |
| Gender | `gender` | string |  |
| Graduation date | `graduation_date` | string | A contact's graduation date. This property is required for the Facebook Ads Integration. This proper |
| Additional email addresses | `hs_additional_emails` | enumeration | A set of additional email addresses for a contact |
| All teams | `hs_all_accessible_team_ids` | enumeration | The team IDs, including the team hierarchy, of all default and custom owner properties for this reco |
| Brands | `hs_all_assigned_business_unit_ids` | enumeration | The brands this record is assigned to. |
| All vids for a contact | `hs_all_contact_vids` | enumeration | A set of all vids, canonical or otherwise, for a contact |
| All owner IDs | `hs_all_owner_ids` | enumeration | Values of all default and custom owner properties for this record. |
| All team IDs | `hs_all_team_ids` | enumeration | The team IDs of all default and custom owner properties for this record. |
| Associated Target Accounts | `hs_associated_target_accounts` | number | The number of target accounts associated with this contact |
| Avatar FileManager key | `hs_avatar_filemanager_key` | string | The path in the FileManager CDN for this contact's avatar override image. Automatically set by HubSp |
| Buying Role | `hs_buying_role` | enumeration | The role that a contact plays during the sales process. Contacts can have more than one role, and th |
| The 800 most recent form submissions for a contact | `hs_calculated_form_submissions` | enumeration | The 800 most recent form submissions for a contact |
| Merged vids with timestamps of a contact | `hs_calculated_merged_vids` | enumeration | Merged vids with timestamps of a contact |
| Calculated Mobile Number in International Format | `hs_calculated_mobile_number` | string | Mobile number in international format |
| Calculated Phone Number in International Format | `hs_calculated_phone_number` | string | Phone number in international format |
| Calculated Phone Number Area Code | `hs_calculated_phone_number_area_code` | string | Area Code of the calculated phone number |
| Calculated Phone Number Country Code | `hs_calculated_phone_number_country_code` | string | Country code of the calculated phone number |
| Calculated Phone Number Region | `hs_calculated_phone_number_region_code` | string | ISO2 Country code for the derived phone number |
| Contact creation legal basis source instance ID | `hs_contact_creation_legal_basis_source_instance_id` | string | The source instance responsible for creating this contact and determining the legal basis for proces |
| Enrichment opt out | `hs_contact_enrichment_opt_out` | bool |  |
| Enrichment opt out timestamp | `hs_contact_enrichment_opt_out_timestamp` | datetime | Timestamp of when the contact opted out of being included in the HubSpot Enrichment database |
| Member email | `hs_content_membership_email` | string | Email used to send private content information to members |
| Email Confirmed | `hs_content_membership_email_confirmed` | bool | Email Confirmation status of user of Content Membership |
| Time enrolled in registration follow up emails | `hs_content_membership_follow_up_enqueued_at` | datetime | The time when the contact was first enrolled in the registration follow up email flow |
| Membership Notes | `hs_content_membership_notes` | string | The notes relating to the contact's content membership. |
| Registered At | `hs_content_membership_registered_at` | datetime | Datetime at which this user was set up for Content Membership |
| Domain to which registration email was sent | `hs_content_membership_registration_domain_sent_to` | string | Domain to which the registration invitation email for Content Membership was sent to |
| Time registration email was sent | `hs_content_membership_registration_email_sent_at` | datetime | Datetime at which this user was sent a registration invitation email for Content Membership |
| Status | `hs_content_membership_status` | enumeration | The status of the contact's content membership. |
| Conversations visitor email | `hs_conversations_visitor_email` | string | A Conversations visitor's email address |
| Count of unengaged contacts | `hs_count_is_unworked` | number | if contact is assigned and unworked, set to 1. if contact is assigned and worked, set to 0. |
| Count of engaged contacts | `hs_count_is_worked` | number | if contact is assigned and worked, set to 1. if contact is assigned and unworked, set to 0. |
| Country/Region Code | `hs_country_region_code` | string | The contact's two-letter country code. |
| Created By Conversations | `hs_created_by_conversations` | bool | Flag indicating this contact was created by the Conversations API |
| Created by user ID | `hs_created_by_user_id` | number | The user who created this record. This value is set automatically by HubSpot. |
| Object create date/time | `hs_createdate` | datetime | The date and time at which this object was created. This value is automatically set by HubSpot and m |
| Current Customer | `hs_current_customer` | enumeration | Indicates whether this record matches the portal's Current Customer filter criteria. Managed automat |
| Currently Enrolled in Prospecting Agent | `hs_currently_enrolled_in_prospecting_agent` | bool | Indicates whether or not the contact has an active prospecting agent enrollment |
| Customer Agent Lead Status | `hs_customer_agent_lead_status` | enumeration | The lead status determined by Customer Agent. This also indicates the level of qualification. |
| Ads Consent from Forms | `hs_data_privacy_ads_consent` | bool | This property captures ads consents from forms and is used by consentmanager to create / update asso |
| Recent Document Revisit Date | `hs_document_last_revisited` | datetime | The last time a shared document (presentation) was accessed by this contact |
| Email Domain | `hs_email_domain` | string | A contact's email address domain |
| Last CSAT survey date | `hs_feedback_last_csat_survey_date` | datetime | The time that this contact last submitted a CSAT survey response. This is automatically set by HubSp |
| Last CSAT survey comment | `hs_feedback_last_csat_survey_follow_up` | string | Last CSAT survey comment from this contact. |
| Last CSAT survey rating | `hs_feedback_last_csat_survey_rating` | number | Last CSAT survey rating from this contact. |
| Last NPS survey comment | `hs_feedback_last_nps_follow_up` | string | Last NPS survey comment that this contact gave |
| Last NPS survey rating | `hs_feedback_last_nps_rating` | enumeration | Last NPS survey rating that this contact gave |
| Latest NPS survey rating | `hs_feedback_last_nps_rating_number` | number | Latest NPS survey rating that this contact gave |
| Last NPS survey date | `hs_feedback_last_survey_date` | datetime | The time that this contact last submitted a NPS survey response. This is automatically set by HubSpo |
| Should be shown an NPS web survey | `hs_feedback_show_nps_web_survey` | bool | Whether or not a contact should be shown an NPS web survey. This is automatically set by HubSpot. |
| ID of first engagement | `hs_first_engagement_object_id` | number | The object id of the current contact owner's first engagement with the contact. |
| First outreach date | `hs_first_outreach_date` | datetime | The date of the first outreach (call, email, meeting or other communication) from a sales rep to the |
| First subscription create date | `hs_first_subscription_create_date` | datetime | The create date of the first subscription by the contact. |
| Full name or email | `hs_full_name_or_email` | string | A contact's full name, formatting first name and last name by I18n/utils/formatName, fall back to em |
| GPS Error | `hs_gps_error` | string | Specifies any errors that may have occurred while geocoding a contact. |
| Latitudes | `hs_gps_latitude` | string | A contact's latitude |
| Longitudes | `hs_gps_longitude` | string | A contact's longitude |
| Contact has an active subscription | `hs_has_active_subscription` | number | The rollup property value is 1 when the contact has an active Subscription or 0 otherwise. |
| Inferred Language Codes | `hs_inferred_language_codes` | enumeration | Inferred languages based on location.  ISO 639-1 |
| Intent paid up to date | `hs_intent_paid_up_to_date` | date | The date up until this object has had intent monitoring paid for. Only set and updated if intent mon |
| Intent Signals active | `hs_intent_signals_enabled` | bool | Indicates whether intent signal tracking is currently active for this record |
| Is a contact | `hs_is_contact` | bool | Is a contact, has not been deleted and is not a visitor |
| Has been enriched | `hs_is_enriched` | bool | Indicates whether this object has ever had enriched properties written to it. |
| Is Merge Revertible | `hs_is_merge_revertible` | bool | Whether or not a Contact was yielded from a merge that is revertible. |
| Contact unworked | `hs_is_unworked` | bool | Contact has not been assigned or has not been engaged after last owner assignment/re-assignment |
| Journey Stage | `hs_journey_stage` | enumeration | Track the status of a contact through a customer journey. It can be set through journeys, manually o |
| Preferred language | `hs_language` | enumeration | Set your contact's preferred language for communications. This property can be changed from an impor |
| Last Metered Enrichment Timestamp | `hs_last_metered_enrichment_timestamp` | datetime | The timestamp of the most recent enrichment to this object via Breeze Intelligence |
| last sales activity date old | `hs_last_sales_activity_date` | datetime | The date of the last sales activity with the contact. This property is set automatically by HubSpot. |
| Last Engagement Date | `hs_last_sales_activity_timestamp` | datetime | The last time a contact engaged with your site or a form, document, meetings link, or tracked email. |
| Last Engagement Type | `hs_last_sales_activity_type` | enumeration | The type of the last engagement a contact performed. This doesn't include marketing emails or emails |
| Object last modified date/time | `hs_lastmodifieddate` | datetime | Most recent timestamp of any property update for this contact. This includes HubSpot internal proper |
| Latest Disqualified Lead Date | `hs_latest_disqualified_lead_date` | datetime | The most recent time at which an associated lead currently in a disqualified stage was moved to that |
| Latest meeting activity | `hs_latest_meeting_activity` | datetime | The date of the most recent meeting (past or upcoming) logged for, scheduled with, or booked by this |
| Latest Open Lead Date | `hs_latest_open_lead_date` | datetime | The most recent time an associated open lead was moved to a NEW or IN_PROGRESS state |
| Latest Qualified Lead Date | `hs_latest_qualified_lead_date` | datetime | The most recent time at which an associated lead currently in a qualified stage was moved to that st |
| Last sequence ended date | `hs_latest_sequence_ended_date` | datetime | The last sequence ended date. |
| Last sequence enrolled | `hs_latest_sequence_enrolled` | number | The last sequence enrolled. |
| Last sequence enrolled date | `hs_latest_sequence_enrolled_date` | datetime | The last sequence enrolled date. |
| Last sequence finished date | `hs_latest_sequence_finished_date` | datetime | The last sequence finished date. |
| Last sequence unenrolled date | `hs_latest_sequence_unenrolled_date` | datetime | The last sequence unenrolled date. |
| Latest subscription create date | `hs_latest_subscription_create_date` | datetime | The create date of the latest subscription by the contact. |
| Latitude | `hs_latitude` | number | A contact's latitude |
| Lead Status | `hs_lead_status` | enumeration | The contact's sales, prospecting or outreach status |
| Legal basis for processing contact's data | `hs_legal_basis` | enumeration | Legal basis for processing contact's data; 'Not applicable' will exempt the contact from GDPR protec |
| Live enrichment deadline | `hs_live_enrichment_deadline` | datetime | Deadline for freshly sourced enrichment data to be applied and cause a credit metering |
| Longitude | `hs_longitude` | number | A contact's longitude |
| Manual campaign ids | `hs_manual_campaign_ids` | number | The campaign object ids of contacts manually associated to campaigns |
| Marketing contact status source name | `hs_marketable_reason_id` | string | The ID of the activity that set the contact as a marketing contact |
| Marketing contact status source type | `hs_marketable_reason_type` | enumeration | The type of the activity that set the contact as a marketing contact |
| Marketing contact status | `hs_marketable_status` | enumeration | The marketing status of a contact |
| Marketing contact until next update | `hs_marketable_until_renewal` | enumeration | Specifies if this contact will be set as non-marketing on renewal |
| Membership last private content access date | `hs_membership_last_private_content_access_date` | datetime | The last date a contact accessed private content |
| Merged Contact IDs | `hs_merged_object_ids` | enumeration | The list of Contact record IDs that have been merged into this Contact. This value is set automatica |
| Mobile Sdk Push Tokens | `hs_mobile_sdk_push_tokens` | string | This property is used to capture the push notification token for use on the LiveChat mobile sdk. We  |
| Last Activity | `hs_notes_last_activity` | object_coordinates | The coordinates of the last activity for a contact. This is set automatically by HubSpot based on us |
| Next Activity | `hs_notes_next_activity` | object_coordinates | The coordinates of the next upcoming activity for a contact. This is set automatically by HubSpot ba |
| Next Activity Type | `hs_notes_next_activity_type` | enumeration | The type of the next upcoming activity for a contact. This is set automatically by HubSpot based on  |
| Record ID | `hs_object_id` | number | The unique ID for this record. This value is set automatically by HubSpot. |
| Record creation source | `hs_object_source` | string | Raw internal PropertySource present in the RequestMeta when this record was created. |
| Record source detail 1 | `hs_object_source_detail_1` | string | First level of detail on how this record was created. |
| Record source detail 2 | `hs_object_source_detail_2` | string | Second level of detail on how this record was created. |
| Record source detail 3 | `hs_object_source_detail_3` | string | Third level of detail on how this record was created. |
| Record creation source ID | `hs_object_source_id` | string | Raw internal sourceId present in the RequestMeta when this record was created. |
| Record source | `hs_object_source_label` | enumeration | How this record was created. |
| Record creation source user ID | `hs_object_source_user_id` | number | Raw internal userId present in the RequestMeta when this record was created. |
| Owning Teams | `hs_owning_teams` | enumeration | The teams that are attributed to this record. |
| Persona | `hs_persona` | enumeration | A contact's persona |
| Pinned engagement ID | `hs_pinned_engagement_id` | number | The object ID of the current pinned engagement. This will only be shown if there is already an assoc |
| Pipeline | `hs_pipeline` | enumeration | The pipeline with which this contact is currently associated |
| Predictive Lead Score | `hs_predictivecontactscore` | number | A score calculated by HubSpot that represents a contact's likelihood to become a customer |
| Likelihood to close | `hs_predictivecontactscore_v2` | number | The probability that a contact will become a customer within the next 90 days. This score is based o |
| Lead Rating | `hs_predictivecontactscorebucket` | enumeration | The rating of this contact based on their predictive lead score |
| Contact priority | `hs_predictivescoringtier` | enumeration | A ranking system of contacts evenly assigned into four tiers. Contacts in tier one are more likely t |
| Prospecting Agent Actively Enrolled Count | `hs_prospecting_agent_actively_enrolled_count` | number | The number of active prospecting agent enrollments this contact has. This should be either 0 or 1 |
| Prospecting Agent Last Enrolled | `hs_prospecting_agent_last_enrolled` | datetime | The last time the Prospecting Agent enrolled this contact |
| Prospecting Agent Total Enrolled Count | `hs_prospecting_agent_total_enrolled_count` | number |  |
| Read only object | `hs_read_only` | bool | Determines whether a record can be edited by a user. |
| Registration Method | `hs_registration_method` | string | The method used for registration |
| Employment Role | `hs_role` | enumeration | Job role |
| Date of first engagement | `hs_sa_first_engagement_date` | datetime | The date the current contact owner first engaged with the contact. |
| Description of first engagement | `hs_sa_first_engagement_descr` | enumeration | A description of the current contact owner's first engagement with the contact. |
| Type of first engagement | `hs_sa_first_engagement_object_type` | enumeration | The object type of the current contact owner's first engagement with the contact. |
| Recent Sales Email Clicked Date | `hs_sales_email_last_clicked` | datetime | The last time a tracked sales email was clicked by this user |
| Recent Sales Email Opened Date | `hs_sales_email_last_opened` | datetime | The last time a tracked sales email was opened by this contact. This property does not update for em |
| Recent Sales Email Replied Date | `hs_sales_email_last_replied` | datetime | The most recent email from this contact that was received and logged by HubSpot. This value is autom |
| Calculated Mobile Number with country code | `hs_searchable_calculated_international_mobile_number` | phone_number | Mobile number with country code |
| Calculated Phone Number with country code | `hs_searchable_calculated_international_phone_number` | phone_number | Phone number with country code |
| Calculated Mobile Number without country code | `hs_searchable_calculated_mobile_number` | phone_number | Mobile number without country code |
| Calculated Phone Number without country code | `hs_searchable_calculated_phone_number` | phone_number | Phone number without country code |
| Employment Seniority | `hs_seniority` | enumeration | Job Seniority |
| Number of sequences actively enrolled | `hs_sequences_actively_enrolled_count` | number | The number of sequences actively enrolled. |
| Number of sequences enrolled | `hs_sequences_enrolled_count` | number | The number of sequences enrolled. |
| Currently in Sequence | `hs_sequences_is_enrolled` | bool | A yes/no field that indicates whether the contact is currently in a Sequence. |
| Shared teams | `hs_shared_team_ids` | enumeration | Additional teams whose users can access the Contact based on their permissions. This can be set manu |
| Shared users | `hs_shared_user_ids` | enumeration | Additional users that can access the Contact based on their permissions. This can be set manually or |
| Source Object ID | `hs_source_object_id` | number | The ID of the object from which the data was migrated. This is set automatically during portal data  |
| Source Portal ID | `hs_source_portal_id` | number | The ID of the portal from which the data was migrated. This is set automatically during portal data  |
| State/Region Code | `hs_state_code` | string | The contact's state or region code. |
| Employment Sub Role | `hs_sub_role` | enumeration | Job sub role |
| testpurge | `hs_testpurge` | string | testing purge |
| testrollback | `hs_testrollback` | string | testing rollback |
| Time between contact creation and Opportunity close | `hs_time_between_contact_creation_and_deal_close` | number |  |
| Time between contact creation and Opportunity creation | `hs_time_between_contact_creation_and_deal_creation` | number |  |
| Lead response time | `hs_time_to_first_engagement` | number | The time it took the current owner to perform a qualifying action on the contact. Qualifying actions |
| Time to move from lead to customer | `hs_time_to_move_from_lead_to_customer` | number |  How long it takes for a contact to move from the HubSpot lead stage to the HubSpot customer stage. |
| Time to move from marketing qualified lead to customer | `hs_time_to_move_from_marketingqualifiedlead_to_customer` | number |  How long it takes for a contact to move from the HubSpot marketing qualified lead stage to the HubS |
| Time to move from opportunity to customer | `hs_time_to_move_from_opportunity_to_customer` | number |  How long it takes for a contact to move from the HubSpot opportunity stage to the HubSpot customer  |
| Time to move from sales qualified lead to customer | `hs_time_to_move_from_salesqualifiedlead_to_customer` | number |  How long it takes for a contact to move from the HubSpot sales qualified lead stage to the HubSpot  |
| Time to move from subscriber to customer | `hs_time_to_move_from_subscriber_to_customer` | number |  How long it takes for a contact to move from the HubSpot subscriber stage to the HubSpot customer s |
| Time Zone | `hs_timezone` | enumeration | The contact’s time zone. This can be set automatically by HubSpot based on other contact properties. |
| Unique creation key | `hs_unique_creation_key` | string | Unique property used for idempotent creates |
| Updated by user ID | `hs_updated_by_user_id` | number | The user who last updated this record. This value is set automatically by HubSpot. |
| User IDs of all notification followers | `hs_user_ids_of_all_notification_followers` | enumeration | The user IDs of all users that have clicked follow within the object to opt-in to getting follow not |
| User IDs of all notification unfollowers | `hs_user_ids_of_all_notification_unfollowers` | enumeration | The user IDs of all object owners that have clicked unfollow within the object to opt-out of getting |
| User IDs of all owners | `hs_user_ids_of_all_owners` | enumeration | The user IDs of all owners of this record. |
| Performed in an import | `hs_was_imported` | bool | Object is part of an import |
| WhatsApp Phone Number | `hs_whatsapp_phone_number` | string | The phone number associated with the contact’s WhatsApp account. |
| Owner assigned date | `hubspot_owner_assigneddate` | datetime | The most recent timestamp of when an owner was assigned to this record. This value is set automatica |
| Contact owner | `hubspot_owner_id` | enumeration | The owner of a contact. This can be any HubSpot user or Salesforce integration user, and can be set  |
| HubSpot Team | `hubspot_team_id` | enumeration | The team of the owner of a contact. |
| HubSpot Score | `hubspotscore` | number | The number that shows qualification of contacts to sales readiness. It can be set in HubSpot's Lead  |
| Industry | `industry` | string | The industry a contact is in |
| Job function | `job_function` | string | A contact's job function. This property is required for the Facebook Ads Integration. This property  |
| Job Title | `jobtitle` | string | A contact's job title |
| Last Modified Date | `lastmodifieddate` | datetime | The date any property on this contact was modified |
| Last Name | `lastname` | string | A contact's last name |
| Lifecycle Stage | `lifecyclestage` | enumeration | The qualification of contacts to sales readiness. It can be set through imports, forms, workflows, a |
| Marital Status | `marital_status` | string | A contact's marital status. This property is required for the Facebook Ads Integration. This propert |
| Message | `message` | string | A default property to be used for any message or comments a contact may want to leave on a form. |
| Military status | `military_status` | string | A contact's military status. This property is required for the Facebook Ads Integration. This proper |
| Mobile Phone Number | `mobilephone` | string | A contact's mobile phone number |
| Last Contacted | `notes_last_contacted` | datetime | The last time a call, email, or meeting was logged for a contact. This is set automatically by HubSp |
| Last Activity Date | `notes_last_updated` | datetime | The last time a note, call, email, meeting, or task was logged for a contact. This is set automatica |
| Next Activity Date | `notes_next_activity_date` | datetime | The date of the next upcoming activity for a contact. This is set automatically by HubSpot based on  |
| Number of Associated Opportunities | `num_associated_deals` | number | The number of deals associated with this contact. This is set automatically by HubSpot. |
| Number of times contacted | `num_contacted_notes` | number | The number of times a call, email, or meeting was logged for a contact. This is set automatically by |
| Number of Sales Activities | `num_notes` | number | The number of sales activities for a contact. This is set automatically by HubSpot based on user act |
| Number of Employees | `numemployees` | enumeration | The number of company employees |
| HubSpot Owner Email (legacy) | `owneremail` | string | A legacy property used to identify the email address of the owner of the contact. This property is n |
| HubSpot Owner Name (legacy) | `ownername` | string | A legacy property used to identify the name of the owner of the contact. This property is no longer  |
| Phone Number | `phone` | string | A contact's primary phone number |
| Recent Opportunity Amount | `recent_deal_amount` | number | The amount of the last closed won deal associated with a contact. This is set automatically by HubSp |
| Recent Opportunity Close Date | `recent_deal_close_date` | datetime | The date that the last deal associated with a contact was won. This is automatically set by HubSpot  |
| Relationship Status | `relationship_status` | string | A contact's relationship status. This property is required for the Facebook Ads Integration. This pr |
| Salutation | `salutation` | string | The title used to address a contact |
| School | `school` | string | A contact's school. This property is required for the Facebook Ads Integration. This property will b |
| Seniority | `seniority` | string | A contact's seniority. This property is required for the Facebook Ads Integration. This property wil |
| Start date | `start_date` | string | A contact's start date. This property is required for the Facebook Ads Integration. This property wi |
| State/Region | `state` | string | The contact's state of residence. This might be set via import, form, or integration. |
| SurveyMonkey Event Last Updated | `surveymonkeyeventlastupdated` | number | This field is meaningless on its own, and is solely used for triggering dynamic list updates when Su |
| Total Revenue | `total_revenue` | number | The sum from all closed won deal revenue associated with a contact. This is automatically set by Hub |
| Twitter Username | `twitterhandle` | string | The contact's Twitter handle. |
| Webinar Event Last Updated | `webinareventlastupdated` | number | This field is meaningless on its own, and is solely used for triggering dynamic list updates when we |
| Website URL | `website` | string | The contact's company website |
| Work email | `work_email` | string | A contact's work email. This property is required for the Facebook Ads Integration. This property wi |
| Postal Code | `zip` | string | The contact's zip code. This might be set via import, form, or integration. |

</details>

<details><summary><strong>contactlcs</strong> (46 properties)</summary>

| Property Name | Internal Name | Type | Description |
|---|---|---|---|
| Cumulative time in "Lost - Churned (Lifecycle Stage Pipeline)" | `hs_v2_cumulative_time_in_1066237962` | number | The cumulative time in seconds spent by the contact in the 'Lost - Churned' stage, 'Lifecycle Stage  |
| Cumulative time in "Contact (Lifecycle Stage Pipeline)" | `hs_v2_cumulative_time_in_1077045801` | number | The cumulative time in seconds spent by the contact in the 'Contact' stage, 'Lifecycle Stage Pipelin |
| Cumulative time in "Partner (Lifecycle Stage Pipeline)" | `hs_v2_cumulative_time_in_953312771` | number | The cumulative time in seconds spent by the contact in the 'Partner' stage, 'Lifecycle Stage Pipelin |
| Cumulative time in "Customer (Lifecycle Stage Pipeline)" | `hs_v2_cumulative_time_in_customer` | number | The cumulative time in seconds spent by the contact in the 'Customer' stage, 'Lifecycle Stage Pipeli |
| Cumulative time in "Evangelist (Lifecycle Stage Pipeline)" | `hs_v2_cumulative_time_in_evangelist` | number | The cumulative time in seconds spent by the contact in the 'Evangelist' stage, 'Lifecycle Stage Pipe |
| Cumulative time in "Lead (Lifecycle Stage Pipeline)" | `hs_v2_cumulative_time_in_lead` | number | The cumulative time in seconds spent by the contact in the 'Lead' stage, 'Lifecycle Stage Pipeline'  |
| Cumulative time in "Marketing Qualified Lead (Lifecycle Stage Pipeline)" | `hs_v2_cumulative_time_in_marketingqualifiedlead` | number | The cumulative time in seconds spent by the contact in the 'Marketing Qualified Lead' stage, 'Lifecy |
| Cumulative time in "Opportunity (Lifecycle Stage Pipeline)" | `hs_v2_cumulative_time_in_opportunity` | number | The cumulative time in seconds spent by the contact in the 'Opportunity' stage, 'Lifecycle Stage Pip |
| Cumulative time in "Other (Lifecycle Stage Pipeline)" | `hs_v2_cumulative_time_in_other` | number | The cumulative time in seconds spent by the contact in the 'Other' stage, 'Lifecycle Stage Pipeline' |
| Cumulative time in "Sales Qualified Lead (Lifecycle Stage Pipeline)" | `hs_v2_cumulative_time_in_salesqualifiedlead` | number | The cumulative time in seconds spent by the contact in the 'Sales Qualified Lead' stage, 'Lifecycle  |
| Cumulative time in "Subscriber (Lifecycle Stage Pipeline)" | `hs_v2_cumulative_time_in_subscriber` | number | The cumulative time in seconds spent by the contact in the 'Subscriber' stage, 'Lifecycle Stage Pipe |
| Date entered "Lost - Churned (Lifecycle Stage Pipeline)" | `hs_v2_date_entered_1066237962` | datetime | The date and time when the contact entered the 'Lost - Churned' stage, 'Lifecycle Stage Pipeline' pi |
| Date entered "Contact (Lifecycle Stage Pipeline)" | `hs_v2_date_entered_1077045801` | datetime | The date and time when the contact entered the 'Contact' stage, 'Lifecycle Stage Pipeline' pipeline |
| Date entered "Partner (Lifecycle Stage Pipeline)" | `hs_v2_date_entered_953312771` | datetime | The date and time when the contact entered the 'Partner' stage, 'Lifecycle Stage Pipeline' pipeline |
| Date entered current stage | `hs_v2_date_entered_current_stage` | datetime | The date this object entered its current pipeline stage |
| Date entered "Customer (Lifecycle Stage Pipeline)" | `hs_v2_date_entered_customer` | datetime | The date and time when the contact entered the 'Customer' stage, 'Lifecycle Stage Pipeline' pipeline |
| Date entered "Evangelist (Lifecycle Stage Pipeline)" | `hs_v2_date_entered_evangelist` | datetime | The date and time when the contact entered the 'Evangelist' stage, 'Lifecycle Stage Pipeline' pipeli |
| Date entered "Lead (Lifecycle Stage Pipeline)" | `hs_v2_date_entered_lead` | datetime | The date and time when the contact entered the 'Lead' stage, 'Lifecycle Stage Pipeline' pipeline |
| Date entered "Marketing Qualified Lead (Lifecycle Stage Pipeline)" | `hs_v2_date_entered_marketingqualifiedlead` | datetime | The date and time when the contact entered the 'Marketing Qualified Lead' stage, 'Lifecycle Stage Pi |
| Date entered "Opportunity (Lifecycle Stage Pipeline)" | `hs_v2_date_entered_opportunity` | datetime | The date and time when the contact entered the 'Opportunity' stage, 'Lifecycle Stage Pipeline' pipel |
| Date entered "Other (Lifecycle Stage Pipeline)" | `hs_v2_date_entered_other` | datetime | The date and time when the contact entered the 'Other' stage, 'Lifecycle Stage Pipeline' pipeline |
| Date entered "Sales Qualified Lead (Lifecycle Stage Pipeline)" | `hs_v2_date_entered_salesqualifiedlead` | datetime | The date and time when the contact entered the 'Sales Qualified Lead' stage, 'Lifecycle Stage Pipeli |
| Date entered "Subscriber (Lifecycle Stage Pipeline)" | `hs_v2_date_entered_subscriber` | datetime | The date and time when the contact entered the 'Subscriber' stage, 'Lifecycle Stage Pipeline' pipeli |
| Date exited "Lost - Churned (Lifecycle Stage Pipeline)" | `hs_v2_date_exited_1066237962` | datetime | The date and time when the contact exited the 'Lost - Churned' stage, 'Lifecycle Stage Pipeline' pip |
| Date exited "Contact (Lifecycle Stage Pipeline)" | `hs_v2_date_exited_1077045801` | datetime | The date and time when the contact exited the 'Contact' stage, 'Lifecycle Stage Pipeline' pipeline |
| Date exited "Partner (Lifecycle Stage Pipeline)" | `hs_v2_date_exited_953312771` | datetime | The date and time when the contact exited the 'Partner' stage, 'Lifecycle Stage Pipeline' pipeline |
| Date exited "Customer (Lifecycle Stage Pipeline)" | `hs_v2_date_exited_customer` | datetime | The date and time when the contact exited the 'Customer' stage, 'Lifecycle Stage Pipeline' pipeline |
| Date exited "Evangelist (Lifecycle Stage Pipeline)" | `hs_v2_date_exited_evangelist` | datetime | The date and time when the contact exited the 'Evangelist' stage, 'Lifecycle Stage Pipeline' pipelin |
| Date exited "Lead (Lifecycle Stage Pipeline)" | `hs_v2_date_exited_lead` | datetime | The date and time when the contact exited the 'Lead' stage, 'Lifecycle Stage Pipeline' pipeline |
| Date exited "Marketing Qualified Lead (Lifecycle Stage Pipeline)" | `hs_v2_date_exited_marketingqualifiedlead` | datetime | The date and time when the contact exited the 'Marketing Qualified Lead' stage, 'Lifecycle Stage Pip |
| Date exited "Opportunity (Lifecycle Stage Pipeline)" | `hs_v2_date_exited_opportunity` | datetime | The date and time when the contact exited the 'Opportunity' stage, 'Lifecycle Stage Pipeline' pipeli |
| Date exited "Other (Lifecycle Stage Pipeline)" | `hs_v2_date_exited_other` | datetime | The date and time when the contact exited the 'Other' stage, 'Lifecycle Stage Pipeline' pipeline |
| Date exited "Sales Qualified Lead (Lifecycle Stage Pipeline)" | `hs_v2_date_exited_salesqualifiedlead` | datetime | The date and time when the contact exited the 'Sales Qualified Lead' stage, 'Lifecycle Stage Pipelin |
| Date exited "Subscriber (Lifecycle Stage Pipeline)" | `hs_v2_date_exited_subscriber` | datetime | The date and time when the contact exited the 'Subscriber' stage, 'Lifecycle Stage Pipeline' pipelin |
| Latest time in "Lost - Churned (Lifecycle Stage Pipeline)" | `hs_v2_latest_time_in_1066237962` | number | The total time in seconds spent by the contact in the 'Lost - Churned' stage, 'Lifecycle Stage Pipel |
| Latest time in "Contact (Lifecycle Stage Pipeline)" | `hs_v2_latest_time_in_1077045801` | number | The total time in seconds spent by the contact in the 'Contact' stage, 'Lifecycle Stage Pipeline' pi |
| Latest time in "Partner (Lifecycle Stage Pipeline)" | `hs_v2_latest_time_in_953312771` | number | The total time in seconds spent by the contact in the 'Partner' stage, 'Lifecycle Stage Pipeline' pi |
| Latest time in "Customer (Lifecycle Stage Pipeline)" | `hs_v2_latest_time_in_customer` | number | The total time in seconds spent by the contact in the 'Customer' stage, 'Lifecycle Stage Pipeline' p |
| Latest time in "Evangelist (Lifecycle Stage Pipeline)" | `hs_v2_latest_time_in_evangelist` | number | The total time in seconds spent by the contact in the 'Evangelist' stage, 'Lifecycle Stage Pipeline' |
| Latest time in "Lead (Lifecycle Stage Pipeline)" | `hs_v2_latest_time_in_lead` | number | The total time in seconds spent by the contact in the 'Lead' stage, 'Lifecycle Stage Pipeline' pipel |
| Latest time in "Marketing Qualified Lead (Lifecycle Stage Pipeline)" | `hs_v2_latest_time_in_marketingqualifiedlead` | number | The total time in seconds spent by the contact in the 'Marketing Qualified Lead' stage, 'Lifecycle S |
| Latest time in "Opportunity (Lifecycle Stage Pipeline)" | `hs_v2_latest_time_in_opportunity` | number | The total time in seconds spent by the contact in the 'Opportunity' stage, 'Lifecycle Stage Pipeline |
| Latest time in "Other (Lifecycle Stage Pipeline)" | `hs_v2_latest_time_in_other` | number | The total time in seconds spent by the contact in the 'Other' stage, 'Lifecycle Stage Pipeline' pipe |
| Latest time in "Sales Qualified Lead (Lifecycle Stage Pipeline)" | `hs_v2_latest_time_in_salesqualifiedlead` | number | The total time in seconds spent by the contact in the 'Sales Qualified Lead' stage, 'Lifecycle Stage |
| Latest time in "Subscriber (Lifecycle Stage Pipeline)" | `hs_v2_latest_time_in_subscriber` | number | The total time in seconds spent by the contact in the 'Subscriber' stage, 'Lifecycle Stage Pipeline' |
| Time in current stage | `hs_v2_time_in_current_stage` | datetime | The time this object has spent in the current pipeline stage |

</details>

<details><summary><strong>contactscripted</strong> (3 properties)</summary>

| Property Name | Internal Name | Type | Description |
|---|---|---|---|
| Lead Score Grade | `firmo_behavioral_contact_score_threshold` | enumeration | A = perfect fit \| 1 = perfect engagement |
| Member has accessed private content | `hs_membership_has_accessed_private_content` | number | 1 if a member has accessed any private content, 0 or null if not |
| Registered member | `hs_registered_member` | number | Whether or not a contact is registered |

</details>

<details><summary><strong>conversioninformation</strong> (24 properties)</summary>

| Property Name | Internal Name | Type | Description |
|---|---|---|---|
| First Conversion Date | `first_conversion_date` | datetime | The date this contact first submitted a form |
| First Conversion | `first_conversion_event_name` | string | The first form this contact submitted |
| Bing ad clicked | `hs_bing_ad_clicked` | bool | Indicates that this contact has previously landed on a HubSpot tracked webpage that had Bing trackin |
| Bing click id | `hs_bing_click_id` | string | The msclkid url parameter extracted from the Activity recorded when a visitor lands on a tracked web |
| Clicked on a LinkedIn Ad | `hs_clicked_linkedin_ad` | enumeration | Whether contact has clicked on a LinkedIn Ad |
| Clicked Facebook ad | `hs_facebook_ad_clicked` | bool | Whether contact has clicked a Facebook ad |
| Facebook click id | `hs_facebook_click_id` | string |  |
| Google ad click id | `hs_google_click_id` | string |  |
| IP Timezone | `hs_ip_timezone` | string | The timezone reported by a contact's IP address. This is automatically set by HubSpot and can be use |
| Clicked LinkedIn Ad | `hs_linkedin_ad_clicked` | enumeration |  |
| LinkedIn click id | `hs_linkedin_click_id` | string | The li_fat_id url parameter extracted from the Activity recorded when a visitor lands on a tracked w |
| TikTok ad clicked | `hs_tiktok_ad_clicked` | bool | Indicates that this contact has previously landed on a HubSpot tracked webpage that had TikTok track |
| TikTok click id | `hs_tiktok_click_id` | string | The ttclid url parameter extracted from the Activity recorded when a visitor lands on a tracked webp |
| IP City | `ip_city` | string | The city reported by a contact's IP address. This is automatically set by HubSpot and can be used fo |
| IP Country | `ip_country` | string | The country reported by a contact's IP address. This is automatically set by HubSpot and can be used |
| IP Country Code | `ip_country_code` | string | The country code reported by a contact's IP address. This is automatically set by HubSpot and can be |
| IP Latitude & Longitude | `ip_latlon` | string |  |
| IP State/Region | `ip_state` | string | The state or region reported by a contact's IP address. This is automatically set by HubSpot and can |
| IP State Code/Region Code | `ip_state_code` | string | The state code or region code reported by a contact's IP address. This is automatically set by HubSp |
| IP Zipcode | `ip_zipcode` | string | The zipcode reported by a contact's IP address. This is automatically set by HubSpot and can be used |
| Number of Form Submissions | `num_conversion_events` | number | The number of forms this contact has submitted |
| Number of Unique Forms Submitted | `num_unique_conversion_events` | number | The number of different forms this contact has submitted |
| Recent Conversion Date | `recent_conversion_date` | datetime | The date this contact last submitted a form |
| Recent Conversion | `recent_conversion_event_name` | string | The last form this contact submitted |

</details>

<details><summary><strong>emailinformation</strong> (45 properties)</summary>

| Property Name | Internal Name | Type | Description |
|---|---|---|---|
| Currently in workflow (discontinued) | `currentlyinworkflow` | enumeration | If the contact is currently enrolled in any workflow |
| Invalid email address | `hs_email_bad_address` | bool | The email address associated with this contact is invalid. |
| Marketing emails bounced | `hs_email_bounce` | number | The number of marketing emails that bounced for the current email address. This is automatically set |
| Marketing emails clicked | `hs_email_click` | number | The number of marketing emails which have had link clicks for the current email address. This is aut |
| Email address quarantine reason | `hs_email_customer_quarantined_reason` | enumeration | The reason why the email address has been quarantined. |
| Marketing emails delivered | `hs_email_delivered` | number | The number of marketing emails delivered for the current email address. This is automatically set by |
| First marketing email click date | `hs_email_first_click_date` | datetime | The date of the earliest link click for any marketing email to the current email address. This is au |
| First marketing email open date | `hs_email_first_open_date` | datetime | The date of the earliest open for any marketing email to the current email address. This is automati |
| First marketing email reply date | `hs_email_first_reply_date` | datetime | The date of the earliest reply for any marketing email to the current email address. This is automat |
| First marketing email send date | `hs_email_first_send_date` | datetime | The date of the earliest delivery for any marketing email to the current email address. This is auto |
| Email hard bounce reason | `hs_email_hard_bounce_reason` | string | The issue that caused a contact to hard bounce from your emails. If this is an error or a temporary  |
| Email hard bounce reason | `hs_email_hard_bounce_reason_enum` | enumeration | The issue that caused a contact to hard bounce from your emails. If this is an error or a temporary  |
| Is globally ineligible | `hs_email_is_ineligible` | bool | Indicates the contact is globally ineligible for email. |
| Last marketing email click date | `hs_email_last_click_date` | datetime | The date of the most recent link click for any marketing email to the current email address. This is |
| Last marketing email name | `hs_email_last_email_name` | string | The name of the last marketing email sent to the current email address. This is automatically set by |
| Last marketing email open date | `hs_email_last_open_date` | datetime | The date of the most recent open for any marketing email to the current email address. This is autom |
| Last marketing email reply date | `hs_email_last_reply_date` | datetime | The date of the latest reply for any marketing email to the current email address. This is automatic |
| Last marketing email send date | `hs_email_last_send_date` | datetime | The date of the most recent delivery for any marketing email to the current email address. This is a |
| Marketing emails opened | `hs_email_open` | number | The number of marketing emails opened for the current email address. This is automatically set by Hu |
| Optimal Marketing Email Send Day of Week | `hs_email_optimal_send_day_of_week` | string |  |
| Optimal Marketing Email Send Time of Day  | `hs_email_optimal_send_time_of_day` | string |  |
| Unsubscribed from all email | `hs_email_optout` | bool | Indicates that the current email address has opted out of all email. |
| Opted out of email: One-off | `hs_email_optout_1108948833` | enumeration | Indicates that the current email address has opted out of this email type. |
| Opted out of email: Customer Competitions | `hs_email_optout_1176979646` | enumeration | Indicates that the current email address has opted out of this email type. |
| Opted out of email: Stat Marketing | `hs_email_optout_1186558511` | enumeration | Indicates that the current email address has opted out of this email type. |
| Opted out of email: Important Product Updates | `hs_email_optout_363439340` | enumeration | Indicates that the current email address has opted out of this email type. |
| Opted out of email: Care Team Newsletter | `hs_email_optout_363440505` | enumeration | Indicates that the current email address has opted out of this email type. |
| Opted out of email: Management Newsletter | `hs_email_optout_363440675` | enumeration | Indicates that the current email address has opted out of this email type. |
| Opted out of email: Customer Service Communication | `hs_email_optout_393233621` | enumeration | Indicates that the current email address has opted out of this email type. |
| Opted out of email: One to One | `hs_email_optout_4550521` | enumeration | Indicates that the current email address has opted out of this email type. |
| Opted out of email: Marketing Information | `hs_email_optout_5720344` | enumeration | Indicates that the current email address has opted out of this email type. |
| Opted out of email: Stat Signal | `hs_email_optout_781700119` | enumeration | Indicates that the current email address has opted out of this email type. |
| Email Address Quarantined | `hs_email_quarantined` | bool | Indicates that the current email address has been quarantined for anti-abuse reasons and any marketi |
| Email address automated quarantine reason | `hs_email_quarantined_reason` | enumeration | The automated reason why the email address has been quarantined. |
| Email Address Recipient Fatigue Next Available Sending Time | `hs_email_recipient_fatigue_recovery_time` | datetime | When this recipient has reached the limit of email sends per time period, this property indicates th |
| Marketing emails replied | `hs_email_replied` | number | The number of marketing emails replied to by the current email address. This is automatically set by |
| Sends Since Last Engagement | `hs_email_sends_since_last_engagement` | number | The number of marketing emails that have been sent to the current email address since the last engag |
| Email type | `hs_email_type` | enumeration | Used to determine if a given property is a personal email or work email |
| Marketing email confirmation status | `hs_emailconfirmationstatus` | enumeration | The status of a contact's eligibility to receive marketing email. This is automatically set by HubSp |
| Employment change detected date | `hs_employment_change_detected_date` | date | Date contact confirmed no longer employed at current company |
| Enriched Email Bounce Detected (Deprecated) | `hs_enriched_email_bounce_detected` | bool | Bounce Detected attribute is no longer being populated/updated after 10/31/2025. In order to receive |
| Job change detected date | `hs_job_change_detected_date` | date | Date contact confirmed no longer employed at current company |
| messaging_engagement_score | `hs_messaging_engagement_score` | number |  |
| Quarantined Emails | `hs_quarantined_emails` | string | Lists all emails associated with this contact that have been quarantined, with a source and reason. |
| Returning to office detected date | `hs_returning_to_office_detected_date` | date | Date detected from email that contact will return to the office |

</details>

<details><summary><strong>meeting_info</strong> (4 properties)</summary>

| Property Name | Internal Name | Type | Description |
|---|---|---|---|
| Date of last meeting booked in meetings tool | `engagements_last_meeting_booked` | datetime | The date of the last meeting that has been scheduled by a contact through the meetings tool. If mult |
| Campaign of last booking in meetings tool | `engagements_last_meeting_booked_campaign` | string | This UTM parameter shows which marketing campaign (e.g. a specific email) referred the contact to th |
| Medium of last booking in meetings tool | `engagements_last_meeting_booked_medium` | string | This UTM parameter shows which channel (e.g. email) referred the contact to the meetings tool for th |
| Source of last booking in meetings tool | `engagements_last_meeting_booked_source` | string | This UTM parameter shows which site (e.g. Twitter) referred the contact to the meetings tool for the |

</details>

<details><summary><strong>multiaccountmanagement</strong> (1 properties)</summary>

| Property Name | Internal Name | Type | Description |
|---|---|---|---|
| Cross-sell Opportunity | `hs_cross_sell_opportunity` | bool | Identify a contact as a good candidate for cross-selling programs. |

</details>

<details><summary><strong>order_information</strong> (3 properties)</summary>

| Property Name | Internal Name | Type | Description |
|---|---|---|---|
| First Closed Order ID | `hs_first_closed_order_id` | number | The id of the associated order that was first to be closed |
| First Order Closed Date | `hs_first_order_closed_date` | datetime | Date first order was closed. Set Automatically |
| Recent Closed Order Date | `hs_recent_closed_order_date` | datetime | Date last order was closed. Set automatically. |

</details>

<details><summary><strong>salesforceinformation</strong> (9 properties)</summary>

| Property Name | Internal Name | Type | Description |
|---|---|---|---|
| Salesforce Account ID | `salesforceaccountid` | string |  |
| Salesforce Campaign IDs | `salesforcecampaignids` | enumeration |  |
| Salesforce Contact ID | `salesforcecontactid` | string |  |
| Salesforce Deleted | `salesforcedeleted` | bool |  |
| Last Salesforce Sync Time | `salesforcelastsynctime` | datetime |  |
| Salesforce Lead ID | `salesforceleadid` | string |  |
| Opportunity Stage | `salesforceopportunitystage` | string |  |
| Salesforce Owner Id | `salesforceownerid` | string |  |
| Form Salesforce Campaign | `sfcampaignid` | string |  |

</details>

<details><summary><strong>smsinformation</strong> (2 properties)</summary>

| Property Name | Internal Name | Type | Description |
|---|---|---|---|
| Last Sms Send Date | `hs_last_sms_send_date` | datetime | This stores the date of the last SMS sent |
| Last SMS Send Name | `hs_last_sms_send_name` | string | Name of the last SMS sent to the contact |

</details>

<details><summary><strong>socialmediainformation</strong> (18 properties)</summary>

| Property Name | Internal Name | Type | Description |
|---|---|---|---|
| Follower Count | `followercount` | number | The number of Twitter followers a contact has |
| Facebook ID | `hs_facebookid` | string | A contact's facebook id |
| googleplus ID | `hs_googleplusid` | string | A contact's googleplus id |
| LinkedIn URL | `hs_linkedin_url` | string | The URL of the contact's LinkedIn page. |
| Linkedin ID | `hs_linkedinid` | string | A contact's linkedin id |
| Facebook Clicks | `hs_social_facebook_clicks` | number | The number clicks on links shared on Facebook |
| Google Plus Clicks | `hs_social_google_plus_clicks` | number | The number clicks on links shared on Google Plus |
| Most Recent Social Click | `hs_social_last_engagement` | datetime | The date of the most recent click on a published social message. This is set automatically by HubSpo |
| LinkedIn Clicks | `hs_social_linkedin_clicks` | number | The number clicks on links shared on LinkedIn |
| Broadcast Clicks | `hs_social_num_broadcast_clicks` | number | The number of clicks on published social messages. This is set automatically by HubSpot for each con |
| Twitter Clicks | `hs_social_twitter_clicks` | number | The number of times a contact clicked on links you shared on Twitter through HubSpot. This is set au |
| Twitter ID | `hs_twitterid` | string | A contact's twitter id |
| Klout Score | `kloutscoregeneral` | number | A contact's Klout score, a measure of Internet influence |
| LinkedIn Bio | `linkedinbio` | string | A contact's LinkedIn bio |
| LinkedIn Connections | `linkedinconnections` | number | How many LinkedIn connections they have |
| Photo | `photo` | string | Social Media photo |
| Twitter Bio | `twitterbio` | string | The contact's Twitter bio. This is set by HubSpot using the contact's email address. |
| Twitter Profile Photo | `twitterprofilephoto` | string | The contact's Twitter profile photo. This is set by HubSpot using the contact's email address. |

</details>

---

## Companies

| Attribute | Value |
|---|---|
| **Type** | Standard Object |

**Total Properties:** 510 | **Custom:** 235 | **Calculated:** 29

### Custom Properties

| Property Name | Internal Name | Type | Field Type | Group | Description |
|---|---|---|---|---|---|
| MD Engagement Category | `md_engagement_category` | string | text | account_engagement | Metadata's classification for the account's engagement level. |
| MD Engagement Score | `md_engagement_score` | number | number | account_engagement | Metadata's engagement score. |
| MD Engagement Trend | `md_engagement_trend` | string | text | account_engagement | Metadata's metric on how the account's engagement is trending. |
| Company Lead Source Category | `ac_lead_source_category` | enumeration | select | attribution_properties | The broader category that the lead source falls under when an account was created. |
| Company Medium | `ac_medium` | string | text | attribution_properties | The medium of a company when it was created. |
| Company Offer Type | `ac_offer_type` | enumeration | select | attribution_properties |  |
| Company Offer Type History | `ac_offer_type_history` | enumeration | checkbox | attribution_properties | An up-to-date history of all offers that a company has interacted with when it was first created. |
| Company Source | `ac_source` | enumeration | checkbox | attribution_properties |  |
| Company Source History | `ac_source_history` | enumeration | checkbox | attribution_properties | A record of all sources that influenced an account when it was created. |
| Company Variant | `ac_variant` | string | text | attribution_properties | The most recent variant a company interacted with when the company was created. |
| Company Attribution Errors | `company_attribution_errors` | string | textarea | attribution_properties |  |
| Company Offer | `company_offer` | string | text | attribution_properties | The offer that a company most recently engaged with when it was created. |
| Customer Lead Source Category | `cw_lead_source_category` | enumeration | select | attribution_properties | The broader category that the lead source falls under when a deal was closed won. |
| Customer Medium | `cw_medium` | string | text | attribution_properties | The medium of a company when their deal was closed won. |
| Customer Offer | `cw_offer` | string | text | attribution_properties | Most recent offer when a deal was closed won. |
| Customer Offer Type History | `cw_offer_type_history` | enumeration | checkbox | attribution_properties | An up-to-date history of all offers that a company has interacted with when a deal was closed won. |
| Customer Source History | `cw_source_history` | enumeration | checkbox | attribution_properties | A record of all sources that influenced an account at the time of the deal being won. |
| Customer Variant | `cw_variant` | string | text | attribution_properties | The variant that a company most recently interacted with when a deal was closed won. |
| Demo Lead Source Category | `dc_lead_source_category` | enumeration | select | attribution_properties | The broader category that the lead source falls under when a demo was set. |
| Demo Medium | `dc_medium` | string | text | attribution_properties | The medium of a company when a disco call was set. |
| Demo Offer | `dc_offer` | string | text | attribution_properties | Most recent offer when a demo was scheduled. |
| Demo Offer Type | `dc_offer_type` | enumeration | select | attribution_properties | The latest offer type engaged with when a demo was set. |
| Demo Offer Type History | `dc_offer_type_history` | enumeration | checkbox | attribution_properties | An up-to-date history of all offers that a company has interacted with when a demo was created. |
| Demo Source History | `dc_source_history` | enumeration | checkbox | attribution_properties | A record of all sources that influenced an account at the time of initial demo. |
| DC Variant | `dc_variant` | string | text | attribution_properties | The variant that the company most recently interacted with when a demo was created. |
| Latest Offer | `latest_offer` | string | text | attribution_properties | The most recent offer that a company interacted with. |
| Latest Offer Type | `latest_offer_type` | enumeration | select | attribution_properties |  |
| Latest Offer Type History | `latest_offer_type_history` | enumeration | checkbox | attribution_properties | An up-to-date history of all offers that a company has interacted with. |
| Latest Variant | `latest_variant` | string | text | attribution_properties |  |
| Latest Medium | `medium` | string | text | attribution_properties | The most recent medium of a company. |
| Opportunity Lead Source Category | `oc_lead_source_category` | enumeration | select | attribution_properties | The broader category that the lead source falls under when an opportunity was created. |
| Opportunity Medium | `oc_medium` | string | text | attribution_properties | The medium of a company when an opportunity was created. |
| Opportunity Offer | `oc_offer` | string | text | attribution_properties | Most recent offer when an opportunity was created. |
| Opportunity Offer Type | `oc_offer_type` | enumeration | select | attribution_properties | The latest offer type engaged with when an opportunity was created. |
| Opportunity Offer Type History | `oc_offer_type_history` | enumeration | checkbox | attribution_properties | An up-to-date history of all offers that a company has interacted with when an opportunity was created. |
| Opportunity Source History | `oc_source_history` | enumeration | checkbox | attribution_properties | A record of all sources that influenced an account at the time of opportunity creation. |
| Opportunity Variant | `oc_variant` | string | text | attribution_properties | The variant that a company most recently interacted with when an opportunity was created. |
| Opportunity Source | `opportunity_source` | enumeration | checkbox | attribution_properties |  |
| Original Offer Type | `original_offer_type` | enumeration | select | attribution_properties |  |
| Latest Source History | `source_history` | enumeration | checkbox | attribution_properties | A record of all sources that influenced an account. |
| Stat Latest Source | `stat_latest_source` | enumeration | checkbox | attribution_properties |  |
| Stat Original Source | `stat_original_source` | enumeration | checkbox | attribution_properties |  |
| Suggested Attribution Fixes | `suggested_attribution_fixes` | string | textarea | attribution_properties |  |
| Company Status | `company_status` | enumeration | select | company_activity |  |
| Last EBR | `last_ebr` | date | date | company_activity | Date of Customer's last EBR |
| Last Surge Alert Date | `last_surge_alert_date` | date | date | company_activity | The date of the last surge alert; used to prevent excessive alerts when account is engaging. |
| Most Recent Owner | `most_recent_owner` | enumeration | select | company_activity | The most recent company owner; used to preserve history if owner was cleared. Only over-written when new owner assigned. |
| 30-Day Average Engagement | `n30day_average_engagement` | number | number | company_activity | Over the last 30 days, this is the average engagement score for this account. |
| 7-Day Max Engagement | `n7day_max_engagement` | number | number | company_activity | Over the last 7 days, this is the max engagement score for this account. |
| Next EBR | `next_ebr` | date | date | company_activity | Date of Customer's next EBR |
| Next Steps | `next_steps` | string | textarea | company_activity |  |
| Number of closed lost deals | `number_of_closed_lost_deals` | number | calculation_rollup | company_activity |  |
| New Expansion Identified | `new_expansion_identified` | enumeration | booleancheckbox | company_signals | A signal set by Apollo when a new expansion is announced. |
| New Funding Identified | `new_funding_identified` | enumeration | booleancheckbox | company_signals | A signal set by Apollo when new funding is identified. |
| New Hire Identified | `new_personnel_change` | enumeration | booleancheckbox | company_signals | A signal set by Apollo when a new operations leader is hired. |
| # Of MQLs Engaged | `of_mqls_engaged` | number | calculation_rollup | company_signals |  |
| Recent Signal Identified Date | `recent_signal_identified_date` | datetime | date | company_signals | The date of the last Apollo signal captured. |
| Account Executive | `account_executive` | enumeration | select | companyinformation |  |
| Average Sales Engagement | `average_sales_engagement` | number | calculation_equation | companyinformation | Sum of contact-level sales engagement, divided by the number of active associated leads. |
| Total Account Engagement | `buying_committee_engagement` | number | calculation_rollup | companyinformation | Sum of all associated contact weighted engagement, intended to measure overall engagement of the right people in an acco |
| Community Impact | `community_impact` | string | textarea | companyinformation |  |
| Company Nickname | `company_nickname` | string | text | companyinformation | A shorthand name for the company, to be used for personalized emails. For example, you may want to call St. Johns Medica |
| Company Type | `company_type` | enumeration | checkbox | companyinformation | Parent Company OR Child Company |
| Contact Attribution Updated | `contact_attribution_updated` | datetime | date | companyinformation | If an associated contact recently had attribution updated, this is a trigger property to update the company's as well. |
| Contracts | `contracts` | string | file | companyinformation |  |
| Cross-Object Issues | `cross_object_issues` | string | textarea | companyinformation |  |
| CSE | `cse` | enumeration | select | companyinformation |  |
| Customer Propensity Score | `customer_propensity_score` | number | number | companyinformation |  |
| Date Entered A3 | `date_entered_a3` | date | date | companyinformation | Date a target account entered A3 score. |
| Date Entered B3 | `date_entered_b3` | date | date | companyinformation | Date a target account entered B3 score. |
| Date Entered C2 | `date_entered_c2` | date | date | companyinformation | Date a target account entered C2 score. |
| Date Entered: Opportunity Created ABM Stage | `date_entered_opportunity_created_abm_stage` | date | date | companyinformation |  |
| Demo Source | `demo_source` | string | text | companyinformation | Most recent source when a first demo was scheduled. |
| Distance from Customer | `distance_from_customer` | number | calculation_equation | companyinformation | This is the calculated distance between the company and the closest customer. |
| EHR/EMR | `ehr_emr` | enumeration | select | companyinformation | The EHR/EMR the organization uses.  |
| Engagement Growth | `engagement_growth` | number | number | companyinformation | A metric measuring how engagement growth has changed over the last 7 days compared to the  previous 30 day average. Form |
| Engagement Score (Metadata) | `engagement_score__metadata_` | number | number | companyinformation | Account engagement per Metadata's measurement. |
| Entity Type | `entity_type` | enumeration | checkbox | companyinformation | Type of entity of an organization  |
| Expansion Potential | `expansion_potential` | enumeration | select | companyinformation |  |
| Funding Request Amount | `funding_request_amount` | string | text | companyinformation |  |
| Gateway Frequency | `gateway_frequency` | enumeration | checkbox | companyinformation |  |
| Gateway Programming Date | `gateway_programming_date` | date | date | companyinformation |  |
| Grant Summary | `grant_summary` | string | textarea | companyinformation |  |
| Healthcare Vertical | `healthcare_vertical` | enumeration | select | companyinformation | Classifies the company into a specific healthcare vertical based on its website or descriptive information. Options incl |
| Industry (Used For Workflows) | `industry__used_for_workflows_` | string | text | companyinformation | This is a single-line field we use to feed from Apollo and then update our Industry picklist property. Do not delete. |
| Is EBR Scheduled | `is_ebr_scheduled` | number | calculation_equation | companyinformation |  |
| Keywords (Used In Workflow) | `keywords__used_in_workflow_` | string | textarea | companyinformation |  |
| Last Badge Number | `last_badge_number` | number | number | companyinformation |  |
| Latest Lead Source Category | `latest_lead_source_category` | enumeration | select | companyinformation | The broader category that the lead source falls under. |
| Latitude | `latitude` | number | number | companyinformation |  |
| Original Lead Source Category | `lead_source_category` | enumeration | select | companyinformation | The broader category that the lead source falls under. |
| Longitude | `longitude` | number | number | companyinformation |  |
| MSA Date | `msa_date` | date | date | companyinformation |  |
| Nearby Company Count | `nearby_customer_count` | number | calculation_rollup | companyinformation |  |
| New Promotion Identified | `new_growth_identified` | enumeration | booleancheckbox | companyinformation | A property set by Apollo when an account has a new promotion identified. |
| # Of Active Associated Leads | `of_active_associated_leads` | number | calculation_rollup | companyinformation |  |
| # Of Contacts In Sequence | `of_contacts_in_sequence` | number | calculation_rollup | companyinformation |  |
| # Of Decision Makers | `of_decision_makers` | number | calculation_rollup | companyinformation |  |
| Operational Visibility | `operational_visibility` | string | textarea | companyinformation |  |
| Population Served | `population_served` | string | text | companyinformation |  |
| Profit Percentage | `profit_percentage` | number | number | companyinformation |  |
| Promotion Plan | `promotion_plan` | string | textarea | companyinformation |  |
| Proposed Attribution Fix | `proposed_attribution_fix` | string | textarea | companyinformation | What the attribution hygiene workflow recommends fixing. |
| Ready for deal creation | `ready_for_deal_creation` | enumeration | booleancheckbox | companyinformation | A helper property used to create deal. |
| Record Type | `record_type` | enumeration | select | companyinformation |  |
| Site Count | `site_count` | number | number | companyinformation |  |
| Stat Badge Type | `stat_badge_type` | enumeration | checkbox | companyinformation |  |
| Stat Organization ID | `stat_organization_id` | string | text | companyinformation | The ID of the customer pulled in from the Stat platform. |
| Testimonial Identified | `testimonial_identified` | string | text | companyinformation | Populated by Grain when a good quote is identified. |
| Date Today | `today_date` | date | date | companyinformation |  |
| Total Expansion Potential | `total_expansion_potential` | number | number | companyinformation |  |
| Wait Times | `wait_times` | enumeration | select | companyinformation | Provides the customer the ability to view wait times on their website or billboards.  |
| Workforce Impact | `workforce_impact` | string | textarea | companyinformation |  |
| Code Silver Unlock | `code_silver_unlock` | string | textarea | customer_success | What titles are approved to contact us to unlock the code silver? |
| Exam Rooms | `exam_rooms` | number | number | customer_success |  |
| Locator Rooms | `locator_rooms` | number | number | customer_success |  |
| Priorities & Goals | `priorities___goals` | string | textarea | customer_success | Enter responses received during executive kick-off meetings.  |
| Survey Status | `survey_status` | enumeration | select | customer_success | Indicates whether or not a survey should be sent. |
| Auto-Merge: Approved | `auto_merge__approved` | enumeration | booleancheckbox | deduplication_properties |  |
| Auto-Merge: Candidate ID | `auto_merge__candidate_id` | string | text | deduplication_properties |  |
| Auto-Merge: Do Not Auto-Merge | `auto_merge__do_not_auto_merge` | enumeration | booleancheckbox | deduplication_properties |  |
| Auto-Merge: Error | `auto_merge__error` | string | textarea | deduplication_properties |  |
| Auto-Merge: Last Merged IDs | `auto_merge__last_merged_ids` | string | textarea | deduplication_properties |  |
| Auto-Merge: Last Primary ID | `auto_merge__last_primary_id` | string | text | deduplication_properties |  |
| Auto-Merge: Last Result | `auto_merge__last_result` | string | text | deduplication_properties |  |
| Auto-Merge: Last Run At | `auto_merge__last_run_at` | date | date | deduplication_properties |  |
| Auto-Merge: Last Strategy | `auto_merge__last_strategy` | enumeration | select | deduplication_properties |  |
| Auto-Merge: Review Required | `auto_merge__review_required` | enumeration | booleancheckbox | deduplication_properties |  |
| Auto-Merge Last Strategy Text Field | `auto_merge_last_strategy_text_field` | string | text | deduplication_properties |  |
| Normalized Domain | `normalized_domain` | string | text | deduplication_properties |  |
| Normalized Website | `normalized_website` | string | text | deduplication_properties |  |
| Potential Duplicate | `potential_duplicate` | enumeration | booleancheckbox | deduplication_properties |  |
| stat_dedupe_fingerprint_v1 | `stat_dedupe_fingerprint_v1` | string | text | deduplication_properties |  |
| stat_dedupe_outcome | `stat_dedupe_outcome` | string | text | deduplication_properties |  |
| stat_dedupe_processed_at | `stat_dedupe_processed_at` | datetime | date | deduplication_properties |  |
| ABM Velocity: Meeting Held To Opp Created (Days) | `abm_velocity_meeting_held_to_opp_created_days` | number | calculation_equation | meeting_info | Time it took for a target account to get an opportunity created. |
| ABM Velocity: Meeting Set To Meeting Held (Days) | `abm_velocity_meeting_set_to_meeting_held_days` | number | calculation_equation | meeting_info | Time it took for a target account to get a meeting held. |
| ABM Velocity: Working To Meeting Set (Days) | `abm_velocity_working_to_meeting_set_days` | number | calculation_equation | meeting_info | Time it took for a target account to get a meeting set. |
| Date Entered: Meeting Held ABM Stage | `date_entered_meeting_held_abm_stage` | date | date | meeting_info |  |
| Date Entered: Meeting Set ABM Stage | `date_entered_meeting_set_abm_stage` | date | date | meeting_info |  |
| ID Of Meeting With Stale Outcome | `id_of_meeting_with_stale_outcome` | string | text | meeting_info | This is used to associate which meeting needs it's outcome updated. |
| Meeting Outcome Needs Update | `meeting_outcome_needs_update` | enumeration | booleancheckbox | meeting_info | A flag set by the contact-level meeting outcome workflow that indicates that a meeting associated with this company need |
| ROE | Company | Last Held Meeting | `roe___company___last_held_meeting` | date | date | meeting_info | Tracks last logged meeting held. |
| Has Org Chart | `orgcharthub_has_org_chart` | enumeration | booleancheckbox | orgcharthub | Indicates whether this company has an Org Chart |
| Number of Contacts on Org Chart | `orgcharthub_num_contacts_on_chart` | number | number | orgcharthub | The total number of Contacts on this company's Org Chart |
| Number of HubSpot Contacts on Org Chart | `orgcharthub_num_hubspot_contacts_on_chart` | number | number | orgcharthub | The number of HubSpot Contacts on this company's Org Chart |
| Number of Placeholder Contacts on Org Chart | `orgcharthub_num_placeholder_contacts_on_chart` | number | number | orgcharthub | The number of Placeholder Contacts on this company's Org Chart |
| Org Chart Last Updated At | `orgcharthub_org_chart_last_updated_at` | date | date | orgcharthub | The date of the last update made to this company's Org Chart |
| % Commission | `commission` | number | number | partner | % of rev share commission paid off ARR |
| # of Referrals | `of_referrals` | number | calculation_rollup | partner |  |
| ROE | Company | Last BC/Negotiation Entry | `roe___company___last_business_consideration_entry` | date | date | rules_of_engagement | Stamped when any associated deal enters Business Consideration |
| Last Sales Activity Date | `roe___company___last_sales_activity_date` | date | date | rules_of_engagement | Tracks last logged sales rep activity (calls, meetings, tasks, or sales emails). Excludes marketing touches. |
| ROE | Company | Open Account Status | `roe___company___open_account_status` | enumeration | select | rules_of_engagement | Used for ROE reversion & routing |
| ROE | Company | Open Pool Reason | `roe___company___open_pool_reason` | enumeration | select | rules_of_engagement |  |
| ROE | Company | Ownership Grace Start Date | `roe___company___ownership_grace_expiration` | date | date | rules_of_engagement | When taking new ownership of an account, AE has 7 days to start the required sales activity in order to maintain ownersh |
| ROE | Company | Reverted Timestamp | `roe___company___reverted_timestamp` | date | date | rules_of_engagement | Date account was reverted to Open Pool. |
| ROE | Active Open Deal Count | `roe__active_open_deal_count` | number | calculation_rollup | rules_of_engagement |  |
| Surveys - Basic | `basic_surveys__c` | enumeration | select | salesforceinformation |  |
| Benchmarking Data | `benchmarking_data__c` | enumeration | select | salesforceinformation |  |
| Consulting Services & Data Utilization | `consulting_services_data_utilization__c` | enumeration | select | salesforceinformation |  |
| Copy Billing Address to Shipping Address | `copy_billing_address_to_shipping_address__c` | enumeration | booleancheckbox | salesforceinformation |  |
| CS Next Steps & Priorities | `cs_next_steps_priorities__c` | string | textarea | salesforceinformation |  |
| DBA | `dba__c` | string | text | salesforceinformation |  |
| Duress Beacons | `duress_beacons` | enumeration | select | salesforceinformation |  |
| EHR Integration | `ehr_integration__c` | enumeration | select | salesforceinformation |  |
| Emergency Buttons | `emergency_buttons__c` | enumeration | select | salesforceinformation |  |
| Lead Finder | `lead_finder__c` | enumeration | select | salesforceinformation |  |
| Lobby View | `lobby_view__c` | enumeration | select | salesforceinformation |  |
| Network Conf & Unique Install Notes | `network_conf_unique_install_notes__c` | string | textarea | salesforceinformation |  |
| NPS Score (All Time) | `nps_score_all_time__c` | number | number | salesforceinformation |  |
| Pop Health Integration | `pop_health_integration__c` | enumeration | select | salesforceinformation |  |
| Shipping Notes | `shipping_notes__c` | string | textarea | salesforceinformation |  |
| Surveys - Advanced | `surveys_advanced__c` | enumeration | select | salesforceinformation |  |
| LinkedIn Company Name | `linkedin_company_name` | string | text | socialmediainformation |  |
| ABM: Date Entered Opportunity Stage | `abm_date_entered_opportunity_stage` | date | date | targetaccountsinformation |  |
| ABM Outreach Readiness | `abm_outreach_readiness` | enumeration | select | targetaccountsinformation |  |
| ABM Velocity: Cold To Working (Days) | `abm_velocity_cold_to_working_days` | number | calculation_equation | targetaccountsinformation | Time it took for a target account to start being worked. |
| ABM Velocity: Opp Created To Closed Won (Days) | `abm_velocity_opp_created_to_closed_won_days` | number | calculation_equation | targetaccountsinformation | Time it took for a target account to get a deal closed won. |
| Cool-Off Period End Date | `cooloff_period_end_date` | date | date | targetaccountsinformation | The date at which a target account can be contacted again. Calculated as Last Activity Date + Cool-Off Period Duration. |
| Date Became A Target Account | `date_became_a_target_account` | date | date | targetaccountsinformation | The timestamp for when an account was labeled a target account. |
| Date Entered A1 | `date_entered_a1` | date | date | targetaccountsinformation | The date a target account entered A1 score. |
| Date Entered A2 | `date_entered_a2` | date | date | targetaccountsinformation | Date a target account entered A2 score. |
| Date Entered B1 | `date_entered_b1` | date | date | targetaccountsinformation | Date a target account entered B1 score. |
| Date Entered B2 | `date_entered_b2` | date | date | targetaccountsinformation | Date a target account entered B2 score. |
| Date Entered C1 | `date_entered_c1` | date | date | targetaccountsinformation | Date a target account entered C1 score. |
| Date Entered C3 | `date_entered_c3` | date | date | targetaccountsinformation | Date a target account entered C3 score. |
| Date Entered: Closed Won ABM Stage | `date_entered_closed_won_abm_stage` | date | date | targetaccountsinformation |  |
| Date Entered: Cold ABM Stage | `date_entered_cold_abm_stage` | date | date | targetaccountsinformation |  |
| Date Entered Current ABM Stage | `date_entered_current_abm_stage` | date | date | targetaccountsinformation | The date that a target account entered it's current ABM stage. |
| Date Entered: Working ABM Stage | `date_entered_working_abm_stage` | date | date | targetaccountsinformation |  |
| Decision Maker Engagement % | `decision_maker_engagement` | number | calculation_equation | targetaccountsinformation | The percentage of decision makers on the account that are engaged. |
| Getting Ad Support | `getting_ad_support` | enumeration | booleancheckbox | targetaccountsinformation | Whether this account is in our hold-in or holdout group for our ad impact test. |
| Gift Claimed Timestamp | `gift_claimed_timestamp` | date | date | targetaccountsinformation |  |
| Gift Delivered Timestamp | `gift_delivered_timestamp` | date | date | targetaccountsinformation |  |
| Gift Interaction (Y/N) | `gift_interaction_yn` | enumeration | radio | targetaccountsinformation |  |
| Gift Sent Timestamp | `gift_sent_timestamp` | date | date | targetaccountsinformation |  |
| Gift Status | `gift_status` | enumeration | select | targetaccountsinformation |  |
| Gifting Campaign | `gifting_campaign` | string | text | targetaccountsinformation | The Snappy campaign being used. |
| Number of engaged decision makers | `number_of_engaged_decision_makers` | number | calculation_rollup | targetaccountsinformation |  |
| Target Account Stage | `target_account_stage` | enumeration | select | targetaccountsinformation | The current stage of a target account, specific to our Target Account Program. Set by workflows. |
| Time In Current ABM Stage | `time_in_current_abm_stage` | number | calculation_equation | targetaccountsinformation |  |
| Total Gift Amount Claimed | `total_gift_amount_claimed` | number | calculation_rollup | targetaccountsinformation |  |
| [ZENABM] ABM Stage | `zenabm_abm_stage` | enumeration | select | zenabm_linkedin_metrics | Current ABM stage of the company |
| [ZENABM] Active ABM Campaigns | `zenabm_active_abm_campaigns` | enumeration | checkbox | zenabm_linkedin_metrics | Active ABM campaigns this company has interacted with |
| [ZENABM] Active ABM Campaigns Clicks | `zenabm_active_abm_campaigns_clicks` | number | number | zenabm_linkedin_metrics | Total number of LinkedIn ad clicks for active ABM campaigns |
| [ZENABM] Active ABM Campaigns Engagements | `zenabm_active_abm_campaigns_engagements` | number | number | zenabm_linkedin_metrics | Total number of LinkedIn ad engagements for active ABM campaigns |
| [ZENABM] Active ABM Campaigns Impressions | `zenabm_active_abm_campaigns_impressions` | number | number | zenabm_linkedin_metrics | Total number of LinkedIn ad impressions for active ABM campaigns |
| [ZENABM] Created by ZenABM | `zenabm_created_by_zenabm` | enumeration | checkbox | zenabm_linkedin_metrics | Indicates this company was created in HubSpot by ZenABM |
| [ZENABM] LinkedIn Ad Clicks (30 Days) | `zenabm_linkedin_ad_clicks_30_days` | number | number | zenabm_linkedin_metrics | Number of LinkedIn ad clicks in the last 30 days |
| [ZENABM] LinkedIn Ad Clicks (7 Days) | `zenabm_linkedin_ad_clicks_7_days` | number | number | zenabm_linkedin_metrics | Number of LinkedIn ad clicks in the last 7 days |
| [ZENABM] LinkedIn Ad Clicks (90 Days) | `zenabm_linkedin_ad_clicks_90_days` | number | number | zenabm_linkedin_metrics | Number of LinkedIn ad clicks in the last 90 days |
| [ZENABM] LinkedIn Ad Engagements (30 Days) | `zenabm_linkedin_ad_engagements_30_days` | number | number | zenabm_linkedin_metrics | Number of LinkedIn ad engagements in the last 30 days |
| [ZENABM] LinkedIn Ad Engagements (7 Days) | `zenabm_linkedin_ad_engagements_7_days` | number | number | zenabm_linkedin_metrics | Number of LinkedIn ad engagements in the last 7 days |
| [ZENABM] LinkedIn Ad Engagements (90 Days) | `zenabm_linkedin_ad_engagements_90_days` | number | number | zenabm_linkedin_metrics | Number of LinkedIn ad engagements in the last 90 days |
| [ZENABM] LinkedIn Ad Impressions (30 Days) | `zenabm_linkedin_ad_impressions_30_days` | number | number | zenabm_linkedin_metrics | Number of LinkedIn ad impressions in the last 30 days |
| [ZENABM] LinkedIn Ad Impressions (7 Days) | `zenabm_linkedin_ad_impressions_7_days` | number | number | zenabm_linkedin_metrics | Number of LinkedIn ad impressions in the last 7 days |
| [ZENABM] LinkedIn Ad Impressions (90 Days) | `zenabm_linkedin_ad_impressions_90_days` | number | number | zenabm_linkedin_metrics | Number of LinkedIn ad impressions in the last 90 days |
| [ZENABM] LinkedIn Campaign Groups with Clicks (30 Days) | `zenabm_linkedin_campaign_groups_with_clicks_30_days` | string | textarea | zenabm_linkedin_metrics | LinkedIn campaign groups that received clicks in the last 30 days |
| [ZENABM] LinkedIn Campaign Groups with Clicks (7 Days) | `zenabm_linkedin_campaign_groups_with_clicks_7_days` | string | textarea | zenabm_linkedin_metrics | LinkedIn campaign groups that received clicks in the last 7 days |
| [ZENABM] LinkedIn Campaign Groups with Clicks (90 Days) | `zenabm_linkedin_campaign_groups_with_clicks_90_days` | string | textarea | zenabm_linkedin_metrics | LinkedIn campaign groups that received clicks in the last 90 days |
| [ZENABM] LinkedIn Campaign Groups with Engagements (30 Days) | `zenabm_linkedin_campaign_groups_with_engagements_30_days` | string | textarea | zenabm_linkedin_metrics | LinkedIn campaign groups that received engagements in the last 30 days |
| [ZENABM] LinkedIn Campaign Groups with Engagements (7 Days) | `zenabm_linkedin_campaign_groups_with_engagements_7_days` | string | textarea | zenabm_linkedin_metrics | LinkedIn campaign groups that received engagements in the last 7 days |
| [ZENABM] LinkedIn Campaign Groups with Engagements (90 Days) | `zenabm_linkedin_campaign_groups_with_engagements_90_days` | string | textarea | zenabm_linkedin_metrics | LinkedIn campaign groups that received engagements in the last 90 days |
| [ZENABM] LinkedIn Campaigns with Clicks (30 Days) | `zenabm_linkedin_campaigns_with_clicks_30_days` | string | textarea | zenabm_linkedin_metrics | LinkedIn campaigns that received clicks in the last 30 days |
| [ZENABM] LinkedIn Campaigns with Clicks (7 Days) | `zenabm_linkedin_campaigns_with_clicks_7_days` | string | textarea | zenabm_linkedin_metrics | LinkedIn campaigns that received clicks in the last 7 days |
| [ZENABM] LinkedIn Campaigns with Clicks (90 Days) | `zenabm_linkedin_campaigns_with_clicks_90_days` | string | textarea | zenabm_linkedin_metrics | LinkedIn campaigns that received clicks in the last 90 days |
| [ZENABM] LinkedIn Campaigns with Engagements (30 Days) | `zenabm_linkedin_campaigns_with_engagements_30_days` | string | textarea | zenabm_linkedin_metrics | LinkedIn campaigns that received engagements in the last 30 days |
| [ZENABM] LinkedIn Campaigns with Engagements (7 Days) | `zenabm_linkedin_campaigns_with_engagements_7_days` | string | textarea | zenabm_linkedin_metrics | LinkedIn campaigns that received engagements in the last 7 days |
| [ZENABM] LinkedIn Campaigns with Engagements (90 Days) | `zenabm_linkedin_campaigns_with_engagements_90_days` | string | textarea | zenabm_linkedin_metrics | LinkedIn campaigns that received engagements in the last 90 days |
| [ZENABM] LinkedIn Intents | `zenabm_linkedin_intents` | enumeration | checkbox | zenabm_linkedin_metrics | Intents associated with this company through LinkedIn campaigns and campaign groups |
| [ZENABM] LinkedIn Last Sync Date | `zenabm_linkedin_last_sync_date` | datetime | date | zenabm_linkedin_metrics | Last time LinkedIn data was synced |
| [ZENABM] LinkedIn Total Clicks | `zenabm_linkedin_total_clicks` | number | number | zenabm_linkedin_metrics | Total number of LinkedIn ad clicks for this company |
| [ZENABM] LinkedIn Total Engagement Score | `zenabm_linkedin_total_engagement_score` | number | number | zenabm_linkedin_metrics | Total engagement score based on LinkedIn interactions |
| [ZENABM] LinkedIn Total Engagements | `zenabm_linkedin_total_engagements` | number | number | zenabm_linkedin_metrics | Total number of LinkedIn ad engagements for this company |
| [ZENABM] LinkedIn Total Impressions | `zenabm_linkedin_total_impressions` | number | number | zenabm_linkedin_metrics | Total number of LinkedIn ad impressions for this company |

### HubSpot-Defined Properties (by Group)

<details><summary><strong>analyticsinformation</strong> (16 properties)</summary>

| Property Name | Internal Name | Type | Description |
|---|---|---|---|
| Days to Close | `days_to_close` | number | The number of days between when the company record was created and when they closed as a customer. |
| Time First Seen | `hs_analytics_first_timestamp` | datetime | The first activity for any contact associated with this company or organization |
| First Touch Converting Campaign | `hs_analytics_first_touch_converting_campaign` | string | The campaign responsible for the first touch creation of the first contact associated with this comp |
| Time of First Session | `hs_analytics_first_visit_timestamp` | datetime | Time of first session across all contacts associated with this company or organization |
| Time Last Seen | `hs_analytics_last_timestamp` | datetime | Time last seen across all contacts associated with this company or organization |
| hs_analytics_last_timestamp_timestamp_latest_value_4e16365a | `hs_analytics_last_timestamp_timestamp_latest_value_4e16365a` | datetime | Calculation context property providing timestamp for rollup property hs_analytics_last_timestamp cal |
| Last Touch Converting Campaign | `hs_analytics_last_touch_converting_campaign` | string | The campaign responsible for the last touch creation of the first contact associated with this compa |
| hs_analytics_last_touch_converting_campaign_timestamp_latest_value_81a64e30 | `hs_analytics_last_touch_converting_campaign_timestamp_latest_value_81a64e30` | datetime | Calculation context property providing timestamp for rollup property hs_analytics_last_touch_convert |
| Time of Last Session | `hs_analytics_last_visit_timestamp` | datetime | Time of the last session attributed to any contacts that are associated with this company record. |
| hs_analytics_last_visit_timestamp_timestamp_latest_value_999a0fce | `hs_analytics_last_visit_timestamp_timestamp_latest_value_999a0fce` | datetime | Calculation context property providing timestamp for rollup property hs_analytics_last_visit_timesta |
| Number of Pageviews | `hs_analytics_num_page_views` | number | Total number of page views across all contacts associated with this company or organization |
| hs_analytics_num_page_views_cardinality_sum_e46e85b0 | `hs_analytics_num_page_views_cardinality_sum_e46e85b0` | number | Calculation context property providing cardinality for rollup property hs_analytics_num_page_views c |
| Number of Sessions | `hs_analytics_num_visits` | number | Total number of sessions across all contacts associated with this company or organization |
| hs_analytics_num_visits_cardinality_sum_53d952a6 | `hs_analytics_num_visits_cardinality_sum_53d952a6` | number | Calculation context property providing cardinality for rollup property hs_analytics_num_visits calcu |
| Original Source Data 1 | `hs_analytics_source_data_1` | string | Additional information about the original source for the contact with the earliest activity for this |
| Original Source Data 2 | `hs_analytics_source_data_2` | string | Additional information about the original source for the contact with the earliest activity for this |

</details>

<details><summary><strong>attribution_properties</strong> (1 properties)</summary>

| Property Name | Internal Name | Type | Description |
|---|---|---|---|
| Original Source Type | `hs_analytics_source` | enumeration | Original source for the contact with the earliest activity for this company or organization |

</details>

<details><summary><strong>buyer_intent_properties</strong> (1 properties)</summary>

| Property Name | Internal Name | Type | Description |
|---|---|---|---|
| Is Intent Monitored | `hs_is_intent_monitored` | bool | Company is being monitored by Intent Signals |

</details>

<details><summary><strong>company_activity</strong> (37 properties)</summary>

| Property Name | Internal Name | Type | Description |
|---|---|---|---|
| Recent Ticket Sentiment | `hs_customer_success_ticket_sentiment` | number | Aggregated sentiment of any tickets opened in the last 7 days and all currently open tickets associa |
| Date entered 'Lost - Churned (Lifecycle Stage Pipeline)' | `hs_date_entered_1066237962` | datetime | The date and time when the company entered the 'Lost - Churned' stage, 'Lifecycle Stage Pipeline' pi |
| Date entered 'Contact (Lifecycle Stage Pipeline)' | `hs_date_entered_1077045801` | datetime | The date and time when the company entered the 'Contact' stage, 'Lifecycle Stage Pipeline' pipeline |
| Date entered 'Partner (Lifecycle Stage Pipeline)' | `hs_date_entered_953312771` | datetime | The date and time when the company entered the 'Partner' stage, 'Lifecycle Stage Pipeline' pipeline |
| Date entered 'Customer (Lifecycle Stage Pipeline)' | `hs_date_entered_customer` | datetime | The date and time when the company entered the 'Customer' stage, 'Lifecycle Stage Pipeline' pipeline |
| Date entered 'Evangelist (Lifecycle Stage Pipeline)' | `hs_date_entered_evangelist` | datetime | The date and time when the company entered the 'Evangelist' stage, 'Lifecycle Stage Pipeline' pipeli |
| Date entered 'Lead (Lifecycle Stage Pipeline)' | `hs_date_entered_lead` | datetime | The date and time when the company entered the 'Lead' stage, 'Lifecycle Stage Pipeline' pipeline |
| Date entered 'Marketing Qualified Lead (Lifecycle Stage Pipeline)' | `hs_date_entered_marketingqualifiedlead` | datetime | The date and time when the company entered the 'Marketing Qualified Lead' stage, 'Lifecycle Stage Pi |
| Date entered 'Opportunity (Lifecycle Stage Pipeline)' | `hs_date_entered_opportunity` | datetime | The date and time when the company entered the 'Opportunity' stage, 'Lifecycle Stage Pipeline' pipel |
| Date entered 'Other (Lifecycle Stage Pipeline)' | `hs_date_entered_other` | datetime | The date and time when the company entered the 'Other' stage, 'Lifecycle Stage Pipeline' pipeline |
| Date entered 'Sales Qualified Lead (Lifecycle Stage Pipeline)' | `hs_date_entered_salesqualifiedlead` | datetime | The date and time when the company entered the 'Sales Qualified Lead' stage, 'Lifecycle Stage Pipeli |
| Date entered 'Subscriber (Lifecycle Stage Pipeline)' | `hs_date_entered_subscriber` | datetime | The date and time when the company entered the 'Subscriber' stage, 'Lifecycle Stage Pipeline' pipeli |
| Date exited 'Lost - Churned (Lifecycle Stage Pipeline)' | `hs_date_exited_1066237962` | datetime | The date and time when the company exited the 'Lost - Churned' stage, 'Lifecycle Stage Pipeline' pip |
| Date exited 'Contact (Lifecycle Stage Pipeline)' | `hs_date_exited_1077045801` | datetime | The date and time when the company exited the 'Contact' stage, 'Lifecycle Stage Pipeline' pipeline |
| Date exited 'Partner (Lifecycle Stage Pipeline)' | `hs_date_exited_953312771` | datetime | The date and time when the company exited the 'Partner' stage, 'Lifecycle Stage Pipeline' pipeline |
| Date exited 'Customer (Lifecycle Stage Pipeline)' | `hs_date_exited_customer` | datetime | The date and time when the company exited the 'Customer' stage, 'Lifecycle Stage Pipeline' pipeline |
| Date exited 'Evangelist (Lifecycle Stage Pipeline)' | `hs_date_exited_evangelist` | datetime | The date and time when the company exited the 'Evangelist' stage, 'Lifecycle Stage Pipeline' pipelin |
| Date exited 'Lead (Lifecycle Stage Pipeline)' | `hs_date_exited_lead` | datetime | The date and time when the company exited the 'Lead' stage, 'Lifecycle Stage Pipeline' pipeline |
| Date exited 'Marketing Qualified Lead (Lifecycle Stage Pipeline)' | `hs_date_exited_marketingqualifiedlead` | datetime | The date and time when the company exited the 'Marketing Qualified Lead' stage, 'Lifecycle Stage Pip |
| Date exited 'Opportunity (Lifecycle Stage Pipeline)' | `hs_date_exited_opportunity` | datetime | The date and time when the company exited the 'Opportunity' stage, 'Lifecycle Stage Pipeline' pipeli |
| Date exited 'Other (Lifecycle Stage Pipeline)' | `hs_date_exited_other` | datetime | The date and time when the company exited the 'Other' stage, 'Lifecycle Stage Pipeline' pipeline |
| Date exited 'Sales Qualified Lead (Lifecycle Stage Pipeline)' | `hs_date_exited_salesqualifiedlead` | datetime | The date and time when the company exited the 'Sales Qualified Lead' stage, 'Lifecycle Stage Pipelin |
| Date exited 'Subscriber (Lifecycle Stage Pipeline)' | `hs_date_exited_subscriber` | datetime | The date and time when the company exited the 'Subscriber' stage, 'Lifecycle Stage Pipeline' pipelin |
| Last Logged Outgoing Email Date | `hs_last_logged_outgoing_email_date` | datetime | The last date of logged outgoing emails associated with the company |
| Last Engagement Type | `hs_last_sales_activity_type` | enumeration | The type of the last engagement a company performed. This doesn't include marketing emails or emails |
| Last Modified Date | `hs_lastmodifieddate` | datetime | Most recent timestamp of any property update for this company. This includes HubSpot internal proper |
| Time in 'Lost - Churned (Lifecycle Stage Pipeline)' | `hs_time_in_1066237962` | number | The total time in seconds spent by the company in the 'Lost - Churned' stage, 'Lifecycle Stage Pipel |
| Time in 'Contact (Lifecycle Stage Pipeline)' | `hs_time_in_1077045801` | number | The total time in seconds spent by the company in the 'Contact' stage, 'Lifecycle Stage Pipeline' pi |
| Time in 'Partner (Lifecycle Stage Pipeline)' | `hs_time_in_953312771` | number | The total time in seconds spent by the company in the 'Partner' stage, 'Lifecycle Stage Pipeline' pi |
| Time in 'Customer (Lifecycle Stage Pipeline)' | `hs_time_in_customer` | number | The total time in seconds spent by the company in the 'Customer' stage, 'Lifecycle Stage Pipeline' p |
| Time in 'Evangelist (Lifecycle Stage Pipeline)' | `hs_time_in_evangelist` | number | The total time in seconds spent by the company in the 'Evangelist' stage, 'Lifecycle Stage Pipeline' |
| Time in 'Lead (Lifecycle Stage Pipeline)' | `hs_time_in_lead` | number | The total time in seconds spent by the company in the 'Lead' stage, 'Lifecycle Stage Pipeline' pipel |
| Time in 'Marketing Qualified Lead (Lifecycle Stage Pipeline)' | `hs_time_in_marketingqualifiedlead` | number | The total time in seconds spent by the company in the 'Marketing Qualified Lead' stage, 'Lifecycle S |
| Time in 'Opportunity (Lifecycle Stage Pipeline)' | `hs_time_in_opportunity` | number | The total time in seconds spent by the company in the 'Opportunity' stage, 'Lifecycle Stage Pipeline |
| Time in 'Other (Lifecycle Stage Pipeline)' | `hs_time_in_other` | number | The total time in seconds spent by the company in the 'Other' stage, 'Lifecycle Stage Pipeline' pipe |
| Time in 'Sales Qualified Lead (Lifecycle Stage Pipeline)' | `hs_time_in_salesqualifiedlead` | number | The total time in seconds spent by the company in the 'Sales Qualified Lead' stage, 'Lifecycle Stage |
| Time in 'Subscriber (Lifecycle Stage Pipeline)' | `hs_time_in_subscriber` | number | The total time in seconds spent by the company in the 'Subscriber' stage, 'Lifecycle Stage Pipeline' |

</details>

<details><summary><strong>company_signals</strong> (12 properties)</summary>

| Property Name | Internal Name | Type | Description |
|---|---|---|---|
| Count Intent Signals Created Last 14 Days | `hs_count_intent_signals_created_last_14_days` | number |  |
| Count Intent Signals Created Last 30 Days | `hs_count_intent_signals_created_last_30_days` | number |  |
| Count Intent Signals Created Last 7 Days | `hs_count_intent_signals_created_last_7_days` | number |  |
| Tracked Page Views (Last 30 Days) | `hs_intent_page_views_last_30_days` | number | Number of de-anonymized page views in the last 30 days |
| Intent paid up to date | `hs_intent_paid_up_to_date` | date | The date up until this object has had intent monitoring paid for.  Only set and updated if intent mo |
| Intent Signals active | `hs_intent_signals_enabled` | bool | Indicates whether intent signal tracking is currently active for this record |
| Tracked Visitors (Last 30 Days) | `hs_intent_visitors_last_30_days` | number | Number of de-anonymized visitors in the last 30 days |
| Latest Intent Signal Timestamp | `hs_latest_intent_signal_timestamp` | number |  |
| Last Tracked Visit Time | `hs_most_recent_de_anonymized_visit` | datetime | Most recent de-anonymized visit |
| Paid for Intent Signals | `hs_paid_for_intent_signals` | bool | If the record is up to date on their Intent Signals payment |
| Recent Intent Signals | `hs_recent_intent_signals` | enumeration | A rolling list of unique intent signal types detected for this company in the past 30 days. Each typ |
| Signals Summary | `hs_signals_summary` | string | A Summary of the Recent Company Signals |

</details>

<details><summary><strong>companyinformation</strong> (133 properties)</summary>

| Property Name | Internal Name | Type | Description |
|---|---|---|---|
| About Us | `about_us` | string | Short about-company |
| Account Engagement Score | `account_engagement_score` | number |  |
| Account Engagement Score threshold | `account_engagement_score_threshold` | enumeration |  |
| Account Score - Target Accounts | `account_score_target_accounts` | number |  |
| Account Score - Target Accounts engagement | `account_score_target_accounts_engagement` | number |  |
| Account Score - Target Accounts fit | `account_score_target_accounts_fit` | number |  |
| Account Score - Target Accounts threshold | `account_score_target_accounts_threshold` | enumeration |  |
| Street Address | `address` | string | The street address of the company or organization, including unit number. Powered by HubSpot Insight |
| Street Address 2 | `address2` | string | The additional address of the company or organization. Powered by HubSpot Insights. |
| Annual Revenue | `annualrevenue` | number | The actual or estimated annual revenue of the company. Powered by HubSpot Insights. |
| City | `city` | string | The city where the company is located. Powered by HubSpot Insights. |
| Close Date | `closedate` | datetime | The date the company or organization was closed as a customer |
| Country/Region | `country` | string | The country/region in which the company or organization is located. |
| Create Date | `createdate` | datetime | The date the company or organization was added to the database |
| Description | `description` | string | A short statement about the company's mission and goals. Powered by HubSpot Insights. |
| Company Domain Name | `domain` | string | The domain name of the company or organization |
| First Contact Create Date | `first_contact_createdate` | datetime | The date that the first contact from this company entered the system, which could pre-date the compa |
| first_contact_createdate_timestamp_earliest_value_78b50eea | `first_contact_createdate_timestamp_earliest_value_78b50eea` | datetime | Calculation context property providing timestamp for rollup property first_contact_createdate calcul |
| First Opportunity Created Date | `first_deal_created_date` | datetime | The create date of the first deal associated with this company record. |
| Year Founded | `founded_year` | string | The year the company was created. Powered by HubSpot Insights. |
| Additional Domains | `hs_additional_domains` | enumeration | Additional domains belonging to this company |
| All teams | `hs_all_accessible_team_ids` | enumeration | The team IDs, including the team hierarchy, of all default and custom owner properties for this reco |
| Brands | `hs_all_assigned_business_unit_ids` | enumeration | The brands this record is assigned to. |
| All owner IDs | `hs_all_owner_ids` | enumeration | Values of all default and custom owner properties for this record. |
| All team IDs | `hs_all_team_ids` | enumeration | The team IDs of all default and custom owner properties for this record. |
| Latest Traffic Source | `hs_analytics_latest_source` | enumeration | Source of the last session attributed to any contacts that are associated with this company |
| Latest Traffic Source Data 1 | `hs_analytics_latest_source_data_1` | string | Additional source details of the last session attributed to any contacts that are associated with th |
| Latest Traffic Source Data 2 | `hs_analytics_latest_source_data_2` | string | Additional source details of the last session attributed to any contacts that are associated with th |
| Latest Traffic Source Timestamp | `hs_analytics_latest_source_timestamp` | datetime | Timestamp of when latest source occurred |
| Annual Revenue Currency Code | `hs_annual_revenue_currency_code` | string | The currency code associated with the annual revenue amount |
| Avatar FileManager key | `hs_avatar_filemanager_key` | string | The path in the FileManager CDN for this company's avatar override image. Automatically set by HubSp |
| Calculated Phone Number in International Format | `hs_calculated_phone_number` | string | Phone number in international format |
| Country/Region Code | `hs_country_code` | string | Two-letter country code for the company headquarters location. |
| Created by user ID | `hs_created_by_user_id` | number | The user who created this record. This value is set automatically by HubSpot. |
| Object create date/time | `hs_createdate` | datetime | The date and time at which this object was created. This value is automatically set by HubSpot and m |
| CSM Sentiment | `hs_csm_sentiment` | enumeration | This property stores a CSM's sentiment towards a company. |
| Current Customer | `hs_current_customer` | enumeration | Indicates whether this record matches the portal's Current Customer filter criteria. Managed automat |
| Employee range | `hs_employee_range` | string | Numeric range of company's employees. Useful for segmenting companies by size. |
| GPS Error | `hs_gps_error` | string | This property specifies any error that may have occurred while geocoding a CRM object. |
| Latitudes | `hs_gps_latitude` | string | A company's latitude |
| Longitudes | `hs_gps_longitude` | string | A company's longitude |
| Industry group | `hs_industry_group` | string | Second tier of company industry classification. |
| Has been enriched | `hs_is_enriched` | bool | Indicates whether this object has ever had enriched properties written to it. |
| Company Keywords | `hs_keywords` | enumeration | A list of company vertical descriptors. Typically more granular than industry classification. |
| Last Logged Call Date | `hs_last_logged_call_date` | datetime | The last date of logged calls associated with the company |
| Last Metered Enrichment Timestamp | `hs_last_metered_enrichment_timestamp` | datetime | The timestamp of the most recent enrichment to this object via Breeze Intelligence |
| Last Open Task Date | `hs_last_open_task_date` | datetime | The last due date of open tasks associated with the company |
| last sales activity date old | `hs_last_sales_activity_date` | datetime | The date of the last sales activity with the company in seconds. |
| Last Engagement Date | `hs_last_sales_activity_timestamp` | datetime | The last time a contact engaged with your site or a form, document, meetings link, or tracked email. |
| Latest create date of active subscriptions | `hs_latest_createdate_of_active_subscriptions` | datetime | Latest created date of all associated active Subscriptions |
| Latest meeting activity | `hs_latest_meeting_activity` | datetime | The date of the most recent meeting (past or upcoming) logged for, scheduled with, or booked by a co |
| Latitude | `hs_latitude` | number | A company's latitude |
| Lead Status | `hs_lead_status` | enumeration | The company's sales, prospecting or outreach status |
| Linkedin handle | `hs_linkedin_handle` | string | Company's LinkedIn page handle |
| Live enrichment deadline | `hs_live_enrichment_deadline` | datetime | Deadline for freshly sourced enrichment data to be applied and cause a credit metering event. |
| Logo URL | `hs_logo_url` | string | URL of the company logo |
| Longitude | `hs_longitude` | number | A company's longitude |
| Merged Company IDs | `hs_merged_object_ids` | enumeration | The list of Company record IDs that have been merged into this Company. This value is set automatica |
| Last Activity | `hs_notes_last_activity` | object_coordinates | The coordinates of the last activity for a company. This is set automatically by HubSpot based on us |
| Next Activity | `hs_notes_next_activity` | object_coordinates | The coordinates of the next upcoming activity for a company. This is set automatically by HubSpot ba |
| Next Activity Type | `hs_notes_next_activity_type` | enumeration | The type of the next upcoming scheduled sales activity for this company record. |
| Number of child companies | `hs_num_child_companies` | number | The number of child companies of this company |
| Number of open Opportunities | `hs_num_open_deals` | number | The number of open deals associated with this company. |
| Record ID | `hs_object_id` | number | The unique ID for this record. This value is set automatically by HubSpot. |
| Record creation source | `hs_object_source` | string | Raw internal PropertySource present in the RequestMeta when this record was created. |
| Record source detail 1 | `hs_object_source_detail_1` | string | First level of detail on how this record was created. |
| Record source detail 2 | `hs_object_source_detail_2` | string | Second level of detail on how this record was created. |
| Record source detail 3 | `hs_object_source_detail_3` | string | Third level of detail on how this record was created. |
| Record creation source ID | `hs_object_source_id` | string | Raw internal sourceId present in the RequestMeta when this record was created. |
| Record source | `hs_object_source_label` | enumeration | How this record was created. |
| Record creation source user ID | `hs_object_source_user_id` | number | Raw internal userId present in the RequestMeta when this record was created. |
| Owning Teams | `hs_owning_teams` | enumeration | The teams that are attributed to this record. |
| Parent Company | `hs_parent_company_id` | number | The parent company of this company |
| Pinned Engagement ID | `hs_pinned_engagement_id` | number | The object ID of the current pinned engagement. This will only be shown if there is already an assoc |
| Pipeline | `hs_pipeline` | enumeration | The pipeline with which this company is currently associated |
| Likelihood to close | `hs_predictivecontactscore_v2` | number | The highest probability that a contact associated with this company will become a customer within th |
| hs_predictivecontactscore_v2_next_max_max_d4e58c1e | `hs_predictivecontactscore_v2_next_max_max_d4e58c1e` | number | Calculation context property providing next_max for rollup property hs_predictivecontactscore_v2 cal |
| Quick context | `hs_quick_context` | string |  |
| Read only object | `hs_read_only` | bool | Determines whether a record can be edited by a user. |
| Research Agent Execution Id | `hs_research_agent_execution_id` | string | Execution id of a run on the company research agent that performed research on this company |
| Research Agent Id | `hs_research_agent_id` | number | Agent instance id of the company research agent that performed research on this company |
| Revenue range | `hs_revenue_range` | string | Numeric estimate of the company’s annual revenue by range. |
| Recent Sales Email Replied Date | `hs_sales_email_last_replied` | datetime | The last time a tracked sales email was replied to by this company |
| Calculated Phone Number with country code | `hs_searchable_calculated_international_phone_number` | string | Phone number with country code |
| Calculated Phone Number without country code | `hs_searchable_calculated_phone_number` | string | Phone number without country code |
| Shared teams | `hs_shared_team_ids` | enumeration | Additional teams whose users can access the Company based on their permissions. This can be set manu |
| Shared users | `hs_shared_user_ids` | enumeration | Additional users that can access the Company based on their permissions. This can be set manually or |
| Source Object ID | `hs_source_object_id` | number | The ID of the object from which the data was migrated. This is set automatically during portal data  |
| State/Region Code | `hs_state_code` | string | The company's state or region code. |
| Target Account | `hs_target_account` | enumeration | The Target Account property is a means to flag high priority companies if you are following an accou |
| Target Account Probability | `hs_target_account_probability` | number | The probability a company is marked as a target account |
| Target Account Recommendation Snooze Time | `hs_target_account_recommendation_snooze_time` | datetime | The date when the target account recommendation is snoozed. |
| Target Account Recommendation State | `hs_target_account_recommendation_state` | enumeration | The state of the target account recommendation |
| Company task label | `hs_task_label` | string | A company name, fall back to its domain |
| Tax Id | `hs_tax_id` | enumeration | A government-issued tax identification type and number for the company. |
| Total open Opportunity value | `hs_total_deal_value` | number | The total value, in your company's currency, of all open deals associated with this company |
| Unique creation key | `hs_unique_creation_key` | string | Unique property used for idempotent creates |
| Updated by user ID | `hs_updated_by_user_id` | number | The user who last updated this record. This value is set automatically by HubSpot. |
| User IDs of all notification followers | `hs_user_ids_of_all_notification_followers` | enumeration | The user IDs of all users that have clicked follow within the object to opt-in to getting follow not |
| User IDs of all notification unfollowers | `hs_user_ids_of_all_notification_unfollowers` | enumeration | The user IDs of all object owners that have clicked unfollow within the object to opt-out of getting |
| User IDs of all owners | `hs_user_ids_of_all_owners` | enumeration | The user IDs of all owners of this record. |
| Performed in an import | `hs_was_imported` | bool | Object is part of an import |
| Owner assigned date | `hubspot_owner_assigneddate` | datetime | The most recent timestamp of when an owner was assigned to this record. This value is set automatica |
| Company owner | `hubspot_owner_id` | enumeration | The owner of the company |
| HubSpot Team | `hubspot_team_id` | enumeration | The team of the owner of the company. |
| HubSpot Score | `hubspotscore` | number | The sales and marketing score for the company or organization |
| Industry | `industry` | enumeration | The type of business the company performs. By default, this property has approximately 150 pre-defin |
| Is Public | `is_public` | bool | Indicates that the company is publicly traded. Powered by HubSpot Insights. |
| Lifecycle Stage | `lifecyclestage` | enumeration | The qualification of companies to sales readiness throughout the buying journey |
| Company name | `name` | string | The name of the company or organization. Powered by HubSpot Insights. |
| Last Contacted | `notes_last_contacted` | datetime | The last timestamp when a call, email or meeting was logged for a contact at this company. |
| Last Activity Date | `notes_last_updated` | datetime | The last time a note, call, meeting, or task was logged for a company. This is set automatically by  |
| Next Activity Date | `notes_next_activity_date` | datetime | The date of the next upcoming scheduled sales activity for this company record. |
| Number of Associated Contacts | `num_associated_contacts` | number | The number of contacts associated with this company |
| Number of Associated Opportunities | `num_associated_deals` | number | The number of deals associated with this company |
| Number of times contacted | `num_contacted_notes` | number | The number of times a call, email or meeting was logged for this company |
| Number of Sales Activities | `num_notes` | number | The number of times a call, chat conversation, LinkedIn message, postal mail, meeting, note, sales e |
| Number of Employees | `numberofemployees` | number | The total number of employees who work for the company or organization |
| HubSpot Owner Email | `owneremail` | string | HubSpot owner email for this company or organization |
| HubSpot Owner Name | `ownername` | string | HubSpot owner name for this company or organization |
| Phone Number | `phone` | string | Company primary phone number. |
| Recent Opportunity Amount | `recent_deal_amount` | number | The amount of the last deal closed |
| Recent Opportunity Close Date | `recent_deal_close_date` | datetime | The date of the last `closed won` deal associated with this company record. |
| Sales Activity Score | `sales_activity_score` | number |  |
| Sales Activity Score threshold | `sales_activity_score_threshold` | enumeration |  |
| State/Region | `state` | string | State or region in which the company or organization is located. |
| Time Zone | `timezone` | string | The time zone where the company or organization is located. Powered by HubSpot Insights. |
| Total Money Raised | `total_money_raised` | string | The total amount of money raised by the company. Powered by HubSpot Insights. |
| Total Revenue | `total_revenue` | number | The total amount of closed won deals |
| Type | `type` | enumeration | The optional classification of this company record - prospect, partner, etc. |
| Web Technologies | `web_technologies` | enumeration | The web technologies used by the company or organization. |
| Website URL | `website` | string | The main website of the company or organization. This property is used to identify unique companies. |
| Postal Code | `zip` | string | The postal or zip code of the company or organization. Powered by HubSpot Insights. |

</details>

<details><summary><strong>companylcs</strong> (46 properties)</summary>

| Property Name | Internal Name | Type | Description |
|---|---|---|---|
| Cumulative time in "Lost - Churned (Lifecycle Stage Pipeline)" | `hs_v2_cumulative_time_in_1066237962` | number | The cumulative time in seconds spent by the company in the 'Lost - Churned' stage, 'Lifecycle Stage  |
| Cumulative time in "Contact (Lifecycle Stage Pipeline)" | `hs_v2_cumulative_time_in_1077045801` | number | The cumulative time in seconds spent by the company in the 'Contact' stage, 'Lifecycle Stage Pipelin |
| Cumulative time in "Partner (Lifecycle Stage Pipeline)" | `hs_v2_cumulative_time_in_953312771` | number | The cumulative time in seconds spent by the company in the 'Partner' stage, 'Lifecycle Stage Pipelin |
| Cumulative time in "Customer (Lifecycle Stage Pipeline)" | `hs_v2_cumulative_time_in_customer` | number | The cumulative time in seconds spent by the company in the 'Customer' stage, 'Lifecycle Stage Pipeli |
| Cumulative time in "Evangelist (Lifecycle Stage Pipeline)" | `hs_v2_cumulative_time_in_evangelist` | number | The cumulative time in seconds spent by the company in the 'Evangelist' stage, 'Lifecycle Stage Pipe |
| Cumulative time in "Lead (Lifecycle Stage Pipeline)" | `hs_v2_cumulative_time_in_lead` | number | The cumulative time in seconds spent by the company in the 'Lead' stage, 'Lifecycle Stage Pipeline'  |
| Cumulative time in "Marketing Qualified Lead (Lifecycle Stage Pipeline)" | `hs_v2_cumulative_time_in_marketingqualifiedlead` | number | The cumulative time in seconds spent by the company in the 'Marketing Qualified Lead' stage, 'Lifecy |
| Cumulative time in "Opportunity (Lifecycle Stage Pipeline)" | `hs_v2_cumulative_time_in_opportunity` | number | The cumulative time in seconds spent by the company in the 'Opportunity' stage, 'Lifecycle Stage Pip |
| Cumulative time in "Other (Lifecycle Stage Pipeline)" | `hs_v2_cumulative_time_in_other` | number | The cumulative time in seconds spent by the company in the 'Other' stage, 'Lifecycle Stage Pipeline' |
| Cumulative time in "Sales Qualified Lead (Lifecycle Stage Pipeline)" | `hs_v2_cumulative_time_in_salesqualifiedlead` | number | The cumulative time in seconds spent by the company in the 'Sales Qualified Lead' stage, 'Lifecycle  |
| Cumulative time in "Subscriber (Lifecycle Stage Pipeline)" | `hs_v2_cumulative_time_in_subscriber` | number | The cumulative time in seconds spent by the company in the 'Subscriber' stage, 'Lifecycle Stage Pipe |
| Date entered "Lost - Churned (Lifecycle Stage Pipeline)" | `hs_v2_date_entered_1066237962` | datetime | The date and time when the company entered the 'Lost - Churned' stage, 'Lifecycle Stage Pipeline' pi |
| Date entered "Contact (Lifecycle Stage Pipeline)" | `hs_v2_date_entered_1077045801` | datetime | The date and time when the company entered the 'Contact' stage, 'Lifecycle Stage Pipeline' pipeline |
| Date entered "Partner (Lifecycle Stage Pipeline)" | `hs_v2_date_entered_953312771` | datetime | The date and time when the company entered the 'Partner' stage, 'Lifecycle Stage Pipeline' pipeline |
| Date entered current stage | `hs_v2_date_entered_current_stage` | datetime | The date this object entered its current pipeline stage |
| Date entered "Customer (Lifecycle Stage Pipeline)" | `hs_v2_date_entered_customer` | datetime | The date and time when the company entered the 'Customer' stage, 'Lifecycle Stage Pipeline' pipeline |
| Date entered "Evangelist (Lifecycle Stage Pipeline)" | `hs_v2_date_entered_evangelist` | datetime | The date and time when the company entered the 'Evangelist' stage, 'Lifecycle Stage Pipeline' pipeli |
| Date entered "Lead (Lifecycle Stage Pipeline)" | `hs_v2_date_entered_lead` | datetime | The date and time when the company entered the 'Lead' stage, 'Lifecycle Stage Pipeline' pipeline |
| Date entered "Marketing Qualified Lead (Lifecycle Stage Pipeline)" | `hs_v2_date_entered_marketingqualifiedlead` | datetime | The date and time when the company entered the 'Marketing Qualified Lead' stage, 'Lifecycle Stage Pi |
| Date entered "Opportunity (Lifecycle Stage Pipeline)" | `hs_v2_date_entered_opportunity` | datetime | The date and time when the company entered the 'Opportunity' stage, 'Lifecycle Stage Pipeline' pipel |
| Date entered "Other (Lifecycle Stage Pipeline)" | `hs_v2_date_entered_other` | datetime | The date and time when the company entered the 'Other' stage, 'Lifecycle Stage Pipeline' pipeline |
| Date entered "Sales Qualified Lead (Lifecycle Stage Pipeline)" | `hs_v2_date_entered_salesqualifiedlead` | datetime | The date and time when the company entered the 'Sales Qualified Lead' stage, 'Lifecycle Stage Pipeli |
| Date entered "Subscriber (Lifecycle Stage Pipeline)" | `hs_v2_date_entered_subscriber` | datetime | The date and time when the company entered the 'Subscriber' stage, 'Lifecycle Stage Pipeline' pipeli |
| Date exited "Lost - Churned (Lifecycle Stage Pipeline)" | `hs_v2_date_exited_1066237962` | datetime | The date and time when the company exited the 'Lost - Churned' stage, 'Lifecycle Stage Pipeline' pip |
| Date exited "Contact (Lifecycle Stage Pipeline)" | `hs_v2_date_exited_1077045801` | datetime | The date and time when the company exited the 'Contact' stage, 'Lifecycle Stage Pipeline' pipeline |
| Date exited "Partner (Lifecycle Stage Pipeline)" | `hs_v2_date_exited_953312771` | datetime | The date and time when the company exited the 'Partner' stage, 'Lifecycle Stage Pipeline' pipeline |
| Date exited "Customer (Lifecycle Stage Pipeline)" | `hs_v2_date_exited_customer` | datetime | The date and time when the company exited the 'Customer' stage, 'Lifecycle Stage Pipeline' pipeline |
| Date exited "Evangelist (Lifecycle Stage Pipeline)" | `hs_v2_date_exited_evangelist` | datetime | The date and time when the company exited the 'Evangelist' stage, 'Lifecycle Stage Pipeline' pipelin |
| Date exited "Lead (Lifecycle Stage Pipeline)" | `hs_v2_date_exited_lead` | datetime | The date and time when the company exited the 'Lead' stage, 'Lifecycle Stage Pipeline' pipeline |
| Date exited "Marketing Qualified Lead (Lifecycle Stage Pipeline)" | `hs_v2_date_exited_marketingqualifiedlead` | datetime | The date and time when the company exited the 'Marketing Qualified Lead' stage, 'Lifecycle Stage Pip |
| Date exited "Opportunity (Lifecycle Stage Pipeline)" | `hs_v2_date_exited_opportunity` | datetime | The date and time when the company exited the 'Opportunity' stage, 'Lifecycle Stage Pipeline' pipeli |
| Date exited "Other (Lifecycle Stage Pipeline)" | `hs_v2_date_exited_other` | datetime | The date and time when the company exited the 'Other' stage, 'Lifecycle Stage Pipeline' pipeline |
| Date exited "Sales Qualified Lead (Lifecycle Stage Pipeline)" | `hs_v2_date_exited_salesqualifiedlead` | datetime | The date and time when the company exited the 'Sales Qualified Lead' stage, 'Lifecycle Stage Pipelin |
| Date exited "Subscriber (Lifecycle Stage Pipeline)" | `hs_v2_date_exited_subscriber` | datetime | The date and time when the company exited the 'Subscriber' stage, 'Lifecycle Stage Pipeline' pipelin |
| Latest time in "Lost - Churned (Lifecycle Stage Pipeline)" | `hs_v2_latest_time_in_1066237962` | number | The total time in seconds spent by the company in the 'Lost - Churned' stage, 'Lifecycle Stage Pipel |
| Latest time in "Contact (Lifecycle Stage Pipeline)" | `hs_v2_latest_time_in_1077045801` | number | The total time in seconds spent by the company in the 'Contact' stage, 'Lifecycle Stage Pipeline' pi |
| Latest time in "Partner (Lifecycle Stage Pipeline)" | `hs_v2_latest_time_in_953312771` | number | The total time in seconds spent by the company in the 'Partner' stage, 'Lifecycle Stage Pipeline' pi |
| Latest time in "Customer (Lifecycle Stage Pipeline)" | `hs_v2_latest_time_in_customer` | number | The total time in seconds spent by the company in the 'Customer' stage, 'Lifecycle Stage Pipeline' p |
| Latest time in "Evangelist (Lifecycle Stage Pipeline)" | `hs_v2_latest_time_in_evangelist` | number | The total time in seconds spent by the company in the 'Evangelist' stage, 'Lifecycle Stage Pipeline' |
| Latest time in "Lead (Lifecycle Stage Pipeline)" | `hs_v2_latest_time_in_lead` | number | The total time in seconds spent by the company in the 'Lead' stage, 'Lifecycle Stage Pipeline' pipel |
| Latest time in "Marketing Qualified Lead (Lifecycle Stage Pipeline)" | `hs_v2_latest_time_in_marketingqualifiedlead` | number | The total time in seconds spent by the company in the 'Marketing Qualified Lead' stage, 'Lifecycle S |
| Latest time in "Opportunity (Lifecycle Stage Pipeline)" | `hs_v2_latest_time_in_opportunity` | number | The total time in seconds spent by the company in the 'Opportunity' stage, 'Lifecycle Stage Pipeline |
| Latest time in "Other (Lifecycle Stage Pipeline)" | `hs_v2_latest_time_in_other` | number | The total time in seconds spent by the company in the 'Other' stage, 'Lifecycle Stage Pipeline' pipe |
| Latest time in "Sales Qualified Lead (Lifecycle Stage Pipeline)" | `hs_v2_latest_time_in_salesqualifiedlead` | number | The total time in seconds spent by the company in the 'Sales Qualified Lead' stage, 'Lifecycle Stage |
| Latest time in "Subscriber (Lifecycle Stage Pipeline)" | `hs_v2_latest_time_in_subscriber` | number | The total time in seconds spent by the company in the 'Subscriber' stage, 'Lifecycle Stage Pipeline' |
| Time in current stage | `hs_v2_time_in_current_stage` | datetime | The time this object has spent in the current pipeline stage |

</details>

<details><summary><strong>conversioninformation</strong> (8 properties)</summary>

| Property Name | Internal Name | Type | Description |
|---|---|---|---|
| First Conversion Date | `first_conversion_date` | datetime | The first conversion date across all contacts associated this company or organization |
| First Conversion | `first_conversion_event_name` | string | The first form submitted across all contacts associated this company or organization |
| Number of Form Submissions | `num_conversion_events` | number | The number of form submissions for all contacts which have this company as their Primary company. |
| num_conversion_events_cardinality_sum_d095f14b | `num_conversion_events_cardinality_sum_d095f14b` | number | Calculation context property providing cardinality for rollup property num_conversion_events calcula |
| Recent Conversion Date | `recent_conversion_date` | datetime | The most recent conversion date across all contacts associated this company or organization |
| recent_conversion_date_timestamp_latest_value_72856da1 | `recent_conversion_date_timestamp_latest_value_72856da1` | datetime | Calculation context property providing timestamp for rollup property recent_conversion_date calculat |
| Recent Conversion | `recent_conversion_event_name` | string | The last form submitted across all contacts associated this company or organization |
| recent_conversion_event_name_timestamp_latest_value_66c820bf | `recent_conversion_event_name_timestamp_latest_value_66c820bf` | datetime | Calculation context property providing timestamp for rollup property recent_conversion_event_name ca |

</details>

<details><summary><strong>meeting_info</strong> (5 properties)</summary>

| Property Name | Internal Name | Type | Description |
|---|---|---|---|
| Date of last meeting booked in meetings tool | `engagements_last_meeting_booked` | datetime | The date of the most recent meeting an associated contact has booked through the meetings tool. |
| Campaign of last booking in meetings tool | `engagements_last_meeting_booked_campaign` | string | This UTM parameter shows which marketing campaign (e.g. a specific email) referred an associated con |
| Medium of last booking in meetings tool | `engagements_last_meeting_booked_medium` | string | This UTM parameter shows which channel (e.g. email) referred an associated contact to the meetings t |
| Source of last booking in meetings tool | `engagements_last_meeting_booked_source` | string | This UTM parameter shows which site (e.g. Twitter) referred an associated contact to the meetings to |
| Last Booked Meeting Date | `hs_last_booked_meeting_date` | datetime | The last date of booked meetings associated with the company |

</details>

<details><summary><strong>salesforceinformation</strong> (3 properties)</summary>

| Property Name | Internal Name | Type | Description |
|---|---|---|---|
| Salesforce Account ID | `salesforceaccountid` | string |  |
| Salesforce Deleted | `salesforcedeleted` | bool |  |
| Last Salesforce Sync Time | `salesforcelastsynctime` | datetime |  |

</details>

<details><summary><strong>socialmediainformation</strong> (8 properties)</summary>

| Property Name | Internal Name | Type | Description |
|---|---|---|---|
| Facebook Company Page | `facebook_company_page` | string | The URL of the Facebook company page for the company or organization |
| Facebook Fans | `facebookfans` | number | Number of facebook fans |
| Google Plus Page | `googleplus_page` | string | The URL of the Google Plus page for the company or organization |
| LinkedIn Company Page | `linkedin_company_page` | string | The URL of the LinkedIn company page for the company or organization |
| LinkedIn Bio | `linkedinbio` | string | The LinkedIn bio for the company or organization |
| Twitter Bio | `twitterbio` | string | The Twitter bio of the company or organization |
| Twitter Followers | `twitterfollowers` | number | The number of Twitter followers of the company or organization |
| Twitter Handle | `twitterhandle` | string | The main twitter account of the company or organization |

</details>

<details><summary><strong>targetaccountsinformation</strong> (5 properties)</summary>

| Property Name | Internal Name | Type | Description |
|---|---|---|---|
| Ideal Customer Profile Tier | `hs_ideal_customer_profile` | enumeration | This property shows how well a Company matches your Ideal Customer Profile. Companies that are Tier  |
| Target Account | `hs_is_target_account` | bool | The Target Account property identifies the companies that you are marketing and selling to as part o |
| Number of blockers | `hs_num_blockers` | number | The number of contacts associated with this company with the role of blocker. |
| Number of contacts with a buying role | `hs_num_contacts_with_buying_roles` | number | The number of contacts associated with this company with a buying role. |
| Number of decision makers | `hs_num_decision_makers` | number | The number of contacts associated with this company with the role of decision maker. |

</details>

---

## Deals

| Attribute | Value |
|---|---|
| **Type** | Standard Object |

**Total Properties:** 390 | **Custom:** 130 | **Calculated:** 52

### Custom Properties

| Property Name | Internal Name | Type | Field Type | Group | Description |
|---|---|---|---|---|---|
| Company Lead Source Category | `ac_lead_source_category` | enumeration | select | attribution_properties | The broader category that the lead source falls under when an account was created. |
| Contact Attribution Changed | `contact_attribution_changed` | datetime | date | attribution_properties | Ping when a contact associated with the deal has updated attribution. |
| Customer Lead Source Category | `cw_lead_source_category` | enumeration | select | attribution_properties | The broader category that the lead source falls under when a deal was closed won. |
| Customer Medium | `cw_medium` | string | text | attribution_properties | Most recent medium that a deal interacted with when an opportunity was closed won. |
| Customer Offer | `cw_offer` | string | text | attribution_properties | Most recent offer when a deal was closed won. |
| Customer Offer Type | `cw_offer_type` | enumeration | select | attribution_properties | The most recent offer type engaged with when a deal was closed won. |
| Customer Offer Type History | `cw_offer_type_history` | enumeration | checkbox | attribution_properties | An up-to-date history of all offers that a deal has interacted with when a deal was closed won. |
| Customer Source History | `cw_source_history` | enumeration | checkbox | attribution_properties | A record of all sources that influenced a deal when a deal was closed won. |
| Customer Variant | `cw_variant` | string | text | attribution_properties | The variant that a company most recently interacted with when a deal was closed won. |
| Demo Lead Source Category | `dc_lead_source_category` | enumeration | select | attribution_properties | The broader category that the lead source falls under when a demo was set. |
| Demo Medium | `dc_medium` | string | text | attribution_properties | Most recent medium that a deal interacted with when a demo was set. |
| Demo Offer | `dc_offer` | string | text | attribution_properties | Most recent offer when a demo was scheduled. |
| Demo Offer Type | `dc_offer_type` | enumeration | select | attribution_properties | The most recent offer type engaged with when a demo was set. |
| Demo Offer Type History | `dc_offer_type_history` | enumeration | checkbox | attribution_properties | The offer type engaged with most recently when a demo was set. |
| Demo Source History | `dc_source_history` | enumeration | checkbox | attribution_properties | A record of all sources that influenced a deal when a demo was set. |
| Demo Variant | `dc_variant` | string | text | attribution_properties | The variant that the company most recently interacted with when a demo was created. |
| Deal Hygiene Issues | `deal_hygiene_issues` | string | textarea | attribution_properties |  |
| Demo Source | `demo_source` | string | text | attribution_properties | Most recent source when a first demo was scheduled. |
| Latest Lead Source Category | `latest_lead_source_category` | enumeration | select | attribution_properties | The broader category that the lead source falls under. |
| Latest Offer Type | `latest_offer_type` | enumeration | select | attribution_properties | The most recent offer type engaged with. |
| Latest Offer Type History | `latest_offer_type_history` | enumeration | checkbox | attribution_properties | The offer types that a deal most recently engaged with. |
| Latest Variant | `latest_variant` | string | text | attribution_properties |  |
| Deal Source | `lead_source` | enumeration | select | attribution_properties | What interaction led directly to the creation of this deal? The most recent interaction of the person who committed to a |
| Original Lead Source Category | `lead_source_category` | enumeration | select | attribution_properties | The broader category that the lead source falls under. |
| Latest Medium | `medium` | string | text | attribution_properties | Most recent medium that a deal has interacted with. |
| Opportunity Lead Source Category | `oc_lead_source_category` | enumeration | select | attribution_properties | The broader category that the lead source falls under when an opportunity was created. |
| Opportunity Medium | `oc_medium` | string | text | attribution_properties | Most recent medium that a deal interacted with when an opportunity was created. |
| Opportunity Offer | `oc_offer` | string | text | attribution_properties | Most recent offer when an opportunity was created. |
| Opportunity Offer Type | `oc_offer_type` | enumeration | select | attribution_properties | The most recent offer type engaged with when an opportunity was created. |
| Opportunity Offer Type History | `oc_offer_type_history` | enumeration | checkbox | attribution_properties | An up-to-date history of all offers that a deal has interacted with when an opportunity was created. |
| Opportunity Source | `oc_source` | enumeration | checkbox | attribution_properties |  |
| Opportunity Source History | `oc_source_history` | enumeration | checkbox | attribution_properties | A record of all sources that influenced a deal when an opportunity was created. |
| Opportunity Variant | `oc_variant` | string | text | attribution_properties | The variant that a company most recently interacted with when an opportunity was created. |
| Original Offer Type | `original_offer_type` | enumeration | select | attribution_properties | The original offer type engaged with when a deal was first created. |
| Latest Source History | `source_history` | enumeration | checkbox | attribution_properties | A record of all sources that influenced a deal. |
| Stat Latest Source | `stat_latest_source` | enumeration | checkbox | attribution_properties |  |
| Stat Original Source | `stat_original_source` | enumeration | checkbox | attribution_properties |  |
| At Power | `at_power` | enumeration | booleancheckbox | deal_activity |  |
| Date Today | `date_today` | date | date | deal_activity |  |
| SNE | `sne` | number | calculation_equation | deal_activity | 1 if has SNE |
| Account Executive | `account_executive` | enumeration | select | dealinformation |  |
| Active Deal Y/N | `active_deal_yn` | number | number | dealinformation | Indicates whether a deal is active within the Rules of Engagement per deal stage. |
| Annual % Increase | `annual___increase` | number | number | dealinformation | Annual % increase that was agreed to in the contract. |
| BDR Owner | `bdr_owner` | enumeration | select | dealinformation |  |
| Commit for Forecasting | `blood_commit` | enumeration | booleancheckbox | dealinformation |  |
| Closed Lost - Explanation | `closed_lost___explanation` | string | textarea | dealinformation | Give a little more detail or context around why the deal closed. 2-3 sentences ideally so we can have a good chance of a |
| Conference Connection | `conference_connection` | enumeration | booleancheckbox | dealinformation | This lead generated from or the deal advanced by a meeting at a conference |
| Contract Notes | `contract_notes` | string | textarea | dealinformation | Note any uncommon or unusual elements of the contract that finance or CS would need to be aware of. |
| Contract Start Date | `contract_start_date` | date | date | dealinformation | The contract start date for accounting purposes is the last signature date of the MSA, or if another effective date is s |
| CSE | `cse` | enumeration | select | dealinformation |  |
| Days Since Last Activity | `days_since_last_activity` | datetime | calculation_equation | dealinformation |  |
| Deal Age | `deal_age_v2` | datetime | calculation_equation | dealinformation |  |
| Flag for Sales Meeting Discussion | `flag_for_sales_meeting_discussion` | enumeration | booleancheckbox | dealinformation |  |
| go_live_date | `go_live_date` | number | number | dealinformation |  |
| Lead | `lead` | string | text | dealinformation |  |
| Mini Expansion - Exclude from Onboarding View | `mini_expansion___exclude_from_onboarding_view` | enumeration | booleancheckbox | dealinformation |  |
| # Of Decision Makers | `of_decision_makers` | number | calculation_rollup | dealinformation |  |
| Partner Name | `partner_name` | enumeration | select | dealinformation |  |
| Proposed Attribution Fix | `proposed_attribution_fix` | string | textarea | dealinformation | What the attribution hygiene workflow recommends fixing. |
| Referring Party | `referring_party` | string | text | dealinformation |  |
| Revenue Per Room | `revenue_per_room` | number | calculation_equation | dealinformation |  |
| Room Count | `room_count` | number | number | dealinformation |  |
| Time since Last Activity | `time_since_last_activity` | number | calculation_equation | dealinformation |  |
| Champion Associated | `champion_associated` | enumeration | select | dealstages |  |
| SNE Scheduled? | `sne_scheduled_` | enumeration | booleancheckbox | dealstages | This property is required to create a deal. |
| Solutions Engineer Involved | `solutions_engineer_involved` | enumeration | select | dealstages |  |
| Amounts to invoice | `amounts_to_invoice` | string | textarea | finance_info | If invoicing will occur at different points, please list the date & amount for each invoice. |
| Invoicing Contact Email Address | `invoicing_contact_email_address` | string | text | finance_info | The email that the invoice should be sent to. |
| Invoicing Date | `invoicing_date` | date | date | finance_info | The specific date that the invoice should be sent. |
| Referral Credit | `referral_credit` | number | number | finance_info | This is the referral credit amount paid out when this deal closed, NOT the referral credit that this org earned. |
| Referring Customer (Org Name) | `referring_customer__org_name_` | string | text | finance_info | The name of the referring organization. |
| At Risk | `grain_at_risk` | bool | booleancheckbox | grain | Grain infers whether or not the deal is at risk |
| Champion | `grain_meddpicc_champion` | string | textarea | grain_meddpicc | A person who pushes back, removes barriers, answers hard questions, influences/has authority, sells internally (our solu |
| Competition | `grain_meddpicc_competition` | string | textarea | grain_meddpicc | Any person, vendor, or initiative competing for the same funds or resources you are. |
| Decision Process | `grain_meddpicc_decision_criteria` | string | textarea | grain_meddpicc | The steps, stakeholders, and timeline involved in making a purchasing decision. |
| Decision Criteria | `grain_meddpicc_decision_process` | string | textarea | grain_meddpicc | The formal criteria the customer uses to evaluate and select a solution. (Technical requirements, security, legal, etc.) |
| Economic Buyer | `grain_meddpicc_economic_buyer` | string | textarea | grain_meddpicc | The person with the overall authority in the buying decision. |
| Identify Pain | `grain_meddpicc_implicated_pain` | string | textarea | grain_meddpicc | Means you have both Identified, Indicated, and Implicated the Pain your solution solves upon your customer. |
| Metrics | `grain_meddpicc_metrics` | string | textarea | grain_meddpicc | Quantifiable measures of value that your solution can provide. |
| Customer Budget | `grain_budget` | string | text | grain_old | List of moments where the customer discusses their budget |
| Competition | `grain_competition` | string | text | grain_old | List of competitors mentioned during the call |
| Customer Needs | `grain_customer_needs` | string | text | grain_old | List of moments where the customer discusses their needs in a solution |
| Stakeholders | `grain_stakeholders` | string | text | grain_old | Who are the stakeholders in the customer's organization |
| Next Meeting | `grain_timeline` | string | text | grain_old | When is the next meeting with the customer |
| Building Status | `building_status` | enumeration | select | onboarding_records |  |
| Executed PDF Agreement | `executed_pdf_agreement` | string | file | onboarding_records |  |
| Onboarding | `onboarding` | enumeration | booleancheckbox | onboarding_records | This property communicates whether a deal is currently in onboarding. |
| Onboarding Score | `onboarding_score` | number | number | onboarding_records | CSE and IT score from Onboarding Scorecard. |
| AE Director Override | `ae_director_override__c` | number | number | salesforceinformation |  |
| ARR | `arr__c` | number | number | salesforceinformation |  |
| Biz Dev Lead | `biz_dev_lead__c` | enumeration | booleancheckbox | salesforceinformation |  |
| CSE Commission | `client_success_exec_commission__c` | number | number | salesforceinformation |  |
| Clinic Goals | `clinic_goals__c` | string | textarea | salesforceinformation |  |
| Commission Status | `comission_status__c` | enumeration | select | salesforceinformation |  |
| Competition | `competition__c` | string | textarea | salesforceinformation |  |
| Conference Name | `conference_name__c` | string | text | salesforceinformation |  |
| Contract Expiration Date | `contract_expiration_date__c` | date | date | salesforceinformation |  |
| CS Director Override | `cs_director_override__c` | number | number | salesforceinformation |  |
| Decision Criteria retired | `decision_criteria__c` | string | textarea | salesforceinformation |  |
| Decision Process retired | `decision_process__c` | string | textarea | salesforceinformation |  |
| Economic Buyer | `economic_buyer__c` | string | textarea | salesforceinformation |  |
| Effective Room Rate | `effective_room_rate` | number | number | salesforceinformation |  |
| EHR ARR | `ehr_arr__c` | number | number | salesforceinformation |  |
| Emergency Buttons ARR | `emergency_button_options__c` | number | number | salesforceinformation |  |
| Emergency Button Rooms | `emergency_button_rooms__c` | number | number | salesforceinformation |  |
| Emergency Call Button | `emergency_call_button__c` | number | number | salesforceinformation |  |
| Exam Rooms | `exam_rooms__c` | number | number | salesforceinformation |  |
| Existing Contracted Rooms | `existing_contracted_rooms__c` | number | number | salesforceinformation |  |
| Flowstation | `flowstation__c` | number | number | salesforceinformation |  |
| Go Live Date | `go_live_date__c` | date | date | salesforceinformation |  |
| Implicate The Pain | `implicate_the_pain__c` | string | textarea | salesforceinformation |  |
| Industry | `industry__c` | enumeration | select | salesforceinformation |  |
| Install Date | `install_date__c` | date | date | salesforceinformation |  |
| Locator Rooms | `locator_rooms__c` | number | number | salesforceinformation |  |
| Lost Reason | `lost_reason__c` | enumeration | select | salesforceinformation |  |
| Metrics | `metrics__c` | string | textarea | salesforceinformation |  |
| Notes & Details | `notes_details__c` | string | textarea | salesforceinformation |  |
| One Time Charge | `one_time_charge__c` | number | number | salesforceinformation |  |
| One Time Fee | `one_time_fee__c` | number | number | salesforceinformation |  |
| AE (Op Owner) Commission % | `opportunity_owner_commission__c` | number | number | salesforceinformation |  |
| Paper Process | `paper_process__c` | string | textarea | salesforceinformation |  |
| Partner/BD Rep | `partner_bd_rep__c` | enumeration | select | salesforceinformation |  |
| Partner Commission % | `partner_commission__c` | number | number | salesforceinformation |  |
| Pro Rated EHR Revenue | `pro_rated_ehr_revenue__c` | number | number | salesforceinformation |  |
| Pro Rated First Year Revenue | `pro_rated_first_year_revenue__c` | number | number | salesforceinformation |  |
| Pro Rated Nurse Call Options | `pro_rated_nurse_call_options__c` | number | number | salesforceinformation |  |
| Room Rate | `room_rate` | number | number | salesforceinformation |  |
| Room Rate Discount | `room_rate_discount` | number | number | salesforceinformation |  |
| SyncTimes Room Rate | `synctimes_room_rate` | number | number | salesforceinformation |  |
| Total First Year Revenue | `total_first_year_revenue` | number | number | salesforceinformation |  |

### HubSpot-Defined Properties (by Group)

<details><summary><strong>analyticsinformation</strong> (10 properties)</summary>

| Property Name | Internal Name | Type | Description |
|---|---|---|---|
| Latest Traffic Source Company | `hs_analytics_latest_source_company` | enumeration | Source for the company with an associated contact with the last session activity for this deal |
| Latest Traffic Source Contact | `hs_analytics_latest_source_contact` | enumeration | Source for the directly associated contact with the last session activity for this deal |
| Latest Traffic Source Data 1 Company | `hs_analytics_latest_source_data_1_company` | string | Additional source details of the last session attributed to any contacts that are indirectly associa |
| Latest Traffic Source Data 1 Contact | `hs_analytics_latest_source_data_1_contact` | string | Additional source details of the last session attributed to any contacts that are directly associate |
| Latest Traffic Source Data 2 | `hs_analytics_latest_source_data_2` | string | Additional source details of the last session attributed to any contacts that are directly or indire |
| Latest Traffic Source Data 2 Company | `hs_analytics_latest_source_data_2_company` | string | Additional source details of the last session attributed to any contacts that are indirectly associa |
| Latest Traffic Source Data 2 Contact | `hs_analytics_latest_source_data_2_contact` | string | Additional source details of the last session attributed to any contacts that are directly associate |
| Latest Traffic Source Timestamp | `hs_analytics_latest_source_timestamp` | datetime | Timestamp of when latest source occurred for either a directly or indirectly associated contact |
| Latest Traffic Source Timestamp Company | `hs_analytics_latest_source_timestamp_company` | datetime | Timestamp of when latest source occurred for an indirectly associated contact |
| Latest Traffic Source Timestamp Contact | `hs_analytics_latest_source_timestamp_contact` | datetime | Timestamp of when latest source occurred for a directly associated contact |

</details>

<details><summary><strong>attribution_properties</strong> (10 properties)</summary>

| Property Name | Internal Name | Type | Description |
|---|---|---|---|
| Source of last booking in meetings tool | `engagements_last_meeting_booked_source` | string | This UTM parameter shows which site (e.g. Twitter) referred an associated contact to the meetings to |
| Latest Traffic Source | `hs_analytics_latest_source` | enumeration | Source for the contact either directly or indirectly associated with the last session activity for t |
| Latest Traffic Source Data 1 | `hs_analytics_latest_source_data_1` | string | Additional source details of the last session attributed to any contacts that are directly or indire |
| Original Traffic Source | `hs_analytics_source` | enumeration | Original source for the contact with the earliest activity for this deal. |
| Original Traffic Source Drill-Down 1 | `hs_analytics_source_data_1` | string | Additional information about the original source for the associated contact, or associated company i |
| Original Traffic Source Drill-Down 2 | `hs_analytics_source_data_2` | string | Additional information about the original source for the associated contact, or associated company i |
| Record source detail 1 | `hs_object_source_detail_1` | string | First level of detail on how this record was created. |
| Record source detail 2 | `hs_object_source_detail_2` | string | Second level of detail on how this record was created. |
| Record source detail 3 | `hs_object_source_detail_3` | string | Third level of detail on how this record was created. |
| Record source | `hs_object_source_label` | enumeration | How this record was created. |

</details>

<details><summary><strong>deal_activity</strong> (21 properties)</summary>

| Property Name | Internal Name | Type | Description |
|---|---|---|---|
| Associated Shared Opportunity Type | `hs_associated_deal_registration_deal_type` | enumeration | The deal type of the associated Shared Deal. (This field is only accurate on Partner portals!) |
| Associated Shared Opportunity Product Interests | `hs_associated_deal_registration_product_interests` | enumeration | The most likely HubSpot product(s) of the deal synced from the associated Shared Deal. (This field i |
| HubSpot Shared Deal MRR | `hs_deal_registration_mrr` | number | MRR of the quote purchased for this Shared Deal. |
| HubSpot Shared Deal MRR Currency Code | `hs_deal_registration_mrr_currency_code` | enumeration | Currency code for the MRR of the quote purchased for this Shared Deal. |
| Has Last Meeting Follow Ups | `hs_has_last_meeting_followups` | bool | Indicates if the most recent meeting has follow ups. True if hs_last_meeting_id_with_followups has a |
| Is Active Shared Deal | `hs_is_active_shared_deal` | bool | Indicates if the current deal is an active shared deal. It is set automatically based on the value o |
| Is closed lost | `hs_is_closed_lost` | bool | True if the deal is in the closed lost state, false otherwise |
| Is Closed Won | `hs_is_closed_won` | bool | True if the deal is in the closed won state, false otherwise |
| Last call ID with followups | `hs_last_call_id_with_followups` | number | The object ID of the most recent call that has follow-up items to complete |
| Last GS Shared Message | `hs_last_gs_shared_message` | datetime | when was the last gs shared message? |
| Last meeting ID with followups | `hs_last_meeting_id_with_followups` | number | The object ID of the most recent meeting that has follow-up items to complete |
| Last Partner Shared Message Date | `hs_last_partner_shared_message_date` | date | When was the last shared message sent on this deal by a Partner? |
| Last Shared Message Create Date | `hs_last_shared_message_create_date` | datetime | The date of the most recent shared message on this deal. |
| Last Modified Date | `hs_lastmodifieddate` | datetime | Most recent timestamp of any property update for this deal. This includes HubSpot internal propertie |
| Latest Approval Status | `hs_latest_approval_status` | string | The latest approval status. Used by HubSpot to track pipeline approval processes. |
| Latest Approval Status Approval ID | `hs_latest_approval_status_approval_id` | number | The ID of the approval object containing the latest approval status. |
| Net Pipeline Impact | `hs_net_pipeline_impact` | number | This property is intended for measuring pipeline impact in the Deal Pipeline Waterfall report in Sal |
| Number of Active Opportunity Registrations | `hs_num_associated_active_deal_registrations` | number | The number of active deal registrations associated with this deal. This property is set automaticall |
| Number of Opportunity Registrations | `hs_num_associated_deal_registrations` | number | The number of deal registrations associated with this deal. This property is set automatically by Hu |
| Number of Deal Splits | `hs_num_associated_deal_splits` | number | The number of deal splits associated with this deal. This property is set automatically by HubSpot. |
| HubSpot Sales Lead | `hs_synced_deal_owner_name_and_email` | string | The HubSpot sales lead that owns this Shared Deal. |

</details>

<details><summary><strong>dealinformation</strong> (106 properties)</summary>

| Property Name | Internal Name | Type | Description |
|---|---|---|---|
| Amount | `amount` | number | The total amount of the deal |
| Amount in company currency | `amount_in_home_currency` | number | The amount of the deal, using the exchange rate, in your company's currency |
| Closed Lost Reason | `closed_lost_reason` | enumeration | Reason why this deal was lost |
| Closed Won Reason | `closed_won_reason` | string | Reason why this deal was won |
| Close Date | `closedate` | datetime | The expected close date of the deal |
| Create Date | `createdate` | datetime | The date the deal was created. This property is set automatically by HubSpot. |
| Days to close | `days_to_close` | number | The number of days the deal took to close |
| Currency | `deal_currency_code` | enumeration | Currency code for the deal. |
| Opportunity Name | `dealname` | string | The name given to this deal. |
| Opportunity Stage | `dealstage` | enumeration | The stage of the deal. Deal stages allow you to categorize and track the progress of the deals that  |
| Opportunity Type | `dealtype` | enumeration | The type of deal. By default, categorize your deal as either a New Business or Existing Business. |
| Opportunity Description | `description` | string | Description of the deal |
| Date of last meeting booked in meetings tool | `engagements_last_meeting_booked` | datetime | The date of the most recent meeting an associated contact has booked through the meetings tool. |
| Campaign of last booking in meetings tool | `engagements_last_meeting_booked_campaign` | string | This UTM parameter shows which marketing campaign (e.g. a specific email) referred an associated con |
| Medium of last booking in meetings tool | `engagements_last_meeting_booked_medium` | string | This UTM parameter shows which channel (e.g. email) referred an associated contact to the meetings t |
| Actual duration | `hs_actual_duration` | number | Calculates the time between the create date and close date. If the create date occurs after the clos |
| Annual contract value | `hs_acv` | number | The annual contract value (ACV) of this deal. |
| All teams | `hs_all_accessible_team_ids` | enumeration | The team IDs, including the team hierarchy, of all default and custom owner properties for this reco |
| Brands | `hs_all_assigned_business_unit_ids` | enumeration | The brands this record is assigned to. |
| Opportunity Collaborator | `hs_all_collaborator_owner_ids` | enumeration | Owner ids of the users involved in closing the deal |
| Opportunity Split Users | `hs_all_deal_split_owner_ids` | enumeration | The owner ids of all associated Deal Splits. This property is set automatically by HubSpot. |
| All owner IDs | `hs_all_owner_ids` | enumeration | Values of all default and custom owner properties for this record. |
| All team IDs | `hs_all_team_ids` | enumeration | The team IDs of all default and custom owner properties for this record. |
| Annual recurring revenue | `hs_arr` | number | The annual recurring revenue (ARR) of this deal. |
| Attributed reporting team | `hs_attributed_team_ids` | enumeration | The set of teams that this deal is attributed to. If an owner is specified at the time of creation,  |
| HubSpot Campaign | `hs_campaign` | string | The marketing campaign the deal is associated with |
| Closed Deal Amount | `hs_closed_amount` | number | Returns the amount if the deal is closed. Else, returns 0. |
| Closed deal amount in home currency | `hs_closed_amount_in_home_currency` | number | The amount in home currency that was closed for deals that were won. |
| Closed won count | `hs_closed_won_count` | number | This property is 1 if the deal is closed won, otherwise 0. |
| Closed Won Date (Internal) | `hs_closed_won_date` | datetime | Returns closedate if this deal is closed won |
| Created by user ID | `hs_created_by_user_id` | number | The user who created this record. This value is set automatically by HubSpot. |
| HubSpot Create Date | `hs_createdate` | datetime | The date the deal was created. This property is set automatically by HubSpot. |
| Days to close (without rounding) | `hs_days_to_close_raw` | number | The number of days the deal took to close, without rounding |
| Deal amount calculation preference | `hs_deal_amount_calculation_preference` | enumeration | Specifies how deal amount should be calculated from line items |
| Opportunity Score | `hs_deal_score` | number | The predictive deal score calculated by Hubspot AI to score the deal health |
| Opportunity probability | `hs_deal_stage_probability` | number | The probability a deal will close. This defaults to the deal stage probability setting. |
| Deal stage probability shadow | `hs_deal_stage_probability_shadow` | number | Fall back property for calculating the deal stage when no customer override exist.  Probability betw |
| Exchange rate | `hs_exchange_rate` | number | This is the exchange rate used to convert the deal amount into your company currency. |
| Forecast amount | `hs_forecast_amount` | number | The custom forecasted deal value calculated by multiplying the forecast probability and deal amount  |
| Forecast probability | `hs_forecast_probability` | number | The custom percent probability a deal will close. |
| Has Empty Conditional Stage Properties | `hs_has_empty_conditional_stage_properties` | bool | True if the deal is missing conditional stage property values required to progress to the next deal  |
| Is Opportunity Closed? | `hs_is_closed` | bool | True if the deal was won or lost. |
| Is Closed (numeric) | `hs_is_closed_count` | number | This property is 1 if the deal is closed ("Closed Won" or "Closed Lost"), otherwise 0 |
| Opportunity Split Added | `hs_is_deal_split` | bool | Indicates if the deal is split between multiple users. |
| Is In First Deal Stage | `hs_is_in_first_deal_stage` | bool | True if the deal is in the first stage of its pipeline. This is set automatically by HubSpot based o |
| Is Open (numeric) | `hs_is_open_count` | number | This property is 1 if the deal is not closed won or closed lost, otherwise 0 |
| Latest meeting activity | `hs_latest_meeting_activity` | datetime | The date of the most recent meeting (past or upcoming) logged for, scheduled with, or booked by a co |
| Likelihood to close by the close date | `hs_likelihood_to_close` | number | Hubspot predicted likelihood between 0 and 1 of the deal to close by the close date. |
| Line item context ID | `hs_line_item_context_id` | number | ID reference to a LineItemContext object that stores additional context around the Line Items associ |
| Global Term Line Item Discount Percentage | `hs_line_item_global_term_hs_discount_percentage` | string | For internal HubSpot Application use only. Global term for the discount percentage applied. |
| Global Term Line Item Discount Percentage Enabled | `hs_line_item_global_term_hs_discount_percentage_enabled` | bool | For internal HubSpot Application use only. Indicates if the Global term for the discount percentage  |
| Global Term Line Item Recurring Billing Period | `hs_line_item_global_term_hs_recurring_billing_period` | string | For internal HubSpot Application use only. Global term for product recurring billing duration. |
| Global Term Line Item Recurring Billing Period Enabled | `hs_line_item_global_term_hs_recurring_billing_period_enabled` | bool | For internal HubSpot Application use only. Indicates if the Global term for product recurring billin |
| Global Term Line Item Recurring Billing Start Date | `hs_line_item_global_term_hs_recurring_billing_start_date` | string | For internal HubSpot Application use only. Global term for recurring billing start date for a line i |
| Global Term Line Item Recurring Billing Start Date Enabled | `hs_line_item_global_term_hs_recurring_billing_start_date_enabled` | bool | For internal HubSpot Application use only. Indicates if the Global term for recurring billing start  |
| Global Term Line Item Recurring Billing Frequency | `hs_line_item_global_term_recurringbillingfrequency` | string | For internal HubSpot Application use only. Global term for how frequently the product is billed. |
| Global Term Line Item Recurring Billing Frequency Enabled | `hs_line_item_global_term_recurringbillingfrequency_enabled` | bool | For internal HubSpot Application use only. Indicates if the Global term for how frequently the produ |
| Manual campaign ids | `hs_manual_campaign_ids` | number | The campaign object ids of deals manually associated to campaigns |
| Forecast category | `hs_manual_forecast_category` | enumeration | The likelihood a deal will close. This property is used for manual forecasting your deals. |
| Merged Opportunity IDs | `hs_merged_object_ids` | enumeration | The list of Deal record IDs that have been merged into this Deal. This value is set automatically by |
| Monthly recurring revenue | `hs_mrr` | number | The monthly recurring revenue (MRR) of this deal. |
| Next Meeting | `hs_next_meeting_id` | number |  |
| Next Meeting Name | `hs_next_meeting_name` | string |  |
| Next Meeting Start Time | `hs_next_meeting_start_time` | datetime |  |
| Next step | `hs_next_step` | string | A short description of the next step for the deal |
| Next Step Updated At | `hs_next_step_updated_at` | datetime | Timestamp of the most recent update to Next Step property |
| Last Activity | `hs_notes_last_activity` | object_coordinates | The coordinates of the last activity for a deal. This is set automatically by HubSpot based on user  |
| Next Activity | `hs_notes_next_activity` | object_coordinates | The coordinates of the next upcoming activity for a deal. This is set automatically by HubSpot based |
| Next Activity Type | `hs_notes_next_activity_type` | enumeration | The type of the next upcoming activity for a deal. This property is set automatically by HubSpot bas |
| Number of Associated Line Items | `hs_num_of_associated_line_items` | number | The number of line items associated with this deal |
| Number of target accounts | `hs_num_target_accounts` | number | The number of target account companies associated with this deal. This property is set automatically |
| Record ID | `hs_object_id` | number | The unique ID for this record. This value is set automatically by HubSpot. |
| Record creation source | `hs_object_source` | string | Raw internal PropertySource present in the RequestMeta when this record was created. |
| Record creation source ID | `hs_object_source_id` | string | Raw internal sourceId present in the RequestMeta when this record was created. |
| Record creation source user ID | `hs_object_source_user_id` | number | Raw internal userId present in the RequestMeta when this record was created. |
| Owning Teams | `hs_owning_teams` | enumeration | The teams that are attributed to this record. |
| Pinned Engagement ID | `hs_pinned_engagement_id` | number | The object ID of the current pinned engagement. This will only be shown if there is already an assoc |
| The predicted deal amount | `hs_predicted_amount` | number | Returns the multiplication of the deal amount times the predicted likelihood of the deal to close by |
| The predicted deal amount in your company's currency | `hs_predicted_amount_in_home_currency` | number | Returns the multiplication of the deal amount in your company's currency times the predicted likelih |
| Primary Associated Company | `hs_primary_associated_company` | number | Object Id of the Primary Associated Company. |
| Priority | `hs_priority` | enumeration |  |
| Weighted amount | `hs_projected_amount` | number | Returns the multiplication of the amount times the probability of the deal closing. |
| Weighted amount in company currency | `hs_projected_amount_in_home_currency` | number | The deal’s amount in home currency multiplied by its probability of closing, which is determined bas |
| Read only object | `hs_read_only` | bool | Determines whether a record can be edited by a user. |
| Recent Sales Email Replied Date | `hs_sales_email_last_replied` | datetime | The last time a tracked sales email was replied to for this deal |
| Shared teams | `hs_shared_team_ids` | enumeration | Additional teams whose users can access the Deal based on their permissions. This can be set manuall |
| Shared users | `hs_shared_user_ids` | enumeration | Additional users that can access the Deal based on their permissions. This can be set manually or th |
| Source Object ID | `hs_source_object_id` | number | The ID of the object from which the data was migrated. This is set automatically during portal data  |
| Opportunity Tags | `hs_tag_ids` | enumeration | List of tag ids applicable to a deal. This property is set automatically by HubSpot. |
| Total contract value | `hs_tcv` | number | The total contract value (TCV) of this deal. |
| Unique creation key | `hs_unique_creation_key` | string | Unique property used for idempotent creates |
| Updated by user ID | `hs_updated_by_user_id` | number | The user who last updated this record. This value is set automatically by HubSpot. |
| User IDs of all notification followers | `hs_user_ids_of_all_notification_followers` | enumeration | The user IDs of all users that have clicked follow within the object to opt-in to getting follow not |
| User IDs of all notification unfollowers | `hs_user_ids_of_all_notification_unfollowers` | enumeration | The user IDs of all object owners that have clicked unfollow within the object to opt-out of getting |
| User IDs of all owners | `hs_user_ids_of_all_owners` | enumeration | The user IDs of all owners of this record. |
| Performed in an import | `hs_was_imported` | bool | Object is part of an import |
| Owner assigned date | `hubspot_owner_assigneddate` | datetime | The most recent timestamp of when an owner was assigned to this record. This value is set automatica |
| Opportunity owner | `hubspot_owner_id` | enumeration | The owner of the deal |
| HubSpot Team | `hubspot_team_id` | enumeration | The team of the owner of the deal. |
| Last Contacted | `notes_last_contacted` | datetime | The last time a call, sales email, or meeting was logged for this deal. This is set automatically by |
| Last Activity Date | `notes_last_updated` | datetime | The last time a note, call, email, meeting, or task was logged for a deal. This is set automatically |
| Next Activity Date | `notes_next_activity_date` | datetime | The date of the next upcoming activity for a deal. This property is set automatically by HubSpot bas |
| Number of Associated Contacts | `num_associated_contacts` | number | The number of contacts associated with this deal. This property is set automatically by HubSpot. |
| Number of times contacted | `num_contacted_notes` | number | The number of times a call, email or meeting was logged for this deal |
| Number of Sales Activities | `num_notes` | number | The total number of sales activities (notes, calls, emails, meetings, or tasks) logged for a deal. T |
| Pipeline | `pipeline` | enumeration | The pipeline the deal is in. This determines which stages are options for the deal. |

</details>

<details><summary><strong>dealscripted</strong> (9 properties)</summary>

| Property Name | Internal Name | Type | Description |
|---|---|---|---|
| Average Deal Owner Duration In Current Stage | `hs_average_deal_owner_duration_in_current_stage` | number | Time duration of the calculated average time of closed-won deals spent in current pipeline stage |
| Closed Deal Close Date | `hs_closed_deal_close_date` | number | Close date populated only if this deal is closed and valid |
| Closed Deal Create Date | `hs_closed_deal_create_date` | number | Create date populated only if this deal is closed |
| Is Stalled | `hs_is_stalled` | bool | True if Time in stage is 20% longer than the deal owner’s closed-won average time for that stage, fa |
| Is Stalled After Timestamp | `hs_is_stalled_after_timestamp` | datetime | Timestamp when Time in stage became 20% longer than the deal owner’s closed-won average for that sta |
| Open deal create date | `hs_open_deal_create_date` | number | Create date populated only if this deal is open |
| V2 Average Deal Owner Duration In Current Stage | `hs_v2_average_deal_owner_duration_in_current_stage` | number | Time duration of the calculated average time of closed-won deals spent in current pipeline stage |
| V2 Is Stalled | `hs_v2_is_stalled` | bool | True if Time in stage is 20% longer than the deal owner’s closed-won average time for that stage. |
| V2 Is Stalled After Timestamp | `hs_v2_is_stalled_after_timestamp` | datetime | Timestamp when Time in stage became 20% longer than the deal owner’s closed-won average for that sta |

</details>

<details><summary><strong>dealstages</strong> (82 properties)</summary>

| Property Name | Internal Name | Type | Description |
|---|---|---|---|
| Cumulative time in "Closed Won - Engagement (Expansion)" | `hs_v2_cumulative_time_in_1025177200` | number | The cumulative time in seconds spent by the deal in the 'Closed Won - Engagement' stage, 'Expansion' |
| Cumulative time in "Negotiation (Renewal)" | `hs_v2_cumulative_time_in_1071379754` | number | The cumulative time in seconds spent by the deal in the 'Negotiation' stage, 'Renewal' pipeline |
| Cumulative time in "Closed Won (Renewal)" | `hs_v2_cumulative_time_in_1071379755` | number | The cumulative time in seconds spent by the deal in the 'Closed Won' stage, 'Renewal' pipeline |
| Cumulative time in "Closed Lost (Renewal)" | `hs_v2_cumulative_time_in_1071379756` | number | The cumulative time in seconds spent by the deal in the 'Closed Lost' stage, 'Renewal' pipeline |
| Cumulative time in "Closed Lost - Churn (Expansion)" | `hs_v2_cumulative_time_in_1100624386` | number | The cumulative time in seconds spent by the deal in the 'Closed Lost - Churn' stage, 'Expansion' pip |
| Cumulative time in "Nurture (12 mo+) (New Customer)" | `hs_v2_cumulative_time_in_146514244` | number | The cumulative time in seconds spent by the deal in the 'Nurture (12 mo+)' stage, 'New Customer' pip |
| Cumulative time in "Business Consideration (New Customer)" | `hs_v2_cumulative_time_in_5fa97649_4953_4304_931d_32c3ff1aa342_1920529660` | number | The cumulative time in seconds spent by the deal in the 'Business Consideration' stage, 'New Custome |
| Cumulative time in "Closed Lost (New Customer)" | `hs_v2_cumulative_time_in_6f75eed0_c3f8_49f9_a9af_84791515bb90_2119570302` | number | The cumulative time in seconds spent by the deal in the 'Closed Lost' stage, 'New Customer' pipeline |
| Cumulative time in "Closed Won - Onboarding (New Customer)" | `hs_v2_cumulative_time_in_77f2e34f_14fa_409c_9850_692b7c2c7321_1232427190` | number | The cumulative time in seconds spent by the deal in the 'Closed Won - Onboarding' stage, 'New Custom |
| Cumulative time in "Closed Won - Engagement (New Customer)" | `hs_v2_cumulative_time_in_81d05856_d5e1_4929_90ba_89134bf3a674_748205461` | number | The cumulative time in seconds spent by the deal in the 'Closed Won - Engagement' stage, 'New Custom |
| Cumulative time in "Negotiation/Proposal Ready (New Customer)" | `hs_v2_cumulative_time_in_9154a8c3_526e_47eb_990c_3d35849b7a54_335896860` | number | The cumulative time in seconds spent by the deal in the 'Negotiation/Proposal Ready' stage, 'New Cus |
| Cumulative time in "Expansion Opportunity (Expansion)" | `hs_v2_cumulative_time_in_937266517` | number | The cumulative time in seconds spent by the deal in the 'Expansion Opportunity' stage, 'Expansion' p |
| Cumulative time in "Discovery (Expansion)" | `hs_v2_cumulative_time_in_937266518` | number | The cumulative time in seconds spent by the deal in the 'Discovery' stage, 'Expansion' pipeline |
| Cumulative time in "Negotiation/Proposal Ready (Expansion)" | `hs_v2_cumulative_time_in_937266519` | number | The cumulative time in seconds spent by the deal in the 'Negotiation/Proposal Ready' stage, 'Expansi |
| Cumulative time in "Business Consideration (Expansion)" | `hs_v2_cumulative_time_in_937266521` | number | The cumulative time in seconds spent by the deal in the 'Business Consideration' stage, 'Expansion'  |
| Cumulative time in "Closed Won - Onboarding (Expansion)" | `hs_v2_cumulative_time_in_937266522` | number | The cumulative time in seconds spent by the deal in the 'Closed Won - Onboarding' stage, 'Expansion' |
| Cumulative time in "Closed Lost (Expansion)" | `hs_v2_cumulative_time_in_937266523` | number | The cumulative time in seconds spent by the deal in the 'Closed Lost' stage, 'Expansion' pipeline |
| Cumulative time in "Opportunity (New Customer)" | `hs_v2_cumulative_time_in_939274936` | number | The cumulative time in seconds spent by the deal in the 'Opportunity' stage, 'New Customer' pipeline |
| Cumulative time in "Closed Lost - Churn (New Customer)" | `hs_v2_cumulative_time_in_a27a3afb_a313_4900_8ce5_67bf1806b561_1895667699` | number | The cumulative time in seconds spent by the deal in the 'Closed Lost - Churn' stage, 'New Customer'  |
| Cumulative time in "Discovery (New Customer)" | `hs_v2_cumulative_time_in_dd5c3cc4_11e0_4c4d_b53b_8042e0df7ca8_912381706` | number | The cumulative time in seconds spent by the deal in the 'Discovery' stage, 'New Customer' pipeline |
| Date entered "Closed Won - Engagement (Expansion)" | `hs_v2_date_entered_1025177200` | datetime | The date and time when the deal entered the 'Closed Won - Engagement' stage, 'Expansion' pipeline |
| Date entered "Negotiation (Renewal)" | `hs_v2_date_entered_1071379754` | datetime | The date and time when the deal entered the 'Negotiation' stage, 'Renewal' pipeline |
| Date entered "Closed Won (Renewal)" | `hs_v2_date_entered_1071379755` | datetime | The date and time when the deal entered the 'Closed Won' stage, 'Renewal' pipeline |
| Date entered "Closed Lost (Renewal)" | `hs_v2_date_entered_1071379756` | datetime | The date and time when the deal entered the 'Closed Lost' stage, 'Renewal' pipeline |
| Date entered "Closed Lost - Churn (Expansion)" | `hs_v2_date_entered_1100624386` | datetime | The date and time when the deal entered the 'Closed Lost - Churn' stage, 'Expansion' pipeline |
| Date entered "Nurture (12 mo+) (New Customer)" | `hs_v2_date_entered_146514244` | datetime | The date and time when the deal entered the 'Nurture (12 mo+)' stage, 'New Customer' pipeline |
| Date entered "Business Consideration (New Customer)" | `hs_v2_date_entered_5fa97649_4953_4304_931d_32c3ff1aa342_1920529660` | datetime | The date and time when the deal entered the 'Business Consideration' stage, 'New Customer' pipeline |
| Date entered "Closed Lost (New Customer)" | `hs_v2_date_entered_6f75eed0_c3f8_49f9_a9af_84791515bb90_2119570302` | datetime | The date and time when the deal entered the 'Closed Lost' stage, 'New Customer' pipeline |
| Date entered "Closed Won - Onboarding (New Customer)" | `hs_v2_date_entered_77f2e34f_14fa_409c_9850_692b7c2c7321_1232427190` | datetime | The date and time when the deal entered the 'Closed Won - Onboarding' stage, 'New Customer' pipeline |
| Date entered "Closed Won - Engagement (New Customer)" | `hs_v2_date_entered_81d05856_d5e1_4929_90ba_89134bf3a674_748205461` | datetime | The date and time when the deal entered the 'Closed Won - Engagement' stage, 'New Customer' pipeline |
| Date entered "Negotiation/Proposal Ready (New Customer)" | `hs_v2_date_entered_9154a8c3_526e_47eb_990c_3d35849b7a54_335896860` | datetime | The date and time when the deal entered the 'Negotiation/Proposal Ready' stage, 'New Customer' pipel |
| Date entered "Expansion Opportunity (Expansion)" | `hs_v2_date_entered_937266517` | datetime | The date and time when the deal entered the 'Expansion Opportunity' stage, 'Expansion' pipeline |
| Date entered "Discovery (Expansion)" | `hs_v2_date_entered_937266518` | datetime | The date and time when the deal entered the 'Discovery' stage, 'Expansion' pipeline |
| Date entered "Negotiation/Proposal Ready (Expansion)" | `hs_v2_date_entered_937266519` | datetime | The date and time when the deal entered the 'Negotiation/Proposal Ready' stage, 'Expansion' pipeline |
| Date entered "Business Consideration (Expansion)" | `hs_v2_date_entered_937266521` | datetime | The date and time when the deal entered the 'Business Consideration' stage, 'Expansion' pipeline |
| Date entered "Closed Won - Onboarding (Expansion)" | `hs_v2_date_entered_937266522` | datetime | The date and time when the deal entered the 'Closed Won - Onboarding' stage, 'Expansion' pipeline |
| Date entered "Closed Lost (Expansion)" | `hs_v2_date_entered_937266523` | datetime | The date and time when the deal entered the 'Closed Lost' stage, 'Expansion' pipeline |
| Date entered "Opportunity (New Customer)" | `hs_v2_date_entered_939274936` | datetime | The date and time when the deal entered the 'Opportunity' stage, 'New Customer' pipeline |
| Date entered "Closed Lost - Churn (New Customer)" | `hs_v2_date_entered_a27a3afb_a313_4900_8ce5_67bf1806b561_1895667699` | datetime | The date and time when the deal entered the 'Closed Lost - Churn' stage, 'New Customer' pipeline |
| Date entered current stage | `hs_v2_date_entered_current_stage` | datetime | The date this object entered its current pipeline stage |
| Date entered "Discovery (New Customer)" | `hs_v2_date_entered_dd5c3cc4_11e0_4c4d_b53b_8042e0df7ca8_912381706` | datetime | The date and time when the deal entered the 'Discovery' stage, 'New Customer' pipeline |
| Date exited "Closed Won - Engagement (Expansion)" | `hs_v2_date_exited_1025177200` | datetime | The date and time when the deal exited the 'Closed Won - Engagement' stage, 'Expansion' pipeline |
| Date exited "Negotiation (Renewal)" | `hs_v2_date_exited_1071379754` | datetime | The date and time when the deal exited the 'Negotiation' stage, 'Renewal' pipeline |
| Date exited "Closed Won (Renewal)" | `hs_v2_date_exited_1071379755` | datetime | The date and time when the deal exited the 'Closed Won' stage, 'Renewal' pipeline |
| Date exited "Closed Lost (Renewal)" | `hs_v2_date_exited_1071379756` | datetime | The date and time when the deal exited the 'Closed Lost' stage, 'Renewal' pipeline |
| Date exited "Closed Lost - Churn (Expansion)" | `hs_v2_date_exited_1100624386` | datetime | The date and time when the deal exited the 'Closed Lost - Churn' stage, 'Expansion' pipeline |
| Date exited "Nurture (12 mo+) (New Customer)" | `hs_v2_date_exited_146514244` | datetime | The date and time when the deal exited the 'Nurture (12 mo+)' stage, 'New Customer' pipeline |
| Date exited "Business Consideration (New Customer)" | `hs_v2_date_exited_5fa97649_4953_4304_931d_32c3ff1aa342_1920529660` | datetime | The date and time when the deal exited the 'Business Consideration' stage, 'New Customer' pipeline |
| Date exited "Closed Lost (New Customer)" | `hs_v2_date_exited_6f75eed0_c3f8_49f9_a9af_84791515bb90_2119570302` | datetime | The date and time when the deal exited the 'Closed Lost' stage, 'New Customer' pipeline |
| Date exited "Closed Won - Onboarding (New Customer)" | `hs_v2_date_exited_77f2e34f_14fa_409c_9850_692b7c2c7321_1232427190` | datetime | The date and time when the deal exited the 'Closed Won - Onboarding' stage, 'New Customer' pipeline |
| Date exited "Closed Won - Engagement (New Customer)" | `hs_v2_date_exited_81d05856_d5e1_4929_90ba_89134bf3a674_748205461` | datetime | The date and time when the deal exited the 'Closed Won - Engagement' stage, 'New Customer' pipeline |
| Date exited "Negotiation/Proposal Ready (New Customer)" | `hs_v2_date_exited_9154a8c3_526e_47eb_990c_3d35849b7a54_335896860` | datetime | The date and time when the deal exited the 'Negotiation/Proposal Ready' stage, 'New Customer' pipeli |
| Date exited "Expansion Opportunity (Expansion)" | `hs_v2_date_exited_937266517` | datetime | The date and time when the deal exited the 'Expansion Opportunity' stage, 'Expansion' pipeline |
| Date exited "Discovery (Expansion)" | `hs_v2_date_exited_937266518` | datetime | The date and time when the deal exited the 'Discovery' stage, 'Expansion' pipeline |
| Date exited "Negotiation/Proposal Ready (Expansion)" | `hs_v2_date_exited_937266519` | datetime | The date and time when the deal exited the 'Negotiation/Proposal Ready' stage, 'Expansion' pipeline |
| Date exited "Business Consideration (Expansion)" | `hs_v2_date_exited_937266521` | datetime | The date and time when the deal exited the 'Business Consideration' stage, 'Expansion' pipeline |
| Date exited "Closed Won - Onboarding (Expansion)" | `hs_v2_date_exited_937266522` | datetime | The date and time when the deal exited the 'Closed Won - Onboarding' stage, 'Expansion' pipeline |
| Date exited "Closed Lost (Expansion)" | `hs_v2_date_exited_937266523` | datetime | The date and time when the deal exited the 'Closed Lost' stage, 'Expansion' pipeline |
| Date exited "Opportunity (New Customer)" | `hs_v2_date_exited_939274936` | datetime | The date and time when the deal exited the 'Opportunity' stage, 'New Customer' pipeline |
| Date exited "Closed Lost - Churn (New Customer)" | `hs_v2_date_exited_a27a3afb_a313_4900_8ce5_67bf1806b561_1895667699` | datetime | The date and time when the deal exited the 'Closed Lost - Churn' stage, 'New Customer' pipeline |
| Date exited "Discovery (New Customer)" | `hs_v2_date_exited_dd5c3cc4_11e0_4c4d_b53b_8042e0df7ca8_912381706` | datetime | The date and time when the deal exited the 'Discovery' stage, 'New Customer' pipeline |
| Latest time in "Closed Won - Engagement (Expansion)" | `hs_v2_latest_time_in_1025177200` | number | The total time in seconds spent by the deal in the 'Closed Won - Engagement' stage, 'Expansion' pipe |
| Latest time in "Negotiation (Renewal)" | `hs_v2_latest_time_in_1071379754` | number | The total time in seconds spent by the deal in the 'Negotiation' stage, 'Renewal' pipeline since it  |
| Latest time in "Closed Won (Renewal)" | `hs_v2_latest_time_in_1071379755` | number | The total time in seconds spent by the deal in the 'Closed Won' stage, 'Renewal' pipeline since it l |
| Latest time in "Closed Lost (Renewal)" | `hs_v2_latest_time_in_1071379756` | number | The total time in seconds spent by the deal in the 'Closed Lost' stage, 'Renewal' pipeline since it  |
| Latest time in "Closed Lost - Churn (Expansion)" | `hs_v2_latest_time_in_1100624386` | number | The total time in seconds spent by the deal in the 'Closed Lost - Churn' stage, 'Expansion' pipeline |
| Latest time in "Nurture (12 mo+) (New Customer)" | `hs_v2_latest_time_in_146514244` | number | The total time in seconds spent by the deal in the 'Nurture (12 mo+)' stage, 'New Customer' pipeline |
| Latest time in "Business Consideration (New Customer)" | `hs_v2_latest_time_in_5fa97649_4953_4304_931d_32c3ff1aa342_1920529660` | number | The total time in seconds spent by the deal in the 'Business Consideration' stage, 'New Customer' pi |
| Latest time in "Closed Lost (New Customer)" | `hs_v2_latest_time_in_6f75eed0_c3f8_49f9_a9af_84791515bb90_2119570302` | number | The total time in seconds spent by the deal in the 'Closed Lost' stage, 'New Customer' pipeline sinc |
| Latest time in "Closed Won - Onboarding (New Customer)" | `hs_v2_latest_time_in_77f2e34f_14fa_409c_9850_692b7c2c7321_1232427190` | number | The total time in seconds spent by the deal in the 'Closed Won - Onboarding' stage, 'New Customer' p |
| Latest time in "Closed Won - Engagement (New Customer)" | `hs_v2_latest_time_in_81d05856_d5e1_4929_90ba_89134bf3a674_748205461` | number | The total time in seconds spent by the deal in the 'Closed Won - Engagement' stage, 'New Customer' p |
| Latest time in "Negotiation/Proposal Ready (New Customer)" | `hs_v2_latest_time_in_9154a8c3_526e_47eb_990c_3d35849b7a54_335896860` | number | The total time in seconds spent by the deal in the 'Negotiation/Proposal Ready' stage, 'New Customer |
| Latest time in "Expansion Opportunity (Expansion)" | `hs_v2_latest_time_in_937266517` | number | The total time in seconds spent by the deal in the 'Expansion Opportunity' stage, 'Expansion' pipeli |
| Latest time in "Discovery (Expansion)" | `hs_v2_latest_time_in_937266518` | number | The total time in seconds spent by the deal in the 'Discovery' stage, 'Expansion' pipeline since it  |
| Latest time in "Negotiation/Proposal Ready (Expansion)" | `hs_v2_latest_time_in_937266519` | number | The total time in seconds spent by the deal in the 'Negotiation/Proposal Ready' stage, 'Expansion' p |
| Latest time in "Business Consideration (Expansion)" | `hs_v2_latest_time_in_937266521` | number | The total time in seconds spent by the deal in the 'Business Consideration' stage, 'Expansion' pipel |
| Latest time in "Closed Won - Onboarding (Expansion)" | `hs_v2_latest_time_in_937266522` | number | The total time in seconds spent by the deal in the 'Closed Won - Onboarding' stage, 'Expansion' pipe |
| Latest time in "Closed Lost (Expansion)" | `hs_v2_latest_time_in_937266523` | number | The total time in seconds spent by the deal in the 'Closed Lost' stage, 'Expansion' pipeline since i |
| Latest time in "Opportunity (New Customer)" | `hs_v2_latest_time_in_939274936` | number | The total time in seconds spent by the deal in the 'Opportunity' stage, 'New Customer' pipeline sinc |
| Latest time in "Closed Lost - Churn (New Customer)" | `hs_v2_latest_time_in_a27a3afb_a313_4900_8ce5_67bf1806b561_1895667699` | number | The total time in seconds spent by the deal in the 'Closed Lost - Churn' stage, 'New Customer' pipel |
| Latest time in "Discovery (New Customer)" | `hs_v2_latest_time_in_dd5c3cc4_11e0_4c4d_b53b_8042e0df7ca8_912381706` | number | The total time in seconds spent by the deal in the 'Discovery' stage, 'New Customer' pipeline since  |
| Time in current stage | `hs_v2_time_in_current_stage` | datetime | The time this object has spent in the current pipeline stage |

</details>

<details><summary><strong>hubspotmetrics</strong> (2 properties)</summary>

| Property Name | Internal Name | Type | Description |
|---|---|---|---|
| Open amount in home currency | `hs_open_amount_in_home_currency` | number | The amount of the open deal, using the exchange rate, in your home currency |
| Weighted open pipeline in company currency | `hs_weighted_pipeline_in_company_currency` | number | Sum in company currency of open deal amount, weighted by pipeline stage |

</details>

<details><summary><strong>multiaccountmanagement</strong> (1 properties)</summary>

| Property Name | Internal Name | Type | Description |
|---|---|---|---|
| Cross-sell Opportunity | `hs_cross_sell_opportunity` | bool | Identify a deal as a good candidate for cross-selling programs. |

</details>

<details><summary><strong>predictive_deal_score_feature_properties</strong> (12 properties)</summary>

| Property Name | Internal Name | Type | Description |
|---|---|---|---|
| Average call duration | `hs_average_call_duration` | number | The average call duration of calls associated to the deal |
| Latest marketing email click date | `hs_latest_marketing_email_click_date` | datetime | The timestamp of the most recent marketing email click for an associated contact |
| Latest marketing email open date | `hs_latest_marketing_email_open_date` | datetime | The timestamp of the most recent marketing email open for an associated contact |
| Latest marketing email reply date | `hs_latest_marketing_email_reply_date` | datetime | The timestamp of the most recent marketing email reply for an associated contact |
| Latest sales email click date | `hs_latest_sales_email_click_date` | datetime | The timestamp of the most recent sales email click for an associated contact |
| Latest sales email open date | `hs_latest_sales_email_open_date` | datetime | The timestamp of the most recent sales email open for an associated contact |
| Latest sales email reply date | `hs_latest_sales_email_reply_date` | datetime | The timestamp of the most recent sales email reply for an associated contact |
| Number of call engagements | `hs_number_of_call_engagements` | number | The number of call engagements associated to the deal |
| Number of inbound calls | `hs_number_of_inbound_calls` | number | The number of inbound calls associated to the deal |
| Number of outbound calls | `hs_number_of_outbound_calls` | number | The number of outbound calls associated to the deal |
| Number of overdue tasks | `hs_number_of_overdue_tasks` | number | The number of overdue tasks associated to the deal |
| Number of scheduled meetings | `hs_number_of_scheduled_meetings` | number | The number of scheduled meetings associated to the deal |

</details>

<details><summary><strong>recurring_revenue_information</strong> (4 properties)</summary>

| Property Name | Internal Name | Type | Description |
|---|---|---|---|
| Recurring revenue amount | `recurring_revenue_amount` | number | Amount of recurring revenue associated with this deal |
| Recurring revenue deal type | `recurring_revenue_deal_type` | enumeration | Deal type for recurring revenue reporting |
| Recurring revenue inactive date | `recurring_revenue_inactive_date` | datetime | Date at which recurring revenue for this deal is no longer collected |
| Recurring revenue inactive reason | `recurring_revenue_inactive_reason` | enumeration | Reason the recurring revenue for this ideal is no longer collected |

</details>

<details><summary><strong>salesforceinformation</strong> (3 properties)</summary>

| Property Name | Internal Name | Type | Description |
|---|---|---|---|
| Salesforce Opportunity ID | `hs_salesforceopportunityid` | string |  |
| Salesforce Deleted | `salesforcedeleted` | bool |  |
| Last Salesforce Sync Time | `salesforcelastsynctime` | datetime |  |

</details>

---

## Tickets

| Attribute | Value |
|---|---|
| **Type** | Standard Object |

> ⚠️ **Access Denied** or no properties retrieved. Error: Unknown

---

## Sites

| Attribute | Value |
|---|---|
| **Type** | Custom Object |
| **Object Type ID** | `2-56022093` |
| **Fully Qualified Name** | `p3975853_sites` |
| **Singular Label** | Site |
| **Plural Label** | Sites |
| **Required Properties** | `site_name` |
| **Searchable Properties** | `site_name`, `site_id` |

**Total Properties:** 32 | **Custom:** 2 | **Calculated:** 0

### Custom Properties

| Property Name | Internal Name | Type | Field Type | Group | Description |
|---|---|---|---|---|---|
| Site ID | `site_id` | number | number | sites_information |  |
| Site Name | `site_name` | string | text | sites_information |  |

### HubSpot-Defined Properties (by Group)

<details><summary><strong>sites_information</strong> (30 properties)</summary>

| Property Name | Internal Name | Type | Description |
|---|---|---|---|
| All teams | `hs_all_accessible_team_ids` | enumeration | The team IDs, including the team hierarchy, of all default and custom owner properties for this reco |
| Business units | `hs_all_assigned_business_unit_ids` | enumeration | The business units this record is assigned to. |
| All owner IDs | `hs_all_owner_ids` | enumeration | Values of all default and custom owner properties for this record. |
| All team IDs | `hs_all_team_ids` | enumeration | The team IDs of all default and custom owner properties for this record. |
| Created by user ID | `hs_created_by_user_id` | number | The user who created this record. This value is set automatically by HubSpot. |
| Object create date/time | `hs_createdate` | datetime | The date and time at which this object was created. This value is automatically set by HubSpot and m |
| Object last modified date/time | `hs_lastmodifieddate` | datetime | Most recent timestamp of any property update for this object. This includes HubSpot internal propert |
| Merged record IDs | `hs_merged_object_ids` | enumeration | The list of record IDs that have been merged into this record. This value is set automatically by Hu |
| Record ID | `hs_object_id` | number | The unique ID for this record. This value is set automatically by HubSpot. |
| Record creation source | `hs_object_source` | string | Raw internal PropertySource present in the RequestMeta when this record was created. |
| Record source detail 1 | `hs_object_source_detail_1` | string | First level of detail on how this record was created. |
| Record source detail 2 | `hs_object_source_detail_2` | string | Second level of detail on how this record was created. |
| Record source detail 3 | `hs_object_source_detail_3` | string | Third level of detail on how this record was created. |
| Record creation source ID | `hs_object_source_id` | string | Raw internal sourceId present in the RequestMeta when this record was created. |
| Record source | `hs_object_source_label` | enumeration | How this record was created. |
| Record creation source user ID | `hs_object_source_user_id` | number | Raw internal userId present in the RequestMeta when this record was created. |
| Owning Teams | `hs_owning_teams` | enumeration | The teams that are attributed to this record. |
| Pinned Engagement ID | `hs_pinned_engagement_id` | number | The object ID of the current pinned engagement. This will only be shown in the app if there is alrea |
| Read only object | `hs_read_only` | bool | Determines whether a record can be edited by a user. |
| Shared teams | `hs_shared_team_ids` | enumeration | Additional teams whose users can access the record based on their permissions. This can be set manua |
| Shared users | `hs_shared_user_ids` | enumeration | Additional users that can access the record based on their permissions. This can be set manually or  |
| Unique creation key | `hs_unique_creation_key` | string | Unique property used for idempotent creates |
| Updated by user ID | `hs_updated_by_user_id` | number | The user who last updated this record. This value is set automatically by HubSpot. |
| User IDs of all notification followers | `hs_user_ids_of_all_notification_followers` | enumeration | The user IDs of all users that have clicked follow within the object to opt-in to getting follow not |
| User IDs of all notification unfollowers | `hs_user_ids_of_all_notification_unfollowers` | enumeration | The user IDs of all object owners that have clicked unfollow within the object to opt-out of getting |
| User IDs of all owners | `hs_user_ids_of_all_owners` | enumeration | The user IDs of all owners of this record. |
| Performed in an import | `hs_was_imported` | bool | Object is part of an import |
| Owner assigned date | `hubspot_owner_assigneddate` | datetime | The most recent timestamp of when an owner was assigned to this record. This value is set automatica |
| Owner | `hubspot_owner_id` | enumeration | The owner of the object. |
| Owner's main team | `hubspot_team_id` | enumeration | The main team of the record owner. This value is set automatically by HubSpot. |

</details>

---

## Hapily_session

| Attribute | Value |
|---|---|
| **Type** | Custom Object |
| **Object Type ID** | `2-54709569` |
| **Fully Qualified Name** | `p3975853_hapily_session` |
| **Singular Label** | hapily session |
| **Plural Label** | hapily sessions |
| **Required Properties** | `name` |
| **Searchable Properties** | `name`, `description`, `external_id` |

**Total Properties:** 66 | **Custom:** 36 | **Calculated:** 0

### Custom Properties

| Property Name | Internal Name | Type | Field Type | Group | Description |
|---|---|---|---|---|---|
| Featured Image | `featured_image` | string | text | content_information | This property will hold a URL to an image that will be displayed on a session listing CMS module and session registratio |
| Session Page Body Content | `page_body_content` | string | html | content_information | Use this property to display a rich text description of your sessions details. Will be seen in CMS modules on your regis |
| Display End Date | `display_end_date` | string | text | date_time_information |  |
| Display End Time | `display_end_time` | string | text | date_time_information |  |
| Display Start Date | `display_start_date` | string | text | date_time_information |  |
| Display Start Time | `display_start_time` | string | text | date_time_information |  |
| Time Zone | `display_timezone` | enumeration | select | date_time_information | The time zone of your event. |
| Time Zone (Alternate) | `display_timezone_alt` | string | text | date_time_information | A reflection of the "Time Zone" property. This is used to display the time zone in the CMS. The value would be automatic |
| End Date & Time | `end_datetime` | datetime | date | date_time_information | The end date and end time of your session. |
| Google Calendar Link | `google_calendar_link` | string | text | date_time_information | This property holds a link to a google calendar invite for the session. |
| ICS Calendar Link | `ics_calendar_link` | string | text | date_time_information | This property holds a link to an ICS calendar invite for the session. |
| Start Date & Time | `start_datetime` | datetime | date | date_time_information | The start date and start time of your session. |
| Timezone (Deprecated) | `timezone` | string | text | date_time_information |  |
| Timezone Abbreviation (Deprecated) | `timezone_abbr` | string | text | date_time_information |  |
| Session Location | `location` | string | text | location_information | This property holds the name of a location that a session takes place. Such as a specific room or different address. |
| Registrant Limit | `max_capacity` | number | number | metric_information | The maximum limit of registrations to this session. Leave blank if there is no limit. |
| In-Person Check-In Page | `check_in_page` | string | text | registration_information | This property will hold a URL to a page that allows you to check attendees into your session manually. The registrants a |
| In-Person Check-In Page | `in_person_check_in_page` | string | text | registration_information | This property will hold a URL to a page that allows you to check attendees into your session manually. The registrants a |
| Session Required? | `is_required` | bool | booleancheckbox | registration_information | If the value of this property is set to "Yes" all registrant objects created for this event will automatically be regist |
| Registration Page URL | `registration_page_url` | string | text | registration_information | This property is meant to hold a URL for the page where a visitor can register for the session. |
| Description | `description` | string | textarea | session_information | A short description of your session. Will be displayed on session listing CMS modules. |
| Event ID | `event_id` | string | text | session_information | The ID of the event that this session is associated to. |
| Event Name | `event_name` | string | text | session_information | The name of the event that this session is associated to. |
| Publish Session? | `is_published` | bool | booleancheckbox | session_information | This property indicates if your session will show up in the session listing CMS modules. When you are ready for the worl |
| Migration Record ID | `migration_record_id` | string | text | session_information | This is used to track the migration of the record from the old system. |
| Session Name | `name` | string | text | session_information | The name of your session. |
| Session Tag | `tag` | enumeration | checkbox | session_information | Use this field to create a tagging system for organizing your session records. Feel free to add as many tags as needed. |
| Session Topic | `topic` | enumeration | checkbox | session_information | Use this field to denote the topic of your session. You will be able to filter your listing pages on HubSpot CMS pages u |
| Session Type | `type` | enumeration | select | session_information | The high level categorization of this session. Use this to trigger automation, or even filter sessions in reporting. |
| External ID | `external_id` | string | text | virtual_session_information |  |
| External Source | `external_source` | string | text | virtual_session_information |  |
| External Status | `external_status` | string | text | virtual_session_information |  |
| External Type | `external_type` | enumeration | select | virtual_session_information |  |
| Meeting Link | `meeting_link` | string | text | virtual_session_information |  |
| Recording Link | `recording_link` | string | text | virtual_session_information |  |
| Recording Link Password | `recording_password` | string | text | virtual_session_information |  |

### HubSpot-Defined Properties (by Group)

<details><summary><strong>hapily_session_information</strong> (30 properties)</summary>

| Property Name | Internal Name | Type | Description |
|---|---|---|---|
| All teams | `hs_all_accessible_team_ids` | enumeration | The team IDs, including the team hierarchy, of all default and custom owner properties for this reco |
| Business units | `hs_all_assigned_business_unit_ids` | enumeration | The business units this record is assigned to. |
| All owner IDs | `hs_all_owner_ids` | enumeration | Values of all default and custom owner properties for this record. |
| All team IDs | `hs_all_team_ids` | enumeration | The team IDs of all default and custom owner properties for this record. |
| Created by user ID | `hs_created_by_user_id` | number | The user who created this record. This value is set automatically by HubSpot. |
| Object create date/time | `hs_createdate` | datetime | The date and time at which this object was created. This value is automatically set by HubSpot and m |
| Object last modified date/time | `hs_lastmodifieddate` | datetime | Most recent timestamp of any property update for this object. This includes HubSpot internal propert |
| Merged record IDs | `hs_merged_object_ids` | enumeration | The list of record IDs that have been merged into this record. This value is set automatically by Hu |
| Record ID | `hs_object_id` | number | The unique ID for this record. This value is set automatically by HubSpot. |
| Record creation source | `hs_object_source` | string | Raw internal PropertySource present in the RequestMeta when this record was created. |
| Record source detail 1 | `hs_object_source_detail_1` | string | First level of detail on how this record was created. |
| Record source detail 2 | `hs_object_source_detail_2` | string | Second level of detail on how this record was created. |
| Record source detail 3 | `hs_object_source_detail_3` | string | Third level of detail on how this record was created. |
| Record creation source ID | `hs_object_source_id` | string | Raw internal sourceId present in the RequestMeta when this record was created. |
| Record source | `hs_object_source_label` | enumeration | How this record was created. |
| Record creation source user ID | `hs_object_source_user_id` | number | Raw internal userId present in the RequestMeta when this record was created. |
| Owning Teams | `hs_owning_teams` | enumeration | The teams that are attributed to this record. |
| Pinned Engagement ID | `hs_pinned_engagement_id` | number | The object ID of the current pinned engagement. This will only be shown in the app if there is alrea |
| Read only object | `hs_read_only` | bool | Determines whether a record can be edited by a user. |
| Shared teams | `hs_shared_team_ids` | enumeration | Additional teams whose users can access the record based on their permissions. This can be set manua |
| Shared users | `hs_shared_user_ids` | enumeration | Additional users that can access the record based on their permissions. This can be set manually or  |
| Unique creation key | `hs_unique_creation_key` | string | Unique property used for idempotent creates |
| Updated by user ID | `hs_updated_by_user_id` | number | The user who last updated this record. This value is set automatically by HubSpot. |
| User IDs of all notification followers | `hs_user_ids_of_all_notification_followers` | enumeration | The user IDs of all users that have clicked follow within the object to opt-in to getting follow not |
| User IDs of all notification unfollowers | `hs_user_ids_of_all_notification_unfollowers` | enumeration | The user IDs of all object owners that have clicked unfollow within the object to opt-out of getting |
| User IDs of all owners | `hs_user_ids_of_all_owners` | enumeration | The user IDs of all owners of this record. |
| Performed in an import | `hs_was_imported` | bool | Object is part of an import |
| Owner assigned date | `hubspot_owner_assigneddate` | datetime | The most recent timestamp of when an owner was assigned to this record. This value is set automatica |
| Owner | `hubspot_owner_id` | enumeration | The owner of the object. |
| Owner's main team | `hubspot_team_id` | enumeration | The main team of the record owner. This value is set automatically by HubSpot. |

</details>

---

## Hapily_event

| Attribute | Value |
|---|---|
| **Type** | Custom Object |
| **Object Type ID** | `2-54709572` |
| **Fully Qualified Name** | `p3975853_hapily_event` |
| **Singular Label** | hapily event |
| **Plural Label** | hapily events |
| **Required Properties** | `name` |
| **Searchable Properties** | `name`, `description`, `external_id` |

**Total Properties:** 86 | **Custom:** 56 | **Calculated:** 7

### Custom Properties

| Property Name | Internal Name | Type | Field Type | Group | Description |
|---|---|---|---|---|---|
| Featured Image | `featured_image` | string | text | content_information | This property will hold a URL to an image that will be displayed on a event listing CMS module and event registration pa |
| Publish Event? | `is_published` | bool | booleancheckbox | content_information | This property indicates if your event will show up in the event listing CMS modules. When you are ready for the world to |
| Event Page Body Content | `page_body_content` | string | html | content_information | Use this property to display a rich text description of your events details. Will be seen in CMS modules on your registr |
| Display Date Format | `display_date_format` | enumeration | select | date_time_information | The date format to display for this event. |
| Display End Date | `display_end_date` | string | text | date_time_information |  |
| Display End Time | `display_end_time` | string | text | date_time_information |  |
| Display Start Date | `display_start_date` | string | text | date_time_information |  |
| Display Start Time | `display_start_time` | string | text | date_time_information |  |
| Display Time Format | `display_time_format` | enumeration | select | date_time_information | The time format to display for this event. |
| Time Zone | `display_timezone` | enumeration | select | date_time_information | The time zone of your event. |
| Time Zone (Alternate) | `display_timezone_alt` | string | text | date_time_information | A reflection of the "Time Zone" property. This is used to display the time zone in the CMS. The value would be automatic |
| End Date & Time | `end_datetime` | datetime | date | date_time_information | The end date and end time of your event. |
| Google Calendar Link | `google_calendar_link` | string | text | date_time_information | This property holds a link to a google calendar invite for the event. |
| ICS Calendar Link | `ics_calendar_link` | string | text | date_time_information | This property holds a link to an ICS calendar invite for the event. |
| Formatting Locale | `locale` | enumeration | select | date_time_information | The locale of your event. |
| Start Date & Time | `start_datetime` | datetime | date | date_time_information | The start date and start time of your event. |
| Timezone (Deprecated) | `timezone` | string | text | date_time_information |  |
| Timezone Abbreviation (Deprecated) | `timezone_abbr` | string | text | date_time_information |  |
| Waitlist List | `assets_lists_waitlist` | string | text | event_information | This is the list ID of the waitlist for the event. |
| Description | `description` | string | textarea | event_information | A short description of your event. Will be displayed on event listing CMS modules. |
| Hosting Event? | `hosting` | bool | booleancheckbox | event_information | Use this property to indicate if this is an event that your team is hosting or one that it is attending (such as a confe |
| Migration Record ID | `migration_record_id` | string | text | event_information | This is used to track the migration of the record from the old system. |
| Event Name | `name` | string | text | event_information | The name of your event. |
| Check-In Pin | `pin` | string | text | event_information |  |
| Event Tag | `tag` | enumeration | checkbox | event_information | Use this field to create a tagging system for organizing your event records. Feel free to add as many tags as needed. |
| Event Topic | `topic` | enumeration | checkbox | event_information | Use this field to denote the topic of your event. You will be able to filter your listing pages on HubSpot CMS pages usi |
| Event Type | `type` | enumeration | select | event_information | The high level categorization of this event. Use this to trigger automation, or even filter events in reporting. |
| Contrast Video ID | `contrast_video_id` | string | text | hapily_event_information |  |
| Available in Lead Capture App | `available_in_lead_capture_app` | bool | booleancheckbox | lead_capture | Indicates whether this event is available in the Lead Capture App. |
| Event Lead Capture Form Share Link | `lead_capture_form` | string | text | lead_capture | Use this property to hold a share link to the HubSpot form used to capture leads at events you attend. |
| Event Lead Capture Form Edit Link | `lead_capture_form_edit_link` | string | text | lead_capture | Use this property to hold a link to edit the form you are using to capture leads at events you attend. |
| Street Address | `address` | string | text | location_information | The street address where your event will take place. |
| City | `city` | string | text | location_information | The city where your event will take place. |
| Country | `country` | string | text | location_information | The country where your event will take place. |
| Postal Code | `postal_code` | string | text | location_information | The postal code where your event will take place. |
| State/Region | `state_region` | string | text | location_information | The state or region where your event will take place. |
| Venue | `venue` | string | text | location_information | The name of the venue where your event will take place. |
| Closed Won Revenue | `closed_won_deal_revenue` | number | calculation_rollup | metric_information |  |
| Event Cost | `cost` | number | number | metric_information | Enter a dollar amount for any expenses incurred in producing the event, or update via a workflow. |
| Influenced Pipeline | `influenced_pipeline` | number | calculation_rollup | metric_information |  |
| Registrant Limit | `registration_limit` | number | number | metric_information | The maximum limit of registrations to this event. Leave blank if there is no limit. |
| Total Registrations | `registrations` | number | calculation_rollup | metric_information |  |
| Total Attendees | `total_attendees` | number | calculation_rollup | metric_information |  |
| Total Event Leads | `total_event_leads` | number | calculation_rollup | metric_information |  |
| Total No-shows | `total_noshows` | number | calculation_rollup | metric_information |  |
| Total Opportunities | `total_opportunities` | number | calculation_rollup | metric_information |  |
| In-Person Check-In Page | `in_person_check_in_page` | string | text | registration_information | This property will hold a URL to a page that allows you to check attendees into your event manually. The registrants and |
| Registration Form | `registration_form` | string | text | registration_information | This property holds a link to the form in HubSpot that is used to register contacts to this event. |
| Registration Page | `registration_page` | string | text | registration_information | This property is meant to hold a URL for the page where a visitor can register for the event. |
| Walk-up Registration Form | `walkup_registration_form` | string | text | registration_information | This property holds a link to the form in HubSpot that is used to register contacts to this event via walk-up registrati |
| External ID | `external_id` | string | text | virtual_session_information |  |
| External Source | `external_source` | string | text | virtual_session_information |  |
| External Type | `external_type` | enumeration | select | virtual_session_information |  |
| Meeting Link | `meeting_link` | string | text | virtual_session_information |  |
| Recording Link | `recording_link` | string | text | virtual_session_information |  |
| Recording Link Password | `recording_password` | string | text | virtual_session_information |  |

### HubSpot-Defined Properties (by Group)

<details><summary><strong>hapily_event_information</strong> (30 properties)</summary>

| Property Name | Internal Name | Type | Description |
|---|---|---|---|
| All teams | `hs_all_accessible_team_ids` | enumeration | The team IDs, including the team hierarchy, of all default and custom owner properties for this reco |
| Business units | `hs_all_assigned_business_unit_ids` | enumeration | The business units this record is assigned to. |
| All owner IDs | `hs_all_owner_ids` | enumeration | Values of all default and custom owner properties for this record. |
| All team IDs | `hs_all_team_ids` | enumeration | The team IDs of all default and custom owner properties for this record. |
| Created by user ID | `hs_created_by_user_id` | number | The user who created this record. This value is set automatically by HubSpot. |
| Object create date/time | `hs_createdate` | datetime | The date and time at which this object was created. This value is automatically set by HubSpot and m |
| Object last modified date/time | `hs_lastmodifieddate` | datetime | Most recent timestamp of any property update for this object. This includes HubSpot internal propert |
| Merged record IDs | `hs_merged_object_ids` | enumeration | The list of record IDs that have been merged into this record. This value is set automatically by Hu |
| Record ID | `hs_object_id` | number | The unique ID for this record. This value is set automatically by HubSpot. |
| Record creation source | `hs_object_source` | string | Raw internal PropertySource present in the RequestMeta when this record was created. |
| Record source detail 1 | `hs_object_source_detail_1` | string | First level of detail on how this record was created. |
| Record source detail 2 | `hs_object_source_detail_2` | string | Second level of detail on how this record was created. |
| Record source detail 3 | `hs_object_source_detail_3` | string | Third level of detail on how this record was created. |
| Record creation source ID | `hs_object_source_id` | string | Raw internal sourceId present in the RequestMeta when this record was created. |
| Record source | `hs_object_source_label` | enumeration | How this record was created. |
| Record creation source user ID | `hs_object_source_user_id` | number | Raw internal userId present in the RequestMeta when this record was created. |
| Owning Teams | `hs_owning_teams` | enumeration | The teams that are attributed to this record. |
| Pinned Engagement ID | `hs_pinned_engagement_id` | number | The object ID of the current pinned engagement. This will only be shown in the app if there is alrea |
| Read only object | `hs_read_only` | bool | Determines whether a record can be edited by a user. |
| Shared teams | `hs_shared_team_ids` | enumeration | Additional teams whose users can access the record based on their permissions. This can be set manua |
| Shared users | `hs_shared_user_ids` | enumeration | Additional users that can access the record based on their permissions. This can be set manually or  |
| Unique creation key | `hs_unique_creation_key` | string | Unique property used for idempotent creates |
| Updated by user ID | `hs_updated_by_user_id` | number | The user who last updated this record. This value is set automatically by HubSpot. |
| User IDs of all notification followers | `hs_user_ids_of_all_notification_followers` | enumeration | The user IDs of all users that have clicked follow within the object to opt-in to getting follow not |
| User IDs of all notification unfollowers | `hs_user_ids_of_all_notification_unfollowers` | enumeration | The user IDs of all object owners that have clicked unfollow within the object to opt-out of getting |
| User IDs of all owners | `hs_user_ids_of_all_owners` | enumeration | The user IDs of all owners of this record. |
| Performed in an import | `hs_was_imported` | bool | Object is part of an import |
| Owner assigned date | `hubspot_owner_assigneddate` | datetime | The most recent timestamp of when an owner was assigned to this record. This value is set automatica |
| Owner | `hubspot_owner_id` | enumeration | The owner of the object. |
| Owner's main team | `hubspot_team_id` | enumeration | The main team of the record owner. This value is set automatically by HubSpot. |

</details>

---

## Hapily_registrant

| Attribute | Value |
|---|---|
| **Type** | Custom Object |
| **Object Type ID** | `2-54709567` |
| **Fully Qualified Name** | `p3975853_hapily_registrant` |
| **Singular Label** | hapily registrant |
| **Plural Label** | hapily registrants |
| **Required Properties** | `name`, `first_name` |
| **Searchable Properties** | `name`, `last_name`, `company`, `first_name`, `email` |

**Total Properties:** 69 | **Custom:** 39 | **Calculated:** 0

### Custom Properties

| Property Name | Internal Name | Type | Field Type | Group | Description |
|---|---|---|---|---|---|
| Post Event Survey URL | `survey_url` | string | text | event_feedback | This property holds a unique URL to a post event survey for this registrant. |
| Check-in Confirmation Info | `check_in_confirmation_info` | string | textarea | event_information | This is the information that will be displayed to the user after they check in. |
| Street Address | `event_address` | string | text | event_information | The street address where your event will take place. |
| City | `event_city` | string | text | event_information | The city where your event will take place. |
| Country | `event_country` | string | text | event_information | The country where your event will take place. |
| Display End Date | `event_display_end_date` | string | text | event_information |  |
| Display End Time | `event_display_end_time` | string | text | event_information |  |
| Display Start Date | `event_display_start_date` | string | text | event_information |  |
| Display Start Time | `event_display_start_time` | string | text | event_information |  |
| End Date & Time | `event_end_datetime` | datetime | date | event_information | The end date and end time of your event. |
| Event Record ID | `event_id` | string | text | event_information | The ID of the event the registrant record is associated to. |
| Event Name | `event_name` | string | text | event_information | The name of the event the registrant record is associated to. |
| Postal Code | `event_postal_code` | string | text | event_information | The postal code where your event will take place. |
| State/Region | `event_region` | string | text | event_information | The state or region where your event will take place. |
| Start Date & Time | `event_start_datetime` | datetime | date | event_information | The start date and start time of your event. |
| Venue | `event_venue` | string | text | event_information | The name of the venue where your event will take place. |
| Google Calendar Link | `google_calendar_link` | string | text | event_information | This property holds a link to a google calendar invite for the event. |
| ICS Calendar Link | `ics_calendar_link` | string | text | event_information | This property holds a link to an ICS calendar invite for the event. |
| Meeting Link | `meeting_link` | string | text | event_information |  |
| Migration Record ID | `migration_record_id` | string | text | event_information | This is used to track the migration of the record from the old system. |
| Session IDs | `session_ids` | string | text | event_information | The IDs of the sessions the registrant record is associated to. Do not edit this field. |
| Live Views | `live_views` | number | number | hapily_registrant_information |  |
| Replay Views | `replay_views` | number | number | hapily_registrant_information |  |
| UTM Campaign | `utm_campaign` | string | text | hapily_registrant_information |  |
| UTM Content | `utm_content` | string | text | hapily_registrant_information |  |
| UTM Medium | `utm_medium` | string | text | hapily_registrant_information |  |
| UTM Source | `utm_source` | string | text | hapily_registrant_information |  |
| Company Name | `company` | string | text | registrant_information | The company name of the associated contact for this registrant object. |
| Email | `email` | string | text | registrant_information | The email address of the associated contact for this registrant object. |
| First Name | `first_name` | string | text | registrant_information | The first name of the associated contact for this registrant object. |
| Full Name | `full_name` | string | text | registrant_information | The full name of the associated contact for this registrant object. |
| Registration Group ID | `group_id` | string | text | registrant_information | This is a unique ID for the group registration that this registrant is a part of. |
| Job Title | `job_title` | string | text | registrant_information | The job title of the associated contact for this registrant object. |
| Last Name | `last_name` | string | text | registrant_information | The last name of the associated contact for this registrant object. |
| Registrant Name | `name` | string | text | registrant_information | The name of the registration. |
| Registrant Page URL | `page_url` | string | text | registrant_information | This property holds a unique URL that the registrant can visit to update their information. |
| Check-In QR Code | `qr_code` | string | text | registrant_information | This property holds the URL to a QR code image generated to track the attendance of the registrant to the event. |
| Status | `status` | enumeration | select | registrant_information | The status of the registration. |
| Walkup Registration? | `walkup_registration` | enumeration | booleancheckbox | registrant_information | This property indicates whether the registrant was created via walk-up registration at the event. |

### HubSpot-Defined Properties (by Group)

<details><summary><strong>hapily_registrant_information</strong> (30 properties)</summary>

| Property Name | Internal Name | Type | Description |
|---|---|---|---|
| All teams | `hs_all_accessible_team_ids` | enumeration | The team IDs, including the team hierarchy, of all default and custom owner properties for this reco |
| Business units | `hs_all_assigned_business_unit_ids` | enumeration | The business units this record is assigned to. |
| All owner IDs | `hs_all_owner_ids` | enumeration | Values of all default and custom owner properties for this record. |
| All team IDs | `hs_all_team_ids` | enumeration | The team IDs of all default and custom owner properties for this record. |
| Created by user ID | `hs_created_by_user_id` | number | The user who created this record. This value is set automatically by HubSpot. |
| Object create date/time | `hs_createdate` | datetime | The date and time at which this object was created. This value is automatically set by HubSpot and m |
| Object last modified date/time | `hs_lastmodifieddate` | datetime | Most recent timestamp of any property update for this object. This includes HubSpot internal propert |
| Merged record IDs | `hs_merged_object_ids` | enumeration | The list of record IDs that have been merged into this record. This value is set automatically by Hu |
| Record ID | `hs_object_id` | number | The unique ID for this record. This value is set automatically by HubSpot. |
| Record creation source | `hs_object_source` | string | Raw internal PropertySource present in the RequestMeta when this record was created. |
| Record source detail 1 | `hs_object_source_detail_1` | string | First level of detail on how this record was created. |
| Record source detail 2 | `hs_object_source_detail_2` | string | Second level of detail on how this record was created. |
| Record source detail 3 | `hs_object_source_detail_3` | string | Third level of detail on how this record was created. |
| Record creation source ID | `hs_object_source_id` | string | Raw internal sourceId present in the RequestMeta when this record was created. |
| Record source | `hs_object_source_label` | enumeration | How this record was created. |
| Record creation source user ID | `hs_object_source_user_id` | number | Raw internal userId present in the RequestMeta when this record was created. |
| Owning Teams | `hs_owning_teams` | enumeration | The teams that are attributed to this record. |
| Pinned Engagement ID | `hs_pinned_engagement_id` | number | The object ID of the current pinned engagement. This will only be shown in the app if there is alrea |
| Read only object | `hs_read_only` | bool | Determines whether a record can be edited by a user. |
| Shared teams | `hs_shared_team_ids` | enumeration | Additional teams whose users can access the record based on their permissions. This can be set manua |
| Shared users | `hs_shared_user_ids` | enumeration | Additional users that can access the record based on their permissions. This can be set manually or  |
| Unique creation key | `hs_unique_creation_key` | string | Unique property used for idempotent creates |
| Updated by user ID | `hs_updated_by_user_id` | number | The user who last updated this record. This value is set automatically by HubSpot. |
| User IDs of all notification followers | `hs_user_ids_of_all_notification_followers` | enumeration | The user IDs of all users that have clicked follow within the object to opt-in to getting follow not |
| User IDs of all notification unfollowers | `hs_user_ids_of_all_notification_unfollowers` | enumeration | The user IDs of all object owners that have clicked unfollow within the object to opt-out of getting |
| User IDs of all owners | `hs_user_ids_of_all_owners` | enumeration | The user IDs of all owners of this record. |
| Performed in an import | `hs_was_imported` | bool | Object is part of an import |
| Owner assigned date | `hubspot_owner_assigneddate` | datetime | The most recent timestamp of when an owner was assigned to this record. This value is set automatica |
| Owner | `hubspot_owner_id` | enumeration | The owner of the object. |
| Owner's main team | `hubspot_team_id` | enumeration | The main team of the record owner. This value is set automatically by HubSpot. |

</details>

---



## Leads

| Attribute | Value |
|---|---|
| **Type** | Standard Object (Native HubSpot Leads) |
| **Object Type ID** | `0-8` |
| **Pipeline** | Lead pipeline (`lead-pipeline-id`) |
| **Associations** | Leads ↔ Deals (HubSpot-defined, typeId 20) |

**Total Properties:** 222 | **Custom:** 35 | **HubSpot-Defined:** 187

### Lead Pipeline

```
  🆕 Open [NEW]
  │
  ▼
  🔄 Attempting [IN_PROGRESS]
  │
  ▼
  🔄 Connected [IN_PROGRESS]
  │
  ▼
  🔄 Meeting Set [IN_PROGRESS]
  │
  ▼
  🔄 In Progress [IN_PROGRESS]
  │
  ▼
  ✅ Qualified [QUALIFIED]
  ❌ Disqualified [UNQUALIFIED]
  ❌ Cold [UNQUALIFIED]
```

| # | Stage Name | Internal ID | State | Closed? |
|---|---|---|---|---|
| 1 | Open | `new-stage-id` | NEW | false |
| 2 | Attempting | `attempting-stage-id` | IN_PROGRESS | false |
| 3 | Connected | `connected-stage-id` | IN_PROGRESS | false |
| 4 | Meeting Set | `1154885277` | IN_PROGRESS | false |
| 5 | In Progress | `1154885278` | IN_PROGRESS | false |
| 6 | Qualified | `qualified-stage-id` | QUALIFIED | true |
| 7 | Disqualified | `unqualified-stage-id` | UNQUALIFIED | true |
| 8 | Cold | `1154885279` | UNQUALIFIED | true |

### Custom Properties

| Property Name | Internal Name | Type | Field Type | Group | Description |
|---|---|---|---|---|---|
| hapily Event ID | `lead_event_id` | string | text | event_hapily_lead_capture | The ID of the event record this lead came from. |
| Event Name | `lead_event_name` | string | text | event_hapily_lead_capture | The name of the event where this lead was captured. |
| Event Notes | `lead_event_notes` | string | textarea | event_hapily_lead_capture | The notes captured on the lead capture form at the event. |
| Company Lifecycle Stage | `company_lifecycle_stage` | enumeration | radio | lead_information | Inherited from company. |
| Contact Attribution Changed | `contact_attribution_changed` | datetime | date | lead_information | A trigger property fired when an associated contact has new attribution. |
| Contact Create Date | `contact_create_date` | date | date | lead_information |  |
| Contact Original Source | `contact_original_source` | enumeration | select | lead_information |  |
| Date Became Target Account | `date_became_target_account` | date | date | lead_information |  |
| Date Of Last Booked Meeting | `date_of_last_booked_meeting` | datetime | date | lead_information | The date of the most recently set meeting, pulled from the contact. |
| Date Today | `date_today` | date | date | lead_information | Today's date. |
| Days Since Last Engagement (Lead) | `days_since_last_engagement__lead_` | date | calculation_equation | lead_information | The number of days since this lead engaged with sales outreach. |
| Discovery Call Created Trigger | `discovery_call_created_trigger` | enumeration | booleancheckbox | lead_information |  |
| First Meeting Booked Date [ARCHIVE] | `first_meeting_booked_date` | date | date | lead_information | The date of the first meeting. |
| First Meeting Create Date | `first_meeting_create_date` | date | date | lead_information | The date that the lead's first meeting was created. |
| First Meeting Date | `first_meeting_scheduled_date` | date | date | lead_information | The date the meeting occurred, not the date it was created. |
| Has Deal Associated | `has_deal_associated` | enumeration | booleancheckbox | lead_information |  |
| Inactive Timestamp | `inactive_timestamp` | date | date | lead_information | The date in which a lead was marked as inactive. |
| Stat Lead Source | `internal_lead_source` | enumeration | select | lead_information | The latest contact source when this lead was created. |
| Last Lead Engagement Date | `last_lead_engagement_date` | date | date | lead_information | The last date that this lead engaged with sales outreach. |
| Last Meeting Held Date | `last_meeting_held_date` | date | date | lead_information |  |
| Last Meeting No-Show Date | `last_meeting_noshow_date` | date | date | lead_information |  |
| Last Meeting Set Date | `last_meeting_set_date` | date | date | lead_information |  |
| Latest Offer Type | `latest_offer_type` | enumeration | select | lead_information | Mirrored property from the associated contact showing the offer that they most recently interacted with. |
| Latest Offer Type History | `latest_offer_type_history` | enumeration | checkbox | lead_information | The offer types that a a contact has interacted with. |
| Latest Source History | `latest_source_history` | enumeration | checkbox | lead_information | Mirrored property showing all sources that the associated contact has interacted with. |
| Lead Qualification | `lead_qualification` | enumeration | checkbox | lead_information | Select all qualifications that this lead meets. |
| Meeting Attended Date | `meeting_attended_date` | date | date | lead_information |  |
| Meeting Booked Status | `meeting_booked_status` | enumeration | booleancheckbox | lead_information |  |
| Meeting No-Show Date | `meeting_noshow_date` | date | date | lead_information |  |
| # Of BANT Criteria Met | `of_bant_criteria_met` | number | number | lead_information | The number (1-4) of BANT criteria met by this lead. |
| Pending Primary Label Removal | `pending_primary_label_removal` | enumeration | booleancheckbox | lead_information |  |
| Recent Lead Source | `recent_lead_source` | string | text | lead_information |  |
| Target Account Tier | `target_account_tier` | enumeration | select | lead_information |  |
| Active Lead (Y/N) | `active_lead__y_n_` | enumeration | select | leadstages |  |
| Closed Deal Trigger | `closed_deal_trigger` | enumeration | booleancheckbox | leadstages | A trigger for when a deal is closed lost to close out all active leads. |

### Key HubSpot-Defined Properties

<details><summary><strong>Lead Management Properties</strong></summary>

| Property Name | Internal Name | Type | Options/Notes |
|---|---|---|---|
| All owner IDs | `hs_all_owner_ids` | enumeration |  |
| Date entered 'Qualified (Lead pipeline)' | `hs_date_entered_qualified_stage_id_233247981` | datetime |  |
| Date entered 'Disqualified (Lead pipeline)' | `hs_date_entered_unqualified_stage_id_1675714327` | datetime |  |
| Date exited 'Qualified (Lead pipeline)' | `hs_date_exited_qualified_stage_id_233247981` | datetime |  |
| Date exited 'Disqualified (Lead pipeline)' | `hs_date_exited_unqualified_stage_id_1675714327` | datetime |  |
| Associated Deal Pipeline Stage | `hs_lead_associated_deal_pipeline_stage` | enumeration |  |
| Lead Disqualification Note | `hs_lead_disqualification_note` | string |  |
| Disqualification Reason | `hs_lead_disqualification_reason` | enumeration | Bad Timing, Budget Constraints, No Decision-making Power, Competitor Preference, Not a Good Fit, No Interest, Prior Nega |
| First Outreach Date | `hs_lead_first_outreach_date` | datetime |  |
| Is Disqualified | `hs_lead_is_disqualified` | number |  |
| Is Qualified | `hs_lead_is_qualified` | number |  |
| Lead Label | `hs_lead_label` | enumeration | Hot, Warm, Cold |
| Lead Name | `hs_lead_name` | string |  |
| Lead name calculated | `hs_lead_name_calculated` | string |  |
| Outreach activity count | `hs_lead_outreach_activity_count` | number |  |
| Open deal amount | `hs_lead_pipeline_value` | number |  |
| Primary Company Owner | `hs_lead_primary_company_owner` | enumeration |  |
| Primary Contact Owner | `hs_lead_primary_contact_owner` | enumeration |  |
| Lead Source | `hs_lead_source` | enumeration | Organic Search, Paid Search, Email Marketing, Organic Social, Referrals, Other Campaigns, Direct Traffic, Offline Source |
| Initial company lifecycle stage | `hs_lead_source_company_lifecycle_stage` | string |  |
| Initial contact lifecycle stage | `hs_lead_source_contact_lifecycle_stage` | string |  |
| Lead Source Drill-Down 1 | `hs_lead_source_drill_down_1` | string |  |
| Lead Source Drill-Down 2 | `hs_lead_source_drill_down_2` | string |  |
| Initial source lifecycle stage | `hs_lead_source_lifecycle_stage` | string |  |
| Time to First Touch | `hs_lead_time_to_first_outreach` | number |  |
| Lead Type | `hs_lead_type` | enumeration | New business, Upsell, Re-attempting |
| Lead owner calculated | `hs_owner_id_calculated` | enumeration |  |
| Lead Pipeline | `hs_pipeline` | enumeration |  |
| Lead stage | `hs_pipeline_stage` | enumeration |  |
| Pipeline stage category id | `hs_pipeline_stage_category` | string |  |
| Pipeline Stage Category Last Updated At | `hs_pipeline_stage_category_last_updated_at` | datetime |  |
| Pipeline stage category | `hs_pipeline_stage_category_v2` | enumeration | Not started, In progress, Qualified, Disqualified |
| Pipeline stage last updated | `hs_pipeline_stage_last_updated` | datetime |  |
| Time in 'Qualified (Lead pipeline)' | `hs_time_in_qualified_stage_id_233247981` | number |  |
| Time in 'Disqualified (Lead pipeline)' | `hs_time_in_unqualified_stage_id_1675714327` | number |  |
| User IDs of all owners | `hs_user_ids_of_all_owners` | enumeration |  |
| Cumulative time in "Qualified (Lead pipeline)" | `hs_v2_cumulative_time_in_qualified_stage_id_233247981` | number |  |
| Cumulative time in "Disqualified (Lead pipeline)" | `hs_v2_cumulative_time_in_unqualified_stage_id_1675714327` | number |  |
| Date entered "Qualified (Lead pipeline)" | `hs_v2_date_entered_qualified_stage_id_233247981` | datetime |  |
| Date entered "Disqualified (Lead pipeline)" | `hs_v2_date_entered_unqualified_stage_id_1675714327` | datetime |  |
| Date exited "Qualified (Lead pipeline)" | `hs_v2_date_exited_qualified_stage_id_233247981` | datetime |  |
| Date exited "Disqualified (Lead pipeline)" | `hs_v2_date_exited_unqualified_stage_id_1675714327` | datetime |  |
| Latest time in "Qualified (Lead pipeline)" | `hs_v2_latest_time_in_qualified_stage_id_233247981` | number |  |
| Latest time in "Disqualified (Lead pipeline)" | `hs_v2_latest_time_in_unqualified_stage_id_1675714327` | number |  |
| Owner assigned date | `hubspot_owner_assigneddate` | datetime |  |
| Lead Owner | `hubspot_owner_id` | enumeration |  |

</details>

### Sample Records

| Lead Name | Source | Type | Label | Stage | Created |
|---|---|---|---|---|---|
| Denise Ross 2023-12 | OFFLINE | null | COLD | 1154885279 | 2023-12-18 |
| Stephanie Ahonen 2023-12 | OFFLINE | null | COLD | 1154885279 | 2023-12-26 |
| Sam Stroman | OFFLINE | NEW_BUSINESS | COLD | 1154885279 | 2025-08-14 |
| Amanda Flinders |  | REFERRALS | NEW_BUSINESS | COLD | 1154885279 | 2025-08-28 |
| Laurie Brown | Email Campaign | EMAIL_MARKETING | NEW_BUSINESS | COLD | 1154885279 | 2025-08-30 |
| Janine Spies | Paid Social | PAID_SOCIAL | NEW_BUSINESS | COLD | 1154885279 | 2025-08-31 |
| Javier Landivar | Prospecting | OFFLINE | NEW_BUSINESS | COLD | 1154885279 | 2025-08-31 |
| Christina Weissauer |  | OFFLINE | NEW_BUSINESS | COLD | 1154885279 | 2025-08-31 |
| Nicole Boswell | Paid Social | PAID_SOCIAL | NEW_BUSINESS | COLD | 1154885279 | 2025-08-31 |
| Jacob Rogers |  | OFFLINE | NEW_BUSINESS | COLD | 1154885279 | 2025-08-31 |

---

## Meetings

| Attribute | Value |
|---|---|
| **Type** | Engagement / Activity Object |
| **Object Type** | `meetings` |
| **Total Properties** | 100 (1 custom, 99 standard) |

### Custom Properties

| Property Name | Internal Name | Type | Field Type | Group | Description |
|---|---|---|---|---|---|
| Meeting Attribution Source | `meeting_source` | enumeration | select | meeting | The way that a meeting was set; i.e. prospecting, conference, etc. |

**`meeting_source` Options (current — 18 values):**

| Label | Internal Value | Taxonomy Alignment |
|---|---|---|
| Prospecting | Cold Call | ✅ → Prospecting |
| Conference | Conference | ⚠️ Doesn't distinguish Sponsored vs Hosted |
| Webinar | Webinar | ⚠️ Doesn't distinguish Sponsored vs Hosted |
| Digital Marketing | Digital Marketing | ❌ Too vague — could be 6+ sources |
| Email Campaign | Email Campaign | 🟡 → Email (close match) |
| Partner | Partner | ✅ → Partner |
| Other | Other | ❌ Not in taxonomy |
| Paid Search | Paid Search | ✅ → Paid Search |
| Organic Search | Organic Search | ✅ → Organic Search |
| Paid Social | Paid Social | ✅ → Paid Social |
| Organic Social | Social Media | ✅ → Organic Social |
| Janium | Janium | ❌ Legacy vendor — should be Prospecting |
| Open House | Open House | 🟡 → Hosted Event (close match) |
| Customer Referral | Word of mouth | ✅ → Referral |
| External Referral | External Referral | ⚠️ Could be Web Link or Referral |
| Employee Referral | Employee Referral | ✅ → Referral |
| Meeting | Meeting Attendee Integration | ✅ → Meeting Attendee |
| Direct Traffic | Direct Traffic | ✅ → Direct |
| Customer End-User | Customer Import | 🟡 → Integration or List Import |

> **⚠️ ALIGNMENT ISSUE:** This dropdown has 18 values that do NOT match the 24-source taxonomy used by `stat_latest_source`. The "Map Lead Source To Meeting Source" workflow (ID 103049203) attempts to map between them but this creates data inconsistency. **Recommendation:** Replace this dropdown with the canonical 24-value taxonomy to enable direct copy from `stat_latest_source`.

### Key Standard Properties

| Property Name | Internal Name | Type | Description |
|---|---|---|---|
| Meeting name | `hs_meeting_title` | string | Title of the meeting |
| Meeting start time | `hs_meeting_start_time` | datetime | When the meeting starts |
| Meeting end time | `hs_meeting_end_time` | datetime | When the meeting ends |
| Meeting outcome | `hs_meeting_outcome` | enumeration | SCHEDULED, COMPLETED, RESCHEDULED, NO_SHOW, CANCELED, COMPLETED - PROGRESSED, COMPLETED - STALLED, COMPLETED - STEP BACK |
| Call and meeting type | `hs_activity_type` | enumeration | Cold Call Outreach, Demo Call, Discovery Call, Follow-up Call, Follow-up Meeting, Initial Meeting, Partner Call, Referral Request, Text Message |
| Meeting source | `hs_meeting_source` | enumeration | How the meeting was created (CRM_UI, INTEGRATION, MEETINGS_PUBLIC, etc.) — NOT attribution source |
| Meeting description | `hs_meeting_body` | string (html) | Meeting body/notes |
| Meeting location | `hs_meeting_location` | string | Physical or virtual location |
| Activity assigned to | `hubspot_owner_id` | enumeration | Meeting owner |
| Engagement Source | `hs_engagement_source` | string | System that created the engagement |
| Engagement Source ID | `hs_engagement_source_id` | string | ID within the source system |
| Created From Link ID | `hs_meeting_created_from_link_id` | string | Which meeting scheduling link was used |

### Two "Source" Properties (Important Distinction)

| Property | What It Tracks | Set By |
|---|---|---|
| `hs_meeting_source` (standard) | **HOW** the meeting was created | HubSpot (automatic) — CRM UI, Integration, Meetings link, Calendar sync |
| `meeting_source` (custom) | **WHY** the meeting exists — attribution source | Workflow "Map Lead Source To Meeting Source" — from Contact's `stat_latest_source` |

### Associations

| From | To | Type |
|---|---|---|
| Meeting | Contact | HUBSPOT_DEFINED (typeId: 200) |
| Meeting | Company | HUBSPOT_DEFINED |
| Meeting | Deal | HUBSPOT_DEFINED |

---

## Calculated Properties

These properties are auto-calculated by HubSpot or formulas. Do NOT attempt to set them via API.

| Object | Property Name | Internal Name | Type | Formula |
|---|---|---|---|---|
| contacts | Days To Close | `days_to_close` | number | if closedate >= createdate then (1 + round_down(((closedate - createdate) / 8640 |
| contacts | First Conversion Date | `first_conversion_date` | datetime | HubSpot-calculated |
| contacts | First Conversion | `first_conversion_event_name` | string | HubSpot-calculated |
| contacts | All vids for a contact | `hs_all_contact_vids` | enumeration | HubSpot-calculated |
| contacts | The 800 most recent form submissions for a contact | `hs_calculated_form_submissions` | enumeration | HubSpot-calculated |
| contacts | Merged vids with timestamps of a contact | `hs_calculated_merged_vids` | enumeration | HubSpot-calculated |
| contacts | Calculated Mobile Number in International Format | `hs_calculated_mobile_number` | string | HubSpot-calculated |
| contacts | Calculated Phone Number in International Format | `hs_calculated_phone_number` | string | HubSpot-calculated |
| contacts | Calculated Phone Number Area Code | `hs_calculated_phone_number_area_code` | string | HubSpot-calculated |
| contacts | Calculated Phone Number Country Code | `hs_calculated_phone_number_country_code` | string | HubSpot-calculated |
| contacts | Calculated Phone Number Region | `hs_calculated_phone_number_region_code` | string | HubSpot-calculated |
| contacts | Count of unengaged contacts | `hs_count_is_unworked` | number | if is_present(hubspot_owner_id) then if is_present(hs_time_to_first_engagement)  |
| contacts | Count of engaged contacts | `hs_count_is_worked` | number | if is_present(hubspot_owner_id) then if is_present(hs_time_to_first_engagement)  |
| contacts | Currently Enrolled in Prospecting Agent | `hs_currently_enrolled_in_prospecting_agent` | bool | if is_present(hs_prospecting_agent_actively_enrolled_count) then if hs_prospecti |
| contacts | Email Domain | `hs_email_domain` | string | HubSpot-calculated |
| contacts | ID of first engagement | `hs_first_engagement_object_id` | number | HubSpot-calculated |
| contacts | First outreach date | `hs_first_outreach_date` | datetime | HubSpot-calculated |
| contacts | Full name or email | `hs_full_name_or_email` | string | if (is_present(string(firstname)) and is_present(string(lastname))) then format_ |
| contacts | Is a contact | `hs_is_contact` | bool | HubSpot-calculated |
| contacts | Contact unworked | `hs_is_unworked` | bool | (not (is_present(hubspot_owner_assigneddate)) or not (is_present(notes_last_upda |
| contacts | Latest Disqualified Lead Date | `hs_latest_disqualified_lead_date` | datetime | HubSpot-calculated |
| contacts | Latest Open Lead Date | `hs_latest_open_lead_date` | datetime | HubSpot-calculated |
| contacts | Latest Qualified Lead Date | `hs_latest_qualified_lead_date` | datetime | HubSpot-calculated |
| contacts | Last sequence ended date | `hs_latest_sequence_ended_date` | datetime | max(hs_latest_sequence_unenrolled_date, hs_latest_sequence_finished_date) |
| contacts | Manual campaign ids | `hs_manual_campaign_ids` | number | HubSpot-calculated |
| contacts | Member has accessed private content | `hs_membership_has_accessed_private_content` | number | if is_present(hs_membership_last_private_content_access_date) then 1 else 0 |
| contacts | Registered member | `hs_registered_member` | number | if is_present(hs_content_membership_registered_at) then 1 else 0 |
| contacts | Description of first engagement | `hs_sa_first_engagement_descr` | enumeration | HubSpot-calculated |
| contacts | Type of first engagement | `hs_sa_first_engagement_object_type` | enumeration | HubSpot-calculated |
| contacts | Calculated Mobile Number with country code | `hs_searchable_calculated_international_mobile_number` | phone_number | HubSpot-calculated |
| contacts | Calculated Phone Number with country code | `hs_searchable_calculated_international_phone_number` | phone_number | HubSpot-calculated |
| contacts | Calculated Mobile Number without country code | `hs_searchable_calculated_mobile_number` | phone_number | HubSpot-calculated |
| contacts | Calculated Phone Number without country code | `hs_searchable_calculated_phone_number` | phone_number | HubSpot-calculated |
| contacts | Currently in Sequence | `hs_sequences_is_enrolled` | bool | if is_present(hs_latest_sequence_enrolled_date) then if (is_present(hs_sequences |
| contacts | Time between contact creation and Opportunity close | `hs_time_between_contact_creation_and_deal_close` | number | time_between(createdate, hs_v2_date_entered_customer) |
| contacts | Time between contact creation and Opportunity creation | `hs_time_between_contact_creation_and_deal_creation` | number | time_between(createdate, first_deal_created_date) |
| contacts | Lead response time | `hs_time_to_first_engagement` | number | HubSpot-calculated |
| contacts | Time to move from lead to customer | `hs_time_to_move_from_lead_to_customer` | number | time_between(hs_v2_date_entered_lead, hs_v2_date_entered_customer) |
| contacts | Time to move from marketing qualified lead to customer | `hs_time_to_move_from_marketingqualifiedlead_to_customer` | number | time_between(hs_v2_date_entered_marketingqualifiedlead, hs_v2_date_entered_custo |
| contacts | Time to move from opportunity to customer | `hs_time_to_move_from_opportunity_to_customer` | number | time_between(hs_v2_date_entered_opportunity, hs_v2_date_entered_customer) |
| contacts | Time to move from sales qualified lead to customer | `hs_time_to_move_from_salesqualifiedlead_to_customer` | number | time_between(hs_v2_date_entered_salesqualifiedlead, hs_v2_date_entered_customer) |
| contacts | Time to move from subscriber to customer | `hs_time_to_move_from_subscriber_to_customer` | number | time_between(hs_v2_date_entered_subscriber, hs_v2_date_entered_customer) |
| contacts | Date entered current stage | `hs_v2_date_entered_current_stage` | datetime | string_to_number(timestamp(lifecyclestage)) |
| contacts | Time in current stage | `hs_v2_time_in_current_stage` | datetime | hs_v2_date_entered_current_stage |
| contacts | Number of Form Submissions | `num_conversion_events` | number | HubSpot-calculated |
| contacts | Number of Unique Forms Submitted | `num_unique_conversion_events` | number | HubSpot-calculated |
| contacts | Number of active associated leads | `number_of_active_associated_leads` | number | HubSpot-calculated |
| contacts | Number Of Hapily Event Interactions | `number_of_hapily_event_interactions` | number | HubSpot-calculated |
| contacts | Recent Conversion Date | `recent_conversion_date` | datetime | HubSpot-calculated |
| contacts | Recent Conversion | `recent_conversion_event_name` | string | HubSpot-calculated |
| contacts | SyncTimes Entered MQL Date | `synctimes_entered_mql_date` | date | if is_present(hs_v2_date_entered_marketingqualifiedlead) then hs_v2_date_entered |
| contacts | SyncTimes Entered SQL Date | `synctimes_entered_sql_date` | date | if is_present(hs_v2_date_entered_salesqualifiedlead) then hs_v2_date_entered_sal |
| contacts | Weighted Engagement | `weighted_engagement` | number | (influence_score * firmo_behavioral_contact_score_engagement) |
| companies | ABM Velocity: Cold To Working (Days) | `abm_velocity_cold_to_working_days` | number | time_between(date_entered_cold_abm_stage, date_entered_working_abm_stage) |
| companies | ABM Velocity: Meeting Held To Opp Created (Days) | `abm_velocity_meeting_held_to_opp_created_days` | number | time_between(date_entered_meeting_held_abm_stage, date_entered_opportunity_creat |
| companies | ABM Velocity: Meeting Set To Meeting Held (Days) | `abm_velocity_meeting_set_to_meeting_held_days` | number | time_between(date_entered_meeting_set_abm_stage, date_entered_meeting_held_abm_s |
| companies | ABM Velocity: Opp Created To Closed Won (Days) | `abm_velocity_opp_created_to_closed_won_days` | number | time_between(date_entered_opportunity_created_abm_stage, date_entered_closed_won |
| companies | ABM Velocity: Working To Meeting Set (Days) | `abm_velocity_working_to_meeting_set_days` | number | time_between(date_entered_working_abm_stage, date_entered_meeting_set_abm_stage) |
| companies | Average Sales Engagement | `average_sales_engagement` | number | (sales_activity_score / of_active_associated_leads) |
| companies | Total Account Engagement | `buying_committee_engagement` | number | HubSpot-calculated |
| companies | Days to Close | `days_to_close` | number | if (closedate - createdate) >= 0 then round_down(((closedate - createdate) / 864 |
| companies | Decision Maker Engagement % | `decision_maker_engagement` | number | (number_of_engaged_decision_makers / of_decision_makers) |
| companies | Distance from Customer | `distance_from_customer` | number | sqrt((power((4 - 2), 2) + power((1 - 3), 2))) |
| companies | Annual Revenue Currency Code | `hs_annual_revenue_currency_code` | string | 'USD' |
| companies | Calculated Phone Number in International Format | `hs_calculated_phone_number` | string | format_phone_number(string(phone)) |
| companies | Calculated Phone Number with country code | `hs_searchable_calculated_international_phone_number` | string | if substring(string(hs_calculated_phone_number), 0, 1) equals '+' then substring |
| companies | Calculated Phone Number without country code | `hs_searchable_calculated_phone_number` | string | format_searchable_phone_number(string(phone)) |
| companies | Company task label | `hs_task_label` | string | if is_present(string(name)) then string(name) else string(domain) |
| companies | Date entered current stage | `hs_v2_date_entered_current_stage` | datetime | string_to_number(timestamp(lifecyclestage)) |
| companies | Time in current stage | `hs_v2_time_in_current_stage` | datetime | hs_v2_date_entered_current_stage |
| companies | Is EBR Scheduled | `is_ebr_scheduled` | number | if is_present(next_ebr) then 1 else 0 |
| companies | Nearby Company Count | `nearby_customer_count` | number | HubSpot-calculated |
| companies | Number of closed lost deals | `number_of_closed_lost_deals` | number | HubSpot-calculated |
| companies | Number of engaged decision makers | `number_of_engaged_decision_makers` | number | HubSpot-calculated |
| companies | # Of Active Associated Leads | `of_active_associated_leads` | number | HubSpot-calculated |
| companies | # Of Contacts In Sequence | `of_contacts_in_sequence` | number | HubSpot-calculated |
| companies | # Of Decision Makers | `of_decision_makers` | number | HubSpot-calculated |
| companies | # Of MQLs Engaged | `of_mqls_engaged` | number | HubSpot-calculated |
| companies | # of Referrals | `of_referrals` | number | HubSpot-calculated |
| companies | ROE | Active Open Deal Count | `roe__active_open_deal_count` | number | HubSpot-calculated |
| companies | Time In Current ABM Stage | `time_in_current_abm_stage` | number | time_between(date_entered_current_abm_stage, today_date) |
| companies | Total Gift Amount Claimed | `total_gift_amount_claimed` | number | HubSpot-calculated |
| deals | Amount in company currency | `amount_in_home_currency` | number | if is_present(hs_exchange_rate) then (amount * hs_exchange_rate) else amount |
| deals | Days Since Last Activity | `days_since_last_activity` | datetime | notes_last_updated |
| deals | Days to close | `days_to_close` | number | max(0, round_down(((closedate - createdate) / 86400000), 0)) |
| deals | Deal Age | `deal_age_v2` | datetime | createdate |
| deals | Actual duration | `hs_actual_duration` | number | if createdate > closedate then 0 else time_between(createdate, closedate) |
| deals | Annual contract value | `hs_acv` | number | HubSpot-calculated |
| deals | Opportunity Split Users | `hs_all_deal_split_owner_ids` | enumeration | HubSpot-calculated |
| deals | Latest Traffic Source | `hs_analytics_latest_source` | enumeration | if is_present(string(hs_analytics_latest_source_contact)) then string(hs_analyti |
| deals | Latest Traffic Source Data 1 | `hs_analytics_latest_source_data_1` | string | if is_present(string(hs_analytics_latest_source_contact)) then string(hs_analyti |
| deals | Latest Traffic Source Data 2 | `hs_analytics_latest_source_data_2` | string | if is_present(string(hs_analytics_latest_source_contact)) then string(hs_analyti |
| deals | Latest Traffic Source Timestamp | `hs_analytics_latest_source_timestamp` | datetime | if is_present(string(hs_analytics_latest_source_contact)) then hs_analytics_late |
| deals | Annual recurring revenue | `hs_arr` | number | HubSpot-calculated |
| deals | Associated Shared Opportunity Type | `hs_associated_deal_registration_deal_type` | enumeration | HubSpot-calculated |
| deals | Associated Shared Opportunity Product Interests | `hs_associated_deal_registration_product_interests` | enumeration | HubSpot-calculated |
| deals | Closed Deal Amount | `hs_closed_amount` | number | if (is_present(pipeline_probability(string(dealstage))) and pipeline_probability |
| deals | Closed deal amount in home currency | `hs_closed_amount_in_home_currency` | number | if (is_present(pipeline_probability(string(dealstage))) and pipeline_probability |
| deals | Closed Deal Close Date | `hs_closed_deal_close_date` | number | if (bool(hs_is_closed) and createdate < closedate) then time_between(closedate,  |
| deals | Closed Deal Create Date | `hs_closed_deal_create_date` | number | if (bool(hs_is_closed) and createdate < closedate) then time_between(createdate, |
| deals | Closed won count | `hs_closed_won_count` | number | if bool(hs_is_closed_won) then 1 else 0 |
| deals | Closed Won Date (Internal) | `hs_closed_won_date` | datetime | if bool(hs_is_closed_won) then closedate endif |
| deals | Days to close (without rounding) | `hs_days_to_close_raw` | number | (max(0, (closedate - createdate)) / 86400000) |
| deals | Deal stage probability shadow | `hs_deal_stage_probability_shadow` | number | if is_present(pipeline_probability(string(dealstage))) then pipeline_probability |
| deals | Forecast amount | `hs_forecast_amount` | number | if is_present(hs_forecast_probability) then (hs_forecast_probability * amount_in |
| deals | Has Last Meeting Follow Ups | `hs_has_last_meeting_followups` | bool | is_present(hs_last_meeting_id_with_followups) |
| deals | Is Opportunity Closed? | `hs_is_closed` | bool | (pipeline_probability(string(dealstage)) <= 0 or pipeline_probability(string(dea |
| deals | Is Closed (numeric) | `hs_is_closed_count` | number | if bool(hs_is_closed) then 1 else 0 |
| deals | Is closed lost | `hs_is_closed_lost` | bool | if (is_present(hs_deal_stage_probability) and hs_deal_stage_probability <= 0) th |
| deals | Is Closed Won | `hs_is_closed_won` | bool | if (is_present(pipeline_probability(string(dealstage))) and pipeline_probability |
| deals | Opportunity Split Added | `hs_is_deal_split` | bool | if (is_present(hs_num_associated_deal_splits) and hs_num_associated_deal_splits  |
| deals | Is Open (numeric) | `hs_is_open_count` | number | if bool(hs_is_closed) then 0 else 1 |
| deals | Manual campaign ids | `hs_manual_campaign_ids` | number | HubSpot-calculated |
| deals | Monthly recurring revenue | `hs_mrr` | number | HubSpot-calculated |
| deals | Next Step Updated At | `hs_next_step_updated_at` | datetime | string_to_number(timestamp(hs_next_step)) |
| deals | Number of Active Opportunity Registrations | `hs_num_associated_active_deal_registrations` | number | HubSpot-calculated |
| deals | Number of Opportunity Registrations | `hs_num_associated_deal_registrations` | number | HubSpot-calculated |
| deals | Number of Deal Splits | `hs_num_associated_deal_splits` | number | HubSpot-calculated |
| deals | Number of Associated Line Items | `hs_num_of_associated_line_items` | number | HubSpot-calculated |
| deals | Open amount in home currency | `hs_open_amount_in_home_currency` | number | if hs_is_open_count equals 1 then amount_in_home_currency else 0 |
| deals | Open deal create date | `hs_open_deal_create_date` | number | if bool(hs_is_closed) then 0 else time_between(createdate, 0) |
| deals | The predicted deal amount | `hs_predicted_amount` | number | if (is_present(hs_likelihood_to_close) and hs_likelihood_to_close >= 0 and hs_li |
| deals | The predicted deal amount in your company's currency | `hs_predicted_amount_in_home_currency` | number | if (is_present(hs_likelihood_to_close) and hs_likelihood_to_close >= 0 and hs_li |
| deals | Weighted amount | `hs_projected_amount` | number | if (is_present(hs_deal_stage_probability) and hs_deal_stage_probability >= 0) th |
| deals | Weighted amount in company currency | `hs_projected_amount_in_home_currency` | number | if (is_present(hs_deal_stage_probability) and hs_deal_stage_probability >= 0) th |
| deals | Total contract value | `hs_tcv` | number | HubSpot-calculated |
| deals | Date entered current stage | `hs_v2_date_entered_current_stage` | datetime | string_to_number(timestamp(dealstage)) |
| deals | Time in current stage | `hs_v2_time_in_current_stage` | datetime | hs_v2_date_entered_current_stage |
| deals | Weighted open pipeline in company currency | `hs_weighted_pipeline_in_company_currency` | number | (hs_open_amount_in_home_currency * hs_deal_stage_probability) |
| deals | Number of Associated Contacts | `num_associated_contacts` | number | HubSpot-calculated |
| deals | # Of Decision Makers | `of_decision_makers` | number | HubSpot-calculated |
| deals | Revenue Per Room | `revenue_per_room` | number | (amount / room_count) |
| deals | SNE | `sne` | number | if is_present(hs_next_meeting_start_time) then 1 else 0 |
| deals | Time since Last Activity | `time_since_last_activity` | number | time_between(notes_last_updated, date_today) |
| hapily_event | Closed Won Revenue | `closed_won_deal_revenue` | number | HubSpot-calculated |
| hapily_event | Influenced Pipeline | `influenced_pipeline` | number | HubSpot-calculated |
| hapily_event | Total Registrations | `registrations` | number | HubSpot-calculated |
| hapily_event | Total Attendees | `total_attendees` | number | HubSpot-calculated |
| hapily_event | Total Event Leads | `total_event_leads` | number | HubSpot-calculated |
| hapily_event | Total No-shows | `total_noshows` | number | HubSpot-calculated |
| hapily_event | Total Opportunities | `total_opportunities` | number | HubSpot-calculated |

---

## Ghost Properties

> ⚠️ These custom properties have **no description** or use generic/ambiguous names. They may be orphaned or need cleanup.

| Object | Property Name | Internal Name | Type | Group |
|---|---|---|---|---|
| contacts | Has Attribution Data Hygiene Issues | `has_attribution_data_hygiene_issues` | enumeration | attribution_properties |
| contacts | Last Attribution Evaluation Date | `last_attribution_evaluation_date` | datetime | attribution_properties |
| contacts | Latest Variant | `latest_variant` | string | attribution_properties |
| contacts | Opportunity Self-Reported Attribution | `oc_self_reported_attribution` | string | attribution_properties |
| contacts | Latest Offer Type | `offer_type` | enumeration | attribution_properties |
| contacts | Original Offer Type | `original_offer_type` | enumeration | attribution_properties |
| contacts | Stat Latest Source | `stat_latest_source` | enumeration | attribution_properties |
| contacts | Stat Original Source | `stat_original_source` | enumeration | attribution_properties |
| contacts | utm_campaign | `utm_campaign` | string | attribution_properties |
| contacts | utm_content | `utm_content` | string | attribution_properties |
| contacts | utm_medium | `utm_medium` | string | attribution_properties |
| contacts | utm_offer | `utm_offer` | string | attribution_properties |
| contacts | utm_source | `utm_source` | string | attribution_properties |
| contacts | utm_term | `utm_term` | string | attribution_properties |
| contacts | Apollo Campaign | `apollo_campaign` | string | contactinformation |
| contacts | Corporate Phone | `corporate_phone` | string | contactinformation |
| contacts | Deal Enablement Interaction | `deal_enablement_interaction` | enumeration | contactinformation |
| contacts | Email Lists | `email_lists` | string | contactinformation |
| contacts | Extension | `extension` | number | contactinformation |
| contacts | Future Education | `future_education` | enumeration | contactinformation |
| contacts | Gift Claimed Amount | `gift_claimed_amount` | number | contactinformation |
| contacts | Gift Claimed Timestamp | `gift_claimed_timestamp` | date | contactinformation |
| contacts | Gift Delivered Timestamp | `gift_delivered_timestamp` | date | contactinformation |
| contacts | Gift Sent Timestamp | `gift_sent_timestamp` | date | contactinformation |
| contacts | Gift Status | `gift_status` | enumeration | contactinformation |
| contacts | Has 70+ MQL Score | `has_70__mql_score` | enumeration | contactinformation |
| contacts | Interest | `interest` | string | contactinformation |
| contacts | Is Decision Maker Title | `is_decision_maker_title` | enumeration | contactinformation |
| contacts | Is Engaged Decision Maker | `is_engaged_decision_maker` | enumeration | contactinformation |
| contacts | Job Title custom | `job_title` | string | contactinformation |
| contacts | Last Disco End Time | `last_disco_end_time` | datetime | contactinformation |
| contacts | Last NPS Comment | `last_nps_comment` | string | contactinformation |
| contacts | Last NPS Score | `last_nps_score` | number | contactinformation |
| contacts | Last NPS Survey Date_NEW | `last_nps_survey_date_new` | datetime | contactinformation |
| contacts | Marketing Test | `marketing_test` | enumeration | contactinformation |
| contacts | My Chosen Saturday Activity | `my_chosen_saturday_activity` | enumeration | contactinformation |
| contacts | Name | `name` | string | contactinformation |
| contacts | NeedsOnboardingSurvey | `needsonboardingsurvey` | string | contactinformation |
| contacts | Notes_Use | `notes_use` | string | contactinformation |
| contacts | Number of active associated leads | `number_of_active_associated_leads` | number | contactinformation |
| contacts | Number of guests | `number_of_guests` | number | contactinformation |
| contacts | Preferred Date | `preferred_date` | date | contactinformation |
| contacts | Preferred Demo Time | `preferred_demo_time` | enumeration | contactinformation |
| contacts | Preferred Time | `preferred_time` | string | contactinformation |
| contacts | Primary Contact | `primary_contact` | enumeration | contactinformation |
| contacts | Prospecting Interactions | `prospecting_interaction` | enumeration | contactinformation |
| contacts | Sales Ownership | `sales_ownership` | enumeration | contactinformation |
| contacts | Sales Team Member | `sales_team_member` | enumeration | contactinformation |
| contacts | Stat Squad Request | `stat_squad_request` | string | contactinformation |
| contacts | SyncTimes Competition Participant | `synctimes_competition_participant` | enumeration | contactinformation |
| contacts | Type of Covered Entity | `type_of_covered_entity` | enumeration | contactinformation |
| contacts | Webinar Requested | `webinar_requested` | enumeration | contactinformation |
| contacts | SyncTimes Entered MQL Date | `synctimes_entered_mql_date` | date | conversioninformation |
| contacts | SyncTimes Entered SQL Date | `synctimes_entered_sql_date` | date | conversioninformation |
| contacts | Emails Opened | `emails_opened` | number | emailinformation |
| contacts | Emails Received | `emails_received` | number | emailinformation |
| contacts | Meeting Status | `meeting_status` | enumeration | meeting_info |
| contacts | Mobly Email | `mobly_email` | string | mobly_ |
| contacts | Mobly Event | `mobly_event` | string | mobly_ |
| contacts | Hapily Owner | `mobly_owner` | string | mobly_ |
| contacts | Actively Working | `actively_working__c` | enumeration | salesforceinformation |
| contacts | Attended Feb 2021 Webinar | `attended_feb_2021_webinar__c` | enumeration | salesforceinformation |
| contacts | Biz Dev Lead | `biz_dev_lead__c` | enumeration | salesforceinformation |
| contacts | Engagement Rating | `engagement_rating__c` | enumeration | salesforceinformation |
| contacts | Follow Up? | `follow_up__c` | enumeration | salesforceinformation |
| contacts | IT Contact | `it_contact__c` | enumeration | salesforceinformation |
| contacts | Status | `leadstatus` | enumeration | salesforceinformation |
| contacts | Linkedin | `linkedin__c` | string | salesforceinformation |
| contacts | Marketing Emails | `marketing_emails__c` | enumeration | salesforceinformation |
| contacts | Next Steps | `next_steps__c` | string | salesforceinformation |
| contacts | Notes | `notes__c` | string | salesforceinformation |
| contacts | Notes History | `notes_history__c` | string | salesforceinformation |
| contacts | Employees | `numberofemployees` | number | salesforceinformation |
| contacts | Operations Lead | `operations_lead__c` | enumeration | salesforceinformation |
| contacts | Partner | `partner__c` | enumeration | salesforceinformation |
| contacts | Partnerx | `partnerx__c` | enumeration | salesforceinformation |
| contacts | Personal Outreach List | `personal_contact_recommended__c` | enumeration | salesforceinformation |
| contacts | Priority | `priority__c` | enumeration | salesforceinformation |
| contacts | Rating | `rating` | enumeration | salesforceinformation |
| contacts | Registered Lead Finder | `registered_lead_finder__c` | enumeration | salesforceinformation |
| contacts | Total Patients | `total_patients__c` | number | salesforceinformation |
| contacts | Last Registered Marketing Opt-In | `last_registered_marketing_optin` | string | webinargeek |
| contacts | Last Registered Webinar Custom Link Source | `last_registered_webinar_custom_link_source` | string | webinargeek |
| contacts | Last Registered Webinar Date | `last_registered_webinar_date` | datetime | webinargeek |
| contacts | Last Registered Webinar Link | `last_registered_webinar_link` | string | webinargeek |
| contacts | Last Registered Webinar Local Datetime | `last_registered_webinar_local_datetime` | string | webinargeek |
| contacts | Last Registered Webinar Name | `last_registered_webinar_name` | string | webinargeek |
| contacts | Last Viewed Webinar Date | `last_viewed_webinar_date` | datetime | webinargeek |
| contacts | Last Viewed Webinar Name | `last_viewed_webinar_name` | string | webinargeek |
| companies | Company Offer Type | `ac_offer_type` | enumeration | attribution_properties |
| companies | Company Source | `ac_source` | enumeration | attribution_properties |
| companies | Company Attribution Errors | `company_attribution_errors` | string | attribution_properties |
| companies | Latest Offer Type | `latest_offer_type` | enumeration | attribution_properties |
| companies | Latest Variant | `latest_variant` | string | attribution_properties |
| companies | Opportunity Source | `opportunity_source` | enumeration | attribution_properties |
| companies | Original Offer Type | `original_offer_type` | enumeration | attribution_properties |
| companies | Stat Latest Source | `stat_latest_source` | enumeration | attribution_properties |
| companies | Stat Original Source | `stat_original_source` | enumeration | attribution_properties |
| companies | Suggested Attribution Fixes | `suggested_attribution_fixes` | string | attribution_properties |
| companies | Company Status | `company_status` | enumeration | company_activity |
| companies | Next Steps | `next_steps` | string | company_activity |
| companies | Number of closed lost deals | `number_of_closed_lost_deals` | number | company_activity |
| companies | # Of MQLs Engaged | `of_mqls_engaged` | number | company_signals |
| companies | Account Executive | `account_executive` | enumeration | companyinformation |
| companies | Community Impact | `community_impact` | string | companyinformation |
| companies | Contracts | `contracts` | string | companyinformation |
| companies | Cross-Object Issues | `cross_object_issues` | string | companyinformation |
| companies | CSE | `cse` | enumeration | companyinformation |
| companies | Customer Propensity Score | `customer_propensity_score` | number | companyinformation |
| companies | Date Entered: Opportunity Created ABM Stage | `date_entered_opportunity_created_abm_stage` | date | companyinformation |
| companies | Expansion Potential | `expansion_potential` | enumeration | companyinformation |
| companies | Funding Request Amount | `funding_request_amount` | string | companyinformation |
| companies | Gateway Frequency | `gateway_frequency` | enumeration | companyinformation |
| companies | Gateway Programming Date | `gateway_programming_date` | date | companyinformation |
| companies | Grant Summary | `grant_summary` | string | companyinformation |
| companies | Is EBR Scheduled | `is_ebr_scheduled` | number | companyinformation |
| companies | Keywords (Used In Workflow) | `keywords__used_in_workflow_` | string | companyinformation |
| companies | Last Badge Number | `last_badge_number` | number | companyinformation |
| companies | Latitude | `latitude` | number | companyinformation |
| companies | Longitude | `longitude` | number | companyinformation |
| companies | MSA Date | `msa_date` | date | companyinformation |
| companies | Nearby Company Count | `nearby_customer_count` | number | companyinformation |
| companies | # Of Active Associated Leads | `of_active_associated_leads` | number | companyinformation |
| companies | # Of Contacts In Sequence | `of_contacts_in_sequence` | number | companyinformation |
| companies | # Of Decision Makers | `of_decision_makers` | number | companyinformation |
| companies | Operational Visibility | `operational_visibility` | string | companyinformation |
| companies | Population Served | `population_served` | string | companyinformation |
| companies | Profit Percentage | `profit_percentage` | number | companyinformation |
| companies | Promotion Plan | `promotion_plan` | string | companyinformation |
| companies | Record Type | `record_type` | enumeration | companyinformation |
| companies | Site Count | `site_count` | number | companyinformation |
| companies | Stat Badge Type | `stat_badge_type` | enumeration | companyinformation |
| companies | Date Today | `today_date` | date | companyinformation |
| companies | Total Expansion Potential | `total_expansion_potential` | number | companyinformation |
| companies | Workforce Impact | `workforce_impact` | string | companyinformation |
| companies | Exam Rooms | `exam_rooms` | number | customer_success |
| companies | Locator Rooms | `locator_rooms` | number | customer_success |
| companies | Auto-Merge: Approved | `auto_merge__approved` | enumeration | deduplication_properties |
| companies | Auto-Merge: Candidate ID | `auto_merge__candidate_id` | string | deduplication_properties |
| companies | Auto-Merge: Do Not Auto-Merge | `auto_merge__do_not_auto_merge` | enumeration | deduplication_properties |
| companies | Auto-Merge: Error | `auto_merge__error` | string | deduplication_properties |
| companies | Auto-Merge: Last Merged IDs | `auto_merge__last_merged_ids` | string | deduplication_properties |
| companies | Auto-Merge: Last Primary ID | `auto_merge__last_primary_id` | string | deduplication_properties |
| companies | Auto-Merge: Last Result | `auto_merge__last_result` | string | deduplication_properties |
| companies | Auto-Merge: Last Run At | `auto_merge__last_run_at` | date | deduplication_properties |
| companies | Auto-Merge: Last Strategy | `auto_merge__last_strategy` | enumeration | deduplication_properties |
| companies | Auto-Merge: Review Required | `auto_merge__review_required` | enumeration | deduplication_properties |
| companies | Auto-Merge Last Strategy Text Field | `auto_merge_last_strategy_text_field` | string | deduplication_properties |
| companies | Normalized Domain | `normalized_domain` | string | deduplication_properties |
| companies | Normalized Website | `normalized_website` | string | deduplication_properties |
| companies | Potential Duplicate | `potential_duplicate` | enumeration | deduplication_properties |
| companies | stat_dedupe_fingerprint_v1 | `stat_dedupe_fingerprint_v1` | string | deduplication_properties |
| companies | stat_dedupe_outcome | `stat_dedupe_outcome` | string | deduplication_properties |
| companies | stat_dedupe_processed_at | `stat_dedupe_processed_at` | datetime | deduplication_properties |
| companies | Date Entered: Meeting Held ABM Stage | `date_entered_meeting_held_abm_stage` | date | meeting_info |
| companies | Date Entered: Meeting Set ABM Stage | `date_entered_meeting_set_abm_stage` | date | meeting_info |
| companies | # of Referrals | `of_referrals` | number | partner |
| companies | ROE | Company | Open Pool Reason | `roe___company___open_pool_reason` | enumeration | rules_of_engagement |
| companies | ROE | Active Open Deal Count | `roe__active_open_deal_count` | number | rules_of_engagement |
| companies | Surveys - Basic | `basic_surveys__c` | enumeration | salesforceinformation |
| companies | Benchmarking Data | `benchmarking_data__c` | enumeration | salesforceinformation |
| companies | Consulting Services & Data Utilization | `consulting_services_data_utilization__c` | enumeration | salesforceinformation |
| companies | Copy Billing Address to Shipping Address | `copy_billing_address_to_shipping_address__c` | enumeration | salesforceinformation |
| companies | CS Next Steps & Priorities | `cs_next_steps_priorities__c` | string | salesforceinformation |
| companies | DBA | `dba__c` | string | salesforceinformation |
| companies | Duress Beacons | `duress_beacons` | enumeration | salesforceinformation |
| companies | EHR Integration | `ehr_integration__c` | enumeration | salesforceinformation |
| companies | Emergency Buttons | `emergency_buttons__c` | enumeration | salesforceinformation |
| companies | Lead Finder | `lead_finder__c` | enumeration | salesforceinformation |
| companies | Lobby View | `lobby_view__c` | enumeration | salesforceinformation |
| companies | Network Conf & Unique Install Notes | `network_conf_unique_install_notes__c` | string | salesforceinformation |
| companies | NPS Score (All Time) | `nps_score_all_time__c` | number | salesforceinformation |
| companies | Pop Health Integration | `pop_health_integration__c` | enumeration | salesforceinformation |
| companies | Shipping Notes | `shipping_notes__c` | string | salesforceinformation |
| companies | Surveys - Advanced | `surveys_advanced__c` | enumeration | salesforceinformation |
| companies | LinkedIn Company Name | `linkedin_company_name` | string | socialmediainformation |
| companies | ABM: Date Entered Opportunity Stage | `abm_date_entered_opportunity_stage` | date | targetaccountsinformation |
| companies | ABM Outreach Readiness | `abm_outreach_readiness` | enumeration | targetaccountsinformation |
| companies | Date Entered: Closed Won ABM Stage | `date_entered_closed_won_abm_stage` | date | targetaccountsinformation |
| companies | Date Entered: Cold ABM Stage | `date_entered_cold_abm_stage` | date | targetaccountsinformation |
| companies | Date Entered: Working ABM Stage | `date_entered_working_abm_stage` | date | targetaccountsinformation |
| companies | Gift Claimed Timestamp | `gift_claimed_timestamp` | date | targetaccountsinformation |
| companies | Gift Delivered Timestamp | `gift_delivered_timestamp` | date | targetaccountsinformation |
| companies | Gift Interaction (Y/N) | `gift_interaction_yn` | enumeration | targetaccountsinformation |
| companies | Gift Sent Timestamp | `gift_sent_timestamp` | date | targetaccountsinformation |
| companies | Gift Status | `gift_status` | enumeration | targetaccountsinformation |
| companies | Number of engaged decision makers | `number_of_engaged_decision_makers` | number | targetaccountsinformation |
| companies | Time In Current ABM Stage | `time_in_current_abm_stage` | number | targetaccountsinformation |
| companies | Total Gift Amount Claimed | `total_gift_amount_claimed` | number | targetaccountsinformation |
| deals | Deal Hygiene Issues | `deal_hygiene_issues` | string | attribution_properties |
| deals | Latest Variant | `latest_variant` | string | attribution_properties |
| deals | Opportunity Source | `oc_source` | enumeration | attribution_properties |
| deals | Stat Latest Source | `stat_latest_source` | enumeration | attribution_properties |
| deals | Stat Original Source | `stat_original_source` | enumeration | attribution_properties |
| deals | At Power | `at_power` | enumeration | deal_activity |
| deals | Date Today | `date_today` | date | deal_activity |
| deals | Account Executive | `account_executive` | enumeration | dealinformation |
| deals | BDR Owner | `bdr_owner` | enumeration | dealinformation |
| deals | Commit for Forecasting | `blood_commit` | enumeration | dealinformation |
| deals | CSE | `cse` | enumeration | dealinformation |
| deals | Days Since Last Activity | `days_since_last_activity` | datetime | dealinformation |
| deals | Deal Age | `deal_age_v2` | datetime | dealinformation |
| deals | Flag for Sales Meeting Discussion | `flag_for_sales_meeting_discussion` | enumeration | dealinformation |
| deals | go_live_date | `go_live_date` | number | dealinformation |
| deals | Lead | `lead` | string | dealinformation |
| deals | Mini Expansion - Exclude from Onboarding View | `mini_expansion___exclude_from_onboarding_view` | enumeration | dealinformation |
| deals | # Of Decision Makers | `of_decision_makers` | number | dealinformation |
| deals | Partner Name | `partner_name` | enumeration | dealinformation |
| deals | Referring Party | `referring_party` | string | dealinformation |
| deals | Revenue Per Room | `revenue_per_room` | number | dealinformation |
| deals | Room Count | `room_count` | number | dealinformation |
| deals | Time since Last Activity | `time_since_last_activity` | number | dealinformation |
| deals | Champion Associated | `champion_associated` | enumeration | dealstages |
| deals | Solutions Engineer Involved | `solutions_engineer_involved` | enumeration | dealstages |
| deals | Building Status | `building_status` | enumeration | onboarding_records |
| deals | Executed PDF Agreement | `executed_pdf_agreement` | string | onboarding_records |
| deals | AE Director Override | `ae_director_override__c` | number | salesforceinformation |
| deals | ARR | `arr__c` | number | salesforceinformation |
| deals | Biz Dev Lead | `biz_dev_lead__c` | enumeration | salesforceinformation |
| deals | CSE Commission | `client_success_exec_commission__c` | number | salesforceinformation |
| deals | Clinic Goals | `clinic_goals__c` | string | salesforceinformation |
| deals | Commission Status | `comission_status__c` | enumeration | salesforceinformation |
| deals | Competition | `competition__c` | string | salesforceinformation |
| deals | Conference Name | `conference_name__c` | string | salesforceinformation |
| deals | Contract Expiration Date | `contract_expiration_date__c` | date | salesforceinformation |
| deals | CS Director Override | `cs_director_override__c` | number | salesforceinformation |
| deals | Decision Criteria retired | `decision_criteria__c` | string | salesforceinformation |
| deals | Decision Process retired | `decision_process__c` | string | salesforceinformation |
| deals | Economic Buyer | `economic_buyer__c` | string | salesforceinformation |
| deals | Effective Room Rate | `effective_room_rate` | number | salesforceinformation |
| deals | EHR ARR | `ehr_arr__c` | number | salesforceinformation |
| deals | Emergency Buttons ARR | `emergency_button_options__c` | number | salesforceinformation |
| deals | Emergency Button Rooms | `emergency_button_rooms__c` | number | salesforceinformation |
| deals | Emergency Call Button | `emergency_call_button__c` | number | salesforceinformation |
| deals | Exam Rooms | `exam_rooms__c` | number | salesforceinformation |
| deals | Existing Contracted Rooms | `existing_contracted_rooms__c` | number | salesforceinformation |
| deals | Flowstation | `flowstation__c` | number | salesforceinformation |
| deals | Go Live Date | `go_live_date__c` | date | salesforceinformation |
| deals | Implicate The Pain | `implicate_the_pain__c` | string | salesforceinformation |
| deals | Industry | `industry__c` | enumeration | salesforceinformation |
| deals | Install Date | `install_date__c` | date | salesforceinformation |
| deals | Locator Rooms | `locator_rooms__c` | number | salesforceinformation |
| deals | Lost Reason | `lost_reason__c` | enumeration | salesforceinformation |
| deals | Metrics | `metrics__c` | string | salesforceinformation |
| deals | Notes & Details | `notes_details__c` | string | salesforceinformation |
| deals | One Time Charge | `one_time_charge__c` | number | salesforceinformation |
| deals | One Time Fee | `one_time_fee__c` | number | salesforceinformation |
| deals | AE (Op Owner) Commission % | `opportunity_owner_commission__c` | number | salesforceinformation |
| deals | Paper Process | `paper_process__c` | string | salesforceinformation |
| deals | Partner/BD Rep | `partner_bd_rep__c` | enumeration | salesforceinformation |
| deals | Partner Commission % | `partner_commission__c` | number | salesforceinformation |
| deals | Pro Rated EHR Revenue | `pro_rated_ehr_revenue__c` | number | salesforceinformation |
| deals | Pro Rated First Year Revenue | `pro_rated_first_year_revenue__c` | number | salesforceinformation |
| deals | Pro Rated Nurse Call Options | `pro_rated_nurse_call_options__c` | number | salesforceinformation |
| deals | Room Rate | `room_rate` | number | salesforceinformation |
| deals | Room Rate Discount | `room_rate_discount` | number | salesforceinformation |
| deals | SyncTimes Room Rate | `synctimes_room_rate` | number | salesforceinformation |
| deals | Total First Year Revenue | `total_first_year_revenue` | number | salesforceinformation |
| sites | Site ID | `site_id` | number | sites_information |
| sites | Site Name | `site_name` | string | sites_information |
| hapily_session | Display End Date | `display_end_date` | string | date_time_information |
| hapily_session | Display End Time | `display_end_time` | string | date_time_information |
| hapily_session | Display Start Date | `display_start_date` | string | date_time_information |
| hapily_session | Display Start Time | `display_start_time` | string | date_time_information |
| hapily_session | Timezone (Deprecated) | `timezone` | string | date_time_information |
| hapily_session | Timezone Abbreviation (Deprecated) | `timezone_abbr` | string | date_time_information |
| hapily_session | External ID | `external_id` | string | virtual_session_information |
| hapily_session | External Source | `external_source` | string | virtual_session_information |
| hapily_session | External Status | `external_status` | string | virtual_session_information |
| hapily_session | External Type | `external_type` | enumeration | virtual_session_information |
| hapily_session | Meeting Link | `meeting_link` | string | virtual_session_information |
| hapily_session | Recording Link | `recording_link` | string | virtual_session_information |
| hapily_session | Recording Link Password | `recording_password` | string | virtual_session_information |
| hapily_event | Display End Date | `display_end_date` | string | date_time_information |
| hapily_event | Display End Time | `display_end_time` | string | date_time_information |
| hapily_event | Display Start Date | `display_start_date` | string | date_time_information |
| hapily_event | Display Start Time | `display_start_time` | string | date_time_information |
| hapily_event | Timezone (Deprecated) | `timezone` | string | date_time_information |
| hapily_event | Timezone Abbreviation (Deprecated) | `timezone_abbr` | string | date_time_information |
| hapily_event | Check-In Pin | `pin` | string | event_information |
| hapily_event | Contrast Video ID | `contrast_video_id` | string | hapily_event_information |
| hapily_event | Closed Won Revenue | `closed_won_deal_revenue` | number | metric_information |
| hapily_event | Influenced Pipeline | `influenced_pipeline` | number | metric_information |
| hapily_event | Total Registrations | `registrations` | number | metric_information |
| hapily_event | Total Attendees | `total_attendees` | number | metric_information |
| hapily_event | Total Event Leads | `total_event_leads` | number | metric_information |
| hapily_event | Total No-shows | `total_noshows` | number | metric_information |
| hapily_event | Total Opportunities | `total_opportunities` | number | metric_information |
| hapily_event | External ID | `external_id` | string | virtual_session_information |
| hapily_event | External Source | `external_source` | string | virtual_session_information |
| hapily_event | External Type | `external_type` | enumeration | virtual_session_information |
| hapily_event | Meeting Link | `meeting_link` | string | virtual_session_information |
| hapily_event | Recording Link | `recording_link` | string | virtual_session_information |
| hapily_event | Recording Link Password | `recording_password` | string | virtual_session_information |
| hapily_registrant | Display End Date | `event_display_end_date` | string | event_information |
| hapily_registrant | Display End Time | `event_display_end_time` | string | event_information |
| hapily_registrant | Display Start Date | `event_display_start_date` | string | event_information |
| hapily_registrant | Display Start Time | `event_display_start_time` | string | event_information |
| hapily_registrant | Meeting Link | `meeting_link` | string | event_information |
| hapily_registrant | Live Views | `live_views` | number | hapily_registrant_information |
| hapily_registrant | Replay Views | `replay_views` | number | hapily_registrant_information |
| hapily_registrant | UTM Campaign | `utm_campaign` | string | hapily_registrant_information |
| hapily_registrant | UTM Content | `utm_content` | string | hapily_registrant_information |
| hapily_registrant | UTM Medium | `utm_medium` | string | hapily_registrant_information |
| hapily_registrant | UTM Source | `utm_source` | string | hapily_registrant_information |

**Total Ghost Properties:** 305

---

## Association Map

### Custom Object Associations (from Schema)

#### Site

| From Type ID | To Type ID | Association Name | Cardinality | Inverse Cardinality |
|---|---|---|---|---|
| `2-56022093` | `0-48` | call_to_sites | ONE_TO_MANY | ONE_TO_MANY |
| `0-48` | `2-56022093` | call_to_sites | ONE_TO_MANY | ONE_TO_MANY |
| `2-56022093` | `0-46` | note_to_sites | ONE_TO_MANY | ONE_TO_MANY |
| `0-46` | `2-56022093` | note_to_sites | ONE_TO_MANY | ONE_TO_MANY |
| `2-56022093` | `0-18` | communication_to_sites | ONE_TO_MANY | ONE_TO_MANY |
| `0-18` | `2-56022093` | communication_to_sites | ONE_TO_MANY | ONE_TO_MANY |
| `2-56022093` | `0-116` | postal_mail_to_sites | ONE_TO_MANY | ONE_TO_MANY |
| `0-116` | `2-56022093` | postal_mail_to_sites | ONE_TO_MANY | ONE_TO_MANY |
| `2-56022093` | `0-49` | email_to_sites | ONE_TO_MANY | ONE_TO_MANY |
| `0-49` | `2-56022093` | email_to_sites | ONE_TO_MANY | ONE_TO_MANY |
| `2-56022093` | `0-27` | sites_to_task | ONE_TO_MANY | ONE_TO_MANY |
| `0-27` | `2-56022093` | sites_to_task | ONE_TO_MANY | ONE_TO_MANY |
| `2-56022093` | `0-51` | conversation_session_to_sites | ONE_TO_MANY | ONE_TO_MANY |
| `0-51` | `2-56022093` | conversation_session_to_sites | ONE_TO_MANY | ONE_TO_MANY |
| `2-56022093` | `0-47` | meeting_event_to_sites | ONE_TO_MANY | ONE_TO_MANY |
| `0-47` | `2-56022093` | meeting_event_to_sites | ONE_TO_MANY | ONE_TO_MANY |

#### hapily session

| From Type ID | To Type ID | Association Name | Cardinality | Inverse Cardinality |
|---|---|---|---|---|
| `2-54709569` | `0-27` | hapily_session_to_task | ONE_TO_MANY | ONE_TO_MANY |
| `0-27` | `2-54709569` | hapily_session_to_task | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709569` | `2-54709567` | hapily_session_hapily_registrant_registered | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709567` | `2-54709569` | hapily_session_hapily_registrant_registered | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709569` | `0-46` | hapily_session_to_note | ONE_TO_MANY | ONE_TO_MANY |
| `0-46` | `2-54709569` | hapily_session_to_note | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709569` | `0-48` | call_to_hapily_session | ONE_TO_MANY | ONE_TO_MANY |
| `0-48` | `2-54709569` | call_to_hapily_session | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709569` | `0-116` | hapily_session_to_postal_mail | ONE_TO_MANY | ONE_TO_MANY |
| `0-116` | `2-54709569` | hapily_session_to_postal_mail | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709569` | `0-1` | hapily_session_contact_attended | ONE_TO_MANY | ONE_TO_MANY |
| `0-1` | `2-54709569` | hapily_session_contact_attended | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709569` | `2-54709567` | hapily_session_hapily_registrant_canceled | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709567` | `2-54709569` | hapily_session_hapily_registrant_canceled | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709569` | `2-54709567` | hapily_session_to_hapily_registrant | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709567` | `2-54709569` | hapily_session_to_hapily_registrant | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709569` | `2-54709567` | hapily_session_hapily_registrant_attended | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709567` | `2-54709569` | hapily_session_hapily_registrant_attended | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709569` | `0-1` | hapily_session_contact_pending | ONE_TO_MANY | ONE_TO_MANY |
| `0-1` | `2-54709569` | hapily_session_contact_pending | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709569` | `0-1` | hapily_session_to_contact | ONE_TO_MANY | ONE_TO_MANY |
| `0-1` | `2-54709569` | hapily_session_to_contact | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709569` | `0-47` | hapily_session_to_meeting_event | ONE_TO_MANY | ONE_TO_MANY |
| `0-47` | `2-54709569` | hapily_session_to_meeting_event | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709569` | `0-49` | email_to_hapily_session | ONE_TO_MANY | ONE_TO_MANY |
| `0-49` | `2-54709569` | email_to_hapily_session | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709569` | `0-1` | hapily_session_contact_registered | ONE_TO_MANY | ONE_TO_MANY |
| `0-1` | `2-54709569` | hapily_session_contact_registered | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709569` | `0-1` | hapily_session_contact_waitlist | ONE_TO_MANY | ONE_TO_MANY |
| `0-1` | `2-54709569` | hapily_session_contact_waitlist | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709569` | `0-51` | conversation_session_to_hapily_session | ONE_TO_MANY | ONE_TO_MANY |
| `0-51` | `2-54709569` | conversation_session_to_hapily_session | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709569` | `2-54709567` | hapily_session_hapily_registrant_did_not_attend | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709567` | `2-54709569` | hapily_session_hapily_registrant_did_not_attend | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709569` | `0-18` | communication_to_hapily_session | ONE_TO_MANY | ONE_TO_MANY |
| `0-18` | `2-54709569` | communication_to_hapily_session | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709569` | `0-1` | hapily_session_contact_did_not_attend | ONE_TO_MANY | ONE_TO_MANY |
| `0-1` | `2-54709569` | hapily_session_contact_did_not_attend | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709569` | `0-1` | hapily_session_contact_canceled | ONE_TO_MANY | ONE_TO_MANY |
| `0-1` | `2-54709569` | hapily_session_contact_canceled | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709569` | `2-54709572` | hapily_event_to_hapily_session | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709572` | `2-54709569` | hapily_event_to_hapily_session | ONE_TO_MANY | ONE_TO_MANY |

#### hapily event

| From Type ID | To Type ID | Association Name | Cardinality | Inverse Cardinality |
|---|---|---|---|---|
| `2-54709572` | `0-3` | hapily_event_deal_attribution | ONE_TO_MANY | ONE_TO_MANY |
| `0-3` | `2-54709572` | hapily_event_deal_attribution | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709572` | `0-48` | call_to_hapily_event | ONE_TO_MANY | ONE_TO_MANY |
| `0-48` | `2-54709572` | call_to_hapily_event | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709572` | `0-1` | hapily_event_contact_did_not_attend | ONE_TO_MANY | ONE_TO_MANY |
| `0-1` | `2-54709572` | hapily_event_contact_did_not_attend | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709572` | `0-1` | hapily_event_contact_registered | ONE_TO_MANY | ONE_TO_MANY |
| `0-1` | `2-54709572` | hapily_event_contact_registered | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709572` | `0-49` | email_to_hapily_event | ONE_TO_MANY | ONE_TO_MANY |
| `0-49` | `2-54709572` | email_to_hapily_event | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709572` | `2-54709569` | hapily_event_to_hapily_session | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709569` | `2-54709572` | hapily_event_to_hapily_session | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709572` | `0-3` | hapily_event_to_deal | ONE_TO_MANY | ONE_TO_MANY |
| `0-3` | `2-54709572` | hapily_event_to_deal | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709572` | `2-54709567` | hapily_event_hapily_registrant_registered | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709567` | `2-54709572` | hapily_event_hapily_registrant_registered | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709572` | `0-116` | hapily_event_to_postal_mail | ONE_TO_MANY | ONE_TO_MANY |
| `0-116` | `2-54709572` | hapily_event_to_postal_mail | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709572` | `0-1` | hapily_event_to_contact | ONE_TO_MANY | ONE_TO_MANY |
| `0-1` | `2-54709572` | hapily_event_to_contact | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709572` | `2-54709567` | hapily_event_hapily_registrant_attended | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709567` | `2-54709572` | hapily_event_hapily_registrant_attended | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709572` | `0-51` | conversation_session_to_hapily_event | ONE_TO_MANY | ONE_TO_MANY |
| `0-51` | `2-54709572` | conversation_session_to_hapily_event | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709572` | `0-1` | hapily_event_contact_pending | ONE_TO_MANY | ONE_TO_MANY |
| `0-1` | `2-54709572` | hapily_event_contact_pending | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709572` | `2-54709567` | hapily_event_hapily_registrant_canceled | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709567` | `2-54709572` | hapily_event_hapily_registrant_canceled | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709572` | `0-1` | hapily_event_contact_waitlist | ONE_TO_MANY | ONE_TO_MANY |
| `0-1` | `2-54709572` | hapily_event_contact_waitlist | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709572` | `0-1` | hapily_event_lead | ONE_TO_MANY | ONE_TO_MANY |
| `0-1` | `2-54709572` | hapily_event_lead | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709572` | `0-27` | hapily_event_to_task | ONE_TO_MANY | ONE_TO_MANY |
| `0-27` | `2-54709572` | hapily_event_to_task | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709572` | `2-54709567` | hapily_event_to_hapily_registrant | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709567` | `2-54709572` | hapily_event_to_hapily_registrant | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709572` | `0-2` | hapily_event_to_company | ONE_TO_MANY | ONE_TO_MANY |
| `0-2` | `2-54709572` | hapily_event_to_company | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709572` | `0-18` | communication_to_hapily_event | ONE_TO_MANY | ONE_TO_MANY |
| `0-18` | `2-54709572` | communication_to_hapily_event | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709572` | `0-1` | hapily_event_contact_attended | ONE_TO_MANY | ONE_TO_MANY |
| `0-1` | `2-54709572` | hapily_event_contact_attended | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709572` | `0-46` | hapily_event_to_note | ONE_TO_MANY | ONE_TO_MANY |
| `0-46` | `2-54709572` | hapily_event_to_note | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709572` | `0-1` | hapily_event_contact_canceled | ONE_TO_MANY | ONE_TO_MANY |
| `0-1` | `2-54709572` | hapily_event_contact_canceled | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709572` | `0-47` | hapily_event_to_meeting_event | ONE_TO_MANY | ONE_TO_MANY |
| `0-47` | `2-54709572` | hapily_event_to_meeting_event | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709572` | `2-54709567` | hapily_event_hapily_registrant_did_not_attend | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709567` | `2-54709572` | hapily_event_hapily_registrant_did_not_attend | ONE_TO_MANY | ONE_TO_MANY |

#### hapily registrant

| From Type ID | To Type ID | Association Name | Cardinality | Inverse Cardinality |
|---|---|---|---|---|
| `2-54709567` | `2-54709572` | hapily_event_hapily_registrant_canceled | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709572` | `2-54709567` | hapily_event_hapily_registrant_canceled | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709567` | `0-48` | call_to_hapily_registrant | ONE_TO_MANY | ONE_TO_MANY |
| `0-48` | `2-54709567` | call_to_hapily_registrant | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709567` | `2-54709569` | hapily_session_to_hapily_registrant | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709569` | `2-54709567` | hapily_session_to_hapily_registrant | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709567` | `2-54709572` | hapily_event_hapily_registrant_attended | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709572` | `2-54709567` | hapily_event_hapily_registrant_attended | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709567` | `0-18` | communication_to_hapily_registrant | ONE_TO_MANY | ONE_TO_MANY |
| `0-18` | `2-54709567` | communication_to_hapily_registrant | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709567` | `2-54709569` | hapily_session_hapily_registrant_attended | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709569` | `2-54709567` | hapily_session_hapily_registrant_attended | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709567` | `2-54709569` | hapily_session_hapily_registrant_canceled | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709569` | `2-54709567` | hapily_session_hapily_registrant_canceled | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709567` | `2-54709569` | hapily_session_hapily_registrant_registered | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709569` | `2-54709567` | hapily_session_hapily_registrant_registered | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709567` | `0-46` | hapily_registrant_to_note | ONE_TO_MANY | ONE_TO_MANY |
| `0-46` | `2-54709567` | hapily_registrant_to_note | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709567` | `0-47` | hapily_registrant_to_meeting_event | ONE_TO_MANY | ONE_TO_MANY |
| `0-47` | `2-54709567` | hapily_registrant_to_meeting_event | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709567` | `0-1` | hapily_registrant_to_contact | ONE_TO_MANY | ONE_TO_MANY |
| `0-1` | `2-54709567` | hapily_registrant_to_contact | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709567` | `2-54709572` | hapily_event_hapily_registrant_registered | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709572` | `2-54709567` | hapily_event_hapily_registrant_registered | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709567` | `0-1` | hapily_registrant_contact_registered | ONE_TO_MANY | ONE_TO_MANY |
| `0-1` | `2-54709567` | hapily_registrant_contact_registered | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709567` | `0-116` | hapily_registrant_to_postal_mail | ONE_TO_MANY | ONE_TO_MANY |
| `0-116` | `2-54709567` | hapily_registrant_to_postal_mail | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709567` | `2-54709572` | hapily_event_to_hapily_registrant | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709572` | `2-54709567` | hapily_event_to_hapily_registrant | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709567` | `2-54709569` | hapily_session_hapily_registrant_did_not_attend | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709569` | `2-54709567` | hapily_session_hapily_registrant_did_not_attend | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709567` | `0-49` | email_to_hapily_registrant | ONE_TO_MANY | ONE_TO_MANY |
| `0-49` | `2-54709567` | email_to_hapily_registrant | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709567` | `0-27` | hapily_registrant_to_task | ONE_TO_MANY | ONE_TO_MANY |
| `0-27` | `2-54709567` | hapily_registrant_to_task | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709567` | `0-51` | conversation_session_to_hapily_registrant | ONE_TO_MANY | ONE_TO_MANY |
| `0-51` | `2-54709567` | conversation_session_to_hapily_registrant | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709567` | `2-54709572` | hapily_event_hapily_registrant_did_not_attend | ONE_TO_MANY | ONE_TO_MANY |
| `2-54709572` | `2-54709567` | hapily_event_hapily_registrant_did_not_attend | ONE_TO_MANY | ONE_TO_MANY |

### Standard ↔ Custom Association Labels

| From | To | Label | Category | Type ID |
|---|---|---|---|---|
| contacts | hapily_session | Waitlisted for Session | USER_DEFINED | `102` |
| contacts | hapily_session | Contact Registered for Session | USER_DEFINED | `96` |
| contacts | hapily_session | Contact Did Not Attend Session | USER_DEFINED | `94` |
| contacts | hapily_session | Unlabeled | USER_DEFINED | `79` |
| contacts | hapily_session | Contact Canceled Session | USER_DEFINED | `98` |
| contacts | hapily_session | Pending Registration | USER_DEFINED | `100` |
| contacts | hapily_session | Contact Attended Session | USER_DEFINED | `92` |
| contacts | hapily_event | Contact Did Not Attend Event | USER_DEFINED | `114` |
| contacts | hapily_event | Pending Registration | USER_DEFINED | `122` |
| contacts | hapily_event | Contact Attended Event | USER_DEFINED | `117` |
| contacts | hapily_event | Waitlisted for Event | USER_DEFINED | `124` |
| contacts | hapily_event | Event Lead | USER_DEFINED | `120` |
| contacts | hapily_event | Unlabeled | USER_DEFINED | `83` |
| contacts | hapily_event | Contact Canceled Registration | USER_DEFINED | `118` |
| contacts | hapily_event | Contact Registered for Event | USER_DEFINED | `116` |
| companies | hapily_event | Unlabeled | USER_DEFINED | `89` |
| deals | hapily_event | Attributed Deal | USER_DEFINED | `134` |
| deals | hapily_event | Unlabeled | USER_DEFINED | `85` |
| contacts | hapily_registrant | Event Registration | USER_DEFINED | `90` |
| contacts | hapily_registrant | Unlabeled | USER_DEFINED | `75` |

