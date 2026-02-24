# Spec Verification Report: Tournament Weighting & Seeding Criteria

## Summary

- Critical Issues: 4
- Minor Issues: 6
- Overall: FAIL

---

## Checklist Results

### A. Spec-to-Requirements Traceability

**A1. Does every requirement in requirements.md have a corresponding section in spec.md?**
PASS. All six scope items from requirements.md are covered in spec.md. Q1 (Colley weighting) maps to F1. Q2 (Elo weighting) maps to F2. Q3 (tiers/default weights) is embedded in F5/F6. Q4 (seeding factors) maps to F4. Q5 (weight management) maps to F5 and F6. Q6 (run parameters) maps to F3.

**A2. Are all answers from the Q&A section reflected in the spec?**
FAIL (minor). Q4 in requirements.md lists three seeding factors: win % vs field, head-to-head records, and national event finish. The Q&A answer explicitly states "Head-to-Head Record: stored as a lookup, displayed on hover or in a detail view. Not part of this feature's UI -- just computed and available via API." However, spec.md places H2H entirely in Out of Scope, including its computation. There is no API endpoint, no stored lookup, and no computation of H2H in the spec. The requirements Q&A promised H2H would be "computed and available via API" in this feature, but the spec silently removes it without a note reconciling this change. The discrepancy is minor because the Out of Scope section does acknowledge the deferral, but the exact promise in Q4 ("just computed and available via API") is not honored.

**A3. Does the spec scope match the requirements scope summary?**
PASS with note. The scope summary in requirements.md lists six items matching F1-F7 in the spec. The minor mismatch from A2 is the only discrepancy. The Out of Scope section in the spec covers everything requirements.md excludes.

---

### B. Spec Completeness

**B1. Does the spec have all required sections?**
PASS. The spec contains: Goal, User Stories, Core Requirements (Functional F1-F7 and Non-Functional NF1-NF4), Reusable Components, New Components Required, Technical Approach, Out of Scope, and Success Criteria. All required sections are present.

**B2. Are all functional requirements (F1-F7) fully specified with enough detail to implement?**
PASS with minor gaps. F1-F6 are thoroughly specified. F7 has a minor gap: the spec states "Modify `GET /api/ranking/results` to include seeding factors in the response" and describes how to compute them, but does not specify whether the `ranking_run` record needs a `season_id` column and what the exact DB query looks like for re-fetching pairwise records in the results endpoint. The Technical Approach section does describe this flow in prose, but the pairwise data re-fetch for the results endpoint is less crisply specified than F5's API schemas. This is a minor gap, not a blocker.

**B3. Are algorithm modifications mathematically specified?**
PASS. Both the Colley and Elo weighted formulas are provided with full mathematical descriptions and pseudocode. The Colley formulation correctly describes weighted diagonal, off-diagonal, and b-vector contributions. The Elo formulation correctly defines effective_K = base_K * w.

**B4. Are API endpoints fully specified (method, path, request/response schemas)?**
PASS. `GET /api/ranking/weights` and `PUT /api/ranking/weights` are fully specified with request params, response JSON, and error codes. F7's modification to `GET /api/ranking/results` shows the updated response schema. File locations are specified.

**B5. Are all edge cases identified?**
PASS with one gap. The spec covers: no weights, all weights = 1.0, empty weight map vs undefined, single tournament with weight > 1, zero-weight tournament, very large weight (100.0), mixed weighted/unweighted. One missing edge case: what happens when `elo_starting_ratings` in `config` has fewer than four entries -- this is a pre-existing concern, not introduced by this feature, so it is not a failure for this spec. The edge case of a `PUT /api/ranking/weights` request that reverts a weight (deleting a custom row) is mentioned only as "exclude from request array." There is no DELETE support described. This is minor but could confuse implementers since the spec says "to remove a custom weight, the entry can be excluded from the request -- only tournaments present in the request array are upserted." This means there is no way to revert a previously saved custom weight back to the default through the UI, which is a functional gap.

---

### C. Tasks-to-Spec Traceability

**C1. Does every functional requirement in the spec have at least one task that implements it?**
PASS. F1 (weighted Colley) -> task 1.3. F2 (weighted Elo) -> task 1.4. F3 (RankingService integration) -> tasks 2.2, 2.6. F4 (seeding factors computation) -> tasks 1.2, 1.5, 2.3. F5 (weights API) -> task 2.4. F6 (weights management UI) -> tasks 3.2, 3.3. F7 (results augmentation) -> tasks 2.5, 3.4, 3.5.

