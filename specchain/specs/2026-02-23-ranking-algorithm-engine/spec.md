# Specification: Ranking Algorithm Engine

## Goal

Implement the five mathematical rating models -- Colley Matrix and four Elo variants (starting ratings 2200, 2400, 2500, 2700) -- that compute independent ratings and ranks per team, then produce a unified AggRating (0-100 normalized scale) and AggRank from their combined outputs. Provide a server-side ranking service, an API endpoint to trigger ranking runs, and a minimal UI with a "Run Rankings" button and results table.

## User Stories

- As a ranking committee member, I want to trigger a full ranking computation for a season and age group so that all teams receive up-to-date ratings across all five algorithms.
- As a ranking committee member, I want to see each team's individual algorithm ratings and ranks alongside the unified AggRating and AggRank so that I can understand how different models evaluate each team.
- As a ranking committee member, I want rankings computed from tournament finish data (pairwise W/L derived from finish positions) so that the system works immediately with existing imported data.
- As a ranking committee member, I want each ranking run stored as a snapshot so that I can compare rankings over time as new tournament data is added.
- As a system integrator, I want a programmatic API endpoint to trigger ranking runs so that future automation or scheduling can invoke the engine without the web UI.

## Core Requirements

### Functional Requirements

#### F1: Pairwise W/L Derivation from Tournament Finishes

- For each tournament+division combination in `tournament_results`, generate pairwise win/loss records: if Team A has a lower `finish_position` than Team B in the same tournament and division, Team A gets a win and Team B gets a loss.
- Each pair of teams that co-participated in a tournament+division produces exactly one W/L record (one win for the higher-finishing team, one loss for the lower-finishing team).
- Teams that did not co-participate in any tournament+division have zero head-to-head records.
- Filter tournament results by season (via `tournaments.season_id`) and by age group (via `teams.age_group`).

#### F2: Match Record Support (Fallback Path)

- When records exist in the `matches` table for tournaments in the selected season, use those as the primary data source instead of derived finishes.
- A match record provides a direct W/L: `winner_id` wins, the other team loses. Matches with `winner_id = null` (draws) are skipped.
- For the initial implementation, derived finishes are the default. The engine should check for match records and prefer them when available, but no match ingestion UI is built in this feature.

#### F3: Colley Matrix Algorithm (algo1)

- Construct the Colley matrix `C` and right-hand-side vector `b` from cumulative pairwise W/L records across all tournaments in the season:
  - `C[i][i] = 2 + total_games_i` (total games played by team i).
  - `C[i][j] = -games_between_i_and_j` (for i != j, the number of games between teams i and j).
  - `b[i] = 1 + (wins_i - losses_i) / 2`.
- Solve the linear system `Cr = b` using LU decomposition from the `ml-matrix` library.
- The solution vector `r` contains the Colley rating for each team.
- Rank teams by Colley rating descending (rank 1 = highest rating). Break ties by alphabetical team name.
- Store results in `algo1_rating` and `algo1_rank`.

#### F4: Elo Variant Algorithms (algo2-algo5)

- Implement a single parameterized Elo function that accepts a starting rating and produces final ratings for all teams.
- **Four variants**, differing only in starting rating:
  - algo2: starting rating 2200
  - algo3: starting rating 2400
  - algo4: starting rating 2500
  - algo5: starting rating 2700
- **Elo formula:**
  - Expected score: `E_A = 1 / (1 + 10^((R_B - R_A) / 400))`
  - Rating update: `New_R_A = R_A + K * (S_A - E_A)` where `S_A = 1` for a win, `S_A = 0` for a loss.
  - Default K-factor: `K = 32`.
- **Chronological processing:** Retrieve all tournaments for the season ordered by `tournaments.date` ascending. For each tournament, process all pairwise results from that tournament before moving to the next. This simulates rating evolution over the season.
- Within a single tournament, process all pairwise matchups. Both teams in each pair are updated after each matchup (winner gains, loser loses).
- Rank teams by final Elo rating descending (rank 1 = highest). Break ties by alphabetical team name.
- Store results in the corresponding `algo[N]_rating` and `algo[N]_rank` fields.

#### F5: AggRating Computation

- After all five algorithms have produced ratings, normalize each algorithm's ratings to a 0-100 scale using min-max normalization:
  - `normalized = (rating - min_rating) / (max_rating - min_rating) * 100`
  - If all teams have the same rating for an algorithm (max = min), assign 50.0 to all teams for that algorithm.
- Compute `agg_rating` as the arithmetic mean of the five normalized ratings for each team.
- Store `agg_rating` with two decimal places of precision.

#### F6: AggRank Computation

- Rank teams by `agg_rating` descending. Rank 1 = highest AggRating.
- Break ties by alphabetical team name (consistent with individual algorithm ranking).
- Store as `agg_rank` (integer).

