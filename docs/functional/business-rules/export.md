# Export and Reporting Business Rules

> Last updated: 2026-02-24

This document describes how ranking results are exported from the system in three formats: CSV (plain text), Excel (XLSX), and PDF. It covers what data is included, how algorithm breakdowns are presented, how overrides are reported, and the formatting rules for each format.

---

## Table of Contents

- [Overview](#overview)
- [Export Data Content](#export-data-content)
- [Export Options](#export-options)
- [CSV Export](#csv-export)
- [Excel (XLSX) Export](#excel-xlsx-export)
- [PDF Export](#pdf-export)
- [Override Reporting in Exports](#override-reporting-in-exports)
- [Report Header Information](#report-header-information)

---

## Overview

The system produces ranking exports in three formats to serve different audiences:

| Format           | Best For                                           | Key Characteristics                                                                    |
| ---------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **CSV**          | Data analysts, spreadsheet users, archival         | Plain text, easily opened in any spreadsheet application or processed by other systems |
| **Excel (XLSX)** | Committee members, administrators                  | Native Excel workbook with multiple sheets, ready for review and distribution          |
| **PDF**          | Official publication, printing, email distribution | Formatted report with title, headers, page numbers, and professional table layout      |

All three formats contain the same underlying data. The difference is in presentation and structure.

---

## Export Data Content

Every export includes the following information for each ranked team, sorted by final rank (1st place first):

### Standard Columns (Always Included)

| Column                   | Description                                                    | Example       |
| ------------------------ | -------------------------------------------------------------- | ------------- |
| **Final Rank**           | The team's published rank position (reflects overrides if any) | 1             |
| **Team**                 | The team's full name                                           | "Thunder VBC" |
| **Region**               | The team's geographic region                                   | "Southeast"   |
| **Agg Rating**           | The aggregate rating score (0-100 scale, two decimal places)   | 82.45         |
| **Agg Rank**             | The algorithmically computed rank (before any overrides)       | 1             |
| **Win %**                | The team's win percentage across all tournaments               | 75.0          |
| **Best National Finish** | The team's highest placement at a Tier-1 tournament            | 3             |

### Rules

- **RULE E-DATA-01:** Export rows are always sorted by Final Rank in ascending order (rank 1 first, rank 2 second, and so on).
- **RULE E-DATA-02:** When a team has no win percentage data, the Win % field is left blank.
- **RULE E-DATA-03:** When a team did not compete in any Tier-1 tournament, the Best National Finish field is left blank.
- **RULE E-DATA-04:** Final Rank reflects committee overrides. When a team has an override, Final Rank shows the override rank; otherwise, it shows the algorithmic Agg Rank.

---

## Export Options

The user can control what level of detail is included in the export.

### Algorithm Breakdown Option

When the user enables algorithm breakdowns, the export includes ten additional columns:

| Additional Columns                    | Description                                   |
| ------------------------------------- | --------------------------------------------- |
| **Algo 1 Rating** and **Algo 1 Rank** | Colley Matrix rating and rank                 |
| **Algo 2 Rating** and **Algo 2 Rank** | Elo Variant A (starting 2200) rating and rank |
| **Algo 3 Rating** and **Algo 3 Rank** | Elo Variant B (starting 2400) rating and rank |
| **Algo 4 Rating** and **Algo 4 Rank** | Elo Variant C (starting 2500) rating and rank |
| **Algo 5 Rating** and **Algo 5 Rank** | Elo Variant D (starting 2700) rating and rank |

### Rules

- **RULE E-OPT-01:** When algorithm breakdowns are enabled, all five algorithm rating/rank pairs are included as additional columns after the standard columns.
- **RULE E-OPT-02:** When algorithm breakdowns are not enabled, only the standard columns are included. This produces a cleaner, more concise export.
- **RULE E-OPT-03:** Algorithm ratings in the export are the raw (un-normalized) values from each algorithm. The Agg Rating is the normalized average.

---

## CSV Export

The CSV format produces a plain-text file that can be opened in Excel, Google Sheets, or any text editor.

### Structure

The CSV file has four sections, in order:

1. **Report header** -- Metadata lines prefixed with "#" (comment lines)
2. **Blank line** -- Separator
3. **Column headers and data rows** -- Standard CSV table
4. **Override summary** (if any overrides exist) -- Separate section at the bottom

### Rules

- **RULE E-CSV-01:** The CSV follows the RFC 4180 standard. Fields containing commas, quotation marks, or line breaks are enclosed in double quotes.
- **RULE E-CSV-02:** Quotation marks within field values are escaped by doubling them (e.g., a field containing `He said "hello"` becomes `"He said ""hello"""`).
- **RULE E-CSV-03:** Blank/null values are represented as empty fields (no text between commas).
- **RULE E-CSV-04:** Report header lines begin with "# " (hash followed by a space) so they can be easily identified as metadata rather than data.

> **Example CSV output (simplified):**
>
> ```
> # Season: 2025-2026
> # Age Group: 16U
> # Run At: 2026-02-20T14:30:00Z
> # Teams Ranked: 24
> # Status: Finalized
> # Exported At: 2026-02-24T10:00:00Z
>
> Final Rank,Team,Region,Agg Rating,Agg Rank,Win %,Best National Finish
> 1,Thunder VBC,Southeast,92.45,1,87.5,2
> 2,Lightning VBC,Northeast,88.30,2,82.1,5
> 3,Storm VBC,Midwest,85.12,4,79.3,
> ```
>
> Note: Storm VBC has no Best National Finish (they did not attend a Tier-1 event), and their Agg Rank is 4 while their Final Rank is 3 (indicating an override moved them up).

---

## Excel (XLSX) Export

The Excel format produces a native workbook file with one or two sheets.

### Sheet 1: Rankings

The first sheet ("Rankings") contains:

1. **Metadata rows** at the top (one metadata item per row in the first column)
2. **A blank row** as separator
3. **Column headers** in a single row
4. **Data rows** -- one row per team, sorted by final rank

### Sheet 2: Overrides (conditional)

When committee overrides exist, a second sheet ("Overrides") is added with:

| Column               | Content                                          |
| -------------------- | ------------------------------------------------ |
| **Team**             | The team name                                    |
| **Original Rank**    | The team's algorithmic rank before the override  |
| **Final Rank**       | The team's rank after the override               |
| **Justification**    | The written reason for the override              |
| **Committee Member** | The name of the person who authorized the change |

### Rules

- **RULE E-XLSX-01:** The Rankings sheet always exists and contains all ranked teams.
- **RULE E-XLSX-02:** The Overrides sheet is only created when at least one override exists. When there are no overrides, the workbook has only one sheet.
- **RULE E-XLSX-03:** The override summary on the Overrides sheet is sorted by Final Rank (ascending).
- **RULE E-XLSX-04:** Metadata rows appear as plain text in the first column. They are not formatted as a table.

---

## PDF Export

The PDF format produces a formatted, print-ready document suitable for official distribution.

### Layout

| Section                                  | Content                                                                                      |
| ---------------------------------------- | -------------------------------------------------------------------------------------------- |
| **Title**                                | "Volleyball Rankings Report" -- centered at the top of the first page                        |
| **Metadata block**                       | Season, age group, run date, team count, status, export date -- left-aligned below the title |
| **Rankings table**                       | All teams with column headers, formatted as a professional table                             |
| **Override summary table** (conditional) | Appears below the rankings table when overrides exist                                        |
| **Page numbers**                         | Centered at the bottom of every page: "Page X of Y"                                          |

### Formatting Rules

- **RULE E-PDF-01:** When algorithm breakdowns are included (many columns), the document uses landscape orientation for readability.
- **RULE E-PDF-02:** When algorithm breakdowns are not included (standard columns only), the document uses portrait orientation.
- **RULE E-PDF-03:** The rankings table header row uses a dark blue background with white text.
- **RULE E-PDF-04:** Table text uses a small font size (7 point) to fit all columns on the page. Cell padding is minimal (3 points).
- **RULE E-PDF-05:** The override summary table header uses a brown/amber background with white text to visually distinguish it from the main rankings table.
- **RULE E-PDF-06:** The override summary table appears on the same page as the end of the rankings table when space permits. If not, it flows to the next page.
- **RULE E-PDF-07:** Page numbers are printed on every page, centered at the bottom.
- **RULE E-PDF-08:** Page margins are 30 points on the left and right sides.
- **RULE E-PDF-09:** The document uses US Letter paper size (8.5 x 11 inches).
- **RULE E-PDF-10:** Null or blank values (e.g., no Best National Finish) are displayed as empty cells in the table.

---

## Override Reporting in Exports

When committee overrides have been applied to a ranking run, all three export formats include additional information to maintain transparency.

### In the Data Rows

When a team has an override, three additional columns appear in the data section (when applicable):

| Column                        | Content                                                     |
| ----------------------------- | ----------------------------------------------------------- |
| **Override Original Rank**    | The team's algorithmic rank before the committee adjustment |
| **Override Justification**    | The reason the committee gave for the change                |
| **Override Committee Member** | The name of the committee member who authorized the change  |

### Rules

- **RULE E-OVER-01:** Override columns are only included in the export when at least one team has an override. When no overrides exist, these columns are omitted entirely.
- **RULE E-OVER-02:** For teams without an override, the override columns are left blank in that team's row.
- **RULE E-OVER-03:** The override summary (CSV bottom section, XLSX second sheet, PDF second table) lists only the teams that have overrides, sorted by their final rank.
- **RULE E-OVER-04:** The override summary always includes: team name, original rank, final rank, justification, and committee member name.

> **Example of how an overridden team appears:**
>
> | Final Rank | Team        | Region    | Agg Rating | Agg Rank | ... | Override Original Rank | Override Justification                      | Override Committee Member |
> | ---------- | ----------- | --------- | ---------- | -------- | --- | ---------------------- | ------------------------------------------- | ------------------------- |
> | 5          | Coastal VBC | Southeast | 78.30      | 8        | ... | 8                      | "Head-to-head 4-1 against teams ranked 5-7" | "Maria Johnson"           |
>
> This shows that Coastal VBC was algorithmically ranked 8th but was moved to 5th by the committee.

---

## Report Header Information

Every export includes the following metadata, regardless of format:

| Field            | Description                                | Example                |
| ---------------- | ------------------------------------------ | ---------------------- |
| **Season**       | The season name                            | "2025-2026"            |
| **Age Group**    | The age division                           | "16U"                  |
| **Run At**       | When the ranking computation was performed | "2026-02-20T14:30:00Z" |
| **Teams Ranked** | Total number of teams in the ranking       | 24                     |
| **Status**       | Whether the run is Draft or Finalized      | "Finalized"            |
| **Exported At**  | When the export was generated              | "2026-02-24T10:00:00Z" |

### Rules

- **RULE E-META-01:** The run status is always displayed so that recipients know whether the rankings are preliminary (Draft) or official (Finalized).
- **RULE E-META-02:** The export timestamp records the exact moment the file was generated, which may differ from when the rankings were computed.
