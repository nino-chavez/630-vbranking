# Specification: Tournament Weighting & Seeding Criteria

## Goal

Integrate configurable tournament importance weights into the existing ranking algorithm engine so that results from higher-tier tournaments (e.g., AAU Nationals, Chi-Town Challenge) carry proportionally greater influence on team ratings, and compute supplementary seeding factors -- win percentage vs. field and best national event finish -- that are displayed alongside algorithmic rankings to help committee members evaluate and defend the final seeding order. This feature modifies the Colley Matrix and Elo algorithm inputs, adds a weight management API and UI, and augments ranking results with seeding context, all while preserving backward compatibility (no weights configured = identical behavior to the current unweighted engine).

## User Stories

- As a ranking committee member, I want to assign importance weights to each tournament in a season so that results from premier national events influence team ratings more than results from local tournaments.
- As a ranking committee member, I want to see each team's win percentage vs. field alongside their algorithmic ranking so that I can evaluate a team's overall competitive record at a glance.
- As a ranking committee member, I want to see each team's best finish at a Tier-1 (national championship) tournament so that I can factor national event performance into seeding discussions.
- As a ranking committee member, I want tournament weights recorded with each ranking run so that I can reproduce and audit how any past ranking was computed.
- As a ranking committee member, I want a dedicated page to manage tournament weights per season so that I can adjust tier assignments and weights without developer intervention.

## Core Requirements

### Functional Requirements

#### F1: Weighted Colley Matrix

Modify `computeColleyRatings()` to accept an optional weight map (`Record<string, number>` mapping `tournament_id` to weight) and apply weights to the Colley matrix construction. Each pairwise record's contribution to the matrix is scaled by the weight of the tournament it originated from.

**Weighted matrix construction:**

For each pairwise record from a tournament with weight `w`:

- Diagonal elements: `C[winner][winner] += w` and `C[loser][loser] += w` (instead of `+= 1`).
- Off-diagonal elements: `C[winner][loser] -= w` and `C[loser][winner] -= w` (instead of `-= 1`).
- b-vector: `b[winner] += w * 0.5` and `b[loser] -= w * 0.5` (instead of `+= 0.5` / `-= 0.5`).

The initial diagonal value remains `2` and the initial b-value remains `1`, preserving the Colley system's mathematical properties. When no weight map is provided or a tournament has no entry in the weight map, the default weight is `1.0`, making the computation identical to the current unweighted implementation.

**Updated signature:**

```typescript
export function computeColleyRatings(
  pairwiseRecords: PairwiseRecord[],
  teams: TeamInfo[],
  weightMap?: Record<string, number>
): AlgorithmResult[]
```

#### F2: Weighted Elo

Modify `computeEloRatings()` to accept an optional weight map (`Record<string, number>` mapping `tournament_id` to weight) and scale the K-factor per tournament. For each pairwise record within a tournament with weight `w`, the effective K-factor is:

```
effective_K = base_K * w
```

A tournament with weight `2.0` produces double the normal rating swing. A tournament with weight `1.0` (default) produces the standard K-factor behavior, making the computation identical to the current unweighted implementation.

**Updated Elo formula with weighting:**

```
E_A = 1 / (1 + 10^((R_B - R_A) / 400))
New_R_A = R_A + (K * w) * (S_A - E_A)
```

**Updated signature:**

```typescript
export function computeEloRatings(
  tournamentGroups: TournamentPairwiseGroup[],
  teams: TeamInfo[],
  startingRating: number,
  kFactor: number,
  weightMap?: Record<string, number>
): AlgorithmResult[]
```

#### F3: RankingService Integration

Modify `RankingService.runRanking()` to fetch tournament weights from the `tournament_weights` table and pass them to the algorithm functions.

**Changes to the ranking run flow:**

1. After fetching tournaments for the season (step 4 in the current flow), query `tournament_weights` for all tournaments in the season: `SELECT tournament_id, weight FROM tournament_weights WHERE season_id = ? AND tournament_id IN (...)`.
2. Build a weight map: `Record<string, number>` mapping each `tournament_id` to its `weight`. Tournaments without a `tournament_weights` row are not added to the map (algorithm functions default to `1.0` for missing entries).
3. Pass the weight map to `computeColleyRatings()` and all four `computeEloRatings()` calls.
4. Record the weight map in the `ranking_runs.parameters` JSON under a `weights` key.

