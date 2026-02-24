# Tasks: Ranking Algorithm Engine

> **Spec:** [spec.md](./spec.md)
> **Strategy:** squad | **Depth:** standard
> **Tech stack:** SvelteKit + Supabase + TypeScript + Zod v4 + Vitest + ml-matrix + Tailwind CSS

---

## Task Group 1: Algorithm Implementations

**Assigned implementer:** `database-engineer`
**Verified by:** `backend-verifier`
**Dependencies:** Feature 1 (Data Model & Database Schema) must be complete -- Zod schemas in `src/lib/schemas/`, Supabase types in `src/lib/types/database.types.ts`, enums in `src/lib/schemas/enums.ts`, and `ml-matrix` installed as a dependency.

Build the core computational layer: ranking module types, pairwise W/L derivation from tournament finishes, the Colley Matrix algorithm, the parameterized Elo algorithm, and the normalization/aggregation functions. All algorithm functions are pure (no database access) and fully testable in isolation.

### Sub-tasks

- [x] **1.1 Define ranking module types**
      Create file: `src/lib/ranking/types.ts`
      Define and export the following types:
  - `PairwiseRecord`: `{ team_a_id: string, team_b_id: string, winner_id: string, tournament_id: string }` -- represents a single head-to-head result between two teams.
  - `TournamentPairwiseGroup`: `{ tournament_id: string, tournament_date: string, records: PairwiseRecord[] }` -- pairwise records grouped by tournament for chronological Elo processing.
  - `AlgorithmResult`: `{ team_id: string, rating: number, rank: number }` -- output of a single algorithm for one team.
  - `AlgorithmResultMap`: `Record<string, AlgorithmResult[]>` -- keyed by algorithm name (`'algo1' | 'algo2' | 'algo3' | 'algo4' | 'algo5'`), each entry is the full result set for that algorithm.
  - `NormalizedTeamResult`: `{ team_id: string, algo1_rating: number, algo1_rank: number, algo2_rating: number, algo2_rank: number, algo3_rating: number, algo3_rank: number, algo4_rating: number, algo4_rank: number, algo5_rating: number, algo5_rank: number, agg_rating: number, agg_rank: number }` -- final output row per team.
  - `RankingRunConfig`: `{ season_id: string, age_group: string, k_factor: number, elo_starting_ratings: number[] }` -- configuration for a ranking run.
  - `RankingRunOutput`: `{ ranking_run_id: string, results: NormalizedTeamResult[], teams_ranked: number, ran_at: string }` -- full output of a ranking run.
  - `TeamInfo`: `{ id: string, name: string, code: string }` -- minimal team reference for tie-breaking.

- [x] **1.2 Implement pairwise W/L derivation from tournament finishes**
      Create file: `src/lib/ranking/derive-wins-losses.ts`
  - Export function `deriveWinsLossesFromFinishes(tournamentResults: Array<{ team_id: string, tournament_id: string, division: string, finish_position: number }>, tournamentDates: Map<string, string>): TournamentPairwiseGroup[]`:
    - Group tournament results by `tournament_id + division`.
    - Within each group, generate all pairwise combinations: for every pair (i, j) where `finish_position_i < finish_position_j`, create a `PairwiseRecord` with `winner_id = team_i`, `team_a_id = team_i`, `team_b_id = team_j`.
    - Teams with identical finish positions within the same tournament+division produce NO pairwise record between them (tied teams have no W/L against each other).
    - Group the resulting records by `tournament_id` and attach `tournament_date` from the dates map.
    - Sort the `TournamentPairwiseGroup[]` by `tournament_date` ascending (for Elo chronological processing).
    - Return the sorted array.
  - Export function `deriveWinsLossesFromMatches(matches: Array<{ team_a_id: string, team_b_id: string, winner_id: string | null, tournament_id: string }>, tournamentDates: Map<string, string>): TournamentPairwiseGroup[]`:
    - Filter out matches where `winner_id` is null (draws).
    - Convert each match to a `PairwiseRecord`.
    - Group by tournament and sort chronologically, same as above.
  - Export function `flattenPairwiseGroups(groups: TournamentPairwiseGroup[]): PairwiseRecord[]`:
    - Flatten all groups into a single array (used by Colley, which does not need chronological ordering).

