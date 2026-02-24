# Guide: How to Import Data

This guide covers everything you need to know about importing tournament data into the Volleyball Ranking Engine. The system supports two spreadsheet formats: **Finishes** (tournament placements) and **Colley** (pre-computed ranking data).

---

## Preparing Your Spreadsheet

### Finishes Format

The finishes spreadsheet is the standard import format. It records each team's placement (finish position) at every tournament they attended during the season.

**Spreadsheet layout:**

| Row     | Content                                                                          |
| ------- | -------------------------------------------------------------------------------- |
| Row 1   | Tournament names in merged cells, each spanning 3 columns                        |
| Row 2   | Sub-headers repeating the pattern: **Div**, **Fin**, **Tot** for each tournament |
| Rows 3+ | Team data                                                                        |

**Team columns (columns A through J):**

| Column | Content                                              | Required |
| ------ | ---------------------------------------------------- | -------- |
| A      | Team Name                                            | Yes      |
| B      | Team Code                                            | Yes      |
| C-J    | Additional team-level fields (ignored by the parser) | No       |

**Tournament columns (starting at column K):**

Each tournament occupies three consecutive columns:

| Sub-column | Header (Row 2) | Content                                 | Data Type |
| ---------- | -------------- | --------------------------------------- | --------- |
| 1          | Div            | Division code (e.g., "Open", "Club")    | Text      |
| 2          | Fin            | Finish position (e.g., 1, 2, 3)         | Integer   |
| 3          | Tot            | Field size (total teams in the bracket) | Integer   |

**Important notes:**

- The file must be in `.xlsx` format (not `.xls` or `.csv`).
- The maximum file size is 10 MB.
- The last 5 columns of the spreadsheet are treated as summary columns and are ignored.
- If a team did not attend a tournament, leave the Fin and Tot cells empty for that tournament.
- Tournament names in Row 1 should be in merged cells that span exactly the 3 columns of their Div/Fin/Tot triplet.

### Colley Format

The Colley spreadsheet is used to import pre-computed ranking data directly, bypassing the algorithm computation step.

**Column layout (fixed positions):**

| Column | Header      | Content              | Required |
| ------ | ----------- | -------------------- | -------- |
| A      | Team        | Team name            | Yes      |
| B      | teamcode    | Team code            | Yes      |
| C      | Wins        | Total wins           | Yes      |
| D      | Losses      | Total losses         | Yes      |
| E      | Algo1Rating | Colley Matrix rating | No       |
| F      | Algo1Rank   | Colley Matrix rank   | No       |
| G      | Algo2Rating | Elo-2200 rating      | No       |
| H      | Algo2Rank   | Elo-2200 rank        | No       |
| I      | Algo3Rating | Elo-2400 rating      | No       |
| J      | Algo3Rank   | Elo-2400 rank        | No       |
| K      | Algo4Rating | Elo-2500 rating      | No       |
| L      | Algo4Rank   | Elo-2500 rank        | No       |
| M      | Algo5Rating | Elo-2700 rating      | No       |
| N      | Algo5Rank   | Elo-2700 rank        | No       |
| O      | AggRating   | Aggregate rating     | No       |
| P      | AggRank     | Aggregate rank       | No       |

**Notes:**

- Row 1 is the header row and is skipped.
- Rows 2+ are data rows.
- The Wins and Losses columns are required. All algorithm columns are optional.
- Rating values should be decimal numbers. Rank values should be integers.

---

## Uploading a Finishes File

1. Navigate to the **Import** page by clicking "Import" in the top navigation bar.
2. Select a **Season** from the dropdown. Active seasons are marked with "(Active)".
3. Select an **Age Group** (15U, 16U, 17U, or 18U).
4. Set the **Format** to "Finishes" (this is the default).
5. Drag your `.xlsx` file onto the upload area, or click it to browse your computer.
6. Wait for the file to upload and parse.

**What you should see:** The page transitions from the upload area to a data preview showing all parsed rows in a table.

---

## Uploading a Colley File

