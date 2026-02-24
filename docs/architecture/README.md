# Architecture Overview

> Last updated: 2026-02-24

## System Metaphor

The Volleyball Ranking Engine is a decision-support tool that transforms raw tournament placement data into defensible, multi-perspective team rankings for AAU volleyball. It operates as a data pipeline: XLSX spreadsheets enter through a two-phase import process with identity resolution, flow through a five-algorithm ensemble (Colley Matrix plus four Elo variants), and exit as normalized, committee-reviewable rankings exportable to CSV, XLSX, and PDF. The system serves a single user group -- the AAU ranking committee -- and its sole infrastructure dependency is a Supabase-hosted PostgreSQL database.

## Architectural Style

**SvelteKit file-based routing monolith with service layer pattern.**

The application deploys as a single SvelteKit 2 artifact. SvelteKit's file-system routing maps URLs directly to page components and API endpoints. Business logic lives in a service layer (`src/lib/`) that separates pure algorithm functions from I/O-performing service classes. The service layer communicates exclusively with Supabase (hosted PostgreSQL) through the `@supabase/supabase-js` client library.

Key architectural properties:

- **No microservices.** A single deployment handles SSR pages, API routes, and static assets.
- **No authentication.** The system relies on network-level access control.
- **No SSR for data-heavy pages.** Ranking and import pages use `+page.server.ts` load functions for initial data, with subsequent interactions handled through client-side `fetch()` calls to API routes.
- **Pure/impure separation.** Algorithm functions (`colley.ts`, `elo.ts`, `normalize.ts`, `seeding-factors.ts`) are pure -- they accept data and return results with zero side effects. Service classes (`RankingService`, `ImportService`, `IdentityResolver`) perform database I/O.

## High-Level Structure

```mermaid
graph TB
    subgraph "Browser"
        Pages["SvelteKit Pages<br/><i>/ranking, /import,<br/>/ranking/weights,<br/>/ranking/team/[id]</i>"]
        Components["Design System<br/><i>21 Svelte 5 components</i>"]
        Export["Export Module<br/><i>CSV, XLSX, PDF<br/>(client-side generation)</i>"]
    end

    subgraph "Server (SvelteKit API Routes)"
        ImportAPI["Import API<br/><i>POST /api/import/upload<br/>POST /api/import/confirm</i>"]
        RankingAPI["Ranking API<br/><i>POST /api/ranking/run<br/>GET /api/ranking/results<br/>GET /api/ranking/runs<br/>POST /api/ranking/runs/finalize</i>"]
        OverridesAPI["Overrides API<br/><i>GET/POST/DELETE<br/>/api/ranking/overrides</i>"]
        WeightsAPI["Weights API<br/><i>GET/PUT<br/>/api/ranking/weights</i>"]
        TeamAPI["Team API<br/><i>GET /api/ranking/team/[id]<br/>GET .../h2h<br/>GET .../history</i>"]
    end

    subgraph "Service Layer"
        RankingSvc["RankingService<br/><i>Orchestrates ranking pipeline</i>"]
        ImportSvc["ImportService<br/><i>Validates and writes imports</i>"]
        IdentityRes["IdentityResolver<br/><i>Exact + fuzzy matching</i>"]
        DupDetect["DuplicateDetector<br/><i>Composite key conflicts</i>"]
    end

    subgraph "Pure Algorithms"
        Colley["Colley Matrix<br/><i>LU decomposition via ml-matrix</i>"]
        Elo["Elo Variants<br/><i>4 starting ratings: 2200-2700</i>"]
        Normalize["Normalizer<br/><i>Min-max to 0-100, mean aggregation</i>"]
        WLDerive["W/L Derivation<br/><i>Finishes or matches to pairwise</i>"]
        Seeding["Seeding Factors<br/><i>Win %, best national finish</i>"]
        Parsers["File Parsers<br/><i>FinishesParser, ColleyParser</i>"]
    end

    subgraph "Data Layer"
        Schemas["Zod Schemas<br/><i>9 table schemas + 2 enums</i>"]
        DBTypes["Database Types<br/><i>Auto-generated from Supabase</i>"]
        SupaClient["Supabase Clients<br/><i>Server (service-role)<br/>Browser (publishable key)</i>"]
    end

    subgraph "Infrastructure"
        DB[("Supabase PostgreSQL<br/><i>9 tables, 2 RPC functions,<br/>15 migrations, 2 enums</i>")]
    end

    Pages --> Components
    Pages -->|"fetch()"| ImportAPI
    Pages -->|"fetch()"| RankingAPI
    Pages -->|"fetch()"| OverridesAPI
    Pages -->|"fetch()"| WeightsAPI
    Pages -->|"fetch()"| TeamAPI
    Pages --> Export

    ImportAPI --> ImportSvc
    ImportAPI --> IdentityRes
    ImportAPI --> DupDetect
    ImportAPI --> Parsers
    RankingAPI --> RankingSvc
    OverridesAPI --> Schemas

    RankingSvc --> Colley
    RankingSvc --> Elo
    RankingSvc --> Normalize
    RankingSvc --> WLDerive
    RankingSvc --> Seeding

    RankingSvc --> SupaClient
    ImportSvc --> SupaClient
    IdentityRes --> SupaClient
    DupDetect --> SupaClient

    SupaClient --> DBTypes
    ImportSvc --> Schemas
    SupaClient --> DB
```

