# Specification Verification Report

**Feature:** Ranking Algorithm Engine (Feature 3)
**Date:** 2026-02-23
**Execution Profile:** squad / standard
**Verifier:** spec-verifier

---

## Check 1: Requirements Accuracy

Verify all user answers from the Q&A session are accurately captured in `planning/requirements.md`.

| Q#  | User Answer (Raw)                                                                                                                                                    | Captured in requirements.md                                                                                                                                                                                                                                                | Accurate? | Notes                                                                                                                |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------- |
| Q1  | Support both -- derive pairwise W/L from tournament_results now (Team A with lower finish_position beats Team B), and switch to actual match records when available. | Yes. Requirements state "Support both -- derive pairwise W/L from tournament_results now (if Team A finished higher than Team B in the same tournament, that's a 'win'), and switch to actual match records when available. The engine should support both input sources." | PASS      | Accurately captured. The parenthetical clarification about lower finish_position = win is a correct additive detail. |
| Q2  | Both backend (engine + API endpoint) and a minimal UI ("Run Rankings" button and results display).                                                                   | Yes. Requirements state "Both backend (engine + API endpoint) and a minimal UI ('Run Rankings' button and results display)."                                                                                                                                               | PASS      | Verbatim accurate. UI scope correctly characterized as minimal.                                                      |

**Check 1 Result: PASS** -- Both user answers are accurately and faithfully captured in requirements.md.

---

## Check 2: Visual Assets

Check if `planning/visuals/` exists and has files.

- Directory exists: **Yes** -- `planning/visuals/` directory is present.
- Contains files: **No** -- The directory is empty (0 files).
- `requirements.md` states: "No visual assets provided."

**Check 2 Result: PASS** -- Empty visuals directory is consistent with the "No visual assets provided" note in requirements.md. No discrepancy.

---

## Check 3: Visual Design Tracking

No visual asset files exist in `planning/visuals/`. The spec does not include an inline wireframe or visual design section. The UI specification in F9 uses a component hierarchy diagram (ASCII) and a bulleted column list, which is appropriate for a minimal UI. No external visual assets exist to reference.

**Check 3 Result: PASS (N/A)** -- No external visuals to reference. Minimal UI specification is described adequately in textual and structural form.

---

## Check 4: Requirements Coverage in Spec

### Explicit Features from requirements.md

| Requirement                                                                        | Spec Section                                         | Covered? |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------- | -------- |
| Colley Matrix algorithm (construct C, solve Cr=b via LU decomposition)             | F3: Colley Matrix Algorithm (algo1)                  | Yes      |
| 4 Elo variant algorithms (starting ratings 2200, 2400, 2500, 2700, K=32)           | F4: Elo Variant Algorithms (algo2-algo5)             | Yes      |
| W/L derivation from tournament finishes (lower finish_position = win)              | F1: Pairwise W/L Derivation from Tournament Finishes | Yes      |
| Match record support as alternative data source                                    | F2: Match Record Support (Fallback Path)             | Yes      |
| AggRating computation (min-max normalization, arithmetic mean)                     | F5: AggRating Computation                            | Yes      |
| AggRank computation (descending by AggRating, ties alphabetical)                   | F6: AggRank Computation                              | Yes      |
| Ranking run orchestration (create run record, execute algorithms, persist results) | F7: Ranking Run Orchestration                        | Yes      |
| API endpoint (POST /api/ranking/run, season + age group)                           | F8: API Endpoint                                     | Yes      |
| Minimal UI ("Run Rankings" button + results table)                                 | F9: Minimal UI                                       | Yes      |

### Pre-Established Decisions from Product Planning

