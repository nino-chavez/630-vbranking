# Architecture Decision Records

> Last updated: 2026-02-24

This directory contains the Architecture Decision Records (ADRs) for the Volleyball Ranking Engine. Each ADR documents a significant architectural choice, the context that drove it, alternatives considered, and consequences.

## ADR Index

| ADR                                               | Title                                                     | Status   | Summary                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------- | --------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [ADR-001](adr-001-multi-algorithm-ranking.md)     | Five-Algorithm Ensemble Ranking                           | Accepted | The system runs five independent rating algorithms (Colley Matrix + four Elo variants with starting ratings 2200, 2400, 2500, 2700) for each ranking computation. Results are normalized to a 0-100 scale via min-max normalization, then averaged into an aggregate rating (AggRating). This provides the committee with five perspectives on team strength and makes rankings defensible against single-algorithm bias challenges. |
| [ADR-002](adr-002-supabase-monolith.md)           | SvelteKit Monolith with Supabase Backend                  | Accepted | The application deploys as a single SvelteKit 2 artifact with Supabase (hosted PostgreSQL) as the sole infrastructure dependency. This eliminates microservice coordination, database administration overhead, and multi-deployment complexity for a system serving a small committee of under 20 members.                                                                                                                           |
| [ADR-003](adr-003-two-phase-import.md)            | Two-Phase Import with Identity Resolution                 | Accepted | The import pipeline separates parsing (Phase 1: upload, parse, resolve identities) from writing (Phase 2: validate, confirm, execute). Identity resolution uses case-insensitive exact matching followed by Levenshtein fuzzy matching. The committee resolves all unmatched entities before data reaches the database, preventing silent data corruption from mismatched team codes or tournament names.                            |
| [ADR-004](adr-004-committee-override-workflow.md) | Committee Override Workflow with Draft/Finalize Lifecycle | Accepted | Ranking runs follow a two-state lifecycle: `draft` (overrides allowed) and `finalized` (read-only, irreversible). Each override requires a justification (min 10 chars) and committee member attribution. The `computeFinalRanks` function merges algorithmic ranks with overrides at read time, ensuring consistent behavior across the dashboard, API, and export module.                                                          |

## Template

New ADRs follow the template at [template.md](template.md). The template uses the structure: Status, Context, Decision, Alternatives Considered, Consequences, Evidence.

## Conventions

- ADRs are numbered sequentially (`adr-NNN-short-title.md`).
- Status values: `Proposed`, `Accepted`, `Deprecated`, `Superseded`.
- The Evidence section links to specific source files and database migrations that implement the decision.
- All four current ADRs have status `Accepted`.