**Updated `parameters` JSON structure:**

```json
{
  "k_factor": 32,
  "elo_starting_ratings": [2200, 2400, 2500, 2700],
  "data_source": "tournament_finishes",
  "weights": {
    "<tournament_id_1>": 3.0,
    "<tournament_id_2>": 2.5
  }
}
```

If no weights exist in the database for the season, the `weights` field is an empty object `{}`, and all algorithms behave identically to the current unweighted engine.

**Updated `executeAlgorithms` signature:**

```typescript
private executeAlgorithms(
  flatRecords: PairwiseRecord[],
  tournamentGroups: TournamentPairwiseGroup[],
  teams: TeamInfo[],
  config: RankingRunConfig,
  weightMap: Record<string, number>
): NormalizedTeamResult[]
```

#### F4: Seeding Factors Computation

Compute two supplementary seeding factors per team during a ranking run. These factors are NOT incorporated into the algorithmic ranking -- they are supplementary data displayed alongside rankings for committee reference.

**Win % vs. Field:**

- For each team, compute: `win_pct = (total_wins / total_games) * 100`.
- `total_wins` = number of pairwise records where the team is `winner_id`.
- `total_games` = number of pairwise records where the team appears as either `team_a_id` or `team_b_id`.
- If a team has zero games, `win_pct = 0`.
- Computed from the same flattened pairwise records used by the algorithms.
- Stored as a number with 1 decimal place precision (e.g., `72.3`).

**Best National Finish:**

- For each team, find their lowest (best) `finish_position` at any Tier-1 tournament in the season.
- A "Tier-1 tournament" is any tournament with `tier = 1` in the `tournament_weights` table.
- If the team has no finishes at Tier-1 tournaments, the value is `null`.
- Requires joining `tournament_results` with `tournament_weights` on `tournament_id` (and filtering by `season_id` and `tier = 1`).

**New type for seeding factors:**

```typescript
export interface SeedingFactors {
  team_id: string;
  win_pct: number;
  best_national_finish: number | null;
  best_national_tournament_name: string | null;
}
```

**Updated `RankingRunOutput`:**

```typescript
export interface RankingRunOutput {
  ranking_run_id: string;
  results: NormalizedTeamResult[];
  seeding_factors: SeedingFactors[];
  teams_ranked: number;
  ran_at: string;
}
```

Seeding factors are returned as part of the ranking run output but are NOT stored in the `ranking_results` table. They are computed on-the-fly from existing data and served via the results API.

#### F5: Tournament Weights API

Two new API operations for managing tournament weights per season.

**`GET /api/ranking/weights?season_id=<uuid>`**

Returns all tournaments for the given season with their weight configuration.

- Query `tournaments` for the season, left-joined with `tournament_weights` on `(tournament_id, season_id)`.
- Tournaments without a `tournament_weights` row return default values: `weight: 1.0, tier: 5`.
- Response:

```json
{
  "success": true,
  "data": {
    "weights": [
      {
        "tournament_id": "<uuid>",
        "tournament_name": "AAU Nationals",
        "tournament_date": "2026-06-15",
        "weight": 3.0,
        "tier": 1,
        "has_custom_weight": true
      },
      {
        "tournament_id": "<uuid>",
        "tournament_name": "Local Invitational",
        "tournament_date": "2026-01-10",
        "weight": 1.0,
        "tier": 5,
        "has_custom_weight": false
      }
    ]
  }
}
```

- Validation: `season_id` is required and must be a valid UUID.
- Error: 400 if `season_id` is missing or invalid. 500 on database error.

**`PUT /api/ranking/weights`**

Upserts tournament weight records. Accepts an array of weight entries.

- Request body:

```json
{
  "season_id": "<uuid>",
  "weights": [
    { "tournament_id": "<uuid>", "weight": 3.0, "tier": 1 },
    { "tournament_id": "<uuid>", "weight": 2.5, "tier": 2 }
  ]
}
```

- Validate each entry against `tournamentWeightInsertSchema`.
- For each entry, upsert into `tournament_weights` using the `(tournament_id, season_id)` unique constraint: insert if not exists, update `weight` and `tier` if exists.
- To remove a custom weight (revert to default), the entry can be excluded from the request -- only tournaments present in the request array are upserted.
- Response:

```json
{
  "success": true,
  "data": {
    "upserted": 5
  }
}
```

- Validation: `season_id` required (valid UUID), `weights` array required (non-empty), each element must have valid `tournament_id` (UUID), `weight` (positive number), and `tier` (positive integer).
- Error: 400 on validation failure. 500 on database error.

**API file location:** `src/routes/api/ranking/weights/+server.ts`

#### F6: Tournament Weights Management UI

A new page at `/ranking/weights` for managing tournament weights per season.

**Page route:** `/ranking/weights`
**Server load:** `/ranking/weights/+page.server.ts` -- fetches seasons list (same pattern as `/ranking/+page.server.ts`).
**Client page:** `/ranking/weights/+page.svelte`

**Layout and behavior:**

1. **Season selector** at the top (reuses the `Select` component). On season change, fetch weights for that season via `GET /api/ranking/weights?season_id=...`.

2. **Weights table** (uses `DataTable` or a custom table) showing all tournaments for the selected season:
   - Columns: Tournament Name, Date, Tier (editable `Select` or number input), Weight (editable number input), Status (badge showing "Custom" or "Default").
   - Rows are sorted by tournament date ascending.
   - Tier options: 1 (National Championship), 2 (Premier National), 3 (Major Regional), 4 (Standard Regional), 5 (Local/Other).
   - When a tier is selected, auto-populate the weight field with the default for that tier (3.0, 2.5, 2.0, 1.5, 1.0 respectively). The weight field remains editable for fine-tuning.

3. **Save button** at the bottom. Collects all rows with modified weights and sends `PUT /api/ranking/weights`.
   - Disabled when no changes have been made.
   - Shows a loading state during save.
   - Displays a success `Banner` on successful save.
   - Displays an error `Banner` on failure.

4. **Default tier reference** displayed as a `Card` alongside the table showing the tier definitions and default weights.

**State management (Svelte 5 runes):**

- `selectedSeasonId: string` -- `$state`
- `weights: WeightRow[]` -- `$state`, fetched from API
- `originalWeights: WeightRow[]` -- `$state`, snapshot for dirty checking
- `hasChanges: boolean` -- `$derived`, comparing `weights` to `originalWeights`
- `saving: boolean` -- `$state`
- `loadingWeights: boolean` -- `$state`

**WeightRow type (client-side):**

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

#### F7: Results Augmentation

Add seeding factors to the ranking results display.

**API changes:**

Modify `GET /api/ranking/results` to include seeding factors in the response. When a `ranking_run_id` is provided, compute seeding factors (win %, best national finish) for the teams in that run and include them in the response alongside the algorithm results.

**Updated response shape:**

```json
{
  "success": true,
  "data": {
    "results": [ ... ],
    "teams": { ... },
    "seeding_factors": {
      "<team_id>": {
        "win_pct": 72.3,
        "best_national_finish": 2,
        "best_national_tournament_name": "AAU Nationals"
      }
    }
  }
}
```

**UI changes:**

Modify the ranking results table (either `RankingResultsTable.svelte` or the ranking page directly) to display two additional columns:
- **W%**: Win percentage vs. field, displayed as a percentage with 1 decimal place (e.g., "72.3%").
- **Natl. Finish**: Best national (Tier-1) finish, displayed as an ordinal (e.g., "2nd") or "N/A" if no Tier-1 finishes.

These columns appear after AggRank and before the individual algorithm columns, providing immediate context for the committee.

### Non-Functional Requirements

#### NF1: Performance

A weighted ranking run for 73 teams across 60 tournaments with all weights configured must complete in under 5 seconds, including the additional `tournament_weights` query and seeding factors computation. The weight management page must load tournament weights for a season in under 1 second.

#### NF2: Backward Compatibility

When no `tournament_weights` rows exist for a season, the ranking engine must produce results identical to the current unweighted implementation. This is the primary acceptance criterion: existing behavior is preserved by default.

#### NF3: Type Safety

All new and modified function signatures use TypeScript types. The weight map is `Record<string, number>`, not `any` or `object`. Seeding factors use the `SeedingFactors` interface. No `any` types are introduced in any modified or new code.