#### F7: Ranking Run Orchestration

- A ranking run is a single execution of all five algorithms for a given season.
- **Flow:**
  1. Create a `ranking_runs` record with `season_id`, `ran_at = now()`, and `parameters` JSON containing: `{ k_factor: 32, elo_starting_ratings: [2200, 2400, 2500, 2700], data_source: 'tournament_finishes' | 'match_records' }`.
  2. Fetch all tournament results (or match records) for the season, filtered by age group.
  3. Derive pairwise W/L records.
  4. Execute the Colley Matrix algorithm.
  5. Execute all four Elo variants.
  6. Compute normalized ratings, AggRating, and AggRank.
  7. Batch-insert all `ranking_results` rows for this run.
- If any step fails, the run should not leave partial results in the database. Delete the `ranking_runs` record and any `ranking_results` rows that were inserted.

#### F8: API Endpoint

- `POST /api/ranking/run` triggers a ranking run.
- Request body (JSON): `{ season_id: string (UUID), age_group: string (enum) }`.
- Response (success): `{ success: true, data: { ranking_run_id: string, teams_ranked: number, ran_at: string } }`.
- Response (error): `{ success: false, error: string }` with appropriate HTTP status code (400 for bad input, 500 for engine failure).
- Validate `season_id` exists in `seasons` table and `age_group` is a valid enum value before proceeding.

#### F9: Minimal UI

- New page at `/ranking` route.
- **Controls:**
  - Season dropdown (populated from `seasons` table).
  - Age group dropdown (from `AgeGroup` enum).
  - "Run Rankings" button. Disabled until both season and age group are selected. Shows a loading spinner while the run is in progress.
- **Results display:**
  - After a successful run, show results in a table sorted by `agg_rank` ascending.
  - Table columns: Rank (agg_rank), Team Name, Colley Rating, Colley Rank, Elo-2200 Rating, Elo-2200 Rank, Elo-2400 Rating, Elo-2400 Rank, Elo-2500 Rating, Elo-2500 Rank, Elo-2700 Rating, Elo-2700 Rank, AggRating, AggRank.
  - Rating values displayed to 2 decimal places.
- **States:** idle (selectors + button), running (spinner), results (table), error (banner with retry).

### Non-Functional Requirements

- **NF1: Performance** -- A full ranking run for 73 teams across up to 60 tournaments must complete in under 5 seconds, including database reads and writes.
- **NF2: Determinism** -- Given the same input data, the engine must produce identical ratings and ranks every time. No randomness in tie-breaking or processing order.
- **NF3: Type safety** -- All algorithm inputs and outputs flow through TypeScript types. Rating values are `number`, rank values are `number` (integer). No `any` types in the ranking module.
- **NF4: Testability** -- Algorithm functions must be pure (accept data, return results) and testable without a database connection. Database interaction is isolated in the service layer.
- **NF5: Numerical precision** -- Ratings are stored and compared as floating-point numbers. Use at least 6 significant digits internally; round to 2 decimal places only for display and `agg_rating` storage.

## Reusable Components

### Existing Code to Leverage

| Component | Location | Usage |
|---|---|---|
| `rankingRunInsertSchema` | `src/lib/schemas/ranking-run.ts` | Validate ranking run records before insert |
| `rankingResultInsertSchema` | `src/lib/schemas/ranking-result.ts` | Validate each ranking result row before batch insert |
| `tournamentResultSchema` | `src/lib/schemas/tournament-result.ts` | Type reference for reading tournament results |
| `matchSchema` | `src/lib/schemas/match.ts` | Type reference for reading match records |
| `AgeGroup` enum | `src/lib/schemas/enums.ts` | Validate age group parameter, populate UI selector |
| `Database` types | `src/lib/types/database.types.ts` | Type-safe Supabase queries for `ranking_runs`, `ranking_results`, `tournament_results`, `matches`, `tournaments`, `teams` |
| `supabaseServer` | `src/lib/supabase-server.ts` | Server-side Supabase client for all DB reads and writes |
| `ImportService` pattern | `src/lib/import/import-service.ts` | Reference pattern for service class with Supabase client constructor injection |
| Import page pattern | `src/routes/import/+page.svelte` | Reference for multi-step Svelte 5 page with `$state`/`$derived` runes and step-based rendering |
| Upload API pattern | `src/routes/api/import/upload/+server.ts` | Reference for `POST` request handler with validation and JSON response |

## New Components Required

