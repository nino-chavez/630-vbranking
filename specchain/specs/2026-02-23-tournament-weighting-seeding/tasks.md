# Tasks: Tournament Weighting & Seeding Criteria

> **Spec:** [spec.md](./spec.md)
> **Strategy:** squad | **Depth:** standard
> **Tech stack:** SvelteKit + Tailwind CSS v4 + Svelte 5 runes + TypeScript + Vitest + Supabase

---

## Task Group 1: Weighted Algorithm Core

**Assigned implementer:** `api-engineer`
**Verified by:** `backend-verifier`
**Dependencies:** None

Modify the pure algorithm functions (Colley and Elo) to accept an optional weight map, create the seeding factors computation module, and add the new types. All code in this group is pure -- no database access, no side effects. The weight map is passed as a parameter, making everything testable without a database.

### Sub-tasks

- [ ] **1.1 Write unit tests for weighted Colley, weighted Elo, and seeding factors**
      Create test files:
  - `src/lib/ranking/__tests__/colley-weighted.test.ts`
  - `src/lib/ranking/__tests__/elo-weighted.test.ts`
  - `src/lib/ranking/__tests__/seeding-factors.test.ts`

  **Colley weighted tests** (4 tests):
  1. **Weight map applied correctly**: 3 teams, 2 tournaments. Tournament A has weight 2.0, Tournament B has weight 1.0. Verify the Colley ratings differ from the unweighted case and that teams performing better at the higher-weighted tournament receive a relative rating boost.
  2. **Default weight 1.0 (no weight map)**: Same test data with `weightMap` as `undefined`. Verify output matches the existing unweighted `computeColleyRatings()` exactly.
  3. **Empty weight map**: Pass `{}` as weight map. Verify output is identical to no weight map (all tournaments default to 1.0).
  4. **Zero-weight tournament**: A tournament with weight 0.0 contributes nothing to the matrix. Verify the system remains solvable and the zero-weighted tournament's results do not affect ratings.

  **Elo weighted tests** (4 tests):
  1. **K-factor scaling**: 2 teams, 1 game, tournament weight 2.0. Verify the rating change is exactly double what it would be with weight 1.0 (since `effective_K = K * 2.0`).
  2. **Default weight 1.0 (no weight map)**: Same test data with no weight map. Verify output matches existing `computeEloRatings()` exactly.
  3. **Multiple tournaments with different weights**: 3 teams, 2 tournaments with weights 2.0 and 1.0. Verify final ratings reflect the different K-factors.
  4. **Weight 0 produces no rating changes**: A tournament with weight 0.0 produces no rating changes (effective_K = 0).

  **Seeding factors tests** (5 tests):
  1. **Win percentage computed correctly**: 3 teams with known W/L records. Team with 5 wins out of 8 games = 62.5%.
  2. **Zero games yields win_pct = 0**: A team with no pairwise records has `win_pct = 0`.
  3. **Best national finish from Tier-1 only**: Team with finishes at Tier-1 and Tier-3 tournaments. Only the Tier-1 finish is reported.
  4. **Multiple Tier-1 finishes takes lowest**: Team finished 3rd at one Tier-1 and 1st at another. `best_national_finish = 1`.
  5. **No Tier-1 finishes yields null**: Team has no results at Tier-1 tournaments. `best_national_finish = null`, `best_national_tournament_name = null`.

- [ ] **1.2 Add SeedingFactors interface and update RankingRunOutput in types.ts**
      Modify file: `src/lib/ranking/types.ts`
  - Add the `SeedingFactors` interface:
    ```typescript
    export interface SeedingFactors {
    	team_id: string;
    	win_pct: number;
    	best_national_finish: number | null;
    	best_national_tournament_name: string | null;
    }
    ```
  - Update `RankingRunOutput` to include `seeding_factors`:
    ```typescript
    export interface RankingRunOutput {
    	ranking_run_id: string;
    	results: NormalizedTeamResult[];
    	seeding_factors: SeedingFactors[];
    	teams_ranked: number;
    	ran_at: string;
    }
    ```

