# VB Ranking - Development Guidelines

Team ranking engine for AAU volleyball (15U-18U) using five-algorithm ensemble: Colley Matrix + four Elo variants with different starting ratings.

## Non-Obvious Rules

- **Ensemble ranking:** AggRating = arithmetic mean of 5 normalized scores (0-100). AggRank sorted descending with alphabetical tie-breaking
- **Colley Matrix:** Solves Cr=b via LU decomposition (`ml-matrix`). Time-independent -- order of games doesn't matter
- **Elo variants:** Four starting values (2200, 2400, 2500, 2700) provide diversity in the ensemble
- **Tournament weights:** Multiplier (0.0-5.0) applied across all algorithms. Stored per-season in `tournament_weights`
- **Two-phase import:** Upload XLSX -> preview with identity resolution -> confirm. Never auto-commits
- **Override workflow:** Committee overrides require reason, preserve original rank in audit trail
- **Finalization:** Locks a ranking run permanently -- no further modifications
- **Auth:** Supabase Auth with `@supabase/ssr`, two-layer: `hooks.server.ts` middleware + per-endpoint `requireAuth()` guard
- **Env vars:** Use `$env/static/public` (not `import.meta.env`) for Vercel compatibility
- **Public Supabase key:** Named `PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` (not the usual `ANON_KEY`)

## Architectural Decisions

- ADR-001: Five-algorithm ensemble for defensible, transparent rankings
- ADR-002: Supabase monolith -- single managed PostgreSQL, no microservices
- ADR-003: Two-phase import with identity resolution for safe data ingestion
- ADR-004: Committee override workflow with audit trail
- ADR-005: Two-layer auth (hooks middleware + per-endpoint guard)

## Commands

```bash
npm run dev          # Dev server
npm run build        # Production build
npm run check        # svelte-check + tsc
npx vitest run       # Tests
npm run lint         # ESLint
npm run format:check # Prettier check
```

## See Also

- `AGENTS.md` -- entry points, key directories, doc links
- `docs/` -- 7-layer documentation (architecture, developer, ops, testing, functional, strategic, user)
- `specchain/` -- specs and task tracking