| Component | Location | Purpose |
|---|---|---|
| **Types** | `src/lib/ranking/types.ts` | Type definitions: `PairwiseRecord` (team_a_id, team_b_id, winner_id, tournament_id), `AlgorithmResult` (team_id, rating, rank), `RankingRunConfig` (season_id, age_group, k_factor, elo_starting_ratings), `RankingRunOutput` (run_id, results array). |
| **W/L Derivation** | `src/lib/ranking/derive-wins-losses.ts` | Pure function that takes tournament results (grouped by tournament+division) and returns an array of `PairwiseRecord` objects. Handles both finish-derived and match-based sources. |
| **Colley Algorithm** | `src/lib/ranking/colley.ts` | Pure function: accepts `PairwiseRecord[]` and team ID list, constructs the Colley matrix and b vector, solves via `ml-matrix` LU decomposition, returns `AlgorithmResult[]`. |
| **Elo Algorithm** | `src/lib/ranking/elo.ts` | Pure function: accepts `PairwiseRecord[]` grouped by tournament (chronologically ordered), a starting rating, and K-factor, returns `AlgorithmResult[]`. |
| **Normalization** | `src/lib/ranking/normalize.ts` | Pure function: accepts a map of algorithm names to `AlgorithmResult[]`, applies min-max normalization per algorithm, computes AggRating (average) and AggRank, returns final results. |
| **RankingService** | `src/lib/ranking/ranking-service.ts` | Orchestrator class with Supabase client. Methods: `runRanking(config)` which fetches data, calls algorithms, normalizes, and writes results. Handles error cleanup (delete partial run on failure). |
| **API endpoint** | `src/routes/api/ranking/run/+server.ts` | `POST` handler: validates request, instantiates `RankingService`, calls `runRanking()`, returns JSON response. |
| **Ranking page** | `src/routes/ranking/+page.svelte` | Minimal UI: season/age group selectors, "Run Rankings" button, results table. Uses Svelte 5 runes for state. |
| **Ranking page server** | `src/routes/ranking/+page.server.ts` | Server-side load function to fetch seasons for the dropdown. |
| **RankingResultsTable** | `src/lib/components/RankingResultsTable.svelte` | Table component displaying ranking results with all algorithm columns. Accepts an array of result rows as a prop. |

## Technical Approach

### Database

**Tables read during a ranking run:**
- `seasons` -- validate season_id exists
- `teams` -- get team list for the selected age group (id, name, code)
- `tournaments` -- get tournaments for the season, ordered by date ascending (for Elo chronological processing)
- `tournament_results` -- get all finish records for relevant tournaments, joined with teams (filtered by age group) and tournaments (filtered by season)
- `matches` -- check for match records as alternative data source (future path)

**Tables written during a ranking run:**
- `ranking_runs` -- one new row per run
- `ranking_results` -- one row per team per run (batch insert)

**Cleanup on failure:**
- If algorithm execution or result insertion fails after the `ranking_runs` row is created, delete the run row (cascade will handle any partial `ranking_results` if FK cascade is configured, otherwise delete `ranking_results` first).

### Algorithms

**Data preparation flow:**
1. Query `tournament_results` joined with `tournaments` (for date ordering) and `teams` (for age group filtering).
2. Group results by `tournament_id + division`.
3. Within each group, generate pairwise W/L: for every pair of teams (i, j) where `finish_position_i < finish_position_j`, emit one record: team i wins over team j.
4. Pass the full list of pairwise records to Colley (cumulative, order does not matter).
5. Pass the pairwise records grouped by tournament (ordered by tournament date) to each Elo variant.

**Colley Matrix construction:**
- Build team-index mapping (team_id -> matrix index 0..N-1).
- Initialize C as N x N identity matrix scaled by 2 (C[i][i] = 2).
- For each pairwise record, increment C[winner_idx][winner_idx] and C[loser_idx][loser_idx] by 1, and decrement C[winner_idx][loser_idx] and C[loser_idx][winner_idx] by 1.
- Build b vector: b[i] = 1 + (wins_i - losses_i) / 2.
- Solve using `new Matrix(C).solve(Matrix.columnVector(b))`.

**Elo processing:**
- Initialize all teams to the starting rating.
- For each tournament (by date ascending), for each pairwise result in that tournament, update both teams' ratings using the Elo formula.
- After all tournaments are processed, the final rating map is the output.

### API

**`POST /api/ranking/run`**
- Content-Type: `application/json`
- Body: `{ season_id: string, age_group: string }`
- Validates season_id against `seasons` table (must exist).
- Validates age_group against `AgeGroup` enum.
- Calls `RankingService.runRanking()`.
- Returns `{ success: true, data: { ranking_run_id, teams_ranked, ran_at } }` on success.
- Returns `{ success: false, error: string }` with 400/500 status on failure.

### Frontend

**Page route:** `/ranking`

**Component hierarchy:**
```
+page.svelte (ranking page)
  ContextSelectors (season, age group dropdowns)
  RunButton ("Run Rankings" with loading state)
  RankingResultsTable (sortable results display)
  ErrorBanner (on failure, with retry)
```

