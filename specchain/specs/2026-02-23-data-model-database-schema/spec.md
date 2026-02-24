# Specification: Data Model & Database Schema

## Goal

Define and migrate the core PostgreSQL database schema that underpins the entire Volleyball Ranking Engine -- teams, tournaments, results, matches, seasons, tournament weights, and ranking snapshots -- providing the foundational data layer every downstream feature (ingestion, algorithms, dashboard, export) depends on.

## User Stories

- As a **seeding committee member**, I want tournament results and match records stored in a structured database so that ranking algorithms can compute ratings automatically instead of relying on fragile spreadsheet formulas.
- As a **committee lead**, I want configurable tournament weights stored in the database so that the committee can adjust importance tiers per season without code changes.
- As a **committee member**, I want ranking results preserved as point-in-time snapshots so that I can compare how rankings evolved across the season.
- As a **committee member**, I want multi-season support from the start so that historical data is preserved and ranking scope can be configured per season or across seasons.

## Core Requirements

### Functional Requirements

**Teams**

- Store: `name` (text), `code` (text, raw/opaque -- not parsed), `region` (text), `age_group` (PostgreSQL enum: `15U`, `16U`, `17U`, `18U`).
- `code` is a unique identifier string from source data (e.g., `b18nsmvc1bg`). Do not decompose it.
- Unique constraint on `code` + `age_group` to prevent duplicates.

**Seasons**

- Store: `name` (text), `start_date`, `end_date`, `is_active` (boolean).
- Support multiple seasons concurrently in the database.
- Include a `ranking_scope` field (enum or text: `single_season`, `cross_season`) to configure whether ranking runs pull data from one season or aggregate across seasons.

**Tournaments**

- Store: `name` (text), `date` (date), `season_id` (FK to seasons), `location` (text, nullable).
- Each tournament belongs to exactly one season.

**Tournament Weights**

- Store: `tournament_id` (FK), `season_id` (FK), `weight` (numeric), `tier` (integer or text for priority ordering).
- Weights are configurable per tournament per season -- the committee adjusts these without code changes.
- Default weights should follow AAU priority ordering: Chi-Town Challenge, SoCal Winter Formal, Boys Winter Invitational, Brew City Battle, The Open Championship - Utah, Snowball Slam, Rock n Rumble, AAU Nationals.

**Tournament Results**

- Store: `team_id` (FK), `tournament_id` (FK), `division` (text), `finish_position` (integer), `field_size` (integer).
- One row per team per tournament entry. A team can appear in one division per tournament.

**Match Records**

- Store: `team_a_id` (FK), `team_b_id` (FK), `winner_id` (FK, nullable -- to handle draws if needed), `tournament_id` (FK).
- Nullable future-enhancement columns: `set_scores` (JSONB, nullable), `point_differential` (integer, nullable), `metadata` (JSONB, nullable).
- Individual match outcomes are the base granularity. Head-to-head summaries are derived via queries, not stored.

**Ranking Runs**

- Store: `id`, `season_id` (FK), `ran_at` (timestamp), `description` (text, nullable), `parameters` (JSONB, nullable -- to capture algorithm config at time of run).
- Each run represents a single point-in-time computation of all algorithms.

**Ranking Results (Snapshots)**

- Store: `ranking_run_id` (FK), `team_id` (FK), per-algorithm outputs:
  - `algo1_rating` (numeric), `algo1_rank` (integer) -- Colley Matrix
  - `algo2_rating` (numeric), `algo2_rank` (integer) -- Elo-2200
  - `algo3_rating` (numeric), `algo3_rank` (integer) -- Elo-2400
  - `algo4_rating` (numeric), `algo4_rank` (integer) -- Elo-2500
  - `algo5_rating` (numeric), `algo5_rank` (integer) -- Elo-2700
  - `agg_rating` (numeric) -- unified 0-100 scale
  - `agg_rank` (integer)
- Composite unique constraint on `ranking_run_id` + `team_id`.

**General Schema Conventions**

- All tables include `id` (UUID, primary key, default `gen_random_uuid()`), `created_at` (timestamptz, default `now()`), `updated_at` (timestamptz, default `now()`).
- Use a PostgreSQL trigger or Supabase helper to auto-update `updated_at` on row modification.
- Foreign keys with appropriate `ON DELETE` behavior (CASCADE for child records like tournament_results; RESTRICT for referenced entities like teams).

### Non-Functional Requirements

