# Specchain State

## Last Updated

2026-02-24

## Active Spec

None -- all 9 roadmap features complete.

## Session Context

All 9 roadmap features implemented and committed. 180 tests passing across 36 files, 0 new TypeScript errors, 0 regressions.

## Active Blockers

None.

## Resolved Blockers

None.

## Key Decisions

| Date       | Decision                                                | Rationale                                                                                                                                                                   | Context                             |
| ---------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| 2026-02-23 | All-TypeScript (no Python)                              | 73x73 Colley Matrix is trivially small for ml-matrix; unified stack benefits outweigh Python's numerical ecosystem                                                          | Tech stack decision                 |
| 2026-02-23 | Individual match records as base granularity            | Enables future enhancement with set scores/point differentials; H2H summaries derived via queries                                                                           | Schema design                       |
| 2026-02-23 | Ranking snapshots over recompute                        | Preserves historical rankings; enables trend analysis                                                                                                                       | Schema design                       |
| 2026-02-23 | Zod v4 top-level format validators                      | Used z.uuid(), z.iso.datetime(), z.iso.date() instead of deprecated z.string().uuid() etc.                                                                                  | Zod v4 compatibility                |
| 2026-02-23 | Adaptive Finishes parser with Row 2 triplet scanning    | Scans Row 2 for Div/Fin/Tot patterns starting at column 10 to detect tournament boundaries; handles merged cells, padding columns, and header-only tournaments              | Import parser design                |
| 2026-02-23 | Supabase RPC for atomic replace mode                    | PostgreSQL function bodies are inherently transactional; Supabase JS client cannot provide multi-table transaction guarantees                                               | Database atomicity                  |
| 2026-02-23 | Server-side Excel parsing                               | xlsx library runs on the server (API endpoint) to avoid shipping SheetJS to the browser; client sends raw file, server returns structured JSON                              | Architecture decision               |
| 2026-02-23 | Separate server-side Supabase client                    | Created `supabase-server.ts` using `$env/static/private` for service role key, keeping it separate from client-side `supabase.ts`                                           | SvelteKit security model            |
| 2026-02-23 | Built-in Levenshtein distance                           | ~20 lines of standard DP rather than adding an external dependency; exported for direct testing                                                                             | Dependency minimization             |
| 2026-02-23 | Optional weightMap parameter for backward compatibility | `weightMap?: Record<string, number>` defaults to 1.0 per tournament; existing tests pass without modification                                                               | Weighted algorithm design           |
| 2026-02-23 | Seeding factors optional on RankingRunOutput            | `seeding_factors?: SeedingFactors[]` avoids breaking existing service tests; returned from run API, not re-computed in results API                                          | Verifier fix for type breakage      |
| 2026-02-23 | Seeding factors from run endpoint, not results endpoint | Run API already computes seeding factors; avoids complex re-derivation of pairwise data in results GET endpoint                                                             | Verifier fix for double computation |
| 2026-02-23 | PUT replaces weights for season                         | PUT /api/ranking/weights upserts on (tournament_id, season_id) unique constraint; absent entries keep defaults                                                              | Weights API design                  |
| 2026-02-24 | Teams as Record not Map                                 | Changed `teams` from `Map<string, string>` to `Record<string, { name: string; region: string }>` for JSON serialization, region data, and simpler prop typing               | Dashboard data format               |
| 2026-02-24 | Client-side sort/filter for rankings table              | Max ~73 teams; no pagination needed. Pure utility functions in `table-utils.ts` for testability                                                                             | Dashboard table design              |
| 2026-02-24 | Server-side team detail loading                         | `+page.server.ts` fetches team info, ranking, history, and H2H in a single load function; avoids client-side waterfall                                                      | Team detail page architecture       |
| 2026-02-24 | Select component onchange prop                          | Added optional `onchange` callback to Select component for run history switching                                                                                            | Component enhancement               |
| 2026-02-24 | Overrides stored separately from results                | `ranking_overrides` table stores overrides alongside immutable `ranking_results`; merged at display time so algorithmic ranks remain a clean audit record                   | Override architecture               |
| 2026-02-24 | Override panel as slide-out drawer                      | Right-side drawer provides space for justification textarea without cluttering the table; weights page uses inline editing for simple values but overrides need more fields | Override UI pattern                 |
| 2026-02-24 | Run finalization via status column                      | `status` column on `ranking_runs` (`draft`/`finalized`); finalized runs become read-only; lightweight single button click                                                   | Override workflow                   |
| 2026-02-24 | Final rank sorting with override merge                  | `computeFinalRanks()` pure function merges overrides with agg_rank; teams without overrides keep algorithmic rank; `final_rank` sort key added                              | Table utilities design              |
| 2026-02-24 | Client-side export generation                           | All ranking data already in memory on dashboard; no server endpoints needed; keeps feature small                                                                            | Export architecture                 |
| 2026-02-24 | Three formats: CSV + XLSX + PDF                         | CSV trivial (no lib), XLSX reuses existing `xlsx` dep, PDF via `jspdf` + `jspdf-autotable` (new deps)                                                                       | Export format choices               |
| 2026-02-24 | Shared data assembly layer                              | Pure `assembleExportRows()` transforms ranking state into flat rows; all three generators consume same data; fully testable                                                 | Export data layer                   |
| 2026-02-24 | Dynamic imports for XLSX/PDF                            | `import()` at click time for code splitting; CSV is synchronous and bundled; keeps initial page bundle small                                                                | Export bundle optimization          |
| 2026-02-24 | Algorithm breakdown toggle                              | Summary export (default) has Final Seed/Team/Region/AggRating; detailed adds all 5 algo ratings/ranks; override summary always included when overrides exist                | Export content options              |
| 2026-02-24 | age_group column on ranking_runs                        | Each ranking run is now scoped to a single age group; backfill existing rows as 18U; composite index on (season_id, age_group) for efficient lookups                        | Multi-age-group schema              |
| 2026-02-24 | Validated enum for age_group API filter                 | Runs listing API validates age_group query param via `AgeGroup.safeParse()` before passing to Supabase `.eq()`; invalid values silently ignored (returns unfiltered)        | Type safety at API boundary         |
| 2026-02-24 | Run history filtered by selected age group              | `loadRunHistory()` guards on both `selectedSeasonId` and `selectedAgeGroup`; switching age group shows only runs for that group                                             | UI isolation per age group          |