| Decision                                                         | Captured in Spec? | Where?                                                                        |
| ---------------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------- |
| 5 algorithms: Colley (algo1) + Elo 2200/2400/2500/2700 (algo2-5) | Yes               | F3, F4; New Components table                                                  |
| ml-matrix for Colley Matrix                                      | Yes               | F3 (solve via ml-matrix LU decomposition); Technical Approach: Algorithms     |
| Native TypeScript for Elo                                        | Yes               | F4 (simple arithmetic formula, no library); tech-stack.md alignment confirmed |
| AggRating: 0-100 normalized scale, min-max per algo then average | Yes               | F5 (min-max normalization, arithmetic mean)                                   |
| Elo K=32                                                         | Yes               | F4 (Default K-factor: K = 32), F7 (parameters JSON), F8                       |
| Colley standard matrix construction                              | Yes               | F3 (formula: C[i][i]=2+total_games, C[i][j]=-games, b[i]=1+(w-l)/2)           |
| Full recompute per run                                           | Yes               | F7 (each ranking run processes all tournament data from scratch)              |
| ranking_runs + ranking_results tables already exist              | Yes               | Reusable Components table references existing schemas                         |
| All-TypeScript stack                                             | Yes               | NF3 (TypeScript types), Technical Approach consistently uses TS               |

### Constraints and Scope Boundaries

| Constraint / Out-of-Scope (requirements.md)    | Spec Out-of-Scope Section                                                         | Covered? |
| ---------------------------------------------- | --------------------------------------------------------------------------------- | -------- |
| Tournament weighting (Feature 4)               | Yes -- "Tournament weighting -- All tournaments weighted equally"                 | Yes      |
| Full rankings dashboard (Feature 6)            | Yes -- "Full rankings dashboard -- Filtering, sorting, team detail views..."      | Yes      |
| Manual overrides (Feature 7)                   | Yes -- "Manual overrides and committee adjustments"                               | Yes      |
| Export/reporting (Feature 8)                   | Yes -- "Export and reporting"                                                     | Yes      |
| Match data ingestion (deferred from Feature 2) | Yes -- "Match data ingestion -- No UI or pipeline for importing match-level data" | Yes      |
| Elo K-factor tuning per tier (Feature 4)       | Yes -- "Elo K-factor tuning -- K=32 is fixed"                                     | Yes      |

**Check 4 Result: PASS** -- All functional requirements, pre-established decisions, and scope boundaries from requirements.md are fully covered in the spec. No gaps found.

---

## Check 5: Core Specification Validation

### Goal Alignment

- **Requirements goal:** Implement 5 mathematical rating models (Colley Matrix + 4 Elo variants), compute AggRating and AggRank, store results, provide API endpoint and minimal UI.
- **Spec goal:** "Implement the five mathematical rating models -- Colley Matrix and four Elo variants -- that compute independent ratings and ranks per team, then produce a unified AggRating (0-100 normalized scale) and AggRank from their combined outputs. Provide a server-side ranking service, an API endpoint to trigger ranking runs, and a minimal UI with a 'Run Rankings' button and results table."
- **Verdict:** PASS. Spec goal is a precise expansion of the requirements goal with appropriate specificity.

### User Stories

The spec defines 5 user stories:

1. Trigger a full ranking computation for a season and age group (maps to F7, F8, F9)
2. See per-algorithm ratings/ranks alongside AggRating/AggRank (maps to F3-F6, F9)
3. Rankings computed from tournament finish data (maps to F1)
4. Each ranking run stored as a snapshot (maps to F7 -- run persistence)
5. Programmatic API endpoint for future automation (maps to F8)

All 5 stories are traceable to requirements.md functional requirements. **PASS.**

### Core Requirements Traceability

| Requirement (from requirements.md)                         | Spec Section | Covered? |
| ---------------------------------------------------------- | ------------ | -------- |
| F1: Pairwise W/L derivation from tournament finishes       | F1           | Yes      |
| F2: Match record support (fallback)                        | F2           | Yes      |
| F3: Colley Matrix algorithm (algo1)                        | F3           | Yes      |
| F4: Elo variants (algo2-algo5)                             | F4           | Yes      |
| F5: AggRating computation                                  | F5           | Yes      |
| F6: AggRank computation                                    | F6           | Yes      |
| F7: Ranking run orchestration                              | F7           | Yes      |
| F8: API endpoint                                           | F8           | Yes      |
| F9: Minimal UI                                             | F9           | Yes      |
| NF1: Performance (5 seconds for 73 teams, 60 tournaments)  | NF1          | Yes      |
| NF2: Determinism (identical input -> identical output)     | NF2          | Yes      |
| NF3: Type safety (no `any` in ranking module)              | NF3          | Yes      |
| NF4: Testability (pure algorithm functions)                | NF4          | Yes      |
| NF5: Numerical precision (6 significant digits internally) | NF5          | Yes      |