- [x] **1.3 Implement the Colley Matrix algorithm**
      Create file: `src/lib/ranking/colley.ts`
  - Export function `computeColleyRatings(pairwiseRecords: PairwiseRecord[], teams: TeamInfo[]): AlgorithmResult[]`:
    - Build a team-index mapping: `team_id -> index (0..N-1)` from the `teams` array.
    - Initialize the Colley matrix `C` as an N x N matrix where `C[i][i] = 2` and all off-diagonal entries are 0.
    - Initialize the right-hand-side vector `b` where `b[i] = 1` for all i.
    - For each `PairwiseRecord`:
      - Determine winner index and loser index.
      - Increment `C[winner_idx][winner_idx]` by 1 (total games for winner).
      - Increment `C[loser_idx][loser_idx]` by 1 (total games for loser).
      - Decrement `C[winner_idx][loser_idx]` by 1.
      - Decrement `C[loser_idx][winner_idx]` by 1.
      - Increment `b[winner_idx]` by 0.5 (half a win).
      - Decrement `b[loser_idx]` by 0.5 (half a loss).
    - Use `ml-matrix`: `const C_matrix = new Matrix(C); const b_vector = Matrix.columnVector(b); const r = C_matrix.solve(b_vector);`
    - Extract the solution vector `r` as Colley ratings per team.
    - Sort teams by rating descending. Break ties alphabetically by `team.name` (ascending).
    - Assign ranks 1..N based on sorted order.
    - Return `AlgorithmResult[]` with `team_id`, `rating`, `rank` for each team.
  - Handle edge case: if only one team exists, return rating 0.5 and rank 1.
  - Handle edge case: if no pairwise records exist (no games played), all teams get rating 0.5 and ranks are assigned alphabetically.

- [x] **1.4 Implement the parameterized Elo algorithm**
      Create file: `src/lib/ranking/elo.ts`
  - Export function `computeEloRatings(tournamentGroups: TournamentPairwiseGroup[], teams: TeamInfo[], startingRating: number, kFactor: number): AlgorithmResult[]`:
    - Initialize a rating map: `Map<string, number>` with `team_id -> startingRating` for every team.
    - Process tournaments in order (the input `tournamentGroups` is already sorted chronologically).
    - For each tournament group, iterate through all `PairwiseRecord` entries:
      - Get current ratings `R_A` (winner) and `R_B` (loser).
      - Compute expected scores: `E_A = 1 / (1 + 10^((R_B - R_A) / 400))`, `E_B = 1 - E_A`.
      - Update ratings: `New_R_A = R_A + kFactor * (1 - E_A)`, `New_R_B = R_B + kFactor * (0 - E_B)`.
      - Write updated ratings back to the map immediately (within-tournament updates are sequential).
    - After all tournaments are processed, extract final ratings from the map.
    - Sort teams by final rating descending. Break ties alphabetically by `team.name` (ascending).
    - Assign ranks 1..N.
    - Return `AlgorithmResult[]`.
  - Handle edge case: teams with no games retain their starting rating. Rank by starting rating (all tied), then alphabetically.
  - Export constant `DEFAULT_K_FACTOR = 32`.
  - Export constant `ELO_STARTING_RATINGS = [2200, 2400, 2500, 2700] as const`.

- [x] **1.5 Implement normalization and aggregation**
      Create file: `src/lib/ranking/normalize.ts`
  - Export function `normalizeAndAggregate(algorithmResults: AlgorithmResultMap, teams: TeamInfo[]): NormalizedTeamResult[]`:
    - For each algorithm (`algo1` through `algo5`), apply min-max normalization:
      - Find `min_rating` and `max_rating` across all teams for that algorithm.
      - If `max_rating === min_rating` (all teams have identical ratings), assign `50.0` to all teams for that algorithm.
      - Otherwise: `normalized = (rating - min_rating) / (max_rating - min_rating) * 100`.
    - For each team, compute `agg_rating = (normalized_algo1 + normalized_algo2 + normalized_algo3 + normalized_algo4 + normalized_algo5) / 5`.
    - Round `agg_rating` to 2 decimal places using `Math.round(value * 100) / 100`.
    - Sort teams by `agg_rating` descending. Break ties alphabetically by `team.name` (ascending).
    - Assign `agg_rank` as 1..N.
    - Assemble `NormalizedTeamResult` for each team, carrying through the original per-algorithm ratings and ranks plus the computed `agg_rating` and `agg_rank`.
    - Return the array sorted by `agg_rank`.

- [x] **1.6 Create ranking module barrel export**
      Create file: `src/lib/ranking/index.ts`
  - Re-export all types from `./types`.
  - Re-export `deriveWinsLossesFromFinishes`, `deriveWinsLossesFromMatches`, `flattenPairwiseGroups` from `./derive-wins-losses`.
  - Re-export `computeColleyRatings` from `./colley`.
  - Re-export `computeEloRatings`, `DEFAULT_K_FACTOR`, `ELO_STARTING_RATINGS` from `./elo`.
  - Re-export `normalizeAndAggregate` from `./normalize`.

- [x] **1.7 Write W/L derivation tests**
      Create test file: `src/lib/ranking/__tests__/derive-wins-losses.test.ts`
      Tests (Vitest, 4 focused tests):
  1. **Test:** 5 teams with finish positions 1-5 in a single tournament produce exactly 10 pairwise records (C(5,2) = 10), and each record has the lower-finish-position team as the winner.
  2. **Test:** Two teams with identical finish positions in the same tournament+division produce NO pairwise record between them (tied finishes).
  3. **Test:** A single team in a tournament produces zero pairwise records.
  4. **Test:** Results from two tournaments are correctly grouped into two `TournamentPairwiseGroup` entries, sorted by tournament date ascending.

