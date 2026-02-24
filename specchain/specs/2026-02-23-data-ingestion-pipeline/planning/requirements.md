# Spec Requirements: Data Ingestion Pipeline

## Initial Description

Build a file upload and parsing system that accepts Excel/CSV files matching the existing "18 Open Finishes" spreadsheet format, maps columns to teams/tournaments/results, validates data integrity (unknown team codes, duplicate entries, missing fields), and persists parsed records to the database.

## Requirements Discussion

### First Round Questions

**Q1:** Which file formats should the ingestion pipeline support?
**Answer:** All three -- the "18 Open Finishes" .xlsx format (tournament Div/Fin/Tot results), the "18Open Colley" .xlsx format (pre-computed algorithm ratings/ranks), and plain CSV for match-level data (Team A, Team B, Winner, Tournament). Full flexibility for all data types.

**Q2:** Match-level data -- neither spreadsheet contains individual match records. Where does match data come from?
**Answer:** Defer match ingestion. This feature focuses on tournament results from the Finishes spreadsheet. Match ingestion will be handled separately in a future feature. The CSV match format should be architecturally supported but not implemented in this spec.

**Q3:** How should the parser handle the spreadsheet's irregular column structure?
**Answer:** Adaptive parsing. Auto-detect tournament column boundaries by scanning for Div/Fin/Tot patterns in Row 2. Skip empty padding columns (e.g., cols 80-82 after AZ Region Boys #1, cols 86-88 after Snowball Slam). Handle merged cells in Row 1 gracefully. Do not require an exact column template.

Observed irregularities in the reference spreadsheet:

- Some tournaments have 3 extra empty padding columns after their Div/Fin/Tot triplet
- Some tournaments (e.g., "2025 Winter Formal") have a header in Row 1 but no Div/Fin/Tot sub-headers and no data -- these should be detected and skipped
- Row 1 uses merged cells spanning 3 columns for tournament names
- The Div/Fin/Tot sub-headers appear in Row 2
- Columns 1-10 are team-level data (Team Name, Code, Comp, Rank, Rec v Field W/L/Win%, Overall Rec W/L/Win%)
- Columns 11+ are tournament triplets
- Last 5 columns (185-189) are summary stats: # of Qual, Avg Finish, Last Result, Wins vs Field, Losses vs Field

**Q4:** When a team code or tournament name doesn't match existing database records, what should happen?
**Answer:** Preview & map. Show unmatched entities in a mapping UI where the user can:

- Create a new team/tournament record from the parsed data
- Map to an existing record (e.g., fuzzy match or dropdown selection)
- Skip the unmatched row
  Import does not proceed until all identity conflicts are resolved.

**Q5:** When uploading a new file for the same season/age group, should it replace or merge?
**Answer:** User choice at upload time. Present two options:

- **Replace all**: Wipe all existing tournament results for that season/age group and re-import everything from the file
- **Merge/update**: Add new entries, update changed values, skip unchanged duplicates. Never auto-delete existing records.

**Q6:** How should computed summary columns be handled?
**Answer:** Ignore and recompute. Do not import the summary columns (Rec vs Field, Overall Rec, # of Qual, Avg Finish, Last Result, Wins vs Field, Losses vs Field). All aggregates will be recomputed from the raw tournament result data. Single source of truth.

**Q7:** When validation finds errors, how should the system respond?
**Answer:** Preview with errors. Show the full parsed data in a table with flagged/highlighted rows for:

- Unknown team codes (not in DB and not yet mapped)
- Duplicate entries (same team + same tournament already exists)
- Invalid data (finish_position > field_size, missing required fields)
- Tournaments with no sub-headers/data (detected but skipped)
  Let the user correct, skip, or resolve errors before confirming the import.

**Q8:** Upload mechanism and context selection?
**Answer:** Both UI + API:

- **Web UI**: Drag-and-drop or file picker page for committee members. User selects season and age group before uploading.
- **API endpoint**: Programmatic endpoint accepting file + season_id + age_group parameters. Enables future automation.
  The system should NOT infer age group from file content -- require explicit selection to avoid misclassification.

### Existing Code to Reference

**Feature 1 (Data Model & Database Schema):**

- Database tables: `teams`, `tournaments`, `tournament_results`, `matches`, `seasons`, `tournament_weights` -- all created in `supabase/migrations/`
- Zod schemas: `src/lib/schemas/` -- validation schemas for all entities
- Key schemas for ingestion: `tournamentResultInsertSchema`, `teamInsertSchema`, `tournamentInsertSchema`
- `tournament_results` table: team_id (FK), tournament_id (FK), division (string), finish_position (int >= 1), field_size (int >= 1), with CHECK constraint finish_position <= field_size
- `teams` table: name, code (unique per age group), region, age_group (enum)
- `tournaments` table: name, date, season_id (FK), location

**Reference data files:**

- `data/reference/18 Open Finishes.xlsx`: 76 rows x 189 cols, 74 teams, 58 tournaments, Div/Fin/Tot triplets
- `data/reference/18Open Colley.xlsx`: 75 rows x 16 cols, algorithm ratings and W/L totals
- `data/reference/AAU Seeding Guidelines.docx`: Committee structure, event priority tiers

**Spreadsheet column structure (18 Open Finishes):**

- Cols 1-4: Team Name, Code, Comp, Rank (Reg)
- Cols 5-7: Rec vs Field (Win, Loss, Win %)
- Cols 8-10: Overall Rec (Win, Loss, Win %)
- Cols 11+: Tournament triplets (Div, Fin, Tot) -- each tournament spans 3 columns, some have 3 extra empty padding cols
- Cols 185-189: Summary stats (# of Qual, Avg Finish, Last Result, Wins vs Field, Losses vs Field)
- Row 1: Tournament names (merged cells)
- Row 2: Sub-headers (Div/Fin/Tot or team-level field names)
- Rows 3-76: Team data

### Follow-up Questions

No follow-up questions needed. All answers were clear and complete.

## Visual Assets

No visual assets provided.

## Requirements Summary

### Functional Requirements

- **File upload endpoint**: Accept .xlsx and .csv files via both web UI and API
- **Adaptive Excel parser**: Auto-detect tournament column boundaries by scanning for Div/Fin/Tot patterns in Row 2. Handle merged cells, empty padding columns, and tournaments with missing sub-headers
- **Colley format parser**: Parse the 18Open Colley .xlsx format (Team, teamcode, Wins, Losses, Algo1-5 ratings/ranks, AggRating, AggRank)
- **CSV match parser**: Architecture the interface for CSV match ingestion (Team A, Team B, Winner, Tournament) but defer implementation
- **Team identity resolution**: Detect unmatched team codes, present mapping UI to create new teams, map to existing, or skip
- **Tournament identity resolution**: Detect unmatched tournament names, present mapping UI with same options
- **Data validation**: Validate parsed data against Zod schemas and database constraints (finish_position <= field_size, required fields, duplicate detection, FK references)
- **Error preview**: Display parsed data in a table with highlighted/flagged validation errors. User must resolve all errors before confirming import
- **Import mode selection**: User chooses "Replace all" or "Merge/update" at upload time
- **Replace mode**: Delete all tournament_results for the selected season + age group, then insert all parsed rows
- **Merge mode**: Insert new records, update changed records (match on team_id + tournament_id composite), skip unchanged duplicates
- **Context selection**: User selects season and age group before upload (not inferred from file)
- **Summary columns ignored**: Skip Rec vs Field, Overall Rec, # of Qual, Avg Finish, Last Result, Wins vs Field, Losses vs Field columns -- all aggregates recomputed from raw data

### Reusability Opportunities

- Existing Zod schemas from Feature 1 (`tournamentResultInsertSchema`, `teamInsertSchema`, etc.)
- Supabase client patterns from `src/lib/supabase.ts`
- `xlsx` library (already in tech stack) for Excel parsing
- `csv-parse` library (already in tech stack) for CSV parsing

### Scope Boundaries

**In Scope:**

- Excel (.xlsx) file upload and parsing for "18 Open Finishes" format
- Excel (.xlsx) file upload and parsing for "18Open Colley" format
- Adaptive column detection for irregular spreadsheet structures
- Team and tournament identity resolution with mapping UI
- Data validation with error preview
- Import mode selection (replace vs. merge)
- Season and age group context selection
- Web UI upload page (drag-and-drop + file picker)
- API upload endpoint
- Persist parsed tournament_results to database

**Out of Scope:**

- CSV match data ingestion implementation (architecture only, defer to future feature)
- Actual match record creation (no match data source yet)
- Summary column import (all aggregates recomputed)
- Automated file watching or scheduled imports
- Auth/permissions on upload endpoint (deferred)
- Multi-sheet parsing within a single .xlsx file
- Age group inference from file content

### Technical Considerations

- **Excel parsing**: `xlsx` (SheetJS) library for reading .xlsx files
- **CSV parsing**: `csv-parse` for streaming CSV parsing (future match data)
- **Validation**: Zod schemas for type/constraint validation, custom business rules for cross-field checks
- **Database operations**: Supabase JS client with transactions for atomic replace-mode imports
- **File handling**: SvelteKit form actions for file upload, +server.ts endpoint for API
- **Adaptive parser**: Scan Row 2 for "Div" patterns to find tournament start columns, extract tournament name from Row 1, skip columns where Row 2 has no Div/Fin/Tot sub-headers
- **Identity resolution**: Fuzzy matching (Levenshtein or similar) for suggesting existing team/tournament matches
- **Error preview**: Structured error objects attached to parsed rows, rendered in a data table with error indicators
