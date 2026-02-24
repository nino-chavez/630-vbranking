# Guide: How to Run Rankings

This guide explains how to compute team rankings, understand the results table, and work with ranking run history.

---

## Selecting Season and Age Group

1. Click **Rankings** in the top navigation bar.
2. In the "Ranking Settings" card, select a **Season** from the dropdown. This determines which tournament data is used.
3. Select an **Age Group** (15U, 16U, 17U, or 18U). Rankings are computed independently for each age group.

**What you should see:** Both dropdowns show your selections. The "Run Rankings" button becomes active. If either dropdown is empty, a warning message reads: "Please select a season and age group before running rankings."

---

## Running a Ranking Computation

1. After selecting a season and age group, click **Run Rankings**.

**What you should see:** The button changes to "Running..." with a spinner animation. The system performs the following steps behind the scenes:

- Fetches all teams for the selected age group
- Fetches all tournament results for the selected season
- Loads tournament weights (if any custom weights have been set)
- Derives win/loss records from tournament finishes
- Runs the Colley Matrix algorithm (Algorithm 1)
- Runs four Elo rating variants (Algorithms 2-5) with starting ratings of 2200, 2400, 2500, and 2700
- Normalizes all five sets of ratings to a 0-100 scale
- Computes the aggregate rating (average of the five normalized scores)
- Assigns aggregate ranks and saves results

2. When the computation finishes, a green success banner appears and the results table loads automatically.

**What you should see:** A banner reading "Ranked [N] teams" with a freshness indicator showing how recently the ranking was computed. Below it, the full results table.

---

## Understanding the Results Table

The results table displays all ranked teams with their scores from each algorithm:

### Table Columns

| Column                                                          | Description                                                                                                     |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Rank** (or **Final Seed** / **Algo Rank** if overrides exist) | The team's position. 1 is best.                                                                                 |
| **Team Name**                                                   | The team name. Click it to view the team detail page.                                                           |
| **W%**                                                          | Win percentage across all tournaments (shown when seeding data is available).                                   |
| **Natl. Finish**                                                | Best finish at a Tier-1 (National Championship) tournament (shown when seeding data is available).              |
| **Colley Rating**                                               | The Colley Matrix algorithm score (raw, not normalized).                                                        |
| **Colley Rank**                                                 | The team's rank according to the Colley algorithm alone.                                                        |
| **Elo-2200 Rating / Rank**                                      | Score and rank from the Elo variant starting at 2200.                                                           |
| **Elo-2400 Rating / Rank**                                      | Score and rank from the Elo variant starting at 2400.                                                           |
| **Elo-2500 Rating / Rank**                                      | Score and rank from the Elo variant starting at 2500.                                                           |
| **Elo-2700 Rating / Rank**                                      | Score and rank from the Elo variant starting at 2700.                                                           |
| **AggRating**                                                   | The aggregate rating: the arithmetic mean of all five normalized (0-100) scores.                                |
| **Override**                                                    | An "Adjust" button for applying committee overrides (see the [Overrides Guide](overrides-and-finalization.md)). |

On smaller screens, the individual algorithm columns are hidden. Only the Rank, Team Name, AggRating, and Override columns remain visible.

### Sorting the Table

Click any column header to sort by that column. Click the same header again to reverse the sort direction. An arrow indicator (up or down) shows which column is currently sorted and in which direction.

- **Rank** and individual rank columns default to ascending order (1, 2, 3...).
- **Rating columns** and **W%** default to descending order (highest first).
- **Team Name** defaults to ascending order (A-Z).

### Filtering the Table

Above the results table, two filter controls are available:

1. **Search**: Type a team name (or partial name) into the search box to filter the table. The filter applies as you type.
2. **Region**: Select a geographic region from the dropdown to show only teams from that region. Select "All Regions" (the blank option) to remove the filter.

When filters are active, a message above the table reads: "Showing X of Y teams."

### Tier Highlighting

Rows in the results table are color-coded by tier:

- Top-ranked teams are highlighted to visually distinguish performance tiers at a glance.

---

## Viewing a Team's Detail Page

Click a team name in the results table to view their detail page. The team detail page shows:

### Ranking Summary Card

Displays four key metrics:

- **Aggregate Rank** -- The team's position in the overall ranking
- **Aggregate Rating** -- The numerical aggregate score
- **Overall Record** -- Total wins and losses (e.g., "12W - 3L")
- **Tournaments Played** -- Number of tournaments the team competed in

### Committee Adjustment Card (if applicable)

If an override has been applied to this team, a card shows:

- The algorithmic rank (before override)
- The final seed (after override)
- The justification provided by the committee member
- The name of the committee member and when the override was last updated

### Algorithm Breakdown Card

Five cards showing each algorithm's individual score and rank:

- Colley Matrix
- Elo-2200
- Elo-2400
- Elo-2500
- Elo-2700

### Tournament History Table

A table listing every tournament the team participated in during the season:

- Tournament name
- Date
- Division
- Finish position (e.g., 1st, 2nd, 3rd)
- Field size (total teams in the bracket)

### Head-to-Head Records Table

If individual match data has been imported, a table showing the team's record against each opponent:

- Opponent name
- Wins against that opponent
- Losses against that opponent
- Win percentage

If only tournament finishes have been imported (no individual match records), a notice explains that head-to-head data requires match-level imports.

---

## Viewing Previous Runs

When multiple ranking runs exist for the same season and age group, a **Previous Runs** dropdown appears above the results table.

1. Click the **Previous Runs** dropdown.
2. Select a previous run from the list. Each entry shows the date/time, age group, number of teams ranked, and whether the run is finalized.
3. The results table updates to show the selected run's data.

This allows you to compare how rankings have changed over time as new tournament data has been added.

---

## Running a New Computation

After viewing results, you can run another computation:

1. Click the **Run Again** button at the bottom of the results page.

**What you should see:** The page resets to the Season/Age Group selection view, ready for you to start a new ranking run. The previous run's data remains saved and can be accessed later through the Previous Runs dropdown.

---

## Tips

- **Run rankings after every import** to keep results up to date with the latest tournament data.
- **Check tournament weights before running** to make sure important tournaments are weighted appropriately.
- **Compare previous runs** to track how rankings shift as the season progresses.
- If a run produces unexpected results, check whether all tournament data has been imported and whether tournament weights are set correctly.

---

_Last updated: 2026-02-24_
