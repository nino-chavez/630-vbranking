# Specchain State

## Last Updated
2026-02-23

## Active Spec
specchain/specs/2026-02-23-data-ingestion-pipeline/

## Session Context
Implemented the Data Ingestion Pipeline spec (Roadmap Feature 2). Excel parsing system for Finishes and Colley formats with adaptive column detection. Identity resolution with Levenshtein fuzzy matching. Import service with atomic replace (RPC) and merge modes. Two API endpoints (upload + confirm). Multi-step Svelte 5 import page with 4 reusable components. 35 tests passing, 0 TypeScript errors. 28 files created. E2E tests deferred to CI/CD. Next step: Feature 3 (Ranking Algorithm Engine).

## Active Blockers
None.

## Resolved Blockers
None.

## Key Decisions
| Date | Decision | Rationale | Context |
|------|----------|-----------|---------|
| 2026-02-23 | All-TypeScript (no Python) | 73x73 Colley Matrix is trivially small for ml-matrix; unified stack benefits outweigh Python's numerical ecosystem | Tech stack decision |
| 2026-02-23 | Individual match records as base granularity | Enables future enhancement with set scores/point differentials; H2H summaries derived via queries | Schema design |
| 2026-02-23 | Ranking snapshots over recompute | Preserves historical rankings; enables trend analysis | Schema design |
| 2026-02-23 | Zod v4 top-level format validators | Used z.uuid(), z.iso.datetime(), z.iso.date() instead of deprecated z.string().uuid() etc. | Zod v4 compatibility |
| 2026-02-23 | Adaptive Finishes parser with Row 2 triplet scanning | Scans Row 2 for Div/Fin/Tot patterns starting at column 10 to detect tournament boundaries; handles merged cells, padding columns, and header-only tournaments | Import parser design |
| 2026-02-23 | Supabase RPC for atomic replace mode | PostgreSQL function bodies are inherently transactional; Supabase JS client cannot provide multi-table transaction guarantees | Database atomicity |
| 2026-02-23 | Server-side Excel parsing | xlsx library runs on the server (API endpoint) to avoid shipping SheetJS to the browser; client sends raw file, server returns structured JSON | Architecture decision |
| 2026-02-23 | Separate server-side Supabase client | Created `supabase-server.ts` using `$env/static/private` for service role key, keeping it separate from client-side `supabase.ts` | SvelteKit security model |
| 2026-02-23 | Built-in Levenshtein distance | ~20 lines of standard DP rather than adding an external dependency; exported for direct testing | Dependency minimization |

## Execution Profiles
| Spec | Strategy | Depth | Date |
|------|----------|-------|------|
| data-model-database-schema | squad | standard | 2026-02-23 |
| data-ingestion-pipeline | squad | standard | 2026-02-23 |

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

## Session Log
| Date | Session | Summary | Profile | Next Steps |
|------|---------|---------|---------|------------|
| 2026-02-23 | 1 | Implemented Feature 1: Data Model & Database Schema. Created 11 migrations, 8 Zod schemas, typed Supabase client. 18/18 tests passing. | squad + standard | Feature 2: Data Ingestion Pipeline |
| 2026-02-23 | 2 | Implemented Feature 2: Data Ingestion Pipeline. 4 task groups (parsing, services/API, frontend UI, test gaps). 28 files created, 2 modified. 35/35 tests passing, 0 TS errors. E2E tests deferred (no running server). | squad + standard | Feature 3: Ranking Algorithm Engine |
