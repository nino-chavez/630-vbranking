# Initialization: Rankings Dashboard

## Feature Context

Roadmap Feature 6: Build a sortable, filterable rankings table displaying each team's AggRank, AggRating, W/L record, and region. Include a team detail view that shows the full tournament history, per-algorithm rating breakdown (Colley + 4 Elo scores), and head-to-head record against other ranked teams. Apply the design system from Feature 5.

## Existing Infrastructure

- **Ranking page** (`/ranking`): Runs algorithms and displays basic results table. Currently a "run rankings" interface, not a browsable dashboard.
- **RankingResultsTable**: Shows Rank, Team Name, W%, Natl. Finish, 5 algo ratings/ranks, AggRating. No sorting, filtering, or clickable rows.
- **Design system**: 11 reusable components (Card, DataTable, Select, Button, Banner, PageHeader, TierRow, RankBadge, FreshnessIndicator, Spinner, PageShell).
- **API endpoints**: POST /api/ranking/run, GET /api/ranking/results, GET+PUT /api/ranking/weights.
- **Database schema**: teams (with region, age_group), tournaments, tournament_results (finish_position, field_size), matches (team_a, team_b, winner), ranking_runs, ranking_results.
- **112 tests** across 28 files, all passing.

## What Needs Building

1. **Enhanced rankings table** with client-side sorting and region/search filtering
2. **Team detail page** (`/ranking/team/[id]`) with tournament history, per-algorithm breakdown, H2H records
3. **New API endpoints** for team detail data (history, H2H)
4. **Ranking run history** — ability to view previous ranking runs, not just the latest
5. **Enhanced results API** to include team region data

## Scope Boundaries

- No chart visualizations (sparklines, bar charts) — defer to future
- No real-time updates or WebSocket — static dashboard
- No team comparison view — defer to future
- Export functionality is Feature 8 — not in scope
- Manual overrides are Feature 7 — not in scope

## Key Decisions to Resolve

1. Should the dashboard replace the current /ranking page or be a separate route?
2. How to handle H2H records when only tournament finishes are available (no match records)?
3. Should ranking run history be selectable, or always show the latest?
