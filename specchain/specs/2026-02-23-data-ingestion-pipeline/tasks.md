# Tasks: Data Ingestion Pipeline

> **Spec:** [spec.md](./spec.md)
> **Strategy:** squad | **Depth:** standard
> **Tech stack:** SvelteKit + Supabase + TypeScript + Zod + Vitest + Playwright + xlsx (SheetJS) + Tailwind CSS

---

## Task Group 1: Parsing & Types Layer

**Assigned implementer:** `api-engineer`
**Verified by:** `backend-verifier`
**Dependencies:** Feature 1 (Data Model & Database Schema) must be complete -- Zod schemas in `src/lib/schemas/`, Supabase client in `src/lib/supabase.ts`, types in `src/lib/types/database.types.ts`, and enums in `src/lib/schemas/enums.ts` must all exist.

Build the Excel parsing subsystem: shared types for all parsers, the adaptive Finishes parser, the Colley parser, and the architecture-only MatchFileParser interface. This is the foundation layer -- all downstream groups depend on structured parse results flowing from here.

### Sub-tasks

- [x] **1.1 Define shared import types**
  Create file: `src/lib/import/types.ts`
  Define and export the following types/enums:
  - `ImportFormat` enum: `'finishes' | 'colley'`
  - `ImportMode` enum: `'replace' | 'merge'`
  - `ParsedFinishesRow`: `{ teamName: string, teamCode: string, tournamentName: string, division: string, finishPosition: number, fieldSize: number }`
  - `ParsedColleyRow`: `{ teamName: string, teamCode: string, wins: number, losses: number, algo1Rating: number | null, algo1Rank: number | null, algo2Rating: number | null, algo2Rank: number | null, algo3Rating: number | null, algo3Rank: number | null, algo4Rating: number | null, algo4Rank: number | null, algo5Rating: number | null, algo5Rank: number | null, aggRating: number | null, aggRank: number | null }`
  - `ParseError`: `{ row: number, column: string, message: string, severity: 'error' | 'warning' }`
  - `IdentityConflict`: `{ type: 'team' | 'tournament', parsedValue: string, suggestions: Array<{ id: string, name: string, code?: string, score: number }> }`
  - `ParseResult<T>`: `{ rows: T[], errors: ParseError[], identityConflicts: IdentityConflict[], metadata: { format: ImportFormat, totalRowsParsed: number, totalColumnsDetected: number, tournamentsDetected?: string[] } }`
  - `IdentityMapping`: `{ type: 'team' | 'tournament', parsedValue: string, action: 'create' | 'map' | 'skip', mappedId?: string, newRecord?: Record<string, unknown> }`
  - `ImportSummaryData`: `{ rowsInserted: number, rowsUpdated: number, rowsSkipped: number, teamsCreated: number, tournamentsCreated: number, importMode: ImportMode, timestamp: string, seasonId: string, ageGroup: string }`
  - `FileParserInterface<T>`: generic interface with method `parse(buffer: ArrayBuffer, options?: Record<string, unknown>): ParseResult<T>`

- [x] **1.2 Implement the adaptive Finishes parser**
  Create file: `src/lib/import/parsers/finishes-parser.ts`
  - Use the `xlsx` (SheetJS) library to read the workbook from an `ArrayBuffer`. Parse only the first sheet.
  - **Row 1 scan**: Iterate all cells in Row 1. For merged cell ranges, read the value from the leftmost cell. Build a map of `columnIndex -> tournamentName`.
  - **Row 2 scan**: Iterate all cells in Row 2. Detect `Div`/`Fin`/`Tot` triplet patterns. A valid tournament column boundary is defined as three consecutive cells in Row 2 where the values match (case-insensitive) `Div`, `Fin`, `Tot`. Record each triplet's start column index. Skip any columns without a valid triplet (padding columns, header-only tournaments).
  - **Row 3+ parsing**: For each data row, extract:
    - Team name from column 0 (A), team code from column 1 (B).
    - For each detected tournament triplet: read division (string), finish_position (integer), field_size (integer). Skip the triplet if both finish_position and field_size cells are empty (team did not participate).
  - **Ignore**: Columns 2-9 (Comp, Rank, Rec vs Field, Overall Rec) and the trailing 5 summary columns.
  - Return a `ParseResult<ParsedFinishesRow>` with all rows, detected parse errors (non-integer values in Fin/Tot cells, missing team name/code), and metadata (tournament names detected, row/column counts).
  - Export the parser as a class `FinishesParser` implementing `FileParserInterface<ParsedFinishesRow>`.

