# Spec: Rankings Dashboard

> **Roadmap Feature:** 6 — Rankings Dashboard
> **Size:** L
> **Dependencies:** Features 1-5 (all complete)
> **Tech Stack:** SvelteKit + Tailwind CSS v4 + Svelte 5 runes + TypeScript + Vitest + Supabase

---

## Overview

Transform the existing ranking execution page into a full-featured rankings dashboard. Add sortable/filterable rankings table, team detail drill-down pages, ranking run history, and head-to-head record views. The dashboard is the primary interface for committee members reviewing and validating rankings before seeding decisions.

---

## Functional Requirements

### F1: Enhanced Rankings Table

The existing RankingResultsTable gains sorting, filtering, and clickable team rows.

- **Sortable columns**: AggRank (default), AggRating, W%, Team Name. Click header to sort; click again to toggle direction. Visual indicator (arrow) on active sort column.
- **Text search**: Input field above table. Filters by team name or code (case-insensitive substring match). Debounced at 200ms.
- **Region filter**: Dropdown showing all unique regions from the result set. Selecting a region filters the table. "All Regions" option clears the filter.
- **Combined filters**: Search and region filter use AND logic. Sorting applies after filtering.
- **Clickable rows**: Each team row links to `/ranking/team/[teamId]?run_id=[rankingRunId]`. Cursor changes to pointer on hover.
- **Result count**: "Showing X of Y teams" indicator below filters when filters are active.
- **All client-side**: No API pagination. The full result set (~73 teams max) is loaded once and filtered/sorted in memory.

### F2: Ranking Run History

Users can view results from previous ranking runs without re-executing algorithms.

- **Runs list API**: New `GET /api/ranking/runs?season_id=...&age_group=...` returns recent ranking runs ordered by `ran_at` descending.
- **Run selector**: Dropdown on the ranking page showing past runs (formatted as "Run on {date} — {teams_ranked} teams"). Selecting a run loads its results.
- **Default behavior**: After running rankings, the new run is automatically selected. On page load with no run yet executed, show the "Run Rankings" form only.
- **Run metadata**: Display the selected run's timestamp and team count in the results banner.

### F3: Team Detail Page

A dedicated page showing comprehensive data for a single team.

**Route:** `/ranking/team/[id]`
**Query param:** `run_id` (required) — the ranking run to show context for.

**Sections:**

1. **Team Header**: Team name, code, region, age group. Back link to `/ranking`.
2. **Ranking Summary Card**: AggRank (large, with RankBadge), AggRating, W%, Best National Finish. Side-by-side layout.
3. **Algorithm Breakdown**: Card showing all 5 algorithms — name, rating, rank — in a clean grid. Colley Matrix, Elo-2200, Elo-2400, Elo-2500, Elo-2700.
4. **Tournament History**: Table of all tournament finishes for the team in the season. Columns: Tournament Name, Date, Division, Finish Position, Field Size. Sorted by date ascending.
5. **Head-to-Head Records**: If match data exists — overall W-L record, then per-opponent table: Opponent Name, Wins, Losses, Win %. If no match data — info banner: "Head-to-head records require individual match results."
6. **Navigation**: "Back to Rankings" link at top and bottom.

### F4: Team Detail API Endpoints

- **GET /api/ranking/team/[id]**: Returns team info (name, code, region, age_group).
- **GET /api/ranking/team/[id]/history?season_id=...**: Returns tournament history for the team in the given season. Joins tournament_results with tournaments for names/dates.
- **GET /api/ranking/team/[id]/h2h?season_id=...**: Returns head-to-head records derived from the `matches` table. Filters to matches involving this team in the season's tournaments. Groups by opponent, counts wins/losses.

### F5: Enhanced Results API

Augment the existing GET /api/ranking/results to include team regions.

- Add `region` field to the teams query (currently only fetches `id, name`).
- Return `teams` as `Record<string, { name: string; region: string }>` instead of `Record<string, string>`.
- Backward compatible: existing consumers that treat teams as strings will need updating (only the ranking page).

### F6: Runs List API

New endpoint for listing past ranking runs.

- **GET /api/ranking/runs?season_id=...&age_group=...**: Returns array of `{ id, ran_at, teams_ranked }` ordered by `ran_at` descending. The `teams_ranked` count is derived from counting ranking_results for each run.

---

## Non-Functional Requirements

- **NF1**: All filtering and sorting is client-side. No additional API calls after initial data load.
- **NF2**: Team detail page loads in a single server-side fetch (page.server.ts), no client-side waterfall.
- **NF3**: All new components use the existing design system tokens and Svelte 5 runes.
- **NF4**: Accessible: sortable columns have `aria-sort`, search has `aria-label`, team links have descriptive text.

---

## Success Criteria

1. Rankings table supports sorting by 4 columns with visual direction indicator.
2. Text search filters teams by name or code in real-time.
3. Region dropdown filters to teams from a specific region.
4. Clicking a team row navigates to the team detail page.
5. Team detail page shows ranking summary, algorithm breakdown, tournament history, and H2H records.
6. Previous ranking runs can be selected from a dropdown to view historical results.
7. All existing tests continue to pass (0 regressions).
8. New tests cover sorting logic, filtering logic, API endpoints, and team detail data.

---

## Out of Scope

- Chart visualizations (sparklines, bar charts, radar charts)
- Team comparison side-by-side view
- CSV/PDF export (Feature 8)
- Manual overrides (Feature 7)
- Real-time updates
- Server-side pagination (unnecessary for ~73 teams)
