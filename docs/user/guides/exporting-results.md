# Guide: How to Export Results

This guide explains how to download ranking results as CSV, Excel, or PDF files for distribution, archival, or further analysis.

---

## Accessing the Export Feature

The Export button is available on the Rankings page after a ranking computation has been run or a previous run has been loaded.

1. Navigate to **Rankings** and run a ranking computation (or select a previous run from the dropdown).
2. Scroll to the bottom of the results table.
3. Click the **Export** button.

**What you should see:** A dropdown menu with the following options:

- A checkbox labeled "Include algorithm breakdowns"
- Three download buttons: **Download CSV**, **Download Excel**, and **Download PDF**

### Include Algorithm Breakdowns

Before choosing a format, you can check the **Include algorithm breakdowns** checkbox. This controls how much detail is included in the exported file:

| Setting                      | Columns Included                                                                                                            |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Unchecked** (summary only) | Final Rank, Team, Region, Agg Rating, Agg Rank, Win %, Best National Finish                                                 |
| **Checked** (full detail)    | All summary columns plus individual ratings and ranks for all 5 algorithms (Colley, Elo-2200, Elo-2400, Elo-2500, Elo-2700) |

If overrides are active, both modes also include: Override Original Rank, Override Justification, and Override Committee Member.

---

## CSV Export

**When to use:** When you need to import the data into another spreadsheet application, database, or analysis tool. CSV files are the most widely compatible format.

**How to export:**

1. Click **Export**.
2. (Optional) Check "Include algorithm breakdowns."
3. Click **Download CSV**.

**What is included:**

The CSV file contains:

1. **Metadata header** (lines starting with `#`):
   - Season name
   - Age group
   - Run timestamp
   - Number of teams ranked
   - Run status (draft or finalized)
   - Export timestamp

2. **Column headers row**

3. **Data rows** (one per team, sorted by final rank)

4. **Override Summary section** (if overrides exist): A separate section listing each override with the team name, original rank, final rank, justification, and committee member.

**File format details:**

- Encoding: UTF-8
- Delimiter: Comma (`,`)
- Quoting: RFC 4180 compliant (fields containing commas, quotes, or newlines are enclosed in double quotes)
- Filename pattern: `rankings_[AGE_GROUP]_[DATE].csv` (for example, `rankings_18U_2026-02-24.csv`)

---

## Excel (XLSX) Export

**When to use:** When you want a formatted spreadsheet that can be opened directly in Microsoft Excel, Google Sheets, or Numbers. This is the best choice for sharing with committee members who prefer working in spreadsheet applications.

**How to export:**

1. Click **Export**.
2. (Optional) Check "Include algorithm breakdowns."
3. Click **Download Excel**.

**What is included:**

The Excel file contains one or two sheets:

### Sheet 1: "Rankings"

- **Metadata rows** at the top (season, age group, run date, teams ranked, status, export date)
- A blank row separator
- **Column headers**
- **Data rows** (one per team, sorted by final rank)

### Sheet 2: "Overrides" (only present if overrides exist)

| Column           | Content                                         |
| ---------------- | ----------------------------------------------- |
| Team             | Team name                                       |
| Original Rank    | The algorithmic rank before the override        |
| Final Rank       | The committee-assigned rank                     |
| Justification    | The reason for the override                     |
| Committee Member | The name of the person who applied the override |

**Filename pattern:** `rankings_[AGE_GROUP]_[DATE].xlsx`

---

## PDF Report

**When to use:** When you need a formatted, print-ready document for official distribution, meeting handouts, or archival purposes.

**How to export:**

1. Click **Export**.
2. (Optional) Check "Include algorithm breakdowns."
3. Click **Download PDF**.

**What is included:**

The PDF report contains:

1. **Title:** "Volleyball Rankings Report" (centered at the top)

2. **Metadata section:** Season name, age group, run timestamp, teams ranked, status, and export timestamp

3. **Rankings table:** A formatted table with all data rows, using:
   - Blue header row with white text
   - Alternating row styling for readability
   - Landscape orientation when algorithm breakdowns are included (to fit the wider table)
   - Portrait orientation for summary-only exports

4. **Override Summary table** (if overrides exist): A separate table with a brown header, listing all overrides

5. **Page numbers:** Centered at the bottom of each page (e.g., "Page 1 of 3")

**Formatting notes:**

- Font size is 7pt for table content and 9pt for metadata to fit all columns
- Cell padding is 3pt for compact but readable layout
- Pages use Letter size (8.5" x 11")

**Filename pattern:** `rankings_[AGE_GROUP]_[DATE].pdf`

---

## Choosing the Right Format

| Scenario                                  | Recommended Format |
| ----------------------------------------- | ------------------ |
| Sharing with committee members for review | Excel (XLSX)       |
| Official publication or printing          | PDF                |
| Importing into another system or database | CSV                |
| Archival (keeping a record)               | PDF and CSV (both) |
| Quick email attachment                    | PDF                |
| Further data analysis in a spreadsheet    | CSV or Excel       |

---

## Column Reference

The following columns appear in all export formats:

| Column               | Description                                                              |
| -------------------- | ------------------------------------------------------------------------ |
| Final Rank           | The team's official rank position (reflects overrides if any)            |
| Team                 | Team name                                                                |
| Region               | Geographic region                                                        |
| Agg Rating           | Aggregate rating (0-100 scale, average of 5 normalized algorithm scores) |
| Agg Rank             | Rank derived from the aggregate rating (before overrides)                |
| Win %                | Win percentage across all tournaments                                    |
| Best National Finish | Best placement at a Tier-1 national tournament                           |

When "Include algorithm breakdowns" is checked, these additional columns appear:

| Column               | Description                            |
| -------------------- | -------------------------------------- |
| Algo 1 Rating / Rank | Colley Matrix algorithm score and rank |
| Algo 2 Rating / Rank | Elo-2200 score and rank                |
| Algo 3 Rating / Rank | Elo-2400 score and rank                |
| Algo 4 Rating / Rank | Elo-2500 score and rank                |
| Algo 5 Rating / Rank | Elo-2700 score and rank                |

When overrides are active, these additional columns appear:

| Column                    | Description                                               |
| ------------------------- | --------------------------------------------------------- |
| Override Original Rank    | The team's algorithmic rank before the committee override |
| Override Justification    | The reason provided for the override                      |
| Override Committee Member | The name of the person who applied the override           |

---

_Last updated: 2026-02-24_
