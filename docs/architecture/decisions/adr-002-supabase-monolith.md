# ADR-002: SvelteKit Monolith with Supabase Backend

## Status

Accepted

## Context

The Volleyball Ranking Engine serves a single user group: the AAU volleyball ranking committee. The committee is a small group (under 20 people) that accesses the system during defined ranking windows. Data volumes are moderate -- hundreds of teams across four age groups, dozens of tournaments per season, and ranking runs producing thousands of result rows per computation. The system requires:

1. Server-rendered pages for initial load performance.
2. API endpoints for asynchronous operations (ranking computation, file import).
3. A relational database for structured tournament and ranking data with referential integrity.
4. Minimal operational overhead -- the committee does not have a dedicated ops team.

## Decision

The system deploys as a single SvelteKit 2 application with Svelte 5 (runes) for the UI and Supabase (hosted PostgreSQL) for persistence and database management. The application contains:

- **Server-side rendering:** `+page.server.ts` load functions fetch initial data from Supabase.
- **API routes:** `+server.ts` handlers in `src/routes/api/` process ranking computations, imports, overrides, and weight management.
- **Browser client:** A Supabase client using the publishable anon key for any client-side queries.
- **Server client:** A Supabase client using the service-role key for all server-side operations, bypassing RLS.

Database schema management uses Supabase migrations (15 SQL files in `supabase/migrations/`). TypeScript types are generated from the database schema into `src/lib/types/database.types.ts`.

## Alternatives Considered

**Next.js with a separate Express API server.** Provides a mature React ecosystem. Rejected because SvelteKit natively handles both SSR pages and API routes in a single deployment, reducing infrastructure surface. Svelte 5's rune-based reactivity eliminates the need for React's `useState`/`useEffect` patterns, producing more concise component code.

**Supabase Edge Functions for ranking computation.** Supabase Edge Functions run on Deno and deploy alongside the database. Rejected because ranking computation involves LU decomposition (via `ml-matrix`) and iterative Elo processing across hundreds of pairwise records. These operations exceed the default execution time and memory limits of edge function environments.

**Self-hosted PostgreSQL on a VPS.** Provides full database control. Rejected because Supabase eliminates database infrastructure management (backups, monitoring, connection pooling) and provides auto-generated TypeScript types from the schema. The committee does not have database administration expertise.

**Firebase (Firestore).** Provides managed hosting and real-time sync. Rejected because Firestore is a document database. The ranking engine requires relational queries with JOINs across seasons, tournaments, teams, and results. PostgreSQL's relational model and ACID transactions are a better fit for the domain.

## Consequences

**Easier:**

- Single deployment artifact. No service coordination, no API gateway, no separate frontend/backend deployments.
- Supabase provides managed PostgreSQL with automatic backups, a web dashboard for data inspection, and generated TypeScript types.
- SvelteKit's file-system routing maps directly to the application's URL structure (`/ranking`, `/import`, `/api/ranking/run`).
- Database migrations in `supabase/migrations/` provide version-controlled schema evolution.

**More difficult:**

- Vendor coupling to Supabase's JavaScript client library. Switching to a different PostgreSQL host would require replacing `SupabaseClient` calls in 5 service files (`RankingService`, `ImportService`, `IdentityResolver`, `DuplicateDetector`, and `supabase-server.ts`).
- No built-in authentication. Supabase Auth is available but not configured. The system currently relies on network-level access control.
- Scaling is limited to vertical scaling of the SvelteKit server. Horizontal scaling would require session management and stateless API design (which the current codebase supports, as no server-side session state exists).

## Evidence

- SvelteKit configuration: `svelte.config.js`, `vite.config.ts`
- Server Supabase client: `src/lib/supabase-server.ts` (uses `SUPABASE_SERVICE_ROLE_KEY` via `$env/static/private`)
- Browser Supabase client: `src/lib/supabase.ts` (uses `PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` via `import.meta.env`)
- Generated database types: `src/lib/types/database.types.ts`
- Database migrations: `supabase/migrations/` (15 files)
- Package dependencies: `package.json` (`@sveltejs/kit`, `@supabase/supabase-js`, `svelte`, `tailwindcss`)