- [x] **1.8 Write Colley algorithm tests**
      Create test file: `src/lib/ranking/__tests__/colley.test.ts`
      Tests (Vitest, 4 focused tests):
  1. **Test:** 3-team known example: Team A beats B, A beats C, B beats C. Hand-compute Colley ratings: C matrix = [[4,-1,-1],[-1,4,-1],[-1,-1,4]], b = [2.0, 1.0, 0.0]. Solve and verify ratings match expected values to within 0.0001. Verify ranks: A=1, B=2, C=3.
  2. **Test:** Single team returns rating 0.5 and rank 1.
  3. **Test:** No pairwise records (all teams have zero games). All teams get rating 0.5. Ranks assigned alphabetically.
  4. **Test:** Tie-breaking: two teams with identical Colley ratings are ranked alphabetically by team name.

- [x] **1.9 Write Elo algorithm tests**
      Create test file: `src/lib/ranking/__tests__/elo.test.ts`
      Tests (Vitest, 4 focused tests):
  1. **Test:** 2-team single-game scenario with starting rating 2200: Team A beats Team B. Verify `E_A = 1 / (1 + 10^0) = 0.5`, `New_R_A = 2200 + 32 * (1 - 0.5) = 2216`, `New_R_B = 2200 + 32 * (0 - 0.5) = 2184`. Match formula to within 0.0001.
  2. **Test:** Chronological processing: two tournaments. After tournament 1 (A beats B), ratings update. Tournament 2 (B beats A) uses the updated ratings from tournament 1. Verify the expected score calculation uses the post-tournament-1 ratings.
  3. **Test:** All four starting ratings (2200, 2400, 2500, 2700) produce different final absolute ratings but the same relative ranking order for a simple 3-team scenario where A > B > C.
  4. **Test:** Teams with no games retain starting rating. All tied teams ranked alphabetically.

- [x] **1.10 Write normalization and aggregation tests**
      Create test file: `src/lib/ranking/__tests__/normalize.test.ts`
      Tests (Vitest, 4 focused tests):
  1. **Test:** Min-max normalization: the highest-rated team per algorithm gets 100.00, the lowest gets 0.00. A team exactly in the middle gets 50.00.
  2. **Test:** Equal-rating edge case: when all teams have the same rating for an algorithm, all teams receive 50.0 for that algorithm.
  3. **Test:** AggRating is the arithmetic mean of the five normalized values for each team. Verify with hand-computed values.
  4. **Test:** AggRank ordering: team with highest AggRating gets rank 1. Ties broken alphabetically.

### Acceptance Criteria

- `src/lib/ranking/types.ts` exports all shared types with no `any` types.
- `deriveWinsLossesFromFinishes()` correctly generates C(N,2) pairwise records for N teams in a tournament, handles ties (no record), and groups by tournament sorted chronologically.
- `computeColleyRatings()` constructs the correct Colley matrix, solves via LU decomposition, and produces ratings matching hand-computed values to within 0.0001.
- `computeEloRatings()` processes tournaments chronologically, updates ratings after each matchup within a tournament, and produces ratings matching the Elo formula to within 0.0001.
- `normalizeAndAggregate()` applies min-max normalization per algorithm, computes AggRating as the arithmetic mean, and assigns AggRank correctly.
- All algorithm functions are pure -- they accept data and return results without any database or side-effect dependencies.
- All 16 algorithm tests pass.

### Verification Steps

1. Run the W/L derivation test with 5 teams and verify exactly 10 pairwise records are generated.
2. Run the Colley test with the 3-team known example and verify ratings match hand-computed values.
3. Run the Elo test with the 2-team single-game scenario and verify the rating update matches the formula exactly.
4. Run the normalization test and verify best=100, worst=0, middle=50 per algorithm.
5. Run all algorithm tests twice consecutively and verify identical results (determinism).

### Verification Commands

```bash
# Run all algorithm tests
npx vitest run src/lib/ranking/__tests__/

# Run individual test files
npx vitest run src/lib/ranking/__tests__/derive-wins-losses.test.ts
npx vitest run src/lib/ranking/__tests__/colley.test.ts
npx vitest run src/lib/ranking/__tests__/elo.test.ts
npx vitest run src/lib/ranking/__tests__/normalize.test.ts

# Type-check the ranking module
npx tsc --noEmit --project tsconfig.json
```

---

## Task Group 2: Service Layer & API Endpoint

**Assigned implementer:** `api-engineer`
**Verified by:** `backend-verifier`
**Dependencies:** Task Group 1 (all algorithm functions and types must exist). Feature 1 schemas (`rankingRunInsertSchema`, `rankingResultInsertSchema` in `src/lib/schemas/`). Supabase client in `src/lib/supabase-server.ts`.

