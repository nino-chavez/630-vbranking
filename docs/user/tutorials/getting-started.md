# Tutorial: Getting Started

This tutorial walks you through the complete workflow of the Volleyball Ranking Engine, from your first login to exporting a finished ranking report. By the end, you will have imported tournament data, computed rankings, reviewed results, and exported a report.

**Time required:** approximately 15 minutes.

**Prerequisites:** You need access to the application URL and an Excel spreadsheet (.xlsx) containing tournament finishes data. If you do not have sample data, ask your administrator for the current season's finishes file.

---

## Step 1: Navigate to the Application

1. Open your web browser (Chrome, Firefox, Safari, or Edge).
2. Go to the application URL provided by your administrator.

**What you should see:** A landing page with the title "Volleyball Rankings" in the top navigation bar. The navigation bar shows three links: **Import**, **Rankings**, and **Weights**.

---

## Step 2: Import Tournament Data

1. Click **Import** in the top navigation bar.

**What you should see:** The "Import Data" page with a subtitle that reads "Upload Excel spreadsheets to import tournament results or ranking data." Below it, you see an "Import Settings" card with three dropdown selectors: Season, Age Group, and Format.

2. In the **Season** dropdown, select the current season (for example, "2025-2026 Season"). Active seasons are labeled with "(Active)".
3. In the **Age Group** dropdown, select the age group you want to rank (for example, "18U").
4. In the **Format** dropdown, leave the default selection of "Finishes". This is the standard tournament placement format.

**What you should see:** A warning message disappears once you have selected both a season and age group. A file upload area becomes active below the settings card.

5. Drag your `.xlsx` file into the upload area, or click the upload area to browse for the file on your computer.
6. Wait for the file to upload and parse. A spinner displays during processing.

**What you should see:** After parsing completes, the page displays a preview table showing the imported data. Each row shows a team name, team code, tournament name, division, finish position, and field size.

7. If the system detects team names or tournament names it does not recognize, an **Identity Resolution** panel appears above the data table. For each unrecognized name, you can:
   - Select a matching team or tournament from the suggested list
   - Choose to create a new record
   - Choose to skip that name
8. Review the data in the preview table. If you see errors highlighted in red, you can:
   - Click on a cell to edit its value
   - Click the skip button to exclude a problematic row
9. Choose an import mode:
   - **Merge/Update** (default): Inserts new records, updates changed records, and skips identical records. Use this for incremental updates.
   - **Replace All**: Deletes existing data for this season and age group, then inserts all rows from the file. Use this for a fresh start.
10. Click **Confirm Import**.

**What you should see:** A spinner shows while the import processes. When complete, a summary card appears showing how many rows were inserted, updated, and skipped, along with counts of any new teams or tournaments created.

---

## Step 3: Adjust Tournament Weights (Optional)

Before running rankings, you may want to adjust how much weight each tournament carries. National championships typically count more than local tournaments.

1. Click **Weights** in the top navigation bar.

**What you should see:** The "Tournament Weights" page with a season selector and a "Tier Reference" card showing five tiers from Tier 1 (3.0x, National Championship) down to Tier 5 (1.0x, Local Tournament).

2. Select the same season you used during import.

**What you should see:** A table listing every tournament for that season, with columns for Tournament name, Date, Tier, Weight, and Status. New tournaments default to Tier 5 with a weight of 1.0.

3. For each tournament, select the appropriate tier from the dropdown. The weight updates automatically based on the tier. You can also type a custom weight value directly into the Weight input field.
4. Click **Save Weights** when you are satisfied with the changes.

**What you should see:** A green success banner confirming how many weights were saved. Tournaments with non-default weights show a "Custom" badge in the Status column.

---

## Step 4: Run the Ranking Computation

1. Click **Rankings** in the top navigation bar.

**What you should see:** The "Rankings" page with a subtitle "Run ranking algorithms to compute team ratings and aggregate rankings." Below it, a "Ranking Settings" card with Season and Age Group dropdowns, and a "Run Rankings" button.

2. Select the **Season** and **Age Group** matching your imported data.
3. Click **Run Rankings**.

**What you should see:** The button text changes to "Running..." with a spinner. The system runs five ranking algorithms (one Colley Matrix and four Elo variants), normalizes all scores to a 0-100 scale, and computes an aggregate rating for each team. This typically takes a few seconds.