**State management (Svelte 5 runes):**
- `step`: `'idle' | 'running' | 'results' | 'error'`
- `selectedSeasonId`: string
- `selectedAgeGroup`: string
- `rankingResults`: array of result rows (from API response or fetched after run)
- `runSummary`: `{ ranking_run_id, teams_ranked, ran_at }`
- `errorMessage`: string
- `contextReady`: `$derived` -- true when both season and age group are selected

**Interaction flow:**
1. User selects season and age group from dropdowns.
2. User clicks "Run Rankings". Button shows spinner; selectors disabled.
3. Client sends `POST /api/ranking/run` with `{ season_id, age_group }`.
4. On success, client fetches the ranking results for the returned `ranking_run_id` and displays them in the table.
5. On error, displays error banner with a "Try Again" button.

### Testing

**Unit tests (Vitest) -- `src/lib/ranking/__tests__/`:**

- `derive-wins-losses.test.ts` -- Test pairwise derivation: 3 teams in a tournament with finishes 1, 2, 3 should produce 3 pairwise records. Test filtering by division. Test with single team (no pairs). Test with ties in finish position (same finish = no W/L between those teams).
- `colley.test.ts` -- Test with a known 3-team example where hand-computed Colley ratings can be verified. Test with a single team (should get rating 0.5). Test that the matrix is correctly symmetric. Test tie-breaking by alphabetical name.
- `elo.test.ts` -- Test with a 2-team single-game scenario: verify rating changes match the formula. Test chronological processing (two tournaments, verify the second tournament uses updated ratings from the first). Test all four starting ratings produce different final ratings but same relative ranks for simple cases.
- `normalize.test.ts` -- Test min-max normalization: verify that the best team gets 100 and worst gets 0 per algorithm. Test equal-rating edge case (all teams get 50). Test AggRating is the arithmetic mean of normalized values. Test AggRank ordering.
- `ranking-service.test.ts` -- Test the full orchestration with mocked Supabase client. Verify that a ranking run record is created, results are inserted, and the correct data flows through each step. Test error cleanup (partial run deletion on failure).

**Test fixtures:**
- Define small datasets (3-5 teams, 2-3 tournaments) with hand-computable expected results.
- Store as typed constants in test files (no external fixture files needed for pure algorithm tests).

## Out of Scope

- **Tournament weighting** -- All tournaments are weighted equally. Tournament tier-based weighting is Feature 4.
- **Full rankings dashboard** -- Filtering, sorting, team detail views, historical comparison, and polished styling are Feature 6. This feature provides only a minimal results table.
- **Manual overrides and committee adjustments** -- Feature 7.
- **Export and reporting** -- CSV/PDF export of rankings is Feature 8.
- **Match data ingestion** -- No UI or pipeline for importing match-level data. The engine supports match records structurally but relies on finish-derived W/L for now.
- **Elo K-factor tuning** -- K=32 is fixed. Per-tournament-tier K-factor adjustment is Feature 4 territory.
- **Authentication and authorization** -- No auth on the ranking API endpoint. Deferred until an auth feature is implemented.
- **Scheduling or auto-run** -- No cron jobs or triggers to auto-run rankings when new data is imported.
- **Rating history visualization** -- No charts or graphs showing rating changes over time. Deferred to Feature 6.

## Success Criteria

1. **Colley correctness**: Given a 3-team dataset with known W/L records, the Colley algorithm produces ratings that match hand-computed values to within 0.0001.
2. **Elo correctness**: Given a 2-team single-game scenario, the Elo rating update matches the formula `R_new = R_old + 32 * (S - E)` to within 0.0001 for all four starting rating variants.
3. **Pairwise derivation accuracy**: Given 5 teams with finish positions 1-5 in a single tournament, the engine produces exactly 10 pairwise records (C(5,2) = 10) with the correct winners.
4. **Normalization**: The best-rated team per algorithm receives a normalized score of 100.00, the worst receives 0.00, and the AggRating is the arithmetic mean of the five normalized scores.
5. **Determinism**: Running the engine twice with identical input data produces byte-identical `ranking_results` rows (same ratings, same ranks).
6. **Run persistence**: After a successful run, the `ranking_runs` row exists with correct `season_id` and `parameters` JSON, and exactly one `ranking_results` row exists per team.
7. **Error cleanup**: If the engine fails mid-run (e.g., ml-matrix throws), no orphaned `ranking_runs` or partial `ranking_results` rows remain in the database.
8. **API contract**: The `POST /api/ranking/run` endpoint returns a valid JSON response with `ranking_run_id` on success, and a descriptive error message with appropriate HTTP status on failure.
9. **UI functionality**: A user can select a season and age group, click "Run Rankings", and see a table of results sorted by AggRank within 10 seconds of clicking.
10. **Test coverage**: Unit tests cover all algorithm edge cases (zero games, single team, all teams tied, large rating gaps for Elo). All algorithm functions have at least one test with hand-verified expected output.