- [ ] **1.3 Modify computeColleyRatings() to accept optional weightMap**
      Modify file: `src/lib/ranking/colley.ts`
  - Add `weightMap?: Record<string, number>` as a third parameter to `computeColleyRatings()`.
  - In the pairwise record processing loop, look up the weight: `const weight = weightMap?.[record.tournament_id] ?? 1.0;`
  - Replace all hardcoded `1` contributions with `weight` and `0.5` with `weight * 0.5`:
    - `C[winnerIdx][winnerIdx] += weight;`
    - `C[loserIdx][loserIdx] += weight;`
    - `C[winnerIdx][loserIdx] -= weight;`
    - `C[loserIdx][winnerIdx] -= weight;`
    - `b[winnerIdx] += weight * 0.5;`
    - `b[loserIdx] -= weight * 0.5;`
  - No other changes -- initial diagonal (2) and initial b (1) are unchanged.

- [ ] **1.4 Modify computeEloRatings() to accept optional weightMap**
      Modify file: `src/lib/ranking/elo.ts`
  - Add `weightMap?: Record<string, number>` as a fifth parameter to `computeEloRatings()`.
  - In the tournament group processing loop, look up the weight per group: `const weight = weightMap?.[group.tournament_id] ?? 1.0;`
  - Compute effective K: `const effectiveK = kFactor * weight;`
  - Replace `kFactor` with `effectiveK` in the rating update formulas:
    - `const newRWinner = rWinner + effectiveK * (1 - eWinner);`
    - `const newRLoser = rLoser + effectiveK * (0 - eLoser);`

- [ ] **1.5 Create seeding factors computation module**
      Create file: `src/lib/ranking/seeding-factors.ts`
  - Pure function, no database access.
  - Export `computeSeedingFactors()` with the following signature:
    ```typescript
    export function computeSeedingFactors(
    	pairwiseRecords: PairwiseRecord[],
    	teams: TeamInfo[],
    	tier1TournamentFinishes: Array<{
    		team_id: string;
    		tournament_id: string;
    		tournament_name: string;
    		finish_position: number;
    	}>,
    ): SeedingFactors[];
    ```
  - **Win % computation**: For each team, count wins (records where `winner_id === team.id`) and total games (records where `team_a_id === team.id` or `team_b_id === team.id`). Compute `win_pct = total_games > 0 ? Math.round((wins / total_games) * 1000) / 10 : 0` (1 decimal place).
  - **Best national finish**: For each team, filter `tier1TournamentFinishes` for that team's entries, find the lowest `finish_position`. If none exist, `best_national_finish = null` and `best_national_tournament_name = null`.
  - Return a `SeedingFactors[]` with one entry per team.

- [ ] **1.6 Verify all algorithm unit tests pass**
      Run the three test files created in 1.1:
  - `npx vitest run src/lib/ranking/__tests__/colley-weighted.test.ts`
  - `npx vitest run src/lib/ranking/__tests__/elo-weighted.test.ts`
  - `npx vitest run src/lib/ranking/__tests__/seeding-factors.test.ts`
    Expected: 13 tests pass, 0 failures.
    Also run the existing algorithm tests to verify no regressions:
  - `npx vitest run src/lib/ranking/__tests__/`
    Expected: All existing tests continue to pass (backward compatibility).

### Acceptance Criteria

- `computeColleyRatings()` accepts an optional `weightMap` parameter and applies weights to matrix construction.
- `computeEloRatings()` accepts an optional `weightMap` parameter and scales K-factor per tournament.
- Both functions produce identical results to their unweighted versions when no weight map or an empty weight map is provided.
- `computeSeedingFactors()` correctly computes win % and best national finish.
- `SeedingFactors` interface and updated `RankingRunOutput` are defined in `types.ts`.
- All 13 new tests pass. All existing algorithm tests pass without modification.

### Verification Steps

1. Read `colley.ts` and verify the `weightMap` parameter is optional and defaults to 1.0 per tournament.
2. Read `elo.ts` and verify `effectiveK = kFactor * weight` is used in rating updates.
3. Read `seeding-factors.ts` and verify win % and best national finish are computed from the provided data.
4. Run all ranking tests and verify 0 regressions.

### Verification Commands

```bash
# Run new weighted algorithm tests
npx vitest run src/lib/ranking/__tests__/colley-weighted.test.ts
npx vitest run src/lib/ranking/__tests__/elo-weighted.test.ts
npx vitest run src/lib/ranking/__tests__/seeding-factors.test.ts

# Run all ranking tests (including existing) to verify backward compatibility
npx vitest run src/lib/ranking/__tests__/

# Type-check
npx svelte-check --tsconfig tsconfig.json
```