**C2. Are all "New Components Required" from the spec represented in the tasks?**
PASS. All eight new components from the spec's "New Components Required" table are represented in the tasks:
- `SeedingFactors` interface -> task 1.2
- `seeding-factors.ts` module -> task 1.5
- `weights/+server.ts` API -> task 2.4
- `weights/+page.server.ts` -> task 3.2
- `weights/+page.svelte` -> task 3.3
- `seeding-factors.test.ts` -> task 1.1
- `colley-weighted.test.ts` -> task 1.1
- `elo-weighted.test.ts` -> task 1.1

**C3. Are all test files mentioned in tasks aligned with the testing section of the spec?**
PASS. The spec's Testing section describes tests for weighted Colley, weighted Elo, seeding factors, integration, and edge cases. Tasks 1.1, 2.1, 3.1, 4.2, and 4.3 create all the described test files. The tasks add two additional test files not explicitly named in the spec's Testing section (`backward-compatibility.test.ts` and `weighting-edge-cases.test.ts`), which is appropriate gap-filling.

---

### D. Tasks Quality

**D1. Are sub-task counts within the 3-10 guideline per group?**
PASS. Group 1: 6 sub-tasks. Group 2: 7 sub-tasks. Group 3: 7 sub-tasks. Group 4: 5 sub-tasks. All within range.

**D2. Do task dependencies form a valid DAG (no circular dependencies)?**
PASS. Group 1 has no dependencies. Group 2 depends on Group 1. Group 3 depends on Group 2. Group 4 depends on Groups 1, 2, 3. Linear dependency chain with no cycles.

**D3. Are file paths in tasks consistent with existing codebase structure?**
PASS. All file paths match the observed directory structure:
- `src/lib/ranking/` for algorithm files
- `src/lib/ranking/__tests__/` for algorithm tests (existing pattern confirmed)
- `src/routes/api/ranking/` for API endpoints
- `src/routes/ranking/` for page routes
- `src/lib/components/` for shared components
- `src/lib/components/__tests__/` for component tests (inferred from existing patterns)

**D4. Do tasks reference the correct existing files to modify?**
PASS. Tasks reference `colley.ts`, `elo.ts`, `ranking-service.ts`, `types.ts`, `results/+server.ts`, `RankingResultsTable.svelte`, `+page.svelte` (ranking), and `NavHeader.svelte` -- all of which exist and are the correct files to modify per the spec.

**D5. Are test expectations specific enough to implement (assertions described)?**
PASS with one minor gap. Most test descriptions are precise: exact team counts, exact W/L records, exact expected values (e.g., "Team with 5 wins out of 8 games = 62.5%", "rating change is exactly double"). The minor gap is in task 2.1 (API tests), where the test descriptions say "Mock Supabase to return..." but do not specify the exact mock structure or the Vitest/Supabase mocking pattern used in the existing test suite. An implementer will need to infer the mocking approach from existing test files. This is a minor implementation detail gap, not a specification gap.

---

### E. Codebase Consistency

**E1. Do type modifications preserve backward compatibility with existing code?**
PASS. Adding `SeedingFactors` as a new interface does not break anything. Updating `RankingRunOutput` to add `seeding_factors: SeedingFactors[]` is a breaking change in TypeScript terms -- existing code that constructs a `RankingRunOutput` literal (e.g., the `return` statements in `ranking-service.ts`) will fail to compile because the new required field is missing. The spec does not flag this as a breaking change that needs migration. The spec should note that `seeding_factors` must be added to all existing `RankingRunOutput` construction points in the service. This is a critical issue: the tasks do update `ranking-service.ts` in tasks 2.2 and 2.3, and task 2.3 says to "include `seeding_factors` in the returned `RankingRunOutput`", but task 2.2 also has its own `return` statement in the service. If tasks 2.2 and 2.3 are implemented in sequence as written, the code will be in a broken TypeScript state between 2.2 and 2.3 completion. The ordering is noted as a dependency within the group but the intermediate compile-error state is not acknowledged.

**E2. Do algorithm function signature changes use optional parameters?**
PASS. Both `computeColleyRatings()` and `computeEloRatings()` spec the new `weightMap` as `weightMap?: Record<string, number>` (optional with `?`). This preserves all existing call sites without modification.