**All functional and non-functional requirements are covered in the spec.**

### Internal Consistency Check

**Issue 5a (Minor): AggRank column duplication in F9.**

Spec F9 lists the results table columns as: "Rank (agg_rank), Team Name, Colley Rating, Colley Rank, Elo-2200 Rating, Elo-2200 Rank, Elo-2400 Rating, Elo-2400 Rank, Elo-2500 Rating, Elo-2500 Rank, Elo-2700 Rating, Elo-2700 Rank, AggRating, AggRank."

The first column "Rank (agg_rank)" and the last column "AggRank" both refer to `agg_rank`. AggRank appears twice: once as the leading "Rank" column (acting as row number / aggregate rank) and again as "AggRank" at the end (duplicating the same field). This produces 14 column entries that include `agg_rating` and `agg_rank` both at position 1 (as "Rank") and at positions 13-14 (as "AggRating", "AggRank"). Task 3.1 wisely omits the trailing "AggRank" column from its column list (correctly ending at "AggRating"), but the Group 3 acceptance criteria then states "14 columns (Rank, Team Name, 5x Rating, 5x Rank, AggRating, AggRank)" counting 14 -- which creates an inconsistency: task 3.1 implements 13 columns, but the acceptance criteria expects 14.

**Recommendation:** Clarify F9 to explicitly state whether "AggRank" appears as a trailing column in addition to the leading "Rank" column, or whether "Rank" IS AggRank and no trailing AggRank column exists (making it 13 columns). The task 3.1 column list (13 columns, no trailing AggRank) is the more natural implementation.

**Issue 5b (Minor): data_source in parameters JSON set before source is determined.**

Spec F7 (Ranking Run Orchestration) flow step 1 specifies inserting into `ranking_runs` with `parameters` JSON containing `data_source: 'tournament_finishes' | 'match_records'`. However, the decision of which data source to use is made at step 5 (check for match records). This creates a race condition in specification: the `ranking_runs` record is inserted at step 2 with a `data_source` value that is not yet determined until step 5.

Task 2.1 hardcodes `data_source: 'tournament_finishes'` in the initial insert (step 2), then checks for match records at step 5, but the `ranking_runs` row is never updated to reflect `'match_records'` even if match records are used. This means if match records are present, the stored `parameters.data_source` will inaccurately read `'tournament_finishes'`.

**Recommendation:** Either (a) defer the `ranking_runs` insert to after step 5 so the correct `data_source` can be set, or (b) specify that the `data_source` field is updated in a separate update call after step 5 determines the actual source. This should be clarified in both the spec (F7) and task 2.1.

**Issue 5c (Minor): Match fallback logic in spec F2 vs. task 2.1.**

Spec F2 states: "When records exist in the `matches` table for tournaments in the selected season, use those as the primary data source instead of derived finishes." Task 2.1 step 5 implements this correctly. However, F2 also states "For the initial implementation, derived finishes are the default." The granularity of "any match records exist for any tournament in the season" as the trigger for switching all input to match-based W/L is a reasonable interpretation but not completely specified. If only some tournaments have match records and others only have finish data, the behavior is undefined. The spec should clarify whether the fallback is all-or-nothing or per-tournament.

**Recommendation:** Add a sentence to F2 clarifying that the match records check is all-or-nothing for the season: if match records exist for at least one tournament, the engine uses match records for all tournaments (and falls back to finish derivation for tournaments with no match records), or alternatively that the entire season switches to match-based W/L only when all tournaments have match records.

### Success Criteria Alignment

The spec defines 10 success criteria (SC1-SC10), all of which trace to specific functional or non-functional requirements. Notable:

- SC1 (Colley correctness) -> F3 + NF2
- SC2 (Elo correctness) -> F4 + NF2
- SC3 (Pairwise derivation accuracy) -> F1
- SC4 (Normalization) -> F5
- SC5 (Determinism) -> NF2
- SC6 (Run persistence) -> F7
- SC7 (Error cleanup) -> F7
- SC8 (API contract) -> F8
- SC9 (UI functionality, 10-second target) -> F9
- SC10 (Test coverage) -> NF4

All 10 criteria are well-defined and testable. The 10-second target in SC9 is more generous than the 5-second performance target in NF1 (NF1 covers algorithm + DB reads/writes, SC9 covers end-to-end including UI round-trip). This is appropriate and consistent.

**Check 5 Result: PASS with minor issues** -- The spec is internally consistent and comprehensive. Three minor issues identified (5a: AggRank column duplication in F9, 5b: data_source set before determination, 5c: mixed match/finish source granularity undefined). None are blockers.

---

## Check 6: Task List Validation

### Test Count Limits (2-8 per implementation group, max 10 for testing-engineer)

| Group                                | Implementer       | Sub-tasks                      | Tests Written                                                           | Within Limit?                      |
| ------------------------------------ | ----------------- | ------------------------------ | ----------------------------------------------------------------------- | ---------------------------------- |
| Group 1 (Algorithm Implementations)  | database-engineer | 10 (1.1-1.10)                  | 16 (4 tests x 4 test files: derive-wins-losses, colley, elo, normalize) | PASS -- 4 per file, all within 2-8 |
| Group 2 (Service Layer & API)        | api-engineer      | 4 (2.1-2.4)                    | 5 (ranking-service.test.ts)                                             | PASS -- 5 within 2-8               |
| Group 3 (Frontend UI)                | ui-designer       | 4 (3.1-3.4; 3.3 inline in 3.2) | 3 (ranking-ui.test.ts)                                                  | PASS -- 3 within 2-8               |
| Group 4 (Test Review & Gap Analysis) | testing-engineer  | 6 (4.1-4.6)                    | Up to 10 (determinism:2, precision:2, integration:2, edge-cases:4)      | PASS -- exactly 10, at the limit   |

**Total tests: 24 (Groups 1-3) + up to 10 (Group 4) = up to 34. Within bounds.**

### Reusability References in Tasks

| Reusable Asset              | Location                                  | Referenced In Tasks? | Where?                                                                        |
| --------------------------- | ----------------------------------------- | -------------------- | ----------------------------------------------------------------------------- |
| `rankingRunInsertSchema`    | `src/lib/schemas/ranking-run.ts`          | Yes                  | Task 2.1 (validate ranking run record before insert); Summary table           |
| `rankingResultInsertSchema` | `src/lib/schemas/ranking-result.ts`       | Yes                  | Task 2.1 (validate each result row before batch insert); Summary table        |
| `tournamentResultSchema`    | `src/lib/schemas/tournament-result.ts`    | Yes                  | Summary table (type reference for reading tournament results)                 |
| `matchSchema`               | `src/lib/schemas/match.ts`                | Yes                  | Summary table (type reference for reading match records)                      |
| `AgeGroup` enum             | `src/lib/schemas/enums.ts`                | Yes                  | Task 2.2 (validate age_group), Task 3.2 (populate UI selector); Summary table |
| `Database` types            | `src/lib/types/database.types.ts`         | Yes                  | Task 2.1 (`SupabaseClient<Database>` typing); Summary table                   |
| `supabaseServer`            | `src/lib/supabase-server.ts`              | Yes                  | Task 2.2 (instantiate RankingService); Summary table                          |
| `ImportService` pattern     | `src/lib/import/import-service.ts`        | Yes                  | Task 2.1 (class pattern with Supabase constructor injection); Summary table   |
| Import page pattern         | `src/routes/import/+page.svelte`          | Yes                  | Task 3.2 (Svelte 5 runes pattern reference); Summary table                    |
| Upload API pattern          | `src/routes/api/import/upload/+server.ts` | Yes                  | Task 2.2 (POST handler pattern); Summary table                                |
| `ml-matrix`                 | installed dependency                      | Yes                  | Task 1.3 (LU decomposition for Colley); Summary table                         |