---

## Task Group 2: Service Layer & API

**Assigned implementer:** `api-engineer`
**Verified by:** `backend-verifier`
**Dependencies:** Task Group 1 (modified algorithm functions and new types must exist)

Integrate tournament weights into the RankingService orchestration, create the weights management API endpoints, and augment the ranking results API with seeding factors. This group handles all database interaction and API routing.

### Sub-tasks

- [ ] **2.1 Write integration tests for weights API and service changes**
      Create test file: `src/routes/api/ranking/__tests__/weights-api.test.ts`

  Tests (3 tests):
  1. **GET /api/ranking/weights returns tournaments with defaults**: Mock Supabase to return 3 tournaments for a season, 1 with a custom weight row and 2 without. Verify the response includes all 3 tournaments: the one with a custom weight shows `has_custom_weight: true` with the stored weight/tier, the other two show `weight: 1.0, tier: 5, has_custom_weight: false`.
  2. **PUT /api/ranking/weights upserts correctly**: Mock Supabase upsert. Send a PUT with 2 weight entries. Verify `upsert()` is called with the correct data and the response returns `upserted: 2`.
  3. **PUT /api/ranking/weights validates input**: Send a PUT with missing `season_id`. Verify the response is 400 with a validation error message. Send a PUT with a negative `weight`. Verify the response is 400.

- [ ] **2.2 Update RankingService to fetch weights and pass to algorithms**
      Modify file: `src/lib/ranking/ranking-service.ts`
  - After fetching tournaments (step 4), add a new step to fetch tournament weights:
    ```typescript
    const { data: weightRows, error: weightError } = await this.supabase
    	.from('tournament_weights')
    	.select('tournament_id, weight')
    	.eq('season_id', config.season_id)
    	.in('tournament_id', tournamentIds.length > 0 ? tournamentIds : ['__none__']);
    if (weightError) {
    	throw new Error(`Failed to fetch tournament weights: ${weightError.message}`);
    }
    const weightMap: Record<string, number> = {};
    for (const row of weightRows ?? []) {
    	weightMap[row.tournament_id] = Number(row.weight);
    }
    ```
  - Pass `weightMap` to `this.executeAlgorithms()` in both the match_records and tournament_finishes code paths.
  - Update the `executeAlgorithms` private method signature to accept `weightMap: Record<string, number>` and pass it to `computeColleyRatings()` and all `computeEloRatings()` calls.
  - Update the `parameters` JSON in the `ranking_runs` insert to include `weights: weightMap`.

- [ ] **2.3 Add seeding factors computation to the ranking run flow**
      Modify file: `src/lib/ranking/ranking-service.ts`
  - Import `computeSeedingFactors` from `./seeding-factors.js`.
  - Import `SeedingFactors` type from `./types.js`.
  - After computing algorithm results (in both match_records and tournament_finishes paths), compute seeding factors:
    1. Fetch Tier-1 tournament IDs: query `tournament_weights` for `tier = 1` entries in this season.
    2. Fetch tournament results for those Tier-1 tournaments: query `tournament_results` joined with `tournaments` for names, filtered to teams in the current run.
    3. Call `computeSeedingFactors(flatRecords, teams, tier1Finishes)`.
  - Include `seeding_factors` in the returned `RankingRunOutput`.
  - Dependencies: sub-task 1.5 (seeding-factors module must exist).

- [ ] **2.4 Create tournament weights API endpoint**
      Create file: `src/routes/api/ranking/weights/+server.ts`
  - **GET handler**:
    1. Parse `season_id` from query params. Validate it is present and is a valid UUID format.
    2. Query `tournaments` for the season, ordered by date ascending.
    3. Query `tournament_weights` for the season.
    4. Merge: for each tournament, if a weight row exists use its `weight` and `tier` with `has_custom_weight: true`; otherwise default to `weight: 1.0, tier: 5, has_custom_weight: false`.
    5. Return `{ success: true, data: { weights: [...] } }`.
    6. Return 400 if `season_id` is missing or invalid. Return 500 on database error.
  - **PUT handler**:
    1. Parse request body: `{ season_id: string, weights: Array<{ tournament_id, weight, tier }> }`.
    2. Validate `season_id` (required UUID), `weights` array (non-empty), each entry has valid `tournament_id` (UUID), `weight` (positive number), `tier` (positive integer). Use `tournamentWeightInsertSchema` from `$lib/schemas/tournament-weight.js` for entry validation.
    3. For each entry, upsert into `tournament_weights` with `season_id` included, using Supabase `upsert()` with `onConflict: 'tournament_id,season_id'`.
    4. Return `{ success: true, data: { upserted: N } }`.
    5. Return 400 on validation failure. Return 500 on database error.