Build the RankingService orchestrator that fetches data from Supabase, calls the algorithm functions, writes results back to the database, and handles error cleanup. Build the API endpoint that validates requests and invokes the service. Build the server-side page load function for the ranking page.

### Sub-tasks

- [ ] **2.1 Implement the RankingService**
      Create file: `src/lib/ranking/ranking-service.ts`
  - Export class `RankingService`.
  - Constructor accepts the Supabase client (typed as `SupabaseClient<Database>` from `src/lib/types/database.types.ts`).
  - Method `async runRanking(config: RankingRunConfig): Promise<RankingRunOutput>`:
    1. **Validate inputs:** Verify `season_id` exists in the `seasons` table. Verify `age_group` is a valid `AgeGroup` enum value. Throw descriptive errors if validation fails.
    2. **Create ranking run record:** Insert into `ranking_runs` with `season_id`, `ran_at = new Date().toISOString()`, and `parameters` JSON: `{ k_factor: config.k_factor, elo_starting_ratings: config.elo_starting_ratings, data_source: 'tournament_finishes' }`. Capture the `ranking_run_id`.
    3. **Fetch teams:** Query `teams` table filtered by `age_group`. Map to `TeamInfo[]`.
    4. **Fetch tournament results:** Query `tournament_results` joined with `tournaments` (for `season_id` filter and `date` for ordering) and `teams` (for `age_group` filter). Return as typed array.
    5. **Check for match records (fallback):** Query `matches` table for any records in tournaments for this season. If match records exist, use `deriveWinsLossesFromMatches()`. Otherwise, use `deriveWinsLossesFromFinishes()`.
    6. **Build tournament dates map:** `Map<string, string>` from tournament_id to tournament date.
    7. **Derive pairwise records:** Call the appropriate derivation function. Also call `flattenPairwiseGroups()` for Colley input.
    8. **Execute Colley:** Call `computeColleyRatings(flatPairwiseRecords, teams)`. Store as `algo1` results.
    9. **Execute Elo variants:** For each starting rating in `config.elo_starting_ratings` (2200, 2400, 2500, 2700), call `computeEloRatings(tournamentGroups, teams, startingRating, config.k_factor)`. Store as `algo2`-`algo5` results.
    10. **Normalize and aggregate:** Call `normalizeAndAggregate(algorithmResultMap, teams)`.
    11. **Batch insert results:** Insert all `NormalizedTeamResult` rows into `ranking_results` with the `ranking_run_id`. Validate each row against `rankingResultInsertSchema` before insert.
    12. **Return output:** `{ ranking_run_id, results, teams_ranked: results.length, ran_at }`.
  - **Error cleanup:** Wrap steps 3-11 in a try/catch. If any step fails after the ranking run record is created (step 2), delete the `ranking_runs` row (and any partial `ranking_results` rows) before re-throwing the error.
  - Method `async getRunResults(rankingRunId: string): Promise<NormalizedTeamResult[]>`:
    - Query `ranking_results` for the given run ID, joined with `teams` for team names.
    - Return sorted by `agg_rank` ascending.

- [ ] **2.2 Implement the POST /api/ranking/run endpoint**
      Create file: `src/routes/api/ranking/run/+server.ts`
  - `POST` handler:
    - Parse request body as JSON. Expect `{ season_id: string, age_group: string }`.
    - Validate `season_id` is a non-empty string. Validate `age_group` is a valid `AgeGroup` enum value using Zod or direct check against the enum.
    - Return 400 with `{ success: false, error: "..." }` for invalid inputs.
    - Instantiate `RankingService` with the server-side Supabase client from `src/lib/supabase-server.ts`.
    - Call `runRanking()` with a `RankingRunConfig` using the validated inputs and default parameters (`k_factor: 32`, `elo_starting_ratings: [2200, 2400, 2500, 2700]`).
    - On success: return 200 with `{ success: true, data: { ranking_run_id, teams_ranked, ran_at } }`.
    - On error: return 500 with `{ success: false, error: error.message }`.
  - Follow the pattern from `src/routes/api/import/upload/+server.ts` for request handling conventions.

- [ ] **2.3 Implement the server-side page load for /ranking**
      Create file: `src/routes/ranking/+page.server.ts`
  - Load function fetches all seasons from the `seasons` table via the Supabase client.
  - Returns `{ seasons: Array<{ id: string, name: string }> }` to the page component for populating the season dropdown.
  - Follow the pattern from `src/routes/import/+page.server.ts`.

