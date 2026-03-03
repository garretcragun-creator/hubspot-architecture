#!/usr/bin/env python3
"""Convert the Touchpoint Architecture plan to a clean PDF."""

import re
from fpdf import FPDF

class PlanPDF(FPDF):
    def __init__(self):
        super().__init__()
        self.set_auto_page_break(auto=True, margin=20)

    def header(self):
        if self.page_no() > 1:
            self.set_font("Helvetica", "I", 8)
            self.set_text_color(120, 120, 120)
            self.cell(0, 8, "Touchpoint Architecture -- Full Build Plan", align="R")
            self.ln(4)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", align="C")

    def section_title(self, text):
        self.set_font("Helvetica", "B", 14)
        self.set_text_color(30, 60, 110)
        self.ln(4)
        self.multi_cell(0, 7, text)
        self.ln(2)

    def sub_section_title(self, text):
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(50, 80, 130)
        self.ln(2)
        self.multi_cell(0, 6, text)
        self.ln(1)

    def body_text(self, text):
        self.set_font("Helvetica", "", 9.5)
        self.set_text_color(30, 30, 30)
        self.multi_cell(0, 5.2, text)
        self.ln(1)

    def bold_text(self, text):
        self.set_font("Helvetica", "B", 9.5)
        self.set_text_color(30, 30, 30)
        self.multi_cell(0, 5.2, text)
        self.ln(1)

    def bullet(self, text, indent=10):
        self.set_font("Helvetica", "", 9.5)
        self.set_text_color(30, 30, 30)
        x_start = self.get_x()
        self.cell(indent, 5.2, "  -")
        # Save position after bullet marker
        x_text = self.get_x()
        y_text = self.get_y()
        # Use multi_cell with reduced width for text wrap
        avail_w = self.w - self.r_margin - x_text
        self.multi_cell(avail_w, 5.2, "  " + text)
        # Reset x to left margin for next element
        self.set_x(self.l_margin)

    def code_block(self, text):
        self.set_font("Courier", "", 8)
        self.set_text_color(40, 40, 40)
        self.set_fill_color(245, 245, 245)
        for line in text.split("\n"):
            self.cell(0, 4.5, "  " + line, fill=True, new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def table_header(self, cols, widths):
        self.set_font("Helvetica", "B", 7.5)
        self.set_fill_color(40, 70, 120)
        self.set_text_color(255, 255, 255)
        for i, col in enumerate(cols):
            self.cell(widths[i], 6, col, border=1, fill=True, align="C")
        self.ln()

    def table_row(self, cols, widths, fill=False):
        self.set_font("Helvetica", "", 7)
        self.set_text_color(30, 30, 30)
        if fill:
            self.set_fill_color(240, 245, 250)
        else:
            self.set_fill_color(255, 255, 255)
        max_lines = 1
        col_texts = []
        for i, col in enumerate(cols):
            # Calculate how many lines this cell needs
            w = widths[i] - 2
            if w <= 0:
                w = 10
            self.set_font("Helvetica", "", 7)
            lines = self.multi_cell(w, 4, col, split_only=True)
            col_texts.append(lines)
            if len(lines) > max_lines:
                max_lines = len(lines)

        row_h = max_lines * 4
        # Check page break
        if self.get_y() + row_h > self.h - 20:
            self.add_page()

        y_start = self.get_y()
        for i, lines in enumerate(col_texts):
            x = self.get_x() if i == 0 else sum(widths[:i]) + self.l_margin
            self.set_xy(x, y_start)
            self.cell(widths[i], row_h, "", border=1, fill=fill)
            for j, line in enumerate(lines):
                self.set_xy(x + 1, y_start + j * 4)
                self.cell(widths[i] - 2, 4, line)
        self.set_xy(self.l_margin, y_start + row_h)

    def hr(self):
        self.ln(3)
        y = self.get_y()
        self.set_draw_color(180, 180, 180)
        self.line(self.l_margin, y, self.w - self.r_margin, y)
        self.ln(3)


def build_pdf():
    pdf = PlanPDF()
    pdf.alias_nb_pages()
    pdf.set_left_margin(15)
    pdf.set_right_margin(15)
    pdf.add_page()

    # ── TITLE PAGE ──
    pdf.ln(30)
    pdf.set_font("Helvetica", "B", 28)
    pdf.set_text_color(30, 60, 110)
    pdf.multi_cell(0, 12, "Touchpoint Architecture\nFull Build Plan", align="C")
    pdf.ln(10)
    pdf.set_font("Helvetica", "", 12)
    pdf.set_text_color(80, 80, 80)
    pdf.cell(0, 8, "HubSpot Custom Object Architecture for Multi-Touch Attribution", align="C")
    pdf.ln(20)
    pdf.set_font("Helvetica", "I", 10)
    pdf.set_text_color(120, 120, 120)
    pdf.cell(0, 6, "February 2026", align="C")
    pdf.ln(6)
    pdf.cell(0, 6, "Prepared for: Garret", align="C")
    pdf.ln(40)

    # Overview box
    pdf.set_fill_color(240, 245, 250)
    pdf.set_draw_color(40, 70, 120)
    y = pdf.get_y()
    pdf.rect(15, y, 180, 28, style="DF")
    pdf.set_xy(20, y + 4)
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(30, 60, 110)
    pdf.cell(0, 6, "Overview")
    pdf.set_xy(20, y + 11)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(30, 30, 30)
    pdf.multi_cell(170, 5, (
        "Comprehensive architecture for the Touchpoint custom object covering associations "
        "with all HubSpot objects (Contact, Company, Deal, Lead, Campaign, Meeting, Hapily, "
        "Activities), property design, workflows, calculated properties, reporting schema, "
        "and data flow -- all evaluated through a lean/TIMWOODS lens."
    ))

    # ── SECTION 1: Object Relationship Map ──
    pdf.add_page()
    pdf.section_title("1. Object Relationship Map")

    pdf.body_text(
        "The Touchpoint custom object has 4 direct associations and 5 bridged relationships "
        "through the Contact record."
    )

    pdf.bold_text("Direct Associations (4):")
    for item in [
        "Touchpoint to Contact (Many-to-One): many Touchpoints per Contact",
        "Touchpoint to Company (Many-to-One): from Contact's primary company",
        "Touchpoint to Deal (Many-to-Many): all pre-deal Touchpoints associated at deal creation",
        "Touchpoint to HubSpot Campaign (Many-to-One): one Campaign per Touchpoint, if applicable"
    ]:
        pdf.bullet(item)
    pdf.ln(2)

    pdf.bold_text("Bridged via Contact (5):")
    for item in [
        "Lead: reads from Contact; no direct Touchpoint association needed",
        "Meeting: conversions, not sources; meeting_source already mapped from Contact",
        "Hapily Event: event name stored in Touchpoint medium field; Contact bridges both",
        "Hapily Registrant / Session: bridged via Contact",
        "Activities (Calls, Emails, Tasks): engagement records, not attribution sources"
    ]:
        pdf.bullet(item)
    pdf.ln(2)

    pdf.body_text(
        "This avoids association sprawl (TIMWOODS: Overproduction). "
        "The Contact record is the universal bridge -- no redundant cross-associations."
    )

    pdf.hr()

    # ── SECTION 2: Data Flow Direction ──
    pdf.section_title("2. Data Flow Direction")
    pdf.bold_text("Rule: Data flows DOWN only. Touchpoint is the source of truth.")
    pdf.ln(2)

    pdf.bold_text("Layer 1: Signals (what triggers a Touchpoint)")
    for item in [
        "Web visit / form submit",
        "Hapily event stamp (conference, webinar)",
        "Sequence enrollment",
        "Referral set by rep",
        "Bulk import"
    ]:
        pdf.bullet(item)
    pdf.ln(2)

    pdf.bold_text("Layer 2: Touchpoint Created (workflow creates the record)")
    for item in [
        "WF1: Web Source to Touchpoint (custom code classifier + dedup)",
        "WF2: Event to Touchpoint (triggered by latest_hapily_event_name change)",
        "WF3: Sequence to Touchpoint (triggered by sequence enrollment)",
        "WF4: Referral to Touchpoint (triggered by referral_type change)"
    ]:
        pdf.bullet(item)
    pdf.ln(2)

    pdf.bold_text("Layer 3: Sync Down (Touchpoint data flows to other objects)")
    for item in [
        "WF5: Touchpoint to Contact Sync (timestamp guard, copy props, set first_touchpoint_source)",
        "WF5 also associates Touchpoint with Company and Campaign",
        "WF5 also associates Touchpoint with Contact's open Deals (real-time Deal timeline)",
        "Contact stat_latest_source feeds Meeting meeting_source via existing workflow",
        "Lead reads from Contact (no additional workflow needed)"
    ]:
        pdf.bullet(item)
    pdf.ln(2)

    pdf.bold_text("Layer 4: Deal Attribution")
    for item in [
        "WF6: Deal Created --> backfill all existing Contact Touchpoints to the Deal",
        "WF6b: Deal enters Discovery stage --> safety net re-association",
        "Rep views Touchpoint timeline on Deal card",
        "Rep selects primary_driver dropdown at close"
    ]:
        pdf.bullet(item)
    pdf.ln(2)

    pdf.body_text(
        "Contact/Company/Deal properties are summaries only. Never write back up to the "
        "Touchpoint from a downstream object."
    )

    pdf.hr()

    # ── SECTION 3: Object-by-Object Interaction ──
    pdf.add_page()
    pdf.section_title("3. Object-by-Object Interaction")

    interactions = [
        ("3a. Touchpoint to Contact",
         [
             "Association: Many-to-One (many Touchpoints per Contact)",
             "Set by: Every Touchpoint creator workflow (WF1-4) at record creation",
             "No association labels needed. First touch = Touchpoint with min touchpoint_date. "
             "Last touch = Touchpoint with max touchpoint_date. Queried by date, not by label.",
             "Sync direction: Touchpoint --> Contact (WF5 copies source/medium/category to Contact summary fields)"
         ]),
        ("3b. Touchpoint to Company",
         [
             "Association: Many-to-One (from Contact's primary company)",
             "Set by: WF5 (Touchpoint to Contact Sync) -- step 9 in the existing plan",
             "No additional Company properties set from Touchpoint. Company already mirrors "
             "Contact's stat_latest_source via existing workflows.",
             "Rollup: company_touchpoint_count replaces any manual Company attribution",
             "Hardening Rule 6: if a Contact changes companies, old Touchpoints stay with the original company"
         ]),
        ("3c. Touchpoint to Deal",
         [
             "Association: Many-to-Many",
             "Set by three paths (belt-and-suspenders):",
             "  (1) WF5 (real-time): new Touchpoint checks if Contact has open Deals; if yes, "
             "associates immediately. Reps see a live, always-current timeline.",
             "  (2) WF6 (backfill at Deal creation): when a Deal is created, all existing Contact "
             "Touchpoints are associated with it. Covers pre-deal history.",
             "  (3) WF6b (safety net at Discovery): re-runs association to catch edge cases "
             "(integration-created Deals, workflow execution errors).",
             "Rep views Touchpoint timeline on Deal card, selects primary_driver dropdown at close",
             "No association labels. Pre-deal vs post-deal determined by comparing touchpoint_date to deal.createdate in reports"
         ]),
        ("3d. Touchpoint to HubSpot Campaign",
         [
             "Association: Many-to-One (one Campaign per Touchpoint, if applicable)",
             "Set by: WF1 and WF2 (the workflows that have campaign context)",
             "Mechanism: WF1 waits 5 minutes (delay action) then reads Contact's "
             "hs_analytics_last_touch_converting_campaign. The delay accounts for HubSpot's "
             "analytics processing lag.",
             "Belt-and-suspenders for forms: pass HubSpot Campaign ID as a hidden form field. "
             "WF1 checks the hidden field first; falls back to the analytics property.",
             "When no Campaign applies (sequence, referral, some events): campaign_id stores a "
             "descriptive string and no Campaign association is created.",
             "Value: Campaign records show all associated Touchpoints. Reports can group Touchpoints by Campaign for ROI."
         ]),
        ("3e. Touchpoint to Lead (NO direct association)",
         [
             "Lead tracks sales pipeline progression, not attribution",
             "The Contact bridges: Lead reads stat_latest_source from the Contact",
             "Lead's internal_lead_source captures the Contact's source at lead creation time",
             "No changes needed. The existing contact_attribution_changed timestamp on the Lead fires when WF5 updates the Contact."
         ]),
        ("3f. Touchpoint to Meeting (NO direct association)",
         [
             "Meetings are conversions, not sources. A meeting does not create a Touchpoint.",
             "Exception: When a contact is CREATED because of a meeting, WF1 classifies this as Meeting Attendee.",
             "meeting_source continues to be set by existing Map Lead Source To Meeting Source workflow (103049203)",
             "To find which touchpoint drove a meeting: query Contact's Touchpoints where touchpoint_date <= meeting start time"
         ]),
        ("3g. Touchpoint to Hapily Objects (NO direct association)",
         [
             "WF2 creates a Touchpoint when a Contact is associated with a Hapily Event",
             "Touchpoint's medium stores the event name. campaign_id stores the event date.",
             "Skip Touchpoint to Hapily Event association: Contact already bridges both. "
             "Adding a formal association duplicates the path for zero reporting gain."
         ]),
        ("3h. Touchpoint to Activities (NO direct association)",
         [
             "Calls, emails, tasks, and notes are engagement records, not attribution sources",
             "Sequence enrollment creates a single Touchpoint (WF3). Individual emails/tasks do not create additional Touchpoints.",
             "Activities are readable from the Contact/Deal timeline alongside Touchpoints."
         ]),
    ]

    for title, bullets in interactions:
        pdf.sub_section_title(title)
        for b in bullets:
            pdf.bullet(b)
        pdf.ln(2)

    pdf.hr()

    # ── SECTION 4: Forms and Site Visits ──
    pdf.add_page()
    pdf.section_title("4. How Forms and Site Visits Feed the System")

    pdf.sub_section_title("Forms")
    for b in [
        "A form submission causes HubSpot to update hs_latest_source on the Contact",
        "WF1 triggers on hs_latest_source change --> creates Touchpoint",
        "WF1 reads recent_conversion_event_name (the form name) and stores it in the Touchpoint's offer field",
        "WF1 classifies the form's content into offer_type (Demo, Webinar, Case Study, etc.)",
        "UTM parameters on the form visit feed into source, medium, category, campaign_id",
        "Key: the form itself does not create the Touchpoint -- the source change does. "
        "This prevents double-counting when a form visit and a page visit happen in the same session."
    ]:
        pdf.bullet(b)
    pdf.ln(2)

    pdf.sub_section_title("Site Visits (no form)")
    for b in [
        "A new traffic source session causes HubSpot to update hs_latest_source",
        "WF1 triggers, creates Touchpoint with source/medium/category from the session data",
        "offer and offer_type remain blank (no content conversion happened)",
        "The visit still counts as a Touchpoint because it represents a marketing interaction"
    ]:
        pdf.bullet(b)
    pdf.ln(2)

    pdf.sub_section_title("Deduplication")
    pdf.body_text(
        "WF1 checks: does a Touchpoint with the same source + medium already exist for this "
        "Contact within the last 24 hours? If yes, skip. This prevents rapid-fire session "
        "changes from creating duplicate records."
    )

    pdf.hr()

    # ── SECTION 5: Customer vs Non-Customer ──
    pdf.section_title("5. Customer vs. Non-Customer Monitoring")
    for b in [
        "Touchpoints are created for ALL contacts regardless of lifecycle stage. "
        "This covers new business, expansion, and retention attribution.",
        "Filtering in reports: use the Contact's lifecyclestage as a report dimension/filter.",
        "New Business Touchpoints = filter Contact lifecyclestage != customer",
        "Customer Re-engagement Touchpoints = filter Contact lifecyclestage = customer",
        "Expansion Sources = Touchpoints on Deals in the Expansion pipeline where Contact lifecyclestage = customer",
        "The existing Customer Lifecycle Stage workflow (ID 68062591) already manages lifecycle stage transitions. No changes needed.",
        "TIMWOODS: Adding an is_customer flag to the Touchpoint would be inventory waste -- "
        "it duplicates data on the Contact and could drift out of sync."
    ]:
        pdf.bullet(b)

    pdf.hr()

    # ── SECTION 6: Properties Architecture ──
    pdf.add_page()
    pdf.section_title("6. Properties Architecture")

    # 6a: Touchpoint Object
    pdf.sub_section_title("6a. Touchpoint Object (9 properties)")
    cols = ["Property", "Internal Name", "Type", "Required", "Source"]
    widths = [28, 28, 16, 14, 94]
    pdf.table_header(cols, widths)
    rows = [
        ["Name", "name", "string", "Yes", "Auto: {source} - {medium} -- {YYYY-MM-DD}"],
        ["Touchpoint Date", "touchpoint_date", "datetime", "Yes", "When the interaction happened"],
        ["Source", "source", "enum (24)", "Yes", "Classified from signal data"],
        ["Category", "category", "enum (7)", "Yes", "Deterministic from source (locked pair)"],
        ["Medium", "medium", "string", "No", "Platform/channel detail"],
        ["Campaign ID", "campaign_id", "string", "No", "UTM campaign, event date, sequence name"],
        ["Offer", "offer", "string", "No", "Content asset (form name, webinar title)"],
        ["Offer Type", "offer_type", "enum", "No", "Demo, Case Study, Webinar, Article, etc."],
        ["Trigger Type", "trigger_type", "enum (5)", "Yes", "web_source, event, sequence, referral, import"],
    ]
    for i, row in enumerate(rows):
        pdf.table_row(row, widths, fill=(i % 2 == 0))
    pdf.ln(4)

    # 6b: Contact Properties
    pdf.sub_section_title("6b. New Properties on Contact (5 + first_touchpoint_source)")
    cols = ["Property", "Internal Name", "Type", "Purpose"]
    widths = [36, 40, 16, 88]
    pdf.table_header(cols, widths)
    rows = [
        ["Referral Type", "referral_type", "enum", "Customer, Employee, Partner, Affiliate"],
        ["Referral Name", "referral_name", "string", "Name of the referrer"],
        ["Latest Hapily Event Name", "latest_hapily_event_name", "string", "Set by Event workflow"],
        ["Latest Hapily Event Type", "latest_hapily_event_type", "enum", "Conference, Webinar"],
        ["Latest Touchpoint Date", "latest_touchpoint_date", "datetime", "Timestamp guard for sync"],
    ]
    for i, row in enumerate(rows):
        pdf.table_row(row, widths, fill=(i % 2 == 0))
    pdf.ln(4)

    # 6c: Deal Properties
    pdf.sub_section_title("6c. New Properties on Deal")
    cols = ["Property", "Internal Name", "Type", "Purpose"]
    widths = [30, 30, 18, 102]
    pdf.table_header(cols, widths)
    pdf.table_row(
        ["Primary Driver", "primary_driver", "enum (24)", "Rep selects the source that was the primary driver at close"],
        widths, fill=True
    )
    pdf.ln(4)

    # 6d: Rollup Properties
    pdf.sub_section_title("6d. Rollup Properties")

    pdf.bold_text("On Contact:")
    cols = ["Property", "Config", "Purpose"]
    widths = [50, 60, 70]
    pdf.table_header(cols, widths)
    rows = [
        ["touchpoint_count", "Count of associated Touchpoints", "Volume metric for scoring/reporting"],
        ["first_touchpoint_date", "Min of touchpoint_date", "First touch timestamp"],
        ["first_touchpoint_source", "Set by WF5 on first run", "First touch source for reporting"],
    ]
    for i, row in enumerate(rows):
        pdf.table_row(row, widths, fill=(i % 2 == 0))
    pdf.ln(3)

    pdf.bold_text("On Company:")
    cols = ["Property", "Config", "Purpose"]
    widths = [55, 60, 65]
    pdf.table_header(cols, widths)
    pdf.table_row(
        ["company_touchpoint_count", "Count of associated Touchpoints", "Account-level volume metric"],
        widths, fill=True
    )
    pdf.ln(3)

    pdf.bold_text("On Deal:")
    cols = ["Property", "Config", "Purpose"]
    widths = [55, 65, 60]
    pdf.table_header(cols, widths)
    rows = [
        ["deal_touchpoint_count", "Count of associated Touchpoints", "Multi-touch journey length"],
        ["deal_sales_touchpoint_count", "Count WHERE category = Sales", "Sales touches to close metric"],
    ]
    for i, row in enumerate(rows):
        pdf.table_row(row, widths, fill=(i % 2 == 0))
    pdf.ln(4)

    # 6e: Calculated Properties
    pdf.sub_section_title("6e. Calculated Properties")

    pdf.bold_text("On Contact:")
    pdf.bullet("first_touchpoint_source: WF5 sets on first run only (if unknown, set it; otherwise skip)")
    pdf.ln(2)

    pdf.bold_text("On Deal:")
    pdf.bullet("days_first_touch_to_deal: Time Between Contact first_touchpoint_date to Deal createdate. Measures journey to opportunity creation.")
    pdf.bullet("days_first_touch_to_close: Time Between Contact first_touchpoint_date to Deal closedate. Measures full cycle to close. Enables velocity-by-source and payback period.")
    pdf.ln(2)

    pdf.bold_text("On Meeting (already created):")
    pdf.bullet("meeting_held: Boolean. Returns true if hs_meeting_outcome contains COMPLETED; false if contains CANCELED, RESCHEDULED, or NO_SHOW; blank for SCHEDULED.")
    pdf.body_text(
        "Formula: if(contains([properties.hs_meeting_outcome], \"COMPLETED\"), true, "
        "if(contains([properties.hs_meeting_outcome], \"CANCELED\") || "
        "contains([properties.hs_meeting_outcome], \"RESCHEDULED\") || "
        "contains([properties.hs_meeting_outcome], \"NO_SHOW\"), false))"
    )

    pdf.hr()

    # ── SECTION 7: Workflows ──
    pdf.add_page()
    pdf.section_title("7. Workflows (7 total)")

    pdf.sub_section_title("Touchpoint Creators (4)")
    cols = ["#", "Name", "Trigger", "Creates Touchpoint From"]
    widths = [10, 42, 52, 76]
    pdf.table_header(cols, widths)
    rows = [
        ["WF1", "Web Source to Touchpoint", "hs_latest_source changes", "Web visits, forms, imports, paid clicks, organic"],
        ["WF2", "Event to Touchpoint", "latest_hapily_event_name changes", "Hapily event association (conferences, webinars)"],
        ["WF3", "Sequence to Touchpoint", "hs_sequences_is_enrolled = true", "Sequence enrollment"],
        ["WF4", "Referral to Touchpoint", "referral_type changes", "Rep-reported referrals"],
    ]
    for i, row in enumerate(rows):
        pdf.table_row(row, widths, fill=(i % 2 == 0))
    pdf.ln(2)

    pdf.bold_text("WF1 Campaign Hardening:")
    pdf.body_text(
        "WF1 includes a 5-minute delay before reading hs_analytics_last_touch_converting_campaign "
        "to account for HubSpot's analytics processing lag. For form submissions, WF1 checks for a "
        "hidden Campaign ID field first (raw signal), then falls back to the analytics property."
    )
    pdf.ln(2)

    pdf.sub_section_title("Sync and Association (3)")
    cols = ["#", "Name", "Trigger", "Actions"]
    widths = [12, 42, 38, 88]
    pdf.table_header(cols, widths)
    rows = [
        ["WF5", "Touchpoint to Contact Sync", "Touchpoint created",
         "Timestamp guard, copy props, set first_touchpoint_source, assoc Company, assoc Campaign, assoc open Deals"],
        ["WF6", "Deal to Touchpoint Assoc", "Deal created",
         "Backfill: find all existing Touchpoints on Contact, associate them with the new Deal"],
        ["WF6b", "Deal Disco Refresh", "Deal enters Discovery",
         "Safety net: re-run association for edge cases (integration Deals, execution errors)"],
    ]
    for i, row in enumerate(rows):
        pdf.table_row(row, widths, fill=(i % 2 == 0))
    pdf.ln(4)

    pdf.sub_section_title("Existing Workflows (keep as-is)")
    for b in [
        "Map Lead Source To Meeting Source (103049203): copies Contact stat_latest_source to Meeting meeting_source",
        "event-hapily Event Lead Capture (98650285): handles Hapily lead creation and associations",
        "Contact Associated With Hapily Event to Set Attribution (100489130): sets latest_hapily_event_name which triggers WF2"
    ]:
        pdf.bullet(b)
    pdf.ln(3)

    pdf.sub_section_title("Workflows to Retire (Phase 3)")
    cols = ["Workflow", "Replaced By"]
    widths = [90, 90]
    pdf.table_header(cols, widths)
    rows = [
        ["Attribution Operator (89829703)", "WF1 (Web Source to Touchpoint)"],
        ["First Touch Runner (89896028)", "WF5 sets first_touchpoint_source on first run"],
        ["Last Touch Runner (89900017)", "WF5 sets stat_latest_source on every sync"],
        ["Source History Sync / Bridge (pending)", "Touchpoint to Company assoc in WF5"],
        ["Event Mobly Owner (68127276)", "Dead -- deactivate"],
        ["Event Mobly Event and Source (68831454)", "Dead -- deactivate"],
        ["Event Mobly Email Override (68134693)", "Dead -- deactivate"],
    ]
    for i, row in enumerate(rows):
        pdf.table_row(row, widths, fill=(i % 2 == 0))

    pdf.hr()

    # ── SECTION 8: Reporting Architecture ──
    pdf.add_page()
    pdf.section_title("8. Reporting Architecture")

    pdf.sub_section_title("Tier 1: Source ROI")
    cols = ["Report", "Dimensions", "Measures"]
    widths = [50, 60, 70]
    pdf.table_header(cols, widths)
    rows = [
        ["Pipeline by Source", "Touchpoint source, category", "Sum of Deal amount"],
        ["Revenue by Source", "Touchpoint source", "Sum of closed-won Deal amount"],
        ["Revenue by Campaign", "Campaign name", "Sum of closed-won Deal amount"],
        ["Cost per Touchpoint", "source, category", "Count of Touchpoints (pair with ad spend)"],
    ]
    for i, row in enumerate(rows):
        pdf.table_row(row, widths, fill=(i % 2 == 0))
    pdf.ln(4)

    pdf.sub_section_title("Tier 2: Multi-Touch Journey")
    cols = ["Report", "Dimensions", "Measures"]
    widths = [52, 58, 70]
    pdf.table_header(cols, widths)
    rows = [
        ["Avg Touchpoints per Deal", "Pipeline, rep", "Avg of deal_touchpoint_count"],
        ["Journey to Opp (days)", "Source category", "Avg of days_first_touch_to_deal"],
        ["Journey to Close (days)", "Source category", "Avg of days_first_touch_to_close"],
        ["Sales Touches to Close", "Rep, source category", "Avg of deal_sales_touchpoint_count"],
        ["First Touch vs Primary Driver", "first_touchpoint_source vs primary_driver", "Count of Deals"],
    ]
    for i, row in enumerate(rows):
        pdf.table_row(row, widths, fill=(i % 2 == 0))
    pdf.ln(4)

    pdf.sub_section_title("Tier 3: Conversion Rates by Source (Full Funnel)")
    cols = ["Funnel Stage", "How"]
    widths = [50, 130]
    pdf.table_header(cols, widths)
    rows = [
        ["Touchpoint Created", "Count of Touchpoints grouped by source"],
        ["Meeting Set", "Meeting count with meeting_source (existing property)"],
        ["Meeting Held", "Meeting count with meeting_held = true (new calculated property)"],
        ["Opportunity Created", "Touchpoints associated with Deals, grouped by source"],
        ["Closed Won", "Same, filtered by dealstage = Closed Won"],
        ["Meeting Held Rate", "Formula: if(meeting_held == true, 1, 0) with AVG aggregation"],
        ["Disco-to-Opp Rate", "Lead pipeline: last_meeting_held_date known to has_deal_associated = true"],
    ]
    for i, row in enumerate(rows):
        pdf.table_row(row, widths, fill=(i % 2 == 0))
    pdf.ln(4)

    pdf.sub_section_title("Tier 4: Customer vs. New Business")
    cols = ["Report", "Filter", "Purpose"]
    widths = [50, 70, 60]
    pdf.table_header(cols, widths)
    rows = [
        ["New Business Sources", "lifecyclestage != Customer", "What drives net-new pipeline"],
        ["Customer Re-engagement", "lifecyclestage = Customer", "What brings customers back"],
        ["Expansion Sources", "Expansion pipeline + Touchpoints", "What drives upsell/cross-sell"],
    ]
    for i, row in enumerate(rows):
        pdf.table_row(row, widths, fill=(i % 2 == 0))
    pdf.ln(4)

    # Property Architecture Summary
    pdf.sub_section_title("Property Architecture Summary")
    pdf.code_block(
        "TOUCHPOINT RECORD (source of truth):\n"
        "  source -----> groups all funnel reports by source\n"
        "  category ---> groups by category (Paid Digital, Field & Events, etc.)\n"
        "  medium -----> drills into platform (Google, LinkedIn, NAC, etc.)\n"
        "  campaign_id -> groups by campaign\n"
        "  offer ------> groups by content asset\n"
        "  offer_type --> groups by content type\n"
        "  trigger_type -> groups by signal origin\n"
        "  touchpoint_date -> time-series trending\n"
        "\n"
        "CONTACT (summary):\n"
        "  stat_latest_source ---------> current snapshot for Lead/Meeting mapping\n"
        "  first_touchpoint_source ----> first-touch attribution column\n"
        "  touchpoint_count -----------> engagement volume metric\n"
        "  first_touchpoint_date ------> journey start timestamp\n"
        "  latest_touchpoint_date -----> recency metric\n"
        "  lifecyclestage -------------> customer vs non-customer filter\n"
        "\n"
        "DEAL (attribution):\n"
        "  deal_touchpoint_count ----------> multi-touch depth metric\n"
        "  deal_sales_touchpoint_count ---> sales touches to close metric\n"
        "  primary_driver -----------------> rep-selected attribution at close\n"
        "  days_first_touch_to_deal ------> opportunity velocity metric\n"
        "  days_first_touch_to_close -----> full-cycle velocity metric\n"
        "\n"
        "MEETING (conversion):\n"
        "  meeting_source -------------> source at time of meeting\n"
        "  meeting_held ---------------> held/not-held boolean for rate calcs\n"
        "\n"
        "COMPANY (account-level):\n"
        "  company_touchpoint_count ---> account engagement volume\n"
        "  stat_latest_source ---------> account-level source snapshot"
    )

    pdf.hr()

    # ── SECTION 9: medium vs offer ──
    pdf.add_page()
    pdf.section_title("9. Field Usage: medium vs. offer Clarification")
    pdf.body_text(
        "The medium and offer fields serve different purposes. This distinction is critical "
        "for event and webinar comparison reports."
    )

    pdf.bold_text("medium = the platform, channel, or organization name. The \"where.\"")
    for b in [
        "Paid Digital: Google, LinkedIn, Facebook, Programmatic",
        "Field & Events: NAC, MGMA, AGMA (conference org), or Client Summit (event name)",
        "Sales: Artisan, Sequence, One-Off, re-activation",
        "Partner: Customer Referral, Employee Referral, Partner Referral"
    ]:
        pdf.bullet(b)
    pdf.ln(2)

    pdf.bold_text("offer = the specific content asset or experience. The \"what.\"")
    for b in [
        "Webinar title (e.g., Start with Stat: Annual Report Deep Dive)",
        "Form name (e.g., Demo Request, Clinical Ops Benchmark Report)",
        "Session name at a conference",
        "Leave blank when no specific content asset applies"
    ]:
        pdf.bullet(b)
    pdf.ln(2)

    pdf.bold_text("offer_type = the content category")
    pdf.body_text("Demo, Webinar, Case Study, Article, Calculator, Event, Learn More")
    pdf.ln(2)

    pdf.bold_text("Example: Sponsored Webinar at MGMA")
    for b in [
        "source = Sponsored Webinar",
        "category = Field & Events",
        "medium = MGMA",
        "offer = MGMA Start with Stat Webinar",
        "offer_type = Webinar",
        "campaign_id = 06.2025"
    ]:
        pdf.bullet(b)
    pdf.ln(2)
    pdf.body_text(
        "This lets you compare: all MGMA touchpoints (filter by medium), "
        "all webinars (filter by offer_type), or this specific webinar (filter by offer)."
    )

    pdf.hr()

    # ── SECTION 10: Stress-Tested Reports ──
    pdf.section_title("10. Stress-Tested Reports (11 Scenarios Validated)")

    stress_tests = [
        ("1. Meetings set by deal source by month",
         "Data: Deals + Meetings | Dims: Deal stat_latest_source, Meeting date by month | "
         "Measures: Count of Meetings | Gaps: None"),
        ("2. Win rate by source",
         "Data: Deals | Dims: stat_latest_source or primary_driver | "
         "Measures: Formula if(dealstage == closedwon, 1, 0) AVG | Gaps: None"),
        ("3. Deal velocity by source",
         "Data: Deals (Closed Won) | Dims: stat_latest_source | "
         "Measures: Avg of days_first_touch_to_close | Gaps: Fixed (new property)"),
        ("4. ROI per conference / sponsor",
         "Data: Hapily Events + Touchpoints + Deals | Dims: Touchpoint medium, Hapily Event name | "
         "Measures: (closed_won_deal_revenue - cost) / cost | Gaps: None"),
        ("5. Prospecting outreach effectiveness",
         "Data: Touchpoints + Deals | Dims: medium WHERE source = Prospecting | "
         "Measures: Count TPs, Meetings, Deals, Revenue | Gaps: None"),
        ("6. Sales touchpoints to close",
         "Data: Deals (Closed Won) | Dims: Rep, pipeline | "
         "Measures: Avg of deal_sales_touchpoint_count | Gaps: Fixed (new filtered rollup)"),
        ("7. Pages impacting meeting conversion",
         "Use HubSpot native Traffic Analytics (not a Touchpoint question) | Gaps: N/A"),
        ("8. Webinar performance comparison",
         "Data: Touchpoints + Deals | Dims: offer WHERE offer_type = Webinar | "
         "Measures: Count TPs, Deals, Revenue | Gaps: None"),
        ("9. Ad platform comparison",
         "Data: Touchpoints + Deals | Dims: medium WHERE category = Paid Digital | "
         "Measures: Count TPs, Meetings, Deals, Revenue | Gaps: None"),
        ("10. Event ROI",
         "Data: Hapily Events | Dims: Event name | "
         "Measures: (closed_won_deal_revenue - cost) / cost | Gaps: None"),
        ("11. Ad campaign ROI",
         "Data: Touchpoints + Campaigns + Deals | Dims: Campaign name or campaign_id | "
         "Measures: Revenue from TPs on Deals; cost from Campaign budget or Ads tool | "
         "Gaps: Cost depends on where ad spend lives"),
    ]

    for title, detail in stress_tests:
        pdf.bold_text(title)
        pdf.body_text(detail)
        pdf.ln(1)

    pdf.hr()

    # ── SECTION 11: TIMWOODS Assessment ──
    pdf.add_page()
    pdf.section_title("11. TIMWOODS Assessment")

    cols = ["Waste", "Current State", "With Touchpoints", "Verdict"]
    widths = [26, 62, 56, 26]
    pdf.table_header(cols, widths)
    rows = [
        ["Transport", "Attribution copied across 6+ fields on 3 objects via bridge workflows",
         "Touchpoint IS the record; summaries only", "Eliminated"],
        ["Inventory", "65+ attribution properties, many empty or duplicated",
         "9 TP props + ~8 summary props", "Reduced 75%"],
        ["Motion", "Reps check multiple places; ops debug 10+ workflows",
         "Single TP timeline on Deal; 7 simple WFs", "Eliminated"],
        ["Waiting", "Workflow races overwrite data",
         "Timestamp guard ensures deterministic sync", "Eliminated"],
        ["Over-production", "Every lifecycle stage gets attribution snapshot (cc_, ac_, oc_, dc_, cw_, fe_)",
         "One TP per interaction, queryable by date", "Eliminated"],
        ["Over-processing", "88-action bridge WF, 30-action Disco Set, complex branching",
         "TP creators are simple; sync is 9 actions", "92% reduction"],
        ["Defects", "source_history truncated; overwrites lose data; type mismatches",
         "Immutable records, locked pairs, single taxonomy", "Eliminated"],
        ["Skills", "Deep attribution knowledge to debug",
         "Every interaction = a record; simple model", "Reduced"],
    ]
    for i, row in enumerate(rows):
        pdf.table_row(row, widths, fill=(i % 2 == 0))

    pdf.hr()

    # ── SECTION 12: Key Decisions ──
    pdf.section_title("12. Key Decisions Documented")
    cols = ["Decision", "Choice", "Rationale"]
    widths = [38, 44, 98]
    pdf.table_header(cols, widths)
    rows = [
        ["Customer Touchpoints", "Create for all, filter in reports",
         "Covers expansion; avoids lifecycle-gate WFs; uses Contact lifecyclestage"],
        ["Campaign Association", "Formal TP to Campaign",
         "Enables Campaign ROI reporting; set by WF5 reading hs_analytics_last_touch_converting_campaign"],
        ["Association Labels", "None (use dates)",
         "Labels require management WFs; dates provide same filtering in reports"],
        ["Hapily Association", "None (Contact bridges)",
         "Event name in medium; avoids duplicate paths"],
        ["Lead Association", "None (Contact bridges)",
         "Lead reads from Contact; adding association = transport waste"],
        ["Meeting Association", "None (Contact bridges)",
         "Meetings are conversions, not sources; meeting_source already mapped"],
        ["Activity Association", "None",
         "Activities are engagement, not attribution"],
        ["First Touch", "Property on Contact set by WF5",
         "Cheaper than association label; single query"],
    ]
    for i, row in enumerate(rows):
        pdf.table_row(row, widths, fill=(i % 2 == 0))

    pdf.ln(8)

    # ── SECTION: Implementation Todos ──
    pdf.add_page()
    pdf.section_title("13. Implementation Roadmap")

    todos = [
        ("Phase 1: Foundation", [
            "Create Touchpoint custom object with 9 properties",
            "Create 5 new Contact properties + first_touchpoint_source",
            "Create Deal property: primary_driver (enum, 24 source values)",
            "Create rollup properties on Contact, Company, and Deal",
            "Create calculated properties: days_first_touch_to_deal, days_first_touch_to_close on Deal",
            "Create filtered rollup on Deal: deal_sales_touchpoint_count",
        ]),
        ("Phase 1b: Workflows", [
            "Build WF2: Event to Touchpoint",
            "Build WF3: Sequence to Touchpoint",
            "Build WF4: Referral to Touchpoint",
            "Build WF5: Touchpoint to Contact Sync",
            "Build WF6: Deal Created to Touchpoint Association",
            "Build WF6b: Deal Disco to Touchpoint Refresh",
            "Update existing Event workflow (#9 / 100489130) to set latest_hapily_event props",
        ]),
        ("Phase 2: Web Source", [
            "Build WF1: Web Source to Touchpoint (custom code classifier + dedup)",
        ]),
        ("Phase 3: Cleanup", [
            "Deactivate Attribution Operator, First/Last Touch Runners, Bridge, and 3 Mobly workflows",
        ]),
        ("Phase 4: Reporting", [
            "Build core reports: Pipeline by Source, Revenue by Source, Win Rate by Source",
            "Build velocity reports: Journey to Opp, Journey to Close, Sales Touches to Close",
            "Build comparison reports: Webinar, Ad Platform, Prospecting Effectiveness",
            "Build attribution reports: First Touch vs Primary Driver, Conversion Funnel",
            "Build segment reports: Customer vs New Business",
        ]),
    ]

    for phase_title, items in todos:
        pdf.sub_section_title(phase_title)
        for item in items:
            pdf.bullet(item)
        pdf.ln(3)

    # Save
    output_path = "/Users/garret2.0/Hubspot_Architecture/Touchpoint_Architecture_Plan.pdf"
    pdf.output(output_path)
    return output_path


if __name__ == "__main__":
    path = build_pdf()
    print(f"PDF generated: {path}")
