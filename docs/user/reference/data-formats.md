# Reference: Data Format Specifications

This document specifies the exact column layouts and data types for all file formats used by the Volleyball Ranking Engine: import spreadsheets and export files.

---

## Import Formats

### Finishes Spreadsheet Format

The finishes spreadsheet records tournament placement data. It uses a multi-row header layout where tournament names are in Row 1 and sub-column headers are in Row 2.

#### Layout Overview

```
Row 1:  [Team fields]  |  Tournament A (merged)   |  Tournament B (merged)   |  ...  |  [Summary cols]
Row 2:  [Team headers]  |  Div  | Fin  | Tot      |  Div  | Fin  | Tot       |  ...  |  [Summary cols]
Row 3:  Team 1 data      |  Open |  1   |  32      |  Club |  3   |  16       |  ...  |  ...
Row 4:  Team 2 data      |  Open |  5   |  32      |       |      |           |  ...  |  ...
...
```

#### Team Columns (A-J)

| Column         | Name      | Data Type | Required | Description                                          |
| -------------- | --------- | --------- | -------- | ---------------------------------------------------- |
| A (col 0)      | Team Name | Text      | Yes      | Full team name                                       |
| B (col 1)      | Team Code | Text      | Yes      | Short team identifier code                           |
| C-J (cols 2-9) | Varies    | Varies    | No       | Additional team-level fields (ignored by the parser) |

#### Tournament Columns (K onward)

Tournament data starts at column K (index 10). Each tournament occupies exactly 3 consecutive columns. There may be empty padding columns between tournaments.

**Row 1 (tournament names):**

- Tournament names appear in merged cells spanning 3 columns each.
- The parser reads the leftmost cell of each merged region to get the tournament name.

**Row 2 (sub-headers):**

- The parser scans for the pattern `Div`, `Fin`, `Tot` (case-insensitive) in three consecutive cells.
- Only columns matching this triplet pattern are treated as valid tournament data.

**Data rows (Row 3+):**

| Sub-column | Header | Data Type | Description                                                     |
| ---------- | ------ | --------- | --------------------------------------------------------------- |
| 1st        | Div    | Text      | Division code (e.g., "Open", "Club", "National")                |
| 2nd        | Fin    | Integer   | Finish position (1 = first place). Required if Tot is present.  |
| 3rd        | Tot    | Integer   | Field size (total number of teams). Required if Fin is present. |

**Rules:**

- If both Fin and Tot are empty for a team at a tournament, the row is skipped for that tournament (the team did not attend).
- If Fin is present but not a valid integer, an error is reported.
- If Tot is present but not a valid integer, an error is reported.
- The last 5 columns of the spreadsheet are treated as summary columns and are excluded from parsing.

#### Example

|           | A          | B    | ... | K                          | L   | M   | N                           | O   | P   |
| --------- | ---------- | ---- | --- | -------------------------- | --- | --- | --------------------------- | --- | --- |
| **Row 1** |            |      |     | AAU Nationals (merged K-M) |     |     | Regionals East (merged N-P) |     |     |
| **Row 2** | Team Name  | Code | ... | Div                        | Fin | Tot | Div                         | Fin | Tot |
| **Row 3** | Tigers VBC | TGR  | ... | Open                       | 1   | 32  | Club                        | 5   | 16  |
| **Row 4** | Eagles VBC | EGL  | ... | Open                       | 8   | 32  |                             |     |     |

In this example:

- Tigers VBC finished 1st out of 32 at AAU Nationals (Open division) and 5th out of 16 at Regionals East (Club division).
- Eagles VBC finished 8th out of 32 at AAU Nationals and did not attend Regionals East.

---

### Colley Spreadsheet Format

The Colley spreadsheet uses a simple flat-table layout with fixed column positions.

| Column | Index | Header      | Data Type | Required |
| ------ | ----- | ----------- | --------- | -------- |
| A      | 0     | Team        | Text      | Yes      |
| B      | 1     | teamcode    | Text      | Yes      |
| C      | 2     | Wins        | Integer   | Yes      |
| D      | 3     | Losses      | Integer   | Yes      |
| E      | 4     | Algo1Rating | Decimal   | No       |
| F      | 5     | Algo1Rank   | Integer   | No       |
| G      | 6     | Algo2Rating | Decimal   | No       |
| H      | 7     | Algo2Rank   | Integer   | No       |
| I      | 8     | Algo3Rating | Decimal   | No       |
| J      | 9     | Algo3Rank   | Integer   | No       |
| K      | 10    | Algo4Rating | Decimal   | No       |
| L      | 11    | Algo4Rank   | Integer   | No       |
| M      | 12    | Algo5Rating | Decimal   | No       |
| N      | 13    | Algo5Rank   | Integer   | No       |
| O      | 14    | AggRating   | Decimal   | No       |
| P      | 15    | AggRank     | Integer   | No       |

**Rules:**

- Row 1 is the header row (skipped during parsing).
- Rows 2+ are data rows.
- Empty rows (both Team and teamcode empty) are skipped.
- If Team is present but teamcode is empty (or vice versa), an error is reported.
- Wins and Losses are required; all algorithm columns are optional.
- Non-numeric values in numeric columns produce errors.
- Non-integer values in rank columns produce warnings.

