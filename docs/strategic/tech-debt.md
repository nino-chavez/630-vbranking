# Technical Debt Inventory

**Project:** Volleyball Ranking Engine
**Date:** 2026-02-24
**Assessment method:** Static analysis, code scanning, configuration review

---

## Summary

The codebase is notably clean for a feature-complete project. No TODO, FIXME, HACK, XXX, TEMP, or WORKAROUND markers exist anywhere in the source code. The technical debt that does exist falls into two categories: **structural decisions** that traded future flexibility for delivery speed, and **missing infrastructure** that was deferred to prioritize feature work.

| Severity | Count | Description                                      |
| -------- | :---: | ------------------------------------------------ |
| Critical |   2   | Security gaps that block production deployment   |
| High     |   3   | Structural issues that increase maintenance cost |
| Medium   |   4   | Missing tooling and configuration                |
| Low      |   2   | Cosmetic and hygiene items                       |

**Total estimated remediation effort:** 8-12 developer-days

---

## Critical Severity

### DEBT-001: No Authentication or Authorization

- **Location:** All files in `src/routes/api/` (11 endpoint files)
- **Impact:** Any user with network access can trigger ranking computations, modify tournament weights, apply committee overrides, finalize runs, or delete data. In a system that produces official rankings used for tournament seeding, this represents a direct threat to organizational credibility.
- **Root cause:** Authentication was descoped to accelerate feature delivery. The Supabase client is configured with an anon key (client-side) and a service role key (server-side), but neither enforces user identity.
- **Evidence:**
  - `src/lib/supabase.ts` -- Client-side Supabase client with publishable key, no auth session
  - `src/lib/supabase-server.ts` -- Server-side client with service role key, bypasses all RLS
  - Zero files match patterns: `auth`, `session`, `cookie`, `rateLimit`, `throttle`
- **Remediation:**
  1. Enable Supabase Auth with email/password or SSO for committee members
  2. Implement Row Level Security (RLS) policies on all 9 tables
  3. Add SvelteKit hooks (`hooks.server.ts`) to validate JWT on every server request
  4. Replace service role key usage with user-scoped tokens where possible
  5. Add role-based access: `admin` (full access), `committee` (overrides, finalization), `viewer` (read-only)
- **Effort:** 2-3 days
- **Priority:** P0 -- Must resolve before production deployment

### DEBT-002: No CSRF or Rate Limiting Protection

- **Location:** All POST/PUT/DELETE handlers in `src/routes/api/`
- **Impact:** API endpoints are vulnerable to cross-site request forgery and resource exhaustion attacks. A ranking computation is CPU-intensive (Colley matrix solving via LU decomposition); unthrottled access could be used for denial of service.
- **Root cause:** SvelteKit provides some CSRF protection by default (origin checking), but no explicit rate limiting or additional protections are configured.
- **Remediation:**
  1. Verify SvelteKit CSRF origin checking is not disabled
  2. Add rate limiting middleware (e.g., `rate-limiter-flexible` or Supabase edge function limits)
  3. Add request size limits for file upload endpoints
- **Effort:** 1 day
- **Priority:** P0

---

## High Severity

### DEBT-003: Hardcoded Five-Algorithm Pattern (algo1-algo5)

- **Location:** 30 files across the entire stack
- **Impact:** The naming convention `algo1_rating`, `algo1_rank` through `algo5_rating`, `algo5_rank` is hardcoded into database columns, TypeScript types, Zod schemas, API responses, UI components, import parsers, and export generators. Adding, removing, or reordering algorithms requires coordinated changes across all 30 files plus a database migration.
- **Affected files (production code, 15 files):**

  | Layer           | Files                                                                                         |
  | --------------- | --------------------------------------------------------------------------------------------- |
  | Database types  | `src/lib/types/database.types.ts`                                                             |
  | Domain types    | `src/lib/ranking/types.ts`, `src/lib/import/types.ts`, `src/lib/export/types.ts`              |
  | Schemas         | `src/lib/schemas/ranking-result.ts`                                                           |
  | Ranking engine  | `src/lib/ranking/ranking-service.ts`, `src/lib/ranking/normalize.ts`                          |
  | Import pipeline | `src/lib/import/import-service.ts`, `src/lib/import/parsers/colley-parser.ts`                 |
  | Export module   | `src/lib/export/export-data.ts`                                                               |
  | API endpoints   | `src/routes/api/ranking/results/+server.ts`                                                   |
  | UI components   | `src/lib/components/RankingResultsTable.svelte`, `src/lib/components/DataPreviewTable.svelte` |
  | Pages           | `src/routes/ranking/team/[id]/+page.svelte`, `src/routes/ranking/team/[id]/+page.server.ts`   |