- [ ] **2.4 Write RankingService tests**
      Create test file: `src/lib/ranking/__tests__/ranking-service.test.ts`
      Tests (Vitest, 5 focused tests):
  1. **Test:** Full orchestration with mocked Supabase client: create a mock that returns 3 teams, 2 tournaments with finish data. Verify `runRanking()` creates a ranking run record, calls all algorithms, inserts results, and returns a valid `RankingRunOutput` with `teams_ranked === 3`.
  2. **Test:** Error cleanup: mock the Supabase insert for `ranking_results` to throw an error. Verify the ranking run record is deleted (mock delete is called) and the error is re-thrown.
  3. **Test:** Invalid season_id: call `runRanking()` with a non-existent season_id. Verify it throws with a descriptive error message before creating any records.
  4. **Test:** Match records preferred over finishes: mock the Supabase client to return match records for the season's tournaments. Verify `deriveWinsLossesFromMatches()` is used (by checking the data_source parameter or the function call).
  5. **Test:** `getRunResults()` returns results sorted by `agg_rank` ascending.

### Acceptance Criteria

- `RankingService` orchestrates the full ranking flow: data fetch, W/L derivation, 5 algorithm executions, normalization, and database writes.
- Error cleanup deletes the ranking run record and any partial results on failure.
- The API endpoint validates inputs, returns structured JSON responses with correct HTTP status codes, and follows existing API patterns.
- The page server load function provides seasons data for the UI dropdown.
- All 5 service/API tests pass.

### Verification Steps

1. Run the service test with the 3-team mock and verify all steps execute in order.
2. Trigger error cleanup by mocking a failure and verify no orphaned records remain.
3. Call the API endpoint with missing `season_id` and verify 400 response.
4. Call the API endpoint with valid inputs (mock) and verify 200 response with correct structure.

### Verification Commands

```bash
# Run ranking service tests
npx vitest run src/lib/ranking/__tests__/ranking-service.test.ts

# Type-check the service and API layer
npx tsc --noEmit --project tsconfig.json

# Start dev server and test API endpoint manually (optional)
npm run dev &
curl -X POST http://localhost:5173/api/ranking/run \
  -H "Content-Type: application/json" \
  -d '{"season_id":"test-uuid","age_group":"18U"}'
```

---

## Task Group 3: Frontend UI

**Assigned implementer:** `ui-designer`
**Verified by:** `frontend-verifier`
**Dependencies:** Task Group 2 (API endpoint and server load function must exist). Feature 1 schemas for `AgeGroup` enum.

Build the minimal ranking page at `/ranking` with season/age group selectors, a "Run Rankings" button, loading and error states, and a results table displaying all algorithm ratings, ranks, AggRating, and AggRank. Uses Svelte 5 runes and Tailwind CSS.

### Sub-tasks

- [ ] **3.1 Create the RankingResultsTable component**
      Create file: `src/lib/components/RankingResultsTable.svelte`
  - Props: `results: NormalizedTeamResult[]` (import type from `src/lib/ranking/types.ts`), `teams: Map<string, string>` (team_id -> team name mapping).
  - Render a scrollable table with the following columns:
    - Rank (agg_rank)
    - Team Name (resolved from team_id via the teams map)
    - Colley Rating (algo1_rating, 2 decimal places)
    - Colley Rank (algo1_rank)
    - Elo-2200 Rating (algo2_rating, 2 decimal places)
    - Elo-2200 Rank (algo2_rank)
    - Elo-2400 Rating (algo3_rating, 2 decimal places)
    - Elo-2400 Rank (algo3_rank)
    - Elo-2500 Rating (algo4_rating, 2 decimal places)
    - Elo-2500 Rank (algo4_rank)
    - Elo-2700 Rating (algo5_rating, 2 decimal places)
    - Elo-2700 Rank (algo5_rank)
    - AggRating (agg_rating, 2 decimal places)
  - Table is sorted by `agg_rank` ascending (pre-sorted from API).
  - Styling: Tailwind CSS. Alternating row colors (`even:bg-gray-50`). Sticky header. Horizontal scroll for wide tables (`overflow-x-auto`). Numeric columns right-aligned. Rank columns center-aligned.
  - Display "No results" message when the results array is empty.