- [ ] **2.5 Augment ranking results API with seeding factors**
      Modify file: `src/routes/api/ranking/results/+server.ts`
  - After fetching ranking results and team names, add seeding factors computation:
    1. Fetch the `ranking_run` record to get `season_id`.
    2. Fetch pairwise data for the season (from `tournament_results` or `matches`, using the same logic as the ranking service).
    3. Fetch Tier-1 tournament IDs from `tournament_weights` where `tier = 1` and `season_id` matches.
    4. Fetch tournament results for Tier-1 tournaments, joined with tournament names.
    5. Compute seeding factors using `computeSeedingFactors()`.
    6. Include `seeding_factors` as a `Record<string, { win_pct, best_national_finish, best_national_tournament_name }>` in the response data, keyed by `team_id`.
  - The existing `results` and `teams` fields remain unchanged.

- [ ] **2.6 Update ranking run parameters recording**
      Modify file: `src/lib/ranking/ranking-service.ts`
  - In the `ranking_runs` insert (step 2), update the `parameters` object to include the weight map:
    ```typescript
    parameters: {
      k_factor: config.k_factor,
      elo_starting_ratings: config.elo_starting_ratings,
      data_source: dataSource,
      weights: weightMap,
    }
    ```
  - Note: The `weightMap` is fetched in sub-task 2.2. This sub-task specifically ensures the parameters recording happens correctly. The `ranking_runs` insert happens before the weight fetch in the current code flow, so the insert must be moved after the weight fetch, or the parameters must be updated after the run completes.
  - Recommended approach: Move the `ranking_runs` insert to after the weight map is built, or update the record after the run. The simplest approach is to restructure the flow so that weight fetching happens before the run record insert.

- [ ] **2.7 Verify API tests pass and no regressions**
      Run the tests created in 2.1:
  - `npx vitest run src/routes/api/ranking/__tests__/weights-api.test.ts`
    Expected: 3 tests pass, 0 failures.
    Run the existing ranking service tests to verify no regressions.

### Acceptance Criteria

- `RankingService.runRanking()` fetches tournament weights from the database and passes them to algorithm functions.
- The `ranking_runs.parameters` JSON includes a `weights` field with the weight map.
- `GET /api/ranking/weights` returns all tournaments for a season with weights (defaulting to 1.0/tier 5 for unconfigured tournaments).
- `PUT /api/ranking/weights` upserts weight records with proper validation.
- `GET /api/ranking/results` includes `seeding_factors` in the response with win % and best national finish per team.
- Seeding factors are computed from existing data, not stored separately.
- All 3 API tests pass. No regressions in existing tests.

### Verification Steps

1. Read `ranking-service.ts` and verify weights are fetched and passed to algorithm calls.
2. Read `weights/+server.ts` and verify GET returns defaults for unconfigured tournaments and PUT validates and upserts.
3. Read `results/+server.ts` and verify `seeding_factors` is included in the response.
4. Run API tests and verify 0 failures.

### Verification Commands

```bash
# Run weights API tests
npx vitest run src/routes/api/ranking/__tests__/weights-api.test.ts

# Run all ranking tests to verify no regressions
npx vitest run src/lib/ranking/__tests__/

# Type-check
npx svelte-check --tsconfig tsconfig.json
```

---

## Task Group 3: Frontend UI

**Assigned implementer:** `ui-designer`
**Verified by:** `frontend-verifier`
**Dependencies:** Task Group 2 (API endpoints must exist for weights management and results augmentation)

Create the tournament weights management page and update the ranking results table to display seeding factor columns. Uses existing design system components (Card, Select, Button, Banner, PageHeader, DataTable).

