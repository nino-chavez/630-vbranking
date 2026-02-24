# Tasks: Rankings Dashboard

> **Spec:** [spec.md](./spec.md)
> **Strategy:** squad | **Depth:** standard
> **Tech stack:** SvelteKit + Tailwind CSS v4 + Svelte 5 runes + TypeScript + Vitest + Supabase

---

## Task Group 1: API Layer

**Dependencies:** None
**Scope:** New API endpoints and enhancements to existing endpoints. All server-side, no UI.

### Sub-tasks

- [ ] **1.1 Create ranking runs list API**
      Create file: `src/routes/api/ranking/runs/+server.ts`
  - **GET handler**: Parse `season_id` and `age_group` from query params. Both required.
  - Query `ranking_runs` joined with a count of `ranking_results` for each run:
    ```sql
    SELECT rr.id, rr.ran_at,
           (SELECT count(*) FROM ranking_results WHERE ranking_run_id = rr.id) as teams_ranked
    FROM ranking_runs rr
    WHERE rr.season_id = $season_id
    ORDER BY rr.ran_at DESC
    ```
  - Since Supabase JS doesn't support subqueries, use two queries:
    1. Fetch ranking_runs for the season, ordered by ran_at desc.
    2. For each run, count ranking_results. Or fetch all ranking_results grouped by ranking_run_id.
  - Filter by age_group: ranking_runs don't store age_group directly. Instead, check the `parameters` JSON field or count results that join to teams with the matching age_group. Simplest approach: return all runs for the season and let the client filter, OR query ranking_results joined with teams to verify age_group match.
  - **Practical approach**: Fetch ranking_runs for the season. For each run, count ranking_results. Return the list. The client already knows the age_group context.
  - Return `{ success: true, data: { runs: [...] } }`.

  Tests (in `src/routes/api/ranking/__tests__/runs-api.test.ts`):
  1. Returns runs list ordered by ran_at desc.
  2. Returns 400 when season_id is missing.

- [ ] **1.2 Enhance results API with team regions**
      Modify file: `src/routes/api/ranking/results/+server.ts`
  - Change the teams query from `.select('id, name')` to `.select('id, name, region')`.
  - Change the return format for `teams` from `Record<string, string>` to `Record<string, { name: string; region: string }>`.
  - Update the mapping loop accordingly.

- [ ] **1.3 Create team info API**
      Create file: `src/routes/api/ranking/team/[id]/+server.ts`
  - **GET handler**: Fetch team by ID from `teams` table. Return `{ success: true, data: { team: { id, name, code, region, age_group } } }`.
  - Return 404 if team not found.

- [ ] **1.4 Create team tournament history API**
      Create file: `src/routes/api/ranking/team/[id]/history/+server.ts`
  - **GET handler**: Parse `season_id` from query params (required).
  - Fetch tournament_results for the team, joining with tournaments for name/date:
    1. Get tournament IDs for the season from `tournaments` table.
    2. Fetch `tournament_results` for the team where tournament_id is in those IDs.
    3. Join with tournament name and date.
  - Return sorted by tournament date ascending.
  - Return `{ success: true, data: { history: [...] } }`.

  Tests (in `src/routes/api/ranking/__tests__/team-api.test.ts`):
  1. Returns tournament history for a team.
  2. Returns 400 when season_id is missing.

- [ ] **1.5 Create team H2H API**
      Create file: `src/routes/api/ranking/team/[id]/h2h/+server.ts`
  - **GET handler**: Parse `season_id` from query params (required).
  - Get tournament IDs for the season.
  - Fetch matches where (`team_a_id = teamId` OR `team_b_id = teamId`) AND `tournament_id` in season tournaments.
  - Group by opponent: for each match, determine the opponent and whether the team won.
  - Fetch opponent names from `teams` table.
  - Return `{ success: true, data: { total_wins, total_losses, opponents: [{ id, name, wins, losses }] } }`.
  - If no matches exist, return `{ success: true, data: { total_wins: 0, total_losses: 0, opponents: [], has_match_data: false } }`.

  Tests (in `src/routes/api/ranking/__tests__/team-api.test.ts`):
  1. Returns H2H breakdown with correct win/loss counts.
  2. Returns has_match_data: false when no matches exist.

- [ ] **1.6 Verify all API tests pass**
      Run all API tests. Expected: all pass, 0 regressions in existing tests.

### Acceptance Criteria

- GET /api/ranking/runs returns past runs with team counts.
- GET /api/ranking/results includes team regions.
- GET /api/ranking/team/[id] returns team info.
- GET /api/ranking/team/[id]/history returns tournament finishes.
- GET /api/ranking/team/[id]/h2h returns head-to-head records.
- All API tests pass.