- **Root cause:** The five algorithms were a known fixed requirement at design time. Hardcoding was a reasonable trade-off for delivery speed, but it has created a maintenance burden as the pattern propagated across layers.
- **Remediation:**
  1. Define an algorithm registry: `{ id: string, name: string, compute: fn }[]`
  2. Store algorithm results as JSONB in a single column or in a normalized `algorithm_scores` junction table
  3. Generate UI columns dynamically from the registry
  4. Update import/export to iterate over the registry rather than hardcoded field names
- **Effort:** 3-5 days (includes database migration)
- **Priority:** P2 -- Address before adding or modifying algorithms

### DEBT-004: Large Files Approaching Maintainability Threshold

- **Location:** Multiple files exceeding 300 lines
- **Impact:** Large files are harder to review, test in isolation, and reason about. They increase the probability of merge conflicts in team settings.
- **Files exceeding 300 lines:**

  | File                                                | Lines | Concern                                                                                    |
  | --------------------------------------------------- | ----: | ------------------------------------------------------------------------------------------ |
  | `src/lib/import/import-service.ts`                  |   487 | Largest production file; handles upload, preview, confirm, and Colley import in one module |
  | `src/lib/types/database.types.ts`                   |   476 | Auto-generated; not actionable                                                             |
  | `src/routes/ranking/+page.svelte`                   |   451 | Main dashboard page; mixes state management, API calls, and complex UI                     |
  | `src/lib/ranking/ranking-service.ts`                |   393 | Core ranking orchestration; includes Colley, Elo, normalization, and persistence           |
  | `src/routes/import/+page.svelte`                    |   373 | Import page; manages multi-step workflow state in a single component                       |
  | `src/lib/ranking/__tests__/ranking-service.test.ts` |   337 | Test file; acceptable for integration tests                                                |

- **Remediation:**
  1. Extract `import-service.ts` into separate modules: `upload-handler.ts`, `confirm-handler.ts`, `colley-import-handler.ts`
  2. Extract `ranking/+page.svelte` state management into a Svelte 5 runes-based store
  3. Extract `ranking-service.ts` persistence logic from computation logic
- **Effort:** 2-3 days
- **Priority:** P2

### DEBT-005: No CI/CD Pipeline

- **Location:** Project root (missing `.github/workflows/`, deployment configs)
- **Impact:** All quality checks (type checking, tests, builds) must be run manually. There is no automated gate preventing broken code from reaching production. As the team grows beyond one developer, this becomes a significant regression risk.
- **Evidence:**
  - No `.github/workflows/` directory
  - No `Dockerfile`, `docker-compose.yml`, `fly.toml`, `vercel.json`, or `netlify.toml`
  - `CLAUDE.md` notes: "CI/CD: None configured (manual deployment)"
- **Remediation:**
  1. Create GitHub Actions workflow: `npm install -> type-check -> test -> build`
  2. Add deployment adapter (Vercel, Netlify, or Cloudflare) to `svelte.config.js`
  3. Configure preview deployments for pull requests
  4. Add branch protection rules requiring CI to pass
- **Effort:** 1 day
- **Priority:** P1

---

## Medium Severity

### DEBT-006: No Linter or Formatter Configuration

- **Location:** Project root (no `.eslintrc`, `eslint.config.js`, `.prettierrc`, or `prettier.config.js`)
- **Impact:** No automated code style enforcement. As contributors join the project, style inconsistencies will accumulate, increasing cognitive load during code review and making diffs noisier.
- **Remediation:**
  1. Add `eslint` with `@typescript-eslint/parser` and Svelte plugin
  2. Add `prettier` with Svelte plugin
  3. Add npm scripts: `lint`, `lint:fix`, `format`
  4. Add to CI pipeline
- **Effort:** 0.5 days
- **Priority:** P1

### DEBT-007: Client-Side Supabase Client Uses `import.meta.env`

