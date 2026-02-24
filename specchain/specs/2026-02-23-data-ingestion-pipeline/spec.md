# Specification: Data Ingestion Pipeline

## Goal

Build a file upload and parsing system that accepts Excel (.xlsx) files in two known formats (Finishes and Colley), auto-detects column structure, validates parsed data against existing database schemas, provides a preview-and-resolve UI for identity conflicts, and persists tournament results and ranking data to Supabase -- with an architecturally extensible path toward CSV match ingestion in a future feature.

## User Stories

- As a ranking committee member, I want to upload the season's "Finishes" spreadsheet so that tournament results are stored in the database without manual data entry.
- As a ranking committee member, I want to upload the "Colley" spreadsheet so that pre-computed algorithm ratings are imported into ranking results.
- As a ranking committee member, I want to preview parsed data and see highlighted errors before committing so that I can catch problems before they corrupt the database.
- As a ranking committee member, I want to map unrecognized team codes and tournament names to existing records (or create new ones) so that the data links correctly to the right entities.
- As a ranking committee member, I want to choose between replacing all data or merging updates so that I have control over how re-uploads affect existing records.
- As a ranking committee member, I want to select the season and age group explicitly before uploading so that data is always categorized correctly.
- As a system integrator, I want a programmatic API endpoint for file upload so that future automation can push data without the web UI.

## Core Requirements

### Functional Requirements

#### F1: File Upload
- Accept `.xlsx` files via both a web UI and a programmatic API endpoint.
- Web UI provides drag-and-drop and file-picker upload on a dedicated `/import` page.
- API endpoint at `POST /api/import/upload` accepts multipart form data with fields: `file` (binary), `season_id` (UUID), `age_group` (enum: 15U/16U/17U/18U), `format` (enum: `finishes` | `colley`).
- Maximum file size: 10 MB.
- Reject files that are not `.xlsx` with a clear error message.

#### F2: Context Selection
- Before upload, the user must select a **season** (from existing `seasons` table) and an **age group** (from the `AgeGroup` enum: 15U, 16U, 17U, 18U).
- The system must NOT infer age group from file content. Both values are required and explicitly chosen.
- Season dropdown is populated from the database. Age group is a static enum selector.

#### F3: Adaptive Finishes Parser
- Parse the "18 Open Finishes" `.xlsx` format with adaptive column detection:
  - **Row 1**: Tournament names in merged cells spanning 3 columns each. Extract the unmerged text as the tournament name.
  - **Row 2**: Sub-headers. Scan for `Div`/`Fin`/`Tot` triplet patterns to identify tournament column boundaries. Columns without a `Div`/`Fin`/`Tot` triplet in Row 2 are skipped (including empty padding columns and tournaments with headers but no sub-headers/data).
  - **Rows 3+**: Team data rows.
- **Team-level columns** (Cols 1-10 in the reference file):
  - Extract: Team Name (Col 1), Code (Col 2).
  - Ignore: Comp, Rank (Reg), Rec vs Field (W/L/Win%), Overall Rec (W/L/Win%) -- these are computed summary fields.
- **Tournament triplet columns** (Cols 11+ in the reference file):
  - For each detected Div/Fin/Tot triplet, extract: `division` (string from Div cell), `finish_position` (integer from Fin cell), `field_size` (integer from Tot cell).
  - Skip triplets where Fin and Tot cells are both empty (team did not participate in that tournament).