**E3. Is the weight map type consistent across all algorithm references?**
PASS. `Record<string, number>` is used consistently throughout the spec and tasks for the weight map type -- in F1, F2, F3, the Technical Approach, and all task descriptions.

**E4. Does the API design follow the pattern established by existing endpoints?**
PASS. The existing `run/+server.ts` and `results/+server.ts` use `json()` from `@sveltejs/kit`, `supabaseServer` for DB access, try/catch for error handling, and `{ success: true, data: {...} }` / `{ success: false, error: string }` response shapes. The spec's weights API follows the same pattern exactly.

**E5. Does the UI design use existing design system components?**
PASS. The weights page spec references `PageHeader`, `Card`, `Select`, `Button`, `Banner` -- all of which exist in `src/lib/components/`. The ranking results table modification references `RankingResultsTable.svelte` and `DataTable`, both of which exist.

**E6. Is `$app/state` used (not `$app/stores`) for SvelteKit Svelte 5?**
PASS. The spec does not import or reference `$app/stores` anywhere. The weights page uses `$state`, `$derived`, and `$props` runes, and the server load uses a standard `load` function. The NavHeader component already uses `currentPath` as a prop rather than `$page` store, and task 3.6 follows the existing pattern.

**E7. Are Svelte 5 runes referenced correctly ($state, $derived, $props)?**
PASS. The spec and tasks consistently use correct Svelte 5 rune syntax: `$state()`, `$derived`, `$props()`. The weights page state management section correctly uses `$state('')`, `$state([])`, `$derived`, and the page component uses `$props()` to receive server data. No legacy store patterns (`writable`, `readable`, `$:`) appear.

---

### F. Risk Assessment

**F1. Are there any missing edge cases?**
FAIL (minor). One missing edge case in the spec: reverting a custom weight back to default. The spec says a weight can be excluded from the `PUT` request body to avoid upserting it, but provides no mechanism to actually DELETE an existing `tournament_weights` row. If a committee member sets a tournament to Tier 1 weight=3.0, saves it, then wants to revert to "default" (no custom weight), the UI has no way to accomplish this. The Save button only sends the array of entries present in the request -- it does not delete rows that are absent from the request. This is a functional gap in F5 and F6 that will manifest as a UX problem.

**F2. Are there any potential breaking changes to existing tests?**
FAIL (critical). The existing `RankingRunOutput` interface in `types.ts` does not have `seeding_factors`. All existing tests that instantiate or assert on `RankingRunOutput` objects (e.g., in `ranking-service.ts` tests from Feature 3) will fail TypeScript compilation after task 1.2 adds the required `seeding_factors` field. The tasks do not include a step to audit existing tests and update them to add `seeding_factors: []` to mock return values. Task 4.4 says "verify ALL existing tests pass without modification" -- this is contradicted by the type change in task 1.2. This is a critical issue because task 4.4's acceptance criterion is impossible as stated if existing tests construct `RankingRunOutput` objects.

**F3. Are there any mathematical concerns with the weighting approach?**
FAIL (critical). The spec specifies the weighted Colley system preserves "the Colley system's mathematical properties (positive-definite matrix, solution bounded between 0 and 1 for reasonable inputs)." However, the spec also mandates that a zero-weight tournament (weight = 0) should contribute nothing to the matrix. If a tournament has weight 0 and a game from it is the only game involving a team, that team's row in the Colley matrix will have only the initial diagonal value of 2 (from the base initialization) and no off-diagonal contributions. This is mathematically valid -- the team will receive a rating of 0.5 (neutral). However, the spec's edge case says "verify the system remains solvable" without verifying that the solution is numerically stable when many tournaments have weight 0. The deeper concern is that the b-vector can still receive contributions from weight > 0 tournaments for a team that only played weight = 0 tournaments. Actually, if a team only plays in weight=0 tournaments, b[i] = 1 + 0 = 1 and C[i][i] = 2 + 0 = 2, so the team gets rating 0.5. This is correct behavior. No actual mathematical error exists. REVISED: PASS -- the math is correct.

