# Requirements: Rankings Dashboard

## Pre-Established Decisions

### Q1: Should the dashboard replace the current /ranking page or be a separate route?

**Decision:** Enhance the existing `/ranking` page. After running rankings, the results view becomes the dashboard with sorting, filtering, and team drill-down. The "run rankings" controls remain at the top. Add a run history dropdown so users can switch between past runs without re-running.

### Q2: How to handle H2H records when only tournament finishes are available?

**Decision:** H2H records are derived from match records in the `matches` table. If no match records exist (finishes-only data), the H2H section shows "No match data available" with a note that H2H requires individual match results to be imported. The system already checks for match records vs finishes in the ranking service.

### Q3: Should ranking run history be selectable?

**Decision:** Yes. Add a "Previous Runs" dropdown that lists past ranking runs for the selected season/age group. Selecting a previous run loads its results into the dashboard without re-running algorithms. The most recent run is shown by default.

### Q4: What does the team detail page show?

**Decision:** The team detail page at `/ranking/team/[id]` shows:

1. **Team header**: name, code, region, age group
2. **Current ranking card**: AggRank, AggRating, W%, Natl. Finish
3. **Algorithm breakdown**: All 5 ratings and ranks in a structured layout
4. **Tournament history table**: All tournament finishes for the season, with tournament name, date, division, finish position, field size
5. **H2H record summary**: Overall W-L, plus per-opponent breakdown (only when match data exists)
6. **Back to rankings link**

### Q5: What sorting and filtering options does the dashboard table support?

**Decision:**

- **Sorting**: Clickable column headers on AggRank, AggRating, W%, Team Name. Default sort: AggRank ascending. Click toggles asc/desc.
- **Filtering**: Text search on team name/code. Region dropdown filter. Both work together (AND logic).
- **All client-side**: No API pagination needed (max ~73 teams per age group).

### Q6: What data does the enhanced results API need to return?

**Decision:** The existing GET /api/ranking/results returns results and team names. Enhance it to also return team regions (add `region` to the teams query). Seeding factors are already returned from the run endpoint. Add a new GET /api/ranking/runs endpoint to list past runs for a season.