#### NF4: Testability

Modified algorithm functions remain pure. The weight map is passed as a parameter, not fetched inside algorithms. All new computation logic (seeding factors, weight application) is testable without a database connection. Database interaction remains isolated in the service layer.

## Reusable Components

### Existing Code to Leverage

| Component | Location | Usage |
|---|---|---|
| `computeColleyRatings()` | `src/lib/ranking/colley.ts` | Modified to accept optional `weightMap` parameter |
| `computeEloRatings()` | `src/lib/ranking/elo.ts` | Modified to accept optional `weightMap` parameter |
| `RankingService` | `src/lib/ranking/ranking-service.ts` | Modified to fetch weights, pass to algorithms, record in parameters |
| `PairwiseRecord` type | `src/lib/ranking/types.ts` | Used unchanged; `tournament_id` field already present for weight lookup |
| `TournamentPairwiseGroup` type | `src/lib/ranking/types.ts` | Used unchanged; `tournament_id` field already present for weight lookup |
| `RankingRunConfig` type | `src/lib/ranking/types.ts` | Extended or used alongside weight map |
| `NormalizedTeamResult` type | `src/lib/ranking/types.ts` | Used unchanged for algorithm output |
| `tournamentWeightSchema` | `src/lib/schemas/tournament-weight.ts` | Validate weight data in API endpoints |
| `tournamentWeightInsertSchema` | `src/lib/schemas/tournament-weight.ts` | Validate PUT request body entries |
| `AgeGroup` enum | `src/lib/schemas/enums.ts` | Used in ranking page and API validation |
| `supabaseServer` | `src/lib/supabase-server.ts` | Database queries in API endpoints and service |
| `Button` component | `src/lib/components/Button.svelte` | Save button on weights page |
| `Select` component | `src/lib/components/Select.svelte` | Season selector, tier selector on weights page |
| `Card` component | `src/lib/components/Card.svelte` | Tier reference card on weights page |
| `Banner` component | `src/lib/components/Banner.svelte` | Success/error banners on weights page |
| `PageHeader` component | `src/lib/components/PageHeader.svelte` | Page header for weights management page |
| `DataTable` component | `src/lib/components/DataTable.svelte` | Potential base for weights table |
| `FreshnessIndicator` component | `src/lib/components/FreshnessIndicator.svelte` | Timestamp display on ranking results |
| `RankingResultsTable` component | `src/lib/components/RankingResultsTable.svelte` | Modified to include seeding factor columns |
| Ranking page | `src/routes/ranking/+page.svelte` | Modified to consume and display seeding factors |
| Ranking results API | `src/routes/api/ranking/results/+server.ts` | Modified to include seeding factors in response |
| Ranking run API | `src/routes/api/ranking/run/+server.ts` | Unchanged (weights fetched inside service, not passed from client) |
| `tournament_weights` table | `supabase/migrations/20260223180007_...` | Already exists; no new migration needed |
| `tournament_weights` migration | `supabase/migrations/20260223180007_create_tournament_weights_table.sql` | Already applied; includes indexes and updated_at trigger |

## New Components Required

| Component | Location | Purpose |
|---|---|---|
| **Seeding factors types** | `src/lib/ranking/types.ts` | Add `SeedingFactors` interface and update `RankingRunOutput` to include `seeding_factors` field. |
| **Seeding factors computation** | `src/lib/ranking/seeding-factors.ts` | Pure function `computeSeedingFactors()` that takes flattened pairwise records, Tier-1 tournament IDs, tournament results, tournament names, and team list, returns `SeedingFactors[]`. |
| **Weights API endpoint** | `src/routes/api/ranking/weights/+server.ts` | `GET` and `PUT` handlers for tournament weight management. |
| **Weights page server** | `src/routes/ranking/weights/+page.server.ts` | Server-side load function to fetch seasons list. |
| **Weights page** | `src/routes/ranking/weights/+page.svelte` | Tournament weights management UI with editable table, tier selector, and save functionality. |
| **Seeding factors tests** | `src/lib/ranking/__tests__/seeding-factors.test.ts` | Unit tests for win % computation and best national finish logic. |
| **Weighted Colley tests** | `src/lib/ranking/__tests__/colley-weighted.test.ts` | Unit tests for weighted Colley matrix construction and solving. |
| **Weighted Elo tests** | `src/lib/ranking/__tests__/elo-weighted.test.ts` | Unit tests for weighted K-factor scaling in Elo computation. |