## Execution Profiles

| Spec                                   | Strategy | Depth    | Date       |
| -------------------------------------- | -------- | -------- | ---------- |
| data-model-database-schema             | squad    | standard | 2026-02-23 |
| data-ingestion-pipeline                | squad    | standard | 2026-02-23 |
| ranking-algorithm-engine               | squad    | standard | 2026-02-23 |
| tournament-weighting-seeding           | squad    | standard | 2026-02-23 |
| design-system-ui-foundation            | squad    | standard | 2026-02-23 |
| rankings-dashboard                     | squad    | standard | 2026-02-24 |
| manual-overrides-committee-adjustments | squad    | standard | 2026-02-24 |
| export-reporting                       | squad    | standard | 2026-02-24 |
| multi-age-group-support                | squad    | standard | 2026-02-24 |

## Patterns Established

- Migration naming: `YYYYMMDDHHMMSS_description.sql` in `supabase/migrations/`
- Zod schema pattern: each table gets `fooSchema`, `fooInsertSchema` (omit id/timestamps), `fooUpdateSchema` (partial), and `Foo` type
- Shared enums in `src/lib/schemas/enums.ts` reused across schemas
- Barrel export from `src/lib/schemas/index.ts`
- All tables include id (UUID), created_at, updated_at with auto-update trigger
- Tests organized: `tests/schemas/` for Zod, `tests/integration/` for structural/DB
- Import module structure: types in `src/lib/import/types.ts`, parsers in `src/lib/import/parsers/`, services in `src/lib/import/`, barrel export in `src/lib/import/parsers/index.ts`
- Mock Supabase pattern: factory function `createMockSupabase()` mimics PostgREST query-builder chain for unit tests
- Svelte 5 runes: `$state` for mutable state, `$derived` for computed state, `$props` for component props -- no legacy reactive syntax
- UI component tests as logic unit tests (pure functions) when `@testing-library/svelte` is not available
- Test fixtures generated programmatically via `XLSX.utils.aoa_to_sheet()` + `XLSX.write()` inside test files
- Pure algorithm functions accept optional `weightMap` parameter; service layer builds the map from DB
- Seeding factors computed as pure function from pairwise records and Tier-1 finishes; not stored in DB
- Design system: semantic CSS custom properties (--color-accent, --text-primary, etc.) with Tailwind v4 `@theme` integration
- Component library: Card, Select, Button, Banner, PageHeader, DataTable, TierRow, RankBadge, FreshnessIndicator
- Shared format utilities in `src/lib/utils/format.ts`: toOrdinal, formatDate, formatTimestamp
- Pure sort/filter functions in `src/lib/ranking/table-utils.ts` with typed SortKey/SortDirection
- Team detail page pattern: `+page.server.ts` loads all data server-side, `+page.svelte` is pure presentation
- API endpoints: GET for reads with query params, POST for mutations with JSON body, consistent `{ success, data/error }` shape
- Override pattern: separate table with FK to runs + teams, UNIQUE(run, team), upsert on conflict; merged at display time via `computeFinalRanks()`
- Run status workflow: `draft` (default) allows edits, `finalized` makes read-only; checked server-side before mutations
- Slide-out panel pattern: fixed right drawer with backdrop, form validation, read-only mode based on parent status
- Results API returns related data (overrides map, run status) alongside primary data to minimize client roundtrips
- Export module structure: types in `types.ts`, shared assembly in `export-data.ts`, format generators in `csv.ts`/`xlsx.ts`/`pdf.ts`, browser utils in `download.ts`, barrel in `index.ts`
- Export data assembly: `assembleExportRows()` reuses `computeFinalRanks()` from table-utils; flat `ExportRow` consumed by all generators
- Dynamic import pattern: XLSX and PDF generators loaded via `import()` on user click; CSV synchronous (no heavy deps)
- ExportDropdown component: dropdown menu with format options + algorithm breakdowns checkbox; loading state during generation
- Age-group scoping: ranking_runs tagged with age_group; API endpoints accept optional age_group filter; UI filters run history by selected age group