**F4. Are there any performance concerns?**
PASS with note. The spec acknowledges the performance requirement (NF1: under 5 seconds for 73 teams, 60 tournaments). The additional DB queries added are: one `tournament_weights` query in the service, one `tournament_weights` (tier=1) query for seeding factors, and one `tournament_results` query for Tier-1 finishes. The results endpoint also adds multiple queries. These are all bounded queries (filtered by season and tournament list). No N+1 query patterns are introduced. The note is that the results endpoint (F7) now performs significantly more work than before -- potentially 4-5 additional DB round trips -- and the spec does not include a performance requirement for the results endpoint specifically. The 1-second requirement is only for the weights management page, not the results endpoint.

---

## Issues Found

### Issue 1 (Critical): `RankingRunOutput` type change breaks existing tests

**Location:** `src/lib/ranking/types.ts` (task 1.2) and existing test files from Feature 3.

**Problem:** Task 1.2 adds `seeding_factors: SeedingFactors[]` as a required field to `RankingRunOutput`. The existing `ranking-service.ts` has two `return` statements constructing `RankingRunOutput` objects (lines 158-165 and 193-199) that do not include `seeding_factors`. Adding the required field will cause TypeScript compilation failures at those sites AND in any existing tests that mock or assert on `RankingRunOutput`. Task 4.4 says "Verify ALL existing tests pass without modification" -- this is impossible as written.

**Suggested Fix:** Either (a) make `seeding_factors` optional in the interface (`seeding_factors?: SeedingFactors[]`) and document that it becomes required after task 2.3 completes, or (b) add a step to tasks 2.2 or 2.3 to explicitly update the two `return` statements in `ranking-service.ts` to include `seeding_factors: []` as a temporary placeholder, then populate it in task 2.3. Also add a note in task 4.4 that existing tests constructing `RankingRunOutput` literals may need `seeding_factors: []` added.

---

### Issue 2 (Critical): Intermediate compile-error state between tasks 2.2 and 2.3

**Location:** Tasks 2.2 and 2.3 in Group 2.

**Problem:** Task 2.2 modifies `ranking-service.ts` to fetch weights and pass them to algorithms, but the two `return` statements in `runRanking()` still return objects that now do not satisfy the updated `RankingRunOutput` type (missing `seeding_factors`). Task 2.3 adds `seeding_factors` to the return value. Between the completion of 2.2 and 2.3, the codebase will not compile. The tasks are listed as sequential sub-tasks within a single group, but an implementer who runs `svelte-check` after 2.2 will see errors.

**Suggested Fix:** Combine the return-value update into task 2.2 (add `seeding_factors: []` as placeholder) and update in 2.3 to the real computation. Or re-order so that 2.3 comes before 2.2's return-value handling. Document the expected intermediate state.

---

### Issue 3 (Critical): No mechanism to delete/revert a custom tournament weight

**Location:** F5 spec (`PUT /api/ranking/weights`) and F6 UI spec.

**Problem:** The spec describes a `PUT` endpoint that upserts entries present in the request array. There is no `DELETE` operation and no "reset to default" operation. Once a custom weight is saved, committee members have no way to revert a tournament to the default (tier=5, weight=1.0) short of manually setting it back to those values. The spec says "To remove a custom weight (revert to default), the entry can be excluded from the request -- only tournaments present in the request array are upserted." This means excluded entries are simply not touched, not deleted. There is no way to actually revert.

**Suggested Fix:** Add a `reset_to_default` flag or a separate DELETE endpoint, OR clarify that the `PUT` endpoint with the full season's tournament list (including defaults) will overwrite all existing entries, and add a "Reset to Default" action per row in the UI that sends the `weight: 1.0, tier: 5` values and removes the custom-weight status. If the intent is that setting weight=1.0 and tier=5 is equivalent to "no custom weight," document this clearly and have the API delete the row when those exact default values are submitted rather than upserting them.

---

### Issue 4 (Critical): Seeding factors computation requires `tournament_results` data but the current results endpoint (`GET /api/ranking/results`) does not have access to the original `season_id` or `data_source` without re-querying `ranking_runs`

**Location:** F7 spec, task 2.5 -- "Augment ranking results API with seeding factors."

**Problem:** Task 2.5 says to fetch the `ranking_run` record to get `season_id`, then re-fetch pairwise data for the season. However, the existing `results/+server.ts` only queries `ranking_results` and `teams` tables. To compute seeding factors, it now needs `ranking_runs` (for season_id and parameters), `tournament_results` or `matches` (for pairwise records), `tournament_weights` (for Tier-1 IDs), and another `tournament_results` query (for Tier-1 finishes). This is 4-5 additional DB queries per results request. More critically, the results endpoint will now essentially re-run part of the ranking pipeline on every results fetch. The spec acknowledges this ("seeding factors are computed on-the-fly from existing data") but does not address the duplication with the service layer that already computed them. This means seeding factors are computed twice for a fresh run: once in `runRanking()` (returned in `RankingRunOutput`) and once in the results API.