- **Location:** `src/lib/supabase.ts`
- **Impact:** The client-side Supabase client reads credentials from `import.meta.env.PUBLIC_SUPABASE_URL` and `import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`, while the server-side client correctly uses `$env/static/public` and `$env/static/private`. This inconsistency means the client-side file does not benefit from SvelteKit's built-in environment variable validation (which warns at build time if variables are missing).
- **Remediation:** Refactor `src/lib/supabase.ts` to use `$env/static/public` for consistency with `supabase-server.ts`.
- **Effort:** 0.5 hours
- **Priority:** P2

### DEBT-008: Test Configuration Missing Setup Files

- **Location:** `vite.config.ts` line 10
- **Impact:** The Vitest `setupFiles` array is empty (`setupFiles: []`). Testing Library's `jest-dom` matchers (which are listed as a dependency) require setup to extend the `expect` API. If any test uses `toBeInTheDocument()` or similar matchers, they depend on implicit setup that could break with dependency updates.
- **Remediation:** Create `src/test-setup.ts` importing `@testing-library/jest-dom` and reference it in `setupFiles`.
- **Effort:** 0.5 hours
- **Priority:** P2

### DEBT-009: `xlsx` Library License and Maintenance Concerns

- **Location:** `package.json` -- `"xlsx": "^0.18.5"`
- **Impact:** The `xlsx` (SheetJS) package changed its license from Apache-2.0 to a restrictive proprietary license in later versions. Version 0.18.5 is the last Apache-2.0 release. Pinning to this version is correct for license compliance, but it means the project will not receive security patches or feature updates from the library maintainer.
- **Remediation:**
  1. Short-term: Pin the exact version (`"xlsx": "0.18.5"` without caret) and document the license rationale
  2. Long-term: Evaluate alternatives (`exceljs`, `xlsx-populate`) if XLSX features need to expand
- **Effort:** 0.5 hours (short-term); 1-2 days (migration)
- **Priority:** P3

---

## Low Severity

### DEBT-010: Package Name Is "svelte-scaffold"

- **Location:** `package.json` line 2
- **Impact:** The package is named `"svelte-scaffold"` at version `"0.0.1"`. This is the default from the project scaffold template and has never been updated. While the package is private and will never be published to npm, the incorrect name could cause confusion in logs, monitoring dashboards, or error reports that display the package name.
- **Remediation:** Update `"name"` to `"volleyball-ranking-engine"` and `"version"` to `"1.0.0"` (reflecting feature completeness).
- **Effort:** 5 minutes
- **Priority:** P1 (trivial fix, disproportionate signal value)

### DEBT-011: Adapter Not Configured for Target Platform

- **Location:** `package.json` -- `"@sveltejs/adapter-auto": "^7.0.0"`
- **Impact:** The project uses `adapter-auto`, which auto-detects the deployment platform. For production deployments, an explicit adapter (`adapter-vercel`, `adapter-node`, `adapter-cloudflare`) should be used to ensure deterministic build output and enable platform-specific optimizations.
- **Remediation:** Choose a deployment target and install the corresponding adapter.
- **Effort:** 0.5 hours
- **Priority:** P2

---

## Debt-Free Areas

The following areas were scanned and found to have no technical debt:

- **Code markers:** Zero TODO, FIXME, HACK, XXX, TEMP, or WORKAROUND comments anywhere in `src/`
- **Type safety:** Full TypeScript strict mode with auto-generated database types
- **Schema validation:** Zod schemas exist for all 9 database entities
- **Test determinism:** Dedicated determinism tests verify ranking output stability
- **Error handling:** All 11 API endpoints have try/catch blocks (28 error handling occurrences)
- **Accessibility:** Dedicated accessibility and contrast test files exist
- **Database migrations:** 15 sequential, well-named migrations covering all schema changes
- **Architecture decisions:** 4 ADRs document key design choices with rationale

---

## Remediation Roadmap

```
Week 1  [P0] DEBT-001 Authentication + DEBT-002 Rate Limiting
Week 2  [P1] DEBT-005 CI/CD + DEBT-006 Linting + DEBT-010 Package Name
Week 3  [P2] DEBT-003 Algorithm Refactor (start) + DEBT-007 Env Vars + DEBT-011 Adapter
Week 4  [P2] DEBT-003 Algorithm Refactor (finish) + DEBT-004 File Decomposition
Week 5  [P3] DEBT-009 xlsx Evaluation + DEBT-008 Test Setup
```

**Total estimated effort:** 8-12 developer-days spread across 5 weeks.