- [x] **1.3 Implement the Colley format parser**
  Create file: `src/lib/import/parsers/colley-parser.ts`
  - Use `xlsx` to read the workbook from `ArrayBuffer`. Parse only the first sheet.
  - **Column mapping** (fixed, 0-indexed): 0=Team, 1=teamcode, 2=Wins, 3=Losses, 4=Algo1Rating, 5=Algo1Rank, 6=Algo2Rating, 7=Algo2Rank, 8=Algo3Rating, 9=Algo3Rank, 10=Algo4Rating, 11=Algo4Rank, 12=Algo5Rating, 13=Algo5Rank, 14=AggRating, 15=AggRank.
  - Skip the header row (Row 1). Parse Row 2+ as data rows.
  - For each row, extract all fields into `ParsedColleyRow`. Flag errors for missing team/teamcode, non-numeric values in rating/rank columns.
  - Return `ParseResult<ParsedColleyRow>`.
  - Export as `ColleyParser` implementing `FileParserInterface<ParsedColleyRow>`.

- [x] **1.4 Define the MatchFileParser interface (architecture only)**
  Create file: `src/lib/import/parsers/match-parser.ts`
  - Define `ParsedMatchRow`: `{ teamA: string, teamB: string, winner: string | null, tournament: string }`
  - Define `MatchFileParser` interface extending `FileParserInterface<ParsedMatchRow>`.
  - Add a JSDoc comment documenting the expected CSV columns: Team A, Team B, Winner, Tournament.
  - Export both the type and interface. Do NOT implement a parser class body.

- [x] **1.5 Create parser barrel export**
  Create file: `src/lib/import/parsers/index.ts`
  - Re-export `FinishesParser` from `./finishes-parser`.
  - Re-export `ColleyParser` from `./colley-parser`.
  - Re-export `MatchFileParser` interface and `ParsedMatchRow` type from `./match-parser`.
  - Export a factory function `getParser(format: ImportFormat)` that returns the correct parser instance.

