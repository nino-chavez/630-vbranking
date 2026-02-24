# Project: Volleyball Ranking Engine

## Identity

A web application that computes, reviews, and exports team rankings for AAU volleyball across four age groups (15U, 16U, 17U, 18U) using a five-algorithm ensemble approach (Colley Matrix + four Elo variants with different starting ratings).

**Type:** Monolith

## Tech Stack

- **Language:** TypeScript 5.9
- **Framework:** SvelteKit 2.50 (Svelte 5 with runes: `$state`, `$derived`, `$props`)
- **UI:** Tailwind CSS 4.2 (Vite plugin, no PostCSS)
- **Database:** Supabase (hosted PostgreSQL) -- 9 tables, 2 RPC functions, 15 migrations, 2 custom enums
- **Validation:** Zod 4.3
- **Testing:** Vitest 4.0 with jsdom, Testing Library (Svelte)
- **Math:** ml-matrix (LU decomposition for Colley), custom Elo implementation
- **Export:** jspdf + jspdf-autotable (PDF), xlsx (XLSX), custom CSV
- **Auth:** Supabase Auth via `@supabase/ssr` (email/password, server-side sessions)
- **Linting:** ESLint 10 (flat config) + Prettier 3.8 with `eslint-plugin-svelte` and `prettier-plugin-svelte`
- **Infrastructure:** Vercel (SvelteKit adapter-vercel) + Supabase managed service
- **CI/CD:** GitHub Actions (lint, format check, type check, test, build on push/PR to main)

## Documentation Standards

- **Format:** GitHub-Flavored Markdown
- **Diagrams:** Mermaid.js (embedded in Markdown)
- **Structure:** Diataxis framework for user documentation
- **Location:** `docs/` directory
- **Naming:** kebab-case for files, Title Case for headers

### Style Guide

- Use active voice
- Present tense for current behavior
- Second person ("you") for instructions
- No emoji unless explicitly requested
- Code blocks with language tags

## Key Directories

| Directory              | Purpose                                                                          |
| ---------------------- | -------------------------------------------------------------------------------- |
| `src/lib/ranking/`     | Core ranking algorithms (Colley, Elo), normalization, aggregation, orchestration |
| `src/lib/import/`      | XLSX file parsing, identity resolution, duplicate detection                      |
| `src/lib/export/`      | CSV, XLSX, and PDF export generation                                             |
| `src/lib/schemas/`     | Zod validation schemas for all database entities                                 |
| `src/lib/types/`       | TypeScript type definitions (auto-generated database types)                      |
| `src/lib/components/`  | Reusable Svelte 5 UI components (design system)                                  |
| `src/lib/utils/`       | Formatting utilities                                                             |
| `src/routes/`          | SvelteKit pages and API endpoints                                                |
| `src/routes/api/`      | REST API endpoints (ranking, import, overrides, weights)                         |
| `src/routes/ranking/`  | Rankings dashboard page, weights page, team detail page                          |
| `src/routes/auth/`     | Auth pages (login, signup) and endpoints (callback, logout)                      |
| `src/routes/import/`   | Data import page with file upload                                                |
| `supabase/migrations/` | PostgreSQL migration files (15 sequential migrations)                            |
| `tests/`               | Integration tests (referential integrity, constraint edge cases)                 |
| `docs/`                | Project documentation (7 layers)                                                 |
| `specchain/`           | Specification chain (planning artifacts, specs, task tracking)                   |
| `data/`                | Sample data files for development                                                |

## Exclusions

Ignore these directories when analyzing code:

- `node_modules/`
- `.git/`
- `.svelte-kit/`
- `build/`
- `coverage/`
- `.cache/`
- `supabase/.temp/`

## Commands

| Action       | Command                                 |
| ------------ | --------------------------------------- |
| Install      | `npm install`                           |
| Dev          | `npm run dev` (Vite dev server)         |
| Build        | `npm run build`                         |
| Test         | `npx vitest run`                        |
| Type Check   | `npm run check` (svelte-check + tsc)    |
| Lint         | `npm run lint` (ESLint)                 |
| Format       | `npm run format` (Prettier write)       |
| Format Check | `npm run format:check` (Prettier check) |
| Preview      | `npm run preview`                       |

## Documentation Skills

Available commands:

| Command                      | Purpose                                 |
| ---------------------------- | --------------------------------------- |
| `/init-docs`                 | Bootstrap documentation system          |
| `/doc-architecture`          | Generate architecture documentation     |
| `/doc-developer`             | Generate developer onboarding guide     |
| `/doc-ops`                   | Generate DevOps and infrastructure docs |
| `/doc-testing`               | Generate testing strategy docs          |
| `/doc-functional`            | Extract business logic documentation    |
| `/doc-strategic`             | Generate tech debt audit and roadmap    |
| `/doc-user [type] [feature]` | Generate user-facing documentation      |
| `/doc-audit`                 | Run documentation coverage audit        |
| `/doc-build [platform]`      | Build docs for static site hosting      |
| `/doc-publish [target]`      | Deploy docs to hosting provider         |

## Project-Specific Context

### Domain Terminology