## Component Catalog

| Directory                 | Responsibility                                                                   | Key Files                                                                                                                                                                                                                                                                                                                                                                                                                         | Dependencies                                                       |
| ------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `src/routes/ranking/`     | Rankings dashboard, team detail page, weights editor                             | `+page.svelte`, `+page.server.ts`, `team/[id]/+page.svelte`, `weights/+page.svelte`                                                                                                                                                                                                                                                                                                                                               | Design system components, Ranking API, Export module               |
| `src/routes/import/`      | File upload page with preview and identity resolution UI                         | `+page.svelte`, `+page.server.ts`                                                                                                                                                                                                                                                                                                                                                                                                 | Design system components, Import API                               |
| `src/routes/api/ranking/` | REST API for ranking computation, results, runs, overrides, weights, team detail | `run/+server.ts`, `results/+server.ts`, `runs/+server.ts`, `runs/finalize/+server.ts`, `overrides/+server.ts`, `weights/+server.ts`, `team/[id]/+server.ts`, `team/[id]/h2h/+server.ts`, `team/[id]/history/+server.ts`                                                                                                                                                                                                           | RankingService, Zod schemas, supabase-server                       |
| `src/routes/api/import/`  | REST API for two-phase import (upload + confirm)                                 | `upload/+server.ts`, `confirm/+server.ts`                                                                                                                                                                                                                                                                                                                                                                                         | ImportService, IdentityResolver, DuplicateDetector, Parsers        |
| `src/lib/ranking/`        | Core ranking algorithms, normalization, aggregation, orchestration               | `ranking-service.ts`, `colley.ts`, `elo.ts`, `normalize.ts`, `derive-wins-losses.ts`, `seeding-factors.ts`, `table-utils.ts`, `types.ts`                                                                                                                                                                                                                                                                                          | ml-matrix (Colley only), Zod enums, Supabase client (service only) |
| `src/lib/import/`         | XLSX parsing, identity resolution, duplicate detection, import execution         | `import-service.ts`, `identity-resolver.ts`, `duplicate-detector.ts`, `types.ts`, `parsers/finishes-parser.ts`, `parsers/colley-parser.ts`, `parsers/match-parser.ts`, `parsers/index.ts`                                                                                                                                                                                                                                         | Zod schemas, Supabase client                                       |
| `src/lib/export/`         | CSV, XLSX, and PDF report generation                                             | `export-data.ts`, `csv.ts`, `xlsx.ts`, `pdf.ts`, `download.ts`, `types.ts`, `index.ts`                                                                                                                                                                                                                                                                                                                                            | table-utils (computeFinalRanks), jspdf, jspdf-autotable, xlsx      |
| `src/lib/components/`     | Reusable Svelte 5 UI components (design system)                                  | `Button.svelte`, `Card.svelte`, `DataTable.svelte`, `RankingResultsTable.svelte`, `OverridePanel.svelte`, `FileDropZone.svelte`, `IdentityResolutionPanel.svelte`, `ExportDropdown.svelte`, `NavHeader.svelte`, `PageShell.svelte`, `Select.svelte`, `Spinner.svelte`, `Banner.svelte`, `RankBadge.svelte`, `TierRow.svelte`, `FreshnessIndicator.svelte`, `PageHeader.svelte`, `DataPreviewTable.svelte`, `ImportSummary.svelte` | Tailwind CSS 4, Svelte 5 runes                                     |
| `src/lib/schemas/`        | Zod validation schemas for all database entities                                 | `enums.ts`, `team.ts`, `season.ts`, `tournament.ts`, `tournament-result.ts`, `tournament-weight.ts`, `match.ts`, `ranking-run.ts`, `ranking-result.ts`, `ranking-override.ts`, `index.ts`                                                                                                                                                                                                                                         | Zod 4.3                                                            |
| `src/lib/types/`          | Auto-generated TypeScript types from Supabase schema                             | `database.types.ts`                                                                                                                                                                                                                                                                                                                                                                                                               | None (generated artifact)                                          |
| `src/lib/utils/`          | Formatting utility functions                                                     | `format.ts`                                                                                                                                                                                                                                                                                                                                                                                                                       | None                                                               |
| `supabase/migrations/`    | PostgreSQL migration files (15 sequential migrations)                            | `20260223180001_*.sql` through `20260223180015_*.sql`                                                                                                                                                                                                                                                                                                                                                                             | PostgreSQL, Supabase                                               |
| `tests/`                  | Integration tests for database constraints and edge cases                        | `referential-integrity.test.ts`, `constraint-edge-cases.test.ts`                                                                                                                                                                                                                                                                                                                                                                  | Vitest, Supabase client                                            |
| `docs/`                   | Project documentation across 7 layers                                            | `architecture/`, `developer/`, `functional/`, `ops/`, `strategic/`, `testing/`, `user/`                                                                                                                                                                                                                                                                                                                                           | None                                                               |