## Technical Approach

### Algorithm Modifications

#### Weighted Colley Matrix

The Colley system `Cr = b` is constructed by iterating over pairwise records. Currently, each record contributes `1` to the diagonal, `-1` to the off-diagonal, and `+/-0.5` to the b-vector. With weighting, each record's contribution is scaled by `w`, the weight of the tournament it originated from.

**Mathematical formulation:**

For team `i` with weighted wins `W_i` and weighted losses `L_i`, and weighted total games `T_i = W_i + L_i`:

```
C[i][i] = 2 + T_i
C[i][j] = -n_ij_weighted    (weighted count of games between i and j)
b[i] = 1 + (W_i - L_i) / 2
```

Where:
- `T_i = sum(w_k)` for all games played by team i, where `w_k` is the weight of the tournament for game k.
- `n_ij_weighted = sum(w_k)` for all games between teams i and j.
- `W_i = sum(w_k)` for all games won by team i.
- `L_i = sum(w_k)` for all games lost by team i.

**Implementation change in `colley.ts`:**

In the pairwise record processing loop, replace the hardcoded `1` and `0.5` with `weight` and `weight * 0.5`:

```typescript
for (const record of pairwiseRecords) {
  const weight = weightMap?.[record.tournament_id] ?? 1.0;
  // ... determine winnerIdx, loserIdx ...
  C[winnerIdx][winnerIdx] += weight;
  C[loserIdx][loserIdx] += weight;
  C[winnerIdx][loserIdx] -= weight;
  C[loserIdx][winnerIdx] -= weight;
  b[winnerIdx] += weight * 0.5;
  b[loserIdx] -= weight * 0.5;
}
```

This preserves the Colley system's mathematical properties (positive-definite matrix, solution bounded between 0 and 1 for reasonable inputs) while emphasizing results from higher-weighted tournaments.

#### Weighted Elo

The Elo algorithm processes tournaments chronologically, updating ratings after each matchup. With weighting, the K-factor is scaled per tournament:

```
effective_K = base_K * w
```

**Implementation change in `elo.ts`:**

In the tournament processing loop, look up the weight for each tournament group:

```typescript
for (const group of tournamentGroups) {
  const weight = weightMap?.[group.tournament_id] ?? 1.0;
  const effectiveK = kFactor * weight;

  for (const record of group.records) {
    // ... existing expected score computation ...
    const newRWinner = rWinner + effectiveK * (1 - eWinner);
    const newRLoser = rLoser + effectiveK * (0 - eLoser);
    // ...
  }
}
```

The weight is applied uniformly to all matchups within a tournament, which aligns with the semantic meaning: a Tier-1 tournament as a whole is more important, not individual games within it.

#### Handling Unweighted Tournaments

Both `computeColleyRatings()` and `computeEloRatings()` treat the `weightMap` parameter as optional. When it is `undefined` or when a tournament's ID is not present in the map, the weight defaults to `1.0`. This makes the feature fully backward compatible:

- If the `tournament_weights` table is empty, the service builds an empty weight map `{}`.
- Algorithm functions receive an empty map and default every tournament to `1.0`.
- Output is identical to the current unweighted engine.

### Service Layer Changes

#### Weight Fetching

`RankingService.runRanking()` adds a new step between fetching tournaments and deriving pairwise records:

```typescript
// After step 4 (fetch tournaments):
const { data: weightRows, error: weightError } = await this.supabase
  .from('tournament_weights')
  .select('tournament_id, weight')
  .eq('season_id', config.season_id)
  .in('tournament_id', tournamentIds);

if (weightError) {
  throw new Error(`Failed to fetch tournament weights: ${weightError.message}`);
}

const weightMap: Record<string, number> = {};
for (const row of weightRows ?? []) {
  weightMap[row.tournament_id] = Number(row.weight);
}
```

#### Updated `executeAlgorithms`

The method signature adds `weightMap` and passes it to each algorithm:

```typescript
private executeAlgorithms(
  flatRecords: PairwiseRecord[],
  tournamentGroups: TournamentPairwiseGroup[],
  teams: TeamInfo[],
  config: RankingRunConfig,
  weightMap: Record<string, number>
): NormalizedTeamResult[] {
  const colleyResults = computeColleyRatings(flatRecords, teams, weightMap);

  const eloResults = config.elo_starting_ratings.map((startRating) =>
    computeEloRatings(tournamentGroups, teams, startRating, config.k_factor, weightMap)
  );

  // ... normalization unchanged ...
}
```

#### Updated Parameters JSON

The `ranking_runs.parameters` JSON now includes the weight map:

```typescript
parameters: {
  k_factor: config.k_factor,
  elo_starting_ratings: config.elo_starting_ratings,
  data_source: dataSource,
  weights: weightMap,
}
```

#### Seeding Factors in Run Flow

After computing algorithm results and before returning, the service computes seeding factors:

1. Compute `win_pct` from the flattened pairwise records (pure computation, no additional DB query).
2. Fetch Tier-1 tournament IDs from the weight map (filter for entries where the tournament has `tier = 1` in `tournament_weights`).
3. Query `tournament_results` for those Tier-1 tournaments, filtered to teams in the current run.
4. For each team, find the lowest `finish_position` at any Tier-1 tournament.
5. Return the seeding factors alongside the algorithm results.

### API Changes

#### New Endpoint: Tournament Weights Management

**File:** `src/routes/api/ranking/weights/+server.ts`

**`GET` handler:**

1. Parse and validate `season_id` from query params.
2. Query `tournaments` for the season, ordered by date.
3. Left-join with `tournament_weights` on `(tournament_id, season_id)`.
4. For tournaments without a `tournament_weights` row, return defaults (`weight: 1.0, tier: 5, has_custom_weight: false`).
5. Return the merged list.

**`PUT` handler:**

1. Parse and validate request body: `{ season_id: string, weights: Array<{ tournament_id, weight, tier }> }`.
2. Validate each weight entry: `tournament_id` is UUID, `weight` is positive number, `tier` is positive integer.
3. For each entry, upsert into `tournament_weights` using Supabase's `upsert()` with `onConflict: 'tournament_id,season_id'`.
4. Return count of upserted records.

#### Modified Endpoint: Ranking Results

**File:** `src/routes/api/ranking/results/+server.ts`

Add seeding factors to the response:

1. After fetching ranking results, fetch the `ranking_run` record to get the `season_id` and `parameters.weights`.
2. Fetch pairwise data (from `tournament_results` or `matches`) for the season.
3. Compute win % for each team from the pairwise records.
4. Identify Tier-1 tournaments from `tournament_weights` (where `tier = 1`).
5. Fetch best finish at Tier-1 tournaments for each team.
6. Include `seeding_factors` map in the response.

#### Unchanged Endpoint: Ranking Run

**File:** `src/routes/api/ranking/run/+server.ts`

No changes needed. The run endpoint already calls `RankingService.runRanking()`, which now internally fetches and applies weights. The client does not pass weights in the request -- weights are managed separately via the weights API and applied automatically during ranking runs.

### Frontend Changes

#### New Page: Tournament Weights Management

**Route:** `/ranking/weights`

**Component hierarchy:**

```
+page.svelte (weights management page)
  PageHeader ("Tournament Weights")
  Card (season selector)
    Select (season dropdown)
  Card (tier reference)
    Tier definitions table (static)
  Card (weights table)
    Table with editable rows
      Each row: Tournament Name | Date | Tier Select | Weight Input | Status Badge
    Button ("Save Changes")
  Banner (success/error feedback)
```

**Interaction flow:**

1. User arrives at `/ranking/weights`. Season selector is shown.
2. User selects a season. Page fetches `GET /api/ranking/weights?season_id=...`.
3. Table populates with all tournaments and their current weights.
4. User changes tier/weight values. Save button becomes enabled.
5. User clicks Save. `PUT /api/ranking/weights` is sent with modified entries.
6. On success, a success banner appears and the table resets its dirty state.
7. On error, an error banner appears with the error message.

**Tier auto-population:** When the user selects a tier from the dropdown, the weight field auto-populates with the default weight for that tier (Tier 1 = 3.0, Tier 2 = 2.5, Tier 3 = 2.0, Tier 4 = 1.5, Tier 5 = 1.0). The user can then manually adjust the weight if desired.

