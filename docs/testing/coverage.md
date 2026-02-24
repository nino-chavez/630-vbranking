# Test Coverage Analysis

**Last updated:** 2026-02-24

This document analyzes test coverage across the Volleyball Ranking Engine codebase. The project does not have `@vitest/coverage-v8` installed, so this analysis is based on a manual mapping of test files to source files and a review of what each test exercises.

## Coverage by Module

### Ranking Module (`src/lib/ranking/`)

| Source File             | Test File(s)                                                                                                                                                                                                                      | Tests | Coverage Assessment                                                                                                                                                               |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `colley.ts`             | `colley.test.ts`, `colley-weighted.test.ts`, `edge-cases.test.ts`, `integration.test.ts`, `determinism.test.ts`, `precision.test.ts`, `backward-compatibility.test.ts`, `weighting-edge-cases.test.ts`, `multi-age-group.test.ts` |    28 | **High.** Core algorithm tested with known mathematical examples, edge cases (0 games, ties, single team), weighting, and large-dataset performance.                              |
| `elo.ts`                | `elo.test.ts`, `elo-weighted.test.ts`, `edge-cases.test.ts`, `integration.test.ts`, `determinism.test.ts`, `precision.test.ts`, `backward-compatibility.test.ts`, `weighting-edge-cases.test.ts`                                  |    21 | **High.** All four starting ratings verified, chronological processing tested, weighting edge cases (zero weight, extreme weight), K-factor scaling.                              |
| `normalize.ts`          | `normalize.test.ts`, `edge-cases.test.ts`, `integration.test.ts`, `determinism.test.ts`, `multi-age-group.test.ts`                                                                                                                |    13 | **High.** Min-max normalization, arithmetic mean, equal-rating edge case, alphabetical tie-breaking.                                                                              |
| `derive-wins-losses.ts` | `derive-wins-losses.test.ts`, `edge-cases.test.ts`, `integration.test.ts`, `determinism.test.ts`, `multi-age-group.test.ts`                                                                                                       |    12 | **High.** C(n,2) combinatorics, tied positions, chronological grouping, division filtering.                                                                                       |
| `table-utils.ts`        | `table-utils.test.ts`, `table-utils-overrides.test.ts`                                                                                                                                                                            |    13 | **High.** Sort by multiple keys, filter by text and region, override-aware final rank computation.                                                                                |
| `seeding-factors.ts`    | `seeding-factors.test.ts`                                                                                                                                                                                                         |     5 | **High.** Win percentage, zero-game teams, Tier-1 finishes, best-of-multiple.                                                                                                     |
| `ranking-service.ts`    | `ranking-service.test.ts`                                                                                                                                                                                                         |     7 | **Medium-High.** Full orchestration, cleanup on failure, invalid season/age_group, age_group passthrough, getRunResults. Does not test the finalize or delete paths in isolation. |
| `types.ts`              | (imported by all ranking tests)                                                                                                                                                                                                   |    -- | Type-only file. No runtime behavior.                                                                                                                                              |
| `index.ts`              | (barrel export)                                                                                                                                                                                                                   |    -- | Re-exports only.                                                                                                                                                                  |

**Ranking module total: 16 test files, 99 tests.** Coverage is strong across all algorithms, normalization, and utility functions.

### Import Module (`src/lib/import/`)