- **Migrations:** All schema changes delivered as sequential Supabase migration files in `supabase/migrations/`.
- **Type Safety:** Zod schemas generated or hand-written to mirror every database table, providing TypeScript types for the application layer.
- **Performance:** Add indexes on common query patterns -- `team_id` on results/matches/rankings, `tournament_id` on results/matches/weights, `season_id` on tournaments/ranking_runs, `ranking_run_id` on ranking_results.
- **No Auth/RLS:** No authentication tables, no Row Level Security policies. These will be added in a future feature.
- **Idempotent Migrations:** Each migration file should be safe to inspect and reason about independently.

## Visual Design

N/A -- this is a database-only specification with no UI component.

## Reusable Components

### Existing Code to Leverage

This is a **greenfield project** -- there is no existing codebase to reuse. However, the Supabase migration pattern (sequential SQL files in `supabase/migrations/`) and `@supabase/supabase-js` client usage follow standard conventions from the broader Supabase ecosystem.

### New Components Required

- **Migration files:** One or more SQL migration files in `supabase/migrations/` defining all tables, enums, indexes, and triggers.
- **Zod schemas:** TypeScript files (e.g., `src/lib/schemas/`) exporting Zod schemas for each table -- `teamSchema`, `seasonSchema`, `tournamentSchema`, `tournamentWeightSchema`, `tournamentResultSchema`, `matchSchema`, `rankingRunSchema`, `rankingResultSchema`.
- **Database types:** TypeScript type exports derived from Zod schemas (using `z.infer<>`) for use across the application.
- **Supabase client setup:** A configured Supabase client module (`src/lib/supabase.ts` or similar) using `@supabase/supabase-js`.

## Technical Approach

### Database: Models and Relationships

```
seasons 1──* tournaments
seasons 1──* tournament_weights (via season_id)
seasons 1──* ranking_runs

tournaments 1──* tournament_results
tournaments 1──* matches
tournaments 1──* tournament_weights (via tournament_id)

teams 1──* tournament_results
teams 1──* matches (as team_a or team_b)
teams 1──* ranking_results

ranking_runs 1──* ranking_results
```

**Entity summary (8 tables):**

1. `seasons` -- temporal grouping and ranking scope config
2. `teams` -- team identity with age group enum
3. `tournaments` -- events within a season
4. `tournament_weights` -- per-tournament-per-season importance config
5. `tournament_results` -- team finish outcomes per tournament
6. `matches` -- individual match records (granular, extensible)
7. `ranking_runs` -- point-in-time algorithm execution metadata
8. `ranking_results` -- per-team algorithm outputs tied to a run

**PostgreSQL enum:** `age_group_enum` with values `15U`, `16U`, `17U`, `18U`.

### API: Endpoints and Data Flow

No API endpoints are defined in this spec. The schema is consumed by downstream features (data ingestion, ranking engine, dashboard) via the `@supabase/supabase-js` client. The Zod schemas provide the contract between the database and the TypeScript application layer.

### Frontend

N/A -- no frontend work in this feature.

### Testing

- **Migration tests:** Verify migrations apply cleanly against a fresh Supabase local instance (`supabase db reset`).
- **Zod schema tests:** Validate that Zod schemas accept valid data and reject invalid data (wrong enum values, missing required fields, type mismatches).
- **Referential integrity tests:** Verify foreign key constraints work correctly -- inserting a tournament_result with a non-existent team_id should fail; deleting a season should cascade to its tournaments.
- **Index verification:** Confirm expected indexes exist after migration via `pg_indexes` queries.

## Out of Scope

- **Authentication / Authorization:** No user tables, no login, no RLS policies.
- **Manual Override / Adjustment tables:** Deferred to Feature 6 in the roadmap.
- **Export metadata tables:** Not needed at this stage.
- **UI state storage:** No tables for UI preferences, filters, or view state.
- **Seed data:** This spec covers schema only. Data ingestion (populating tables from CSV/Excel) is a separate feature.
- **API route implementation:** Downstream features will build endpoints; this spec delivers the schema and types.

## Success Criteria

- All 8 tables and the `age_group_enum` are created via Supabase migrations that apply without errors.
- Zod schemas exist for every table and produce correct TypeScript types via `z.infer<>`.
- Foreign key relationships enforce referential integrity (verified by tests).
- Tournament weights are fully database-configurable -- no hardcoded weight values in application code.
- Ranking results store per-algorithm ratings/ranks and aggregate scores, tied to immutable run snapshots.
- `supabase db reset` followed by migration applies cleanly from scratch.
- All nullable future-enhancement columns on matches (`set_scores`, `point_differential`, `metadata`) are present and accept null.