## Session Log

| Date       | Session | Summary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Profile          | Next Steps                                          |
| ---------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | --------------------------------------------------- |
| 2026-02-23 | 1       | Implemented Feature 1: Data Model & Database Schema. Created 11 migrations, 8 Zod schemas, typed Supabase client. 18/18 tests passing.                                                                                                                                                                                                                                                                                                                                                                                     | squad + standard | Feature 2: Data Ingestion Pipeline                  |
| 2026-02-23 | 2       | Implemented Feature 2: Data Ingestion Pipeline. 4 task groups (parsing, services/API, frontend UI, test gaps). 28 files created, 2 modified. 35/35 tests passing, 0 TS errors. E2E tests deferred (no running server).                                                                                                                                                                                                                                                                                                     | squad + standard | Feature 3: Ranking Algorithm Engine                 |
| 2026-02-23 | 3       | Implemented Feature 3: Ranking Algorithm Engine. Colley matrix solver, Elo with 4 starting ratings, min-max normalization, aggregate ranking. RankingService orchestration with mock Supabase tests. 30/30 ranking tests, 94/94 total.                                                                                                                                                                                                                                                                                     | squad + standard | Feature 5: Design System & UI Foundation            |
| 2026-02-23 | 4       | Implemented Feature 5: Design System & UI Foundation. Semantic design tokens, Tailwind v4 theme, 9 reusable components, retrofitted all pages, accessibility/contrast tests. 94/94 tests passing.                                                                                                                                                                                                                                                                                                                          | squad + standard | Feature 4: Tournament Weighting & Seeding           |
| 2026-02-23 | 5       | Implemented Feature 4: Tournament Weighting & Seeding. Weighted Colley/Elo algorithms, seeding factors (win %, best national finish), weights API (GET/PUT), weights management page, seeding columns in results table. 112/112 tests passing.                                                                                                                                                                                                                                                                             | squad + standard | Feature 6: Rankings Dashboard                       |
| 2026-02-24 | 6       | Implemented Feature 6: Rankings Dashboard. Sortable/filterable ranking table (search, region filter, 4 sort keys), team detail page (ranking summary, algorithm breakdown, tournament history, H2H records), run history selector. 4 new API endpoints, shared format utils, table-utils with 6 tests. 20 files changed. 118/118 tests passing.                                                                                                                                                                            | squad + standard | Feature 7: Manual Overrides & Committee Adjustments |
| 2026-02-24 | 7       | Implemented Feature 7: Manual Overrides & Committee Adjustments. Ranking overrides table with audit trail, override panel drawer (form validation, read-only finalized mode), Final Seed column with ADJ badges, run finalization workflow, committee adjustment section on team detail. 2 migrations, 3 API endpoints (overrides CRUD + finalize), OverridePanel component, computeFinalRanks utility. 9 files created, 11 modified. 146/146 tests passing (28 new).                                                      | squad + standard | Feature 8: Export & Reporting                       |
| 2026-02-24 | 8       | Implemented Feature 8: Export & Reporting. Client-side CSV/XLSX/PDF generation from in-memory ranking data. Shared assembleExportRows() data layer, RFC 4180 CSV with metadata comments, XLSX with Rankings+Overrides sheets (reuses existing xlsx lib), PDF with jsPDF+autoTable (new deps). ExportDropdown component with format picker and algorithm breakdowns toggle. Dynamic imports for XLSX/PDF code splitting. 11 files created, 1 modified. 173/173 tests passing (27 new).                                      | squad + standard | Feature 9: Multi-Age-Group Support                  |
| 2026-02-24 | 9       | Implemented Feature 9: Multi-Age-Group Support. Added age_group column to ranking_runs (migration with backfill + composite index), updated TypeScript types and Zod schema, threaded age_group through RankingService and Colley import inserts, added age_group filter to runs listing API with validated enum, updated rankings page to filter run history by selected age group and display age group in dropdown labels. 2 files created, 7 modified. 180/180 tests passing (7 new). All 9 roadmap features complete. | squad + standard | All features complete                               |