#### Algorithm Column Mapping

| Column | Algorithm                  |
| ------ | -------------------------- |
| Algo1  | Colley Matrix              |
| Algo2  | Elo (starting rating 2200) |
| Algo3  | Elo (starting rating 2400) |
| Algo4  | Elo (starting rating 2500) |
| Algo5  | Elo (starting rating 2700) |

---

## Export Formats

### CSV Export Format

The CSV export follows RFC 4180 conventions.

**Structure:**

1. **Metadata comments** (prefixed with `#`):

   ```
   # Season: 2025-2026 Season
   # Age Group: 18U
   # Run At: 2026-02-24T10:35:00.000Z
   # Teams Ranked: 45
   # Status: draft
   # Exported At: 2026-02-24T11:00:00.000Z
   ```

2. **Blank line**

3. **Column headers** (comma-separated)

4. **Data rows** (one per team, sorted by final rank ascending)

5. **Override summary** (if overrides exist):

   ```

   # Override Summary
   Team,Original Rank,Final Rank,Justification,Committee Member
   "Team ABC",5,3,"Strong late-season performance","Jane Doe"
   ```

**Summary columns (always present):**

| Column               | Data Type                  | Description                              |
| -------------------- | -------------------------- | ---------------------------------------- |
| Final Rank           | Integer                    | Final rank position (reflects overrides) |
| Team                 | Text                       | Team name                                |
| Region               | Text                       | Geographic region                        |
| Agg Rating           | Decimal (2 places)         | Aggregate rating (0-100)                 |
| Agg Rank             | Integer                    | Algorithmic aggregate rank               |
| Win %                | Decimal (1 place) or empty | Win percentage                           |
| Best National Finish | Integer or empty           | Best Tier-1 tournament finish            |

**Algorithm breakdown columns (when "Include algorithm breakdowns" is checked):**

| Column        | Data Type |
| ------------- | --------- |
| Algo 1 Rating | Decimal   |
| Algo 1 Rank   | Integer   |
| Algo 2 Rating | Decimal   |
| Algo 2 Rank   | Integer   |
| Algo 3 Rating | Decimal   |
| Algo 3 Rank   | Integer   |
| Algo 4 Rating | Decimal   |
| Algo 4 Rank   | Integer   |
| Algo 5 Rating | Decimal   |
| Algo 5 Rank   | Integer   |

**Override columns (when overrides exist):**

| Column                    | Data Type        |
| ------------------------- | ---------------- |
| Override Original Rank    | Integer or empty |
| Override Justification    | Text or empty    |
| Override Committee Member | Text or empty    |

**Encoding:** UTF-8
**Line endings:** LF (`\n`)
**Field quoting:** Fields containing commas, double quotes, or newlines are enclosed in double quotes. Double quotes within fields are escaped as `""`.

---

### XLSX Export Format

The Excel export produces a standard `.xlsx` workbook.

**Sheet 1: "Rankings"**

| Row Range | Content                                                                                                   |
| --------- | --------------------------------------------------------------------------------------------------------- |
| Rows 1-6  | Metadata (one field per row, single column): Season, Age Group, Run At, Teams Ranked, Status, Exported At |
| Row 7     | Blank separator                                                                                           |
| Row 8     | Column headers                                                                                            |
| Rows 9+   | Data rows (same columns as CSV)                                                                           |

**Sheet 2: "Overrides"** (only present when overrides exist)

| Column           | Content                         |
| ---------------- | ------------------------------- |
| Team             | Team name                       |
| Original Rank    | Algorithmic rank                |
| Final Rank       | Committee-assigned rank         |
| Justification    | Override reason                 |
| Committee Member | Person who applied the override |

---

### PDF Export Format

The PDF report is generated as a formatted document.

**Page setup:**

- Paper size: Letter (8.5" x 11")
- Orientation: Landscape when algorithm breakdowns are included; Portrait when summary only
- Margins: 30pt left and right

**Content structure:**

1. **Title** (centered, 16pt): "Volleyball Rankings Report"
2. **Metadata block** (9pt, left-aligned): Season, age group, run date, teams ranked, status, export date
3. **Rankings table**:
   - Header row: Blue background (#29417A), white text
   - Body: 7pt font, 3pt cell padding
   - Same columns as CSV export
4. **Override Summary table** (if overrides exist):
   - Section heading: "Override Summary" (12pt)
   - Header row: Brown background (#825032), white text
   - Columns: Team, Original Rank, Final Rank, Justification, Committee Member
5. **Page numbers**: Centered footer, "Page X of Y" (8pt)

---

## File Naming Conventions

Export files follow a standardized naming pattern:

```
rankings_[AGE_GROUP]_[DATE].[ext]
```

| Component | Format                                                    | Example              |
| --------- | --------------------------------------------------------- | -------------------- |
| AGE_GROUP | Age group with special characters replaced by underscores | `18U`                |
| DATE      | ISO date (YYYY-MM-DD)                                     | `2026-02-24`         |
| ext       | File extension                                            | `csv`, `xlsx`, `pdf` |

**Examples:**

- `rankings_18U_2026-02-24.csv`
- `rankings_15U_2026-02-24.xlsx`
- `rankings_17U_2026-02-24.pdf`

---

_Last updated: 2026-02-24_