### Sub-tasks

- [ ] **3.1 Write UI tests for weights page and results augmentation**
      Create test file: `src/lib/components/__tests__/weights-page.test.ts`

  Tests (3 tests):
  1. **Weights table renders tournament rows**: Render a mock weights table with 3 tournaments. Verify all tournament names are displayed. Verify each row has an editable weight input and tier selector.
  2. **Tier auto-populates weight**: Simulate selecting Tier 1 from the tier dropdown. Verify the weight field auto-populates to 3.0. Simulate selecting Tier 5. Verify weight auto-populates to 1.0.
  3. **Save button disabled when no changes**: Render the weights table with initial data. Verify the Save button is disabled. Modify a weight value. Verify the Save button becomes enabled.

  Create test file: `src/lib/components/__tests__/seeding-columns.test.ts`

  Tests (2 tests):
  1. **RankingResultsTable renders W% column**: Pass results and seeding factors data. Verify a "W%" column header is present. Verify the win percentage is displayed as "XX.X%" for each team.
  2. **RankingResultsTable renders Natl. Finish column**: Pass seeding factors with a team that has `best_national_finish: 2` and another with `null`. Verify "2nd" is displayed for the first team and "N/A" for the second.

- [ ] **3.2 Create weights page server load**
      Create file: `src/routes/ranking/weights/+page.server.ts`
  - Fetch the seasons list (same pattern as `src/routes/ranking/+page.server.ts`):
    ```typescript
    const { data: seasons } = await supabaseServer
    	.from('seasons')
    	.select('id, name')
    	.order('start_date', { ascending: false });
    return { seasons: seasons ?? [] };
    ```

- [ ] **3.3 Create tournament weights management page**
      Create file: `src/routes/ranking/weights/+page.svelte`
  - Import design system components: `PageHeader`, `Card`, `Select`, `Button`, `Banner`.
  - **State (Svelte 5 runes)**:
    - `selectedSeasonId: string` -- `$state('')`
    - `weights: WeightRow[]` -- `$state([])`
    - `originalWeights: WeightRow[]` -- `$state([])`
    - `hasChanges: boolean` -- `$derived` comparing JSON of `weights` vs `originalWeights`
    - `saving: boolean` -- `$state(false)`
    - `loadingWeights: boolean` -- `$state(false)`
    - `feedbackMessage: { type: 'success' | 'error'; text: string } | null` -- `$state(null)`
  - **WeightRow type** (inline or separate):
    ```typescript
    interface WeightRow {
    	tournament_id: string;
    	tournament_name: string;
    	tournament_date: string;
    	weight: number;
    	tier: number;
    	has_custom_weight: boolean;
    }
    ```
  - **Layout**:
    1. `<PageHeader title="Tournament Weights" subtitle="Manage tournament importance weights for ranking calculations." />`
    2. Season selector using `<Select>`. On change, fetch `GET /api/ranking/weights?season_id=...`.
    3. Tier reference card: A `<Card>` showing the 5 tiers with their default weights (static content).
    4. Weights table inside a `<Card>`:
       - Columns: Tournament Name, Date, Tier (editable `<Select>` with options for tiers 1-5), Weight (editable `<input type="number" step="0.1" min="0">`), Status (badge showing "Custom" or "Default").
       - Rows sorted by tournament date ascending.
       - When tier is changed, auto-populate weight with default for that tier (1=3.0, 2=2.5, 3=2.0, 4=1.5, 5=1.0). Weight remains editable.
    5. Save button at the bottom: `<Button>` disabled when `!hasChanges`, loading state during save. Sends `PUT /api/ranking/weights` with changed entries.
    6. `<Banner>` for success/error feedback.