## Key Architectural Decisions

| ADR                                                         | Decision                                                                                                      | Rationale                                                                                                                                                                                                                                                  | Status   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| [ADR-001](decisions/adr-001-multi-algorithm-ranking.md)     | Five-algorithm ensemble ranking (Colley Matrix + 4 Elo variants with starting ratings 2200, 2400, 2500, 2700) | No single algorithm is defensible against all challenges. The ensemble provides five independent perspectives. Normalized scores (0-100) are averaged into AggRating. The committee can see per-algorithm breakdowns to identify genuinely close matchups. | Accepted |
| [ADR-002](decisions/adr-002-supabase-monolith.md)           | SvelteKit monolith with Supabase backend                                                                      | The committee is a small group (under 20 members) without dedicated ops staff. A single deployment artifact with a managed database eliminates service coordination and database administration overhead.                                                  | Accepted |
| [ADR-003](decisions/adr-003-two-phase-import.md)            | Two-phase import with identity resolution (upload preview, then confirm)                                      | Spreadsheet team codes and tournament names diverge from canonical database values. Auto-importing without human review would silently corrupt ranking data. The two-phase workflow ensures every entity mapping is verified.                              | Accepted |
| [ADR-004](decisions/adr-004-committee-override-workflow.md) | Committee override workflow with draft/finalize lifecycle                                                     | The committee must retain authority to adjust algorithmic rankings based on qualitative factors. Overrides require a written justification (min 10 chars) and committee member attribution. Finalization is irreversible and locks all overrides.          | Accepted |

## Data Flow: Ranking Computation

The ranking pipeline executes as a single synchronous operation triggered by `POST /api/ranking/run`. The `RankingService` orchestrates a 12-step process.