**PASS** -- All reusable assets are referenced with specific file paths and usage context. No reuse opportunities missed.

### Task Specificity

Each sub-task includes:

- A specific file path to create (exact location, no ambiguity)
- Detailed implementation instructions (function signatures, algorithm steps, data shapes)
- Clear input/output contracts (TypeScript types, method signatures, return types)
- References to existing code patterns where applicable
- Acceptance criteria with measurable outcomes
- Verification commands (bash commands to run tests)

**PASS** -- Tasks are highly specific and actionable. An implementer can execute each task independently without ambiguity.

### Traceability (Tasks -> Spec Requirements)

| Spec Requirement                          | Task(s)                                                                                   |
| ----------------------------------------- | ----------------------------------------------------------------------------------------- |
| F1: Pairwise W/L derivation from finishes | 1.2 (deriveWinsLossesFromFinishes), 1.7 (tests)                                           |
| F2: Match record support                  | 1.2 (deriveWinsLossesFromMatches), 2.1 (match check in service)                           |
| F3: Colley Matrix algorithm               | 1.3 (computeColleyRatings), 1.8 (tests)                                                   |
| F4: Elo variant algorithms                | 1.4 (computeEloRatings), 1.9 (tests)                                                      |
| F5: AggRating computation                 | 1.5 (normalizeAndAggregate), 1.10 (tests)                                                 |
| F6: AggRank computation                   | 1.5 (normalizeAndAggregate -- includes agg_rank)                                          |
| F7: Ranking run orchestration             | 2.1 (RankingService.runRanking)                                                           |
| F8: API endpoint                          | 2.2 (POST /api/ranking/run)                                                               |
| F9: Minimal UI                            | 3.1 (RankingResultsTable), 3.2 (+page.svelte), 3.3 (results fetch), 2.3 (+page.server.ts) |
| NF1: Performance                          | 4.5 test 8 (73 teams, 60 tournaments, under 5 seconds)                                    |
| NF2: Determinism                          | 4.2 (determinism.test.ts -- 2 tests)                                                      |
| NF3: Type safety                          | 1.1 (types.ts -- no `any`), acceptance criteria Group 1                                   |
| NF4: Testability                          | 1.2-1.5 (all pure functions), 2.4 (mocked Supabase)                                       |
| NF5: Numerical precision                  | 4.3 (precision.test.ts -- Colley sum invariant, Elo extreme gap)                          |

**All spec requirements have at least one corresponding task. No orphaned requirements.**

### Scope Verification

- No task introduces functionality outside the spec's scope.
- Auth/permissions are not implemented in any task (correctly matching out-of-scope).
- Tournament weighting is not implemented (correctly out-of-scope).
- The `flattenPairwiseGroups` utility in task 1.2 is appropriately scoped (needed to serve Colley with a flat array).
- Task 3.3 (results fetching) is correctly implemented as client-side Supabase query using the `ranking_run_id` returned by the API, which matches spec F9 interaction flow step 4.
- Task 4.5 test 10 (API returns 400 for missing `age_group`) tests API contract -- within testing-engineer scope and within max 10 tests.

**PASS** -- Tasks stay within spec scope.

### Task Count Per Group

| Group   | Sub-tasks     | Reasonable?                                                                                      |
| ------- | ------------- | ------------------------------------------------------------------------------------------------ |
| Group 1 | 10 (1.1-1.10) | Yes -- 1 types, 1 derivation module, 1 Colley, 1 Elo, 1 normalize, 1 barrel export, 4 test files |
| Group 2 | 4 (2.1-2.4)   | Yes -- 1 service, 1 API endpoint, 1 page server load, 1 test file                                |
| Group 3 | 4 (3.1-3.4)   | Yes -- 1 table component, 1 page, 1 results fetch (inline in 3.2 but called out), 1 test file    |
| Group 4 | 6 (4.1-4.6)   | Yes -- 1 audit, 4 gap-filling test files, 1 full suite run                                       |