- [ ] **3.4 Update RankingResultsTable to display seeding factor columns**
      Modify file: `src/lib/components/RankingResultsTable.svelte`
  - Add an optional `seedingFactors` prop: `seedingFactors?: Record<string, { win_pct: number; best_national_finish: number | null; best_national_tournament_name: string | null }>`.
  - Add two columns after AggRank (first column) and Team Name (second column), before the algorithm columns:
    - **W%**: Displays `seedingFactors[row.team_id]?.win_pct` formatted as `XX.X%`. Shows "---" if no seeding data.
    - **Natl. Finish**: Displays `seedingFactors[row.team_id]?.best_national_finish` formatted as ordinal (1st, 2nd, 3rd, etc.) or "N/A" if `null`.
  - Add corresponding `<th>` header cells with tooltip text:
    - W% header: `title="Win percentage vs. all opponents across all tournaments"`
    - Natl. Finish header: `title="Best finish at a Tier-1 (National Championship) tournament"`
  - These columns are always visible (not hidden on mobile) since they are key seeding context.
  - Add a helper function `toOrdinal(n: number): string` that converts 1->"1st", 2->"2nd", 3->"3rd", 4->"4th", etc.

- [ ] **3.5 Update ranking page to pass seeding factors to results table**
      Modify file: `src/routes/ranking/+page.svelte`
  - Add state for seeding factors: `let seedingFactors = $state<Record<string, { win_pct: number; best_national_finish: number | null; best_national_tournament_name: string | null }>>({});`
  - In `handleRunRankings()`, after fetching results from `GET /api/ranking/results`, extract `seeding_factors` from the response and assign to state:
    ```typescript
    if (resultsData.data.seeding_factors) {
    	seedingFactors = resultsData.data.seeding_factors;
    }
    ```
  - Pass `seedingFactors` to `<RankingResultsTable>`:
    ```svelte
    <RankingResultsTable results={rankingResults} teams={teamNames} {seedingFactors} />
    ```
  - Reset `seedingFactors` in `handleReset()`.

- [ ] **3.6 Add navigation link for weights page**
      Modify file: `src/lib/components/NavHeader.svelte`
  - Add a "Weights" navigation link pointing to `/ranking/weights`.
  - Place it after the "Rankings" link.
  - Apply the same active link detection pattern as existing links.

- [ ] **3.7 Verify UI tests pass**
      Run the test files created in 3.1:
  - `npx vitest run src/lib/components/__tests__/weights-page.test.ts`
  - `npx vitest run src/lib/components/__tests__/seeding-columns.test.ts`
    Expected: 5 tests pass, 0 failures.

### Acceptance Criteria

- `/ranking/weights` page loads with season selector, tier reference, and editable weights table.
- Selecting a tier auto-populates the weight field with the tier's default weight.
- Save button is disabled when no changes are detected and enabled when modifications exist.
- Saving weights calls `PUT /api/ranking/weights` and displays success/error feedback.
- `RankingResultsTable` displays W% and Natl. Finish columns with correct formatting.
- Seeding factors are passed from the ranking page through to the results table.
- NavHeader includes a "Weights" link.
- All 5 UI tests pass.

### Verification Steps

1. Navigate to `/ranking/weights` -- expect PageHeader, season selector, and tier reference card.
2. Select a season -- expect weights table to populate with tournaments.
3. Change a tier to Tier 1 -- expect weight auto-fills to 3.0.
4. Click Save -- expect success banner and data persisted.
5. Run rankings on `/ranking` -- expect W% and Natl. Finish columns in results table.
6. Verify NavHeader shows "Weights" link with correct active state.

### Verification Commands

```bash
# Run UI tests
npx vitest run src/lib/components/__tests__/weights-page.test.ts
npx vitest run src/lib/components/__tests__/seeding-columns.test.ts

# Type-check
npx svelte-check --tsconfig tsconfig.json

# Visual inspection
npm run dev
# Navigate to http://localhost:5173/ranking/weights
# Navigate to http://localhost:5173/ranking (run rankings and check seeding columns)
```

---

## Task Group 4: Test Review & Gap Analysis

**Assigned implementer:** `testing-engineer`
**Verified by:** none (final quality gate)
**Dependencies:** Task Groups 1, 2, and 3 must be complete

Review all tests written by Groups 1-3 (13 algorithm tests + 3 API tests + 5 UI tests = 21 tests), identify coverage gaps, and add targeted tests for backward compatibility, edge cases, and integration scenarios.

### Sub-tasks