4. When the computation finishes, the results appear automatically.

**What you should see:** A green banner showing "Ranked [N] teams" with a freshness indicator. Below it, a large results table with the following columns:

| Column                 | Description                                          |
| ---------------------- | ---------------------------------------------------- |
| Rank                   | The team's aggregate rank position                   |
| Team Name              | The team name (clickable link to team detail page)   |
| Colley Rating / Rank   | Colley Matrix algorithm score and rank               |
| Elo-2200 Rating / Rank | Elo variant with 2200 starting rating                |
| Elo-2400 Rating / Rank | Elo variant with 2400 starting rating                |
| Elo-2500 Rating / Rank | Elo variant with 2500 starting rating                |
| Elo-2700 Rating / Rank | Elo variant with 2700 starting rating                |
| AggRating              | The aggregate score (average of 5 normalized scores) |

---

## Step 5: Review the Results

1. Scroll through the results table. Teams are sorted by aggregate rank by default (best teams first).
2. Use the **Search** box above the table to find a specific team by name.
3. Use the **Region** dropdown to filter teams by geographic region.
4. Click any column header to sort by that column. Click again to reverse the sort direction.
5. Click a **team name** to view that team's detail page, which shows:
   - Ranking summary (aggregate rank, aggregate rating, overall record, tournaments played)
   - Algorithm breakdown (individual scores from all five algorithms)
   - Tournament history (every tournament result for the season)
   - Head-to-head records against other teams (if match data is available)
6. Click the back arrow to return to the main rankings table.

**What you should see:** The results table with color-coded tier rows. Top-ranked teams appear in a highlighted tier. Each team row shows all five algorithm scores along with the aggregate rating.

---

## Step 6: Apply Overrides (Optional)

If the committee decides a team should be ranked differently from what the algorithms produced, you can apply an override.

1. In the results table, click the **Adjust** button in the rightmost column for the team you want to override.

**What you should see:** A slide-out panel appears on the right side of the screen titled "Committee Override." It shows the team name and their current algorithmic rank.

2. Enter the desired **Final Seed** (the rank position you want this team to hold).
3. Type a **Justification** explaining why this override is being applied (minimum 10 characters).
4. Enter the **Committee Member** name making this decision (minimum 2 characters).
5. Click **Save Override**.

**What you should see:** The panel closes. The results table now shows a "Final Seed" column alongside the "Algo Rank" column. Teams with overrides display an "ADJ" badge next to their final seed.

---

## Step 7: Finalize the Ranking Run

Once the committee is satisfied with all results and overrides, you can finalize the run to prevent further changes.

1. Click the **Finalize Run** button at the bottom of the results page.

**What you should see:** A blue banner appears at the top stating "This ranking run has been finalized. Overrides are locked and cannot be modified." The Adjust buttons and Finalize Run button are no longer available.

**Important:** Finalization cannot be undone. Make sure all overrides are correct before finalizing.

---

## Step 8: Export the Results

1. Click the **Export** button at the bottom right of the results page.

**What you should see:** A dropdown menu appears with three options and a checkbox.

2. (Optional) Check **Include algorithm breakdowns** if you want the individual algorithm scores in your export. Leave it unchecked for a summary-only report.
3. Choose your export format:
   - **Download CSV** -- A plain text file for spreadsheet software or further data processing
   - **Download Excel** -- A formatted .xlsx file with a Rankings sheet and (if overrides exist) an Overrides sheet
   - **Download PDF** -- A formatted report suitable for printing or official distribution

**What you should see:** A file downloads to your computer. The filename follows the pattern `rankings_[AGE_GROUP]_[DATE].[ext]` (for example, `rankings_18U_2026-02-24.pdf`).

---

## Next Steps

You have completed the basic workflow. Here are some resources for more advanced tasks:

- [Importing Data](../guides/importing-data.md) -- Detailed guide on spreadsheet formats and error handling
- [Managing Tournament Weights](../guides/tournament-weights.md) -- Fine-tune how tournaments affect rankings
- [Overrides and Finalization](../guides/overrides-and-finalization.md) -- Committee override best practices
- [How Rankings Work](../explanation/ranking-algorithms.md) -- Understand the math behind the five algorithms

---

_Last updated: 2026-02-24_