1. Navigate to the **Import** page.
2. Select a **Season** and **Age Group**.
3. Change the **Format** dropdown to "Colley".
4. Upload your `.xlsx` file using the same drag-and-drop or browse method.

**What you should see:** A preview table showing team names, codes, wins, losses, and any algorithm rating/rank columns that were present in the file.

---

## Reviewing the Preview

After uploading, the system displays a preview of the parsed data:

- **Green rows** indicate data that parsed successfully.
- **Red-highlighted cells** indicate errors that need attention.
- **Warning indicators** flag potential issues that do not block import.

For each row, you can:

- Click on a cell to edit its value directly in the preview table.
- Click the **skip** button to exclude a row from import entirely.

The **Confirm Import** button at the bottom remains disabled until all errors are resolved or the affected rows are skipped.

---

## Resolving Team Name Mismatches (Identity Resolution)

When the parser encounters a team name or tournament name that does not exactly match an existing record in the database, the Identity Resolution panel appears above the data preview.

For each unrecognized name, the system presents a list of possible matches ranked by similarity. You have three options:

1. **Map to existing** -- Select one of the suggested matches. The imported data will be associated with that existing team or tournament.
2. **Create new** -- Create a new team or tournament record using the name from the spreadsheet. You may need to provide additional details (such as region for teams, or date for tournaments).
3. **Skip** -- Ignore all rows referencing this unrecognized name.

Common causes of identity conflicts:

- Slight variations in spelling (e.g., "St. Louis" vs. "Saint Louis")
- Abbreviations (e.g., "VBC" vs. "Volleyball Club")
- Extra spaces or punctuation differences
- A genuinely new team that is not yet in the database

---

## Confirming the Import

After resolving all identity conflicts and data errors:

1. Choose an **Import Mode**:
   - **Merge/Update** (recommended): Inserts new records and updates existing records that have changed. Identical records are skipped. Use this when adding new tournament results to an existing dataset.
   - **Replace All**: Deletes all existing tournament results for the selected season and age group, then inserts everything from the file. Use this when you have a complete, corrected dataset that should replace what is currently stored.

2. Click **Confirm Import**.

**What you should see:** A spinner and "Importing data..." message. When complete, a summary card appears showing:

| Field               | Description                                                          |
| ------------------- | -------------------------------------------------------------------- |
| Rows Inserted       | Number of new records created                                        |
| Rows Updated        | Number of existing records that were modified                        |
| Rows Skipped        | Number of identical records (no changes needed)                      |
| Teams Created       | Number of new team records created through identity resolution       |
| Tournaments Created | Number of new tournament records created through identity resolution |
| Import Mode         | Whether Merge or Replace was used                                    |
| Timestamp           | When the import completed                                            |

Click the button on the summary card to start a new import or navigate to Rankings to compute rankings from the imported data.

---

## Common Errors and How to Fix Them

### "Invalid file type. Only .xlsx files are accepted."

You uploaded a file that is not in `.xlsx` format. Open your spreadsheet in Excel or Google Sheets and save/export it as an `.xlsx` file.

### "File size exceeds the 10 MB limit."

Your file is too large. Try removing unnecessary sheets or columns from the workbook before uploading.

### "Missing team name" or "Missing team code"

A row in the spreadsheet has an empty cell in column A (Team Name) or column B (Team Code). Open the file, fill in the missing values, and re-upload.

### "Non-integer value in Fin column" or "Non-integer value in Tot column"

A finish position or field size cell contains a non-integer value (such as text, a decimal number, or a formula that does not evaluate to a whole number). Fix the cell in your spreadsheet so it contains a plain integer (e.g., 1, 2, 3).

### "Missing required value for Wins/Losses" (Colley format)

The Wins or Losses column is empty for a team row. These fields are required in the Colley format. Fill in the missing values.

### "Non-numeric value in [column]"

A column that expects a number contains text or an error value. Check the specified column in your spreadsheet and correct the value.

### Import confirmation fails with validation errors

If the confirmation step reports validation errors (e.g., "X rows failed validation"), the error message lists the specific rows and their issues. Edit or skip the problematic rows in the preview, then try confirming again.

---

_Last updated: 2026-02-24_
