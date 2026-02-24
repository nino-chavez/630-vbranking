# Implementation Report: Task Group 2 -- Import Service & API Layer

**Implementer:** `database-engineer`
**Date:** 2026-02-23
**Status:** Complete

---

## Summary

All 8 sub-tasks in Task Group 2 have been implemented. The import service layer provides identity resolution with fuzzy matching, Zod-validated row transformation, atomic replace via Supabase RPC, merge-mode with insert/update/skip logic, duplicate detection, and two API endpoints for upload and confirm flows. A server-side page load function supplies season data to the UI layer.

---

## Files Created

### 2.1 Identity Resolution Service

**File:** `src/lib/import/identity-resolver.ts`

- `IdentityResolver` class with constructor accepting a Supabase client.
- `resolveTeams(teamCodes, ageGroup)` -- queries the `teams` table filtered by `age_group`, performs case-insensitive exact matching by code, and returns fuzzy-match suggestions (Levenshtein distance) for unmatched codes. Up to 3 suggestions per unmatched code, filtered by a minimum similarity score of 0.3.
- `resolveTournaments(tournamentNames, seasonId)` -- same pattern against the `tournaments` table filtered by `season_id`.
- `levenshteinDistance(a, b)` -- exported helper implementing the standard dynamic programming Levenshtein edit distance algorithm. Also used by tests.
- Internal `similarityScore(a, b)` -- normalized 0-1 similarity derived from Levenshtein distance.

### 2.2 Import Service

**File:** `src/lib/import/import-service.ts`

- `ValidatedRow` interface exported for use across the pipeline: `{ data, valid, errors, originalIndex }`.
- `ImportService` class with constructor accepting a Supabase client.
- `validateFinishesRows(rows, identityMappings)` -- applies identity mappings to resolve team codes and tournament names to UUIDs, filters out rows where team or tournament was mapped to `'skip'`, validates each row against `tournamentResultInsertSchema` (including the `.refine()` check that `finish_position <= field_size`), and returns `ValidatedRow[]`.
- `validateColleyRows(rows, identityMappings, rankingRunId)` -- same pattern validating against `rankingResultInsertSchema`.
- `executeReplace(validatedRows, seasonId, ageGroup, format, rankingRunId?)` -- calls the Supabase RPC functions (`import_replace_tournament_results` or `import_replace_ranking_results`) for atomic delete-then-insert. Returns `ImportSummaryData`.
- `executeMerge(validatedRows, format, seasonId, ageGroup)` -- for each valid row, checks if the composite key exists (`team_id + tournament_id` for Finishes, `team_id + ranking_run_id` for Colley). If no match: INSERT. If match and values differ: UPDATE. If match and values identical: SKIP. Returns `ImportSummaryData`.

### 2.3 Supabase RPC Migration

**File:** `supabase/migrations/20260223180012_create_import_replace_rpc.sql`

- `import_replace_tournament_results(p_season_id UUID, p_age_group TEXT, p_rows JSONB)` -- deletes all `tournament_results` where `tournament_id` is in a tournament belonging to the season AND `team_id` is in a team with the specified age group, then inserts all rows from the JSONB array. Runs inside a single PostgreSQL function body (inherently transactional).
- `import_replace_ranking_results(p_ranking_run_id UUID, p_rows JSONB)` -- deletes all `ranking_results` for the given ranking run, then inserts rows from the JSONB array.

### 2.4 Duplicate Detection Utility

**File:** `src/lib/import/duplicate-detector.ts`

- `detectDuplicateFinishes(rows, supabase)` -- queries `tournament_results` for existing records matching any `team_id + tournament_id` combinations in the validated rows. Returns `Map<"team_id:tournament_id", existing_record_id>`.
- `detectDuplicateColley(rows, rankingRunId, supabase)` -- same pattern for `ranking_results` with `team_id + ranking_run_id`.

### 2.5 Upload API Endpoint

**File:** `src/routes/api/import/upload/+server.ts`

- `POST` handler accepting `multipart/form-data` with fields: `file`, `season_id`, `age_group`, `format`.
- Validates: required fields present, file extension is `.xlsx`, file size <= 10 MB, `age_group` is valid `AgeGroup` enum, `format` is `'finishes'` or `'colley'`.
- Parses file using `getParser(format)` from the parsers barrel export.
- Runs `IdentityResolver` to populate identity conflicts and build matched mappings.
- Runs `detectDuplicateFinishes` to flag existing records.
- Returns `{ success: true, data: ParseResult, identityMappings, duplicates }` on success.
- Returns `{ success: false, error: string }` with appropriate HTTP status (400 or 500) on failure.

### 2.6 Confirm API Endpoint

**File:** `src/routes/api/import/confirm/+server.ts`