| Source File                  | Test File(s)                                                                                 | Tests | Coverage Assessment                                                                                                                                                           |
| ---------------------------- | -------------------------------------------------------------------------------------------- | ----: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `parsers/finishes-parser.ts` | `finishes-parser.test.ts`, `error-handling.test.ts`                                          |     7 | **High.** Tournament boundary detection, merged cells, team extraction, attendance gaps, empty/malformed spreadsheets.                                                        |
| `parsers/colley-parser.ts`   | `colley-parser.test.ts`, `error-handling.test.ts`                                            |     4 | **High.** 16-column mapping, non-numeric value handling, header-only spreadsheet.                                                                                             |
| `parsers/match-parser.ts`    | (none)                                                                                       |     0 | **Not tested.** Parser for individual match data has no test coverage.                                                                                                        |
| `parsers/index.ts`           | (barrel export)                                                                              |    -- | Re-exports only.                                                                                                                                                              |
| `identity-resolver.ts`       | `import-service.test.ts`                                                                     |     2 | **Medium.** Team matching and tournament matching tested. Fuzzy suggestion scoring tested indirectly. Levenshtein distance helper tested directly.                            |
| `import-service.ts`          | `import-service.test.ts`, `import-mode-edge-cases.test.ts`, `validation-integration.test.ts` |     7 | **Medium-High.** validateFinishesRows, executeMerge (insert/update/skip), merge idempotency, replace error propagation. Does not test executeReplace success path end-to-end. |
| `duplicate-detector.ts`      | `import-service.test.ts`                                                                     |     1 | **Medium.** Duplicate detection by team_id + tournament_id combination tested once.                                                                                           |
| `types.ts`                   | (imported by tests)                                                                          |    -- | Type-only file.                                                                                                                                                               |

**Import module total: 6 test files, 21 tests.** Good coverage on parsers and core import logic. The `match-parser.ts` file is an identified gap.

### Export Module (`src/lib/export/`)

| Source File      | Test File(s)          | Tests | Coverage Assessment                                                                                                                                                                                   |
| ---------------- | --------------------- | ----: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `csv.ts`         | `csv.test.ts`         |     7 | **High.** Metadata comments, header row, comma quoting, double-quote escaping, override summary, data row values.                                                                                     |
| `xlsx.ts`        | `xlsx.test.ts`        |     5 | **High.** Workbook creation, row count, overrides sheet presence/absence, ArrayBuffer output.                                                                                                         |
| `export-data.ts` | `export-data.test.ts` |    15 | **High.** Row assembly with sorting, override population, algorithm breakdown toggle, empty results, seeding factors, column headers, value serialization, metadata lines, override summary ordering. |
| `pdf.ts`         | (none)                |     0 | **Not tested.** PDF generation using jspdf + jspdf-autotable has no test coverage.                                                                                                                    |
| `download.ts`    | (none)                |     0 | **Not tested.** Browser download trigger (likely untestable in jsdom).                                                                                                                                |
| `types.ts`       | (imported by tests)   |    -- | Type-only file.                                                                                                                                                                                       |
| `index.ts`       | (barrel export)       |    -- | Re-exports only.                                                                                                                                                                                      |

**Export module total: 3 test files, 27 tests.** CSV and XLSX have thorough coverage. PDF export is untested.

### Schemas Module (`src/lib/schemas/`)