```mermaid
sequenceDiagram
    participant Page as Ranking Page
    participant API as POST /api/ranking/run
    participant Svc as RankingService
    participant DB as Supabase PostgreSQL
    participant Colley as Colley Matrix
    participant Elo as Elo Variants (x4)
    participant Norm as Normalizer

    Page->>API: { season_id, age_group }
    API->>API: Validate inputs (Zod AgeGroup)
    API->>Svc: runRanking(config)

    Svc->>DB: SELECT season (validate exists)
    Svc->>DB: INSERT ranking_runs (status=draft)
    Svc->>DB: SELECT teams WHERE age_group
    Svc->>DB: SELECT tournaments WHERE season_id
    Svc->>DB: SELECT tournament_weights
    Svc->>DB: SELECT matches (count check)

    alt Match records available
        Svc->>DB: SELECT matches
        Svc->>Svc: deriveWinsLossesFromMatches()
    else Finishes only
        Svc->>DB: SELECT tournament_results
        Svc->>Svc: deriveWinsLossesFromFinishes()
    end

    Svc->>Svc: flattenPairwiseGroups()

    par Five algorithms execute
        Svc->>Colley: computeColleyRatings(flat, teams, weights)
        Colley-->>Svc: AlgorithmResult[] (algo1)
    and
        Svc->>Elo: computeEloRatings(groups, teams, 2200, K=32, weights)
        Elo-->>Svc: AlgorithmResult[] (algo2)
    and
        Svc->>Elo: computeEloRatings(groups, teams, 2400, K=32, weights)
        Elo-->>Svc: AlgorithmResult[] (algo3)
    and
        Svc->>Elo: computeEloRatings(groups, teams, 2500, K=32, weights)
        Elo-->>Svc: AlgorithmResult[] (algo4)
    and
        Svc->>Elo: computeEloRatings(groups, teams, 2700, K=32, weights)
        Elo-->>Svc: AlgorithmResult[] (algo5)
    end

    Svc->>Norm: normalizeAndAggregate(algo1-5, teams)
    Norm->>Norm: Min-max normalize each algo to 0-100
    Norm->>Norm: AggRating = mean(5 normalized scores)
    Norm->>Norm: AggRank = sort desc, ties by alpha name
    Norm-->>Svc: NormalizedTeamResult[]

    Svc->>Svc: computeSeedingFactors(win %, Tier-1 finishes)
    Svc->>DB: INSERT ranking_results (batch, 12 cols per team)
    Svc-->>API: RankingRunOutput
    API-->>Page: { ranking_run_id, teams_ranked, seeding_factors }
```

### Error Handling

If any step after run creation fails, the `RankingService` performs cleanup in a `catch` block: it deletes any partial `ranking_results` rows and the `ranking_runs` record, then re-throws the error. This prevents orphaned run records in the database.

## Data Flow: Import Pipeline

The import pipeline operates in two phases, each backed by a separate API endpoint.

```mermaid
sequenceDiagram
    participant Page as Import Page
    participant Upload as POST /api/import/upload
    participant Parser as FinishesParser / ColleyParser
    participant IDRes as IdentityResolver
    participant DupDet as DuplicateDetector
    participant UI as Conflict Resolution UI
    participant Confirm as POST /api/import/confirm
    participant ImportSvc as ImportService
    participant DB as Supabase PostgreSQL

    Page->>Upload: FormData { file.xlsx, season_id, age_group, format }
    Upload->>Upload: Validate file (.xlsx, <10 MB)
    Upload->>Parser: parse(ArrayBuffer)
    Parser-->>Upload: ParseResult { rows[], errors[] }
    Upload->>IDRes: resolveTeams(teamCodes, ageGroup)
    IDRes->>DB: SELECT teams WHERE age_group
    IDRes->>IDRes: Exact match (case-insensitive)
    IDRes->>IDRes: Fuzzy match (Levenshtein, threshold >0.3)
    IDRes-->>Upload: { matched, unmatched: IdentityConflict[] }
    Upload->>IDRes: resolveTournaments(names, seasonId)
    IDRes-->>Upload: { matched, unmatched }
    Upload->>DupDet: detectDuplicateFinishes(validatedRows)
    DupDet->>DB: SELECT existing by composite key
    DupDet-->>Upload: duplicate warnings
    Upload-->>Page: { parseResult, identityMappings, conflicts, duplicates }

    Page->>UI: Display preview, conflicts, duplicates
    UI-->>Page: User resolves: map / create / skip

    Page->>Confirm: { rows, identityMappings, importMode, seasonId, ageGroup, format }
    Confirm->>Confirm: Create new teams/tournaments (action=create)
    Confirm->>ImportSvc: validateFinishesRows(rows, mappings)
    ImportSvc->>ImportSvc: Apply identity mappings (parsedValue to UUID)
    ImportSvc->>ImportSvc: Validate each row against Zod schema

    alt Replace mode
        Confirm->>DB: RPC import_replace_tournament_results (atomic)
    else Merge mode
        Confirm->>DB: Per-row: SELECT, INSERT/UPDATE/SKIP
    end

    Confirm-->>Page: ImportSummaryData { inserted, updated, skipped, created }
```

## External Integrations

