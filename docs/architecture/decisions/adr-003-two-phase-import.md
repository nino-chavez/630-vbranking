# ADR-003: Two-Phase Import with Identity Resolution

## Status

Accepted

## Context

Tournament data originates from XLSX spreadsheets maintained by tournament directors. These spreadsheets contain human-entered team codes (e.g., "MADVRLY17" for a 17U team) and tournament names that may differ from the canonical names stored in the database. Common discrepancies include:

- Variant abbreviations ("VA Beach" vs "Virginia Beach Open")
- Typos in team codes
- New teams not yet registered in the system
- Tournament name formatting differences across spreadsheets

Directly importing spreadsheet data without identity validation would create orphaned records (team codes that don't map to team UUIDs), duplicate entries, and data corruption that silently degrades ranking accuracy.

## Decision

The import pipeline operates in two phases, each backed by a separate API endpoint:

### Phase 1: Parse and Resolve (`POST /api/import/upload`)

1. Accept the XLSX file via multipart form upload (max 10 MB, .xlsx only).
2. Select the appropriate parser via a factory function (`getParser`): `FinishesParser` for tournament finish data or `ColleyParser` for pre-computed Colley rankings.
3. Parse the spreadsheet into typed rows (`ParsedFinishesRow[]` or `ParsedColleyRow[]`).
4. Extract unique team codes and tournament names from the parsed data.
5. Run identity resolution against the database:
   - **Exact matching:** Case-insensitive comparison of team codes and tournament names against existing records.
   - **Fuzzy matching:** For unmatched entities, compute Levenshtein edit distance against all candidates. Normalize to a 0--1 similarity score. Return up to 3 suggestions with scores above 0.3.
6. Detect potential duplicate records by checking for existing `(team_id, tournament_id)` combinations.
7. Return the parse result, auto-resolved identity mappings, unresolved conflicts with fuzzy suggestions, and duplicate warnings.

### Phase 2: Confirm and Write (`POST /api/import/confirm`)

1. Accept the user's conflict resolutions as `IdentityMapping[]`, where each mapping specifies an action: `map` (use existing record), `create` (insert new team/tournament), or `skip` (exclude from import).
2. Create new database records for entities with `action: 'create'`, validating against Zod schemas before insertion.
3. Validate all import rows against the target table's Zod insert schema.
4. Execute the import in one of two modes:
   - **Replace:** Call an atomic PostgreSQL RPC function (`import_replace_tournament_results`) that deletes all existing records for the season+age_group and inserts the new rows in a single transaction.
   - **Merge:** Process rows individually -- INSERT new records, UPDATE changed records, SKIP identical records.
5. Return an `ImportSummaryData` object with counts of rows inserted, updated, skipped, and entities created.

## Alternatives Considered

**Single-pass auto-import with best-guess matching.** Apply fuzzy matching automatically and import the best-match result without user confirmation. Rejected because false positive matches (e.g., mapping "STORM17" to the wrong team named "STORMCHASERS17") would silently corrupt ranking data. The committee prioritizes data accuracy over import speed.

**CLI-based import tool.** A command-line script that reads XLSX files and imports data directly. Rejected because the committee members are not technical users. A browser-based workflow with visual preview, conflict resolution UI, and confirmation is necessary for adoption.

**Manual data entry forms.** Individual forms for entering tournament results one at a time. Rejected because a single season involves hundreds of team-tournament result combinations. Bulk import from existing XLSX spreadsheets is orders of magnitude faster.

**CSV import alongside XLSX.** Support both formats on the input side. Deferred because all source data currently arrives in XLSX format. The parser factory architecture (`getParser`) supports adding new formats by implementing the `FileParserInterface<T>` interface.

## Consequences

**Easier:**

- No silent data corruption. Every entity mapping is either auto-resolved (exact match) or user-resolved (conflict UI) before data reaches the database.
- The `FinishesParser` adaptively detects tournament columns by scanning for `Div/Fin/Tot` triplet patterns in Row 2, making it resilient to varying numbers of tournaments across spreadsheets.
- The replace mode uses atomic PostgreSQL RPC functions, ensuring no partial imports on failure.
- New import formats can be added by implementing `FileParserInterface<T>` and registering in the parser factory.

**More difficult:**

- Two-step workflow increases user interaction time (upload, review, resolve, confirm).
- The merge mode uses row-by-row SELECT + INSERT/UPDATE queries, creating an N+1 query pattern that degrades performance for large imports.
- The fuzzy matching threshold (0.3 similarity score) and suggestion limit (top 3) are hardcoded. Tuning requires code changes.
- Spreadsheet format changes (e.g., new column layouts) require parser updates.

## Evidence

- Phase 1 endpoint: `src/routes/api/import/upload/+server.ts`
- Phase 2 endpoint: `src/routes/api/import/confirm/+server.ts`
- Import service: `src/lib/import/import-service.ts`
- Identity resolver with Levenshtein distance: `src/lib/import/identity-resolver.ts`
- Duplicate detector: `src/lib/import/duplicate-detector.ts`
- Parser factory: `src/lib/import/parsers/index.ts` (`getParser`)
- Finishes parser: `src/lib/import/parsers/finishes-parser.ts`
- Atomic replace RPC: `supabase/migrations/20260223180012_create_import_replace_rpc.sql`
- Import types: `src/lib/import/types.ts` (`ImportFormat`, `ImportMode`, `IdentityMapping`, `ParseResult`)