| Source File            | Test File(s)                                                       | Tests | Coverage Assessment                                                                                                                                |
| ---------------------- | ------------------------------------------------------------------ | ----: | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ranking-override.ts`  | `ranking-override.test.ts`                                         |    13 | **High.** Full schema, insert schema, update schema. UUID validation, string length minimums, integer enforcement, partial updates, empty objects. |
| `ranking-result.ts`    | `validation-integration.test.ts`, `constraints-edge-cases.test.ts` |     3 | **Medium.** Nullable algo fields and fully-populated rows tested. Boundary conditions not exhaustively tested.                                     |
| `tournament-result.ts` | `validation-integration.test.ts`                                   |     2 | **Medium.** finish_position > field_size rejection and empty division tested.                                                                      |
| `season.ts`            | (none)                                                             |     0 | **Not tested.**                                                                                                                                    |
| `team.ts`              | (none)                                                             |     0 | **Not tested.**                                                                                                                                    |
| `tournament.ts`        | (none)                                                             |     0 | **Not tested.**                                                                                                                                    |
| `tournament-weight.ts` | (none)                                                             |     0 | **Not tested.**                                                                                                                                    |
| `match.ts`             | (none)                                                             |     0 | **Not tested.**                                                                                                                                    |
| `ranking-run.ts`       | (none)                                                             |     0 | **Not tested.**                                                                                                                                    |
| `enums.ts`             | (none)                                                             |     0 | **Not tested.**                                                                                                                                    |
| `index.ts`             | (barrel export)                                                    |    -- | Re-exports only.                                                                                                                                   |

**Schemas module total: 1 test file + 2 cross-module references, 18 tests.** The ranking-override schema has excellent coverage. The remaining 7 schema files have no dedicated tests.

### Components Module (`src/lib/components/`)

| Source File                      | Test File(s)                                                                                | Tests | Coverage Assessment                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------- | ----: | ----------------------------------------------------------------------------------------------------------------------- |
| `Button.svelte`                  | `design-system-components.test.ts`, `accessibility.test.ts`, `component-edge-cases.test.ts` |     4 | **High.** All four variants, disabled state, loading state, accessible name.                                            |
| `Banner.svelte`                  | `design-system-components.test.ts`, `accessibility.test.ts`                                 |     2 | **Medium.** Error variant with role="alert" tested. Warning, info variants not tested.                                  |
| `Card.svelte`                    | `design-system-components.test.ts`, `component-edge-cases.test.ts`                          |     2 | **Medium.** Header + children rendering, padding="none" variant.                                                        |
| `NavHeader.svelte`               | `design-system-components.test.ts`, `accessibility.test.ts`                                 |     2 | **Medium.** Active route highlighting, keyboard focus, aria-current.                                                    |
| `Select.svelte`                  | `design-system-components.test.ts`, `accessibility.test.ts`                                 |     2 | **Medium.** Label association, options rendering, placeholder.                                                          |
| `RankBadge.svelte`               | `design-system-components.test.ts`                                                          |     1 | **Medium.** Top-5 bold vs standard medium styling.                                                                      |
| `FreshnessIndicator.svelte`      | `design-system-components.test.ts`, `component-edge-cases.test.ts`                          |     2 | **Medium.** 5-minute and edge timestamps (just now, 90min, 2 days).                                                     |
| `TierRow.svelte`                 | `component-edge-cases.test.ts`                                                              |     1 | **Medium.** Tier boundary CSS classes at rank boundaries (5, 6, 15, 16, 30, 31).                                        |
| `RankingResultsTable.svelte`     | `page-retrofit.test.ts`, `ranking-ui.test.ts`                                               |     8 | **High.** Tier colors, rank badges, semantic markup, no hardcoded colors, column headers, data formatting, empty state. |
| `OverridePanel.svelte`           | `override-panel.test.ts`                                                                    |     8 | **High.** Open/closed state, new/existing override, finalized read-only, form labels, cancel/close callbacks.           |
| `PageShell.svelte`               | `page-retrofit.test.ts`                                                                     |     1 | **Low.** Renders children inside `<main>`. Basic smoke test.                                                            |
| `PageHeader.svelte`              | (none)                                                                                      |     0 | **Not tested.**                                                                                                         |
| `DataPreviewTable.svelte`        | (logic tested in `import-ui.test.ts`)                                                       |     3 | **Medium.** Error highlighting and skip logic tested via extracted functions, not via component render.                 |
| `FileDropZone.svelte`            | (logic tested in `import-ui.test.ts`)                                                       |     4 | **Medium.** File validation logic tested via extracted function, not via component render.                              |
| `IdentityResolutionPanel.svelte` | (logic tested in `import-ui.test.ts`)                                                       |     2 | **Medium.** Conflict resolution logic tested via extracted function.                                                    |
| `ImportSummary.svelte`           | (none)                                                                                      |     0 | **Not tested.**                                                                                                         |
| `ExportDropdown.svelte`          | (none)                                                                                      |     0 | **Not tested.**                                                                                                         |
| `DataTable.svelte`               | (none)                                                                                      |     0 | **Not tested.**                                                                                                         |
| `Spinner.svelte`                 | (none)                                                                                      |     0 | **Not tested.**                                                                                                         |

**Components module total: 10 test files, 49 tests.** Core interactive components (OverridePanel, RankingResultsTable) have strong coverage. Static/simple components have partial or no direct rendering tests.

### Routes / API Endpoints (`src/routes/`)

| Route                                      | Tests | Coverage Assessment |
| ------------------------------------------ | ----: | ------------------- |
| `api/import/upload/+server.ts`             |     0 | **Not tested.**     |
| `api/import/confirm/+server.ts`            |     0 | **Not tested.**     |
| `api/ranking/run/+server.ts`               |     0 | **Not tested.**     |
| `api/ranking/runs/+server.ts`              |     0 | **Not tested.**     |
| `api/ranking/runs/finalize/+server.ts`     |     0 | **Not tested.**     |
| `api/ranking/results/+server.ts`           |     0 | **Not tested.**     |
| `api/ranking/weights/+server.ts`           |     0 | **Not tested.**     |
| `api/ranking/overrides/+server.ts`         |     0 | **Not tested.**     |
| `api/ranking/team/[id]/+server.ts`         |     0 | **Not tested.**     |
| `api/ranking/team/[id]/h2h/+server.ts`     |     0 | **Not tested.**     |
| `api/ranking/team/[id]/history/+server.ts` |     0 | **Not tested.**     |
| `ranking/+page.server.ts`                  |     0 | **Not tested.**     |
| `ranking/+page.svelte`                     |     0 | **Not tested.**     |
| `ranking/team/[id]/+page.server.ts`        |     0 | **Not tested.**     |
| `ranking/team/[id]/+page.svelte`           |     0 | **Not tested.**     |
| `ranking/weights/+page.server.ts`          |     0 | **Not tested.**     |
| `ranking/weights/+page.svelte`             |     0 | **Not tested.**     |
| `import/+page.server.ts`                   |     0 | **Not tested.**     |
| `import/+page.svelte`                      |     0 | **Not tested.**     |
| `+page.svelte`                             |     0 | **Not tested.**     |
| `+layout.svelte`                           |     0 | **Not tested.**     |

**Routes total: 0 tests.** No API endpoint or page-level tests exist. This is the largest coverage gap.

### Utilities (`src/lib/utils/`)

| Source File | Tests | Coverage Assessment                                                                                                                       |
| ----------- | ----: | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `format.ts` |     0 | **Not tested.** Formatting utilities have no dedicated tests, though they may be exercised indirectly through component and export tests. |

### Integration Tests (`tests/integration/`)

| Test File                        | Tests | What It Verifies                                                       |
| -------------------------------- | ----: | ---------------------------------------------------------------------- |
| `referential-integrity.test.ts`  |     5 | FK constraints in 5 migration files (CASCADE/RESTRICT policies).       |
| `constraints-edge-cases.test.ts` |     5 | UNIQUE constraints in 4 migration files + Zod nullable field behavior. |

**Integration total: 2 files, 10 tests.** These verify database schema correctness without a running database.

## Coverage Summary

| Module     | Source Files | Tested | Untested | Estimated Line Coverage |
| ---------- | -----------: | -----: | -------: | ----------------------: |
| Ranking    |            7 |      7 |        0 |                    ~90% |
| Import     |            6 |      5 |        1 |                    ~75% |
| Export     |            5 |      3 |        2 |                    ~70% |
| Schemas    |           10 |      3 |        7 |                    ~25% |
| Components |           18 |     12 |        6 |                    ~55% |
| Routes/API |           21 |      0 |       21 |                      0% |
| Utils      |            1 |      0 |        1 |                      0% |
| **Total**  |       **68** | **30** |   **38** |                    ~40% |

## Untested Areas and Risk Assessment

### Critical Risk -- API Endpoints (0% coverage)

All 11 API endpoint handlers (`+server.ts` files) are untested. These handlers perform request validation, Supabase queries, error handling, and response formatting. A bug in any endpoint would be undetected until manual testing or production use.

**Specific risks:**

- The `POST /api/ranking/run` endpoint orchestrates a full ranking computation. While `RankingService` is tested, the HTTP layer (request parsing, error responses, auth) is not.
- The `POST /api/import/upload` and `POST /api/import/confirm` endpoints handle file uploads and two-phase import. Parsing logic is tested, but the HTTP integration is not.
- The `POST /api/ranking/runs/finalize` endpoint locks ranking runs. The finalization state transition has no test.
- The `GET/POST/DELETE /api/ranking/overrides` endpoint manages committee overrides. While the Zod schema is tested, the CRUD operations over HTTP are not.

**Recommendation:** Add integration tests for the 5 highest-traffic endpoints using SvelteKit's `@sveltejs/kit` test utilities or `supertest`-style HTTP testing. Priority: `/api/ranking/run`, `/api/import/upload`, `/api/ranking/overrides`, `/api/ranking/runs/finalize`, `/api/ranking/results`.

### Medium Risk -- Schema Files (7 untested)

Seven of ten Zod schema files (`season.ts`, `team.ts`, `tournament.ts`, `tournament-weight.ts`, `match.ts`, `ranking-run.ts`, `enums.ts`) have no tests. These schemas guard database writes, so validation gaps could allow malformed data.

**Recommendation:** Add schema validation tests for `team.ts` (age_group enum), `tournament.ts` (date validation), and `ranking-run.ts` (status enum) as the highest-value additions.

### Medium Risk -- PDF Export (0% coverage)

The `pdf.ts` export module generates PDF documents using jspdf and jspdf-autotable. PDF generation in a Node.js/jsdom environment can silently produce empty or corrupt output without test verification.

**Recommendation:** Add a test that calls `generatePdf()` with sample data and verifies the output is a non-empty `Uint8Array` or `ArrayBuffer` with a valid PDF magic number (`%PDF-`).

### Medium Risk -- Match Parser (0% coverage)

The `parsers/match-parser.ts` file has no tests. If match-level imports are used, parsing bugs would go undetected.

**Recommendation:** Add tests following the same pattern as `finishes-parser.test.ts` and `colley-parser.test.ts`.

### Low Risk -- Page Components and Layout

Page-level Svelte files (`+page.svelte`, `+layout.svelte`) are untested. These assemble library components and are lower risk because the individual components they use are tested.

**Recommendation:** These are candidates for end-to-end testing (Playwright) rather than unit tests.

### Low Risk -- Utility Functions

The `format.ts` utility has no tests. If it contains only simple formatting (number rounding, date formatting), the risk is low.

**Recommendation:** Add 3-5 tests for the formatting functions as a quick win.

## Recommendations Summary

| Priority | Action                                                                        | Effort | Impact                                              |
| -------- | ----------------------------------------------------------------------------- | ------ | --------------------------------------------------- |
| **P0**   | Install `@vitest/coverage-v8` and add coverage thresholds to `vite.config.ts` | Low    | Enables automated coverage tracking and CI gates    |
| **P1**   | Add API endpoint tests for top 5 endpoints                                    | High   | Closes the largest coverage gap (11 untested files) |
| **P1**   | Add PDF export smoke test                                                     | Low    | Verifies a high-visibility user feature             |
| **P2**   | Add schema tests for `team.ts`, `tournament.ts`, `ranking-run.ts`             | Medium | Guards database validation for core entities        |
| **P2**   | Add match-parser tests                                                        | Medium | Achieves parity with finishes and Colley parsers    |
| **P3**   | Add Playwright end-to-end tests for the rankings dashboard                    | High   | Validates the full user workflow                    |
| **P3**   | Add tests for remaining 6 untested components                                 | Medium | Achieves component-level completeness               |
| **P3**   | Test `format.ts` utility functions                                            | Low    | Quick win for completeness                          |

## How to Enable Coverage Reporting

Install the coverage provider:

```bash
npm install -D @vitest/coverage-v8
```

Add coverage configuration to `vite.config.ts`:

```typescript
export default defineConfig({
	// ...existing config
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		environment: 'jsdom',
		setupFiles: [],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html', 'lcov'],
			include: ['src/lib/**/*.ts', 'src/lib/**/*.svelte'],
			exclude: ['src/lib/**/types.ts', 'src/lib/**/index.ts'],
			thresholds: {
				statements: 60,
				branches: 50,
				functions: 60,
				lines: 60,
			},
		},
	},
});
```

Run with coverage:

```bash
npx vitest run --coverage
```

The `coverage/` directory is already listed in the project's exclusions (CLAUDE.md), so generated reports will not pollute the source tree.
