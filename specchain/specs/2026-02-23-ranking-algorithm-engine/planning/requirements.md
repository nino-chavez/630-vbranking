# Spec Requirements: Ranking Algorithm Engine

## Initial Description

Implement the 5 mathematical rating models: Colley Matrix (construct and solve the linear system) and 4 Elo variants (starting ratings 2200, 2400, 2500, 2700). Each model produces an independent rating and rank per team. Compute the unified AggRating (0-100 normalized scale) and AggRank from the 5 model outputs.

## Requirements Discussion

### Clarifying Questions

**Q1:** Colley Matrix and Elo both need W/L records between teams. The `matches` table exists but match ingestion was deferred in Feature 2. Should the engine derive W/L from tournament finishes, require actual match records, or support both?
**Answer:** Support both -- derive pairwise W/L from tournament_results now (if Team A finished higher than Team B in the same tournament, that's a "win"), and switch to actual match records when available. The engine should support both input sources.

**Q2:** Should this feature include any UI, or is it purely backend?
**Answer:** Both backend (engine + API endpoint) and a minimal UI ("Run Rankings" button and results display).

### Pre-Established Decisions (from product planning)

The following were already decided during product planning and are documented across `specchain/product/tech-stack.md`, `specchain/product/mission.md`, `specchain/STATE.md`, and existing schemas:

- **5 algorithms:** Colley Matrix (Algo1) + 4 Elo variants at starting ratings 2200 (Algo2), 2400 (Algo3), 2500 (Algo4), 2700 (Algo5)
- **Linear algebra library:** `ml-matrix` for Colley Matrix construction and LU decomposition solving
- **Elo implementation:** Native TypeScript, simple arithmetic -- no library needed
- **AggRating:** 0-100 normalized scale aggregated from the 5 model outputs
- **Matrix size:** 73x73 for 18U Open -- trivially small, no performance concerns
- **All-TypeScript:** No Python backend needed for this scale
- **Database schema:** `ranking_runs` (season_id, ran_at, description, parameters JSON) and `ranking_results` (ranking_run_id, team_id, algo1-5_rating, algo1-5_rank, agg_rating, agg_rank) tables already exist
- **Ranking snapshots:** Store results per run rather than recompute, enabling historical trend analysis
- **Full recompute per run:** Each ranking run processes all tournament data from scratch (Elo processes tournaments chronologically; Colley uses cumulative W/L)

### Existing Code to Reference

**Feature 1 (Data Model & Database Schema):**

- `src/lib/schemas/ranking-run.ts` -- Zod schema for ranking_runs table
- `src/lib/schemas/ranking-result.ts` -- Zod schema for ranking_results table (algo1-5 + agg fields)
- `src/lib/schemas/match.ts` -- Zod schema for matches table (team_a_id, team_b_id, winner_id)
- `src/lib/schemas/tournament-result.ts` -- Zod schema for tournament_results (team_id, tournament_id, division, finish_position, field_size)
- `src/lib/types/database.types.ts` -- Full Supabase Database type interface
- `src/lib/schemas/enums.ts` -- AgeGroup enum ('15U' | '16U' | '17U' | '18U')

**Feature 2 (Data Ingestion Pipeline):**

- `src/lib/import/import-service.ts` -- ImportService pattern for database writes (ValidatedRow, executeMerge, executeReplace)
- `src/lib/supabase-server.ts` -- Server-side Supabase client with service role key
- `src/lib/supabase.ts` -- Client-side Supabase client
- `src/routes/import/+page.svelte` -- Multi-step Svelte 5 page with $state/$derived runes pattern
- `src/routes/api/import/upload/+server.ts` -- API endpoint pattern (+server.ts)
- `src/lib/import/types.ts` -- Type definition pattern for a feature module

**Patterns to follow:**

- Feature module in `src/lib/ranking/` with types, algorithms, and service
- API endpoint in `src/routes/api/ranking/`
- UI page in `src/routes/ranking/` (or extend `/import` page)
- Tests in `src/lib/ranking/__tests__/`
- Mock Supabase pattern from `src/lib/import/__tests__/import-service.test.ts`

## Visual Assets

No visual assets provided.

## Requirements Summary

### Functional Requirements

- **Colley Matrix algorithm:** Construct the Colley matrix C and solve Cr = b using LU decomposition (ml-matrix). Input: pairwise W/L records derived from tournament finishes or match records. Output: Colley rating per team.
- **4 Elo variant algorithms:** Standard Elo rating system with K=32 (default), starting ratings of 2200, 2400, 2500, 2700. Process tournaments chronologically. Input: pairwise results from tournament finishes or match records. Output: Elo rating per team per variant.
- **W/L derivation from tournament finishes:** For each tournament, generate pairwise results from finish positions -- team with lower finish_position beats team with higher finish_position within the same tournament+division.
- **Match record support:** When match records exist in the `matches` table, use those as the primary data source instead of derived finishes.
- **AggRating computation:** Normalize each algorithm's ratings to 0-100 scale, then aggregate (average or weighted combination) to produce unified AggRating.
- **AggRank computation:** Rank teams by AggRating descending to produce AggRank (1 = best).
- **Ranking run orchestration:** Create a ranking_run record, execute all 5 algorithms, write ranking_results rows, record parameters.
- **API endpoint:** POST endpoint to trigger a ranking run for a given season + age group. Returns the run summary.
- **Minimal UI:** "Run Rankings" button on a page, with results displayed in a table showing team, algo1-5 ratings/ranks, AggRating, AggRank.

### Scope Boundaries

**In Scope:**

- Colley Matrix implementation with ml-matrix
- 4 Elo variant implementations (2200, 2400, 2500, 2700 starting ratings)
- Pairwise W/L derivation from tournament_results
- Support for match records as alternative input source
- AggRating normalization (0-100) and AggRank computation
- Ranking run creation and result persistence
- API endpoint for triggering runs
- Minimal UI page with run trigger and results table

**Out of Scope:**

- Tournament weighting (Feature 4)
- Full rankings dashboard with filtering/sorting/team detail (Feature 6)
- Manual overrides and committee adjustments (Feature 7)
- Export/reporting (Feature 8)
- Match data ingestion (deferred from Feature 2)
- Elo K-factor tuning per tournament tier (Feature 4 territory)

### Technical Considerations

- **ml-matrix:** LU decomposition for solving Colley linear system (Cr = b where C is the Colley matrix, b is the RHS vector)
- **Colley Matrix construction:** C_ii = 2 + total_games_i; C_ij = -games_between_i_and_j; b_i = 1 + (wins_i - losses_i) / 2
- **Elo formula:** Expected score E_A = 1 / (1 + 10^((R_B - R_A) / 400)); New R_A = R_A + K \* (S_A - E_A) where S_A = 1 for win, 0 for loss
- **Tournament chronological ordering:** Elo processes tournaments by date to simulate rating evolution over a season
- **Normalization:** Min-max normalization per algorithm: normalized = (rating - min) / (max - min) \* 100
- **Database writes:** Batch insert ranking_results rows within a single ranking run
- **Existing schema compatibility:** algo1 = Colley, algo2-5 = Elo variants (2200, 2400, 2500, 2700)