**Suggested Fix:** Either (a) store seeding factors in a `ranking_seeding_factors` table during the run (contradicts the spec's decision not to store them), or (b) have the run endpoint return seeding factors in its response and the client stores them in state alongside results (avoiding the re-computation), or (c) accept the redundant computation and document the performance cost. The spec should explicitly address this architectural tension and pick one approach. As written, the architecture is inconsistent: `RankingRunOutput` already carries `seeding_factors`, but the `run` endpoint's response (in `run/+server.ts`) does NOT return them to the client (it only returns `ranking_run_id`, `teams_ranked`, `ran_at`). Then the client fetches `GET /api/ranking/results` which re-computes them. The spec does not reconcile this flow gap.

---

### Issue 5 (Minor): H2H computation discrepancy between requirements and spec

**Location:** requirements.md Q4 vs spec.md Out of Scope.

**Problem:** Q4 in requirements.md explicitly says "Head-to-Head Record: stored as a lookup, displayed on hover or in a detail view. Not part of this feature's UI -- just computed and available via API." The spec removes H2H entirely (no computation, no API). The Out of Scope section says "H2H records between specific pairs of teams are not computed or stored as part of this feature's seeding factors." This contradicts the requirements Q&A commitment.

**Suggested Fix:** Add a note in the spec reconciling the decision. Something like: "The Q&A phase indicated H2H would be computed and available via API, but upon further design analysis, H2H computation is deferred entirely to Feature 6 (Rankings Dashboard) where the full detail view will expose it. No H2H work is done in Feature 4." This makes the decision traceable.

---

### Issue 6 (Minor): `tournamentWeightInsertSchema` includes `season_id` as required but PUT request handler builds entries from `season_id` + `weights` array

**Location:** `src/lib/schemas/tournament-weight.ts` and F5 spec (PUT handler).

**Problem:** The existing `tournamentWeightInsertSchema` (confirmed in code) requires `{ tournament_id, season_id, weight, tier }` -- all four fields. The PUT request body has a top-level `season_id` plus a `weights` array of `{ tournament_id, weight, tier }`. The spec says to "validate each entry against `tournamentWeightInsertSchema`" but the array entries do not contain `season_id`. The task (2.4) says to include `season_id` when building the upsert payload, but the validation step using `tournamentWeightInsertSchema` cannot be applied directly to the array entries as received -- the `season_id` must be injected first. This is an implementation detail mismatch that could cause confusion.

**Suggested Fix:** Clarify in F5 and task 2.4 that validation uses a modified schema (omitting `season_id` from per-entry validation since it comes from the top-level field), then `season_id` is merged before the upsert. Or create a separate request-body schema for the PUT that reflects the actual shape.

---

### Issue 7 (Minor): Task 1.5 `computeSeedingFactors` signature does not match the spec-defined interface inputs

**Location:** Spec F4 and task 1.5.

**Problem:** F4 says "Pure function `computeSeedingFactors()` that takes flattened pairwise records, Tier-1 tournament IDs, tournament results, tournament names, and team list." Task 1.5 specifies the actual signature as:

```typescript
export function computeSeedingFactors(
  pairwiseRecords: PairwiseRecord[],
  teams: TeamInfo[],
  tier1TournamentFinishes: Array<{
    team_id: string;
    tournament_id: string;
    tournament_name: string;
    finish_position: number;
  }>
): SeedingFactors[]
```

The spec's New Components table says "takes flattened pairwise records, Tier-1 tournament IDs, tournament results, tournament names, and team list" -- listing Tier-1 tournament IDs separately from results. The task signature combines them into a pre-joined `tier1TournamentFinishes` array that already includes the tournament name. These are semantically equivalent but the description and the implementation signature do not match precisely. A verifier comparing spec to task would see the discrepancy.

**Suggested Fix:** Update the New Components table description in the spec to match the task's cleaner pre-joined signature, or update the task to match the spec's description. The task's approach (pre-joined array) is better since it makes the function pure and its inputs explicit.

---

### Issue 8 (Minor): Task 3.4 places W% and Natl. Finish columns inconsistently with spec F7

**Location:** Task 3.4 vs. spec F7.

**Problem:** Spec F7 says: "These columns appear after AggRank and before the individual algorithm columns." The existing `RankingResultsTable.svelte` column order is: Rank (AggRank), Team Name, Colley Rating, Colley Rank, Elo-2200 Rating, ..., AggRating. There is no separate "AggRank" column -- the first column IS the rank badge which shows AggRank. F7 says "after AggRank and before the individual algorithm columns." Task 3.4 says "Add two columns after AggRank (first column) and Team Name (second column), before the algorithm columns." There is a contradiction: the spec says after AggRank (implying between rank and team name), while the task says after both AggRank AND Team Name. The task interpretation (after team name, before algorithm columns) is more sensible UX, but it contradicts the spec's precise wording.

**Suggested Fix:** Update spec F7 to say "after AggRank and Team Name columns" to match the task's more sensible placement, or update the task to match the spec's wording and clarify the intent.

---

### Issue 9 (Minor): Test count arithmetic inconsistency in tasks summary

**Location:** tasks.md, Group 4 summary and task 4.5.

**Problem:** The task summary table shows: Group 1 = 13 tests, Group 2 = 3 tests, Group 3 = 5 tests, Group 4 = 5 tests, total = 26. Task 4.5 says "Expected total new tests: 26 (13 + 3 + 5 + 2 + 3)." The breakdown `13 + 3 + 5 + 2 + 3 = 26` implies Group 4 contributes 5 tests split as 2 (backward compat) + 3 (edge cases). Task 4.2 creates 2 tests and task 4.3 creates 3 tests, but tasks 4.1, 4.4, and 4.5 do not create tests -- they run existing tests. This arithmetic is correct on inspection, but the parenthetical `(13 + 3 + 5 + 2 + 3)` inconsistently uses 5 addends for 4 groups because Group 4's 5 tests come from 2 sub-tasks. The summary table says "Group 4: 5 tests" which is correct (2+3=5), but the breakdown could confuse an implementer into thinking there are 5 separate test sub-groups.

**Suggested Fix:** Change the breakdown in task 4.5 to `(13 + 3 + 5 + 5)` to match the summary table, or add a note explaining the 2+3 split within Group 4.

---

### Issue 10 (Minor): `$app/state` usage is not mentioned but not violated; no `page` state is used in new components

**Location:** Spec F6, task 3.3 (weights page).

**Problem:** The weights page does not need `$app/state` or `$page` at all -- it uses `$props()` for server data and `$state()` for client state. The NavHeader already receives `currentPath` as a prop. No issue exists in the spec or tasks. This checklist item is PASS as verified by the code.

**Note:** This is a confirmation, not an issue. Listed here for completeness of the checklist.

---

## Mathematical Correction (F3 Revised)

The initial concern about zero-weight Colley was investigated and found to be non-problematic. A team that only plays in weight=0 tournaments gets C[i][i] = 2 (initial value, unchanged) and b[i] = 1 (initial value, unchanged), yielding rating = 0.5 (the neutral Colley value). The system remains positive-definite. No mathematical issue exists.

---

## Summary Table

| Issue | Severity | Section |
|-------|----------|---------|
| 1. `RankingRunOutput` type change breaks existing tests and service return sites | Critical | E1, F2, Tasks 1.2/4.4 |
| 2. Intermediate compile-error state between tasks 2.2 and 2.3 | Critical | D5, Tasks 2.2/2.3 |
| 3. No mechanism to delete/revert a custom tournament weight | Critical | B5, F5, F6 |
| 4. Seeding factors architectural gap: double computation, run endpoint doesn't expose them | Critical | F7, Tasks 2.3/2.5 |
| 5. H2H computation discrepancy between requirements Q4 and spec Out of Scope | Minor | A2 |
| 6. `tournamentWeightInsertSchema` shape mismatch with PUT request body entries | Minor | B4, Task 2.4 |
| 7. `computeSeedingFactors` signature in task 1.5 doesn't match spec F4 New Components description | Minor | C1, Task 1.5 |
| 8. W%/Natl. Finish column placement description contradicts task 3.4 | Minor | F7, Task 3.4 |
| 9. Test count arithmetic breakdown inconsistency in task 4.5 | Minor | D1 |
| 10. (No issue -- $app/state confirmation) | N/A | E6 |
