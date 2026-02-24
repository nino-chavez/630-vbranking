# Implementation Report: Task Group 1 -- Parsing & Types Layer

**Date:** 2026-02-23
**Implementer:** api-engineer
**Status:** Complete -- all 8 sub-tasks implemented, all 8 tests passing

---

## Sub-task Summary

### 1.1 Shared Import Types

**File:** `src/lib/import/types.ts`

Defined and exported all shared types:

| Type                     | Description                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------- |
| `ImportFormat`           | `'finishes' \| 'colley'` union type                                                               |
| `ImportMode`             | `'replace' \| 'merge'` union type                                                                 |
| `ParsedFinishesRow`      | Row shape for parsed Finishes spreadsheet data                                                    |
| `ParsedColleyRow`        | Row shape for parsed Colley spreadsheet data (16 fields including 5 algo rating/rank pairs + agg) |
| `ParseError`             | Error attached to a specific cell with row, column, message, and severity                         |
| `IdentityConflict`       | Unmatched entity with fuzzy-match suggestions                                                     |
| `ParseResult<T>`         | Generic result container with rows, errors, identity conflicts, and metadata                      |
| `IdentityMapping`        | User resolution for a conflict (create/map/skip)                                                  |
| `ImportSummaryData`      | Post-import summary statistics                                                                    |
| `FileParserInterface<T>` | Generic interface with `parse(buffer, options?)` method                                           |

### 1.2 Finishes Parser

**File:** `src/lib/import/parsers/finishes-parser.ts`

The `FinishesParser` class implements `FileParserInterface<ParsedFinishesRow>` with:

- **Row 1 scanning:** Iterates merged cell ranges (`sheet['!merges']`) to build a column-to-tournament-name map. For merged cells, reads the value from the leftmost cell and assigns it to all columns in the range. Non-merged cells in Row 1 are also captured.
- **Row 2 scanning:** Starting at column 10, scans for consecutive `Div`/`Fin`/`Tot` triplets (case-insensitive). Only triplets with a corresponding Row 1 tournament name become valid `TournamentTriplet` entries. Padding columns (empty Row 2 cells) and header-only tournaments (Row 1 name but no Row 2 Div/Fin/Tot) are skipped.
- **Row 3+ parsing:** For each data row, extracts team name (col 0) and code (col 1). For each detected triplet, reads division/finish/total. Skips triplets where both Fin and Tot are empty (team didn't attend). Reports errors for missing team name/code, non-integer Fin values, and non-integer Tot values.
- **Trailing columns:** The last 5 columns are excluded from triplet scanning.

### 1.3 Colley Parser

**File:** `src/lib/import/parsers/colley-parser.ts`

The `ColleyParser` class implements `FileParserInterface<ParsedColleyRow>` with:

- Fixed 16-column mapping (0=Team through 15=AggRank).
- Skips the header row (row index 0).
- Required fields (Team, teamcode, Wins, Losses) cause the row to be skipped on error.
- Optional fields (all rating/rank columns) produce errors but still include the row with `null` values for the errored fields.

### 1.4 MatchFileParser Interface

**File:** `src/lib/import/parsers/match-parser.ts`

- Defined `ParsedMatchRow` type with `teamA`, `teamB`, `winner`, `tournament` fields.
- Defined `MatchFileParser` interface extending `FileParserInterface<ParsedMatchRow>`.
- Architecture-only: no implementation class. JSDoc documents expected CSV columns.

### 1.5 Parser Barrel Export

**File:** `src/lib/import/parsers/index.ts`

- Re-exports `FinishesParser`, `ColleyParser`, `MatchFileParser`, and `ParsedMatchRow`.
- Exports `getParser(format: ImportFormat)` factory function that returns the correct parser instance.

### 1.6 Test Fixtures

**Directory:** `src/lib/import/__fixtures__/`

- `finishes-test-fixture.xlsx` -- 5 teams, 2 valid tournaments + 1 header-only tournament + padding columns + merged cells + trailing summary columns.
- `colley-test-fixture.xlsx` -- 5 teams, all 16 columns populated.
- `create-fixtures.ts` -- Script to regenerate fixtures (also used as documentation).
- Fixtures are also built programmatically inside the test files via `XLSX.utils.aoa_to_sheet()` and `XLSX.write()`.

### 1.7 Finishes Parser Tests (5 tests)

**File:** `src/lib/import/parsers/__tests__/finishes-parser.test.ts`

| #   | Test                                 | Assertion                                                            |
| --- | ------------------------------------ | -------------------------------------------------------------------- |
| 1   | Detects tournament column boundaries | 2 valid tournaments detected, "Fake Event" skipped                   |
| 2   | Extracts team name and code          | All 5 teams present in parsed rows                                   |
| 3   | Skips padding columns                | No phantom tournaments; only "AZ Region #1" and "CA Invitational"    |
| 4   | Handles merged cells in Row 1        | Tournament names read from leftmost cell of merge range              |
| 5   | Skips empty Fin/Tot pairs            | Bravo has 1 row (AZ only), Charlie has 1 row (CA only), total 8 rows |

### 1.8 Colley Parser Tests (3 tests)

**File:** `src/lib/import/parsers/__tests__/colley-parser.test.ts`

| #   | Test                     | Assertion                                                                             |
| --- | ------------------------ | ------------------------------------------------------------------------------------- |
| 1   | Maps all 16 columns      | All rating/rank values match fixture data for Alpha and Echo                          |
| 2   | Flags non-numeric errors | Non-numeric Algo1Rating/Algo1Rank produce errors; row still included with null values |
| 3   | Skips header row         | 5 data rows parsed; no row has "Team" as teamName                                     |

---

## Test Results

```
 PASS  src/lib/import/parsers/__tests__/finishes-parser.test.ts (5 tests)
 PASS  src/lib/import/parsers/__tests__/colley-parser.test.ts (3 tests)

 Test Files  2 passed (2)
       Tests  8 passed (8)
   Duration  198ms
```

---

## Dependencies Installed

- `xlsx` (SheetJS) -- added as devDependency for Excel file parsing

## Configuration Changes

- `vite.config.ts` -- Updated import from `'vite'` to `'vitest/config'` and added `test.include` glob pattern for test discovery.

## File Inventory

| File                                                       | Lines | Purpose                                       |
| ---------------------------------------------------------- | ----- | --------------------------------------------- |
| `src/lib/import/types.ts`                                  | 96    | Shared types and interfaces                   |
| `src/lib/import/parsers/finishes-parser.ts`                | 189   | Adaptive Finishes Excel parser                |
| `src/lib/import/parsers/colley-parser.ts`                  | 176   | Fixed-column Colley Excel parser              |
| `src/lib/import/parsers/match-parser.ts`                   | 28    | MatchFileParser interface (architecture only) |
| `src/lib/import/parsers/index.ts`                          | 27    | Barrel exports + getParser factory            |
| `src/lib/import/__fixtures__/create-fixtures.ts`           | 99    | Fixture generation script                     |
| `src/lib/import/__fixtures__/finishes-test-fixture.xlsx`   | --    | Binary fixture file                           |
| `src/lib/import/__fixtures__/colley-test-fixture.xlsx`     | --    | Binary fixture file                           |
| `src/lib/import/parsers/__tests__/finishes-parser.test.ts` | 133   | 5 Finishes parser tests                       |
| `src/lib/import/parsers/__tests__/colley-parser.test.ts`   | 139   | 3 Colley parser tests                         |

## Design Decisions

1. **Optional field error handling in ColleyParser:** Non-numeric values in optional rating/rank columns produce errors but do NOT exclude the row. The row is included with `null` for the errored field. This allows downstream systems to decide whether to reject or accept the row.

2. **Fixture generation approach:** Test fixtures are created programmatically inside each test file using `XLSX.utils.aoa_to_sheet()` + `XLSX.write()`. This avoids binary fixture files as a hard dependency for tests. Physical `.xlsx` files are also generated for manual inspection and potential use by other task groups.

3. **Trailing column exclusion:** The parser uses `range.e.c - 5` to determine the last data column, matching the spec's requirement to ignore the 5 trailing summary columns.

4. **Triplet scanning start column:** The scanner starts at column 10 per spec (columns 0-9 are team-level data). This avoids false positives from team-level column headers.