---

## Task Group 2: Dashboard Table Enhancement

**Dependencies:** Task Group 1 (enhanced results API with regions)
**Scope:** Sorting, filtering, search, and clickable rows on the rankings table. All client-side logic.

### Sub-tasks

- [ ] **2.1 Write tests for sorting and filtering logic**
      Create file: `src/lib/ranking/__tests__/table-utils.test.ts`

  Tests (6 tests):
  1. **Sort by agg_rank ascending** (default): Verify results are ordered 1, 2, 3.
  2. **Sort by agg_rating descending**: Toggle sort on AggRating column. Verify highest rating first.
  3. **Sort by team name alphabetical**: Sort by name ascending. Verify alphabetical order.
  4. **Filter by search text**: Filter "Alp". Verify only teams with "Alp" in name or code remain.
  5. **Filter by region**: Filter "Midwest". Verify only Midwest teams shown.
  6. **Combined filter + sort**: Filter by region, then sort by rating. Verify both applied.

- [ ] **2.2 Create table utility functions**
      Create file: `src/lib/ranking/table-utils.ts`
  - `sortResults(results, teams, sortKey, sortDirection)` — sorts NormalizedTeamResult[] by the given key. For team name sorting, uses the teams map lookup.
  - `filterResults(results, teams, regions, searchText, regionFilter)` — filters by text search (name or code substring, case-insensitive) and region.
  - Type definitions for `SortKey = 'agg_rank' | 'agg_rating' | 'win_pct' | 'team_name'` and `SortDirection = 'asc' | 'desc'`.
  - All pure functions, no side effects.

- [ ] **2.3 Update RankingResultsTable with sorting, filtering, and clickable rows**
      Modify file: `src/lib/components/RankingResultsTable.svelte`
  - Add new props: `regions: Record<string, string>` (team_id → region), `rankingRunId?: string` (for team detail links).
  - Add state: `sortKey`, `sortDirection`, `searchText`, `regionFilter`.
  - Add derived: `uniqueRegions` (from regions prop), `filteredAndSorted` (apply filter then sort).
  - Add filter bar above the table: text input + region Select dropdown + result count badge.
  - Add sort indicators to clickable column headers (AggRank, AggRating, W%, Team Name).
  - Make team name cell a link to `/ranking/team/${row.team_id}?run_id=${rankingRunId}` when rankingRunId is provided. Add `cursor-pointer` to row on hover.
  - Add `aria-sort` attribute to sorted column header.

- [ ] **2.4 Update ranking page to pass new props**
      Modify file: `src/routes/ranking/+page.svelte`
  - Extract regions from the enhanced results API response (teams now includes region).
  - Build `regions` Record from teams data.
  - Pass `regions` and `rankingRunId` to `RankingResultsTable`.
  - Update the `teamNames` state to work with the new `{ name, region }` format.

- [ ] **2.5 Verify table enhancement tests pass**
      Run `src/lib/ranking/__tests__/table-utils.test.ts`. Expected: 6 tests pass.

### Acceptance Criteria

- Table columns are sortable by clicking headers.
- Sort direction toggles and shows visual indicator.
- Text search filters by team name/code in real-time.
- Region dropdown filters by region.
- Clicking a team row navigates to the team detail page.
- "Showing X of Y teams" appears when filters are active.

---

## Task Group 3: Ranking Run History

**Dependencies:** Task Group 1 (runs list API)
**Scope:** Add run history dropdown to ranking page.

### Sub-tasks

- [ ] **3.1 Add run history state and fetch logic**
      Modify file: `src/routes/ranking/+page.svelte`
  - Add state: `previousRuns: Array<{ id: string; ran_at: string; teams_ranked: number }>`, `selectedRunId: string`.
  - After running rankings, fetch run history: `GET /api/ranking/runs?season_id=...`.
  - When a previous run is selected, fetch its results: `GET /api/ranking/results?ranking_run_id=...`.
  - Auto-select the newly created run after running rankings.

- [ ] **3.2 Add run history UI**
      Modify file: `src/routes/ranking/+page.svelte`
  - In the results view, add a `Select` dropdown for "Previous Runs" above the table.
  - Options formatted as: "Feb 23, 2026 at 11:19 PM — 42 teams".
  - Selecting a different run triggers a results fetch and updates the table.
  - Show the selected run's metadata in the success banner.

- [ ] **3.3 Verify run history works end-to-end**
      Manual verification: Run rankings twice, verify both runs appear in dropdown, switching between them loads correct results.