| Service                   | Role                                      | Configuration                                                                                                     | Client                                                                 |
| ------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **Supabase (PostgreSQL)** | Sole data store for all application state | `PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (server), `PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` (browser) | `@supabase/supabase-js` typed with auto-generated `Database` interface |

The system has no other external integrations. It does not call external APIs, receive webhooks, or publish events. All data enters through XLSX file uploads and all data exits through browser-downloaded export files.

## Cross-Cutting Concerns

### Error Handling

API routes follow a consistent pattern: wrap the handler body in a `try/catch`, return `{ success: false, error: message }` with appropriate HTTP status codes (400 for validation, 403 for authorization, 404 for not found, 409 for conflicts, 500 for server errors). The `RankingService` performs transactional cleanup on failure by deleting partial results and the run record.

### Validation

All user input passes through Zod schemas before reaching the database. The schema layer (`src/lib/schemas/`) defines insert and select schemas for every table. API routes validate request bodies with `safeParse()` and return structured error messages on failure. The `AgeGroup` enum (`z.enum(['15U', '16U', '17U', '18U'])`) is validated at both the API route level and the service level.

### Type Safety

TypeScript types are auto-generated from the Supabase database schema into `src/lib/types/database.types.ts`. The Supabase client is parameterized with the `Database` generic type, providing compile-time type checking for all query and mutation operations. Domain types in `src/lib/ranking/types.ts` and `src/lib/import/types.ts` model the business domain independently of the database schema.

### Environment Configuration

The application uses two environment variable sources:

| Variable                                  | Scope   | Access                                         |
| ----------------------------------------- | ------- | ---------------------------------------------- |
| `PUBLIC_SUPABASE_URL`                     | Public  | `$env/static/public` (SvelteKit)               |
| `PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Public  | `import.meta.env` (Vite)                       |
| `SUPABASE_SERVICE_ROLE_KEY`               | Private | `$env/static/private` (SvelteKit, server-only) |

## Technical Constraints

| Constraint                            | Rationale                                                                                                                                                                                                                            |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Browser-only XLSX parsing**         | The `xlsx` library parses uploaded files in the server-side API route using `ArrayBuffer`. Export generation for XLSX and PDF uses dynamic imports (`import()`) for code splitting, keeping the initial page bundle small.           |
| **No authentication**                 | The committee is a small, trusted group. Supabase Auth is available but not configured. Access control relies on network-level restrictions.                                                                                         |
| **No SSR for interactive data pages** | Ranking and import pages load initial data via `+page.server.ts` but perform all mutations through client-side `fetch()` calls to API routes. This avoids full-page reloads for ranking runs, imports, and override operations.      |
| **Hardcoded algorithm count**         | The five algorithms (algo1-algo5) are encoded in the database schema, Zod schemas, TypeScript types, service code, export module, and UI components. Adding or removing an algorithm requires coordinated changes across all layers. |
| **Synchronous ranking computation**   | The ranking pipeline runs synchronously within a single HTTP request. For the current data volume (hundreds of teams, dozens of tournaments), this completes within acceptable response times.                                       |

## Areas of Complexity

### Algorithm Ensemble

The five-algorithm ensemble is the system's central complexity. The Colley Matrix solves a linear system via LU decomposition (`ml-matrix`), while each Elo variant processes tournaments chronologically. Tournament weights scale Colley matrix entries and Elo K-factors differently. The normalization step must handle edge cases: identical ratings across all teams (assigned 50.0), single-team age groups (Colley returns 0.5), and algorithms with vastly different raw rating scales (Colley ~0.2-0.8, Elo ~1800-3100).

### Import Identity Resolution

The `IdentityResolver` must match human-entered team codes and tournament names against canonical database records. It performs case-insensitive exact matching first, then falls back to Levenshtein distance-based fuzzy matching with a 0.3 similarity threshold. The two-phase import workflow ensures the committee explicitly resolves every unmatched entity before data reaches the database. The `create` action allows inserting new teams and tournaments inline during import.

### Override Ordering

The `computeFinalRanks` function merges algorithmic `agg_rank` values with committee overrides. Overrides specify an explicit `final_rank` for a team. The system permits duplicate final ranks (two teams at rank 3) and does not re-rank non-overridden teams when an override is applied. The export module, dashboard UI, and ranking API all call `computeFinalRanks` to ensure consistent final rank computation.