- `POST` handler accepting JSON body with `rows`, `identityMappings`, `importMode`, `seasonId`, `ageGroup`, `format`.
- Creates new team/tournament records from identity mappings where `action === 'create'`, validating against `teamInsertSchema` / `tournamentInsertSchema`.
- For Colley imports, creates a new `ranking_run` record.
- Validates rows using `ImportService.validateFinishesRows()` or `validateColleyRows()`.
- Executes import via `executeReplace()` or `executeMerge()` based on `importMode`.
- Returns `{ success: true, summary: ImportSummaryData }` on success.

### 2.7 Server-Side Page Load

**File:** `src/routes/import/+page.server.ts`

- `load` function fetches all seasons from the `seasons` table via the server-side Supabase client, ordered by `start_date` descending.
- Returns `{ seasons }` for the import page to populate the season dropdown.

### 2.8 Import Service Tests

**File:** `src/lib/import/__tests__/import-service.test.ts`

7 tests (exceeds the 6 specified -- added a Levenshtein helper test):

1. `IdentityResolver.resolveTeams()` -- verifies matched teams appear in the matched map and unmatched teams get fuzzy suggestions sorted by score.
2. `IdentityResolver.resolveTournaments()` -- verifies correct separation of matched vs. unmatched tournament names.
3. `ImportService.validateFinishesRows()` -- verifies skipped rows are filtered out, valid rows pass, and rows with `finish_position > field_size` fail with the correct Zod error.
4. `ImportService.executeMerge()` -- verifies the INSERT/UPDATE/SKIP logic with mocked Supabase. 3 rows: one new (INSERT), one changed (UPDATE), one identical (SKIP).
5. `detectDuplicateFinishes()` -- verifies detection of existing `team_id:tournament_id` combinations via mocked Supabase query.
6. Upload endpoint file validation -- verifies `.xlsx` extension check logic for various file types.
7. `levenshteinDistance()` helper -- verifies correct edit distances for known string pairs.

### Supporting File

**File:** `src/lib/supabase-server.ts`

- Server-side Supabase client using `SUPABASE_SERVICE_ROLE_KEY` from `$env/static/private`.
- Used by all server-side code (+server.ts, +page.server.ts) that needs elevated database access.

### Modified File

**File:** `src/lib/types/database.types.ts`

- Added `Functions` type definitions for the two new RPC functions: `import_replace_tournament_results` and `import_replace_ranking_results`.

---

## Test Results

```
 Test Files  3 passed (3)
       Tests  15 passed (15)
    Start at  20:55:14
    Duration  211ms

Breakdown:
  - src/lib/import/__tests__/import-service.test.ts       7 tests  (all pass)
  - src/lib/import/parsers/__tests__/colley-parser.test.ts 3 tests  (all pass)
  - src/lib/import/parsers/__tests__/finishes-parser.test.ts 5 tests (all pass)
```

All 15 tests pass with zero failures. No existing tests were broken.

---

## Design Decisions

1. **Valid UUIDs in tests:** Zod v4's `z.uuid()` enforces RFC 4122 format strictly (version digit 1-8, variant digit 8/9/a/b). Test UUIDs use valid v4 format (`550e8400-e29b-41d4-a716-...`).

2. **Server-side Supabase client:** Created `src/lib/supabase-server.ts` that uses `$env/static/private` for the service role key, keeping it separate from the client-side `src/lib/supabase.ts` which uses `import.meta.env`. This follows SvelteKit's security model for server-only secrets.

3. **Mocking strategy for tests:** Used a factory function `createMockSupabase()` that mimics the Supabase PostgREST query-builder chain pattern (`from().select().eq().in().maybeSingle()`). This avoids importing the real Supabase client in tests while maintaining type-compatible call patterns.

4. **Levenshtein as built-in:** Implemented Levenshtein distance as a pure function rather than adding a dependency. The function is small (~20 lines of standard DP) and is exported for direct testing.

5. **ValidatedRow type:** Defined in `import-service.ts` and exported for use by the duplicate detector, API endpoints, and future UI components. Includes `originalIndex` to maintain traceability back to parsed source rows.

6. **RPC function naming:** Used `import_replace_tournament_results` and `import_replace_ranking_results` following the project's existing naming conventions. Both functions are `LANGUAGE plpgsql` and inherently transactional.

---

## Dependencies for Group 3

The following exports are available for the frontend UI layer:

| Export | From | Usage |
|--------|------|-------|
| `IdentityResolver` | `src/lib/import/identity-resolver.ts` | Used by upload endpoint |
| `ImportService`, `ValidatedRow` | `src/lib/import/import-service.ts` | Used by confirm endpoint |
| `detectDuplicateFinishes`, `detectDuplicateColley` | `src/lib/import/duplicate-detector.ts` | Used by upload endpoint |
| `supabaseServer` | `src/lib/supabase-server.ts` | Server-side Supabase client for all +server.ts and +page.server.ts files |
| Seasons load data | `src/routes/import/+page.server.ts` | Provides `seasons[]` to the +page.svelte component |
| `POST /api/import/upload` | `src/routes/api/import/upload/+server.ts` | Upload endpoint for the UI to call |
| `POST /api/import/confirm` | `src/routes/api/import/confirm/+server.ts` | Confirm endpoint for the UI to call |
