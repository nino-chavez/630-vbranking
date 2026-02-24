# Spec Requirements: Data Model & Database Schema

## Initial Description
Define and migrate the core database tables: teams (name, code, region), tournaments (name, weight/tier, date), tournament results (team, tournament, division, finish, field size), and match records (team A, team B, score, tournament). This is the foundation every other feature depends on.

## Requirements Discussion

### First Round Questions

**Q1:** The team code format (`b18nsmvc1bg`) appears to encode structured data -- `b` prefix, `18` age group, club abbreviation, region code. Should we parse and store these components as separate columns or treat the code as an opaque string alongside the separate fields we already have?
**Answer:** Store the raw code and the separate fields we already have (team name, region). Do not parse the code into sub-components.

**Q2:** The "18 Open Finishes" sheet tracks per-tournament results as Division/Finish/Total-Field-Size triplets, but the Colley algorithms need head-to-head match data. Should the match records table store individual match outcomes (Team A beat Team B at Tournament X), or just aggregated H2H summaries?
**Answer:** User asked for the recommendation that makes most sense, with architecture for growth/enhancement later if more data becomes available. **Recommendation accepted: Individual match records** as the base unit. Colley Matrix and Elo algorithms operate on individual match outcomes. H2H summaries can be aggregated from granular data but not the reverse. Nullable columns for set scores, point differentials, and match metadata allow future enhancement when richer data is available.

**Q3:** Should the schema support multiple seasons from the start, even though we're only loading one season initially?
**Answer:** Yes, multiple seasons. Make it configurable so ranking can be scoped to a single season or across multiple seasons.

**Q4:** The roadmap lists multi-age-group support as Feature 8, but the schema is Feature 1. Should age groups be included now as an enum or more flexible?
**Answer:** Enum since age groups are finite (15U, 16U, 17U, 18U).

**Q5:** Should tournament weights be configurable values in the database or hardcoded in application logic?
**Answer:** Yes, configurable in the database. The committee should be able to adjust weights per season without code changes.

**Q6:** Should the database store computed ranking results as snapshots or always recompute on demand?
**Answer:** Snapshots. Store computed results so rankings at a point in time are preserved. This means a `ranking_runs` table (or similar) that captures algorithm outputs per run.

**Q7:** Should the schema include auth/user tables for committee members at this stage?
**Answer:** Skip auth for now. Focus purely on the data model for teams, tournaments, results, and matches.

**Q8:** Is there anything that should be explicitly excluded from this schema spec?
**Answer:** No exclusions. Everything described in the roadmap feature description is in scope.

### Existing Code to Reference

No similar existing features identified for reference. This is a greenfield project. However, the user's volleyball-coaches-assessment project at `/Users/nino/Workspace/dev/wip/volleyball-coaches-assessment/` uses the same tech stack (Supabase/PostgreSQL with migrations in `supabase/migrations/`) and can serve as a migration pattern reference.

### Follow-up Questions

No follow-up questions needed. All answers were clear and complete.

## Visual Assets

No visual assets provided.

## Requirements Summary

### Functional Requirements
- **Teams table**: Store team name, team code (raw/opaque), region, age group (enum: 15U/16U/17U/18U)
- **Tournaments table**: Store tournament name, date, weight/tier (configurable), season association
- **Tournament results table**: Store per-team tournament outcomes -- team, tournament, division entered, finish position, total field size
- **Match records table**: Store individual match outcomes -- team A, team B, winner, tournament. Include nullable columns for future enhancement: set scores, point differentials, match metadata
- **Seasons table**: Support multiple seasons with configurable ranking scope (single season or cross-season)
- **Tournament weights table/config**: Configurable tournament importance weights per season, following AAU priority ordering (Chi-Town Challenge, SoCal Winter Formal, Boys Winter Invitational, Brew City Battle, The Open Championship - Utah, Snowball Slam, Rock n Rumble, AAU Nationals)
- **Ranking snapshots table**: Store computed algorithm outputs (Algo1-5 ratings/ranks, AggRating, AggRank) as point-in-time snapshots tied to a ranking run

### Reusability Opportunities
- Migration patterns from volleyball-coaches-assessment project (Supabase migrations)
- Same Supabase JS client patterns for database queries

### Scope Boundaries
**In Scope:**
- All core data tables: teams, tournaments, tournament_results, matches, seasons, tournament_weights, ranking_runs, ranking_results
- Supabase PostgreSQL migrations
- Age group enum support built into schema from day one
- Multi-season support with configurable ranking scope
- Configurable tournament weights in database
- Ranking result snapshots
- Nullable future-enhancement columns on match records

**Out of Scope:**
- Authentication/authorization (skipped per user direction)
- Manual override/adjustment tables (Feature 6 in roadmap)
- Export metadata tables
- UI-specific state storage
- Row Level Security policies (no auth = no RLS needed yet)

### Technical Considerations
- Database: Supabase (PostgreSQL) with migrations
- ORM/Client: @supabase/supabase-js
- Schema validation: Zod for TypeScript type generation
- Age groups as PostgreSQL enum type
- Tournament weights as database-configurable values (not hardcoded)
- Individual match records as base granularity, with nullable columns for growth
- Ranking snapshots tied to timestamped runs for historical comparison