### Acceptance Criteria

- Previous runs dropdown appears after running rankings.
- Selecting a past run loads its results without re-running algorithms.
- Most recent run is selected by default.

---

## Task Group 4: Team Detail Page

**Dependencies:** Task Groups 1 and 2 (APIs + clickable rows)
**Scope:** The `/ranking/team/[id]` page with all sections.

### Sub-tasks

- [ ] **4.1 Create team detail page server load**
      Create file: `src/routes/ranking/team/[id]/+page.server.ts`
  - Parse `id` from route params, `run_id` from URL query params.
  - Fetch in parallel:
    1. Team info from `teams` table.
    2. Ranking results for this team from `ranking_results` where `ranking_run_id = run_id` and `team_id = id`.
    3. Ranking run metadata from `ranking_runs` to get `season_id`.
    4. Tournament history: join `tournament_results` with `tournaments` for the season.
    5. H2H records from `matches` for the season's tournaments.
    6. Seeding factors: compute from available data (or fetch from run response if stored).
  - Return all data to the page.

- [ ] **4.2 Create team detail page component**
      Create file: `src/routes/ranking/team/[id]/+page.svelte`
  - Use `PageHeader` with team name and subtitle "{code} | {region} | {age_group}".
  - **Ranking Summary**: Card with AggRank (RankBadge, large), AggRating, W%, Natl. Finish in a grid layout.
  - **Algorithm Breakdown**: Card with a 5-row layout. Each row: algorithm name, rating (formatted), rank. Use semantic colors for rank badges.
  - **Tournament History**: Card wrapping a DataTable. Columns: Tournament, Date, Division, Finish, Field Size. TierRow coloring not needed here (use plain rows). Empty state: "No tournament results found."
  - **H2H Records**: Card with overall W-L at top. Then DataTable with Opponent, Wins, Losses, Win %. If `has_match_data` is false, show info Banner: "Head-to-head records require individual match results to be imported."
  - **Navigation**: "Back to Rankings" link at top using a subtle button/link style.

- [ ] **4.3 Write tests for team detail page data loading**
      Create file: `src/routes/ranking/team/__tests__/team-detail.test.ts`

  Tests (3 tests):
  1. **Page loads team info**: Mock supabase, verify team name/code/region returned.
  2. **Tournament history sorted by date**: Verify results ordered by tournament date ascending.
  3. **H2H computes correct win/loss**: Verify opponent breakdown totals match.

- [ ] **4.4 Add ordinal formatting helper**
      The `toOrdinal()` function already exists in `RankingResultsTable.svelte`. Extract it to a shared utility so the team detail page can reuse it.
      Create file: `src/lib/utils/format.ts`
  - Export `toOrdinal(n: number): string` — converts 1→"1st", 2→"2nd", 3→"3rd", etc.
  - Export `formatDate(dateStr: string): string` — formats ISO date as "Feb 23, 2026".
  - Update `RankingResultsTable.svelte` to import from this utility.

- [ ] **4.5 Verify team detail page tests pass**
      Run team detail tests. Expected: all pass.

### Acceptance Criteria

- `/ranking/team/[id]?run_id=...` renders all 5 sections.
- Algorithm breakdown shows all 5 algorithms with ratings and ranks.
- Tournament history shows all finishes for the season.
- H2H records show per-opponent breakdown or "no match data" message.
- Back link returns to the rankings page.
- All team detail tests pass.

---

## Task Group 5: Integration & Final Verification

**Dependencies:** Task Groups 1-4
**Scope:** End-to-end verification, edge cases, full test suite run.

### Sub-tasks

- [ ] **5.1 Run full test suite**
      Execute `npx vitest run` and verify all tests pass (existing + new).
      Document total test count.

- [ ] **5.2 Verify no TypeScript errors**
      Run `npx svelte-check --tsconfig tsconfig.json` if available, or verify no IDE errors in modified files.

- [ ] **5.3 Update NavHeader if needed**
      Verify that the "Rankings" link correctly highlights for both `/ranking` and `/ranking/team/*` paths. The existing `isActive` function uses `startsWith`, so `/ranking/team/...` should already activate the "Rankings" link. Verify this.

- [ ] **5.4 Edge case: empty results**
      Verify the dashboard handles:
  - No ranking runs exist for the season (show only the run form).
  - A ranking run with 0 results (empty table with message).
  - Team detail page for a team with no tournament history.
  - Team detail page when no match data exists (H2H shows info banner).

### Acceptance Criteria

- All tests pass (0 regressions).
- No TypeScript errors.
- Edge cases handled gracefully.
- Navigation active states work correctly.