- [x] **1.6 Create test fixture files**
  Create directory: `src/lib/import/__fixtures__/`
  - Create a minimal Finishes `.xlsx` fixture: 5 teams, 3 tournaments (one with padding columns, one header-only with no sub-headers/data). Store as `finishes-test-fixture.xlsx`. This fixture must exercise: standard Div/Fin/Tot triplets, empty padding columns between tournaments, a tournament header in Row 1 with no Div/Fin/Tot in Row 2, merged cells in Row 1, at least one empty Fin/Tot pair (team didn't attend).
  - Create a minimal Colley `.xlsx` fixture: 5 teams, all 16 columns populated. Store as `colley-test-fixture.xlsx`.
  - These fixtures are used by tests in sub-tasks 1.7 and 1.8.

- [x] **1.7 Write Finishes parser tests**
  Create test file: `src/lib/import/parsers/__tests__/finishes-parser.test.ts`
  Tests (Vitest, 5 focused tests):
  1. **Test:** Correctly detects tournament column boundaries from Row 2 Div/Fin/Tot patterns using the fixture file. Assert tournament count matches expected (e.g., 2 valid tournaments, 1 skipped header-only).
  2. **Test:** Extracts team name and code from columns 0-1 for every data row. Assert row count matches expected teams.
  3. **Test:** Skips padding columns (empty cols between tournament triplets) without producing phantom tournament entries.
  4. **Test:** Handles merged cells in Row 1 -- reads tournament name from leftmost cell of merge range.
  5. **Test:** Skips Fin/Tot pairs where both cells are empty (team did not attend). Returns no row for that team+tournament combination.

- [x] **1.8 Write Colley parser tests**
  Create test file: `src/lib/import/parsers/__tests__/colley-parser.test.ts`
  Tests (Vitest, 3 focused tests):
  1. **Test:** Correctly maps all 16 columns to `ParsedColleyRow` fields for each row. Assert all rating/rank values match fixture data.
  2. **Test:** Flags an error for rows with non-numeric values in rating/rank columns.
  3. **Test:** Skips the header row and parses only data rows. Assert parsed row count equals fixture data row count.

### Acceptance Criteria

- `src/lib/import/types.ts` exports all shared types, enums, and the `FileParserInterface` generic interface.
- `FinishesParser` correctly parses the reference-format spreadsheet: detects tournament boundaries, handles merged cells, skips padding and header-only columns, extracts Div/Fin/Tot triplets per team.
- `ColleyParser` correctly maps all 16 fixed columns to `ParsedColleyRow` fields.
- `MatchFileParser` interface is defined with correct type contract; no implementation body exists.
- Parser factory function returns the correct parser instance for each format.
- All 8 parser tests pass.

### Verification Steps

1. Run the Finishes parser against the test fixture. Expected: 2 valid tournaments detected, 5 teams parsed, padding columns produce no phantom entries, header-only tournament is skipped.
2. Run the Colley parser against the test fixture. Expected: 5 rows parsed with all 16 fields correctly mapped.
3. Import `MatchFileParser` in a test file and verify it is a type-only export (no runtime implementation).
4. Call `getParser('finishes')` and verify it returns a `FinishesParser` instance. Call `getParser('colley')` and verify it returns a `ColleyParser` instance.

### Verification Commands

```bash
# Run all parser tests
npx vitest run src/lib/import/parsers/__tests__/

# Run only Finishes parser tests
npx vitest run src/lib/import/parsers/__tests__/finishes-parser.test.ts

# Run only Colley parser tests
npx vitest run src/lib/import/parsers/__tests__/colley-parser.test.ts

# Type-check import layer
npx tsc --noEmit --project tsconfig.json
```

---

## Task Group 2: Import Service & API Layer

**Assigned implementer:** `database-engineer`
**Verified by:** `backend-verifier`
**Dependencies:** Task Group 1 (all shared types and parsers must exist). Feature 1 schemas (Zod schemas and Supabase client).

Build the identity resolution service, the orchestrating import service (replace/merge logic, Zod validation, database transactions), and the two API endpoints (`/api/import/upload` and `/api/import/confirm`). This group handles all server-side logic from raw file to database persistence.

### Sub-tasks

- [x] **2.1 Implement the identity resolution service**
  Create file: `src/lib/import/identity-resolver.ts`
  - Export class `IdentityResolver`.
  - Constructor accepts the Supabase client (from `src/lib/supabase.ts`).
  - Method `resolveTeams(teamCodes: string[], ageGroup: string): Promise<{ matched: Map<string, string>, unmatched: IdentityConflict[] }>`:
    - Query `teams` table filtered by `age_group` to find existing teams by code.
    - For unmatched codes, perform fuzzy matching (Levenshtein distance) against all teams in the age group. Return up to 3 suggestions per unmatched code, sorted by match score.
    - Return the matched map (code -> team_id) and unmatched conflicts list.
  - Method `resolveTournaments(tournamentNames: string[], seasonId: string): Promise<{ matched: Map<string, string>, unmatched: IdentityConflict[] }>`:
    - Query `tournaments` table filtered by `season_id`.
    - Fuzzy match unmatched names. Return matched map (name -> tournament_id) and unmatched conflicts.
  - Helper: Implement a simple Levenshtein distance function (or use a lightweight dependency) for fuzzy matching. Normalize strings to lowercase before comparison.

- [x] **2.2 Implement the import service**
  Create file: `src/lib/import/import-service.ts`
  - Export class `ImportService`.
  - Constructor accepts the Supabase client.
  - Method `validateFinishesRows(rows: ParsedFinishesRow[], identityMappings: IdentityMapping[]): ValidatedRow[]`:
    - Apply identity mappings to resolve team codes and tournament names to IDs.
    - Filter out rows where team or tournament was mapped to `'skip'`.
    - Validate each row against `tournamentResultInsertSchema` from `src/lib/schemas/tournament-result.ts`.
    - Return validated rows with resolved UUIDs, or attach validation errors.
  - Method `validateColleyRows(rows: ParsedColleyRow[], identityMappings: IdentityMapping[], rankingRunId: string): ValidatedRow[]`:
    - Same pattern but validate against `rankingResultInsertSchema` from `src/lib/schemas/ranking-result.ts`.
  - Method `executeReplace(validatedRows: ValidatedRow[], seasonId: string, ageGroup: string, format: ImportFormat): Promise<ImportSummaryData>`:
    - For Finishes: Delete all `tournament_results` for the season+age_group combination, then insert all rows. Wrap in a Supabase RPC or sequential operations with manual rollback on failure. If any insert fails, the deletes must be rolled back (atomicity).
    - For Colley: Delete all `ranking_results` for the relevant `ranking_run_id`, then insert.
    - Return summary counts.
  - Method `executeMerge(validatedRows: ValidatedRow[], format: ImportFormat): Promise<ImportSummaryData>`:
    - For each row, check if composite key exists (`team_id + tournament_id` for Finishes, `team_id + ranking_run_id` for Colley).
    - If no match: INSERT. If match and values differ: UPDATE. If match and values identical: SKIP.
    - Return summary counts (inserted, updated, skipped).

- [x] **2.3 Implement the Supabase RPC function for atomic replace**
  Create migration file: `supabase/migrations/YYYYMMDD_create_import_replace_rpc.sql`
  - Define a PostgreSQL function `import_replace_tournament_results(p_season_id UUID, p_age_group text, p_rows JSONB)` that:
    1. Deletes all `tournament_results` where `tournament_id IN (SELECT id FROM tournaments WHERE season_id = p_season_id)` AND `team_id IN (SELECT id FROM teams WHERE age_group = p_age_group::age_group_enum)`.
    2. Inserts all rows from the `p_rows` JSONB array.
    3. Runs inside a single transaction (PostgreSQL function bodies are inherently transactional).
  - Define a similar function `import_replace_ranking_results(p_ranking_run_id UUID, p_rows JSONB)` for Colley replace mode.
  - These functions guarantee atomicity that the Supabase JS client cannot provide for multi-table operations.

- [x] **2.4 Implement duplicate detection utility**
  Create file: `src/lib/import/duplicate-detector.ts`
  - Export function `detectDuplicateFinishes(rows: ValidatedRow[], supabase: SupabaseClient): Promise<Map<string, string>>`:
    - Query `tournament_results` for existing records matching any `team_id + tournament_id` combinations in the validated rows.
    - Return a map of `"team_id:tournament_id" -> existing_record_id` for rows that already exist.
  - Export function `detectDuplicateColley(rows: ValidatedRow[], rankingRunId: string, supabase: SupabaseClient): Promise<Map<string, string>>`:
    - Same pattern for `ranking_results` table with `team_id + ranking_run_id`.
  - These are used by both the validation preview (to flag duplicates in the UI) and the merge logic.

- [x] **2.5 Implement the upload API endpoint**
  Create file: `src/routes/api/import/upload/+server.ts`
  - `POST` handler accepting `multipart/form-data` with fields: `file` (binary .xlsx), `season_id` (UUID string), `age_group` (enum string), `format` (`'finishes' | 'colley'`).
  - Validate request parameters: reject if any required field is missing (400), reject if file is not `.xlsx` (400), reject if file size > 10 MB (400), reject if `age_group` is not a valid `AgeGroup` enum value (400).
  - Read file into `ArrayBuffer`. Use `getParser(format)` from Group 1 to parse.
  - Instantiate `IdentityResolver` and call `resolveTeams()` / `resolveTournaments()` to populate identity conflicts.
  - Instantiate duplicate detector to flag existing records.
  - Return JSON: `{ success: true, data: ParseResult }` on success.
  - Return JSON: `{ success: false, error: string }` on failure (400 or 500).

- [x] **2.6 Implement the confirm API endpoint**
  Create file: `src/routes/api/import/confirm/+server.ts`
  - `POST` handler accepting `application/json` body: `{ rows: ValidatedRow[], identityMappings: IdentityMapping[], importMode: 'replace' | 'merge', seasonId: string, ageGroup: string, format: 'finishes' | 'colley' }`.
  - First, create any new team/tournament records from identity mappings where `action === 'create'`:
    - Validate against `teamInsertSchema` / `tournamentInsertSchema`.
    - Insert into `teams` / `tournaments` table.
    - Capture the new IDs and update the identity mappings.
  - For Colley imports: create a new `ranking_run` record with the `season_id` and description `"Imported from Colley file"`.
  - Call `ImportService.validateFinishesRows()` or `validateColleyRows()` with resolved mappings.
  - Based on `importMode`, call `executeReplace()` or `executeMerge()`.
  - Return JSON: `{ success: true, summary: ImportSummaryData }` on success.
  - Return JSON: `{ success: false, error: string }` on failure (400, 409, or 500).

- [x] **2.7 Implement the server-side page load for /import**
  Create file: `src/routes/import/+page.server.ts`
  - Load function fetches all seasons from the `seasons` table via Supabase client.
  - Returns `{ seasons: Season[] }` to the page component for populating the season dropdown.

- [x] **2.8 Write import service and API tests**
  Create test file: `src/lib/import/__tests__/import-service.test.ts`
  Tests (Vitest, 6 focused tests):
  1. **Test:** `IdentityResolver.resolveTeams()` returns matched teams in the matched map and unmatched teams with fuzzy suggestions. Use mocked Supabase queries.
  2. **Test:** `IdentityResolver.resolveTournaments()` correctly separates matched from unmatched tournament names.
  3. **Test:** `ImportService.validateFinishesRows()` filters out skipped rows and returns validation errors for invalid rows (e.g., `finish_position > field_size`).
  4. **Test:** `ImportService.executeMerge()` inserts new rows, updates changed rows, and skips identical rows. Verify via mocked Supabase calls.
  5. **Test:** Duplicate detector identifies existing `team_id + tournament_id` combinations correctly.
  6. **Test:** Upload endpoint rejects non-.xlsx files with 400 status and correct error message.

### Acceptance Criteria

- `IdentityResolver` correctly queries the database and provides fuzzy-match suggestions for unmatched teams/tournaments.
- `ImportService` validates rows against existing Zod schemas and enforces all business rules.
- Replace mode uses the Supabase RPC function for atomicity -- if any insert fails, no deletes persist.
- Merge mode correctly distinguishes INSERT/UPDATE/SKIP cases based on composite key matching.
- Upload endpoint validates all request parameters and returns structured `ParseResult` JSON.
- Confirm endpoint creates new records from identity mappings, executes the import, and returns `ImportSummaryData`.
- Server load function provides seasons to the import page.
- All 6 import service tests pass.

### Verification Steps

1. Call the upload endpoint with a valid Finishes fixture file and verify the response contains parsed rows, identity conflicts, and metadata.
2. Call the upload endpoint with a `.csv` file and verify it returns a 400 error.
3. Call the upload endpoint with a file larger than 10 MB and verify it returns a 400 error.
4. Call the confirm endpoint with merge mode and verify INSERT/UPDATE/SKIP counts in the summary.
5. Call the confirm endpoint with replace mode and verify old records are deleted and new records are inserted atomically.

### Verification Commands

```bash
# Run import service tests
npx vitest run src/lib/import/__tests__/import-service.test.ts

# Type-check the import and API layer
npx tsc --noEmit --project tsconfig.json

# Start dev server and test upload endpoint manually (optional)
npm run dev &
curl -X POST http://localhost:5173/api/import/upload \
  -F "file=@src/lib/import/__fixtures__/finishes-test-fixture.xlsx" \
  -F "season_id=test-uuid" \
  -F "age_group=18U" \
  -F "format=finishes"
```

---

## Task Group 3: Frontend UI Layer

**Assigned implementer:** `ui-designer`
**Verified by:** `frontend-verifier`
**Dependencies:** Task Group 1 (shared types for display), Task Group 2 (API endpoints for upload/confirm, server load for seasons). Feature 1 schemas for `AgeGroup` enum.

Build the complete `/import` page with all UI components: context selectors, FileDropZone, IdentityResolutionPanel, DataPreviewTable, ImportModeSelector, ImportSummary, and the multi-step state machine. All components use Svelte 5 runes, Tailwind CSS for styling, and are keyboard-accessible.

### Sub-tasks

- [x] **3.1 Create the FileDropZone component**
  Create file: `src/lib/components/FileDropZone.svelte`
  - Drag-and-drop zone with dashed border, hover highlight state, and a "Browse Files" button fallback.
  - Props: `accept` (file extension filter, default `.xlsx`), `maxSizeMB` (default 10), `disabled` (boolean).
  - Events: `onFileDrop(file: File)` callback when a valid file is dropped or selected.
  - Validation: Check file extension is `.xlsx`. Check file size <= `maxSizeMB * 1024 * 1024`. Display inline error for invalid files.
  - Accessibility: The drop zone must be keyboard-navigable (focusable div with Enter/Space to open file picker). Error messages must not rely solely on color.
  - Styling: Tailwind CSS. Dashed border (`border-dashed border-2`), hover state (`border-blue-500 bg-blue-50`), error state (`border-red-500`).
  - Show a loading spinner overlay when `disabled` is true (during parsing state).

- [x] **3.2 Create the IdentityResolutionPanel component**
  Create file: `src/lib/components/IdentityResolutionPanel.svelte`
  - Props: `conflicts: IdentityConflict[]`, `onResolve(mapping: IdentityMapping): void`.
  - For each conflict, display a row with:
    - The parsed value (team code or tournament name) and conflict type label.
    - **Create New** button: Opens an inline form to fill in required fields (team: name, code, region, age_group; tournament: name, date, season_id, location). Age group and season_id are pre-filled from context.
    - **Map To** dropdown: Lists existing records for the age group/season. Shows fuzzy-match suggestions at top, sorted by score. Dropdown uses Tailwind styling with a search input for filtering.
    - **Skip** button: Marks this entity as skipped.
  - Display a count badge at the top: `"X unmatched teams, Y unmatched tournaments"`.
  - A conflict row changes to a "resolved" visual state (green check, muted background) once the user takes an action.
  - The panel must prevent the import from proceeding until all conflicts have a resolution (create, map, or skip).

- [x] **3.3 Create the DataPreviewTable component**
  Create file: `src/lib/components/DataPreviewTable.svelte`
  - Props: `rows: ParsedRow[]`, `errors: ParseError[]`, `onEditCell(rowIndex: number, column: string, value: string): void`, `onSkipRow(rowIndex: number): void`.
  - Render a scrollable table (max-height with overflow-y-auto) displaying all parsed rows.
  - Columns vary by format:
    - Finishes: Team, Tournament, Division, Finish, Field Size, Status.
    - Colley: Team, Code, Wins, Losses, Algo1-5 Ratings/Ranks, AggRating, AggRank, Status.
  - Error highlighting: Rows with errors get a `bg-red-50 border-l-4 border-red-500` treatment. The Status column shows a red error icon plus a tooltip/inline message with the error text. Errors must not rely solely on color -- include a text label or icon.
  - Inline editing: Clicking a cell value in the Div/Fin/Tot columns opens an inline text input. On blur or Enter, call `onEditCell`. Re-validate the row after edit.
  - Row skip toggle: A checkbox or "Skip" button per row. Skipped rows get a `bg-gray-100 line-through` treatment and are excluded from import counts.
  - Error summary bar at the top: `"X errors in Y rows"` with breakdown by error type.

- [x] **3.4 Create the ImportSummary component**
  Create file: `src/lib/components/ImportSummary.svelte`
  - Props: `summary: ImportSummaryData`.
  - Display: Rows inserted, rows updated, rows skipped, teams created, tournaments created, import mode, timestamp, season name, age group.
  - Visual: Card layout with Tailwind. Green success banner at the top. Stats in a grid.
  - Action: "Import Another File" button that resets the page to the initial state.

- [x] **3.5 Build the /import page with multi-step state flow**
  Create file: `src/routes/import/+page.svelte`
  - Use Svelte 5 runes (`$state`, `$derived`) for all reactive state.
  - State machine with steps: `'select' | 'parsing' | 'preview' | 'importing' | 'complete' | 'error'`.
  - **Key state variables:**
    - `step: $state('select')`
    - `selectedSeasonId: $state('')`
    - `selectedAgeGroup: $state('')`
    - `selectedFormat: $state<ImportFormat>('finishes')`
    - `parseResult: $state<ParseResult | null>(null)`
    - `identityMappings: $state<IdentityMapping[]>([])`
    - `editedRows: $state<Map<string, string>>(new Map())`
    - `skippedRowIndices: $state<Set<number>>(new Set())`
    - `importMode: $state<ImportMode>('merge')`
    - `importSummary: $state<ImportSummaryData | null>(null)`
    - `errorMessage: $state('')`
  - **Derived state:**
    - `allConflictsResolved: $derived` -- true when every `IdentityConflict` has a corresponding `IdentityMapping`.
    - `unresolvedErrorCount: $derived` -- count of errors on non-skipped rows.
    - `canConfirm: $derived` -- true when `allConflictsResolved && unresolvedErrorCount === 0`.
  - **Step: 'select'**: Render three dropdowns (Season from server data, Age Group from `AgeGroup` enum, Format static options) and the `FileDropZone`. All selectors must have a value before upload is possible.
  - **Step: 'parsing'**: Show loading spinner. Disable all inputs. Call `POST /api/import/upload` with FormData. On success, set `parseResult` and transition to `'preview'`. On error, transition to `'error'`.
  - **Step: 'preview'**: Render `IdentityResolutionPanel` (if conflicts exist), `DataPreviewTable`, import mode radio buttons (Merge/Update default, Replace All), Cancel button (resets to 'select'), Confirm Import button (disabled unless `canConfirm`).
  - **Step: 'importing'**: Show progress indicator. Disable all inputs. Call `POST /api/import/confirm`. On success, set `importSummary` and transition to `'complete'`. On error, transition to `'error'`.
  - **Step: 'complete'**: Render `ImportSummary` component.
  - **Step: 'error'**: Show error banner with the error message and a "Try Again" button that resets to `'select'`.

- [x] **3.6 Style the import page layout**
  - Apply the visual layout from the spec's wireframe.
  - Page title: "Import Data" with appropriate heading level.
  - Selectors in a horizontal row with consistent spacing.
  - Components stack vertically: selectors -> upload zone -> identity panel -> preview table -> mode selector -> action buttons.
  - Responsive for >= 1024px screens (spec NF6). Use Tailwind `max-w-7xl mx-auto` container.
  - Consistent spacing: `space-y-6` between sections. Card wrappers for each panel.

- [x] **3.7 Write UI component tests**
  Create test file: `src/lib/components/__tests__/import-ui.test.ts`
  Tests (Vitest with `@testing-library/svelte`, 4 focused tests):
  1. **Test:** `FileDropZone` rejects a non-.xlsx file and displays an error message. Verify the error text is visible (not color-only).
  2. **Test:** `FileDropZone` rejects a file exceeding 10 MB and displays a size error.
  3. **Test:** `IdentityResolutionPanel` renders one row per conflict and calls `onResolve` with the correct mapping when "Skip" is clicked.
  4. **Test:** `DataPreviewTable` highlights error rows with the error status text visible and inline edit triggers `onEditCell` callback.

### Acceptance Criteria

- The `/import` page renders correctly and follows the wireframe layout from the spec.
- The multi-step state flow transitions correctly between all 6 states.
- `FileDropZone` validates file type and size, is keyboard-navigable, and shows non-color-dependent error messages.
- `IdentityResolutionPanel` displays all unmatched entities with Create/Map/Skip options and prevents confirm until all resolved.
- `DataPreviewTable` shows all parsed rows, highlights errors with text labels, supports inline editing and row skipping.
- `ImportSummary` displays all summary statistics after a successful import.
- Import mode defaults to "Merge/Update" (safer default per spec F8).
- All 4 UI component tests pass.

### Verification Steps

1. Navigate to `/import` page. Verify the three dropdowns and file upload zone are visible.
2. Upload a valid `.xlsx` fixture file. Verify the page transitions to the preview step showing parsed data.
3. Resolve all identity conflicts using Create/Map/Skip. Verify the Confirm button becomes enabled.
4. Confirm an import with Merge mode. Verify the summary panel displays correct counts.
5. Upload a `.txt` file. Verify the FileDropZone shows a rejection error.
6. Test keyboard navigation: Tab to the file upload zone, press Enter to open file picker.

### Verification Commands

```bash
# Run UI component tests
npx vitest run src/lib/components/__tests__/import-ui.test.ts

# Start dev server and visually inspect the import page
npm run dev
# Open http://localhost:5173/import in a browser

# Type-check all Svelte components
npx svelte-check --tsconfig tsconfig.json
```

---

## Task Group 4: Test Review & Gap Analysis

**Assigned implementer:** `testing-engineer`
**Verified by:** none (final quality gate)
**Dependencies:** Task Groups 1, 2, and 3 must be complete (all implementation and their embedded tests).

Review all tests written by Groups 1-3 (8 parser tests + 6 service tests + 4 UI tests = 18 tests), identify critical gaps in coverage, and add up to 10 gap-filling tests including an E2E workflow test. Focus on integration boundaries, error edge cases, and the full upload-to-database flow.

### Sub-tasks

- [x] **4.1 Audit existing test coverage**
  Review all test files:
  - `src/lib/import/parsers/__tests__/finishes-parser.test.ts` (5 tests)
  - `src/lib/import/parsers/__tests__/colley-parser.test.ts` (3 tests)
  - `src/lib/import/__tests__/import-service.test.ts` (6 tests)
  - `src/lib/components/__tests__/import-ui.test.ts` (4 tests)
  Document which paths are covered and which critical paths are missing. Focus on: cross-layer integration, error edge cases, Zod validation of parsed data, malformed file handling, and the complete upload-to-summary flow.

- [x] **4.2 Write Zod validation integration tests**
  Create test file: `src/lib/import/__tests__/validation-integration.test.ts`
  Tests:
  1. **Test:** Parsed Finishes rows pass through `tournamentResultInsertSchema` validation. Verify valid rows pass and rows with `finish_position > field_size` fail with the correct Zod error message.
  2. **Test:** Parsed Colley rows pass through `rankingResultInsertSchema` validation. Verify rows with all algo fields null are accepted (nullable columns).
  3. **Test:** A row with missing required field (`division` empty string for Finishes) is rejected by Zod validation.

- [x] **4.3 Write malformed file handling tests**
  Create test file: `src/lib/import/parsers/__tests__/error-handling.test.ts`
  Tests:
  4. **Test:** Finishes parser handles an empty spreadsheet (no data rows) without throwing. Returns `ParseResult` with zero rows and no errors.
  5. **Test:** Colley parser handles a spreadsheet with only headers and no data rows. Returns zero rows.
  6. **Test:** Finishes parser handles a spreadsheet where Row 2 has no recognizable Div/Fin/Tot patterns. Returns zero rows and a warning in errors.

- [x] **4.4 Write import mode edge case tests**
  Create test file: `src/lib/import/__tests__/import-mode-edge-cases.test.ts`
  Tests:
  7. **Test:** Merge mode with identical existing data produces zero inserts, zero updates, and all rows skipped. Verifies idempotency (Success Criterion 6).
  8. **Test:** Replace mode rolls back deletes if an insert fails. Mock a Supabase RPC call that throws, verify the error is propagated and no data is lost.

- [x] **4.5 Write E2E workflow test**
  Create test file: `tests/e2e/import-flow.test.ts` (Playwright)
  Tests:
  9. **Test (E2E):** Full Finishes upload flow: Navigate to `/import`, select season and age group from dropdowns, upload the Finishes test fixture, verify preview table appears with parsed rows, verify identity resolution panel shows (if any conflicts exist), select Merge mode, click Confirm Import, verify the summary panel displays with non-zero inserted count.
  10. **Test (E2E):** Error handling flow: Navigate to `/import`, attempt to upload a `.txt` file, verify the error message appears in the FileDropZone and the page remains on the select step.

- [x] **4.6 Verify full test suite passes**
  Run the complete test suite across all groups. Verify zero failures and no test isolation issues (tests do not depend on each other's state). Document final test counts.

### Acceptance Criteria

- Gap analysis is documented with clear rationale for each added test.
- Up to 10 additional tests are written, covering: Zod validation of parsed data, malformed file handling, import mode edge cases, and the full E2E upload flow.
- All new tests follow Arrange-Act-Assert pattern.
- No test depends on another test's state or ordering.
- The full test suite (all 4 groups) passes in a single run.
- E2E test exercises the critical path: upload -> parse -> resolve -> confirm -> summary.

### Verification Steps

1. Run the complete Vitest suite. Expected: all unit and integration tests pass with zero failures.
2. Run the Playwright E2E suite. Expected: the full import flow test passes (requires a running dev server and Supabase instance).
3. Confirm total test count is between 20 and 28 (18 from Groups 1-3 + up to 10 from Group 4).
4. Verify no test pollutes global state by running the suite twice consecutively.

### Verification Commands

```bash
# Run all unit and integration tests
npx vitest run

# Run only the gap-filling tests
npx vitest run src/lib/import/__tests__/validation-integration.test.ts
npx vitest run src/lib/import/parsers/__tests__/error-handling.test.ts
npx vitest run src/lib/import/__tests__/import-mode-edge-cases.test.ts

# Run E2E tests (requires dev server running)
npx playwright test tests/e2e/import-flow.test.ts

# Run full suite and report coverage
npx vitest run --coverage
```

---

## Summary

| Group | Implementer | Focus | Tasks | Tests | Depends On |
|-------|-------------|-------|-------|-------|------------|
| 1. Parsing & Types Layer | `api-engineer` | Excel parsers, shared types, parser interface | 8 | 8 | Feature 1 |
| 2. Import Service & API Layer | `database-engineer` | Identity resolution, import service, API endpoints, DB transactions | 8 | 6 | Group 1 |
| 3. Frontend UI Layer | `ui-designer` | Import page, all UI components, multi-step flow | 7 | 4 | Groups 1, 2 |
| 4. Test Review & Gap Analysis | `testing-engineer` | Gap-filling tests, E2E workflow | 6 | up to 10 | Groups 1, 2, 3 |

**Total sub-tasks:** 29
**Total tests:** 18 (Groups 1-3) + up to 10 (Group 4) = up to 28

### Dependency Graph

```
Feature 1 (Data Model)
    |
    v
Group 1: Parsing & Types (api-engineer)
    |
    v
Group 2: Import Service & API (database-engineer)
    |
    v
Group 3: Frontend UI (ui-designer)
    |
    v
Group 4: Test Review & Gap Analysis (testing-engineer)
```

### Existing Code Reused

| Asset | Location | Used In |
|-------|----------|---------|
| `tournamentResultInsertSchema` | `src/lib/schemas/tournament-result.ts` | Groups 2, 4 -- validate parsed Finishes rows |
| `rankingResultInsertSchema` | `src/lib/schemas/ranking-result.ts` | Groups 2, 4 -- validate parsed Colley rows |
| `teamInsertSchema` | `src/lib/schemas/team.ts` | Group 2 -- validate new teams during identity resolution |
| `tournamentInsertSchema` | `src/lib/schemas/tournament.ts` | Group 2 -- validate new tournaments during identity resolution |
| `AgeGroup` enum | `src/lib/schemas/enums.ts` | Groups 2, 3 -- validate age group parameter, populate selector |
| Supabase client | `src/lib/supabase.ts` | Groups 2, 3 -- all database reads and writes |
| `Database` types | `src/lib/types/database.types.ts` | Group 2 -- type-safe Supabase queries |