- [ ] **3.2 Build the /ranking page with state management**
      Create file: `src/routes/ranking/+page.svelte`
  - Use Svelte 5 runes (`$state`, `$derived`) for all reactive state.
  - **State variables:**
    - `step: $state<'idle' | 'running' | 'results' | 'error'>('idle')`
    - `selectedSeasonId: $state('')`
    - `selectedAgeGroup: $state('')`
    - `rankingResults: $state<NormalizedTeamResult[]>([])`
    - `teamNames: $state<Map<string, string>>(new Map())`
    - `runSummary: $state<{ ranking_run_id: string, teams_ranked: number, ran_at: string } | null>(null)`
    - `errorMessage: $state('')`
  - **Derived state:**
    - `contextReady: $derived` -- true when both `selectedSeasonId` and `selectedAgeGroup` are non-empty.
  - **Page data:** Receive `{ seasons }` from `+page.server.ts`.
  - **Step: 'idle':**
    - Season dropdown: populated from `data.seasons`. Placeholder: "Select a season".
    - Age group dropdown: populated from `AgeGroup` enum values (`['15U', '16U', '17U', '18U']`). Placeholder: "Select age group".
    - "Run Rankings" button: disabled unless `contextReady` is true. Styled with Tailwind (`bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed`).
  - **Step: 'running':**
    - Disable both dropdowns and the button.
    - Show a loading spinner inside the button (replace text with spinner + "Running...").
    - Call `POST /api/ranking/run` with `{ season_id: selectedSeasonId, age_group: selectedAgeGroup }`.
    - On success: fetch ranking results (call `getRunResults` or query directly), populate `rankingResults` and `teamNames`, set `runSummary`, transition to `'results'`.
    - On error: set `errorMessage` from response, transition to `'error'`.
  - **Step: 'results':**
    - Show run summary banner: "Ranked {teams_ranked} teams at {ran_at}".
    - Render `RankingResultsTable` with `rankingResults` and `teamNames`.
    - Show a "Run Again" button to reset to `'idle'`.
  - **Step: 'error':**
    - Show error banner with `errorMessage` (red background, white text).
    - Show a "Try Again" button that resets to `'idle'`.
  - **Layout:** Tailwind `max-w-7xl mx-auto px-4 py-8`. Page title: "Rankings" as an h1. Selectors in a horizontal flex row with gap. Results table below with margin-top.

- [ ] **3.3 Implement results fetching after a successful run**
      In the `/ranking` page component (from 3.2), after a successful `POST /api/ranking/run` response:
  - Use the returned `ranking_run_id` to fetch full results.
  - Option A: Fetch from a GET endpoint (if available).
  - Option B: Fetch from Supabase client-side using `supabase.from('ranking_results').select('*, teams(name)').eq('ranking_run_id', ranking_run_id).order('agg_rank')`.
  - Build the `teamNames` map from the joined team data.
  - Store results in `rankingResults` state.
  - This sub-task may be implemented inline within sub-task 3.2's success handler, but is called out separately for clarity.

- [ ] **3.4 Write UI component tests**
      Create test file: `src/lib/components/__tests__/ranking-ui.test.ts`
      Tests (Vitest with `@testing-library/svelte`, 3 focused tests):
  1. **Test:** `RankingResultsTable` renders the correct number of rows for a given results array. Verify column headers include "Rank", "Team Name", "Colley Rating", "AggRating".
  2. **Test:** `RankingResultsTable` displays rating values formatted to 2 decimal places.
  3. **Test:** `RankingResultsTable` displays "No results" message when passed an empty array.

### Acceptance Criteria

- The `/ranking` page renders correctly with season and age group dropdowns, and a "Run Rankings" button.
- The button is disabled until both dropdowns have selections.
- Clicking "Run Rankings" shows a loading state, calls the API, and displays results in the table on success.
- The results table displays all 14 columns (Rank, Team Name, 5x Rating, 5x Rank, AggRating, AggRank) with ratings formatted to 2 decimal places.
- Error state shows a banner with the error message and a retry button.
- All 3 UI tests pass.

### Verification Steps

1. Navigate to `/ranking` page. Verify the two dropdowns and button are visible.
2. Verify the "Run Rankings" button is disabled when no selections are made.
3. Select a season and age group, click "Run Rankings". Verify the loading spinner appears and the results table displays after completion.
4. Verify the results table has the correct columns and ratings are formatted to 2 decimal places.
5. Trigger an error (e.g., invalid season_id) and verify the error banner displays.

### Verification Commands

```bash
# Run UI component tests
npx vitest run src/lib/components/__tests__/ranking-ui.test.ts

# Start dev server and visually inspect the ranking page
npm run dev
# Open http://localhost:5173/ranking in a browser

# Type-check all Svelte components
npx svelte-check --tsconfig tsconfig.json
```

---

## Task Group 4: Test Review & Gap Analysis

**Assigned implementer:** `testing-engineer`
**Verified by:** none (final quality gate)
**Dependencies:** Task Groups 1, 2, and 3 must be complete (all implementation and their embedded tests).

Review all tests written by Groups 1-3 (16 algorithm tests + 5 service tests + 3 UI tests = 24 tests), identify critical gaps in coverage, and add up to 10 gap-filling tests. Focus on integration boundaries, determinism verification, edge cases, and numerical precision.

### Sub-tasks

- [ ] **4.1 Audit existing test coverage**
      Review all test files:
  - `src/lib/ranking/__tests__/derive-wins-losses.test.ts` (4 tests)
  - `src/lib/ranking/__tests__/colley.test.ts` (4 tests)
  - `src/lib/ranking/__tests__/elo.test.ts` (4 tests)
  - `src/lib/ranking/__tests__/normalize.test.ts` (4 tests)
  - `src/lib/ranking/__tests__/ranking-service.test.ts` (5 tests)
  - `src/lib/components/__tests__/ranking-ui.test.ts` (3 tests)
    Document which paths are covered and which critical paths are missing. Focus on: cross-algorithm integration, determinism, numerical precision, large dataset handling, and division filtering in W/L derivation.