| Term                | Definition                                                                                   |
| ------------------- | -------------------------------------------------------------------------------------------- |
| Age Group           | Competition division by player age: 15U, 16U, 17U, 18U                                       |
| Colley Matrix       | Time-independent ranking algorithm solving Cr=b via LU decomposition                         |
| Elo Rating          | Chronological rating algorithm with configurable starting values (2200, 2400, 2500, 2700)    |
| AggRating           | Aggregate rating: arithmetic mean of 5 normalized algorithm scores (0-100 scale)             |
| AggRank             | Final rank derived by sorting AggRating descending with alphabetical tie-breaking            |
| Tournament Weight   | Multiplier (0.0-5.0) applied to tournament results across all algorithms                     |
| Ranking Run         | A single computation of rankings for a season + age group, stored with parameters and status |
| Override            | Committee-applied manual adjustment to a team's rank position                                |
| Finalization        | Locking a ranking run to prevent further modifications                                       |
| Finishes Import     | Uploading XLSX files with tournament placement data                                          |
| Colley Import       | Uploading XLSX files with pre-computed Colley ratings                                        |
| Identity Resolution | Matching imported team names to existing teams in the database                               |
| Seeding Factors     | Sub-factors (Strength of Schedule, Win Rate) contributing to tiebreaking                     |

### Architectural Decisions

- **ADR-001:** Five-algorithm ensemble ranking (Colley + 4 Elo variants) for defensible, transparent rankings
- **ADR-002:** Supabase monolith -- single managed PostgreSQL database for all data, no microservices
- **ADR-003:** Two-phase import (upload preview -> confirm) with identity resolution for safe data ingestion
- **ADR-004:** Committee override workflow with audit trail (reason required, original rank preserved)
- **ADR-005:** Supabase Auth with `@supabase/ssr` for server-side session management; two-layer auth (hooks middleware + per-endpoint `requireAuth()` guard)

### Authentication

- **Provider:** Supabase Auth (email/password)
- **Session management:** Server-side via `@supabase/ssr` `createServerClient` in `src/hooks.server.ts`
- **Middleware:** `hooks.server.ts` uses `sequence()` with two handles:
  - `supabaseHandle` -- creates per-request Supabase client, provides `safeGetSession()`
  - `authGuardHandle` -- protects `/api/*` (401 JSON), `/import` and `/ranking` (redirect to `/auth/login`)
- **Per-endpoint guard:** `src/lib/auth-guard.ts` exports `requireAuth()` for defense-in-depth on all 11 API routes
- **Auth routes:**
  - `POST /auth/callback` -- email/password login and signup
  - `GET /auth/callback` -- OAuth code exchange
  - `POST /auth/logout` -- sign out and redirect
  - `/auth/login` -- login page
  - `/auth/signup` -- signup page
- **Public routes:** `/`, `/auth/*`
- **Env vars:** Use `$env/static/public` (not `import.meta.env`) for Vercel compatibility

### Environment Variables

| Variable                                  | Scope       | Purpose                                      |
| ----------------------------------------- | ----------- | -------------------------------------------- |
| `PUBLIC_SUPABASE_URL`                     | Public      | Supabase project URL                         |
| `PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Public      | Supabase anon/publishable key                |
| `SUPABASE_SERVICE_ROLE_KEY`               | Server-only | Supabase service role key (admin operations) |

### External Dependencies

| Service  | Purpose                             | Configuration                                                                                 |
| -------- | ----------------------------------- | --------------------------------------------------------------------------------------------- |
| Supabase | Managed PostgreSQL + Auth           | `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Vercel   | Hosting + CI/CD via Git integration | Linked to `nino-chavez/volleyball-ranking-engine` repo, env vars set across all environments  |

### Database Schema (9 Tables)

| Table                | Purpose                                                          |
| -------------------- | ---------------------------------------------------------------- |
| `seasons`            | Competition seasons with year and name                           |
| `teams`              | Teams with name, age_group, and club                             |
| `tournaments`        | Tournament events with name, date, location                      |
| `tournament_weights` | Per-season weight multipliers for each tournament                |
| `tournament_results` | Team placement (finish position) at each tournament              |
| `matches`            | Individual game results (team_a, team_b, score, winner)          |
| `ranking_runs`       | Ranking computation snapshots with parameters, status, age_group |
| `ranking_results`    | Per-team algorithm scores and final rank within a run            |
| `ranking_overrides`  | Committee overrides with old_rank, new_rank, reason              |

### API Endpoints

| Method          | Endpoint                         | Purpose                                             |
| --------------- | -------------------------------- | --------------------------------------------------- |
| POST            | `/auth/callback`                 | Email/password login and signup                     |
| GET             | `/auth/callback`                 | OAuth code exchange                                 |
| POST            | `/auth/logout`                   | Sign out user                                       |
| POST            | `/api/import/upload`             | Parse uploaded XLSX, return preview                 |
| POST            | `/api/import/confirm`            | Commit parsed data to database                      |
| POST            | `/api/ranking/run`               | Execute ranking computation                         |
| GET             | `/api/ranking/runs`              | List ranking runs (filterable by season, age_group) |
| GET             | `/api/ranking/results`           | Get results for a specific run                      |
| POST            | `/api/ranking/runs/finalize`     | Lock a run from further edits                       |
| GET/PUT         | `/api/ranking/weights`           | Manage tournament weight multipliers                |
| GET/POST/DELETE | `/api/ranking/overrides`         | Manage committee rank overrides                     |
| GET             | `/api/ranking/team/[id]`         | Team detail with algorithm breakdown                |
| GET             | `/api/ranking/team/[id]/h2h`     | Head-to-head record for a team                      |
| GET             | `/api/ranking/team/[id]/history` | Historical ranking across runs                      |

### Feature Roadmap (All Complete)

1. Data Model & Database Schema
2. Ranking Algorithm Engine (Colley + Elo)
3. Data Ingestion Pipeline (XLSX import)
4. Rankings Dashboard (results display + run management)
5. Tournament Weighting & Seeding
6. Committee Override System
7. Export Module (CSV, XLSX, PDF)
8. Run Finalization & Audit
9. Multi-Age-Group Support
