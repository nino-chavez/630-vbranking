import { describe, it, expect } from 'vitest';
import XLSX from 'xlsx';
import { FinishesParser } from '../finishes-parser.js';
import { ColleyParser } from '../colley-parser.js';

/**
 * Malformed File Handling Tests (Task Group 4, Sub-task 4.3)
 *
 * These tests verify that the parsers handle edge-case and malformed
 * spreadsheets gracefully -- returning empty results or warnings
 * rather than throwing exceptions.
 */

describe('FinishesParser: malformed file handling', () => {
  it('handles an empty spreadsheet (no data rows) without throwing and returns 0 rows', () => {
    // Arrange: a workbook with a single completely empty sheet
    const ws = XLSX.utils.aoa_to_sheet([]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    // Act
    const parser = new FinishesParser();
    const result = parser.parse(buffer);

    // Assert: no rows, no errors, does not throw
    expect(result.rows).toHaveLength(0);
    expect(result.metadata.totalRowsParsed).toBe(0);
    expect(result.metadata.tournamentsDetected).toHaveLength(0);
  });

  it('handles a spreadsheet where Row 2 has no Div/Fin/Tot patterns and returns 0 rows with a warning', () => {
    // Arrange: a workbook with tournament headers in Row 1 but no
    // recognizable Div/Fin/Tot sub-headers in Row 2
    const row1: (string | null)[] = [];
    const row2: (string | null)[] = [];

    // Columns 0-1: Team headers
    row1[0] = 'Team Name';
    row1[1] = 'Code';
    row2[0] = null;
    row2[1] = null;

    // Fill columns 2-9 with nulls (standard team-level columns)
    for (let i = 2; i <= 9; i++) {
      row1[i] = null;
      row2[i] = null;
    }

    // Columns 10-12: A tournament header but NO Div/Fin/Tot in Row 2
    row1[10] = 'Some Tournament';
    row1[11] = null;
    row1[12] = null;
    row2[10] = 'X';   // Not "Div"
    row2[11] = 'Y';   // Not "Fin"
    row2[12] = 'Z';   // Not "Tot"

    // Add 5 trailing summary columns (which the parser expects to skip)
    for (let i = 13; i <= 17; i++) {
      row1[i] = `Summary${i}`;
      row2[i] = null;
    }

    // Add a data row so we can confirm it doesn't produce parsed rows
    const dataRow: (string | number | null)[] = [
      'Alpha', 'ALP', null, null, null, null, null, null, null, null,
      '18O', 3, 24,
      null, null, null, null, null,
    ];

    const aoa = [row1, row2, dataRow];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    // Act
    const parser = new FinishesParser();
    const result = parser.parse(buffer);

    // Assert: no tournament triplets detected, therefore 0 parsed data rows
    expect(result.rows).toHaveLength(0);
    expect(result.metadata.tournamentsDetected).toHaveLength(0);
  });
});

describe('ColleyParser: malformed file handling', () => {
  it('handles a header-only spreadsheet and returns 0 rows', () => {
    // Arrange: workbook with only the header row, no data rows
    const header = [
      'Team', 'teamcode', 'Wins', 'Losses',
      'Algo1Rating', 'Algo1Rank', 'Algo2Rating', 'Algo2Rank',
      'Algo3Rating', 'Algo3Rank', 'Algo4Rating', 'Algo4Rank',
      'Algo5Rating', 'Algo5Rank', 'AggRating', 'AggRank',
    ];

    const ws = XLSX.utils.aoa_to_sheet([header]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Colley');
    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    // Act
    const parser = new ColleyParser();
    const result = parser.parse(buffer);

    // Assert: header is skipped, no data rows parsed
    expect(result.rows).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
    expect(result.metadata.totalRowsParsed).toBe(0);
  });
});