- [ ] **4.2 Write determinism verification tests**
      Create test file: `src/lib/ranking/__tests__/determinism.test.ts`
      Tests:
  1. **Test:** Run the full algorithm pipeline (derive W/L, Colley, 4 Elo variants, normalize) twice with identical input data. Assert that every rating and rank value is byte-identical between the two runs. Use a 5-team, 3-tournament dataset.
  2. **Test:** Run the full pipeline with teams provided in different array order. Assert that results are identical regardless of team input order (algorithms must not depend on input ordering).

- [ ] **4.3 Write numerical precision tests**
      Create test file: `src/lib/ranking/__tests__/precision.test.ts`
      Tests: 3. **Test:** Colley with a 10-team dataset: verify that all Colley ratings sum to N/2 (the theoretical invariant of the Colley method: sum of all ratings = N _ 0.5). Assert within 0.0001. 4. **Test:** Elo with extreme rating gap: Team A (rating 2700) vs Team B (rating 2200). Verify the expected score is close to 1.0 for A and close to 0.0 for B. Verify the rating change for the winner is small (< K _ 0.1) and for the loser is large (> K \* 0.9).

- [ ] **4.4 Write cross-algorithm integration tests**
      Create test file: `src/lib/ranking/__tests__/integration.test.ts`
      Tests: 5. **Test:** End-to-end algorithm pipeline: start with raw tournament results for 4 teams across 2 tournaments. Derive W/L, run Colley, run all 4 Elo variants, normalize, and aggregate. Verify that the team that won the most matchups has the highest AggRating and AggRank = 1. 6. **Test:** Division filtering: tournament results contain teams from two divisions. Verify that W/L derivation only generates pairwise records between teams in the SAME division within a tournament (no cross-division matchups).

- [ ] **4.5 Write edge case tests**
      Create test file: `src/lib/ranking/__tests__/edge-cases.test.ts`
      Tests: 7. **Test:** Two teams, zero games between them. Both Colley and Elo return their default ratings (0.5 for Colley, starting rating for Elo). Normalization assigns 50.0 to both (equal ratings edge case). 8. **Test:** Large dataset: generate 73 teams and 60 tournaments with random but deterministic finish data (seeded). Verify the full pipeline completes without error and produces exactly 73 results. Verify execution time is under 5 seconds (NF1 performance requirement -- algorithm only, no DB). 9. **Test:** All teams tied in every tournament (everyone has finish position 1). Zero pairwise records generated. All algorithms produce default ratings. AggRating is 50.00 for all teams. AggRanks are 1-N alphabetically. 10. **Test:** API endpoint returns 400 for missing `age_group` field in request body. Verify error message mentions the missing field.