- [ ] **4.1 Audit existing test coverage**
      Review all test files:
  - `src/lib/ranking/__tests__/colley-weighted.test.ts` (4 tests)
  - `src/lib/ranking/__tests__/elo-weighted.test.ts` (4 tests)
  - `src/lib/ranking/__tests__/seeding-factors.test.ts` (5 tests)
  - `src/routes/api/ranking/__tests__/weights-api.test.ts` (3 tests)
  - `src/lib/components/__tests__/weights-page.test.ts` (3 tests)
  - `src/lib/components/__tests__/seeding-columns.test.ts` (2 tests)
    Document which paths are covered and which critical gaps remain. Focus on: backward compatibility verification, edge cases with extreme weights, determinism, and integration between service and algorithms.

- [ ] **4.2 Write backward compatibility tests**
      Create test file: `src/lib/ranking/__tests__/backward-compatibility.test.ts`

  Tests (2 tests):
  1. **All weights = 1.0 equals unweighted**: Run `computeColleyRatings()` and `computeEloRatings()` with 5 teams across 3 tournaments. First run without weight map, then with a weight map where every tournament has weight 1.0. Verify the results are byte-for-byte identical (same ratings, same ranks).
  2. **Colley: undefined vs {} vs missing entries**: Call `computeColleyRatings(records, teams)`, `computeColleyRatings(records, teams, {})`, and `computeColleyRatings(records, teams, undefined)`. Verify all three produce identical output.

- [ ] **4.3 Write edge case tests**
      Create test file: `src/lib/ranking/__tests__/weighting-edge-cases.test.ts`

  Tests (3 tests):
  1. **Very large weight (100.0)**: One tournament with weight 100.0. Verify the Colley system produces valid ratings (no NaN, no Infinity) and the Elo system produces finite ratings.
  2. **Single tournament with weight > 1**: Only one tournament in the season with weight 5.0. Verify Colley produces the same relative rankings as weight 1.0 (since all games are scaled equally). Verify Elo ranks are identical (absolute ratings may differ).
  3. **Mixed weighted and unweighted**: 4 tournaments, only 2 have explicit weights (2.0 and 3.0), others default to 1.0. Verify the results are different from the fully unweighted case and that the system produces valid output.

- [ ] **4.4 Verify existing algorithm tests still pass**
      Run the entire `src/lib/ranking/__tests__/` test suite.
  - Verify ALL existing tests (from Feature 3) pass without modification.
  - This confirms the optional `weightMap` parameter did not break any existing test expectations.
  - Document the total test count: existing + new.

- [ ] **4.5 Run complete feature test suite**
      Run ALL tests across all groups:
  - `src/lib/ranking/__tests__/` (all ranking tests including new ones)
  - `src/routes/api/ranking/__tests__/` (API tests)
  - `src/lib/components/__tests__/weights-page.test.ts` (UI tests)
  - `src/lib/components/__tests__/seeding-columns.test.ts` (UI tests)
    Expected total new tests: 26 (13 + 3 + 5 + 2 + 3). Plus all existing tests.
    Verify zero failures and no test isolation issues.

### Acceptance Criteria

- Backward compatibility is verified: unweighted runs produce identical output to pre-feature behavior.
- Edge cases with extreme weights (0, 100) produce valid results without NaN/Infinity.
- All existing algorithm tests pass without modification (proving backward compatibility).
- The complete test suite passes in a single run with zero failures.
- Total new test count is 26 across all groups.

### Verification Steps

1. Run the complete test suite. Expected: all tests pass with zero failures.
2. Verify no test depends on another test's state by running the suite twice consecutively.
3. Confirm backward compatibility tests explicitly compare weighted vs unweighted output.

### Verification Commands

```bash
# Run all ranking algorithm tests (existing + new)
npx vitest run src/lib/ranking/__tests__/

# Run API tests
npx vitest run src/routes/api/ranking/__tests__/

# Run UI tests
npx vitest run src/lib/components/__tests__/weights-page.test.ts
npx vitest run src/lib/components/__tests__/seeding-columns.test.ts

# Run backward compatibility tests specifically
npx vitest run src/lib/ranking/__tests__/backward-compatibility.test.ts

# Run all tests in a single command
npx vitest run

# Type-check the entire project
npx svelte-check --tsconfig tsconfig.json

# Build verification
npm run build
```

---

## Summary