**Total: 24 sub-tasks.** Appropriate for a standard-depth squad execution with a well-scoped mathematical feature.

**Check 6 Result: PASS** -- All test limits respected, reusability referenced, tasks are specific and traceable, scope is maintained, task counts are reasonable.

---

## Check 7: Reusability and Over-Engineering Check

### New Components Review

| New Component                | Location                                        | Justified? | Rationale                                                                                                     |
| ---------------------------- | ----------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------- |
| `types.ts`                   | `src/lib/ranking/types.ts`                      | Yes        | Shared type definitions for the entire ranking module. No equivalent exists.                                  |
| `derive-wins-losses.ts`      | `src/lib/ranking/derive-wins-losses.ts`         | Yes        | Core feature requirement (F1, F2). Pure function, testable in isolation.                                      |
| `colley.ts`                  | `src/lib/ranking/colley.ts`                     | Yes        | Core algorithm requirement (F3). Pure function.                                                               |
| `elo.ts`                     | `src/lib/ranking/elo.ts`                        | Yes        | Core algorithm requirement (F4). Pure function.                                                               |
| `normalize.ts`               | `src/lib/ranking/normalize.ts`                  | Yes        | Core aggregation requirement (F5, F6). Pure function. Separation from algorithms is good for testability.     |
| `index.ts`                   | `src/lib/ranking/index.ts`                      | Yes        | Barrel export following established project pattern (per specchain/STATE.md patterns).                        |
| `ranking-service.ts`         | `src/lib/ranking/ranking-service.ts`            | Yes        | Required orchestrator isolating DB access from pure algorithm functions (NF4). Follows ImportService pattern. |
| `+server.ts` (API)           | `src/routes/api/ranking/run/+server.ts`         | Yes        | Required API endpoint (F8). Follows existing upload API pattern.                                              |
| `+page.server.ts`            | `src/routes/ranking/+page.server.ts`            | Yes        | Required server-side load function for seasons dropdown. Follows established pattern.                         |
| `RankingResultsTable.svelte` | `src/lib/components/RankingResultsTable.svelte` | Yes        | Reusable table component for results display. Separated from the page for testability.                        |
| `+page.svelte`               | `src/routes/ranking/+page.svelte`               | Yes        | Required UI page (F9).                                                                                        |

**No unnecessary new components identified.** All 11 new files serve a distinct and justified purpose.

### Duplicated Logic

- All four Elo variants are implemented through a single parameterized `computeEloRatings` function with a `startingRating` parameter -- no duplication across variants. This is the correct design.
- W/L derivation is separated into two functions (`deriveWinsLossesFromFinishes` and `deriveWinsLossesFromMatches`) but they share a common grouping-and-sorting pattern, which is consolidated through a shared `flattenPairwiseGroups` utility and the common `TournamentPairwiseGroup` type. Appropriate separation, no duplication.
- Zod schema validation of `rankingResultInsertSchema` is done in the service layer before insert -- no double-validation beyond what is appropriate for defense in depth.
- No logic from Feature 1 or Feature 2 is reimplemented.

**PASS** -- No duplicated logic.

### Missing Reuse Opportunities

- All 10 relevant existing assets from Features 1 and 2 are referenced (Zod schemas, Supabase clients, enum types, page/API patterns, ml-matrix).
- The `$lib/supabase-server.ts` (server-side Supabase client with service role key) is correctly specified for all server-side operations (API endpoint, service layer, page server load), matching the pattern established in Feature 2.
- The `$lib/supabase.ts` (client-side) is correctly specified for the client-side results fetch in task 3.3.
- The `createMockSupabase()` pattern established in Feature 2 is implicitly referenced for ranking-service.test.ts (task 2.4 references "mocked Supabase client"), consistent with `specchain/STATE.md` patterns.

**PASS** -- No missing reuse opportunities.

### Over-Engineering Concerns