- [ ] **4.6 Verify full test suite passes**
      Run the complete test suite across all groups. Verify zero failures and no test isolation issues (tests do not depend on each other's state). Document final test counts.

### Acceptance Criteria

- Gap analysis is documented with clear rationale for each added test.
- Up to 10 additional tests are written, covering: determinism, numerical precision, cross-algorithm integration, edge cases, and API validation.
- All new tests follow Arrange-Act-Assert pattern.
- No test depends on another test's state or ordering.
- The full test suite (all 4 groups) passes in a single run.
- Total test count is between 24 and 34 (24 from Groups 1-3 + up to 10 from Group 4).

### Verification Steps

1. Run the complete Vitest suite. Expected: all unit and integration tests pass with zero failures.
2. Run the determinism test and verify byte-identical results across runs.
3. Run the large dataset test and verify it completes in under 5 seconds.
4. Confirm total test count is between 24 and 34.
5. Verify no test pollutes global state by running the suite twice consecutively.

### Verification Commands

```bash
# Run all unit and integration tests
npx vitest run

# Run only the gap-filling tests
npx vitest run src/lib/ranking/__tests__/determinism.test.ts
npx vitest run src/lib/ranking/__tests__/precision.test.ts
npx vitest run src/lib/ranking/__tests__/integration.test.ts
npx vitest run src/lib/ranking/__tests__/edge-cases.test.ts

# Run full suite and report coverage
npx vitest run --coverage
```

---

## Summary

| Group                           | Implementer         | Focus                                             | Sub-tasks | Tests    | Depends On     |
| ------------------------------- | ------------------- | ------------------------------------------------- | --------- | -------- | -------------- |
| 1. Algorithm Implementations    | `database-engineer` | Types, W/L derivation, Colley, Elo, normalization | 10        | 16       | Feature 1      |
| 2. Service Layer & API Endpoint | `api-engineer`      | RankingService, API route, page server load       | 4         | 5        | Group 1        |
| 3. Frontend UI                  | `ui-designer`       | Ranking page, results table, state management     | 4         | 3        | Group 2        |
| 4. Test Review & Gap Analysis   | `testing-engineer`  | Determinism, precision, integration, edge cases   | 6         | up to 10 | Groups 1, 2, 3 |

**Total sub-tasks:** 24
**Total tests:** 24 (Groups 1-3) + up to 10 (Group 4) = up to 34

### Dependency Graph

```
Feature 1 (Data Model & Database Schema)
    |
    v
Group 1: Algorithm Implementations (database-engineer)
    |
    v
Group 2: Service Layer & API Endpoint (api-engineer)
    |
    v
Group 3: Frontend UI (ui-designer)
    |
    v
Group 4: Test Review & Gap Analysis (testing-engineer)
```

### Existing Code Reused

| Asset                       | Location                                  | Used In                                                                    |
| --------------------------- | ----------------------------------------- | -------------------------------------------------------------------------- |
| `rankingRunInsertSchema`    | `src/lib/schemas/ranking-run.ts`          | Group 2 -- validate ranking run records before insert                      |
| `rankingResultInsertSchema` | `src/lib/schemas/ranking-result.ts`       | Group 2 -- validate each ranking result row before batch insert            |
| `tournamentResultSchema`    | `src/lib/schemas/tournament-result.ts`    | Group 2 -- type reference for reading tournament results                   |
| `matchSchema`               | `src/lib/schemas/match.ts`                | Group 2 -- type reference for reading match records                        |
| `AgeGroup` enum             | `src/lib/schemas/enums.ts`                | Groups 2, 3 -- validate age group, populate UI selector                    |
| `Database` types            | `src/lib/types/database.types.ts`         | Group 2 -- type-safe Supabase queries                                      |
| `supabaseServer`            | `src/lib/supabase-server.ts`              | Group 2 -- server-side Supabase client                                     |
| `ImportService` pattern     | `src/lib/import/import-service.ts`        | Group 2 -- reference for service class with Supabase constructor injection |
| Import page pattern         | `src/routes/import/+page.svelte`          | Group 3 -- reference for Svelte 5 page with runes and step-based rendering |
| Upload API pattern          | `src/routes/api/import/upload/+server.ts` | Group 2 -- reference for POST handler with validation and JSON response    |
| `ml-matrix`                 | `node_modules/ml-matrix`                  | Group 1 -- LU decomposition for Colley Matrix solving                      |

### New Files Created

| File                                                   | Group | Purpose                                                  |
| ------------------------------------------------------ | ----- | -------------------------------------------------------- |
| `src/lib/ranking/types.ts`                             | 1     | Type definitions for the ranking module                  |
| `src/lib/ranking/derive-wins-losses.ts`                | 1     | Pairwise W/L derivation from finishes and matches        |
| `src/lib/ranking/colley.ts`                            | 1     | Colley Matrix algorithm implementation                   |
| `src/lib/ranking/elo.ts`                               | 1     | Parameterized Elo algorithm implementation               |
| `src/lib/ranking/normalize.ts`                         | 1     | Min-max normalization and AggRating/AggRank computation  |
| `src/lib/ranking/index.ts`                             | 1     | Barrel export for ranking module                         |
| `src/lib/ranking/ranking-service.ts`                   | 2     | Orchestrator service with Supabase integration           |
| `src/routes/api/ranking/run/+server.ts`                | 2     | POST endpoint to trigger ranking runs                    |
| `src/routes/ranking/+page.server.ts`                   | 2     | Server-side load function for seasons data               |
| `src/lib/components/RankingResultsTable.svelte`        | 3     | Table component for displaying ranking results           |
| `src/routes/ranking/+page.svelte`                      | 3     | Ranking page with selectors, button, and results display |
| `src/lib/ranking/__tests__/derive-wins-losses.test.ts` | 1     | W/L derivation tests                                     |
| `src/lib/ranking/__tests__/colley.test.ts`             | 1     | Colley algorithm tests                                   |
| `src/lib/ranking/__tests__/elo.test.ts`                | 1     | Elo algorithm tests                                      |
| `src/lib/ranking/__tests__/normalize.test.ts`          | 1     | Normalization tests                                      |
| `src/lib/ranking/__tests__/ranking-service.test.ts`    | 2     | Service orchestration tests                              |
| `src/lib/components/__tests__/ranking-ui.test.ts`      | 3     | UI component tests                                       |
| `src/lib/ranking/__tests__/determinism.test.ts`        | 4     | Determinism verification tests                           |
| `src/lib/ranking/__tests__/precision.test.ts`          | 4     | Numerical precision tests                                |
| `src/lib/ranking/__tests__/integration.test.ts`        | 4     | Cross-algorithm integration tests                        |
| `src/lib/ranking/__tests__/edge-cases.test.ts`         | 4     | Edge case and performance tests                          |