| Group                         | Implementer        | Focus                                                         | Sub-tasks | Tests | Depends On     |
| ----------------------------- | ------------------ | ------------------------------------------------------------- | --------- | ----- | -------------- |
| 1. Weighted Algorithm Core    | `api-engineer`     | Pure algorithm modifications, types, seeding factors          | 6         | 13    | None           |
| 2. Service Layer & API        | `api-engineer`     | RankingService integration, weights API, results augmentation | 7         | 3     | Group 1        |
| 3. Frontend UI                | `ui-designer`      | Weights management page, results table seeding columns        | 7         | 5     | Group 2        |
| 4. Test Review & Gap Analysis | `testing-engineer` | Backward compatibility, edge cases, full suite verification   | 5         | 5     | Groups 1, 2, 3 |

**Total sub-tasks:** 25
**Total new tests:** 26

### Dependency Graph

```
Group 1: Weighted Algorithm Core (api-engineer)
  |  Pure functions: colley.ts, elo.ts, seeding-factors.ts, types.ts
  |  No database access
  v
Group 2: Service Layer & API (api-engineer)
  |  RankingService, weights API, results API
  |  Database integration
  v
Group 3: Frontend UI (ui-designer)
  |  Weights page, results table columns, navigation
  |  Depends on API endpoints
  v
Group 4: Test Review & Gap Analysis (testing-engineer)
  |  Backward compat, edge cases, full suite
  |  Final quality gate
```

### Existing Code Modified

| Asset                        | Location                                        | Change                                                                                   |
| ---------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `types.ts`                   | `src/lib/ranking/types.ts`                      | Add `SeedingFactors` interface, update `RankingRunOutput`                                |
| `colley.ts`                  | `src/lib/ranking/colley.ts`                     | Add optional `weightMap` parameter, scale matrix contributions                           |
| `elo.ts`                     | `src/lib/ranking/elo.ts`                        | Add optional `weightMap` parameter, scale K-factor per tournament                        |
| `ranking-service.ts`         | `src/lib/ranking/ranking-service.ts`            | Fetch weights, pass to algorithms, compute seeding factors, record weights in parameters |
| `results/+server.ts`         | `src/routes/api/ranking/results/+server.ts`     | Add seeding factors to response                                                          |
| `RankingResultsTable.svelte` | `src/lib/components/RankingResultsTable.svelte` | Add W% and Natl. Finish columns                                                          |
| `+page.svelte` (ranking)     | `src/routes/ranking/+page.svelte`               | Pass seeding factors to results table                                                    |
| `NavHeader.svelte`           | `src/lib/components/NavHeader.svelte`           | Add "Weights" navigation link                                                            |

### New Files Created

| File                             | Location                                                   | Purpose                                          |
| -------------------------------- | ---------------------------------------------------------- | ------------------------------------------------ |
| `seeding-factors.ts`             | `src/lib/ranking/seeding-factors.ts`                       | Pure function for win % and best national finish |
| `weights/+server.ts`             | `src/routes/api/ranking/weights/+server.ts`                | GET/PUT API for tournament weight management     |
| `weights/+page.server.ts`        | `src/routes/ranking/weights/+page.server.ts`               | Server load for weights page (seasons list)      |
| `weights/+page.svelte`           | `src/routes/ranking/weights/+page.svelte`                  | Tournament weights management UI                 |
| `colley-weighted.test.ts`        | `src/lib/ranking/__tests__/colley-weighted.test.ts`        | Weighted Colley unit tests                       |
| `elo-weighted.test.ts`           | `src/lib/ranking/__tests__/elo-weighted.test.ts`           | Weighted Elo unit tests                          |
| `seeding-factors.test.ts`        | `src/lib/ranking/__tests__/seeding-factors.test.ts`        | Seeding factors unit tests                       |
| `weights-api.test.ts`            | `src/routes/api/ranking/__tests__/weights-api.test.ts`     | Weights API integration tests                    |
| `weights-page.test.ts`           | `src/lib/components/__tests__/weights-page.test.ts`        | Weights page UI tests                            |
| `seeding-columns.test.ts`        | `src/lib/components/__tests__/seeding-columns.test.ts`     | Seeding columns UI tests                         |
| `backward-compatibility.test.ts` | `src/lib/ranking/__tests__/backward-compatibility.test.ts` | Backward compatibility tests                     |
| `weighting-edge-cases.test.ts`   | `src/lib/ranking/__tests__/weighting-edge-cases.test.ts`   | Edge case tests                                  |