- **Trailing summary columns** (last 5 columns): Ignore entirely. These are computed aggregates (# of Qual, Avg Finish, Last Result, Wins vs Field, Losses vs Field) that will be recomputed from raw data.
- Handle irregular structures gracefully:
  - Empty padding columns (e.g., 3 blank columns after some tournament triplets).
  - Tournaments with a Row 1 header but no Div/Fin/Tot in Row 2 and no data -- detect and skip silently.
  - Merged cells in Row 1 -- read the value from the leftmost cell of the merge range.

#### F4: Colley Format Parser
- Parse the "18Open Colley" `.xlsx` format:
  - Columns: Team, teamcode, Wins, Losses, Algo1 Rating, Algo1 Rank, Algo2 Rating, Algo2 Rank, Algo3 Rating, Algo3 Rank, Algo4 Rating, Algo4 Rank, Algo5 Rating, Algo5 Rank, AggRating, AggRank.
  - Map `teamcode` to `teams.code` for identity resolution.
  - Map rating/rank columns to `ranking_results` table fields (`algo1_rating`, `algo1_rank`, ..., `agg_rating`, `agg_rank`).
  - Requires a `ranking_run` record to be created (or selected) as the parent for all imported `ranking_results`.

#### F5: CSV Match Parser (Architecture Only)
- Define a `MatchFileParser` interface with the same shape as the Finishes and Colley parsers (accepts a file buffer, returns a structured parse result with rows, errors, and metadata).
- Expected CSV columns: Team A, Team B, Winner, Tournament.
- Do NOT implement the parser body or any UI for CSV upload in this feature. Only define the interface and type contracts so a future feature can implement it without refactoring.

#### F6: Identity Resolution
- After parsing, compare extracted team codes and tournament names against existing database records for the selected age group and season.
- **Unmatched teams**: Show in a mapping UI where the user can:
  - **Create new**: Auto-populate a team creation form with parsed name, code, and the selected age group. User supplies region.
  - **Map to existing**: Dropdown of existing teams for the age group, with fuzzy-match suggestions (Levenshtein distance or similar on team name/code).
  - **Skip**: Exclude this team's rows from the import entirely.
- **Unmatched tournaments**: Same three options (create new with parsed name and selected season_id, map to existing, or skip).
- Import MUST NOT proceed until every unmatched entity is resolved (created, mapped, or skipped).
- Display a count badge showing how many unmatched teams and tournaments remain.

#### F7: Data Validation and Error Preview
- After identity resolution, validate every parsed row against the existing Zod schemas (`tournamentResultInsertSchema` for Finishes data, `rankingResultInsertSchema` for Colley data).
- Additional business-rule validation:
  - `finish_position` must be <= `field_size` (enforced by existing Zod `.refine()`).
  - Required fields must be non-empty: `division`, `finish_position`, `field_size`.
  - Duplicate detection: flag rows where the same `team_id + tournament_id` combination already exists in the database (for Finishes) or `team_id + ranking_run_id` already exists (for Colley).
- Display all parsed data in a scrollable preview table.
- Rows with errors are highlighted (red background or red left-border indicator) with a tooltip or inline message describing the error.
- Error summary bar at the top showing counts by error type.
- User can:
  - **Fix inline**: Edit cell values directly in the preview table to correct errors (e.g., fix a finish_position that exceeds field_size).
  - **Skip row**: Exclude an individual row from the import.
  - **Confirm import**: Only enabled when zero unresolved errors remain (skipped rows do not count as errors).

#### F8: Import Mode Selection
- Before confirming the import, the user selects one of two modes:
  - **Replace all**: Delete all existing `tournament_results` (for Finishes) or `ranking_results` (for Colley) for the selected season + age group combination, then insert all validated rows. This operation must be atomic -- if any insert fails, roll back the deletes.
  - **Merge/update**: Insert rows that do not exist yet (no matching `team_id + tournament_id` for Finishes, no matching `team_id + ranking_run_id` for Colley). Update rows where the composite key matches but values differ. Skip rows that are identical to existing records. Never auto-delete existing records in merge mode.
- Default selection: Merge/update (safer default).

#### F9: Database Persistence
- **Finishes import** writes to `tournament_results` table with fields: `team_id`, `tournament_id`, `division`, `finish_position`, `field_size`.
- **Colley import** writes to `ranking_results` table with fields: `ranking_run_id`, `team_id`, `algo1_rating`, `algo1_rank`, ..., `agg_rating`, `agg_rank`. A new `ranking_run` record is created for each Colley import with `season_id` and a description noting it was imported from file.
- New teams created during identity resolution are written to `teams` table.
- New tournaments created during identity resolution are written to `tournaments` table with the selected `season_id`.
- All database writes for a single import operation should be performed in a single transaction where possible. If Supabase JS client does not support multi-table transactions, use an RPC function or sequential writes with manual rollback on failure.

#### F10: Import Summary
- After a successful import, display a summary showing:
  - Number of rows inserted, updated, and skipped.
  - Number of new teams and tournaments created.
  - Import mode used (replace or merge).
  - Timestamp and season/age group context.

### Non-Functional Requirements

- **NF1: Performance** -- Parsing and validation of a 76-row x 189-column spreadsheet must complete in under 3 seconds on the client side.
- **NF2: File size limit** -- Reject files larger than 10 MB with a user-friendly error before attempting to parse.
- **NF3: Error resilience** -- A malformed file (wrong format, corrupted Excel) must not crash the application. Display a clear error message and allow the user to try again.
- **NF4: Type safety** -- All parsed data flows through Zod validation before reaching the database. No raw/unvalidated data is written.
- **NF5: Accessibility** -- Upload area must be keyboard-navigable. Error highlights must not rely solely on color (include icons or text labels).
- **NF6: Responsiveness** -- The import page must be usable on screens 1024px and wider. Mobile is not required for this admin tool.

## Visual Design

### Import Page Layout (`/import`)

```
+------------------------------------------------------------------+
| Import Data                                                       |
|                                                                   |
| [Season Dropdown v]  [Age Group Dropdown v]  [Format Dropdown v]  |
|                                                                   |
| +--------------------------------------------------------------+ |
| |                                                                | |
| |   Drag & drop .xlsx file here                                 | |
| |   or [Browse Files]                                           | |
| |                                                                | |
| +--------------------------------------------------------------+ |
|                                                                   |
| --- After file is parsed: ---                                     |
|                                                                   |
| Identity Resolution                                    [3 unmatched]|
| +--------------------------------------------------------------+ |
| | Team "ACEVB" not found      [Create New] [Map To v] [Skip]   | |
| | Tournament "Winter Formal"  [Create New] [Map To v] [Skip]   | |
| +--------------------------------------------------------------+ |
|                                                                   |
| Data Preview                                   [2 errors, 74 rows]|
| +--------------------------------------------------------------+ |
| | Team       | Tournament      | Div | Fin | Tot | Status      | |
| |------------|-----------------|-----|-----|-----|-------------| |
| | Team A     | AZ Region #1   | 18O | 3   | 24  | OK          | |
| | Team B     | AZ Region #1   | 18O | 25  | 24  | ERROR: ...  | |
| | ...        | ...             | ... | ... | ... | ...         | |
| +--------------------------------------------------------------+ |
|                                                                   |
| Import Mode: (o) Merge/Update  ( ) Replace All                   |
|                                                                   |
| [Cancel]                                    [Confirm Import]      |
+------------------------------------------------------------------+
```

### States

1. **Initial**: Season/age group/format selectors visible. Upload area active. No preview.
2. **Parsing**: Loading spinner over the upload area. Selectors disabled.
3. **Identity Resolution**: Unmatched entities panel appears. Preview table appears below. Confirm button disabled until all entities resolved and zero errors.
4. **Ready to Import**: All identities resolved. Zero errors (or all error rows skipped). Import mode selector visible. Confirm button enabled.
5. **Importing**: Progress indicator. All inputs disabled.
6. **Complete**: Summary panel replaces preview. Option to import another file.
7. **Error**: If file is malformed or upload fails, show error banner with retry option.

## Reusable Components

### Existing Code to Leverage

| Component | Location | Usage |
|---|---|---|
| `tournamentResultInsertSchema` | `$lib/schemas/tournament-result.ts` | Validate each parsed Finishes row before DB insert |
| `rankingResultInsertSchema` | `$lib/schemas/ranking-result.ts` | Validate each parsed Colley row before DB insert |
| `teamInsertSchema` | `$lib/schemas/team.ts` | Validate new team records created during identity resolution |
| `tournamentInsertSchema` | `$lib/schemas/tournament.ts` | Validate new tournament records created during identity resolution |
| `AgeGroup` enum | `$lib/schemas/enums.ts` | Populate age group selector, validate age group parameter |
| `supabase` client | `$lib/supabase.ts` | All database reads and writes |
| `Database` types | `$lib/types/database.types.ts` | Type-safe Supabase queries for all 8 tables |

### New Components Required

| Component | Location | Purpose |
|---|---|---|
| **FinishesParser** | `$lib/import/parsers/finishes-parser.ts` | Adaptive Excel parser for the Finishes format. Scans Row 2 for Div/Fin/Tot patterns, extracts tournament names from merged Row 1 cells, returns structured parse results. |
| **ColleyParser** | `$lib/import/parsers/colley-parser.ts` | Excel parser for the Colley format. Maps fixed columns to ranking result fields. |
| **MatchFileParser** (interface only) | `$lib/import/parsers/match-parser.ts` | TypeScript interface defining the contract for future CSV match ingestion. No implementation. |
| **ParseResult** types | `$lib/import/types.ts` | Shared types: `ParsedRow`, `ParseError`, `ParseResult`, `IdentityConflict`, `ImportSummary`, `ImportMode` enum. |
| **IdentityResolver** | `$lib/import/identity-resolver.ts` | Compares parsed team codes and tournament names against DB records. Returns unmatched entities with fuzzy-match suggestions. |
| **ImportService** | `$lib/import/import-service.ts` | Orchestrates the full import flow: validate, resolve identities, apply import mode (replace/merge), write to DB, return summary. |
| **FileDropZone** component | `$lib/components/FileDropZone.svelte` | Reusable drag-and-drop + file picker UI component. Emits file on drop/select. Validates file type and size. |
| **IdentityResolutionPanel** component | `$lib/components/IdentityResolutionPanel.svelte` | Displays unmatched teams/tournaments with Create/Map/Skip actions. |
| **DataPreviewTable** component | `$lib/components/DataPreviewTable.svelte` | Scrollable table showing parsed rows with error highlighting, inline editing, and row skip toggles. |
| **ImportSummary** component | `$lib/components/ImportSummary.svelte` | Post-import summary display (inserted/updated/skipped counts). |
| **Import page** | `src/routes/import/+page.svelte` | Main import page composing all UI components with the multi-step flow. |
| **Import page server** | `src/routes/import/+page.server.ts` | Server-side load function to fetch seasons for the dropdown. |
| **Upload API endpoint** | `src/routes/api/import/upload/+server.ts` | `POST` handler accepting multipart file upload with season_id, age_group, format parameters. Returns parse result JSON. |
| **Confirm API endpoint** | `src/routes/api/import/confirm/+server.ts` | `POST` handler accepting validated/resolved data and import mode. Executes DB writes. Returns import summary. |

## Technical Approach

### Database

**Tables read during import:**
- `seasons` -- populate season selector dropdown
- `teams` -- identity resolution lookups (filter by `age_group`)
- `tournaments` -- identity resolution lookups (filter by `season_id`)
- `tournament_results` -- duplicate detection (match on `team_id + tournament_id`)
- `ranking_results` -- duplicate detection for Colley imports

**Tables written during import:**
- `teams` -- new team records from identity resolution
- `tournaments` -- new tournament records from identity resolution
- `tournament_results` -- Finishes import destination
- `ranking_runs` -- created for each Colley import
- `ranking_results` -- Colley import destination

**Replace mode transaction (Finishes):**
1. Delete all `tournament_results` where `tournament_id` references a tournament with the selected `season_id` AND `team_id` references a team with the selected `age_group`.
2. Insert all validated rows.
3. If any insert fails, the entire operation rolls back (use Supabase RPC or edge function for atomicity).

**Merge mode logic (Finishes):**
1. For each parsed row, query `tournament_results` for existing record with matching `team_id + tournament_id`.
2. If no match: INSERT.
3. If match and values differ: UPDATE.
4. If match and values identical: SKIP.

### API

**`POST /api/import/upload`**
- Content-Type: `multipart/form-data`
- Fields: `file` (File), `season_id` (string UUID), `age_group` (string enum), `format` (string: `finishes` | `colley`)
- Response: `{ success: boolean, data: ParseResult }` where `ParseResult` includes parsed rows, detected errors, and identity conflicts.
- Errors: 400 (invalid params, wrong file type, file too large), 500 (parse failure).

**`POST /api/import/confirm`**
- Content-Type: `application/json`
- Body: `{ rows: ValidatedRow[], identityMappings: IdentityMapping[], importMode: 'replace' | 'merge', season_id: string, age_group: string, format: string }`
- Response: `{ success: boolean, summary: ImportSummary }`
- Errors: 400 (validation failures), 409 (conflict during write), 500 (database error).

**Data flow:**
1. User selects season + age group + format, uploads file.
2. Client sends file to `/api/import/upload`.
3. Server parses file, runs validation, identifies unmatched entities, returns `ParseResult`.
4. Client displays preview with errors and identity conflicts.
5. User resolves all conflicts and errors in the UI.
6. User selects import mode and confirms.
7. Client sends resolved data to `/api/import/confirm`.
8. Server writes to database, returns `ImportSummary`.
9. Client displays summary.

### Frontend

**Page route:** `/import`

**Component hierarchy:**
```
+page.svelte (import page)
  ContextSelectors (season, age group, format dropdowns)
  FileDropZone (drag-and-drop upload)
  IdentityResolutionPanel (unmatched teams/tournaments)
  DataPreviewTable (parsed data with error highlights)
  ImportModeSelector (replace vs merge radio buttons)
  ImportSummary (post-import results)
```

**State management:** Use Svelte 5 runes (`$state`, `$derived`) to manage the multi-step import flow state. Key state:
- `step`: `'select' | 'parsing' | 'preview' | 'importing' | 'complete' | 'error'`
- `parseResult`: The structured output from the upload endpoint.
- `identityMappings`: User's resolution choices for each unmatched entity.
- `editedRows`: Any inline cell edits the user has made.
- `skippedRows`: Set of row indices the user has chosen to skip.
- `importMode`: `'merge' | 'replace'`

**Parsing location:** Excel parsing happens server-side (in the API endpoint) to avoid shipping the `xlsx` library to the browser. The client sends the raw file; the server returns structured JSON.

### Testing

**Unit tests (Vitest):**
- `finishes-parser.test.ts` -- Test adaptive column detection with mock spreadsheet data: standard layout, padding columns, missing sub-headers, merged cells, empty rows. Verify correct extraction of tournament names, Div/Fin/Tot values, and team codes.
- `colley-parser.test.ts` -- Test Colley format parsing with known input/output pairs.
- `identity-resolver.test.ts` -- Test fuzzy matching accuracy. Test behavior with zero unmatched, all unmatched, and partial matches.
- `import-service.test.ts` -- Test replace mode (verify deletes + inserts). Test merge mode (verify insert/update/skip logic). Test rollback on failure.
- `validation.test.ts` -- Test that parsed rows are correctly validated against Zod schemas. Test business rules (finish_position > field_size, missing fields, duplicates).

**Integration tests (Vitest):**
- Upload endpoint: Send a real `.xlsx` fixture file, verify the response structure matches `ParseResult`.
- Confirm endpoint: Send validated data, verify database state after insert.

**E2E tests (Playwright):**
- Full upload flow: Select season/age group, upload file, resolve identities, confirm import, verify summary.
- Error handling: Upload a malformed file, verify error message appears.
- Replace mode: Upload, confirm with replace, verify old data is gone and new data is present.

**Test fixtures:**
- Create minimal `.xlsx` fixture files (5 teams, 3 tournaments) that exercise the key parsing scenarios: standard triplets, padding columns, missing sub-headers, empty cells.
- Store in `src/lib/import/__fixtures__/`.

## Out of Scope

- **CSV match data ingestion implementation** -- Only the `MatchFileParser` interface is defined. Actual CSV parsing, match-level UI, and `matches` table writes are deferred to a future feature.
- **Match record creation** -- No match data source exists in the current spreadsheets.
- **Summary column import** -- All aggregate/summary columns from the spreadsheet (Rec vs Field, Overall Rec, # of Qual, Avg Finish, Last Result, Wins vs Field, Losses vs Field) are ignored. Aggregates will be recomputed from raw tournament result data by a future ranking computation feature.
- **Authentication and authorization** -- No auth middleware on the upload or confirm endpoints. Deferred until an auth feature is implemented.
- **Automated/scheduled imports** -- No file watching, cron jobs, or webhook-triggered imports.
- **Multi-sheet parsing** -- Each `.xlsx` file is expected to contain a single relevant sheet. If multiple sheets exist, only the first sheet is parsed.
- **Age group inference from file content** -- Explicitly rejected. The user must always select the age group manually.
- **Tournament date extraction** -- The Finishes spreadsheet does not contain tournament dates. New tournaments created during identity resolution will have their `date` field set by the user in the creation form (required by `tournamentInsertSchema`).
- **Bulk team/tournament management** -- The identity resolution UI creates records one at a time as needed during import. A dedicated team/tournament CRUD UI is a separate feature.

## Success Criteria

1. **Finishes parsing accuracy**: Given the reference "18 Open Finishes.xlsx" file (76 rows, 189 columns, 58 tournaments), the parser correctly detects all tournament column boundaries, extracts all non-empty Div/Fin/Tot triplets, and produces zero false positives (no phantom tournaments from padding columns or header-only columns).
2. **Colley parsing accuracy**: Given the reference "18Open Colley.xlsx" file, the parser correctly maps all team codes and all 12 rating/rank columns to the appropriate `ranking_results` fields.
3. **Identity resolution completeness**: Every team code and tournament name that does not match an existing database record is surfaced in the resolution UI. No unmatched entities slip through silently.
4. **Validation correctness**: Every row written to the database has passed Zod schema validation. No row with `finish_position > field_size` or missing required fields reaches the database.
5. **Replace mode atomicity**: When using replace mode, if any insert fails, no existing records are deleted. The database state is unchanged on failure.
6. **Merge mode idempotency**: Uploading the same file twice in merge mode produces no duplicate records and no errors. Updated values are reflected; unchanged records are untouched.
7. **Error preview usability**: A user can identify, understand, and resolve all validation errors from the preview table without needing to re-upload the file.
8. **API parity**: The `/api/import/upload` endpoint produces the same parse result as the web UI flow for the same file and parameters.
9. **Performance**: Parsing and validation of the reference 76x189 spreadsheet completes in under 3 seconds.
10. **Test coverage**: Unit tests cover all parser edge cases (padding columns, merged cells, missing sub-headers, empty rows). Integration tests verify the upload-to-database flow end-to-end.