#### Modified Page: Ranking Results Display

**File:** `src/routes/ranking/+page.svelte`

After a successful ranking run, fetch and display seeding factors:

- The ranking results API response now includes `seeding_factors`.
- Pass seeding factors data to the results table component.

**File:** `src/lib/components/RankingResultsTable.svelte`

Add two columns after AggRank:

- **W%**: `seeding_factors[team_id].win_pct` formatted as `XX.X%`.
- **Natl. Finish**: `seeding_factors[team_id].best_national_finish` formatted as ordinal (`1st`, `2nd`, `3rd`, etc.) or `N/A`.

Column headers should include tooltips or abbreviation explanations:
- W% = "Win percentage vs. all opponents across all tournaments"
- Natl. Finish = "Best finish at a Tier-1 (National Championship) tournament"

### Testing

#### Unit Tests for Weighted Colley (`colley-weighted.test.ts`)

- **Weight map applied correctly**: 3 teams, 2 tournaments. Tournament A has weight 2.0, Tournament B has weight 1.0. Verify that the Colley matrix diagonal and off-diagonal values reflect the weighted contributions. Verify the solution differs from the unweighted case.
- **Default weight 1.0**: Same test data with no weight map provided. Verify output matches the existing unweighted `computeColleyRatings()` exactly.
- **Empty weight map**: Pass `{}` as weight map. Verify output is identical to no weight map.
- **Single tournament with weight > 1**: All games from one tournament with weight 3.0. Verify ratings are identical to unweighted (since relative weight is the same when there is only one tournament).
- **Zero-weight tournament**: A tournament with weight 0 should contribute nothing to the matrix (as if the tournament did not exist). Edge case: verify the system remains solvable.

#### Unit Tests for Weighted Elo (`elo-weighted.test.ts`)

- **K-factor scaling**: 2 teams, 1 game, tournament weight 2.0. Verify the rating change is exactly double what it would be with weight 1.0 (since `effective_K = K * 2.0`).
- **Default weight 1.0**: Same test data with no weight map. Verify output matches existing `computeEloRatings()` exactly.
- **Multiple tournaments with different weights**: 3 teams, 2 tournaments. Verify that the final ratings reflect the different K-factors applied to each tournament.
- **Weight 0**: A tournament with weight 0 produces no rating changes (effective_K = 0).

#### Unit Tests for Seeding Factors (`seeding-factors.test.ts`)

- **Win percentage**: 3 teams with known W/L records. Verify win percentages are computed correctly. Team with 5 wins out of 8 games = 62.5%.
- **Zero games**: A team with no pairwise records has win_pct = 0.
- **Best national finish**: Team with finishes at Tier-1 and Tier-3 tournaments. Only the Tier-1 finish is reported.
- **Multiple Tier-1 finishes**: Team finished 3rd at one Tier-1 and 1st at another. Best finish = 1.
- **No Tier-1 finishes**: Team has no results at Tier-1 tournaments. `best_national_finish = null`.
- **No Tier-1 tournaments exist**: When no tournaments are assigned Tier-1, all teams have `best_national_finish = null`.

#### Integration Tests

- **Weight management API**: Test GET returns default weights for tournaments without custom weights. Test PUT upserts weights correctly. Test PUT with invalid data returns 400.
- **Weighted ranking run**: Mock a full ranking run with tournament weights. Verify that the `parameters` JSON in the `ranking_runs` record includes the `weights` field.
- **Backward compatibility**: Run the ranking engine with no weights in the database. Verify output is identical to a baseline run from Feature 3.

#### Edge Cases

- **All weights = 1.0**: Explicitly set all tournament weights to 1.0. Verify output matches the unweighted case (proving that weight=1.0 is the identity operation).
- **Single tournament**: Only one tournament in the season with weight 5.0. Colley and Elo should produce the same relative rankings as weight 1.0 (absolute values may differ for Elo due to K-factor scaling, but ranks should be identical).
- **Very large weight**: Weight = 100.0 for one tournament. Verify the system does not overflow or produce NaN values.
- **Mixed weighted and unweighted**: Some tournaments have explicit weights, others default to 1.0. Verify the mixed scenario produces reasonable results.