- The spec does NOT introduce unnecessary abstractions. There is no plugin system for algorithms, no event bus, no abstract factory pattern for algorithm instantiation.
- The parameterized `computeEloRatings(startingRating, kFactor)` function is the correct level of abstraction: one pure function that all four variants call with different parameters, rather than four separate functions or a class hierarchy.
- The `AlgorithmResultMap` type (`Record<string, AlgorithmResult[]>`) is a lightweight data structure that avoids over-engineering a more complex registry or strategy pattern.
- State management on the ranking page uses native Svelte 5 runes (`$state`, `$derived`) without introducing an external state management library.
- The `RankingService` class mirrors the `ImportService` pattern from Feature 2, which is established project convention, not new complexity.
- The separation of pure algorithm functions (Group 1) from the orchestrating service (Group 2) follows NF4 (testability) and is the appropriate architecture for this feature.

**PASS** -- No over-engineering concerns.

**Check 7 Result: PASS** -- No unnecessary components, no duplicated logic, no missing reuse opportunities, no over-engineering.

---

## Critical Issues

**None identified.** All 7 checks pass. The specification and task list are ready for implementation.

---

## Minor Issues

**Issue 1 (Check 5a): AggRank column duplication in spec F9 vs. task 3.1.**

Spec F9 lists 14 columns including both "Rank (agg_rank)" as the first column and "AggRank" as the 14th column. These are the same field (`agg_rank`). Task 3.1 correctly omits the trailing "AggRank" column, implementing 13 columns ending at "AggRating". However, the Group 3 acceptance criteria states "14 columns (Rank, Team Name, 5x Rating, 5x Rank, AggRating, AggRank)" -- a count that includes AggRank as a separate trailing column. This creates a discrepancy between the task column list (13) and the acceptance criteria count (14).

**Resolution:** Clarify F9 in the spec. If AggRank is meant to appear only as the leading "Rank" column, update the column list to remove the trailing "AggRank" entry and update the acceptance criteria to "13 columns." If AggRank is meant to appear as both the first column ("Rank") and a final dedicated "AggRank" column (redundant but useful for wide tables), add "AggRank" explicitly to the task 3.1 column list and confirm the acceptance criteria count of 14.

**Issue 2 (Check 5b): `data_source` in `parameters` JSON set before data source is determined.**

Spec F7 step 1 specifies inserting `ranking_runs` with `parameters` JSON including `data_source: 'tournament_finishes' | 'match_records'`. The data source decision is made at step 5. Task 2.1 hardcodes `data_source: 'tournament_finishes'` in the initial insert at step 2, but if match records are found at step 5, the stored `parameters.data_source` will be inaccurate.

**Resolution:** In task 2.1, update the flow to either: (a) defer the `ranking_runs` insert to after step 5 (requires restructuring the error-cleanup logic slightly, since cleanup is predicated on the run record existing), or (b) insert the run record initially with `data_source: null` and issue a PATCH/update after step 5 once the source is determined. Option (a) is simpler. The spec (F7) should be updated to reflect the corrected sequencing.

**Issue 3 (Check 5c): Mixed match/finish source granularity is undefined.**

Spec F2 states match records are used as the primary data source when they "exist in the `matches` table for tournaments in the selected season." The behavior when only a subset of tournaments have match records is undefined. Task 2.1 implements a binary check ("any match records exist?") and switches entirely to match-based W/L.

**Resolution:** Add a clarifying note to spec F2 (and the corresponding comment in task 2.1) stating: "The check is all-or-nothing for the season. If any match records exist for any tournament in the selected season, the engine uses `deriveWinsLossesFromMatches()` for all tournaments. Tournaments within the season that have no match records will produce zero pairwise records from the match-based path. This is acceptable for the initial implementation." This removes the ambiguity without requiring a per-tournament hybrid approach.

**Issue 4 (Check 6, minor): Task 3.3 is redundant as a separate sub-task.**

Task 3.3 ("Implement results fetching after a successful run") is explicitly marked as inline within task 3.2's success handler and "called out separately for clarity." This is acceptable but slightly inflates the sub-task count. Since task 3.3 has no independent deliverable (it's part of 3.2), it could be absorbed into 3.2 without loss of clarity. This is a cosmetic issue only.

