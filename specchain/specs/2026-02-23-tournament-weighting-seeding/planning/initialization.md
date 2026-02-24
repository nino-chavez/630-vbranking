# Feature 4: Tournament Weighting & Seeding Criteria

Tournament Weighting & Seeding Criteria -- Apply tiered importance weights to tournament finishes following AAU priority order (Chi-Town Challenge through AAU Nationals). Compute automated seeding factors: record vs. field win percentage, head-to-head records between teams, and weighted national event finishes. Combine these with algorithmic rankings to produce the final seeding order.

## Existing Infrastructure

### Database Schema (already created)

- `tournament_weights` table: `id`, `tournament_id` (FK), `season_id` (FK), `weight` (NUMERIC), `tier` (INTEGER), UNIQUE constraint on `(tournament_id, season_id)`. Migration exists at `supabase/migrations/20260223180007_create_tournament_weights_table.sql`.
- `tournament_weight.ts` Zod schema: `tournamentWeightSchema`, `tournamentWeightInsertSchema`, `tournamentWeightUpdateSchema`, `TournamentWeight` type.

### Ranking Engine (Feature 3, implemented)

- `src/lib/ranking/types.ts` -- `PairwiseRecord`, `TournamentPairwiseGroup`, `AlgorithmResult`, `NormalizedTeamResult`, `RankingRunConfig`, `RankingRunOutput`, `TeamInfo`
- `src/lib/ranking/derive-wins-losses.ts` -- `deriveWinsLossesFromFinishes()`, `deriveWinsLossesFromMatches()`, `flattenPairwiseGroups()`
- `src/lib/ranking/colley.ts` -- `computeColleyRatings()` (takes flat PairwiseRecord[], teams)
- `src/lib/ranking/elo.ts` -- `computeEloRatings()` (takes TournamentPairwiseGroup[], teams, startingRating, kFactor). K-factor is currently fixed at 32.
- `src/lib/ranking/normalize.ts` -- `normalizeAndAggregate()` (takes AlgorithmResultMap, teams). Currently uses simple arithmetic mean of 5 normalized scores.
- `src/lib/ranking/ranking-service.ts` -- `RankingService.runRanking()` orchestrates everything. Currently does NOT fetch tournament_weights.
- `src/routes/api/ranking/run/+server.ts` -- POST handler, passes `DEFAULT_K_FACTOR` (32) and `ELO_STARTING_RATINGS` ([2200, 2400, 2500, 2700]).
- `src/routes/ranking/+page.svelte` -- UI with season/age group selectors, "Run Rankings" button, results table.

### Design System (Feature 5, implemented)

- 12 Svelte 5 components in `src/lib/components/`: Button, Select, Card, Banner, PageHeader, NavHeader, PageShell, DataTable, RankBadge, TierRow, FreshnessIndicator, Spinner
- CSS design tokens in `src/app.css` with Tailwind v4 `@theme` mapping

### Tests (94 total, 23 files, all passing)

- 9 ranking algorithm test files in `src/lib/ranking/__tests__/`
- 8 component/UI test files in `src/lib/components/__tests__/`

## Key Architectural Decisions to Resolve

1. **How should weights apply to Colley?** -- Colley is a linear system where game counts form the matrix. Weighting can be applied by counting a game from a Tier-1 tournament as worth more "games" (e.g., weight=2.0 means the pairwise record counts double in the matrix coefficients).

2. **How should weights apply to Elo?** -- Elo processes games chronologically with K-factor. Weighting can be applied by scaling the K-factor per tournament: `effective_K = base_K * weight`. Higher-weighted tournaments produce larger rating swings.

3. **What are the official tournament tiers?** -- The AAU priority order mentioned in the roadmap: Chi-Town Challenge, SoCal Winter Formal, Boys Winter Invitational, through AAU Nationals. Need to define tier groupings and default weights.

4. **What seeding factors beyond algorithmic rankings?** -- Per roadmap: record vs. field win %, head-to-head records between teams, weighted national event finishes. These are supplementary data points displayed alongside rankings.

5. **How to manage weights?** -- A CRUD UI for committee members to assign/edit tournament weights per season, or seed defaults from a config.

6. **Where does "final seeding order" come from?** -- The algorithmic rankings (now weighted) ARE the seeding order. The seeding factors (H2H, win %, national finishes) are supplementary data displayed alongside to help committee members understand and optionally adjust (Feature 7).

## Scope

This feature must:
1. Integrate tournament weights into the existing ranking algorithms (Colley and Elo)
2. Compute supplementary seeding factors (H2H records, win % vs field, national event finishes)
3. Provide a way to manage tournament weights (CRUD API + UI)
4. Store weight configuration alongside ranking run parameters
5. Display seeding factors in the ranking results table

This feature must NOT:
- Build manual override functionality (Feature 7)
- Build the full rankings dashboard with sorting/filtering (Feature 6)
- Change the 5-algorithm structure (Colley + 4 Elo variants)
- Add new algorithms