## Out of Scope

- **Manual ranking overrides** -- Committee members cannot manually adjust individual team rankings or seeding positions. This is Feature 7.
- **Full rankings dashboard** -- Sorting, filtering, team detail views, historical comparison, and polished data visualization are Feature 6. This feature only adds seeding factor columns to the existing minimal results table.
- **Head-to-head detail view** -- While H2H records are derivable from the pairwise data, building a dedicated H2H lookup UI (hover cards, cross-reference tables) is deferred to Feature 6.
- **H2H as a stored seeding factor** -- H2H records between specific pairs of teams are not computed or stored as part of this feature's seeding factors. The AAU guidelines mention H2H as a tiebreaker, but implementing it as a queryable dataset is Feature 6 scope.
- **Weight presets or templates** -- No ability to save/load weight configurations as named presets or import weights from external sources.
- **Bulk weight import from CSV** -- Weights are managed individually per tournament through the UI.
- **Authentication/authorization on weight management** -- No access control on who can view or modify tournament weights. Deferred until an auth feature is implemented.
- **Algorithm structure changes** -- The five-algorithm structure (Colley + 4 Elo variants) is unchanged. Weights modify how input data is processed, not the algorithm count or aggregation method.
- **Weighted normalization** -- The normalization step (min-max to 0-100 and arithmetic mean) is NOT weighted. All five algorithms contribute equally to AggRating regardless of tournament weights. Tournament weights affect each algorithm's internal computation, not their relative contribution to the aggregate.
- **Automatic tier assignment** -- No logic to automatically assign tiers based on tournament name, size, or other metadata. Tiers are manually set by committee members.

## Success Criteria

1. **Weighted Colley correctness**: Given a 3-team dataset with 2 tournaments (weights 2.0 and 1.0), the weighted Colley ratings differ from unweighted ratings in the expected direction -- teams that performed better at the higher-weighted tournament receive a relative rating boost.

2. **Weighted Elo correctness**: Given a 2-team single-game scenario at a tournament with weight 2.0, the Elo rating change is exactly `2 * K * (S - E)`, double the unweighted change.

3. **Backward compatibility**: Running the engine with an empty `tournament_weights` table produces results identical (byte-for-byte in ratings and ranks) to the Feature 3 unweighted engine.

4. **Default weight behavior**: Calling `computeColleyRatings(records, teams)` without a weight map produces the same output as `computeColleyRatings(records, teams, {})` and `computeColleyRatings(records, teams, undefined)`.

5. **Weight persistence**: After a ranking run with weights, the `ranking_runs.parameters` JSON contains a `weights` object mapping tournament IDs to their numeric weights.

6. **Win percentage accuracy**: For a team with 15 wins in 20 pairwise games, `win_pct` equals `75.0`.

7. **Best national finish accuracy**: A team that finished 2nd at AAU Nationals (Tier-1) and 1st at a Tier-3 tournament reports `best_national_finish: 2` and `best_national_tournament_name: "AAU Nationals"`.

8. **Weights API GET**: `GET /api/ranking/weights?season_id=<valid>` returns all tournaments for the season with their weights, defaulting to `1.0 / tier 5` for tournaments without custom weights.

9. **Weights API PUT**: `PUT /api/ranking/weights` with valid data creates/updates `tournament_weights` rows and returns the count of upserted records.

10. **Weights UI loads**: Navigating to `/ranking/weights`, selecting a season, and waiting shows a table of all tournaments with editable weight and tier fields.

11. **Weights UI saves**: Modifying weights in the UI and clicking Save persists the changes. Reloading the page shows the saved values.

12. **Results augmentation**: After a ranking run, the results table displays W% and Natl. Finish columns with correct values for each team.

13. **Tier auto-population**: Selecting Tier 1 in the weights UI auto-fills weight to 3.0. Selecting Tier 5 auto-fills weight to 1.0. The weight field remains manually editable after auto-fill.

14. **Performance**: A weighted ranking run for 73 teams completes in under 5 seconds. The weights management page loads in under 1 second.

15. **Test coverage**: Unit tests cover weighted Colley, weighted Elo, seeding factors computation, and backward compatibility. All tests pass with no regressions in existing algorithm tests.