**Issue 5 (Check 6, minor): Execution profile task group structure diverges from tasks.md structure.**

The execution profile (`planning/execution-profile.yml`) proposes 4 task groups: "Colley Matrix Model", "Elo Variant Models", "Aggregation & Normalization", and "Testing & Verification." The final tasks.md reorganizes into: "Algorithm Implementations" (all algorithms unified), "Service Layer & API Endpoint", "Frontend UI", and "Test Review & Gap Analysis."

The tasks.md structure is superior: combining all algorithms into one group is more efficient (they share types and the derivation module), and separating service/API and frontend into their own groups reflects domain boundaries more accurately. The divergence from the execution profile is intentional and beneficial.

**Resolution:** None needed for implementation. This is an informational note.

---

## Over-Engineering Concerns

**None.** The architecture is appropriately scoped:

- Parameterized Elo function eliminates per-variant duplication without introducing abstraction overhead.
- Pure algorithm functions (no DB dependencies) satisfy NF4 without a complex dependency injection framework.
- Svelte 5 runes handle UI state without an external state management library.
- The `RankingService` class follows the established `ImportService` pattern -- no new architectural pattern introduced.
- The `RankingResultsTable` component separation from the page is justified by testability (3 focused UI tests).

---

## Recommendations

1. **Resolve AggRank column count (Issue 1):** Decide whether the results table has 13 or 14 columns and update spec F9, task 3.1 column list, and Group 3 acceptance criteria to be consistent. This should be resolved before implementation begins to avoid a mid-implementation clarification request.

2. **Fix data_source sequencing in F7 and task 2.1 (Issue 2):** Defer the `ranking_runs` insert to after the data source decision (step 5), or add an explicit update step. Update both spec F7 and task 2.1 to reflect the corrected flow. The error cleanup logic will need minor adjustment: if the run record has not yet been inserted when a pre-step-5 failure occurs, the cleanup should simply re-throw without attempting a delete.

3. **Clarify F2 all-or-nothing match fallback semantics (Issue 3):** Add a single sentence to spec F2 and a comment in task 2.1 step 5 clarifying that the match record check is all-or-nothing for the season. This prevents implementation ambiguity.

4. **Add Colley sum invariant to unit tests (not just precision tests):** The Colley rating invariant (sum of all ratings = N/2) is a powerful correctness check currently only in Group 4's precision tests (task 4.3). Consider promoting it to a note in the Group 1 Colley algorithm acceptance criteria as a quick sanity check implementers can verify manually.

---

## Conclusion

**Verification Status: PASS**

The specification and task list for Feature 3 (Ranking Algorithm Engine) are well-constructed and ready for implementation. All 7 verification checks passed:

- Both user Q&A answers are accurately captured in requirements.md
- Visual assets are correctly noted as absent; visuals directory is empty and consistent
- All functional requirements, pre-established decisions, and scope boundaries are fully covered in the spec
- The spec fully covers all 9 functional requirements and 5 non-functional requirements with precise mathematical detail
- The task list has full traceability to spec requirements, appropriate test counts, and high task specificity
- All 10+ reusable assets from Features 1 and 2 are correctly referenced and leveraged
- No over-engineering, duplicated logic, or missing reuse opportunities identified

Three minor issues require resolution before implementation begins (Issues 1-3 above), primarily around the AggRank column count ambiguity, the data_source sequencing problem, and the undefined behavior for mixed match/finish data sources. None are blockers, but all three will cause implementer confusion or result in a bug (Issue 2) if not addressed.

**Total sub-tasks:** 24
**Total tests:** 24 (Groups 1-3) + up to 10 (Group 4) = up to 34
**Task groups:** 4 (linear dependency chain: algorithms -> service/API -> frontend -> testing)
**Reused Feature 1 and 2 assets:** 10 (Zod schemas, Supabase clients, Database types, AgeGroup enum, ml-matrix, API and page patterns)
**New files created:** 21 (11 implementation files + 10 test files)
