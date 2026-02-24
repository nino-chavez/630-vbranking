import { describe, it, expect, beforeAll } from 'vitest';
import XLSX from 'xlsx';
import { FinishesParser } from '../finishes-parser.js';

/**
 * Build a minimal Finishes test fixture .xlsx buffer.
 *
 * Layout:
 *   - 5 teams (rows 3-7, i.e., row index 2-6)
 *   - 3 "tournament headers" in Row 1:
 *       1) "AZ Region #1" at columns 10-12 (valid -- has Div/Fin/Tot in Row 2)
 *       2) "CA Invitational" at columns 13-15 (3 empty padding columns, then valid triplet at 16-18)
 *          Wait -- let's make it cleaner:
 *       Actually:
 *       Columns 10-12: "AZ Region #1" with Div/Fin/Tot -- valid tournament
 *       Columns 13-15: 3 empty padding columns (no header, no sub-headers)
 *       Columns 16-18: "CA Invitational" with Div/Fin/Tot -- valid tournament
 *       Columns 19-21: "Fake Event" header in Row 1 but NO Div/Fin/Tot in Row 2 -- skipped
 *       Columns 22-26: 5 trailing summary columns (ignored)
 *
 *   - Team "Alpha" attends both tournaments
 *   - Team "Bravo" attends only AZ Region #1 (empty Fin/Tot for CA Invitational)
 *   - Team "Charlie" attends only CA Invitational
 *   - Team "Delta" attends both tournaments
 *   - Team "Echo" attends both tournaments
 */
function buildFinishesFixture(): ArrayBuffer {
  // Row 1: tournament names (with merged cells spanning 3 columns)
  // Row 2: sub-headers
  // Rows 3+: data

  const row1: (string | null)[] = [];
  const row2: (string | null)[] = [];

  // Columns 0-9: Team-level headers
  row1[0] = 'Team Name';
  row1[1] = 'Code';
  for (let i = 2; i <= 9; i++) row1[i] = null;
  row2[0] = null;
  row2[1] = null;
  for (let i = 2; i <= 9; i++) row2[i] = null;

  // Columns 10-12: "AZ Region #1" with Div/Fin/Tot
  row1[10] = 'AZ Region #1';
  row1[11] = null;
  row1[12] = null;
  row2[10] = 'Div';
  row2[11] = 'Fin';
  row2[12] = 'Tot';

  // Columns 13-15: empty padding
  row1[13] = null;
  row1[14] = null;
  row1[15] = null;
  row2[13] = null;
  row2[14] = null;
  row2[15] = null;

  // Columns 16-18: "CA Invitational" with Div/Fin/Tot
  row1[16] = 'CA Invitational';
  row1[17] = null;
  row1[18] = null;
  row2[16] = 'Div';
  row2[17] = 'Fin';
  row2[18] = 'Tot';

  // Columns 19-21: "Fake Event" -- header only, no Div/Fin/Tot
  row1[19] = 'Fake Event';
  row1[20] = null;
  row1[21] = null;
  row2[19] = null;
  row2[20] = null;
  row2[21] = null;

  // Columns 22-26: trailing summary columns
  row1[22] = '# of Qual';
  row1[23] = 'Avg Finish';
  row1[24] = 'Last Result';
  row1[25] = 'Wins vs Field';
  row1[26] = 'Losses vs Field';
  row2[22] = null;
  row2[23] = null;
  row2[24] = null;
  row2[25] = null;
  row2[26] = null;

  // Data rows
  //              [TeamName,   Code,   ...cols 2-9...,           AZ_Div, AZ_Fin, AZ_Tot, pad, pad, pad, CA_Div, CA_Fin, CA_Tot, Fake, Fake, Fake, ...summary...]
  const dataRows: (string | number | null)[][] = [
    ['Alpha',     'ALP',  null, null, null, null, null, null, null, null,  '18O', 3,  24, null, null, null,  '18O', 5,  16, null, null, null,  2, 4.0, 3, 10, 5],
    ['Bravo',     'BRV',  null, null, null, null, null, null, null, null,  '18O', 1,  24, null, null, null,  null,  null, null, null, null, null,  1, 1.0, 1, 20, 3],
    ['Charlie',   'CHL',  null, null, null, null, null, null, null, null,  null,  null, null, null, null, null,  '18O', 2,  16, null, null, null,  1, 2.0, 2, 8, 6],
    ['Delta',     'DLT',  null, null, null, null, null, null, null, null,  '18O', 10, 24, null, null, null,  '18O', 8,  16, null, null, null,  2, 9.0, 8, 5, 10],
    ['Echo',      'ECH',  null, null, null, null, null, null, null, null,  '18O', 5,  24, null, null, null,  '18O', 1,  16, null, null, null,  2, 3.0, 1, 15, 3],
  ];

  const aoa: (string | number | null)[][] = [row1, row2, ...dataRows];

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Add merge ranges for Row 1 tournament headers
  ws['!merges'] = [
    // "AZ Region #1" spans columns 10-12
    { s: { r: 0, c: 10 }, e: { r: 0, c: 12 } },
    // "CA Invitational" spans columns 16-18
    { s: { r: 0, c: 16 }, e: { r: 0, c: 18 } },
    // "Fake Event" spans columns 19-21
    { s: { r: 0, c: 19 }, e: { r: 0, c: 21 } },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Finishes');

  const xlsxBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return xlsxBuffer;
}

describe('FinishesParser', () => {
  let buffer: ArrayBuffer;
  let parser: FinishesParser;

  beforeAll(() => {
    buffer = buildFinishesFixture();
    parser = new FinishesParser();
  });

  it('correctly detects tournament column boundaries from Row 2 Div/Fin/Tot patterns', () => {
    const result = parser.parse(buffer);

    // Should detect 2 valid tournaments, skipping the "Fake Event" header-only tournament
    expect(result.metadata.tournamentsDetected).toHaveLength(2);
    expect(result.metadata.tournamentsDetected).toContain('AZ Region #1');
    expect(result.metadata.tournamentsDetected).toContain('CA Invitational');
    expect(result.metadata.tournamentsDetected).not.toContain('Fake Event');
  });

  it('extracts team name and code from columns 0-1 for every data row', () => {
    const result = parser.parse(buffer);

    const teamNames = [...new Set(result.rows.map((r) => r.teamName))];
    const teamCodes = [...new Set(result.rows.map((r) => r.teamCode))];

    // All 5 teams should appear in the parsed rows
    expect(teamNames).toContain('Alpha');
    expect(teamNames).toContain('Bravo');
    expect(teamNames).toContain('Charlie');
    expect(teamNames).toContain('Delta');
    expect(teamNames).toContain('Echo');

    expect(teamCodes).toContain('ALP');
    expect(teamCodes).toContain('BRV');
    expect(teamCodes).toContain('CHL');
    expect(teamCodes).toContain('DLT');
    expect(teamCodes).toContain('ECH');
  });

  it('skips padding columns without producing phantom tournament entries', () => {
    const result = parser.parse(buffer);

    // No tournament named after padding columns or unknown names
    for (const row of result.rows) {
      expect(row.tournamentName).not.toMatch(/unknown/i);
      expect(row.tournamentName).toBeTruthy();
    }

    // Only "AZ Region #1" and "CA Invitational" should appear as tournament names
    const tournamentNames = [...new Set(result.rows.map((r) => r.tournamentName))];
    expect(tournamentNames.sort()).toEqual(['AZ Region #1', 'CA Invitational']);
  });

  it('handles merged cells in Row 1 -- reads tournament name from leftmost cell', () => {
    const result = parser.parse(buffer);

    // "AZ Region #1" is a merged cell spanning cols 10-12
    const azRows = result.rows.filter((r) => r.tournamentName === 'AZ Region #1');
    expect(azRows.length).toBeGreaterThan(0);

    // "CA Invitational" is a merged cell spanning cols 16-18
    const caRows = result.rows.filter((r) => r.tournamentName === 'CA Invitational');
    expect(caRows.length).toBeGreaterThan(0);

    // Verify specific data from merged-cell tournaments
    const alphaAz = azRows.find((r) => r.teamCode === 'ALP');
    expect(alphaAz).toBeDefined();
    expect(alphaAz!.finishPosition).toBe(3);
    expect(alphaAz!.fieldSize).toBe(24);
  });

  it('skips Fin/Tot pairs where both cells are empty (team did not attend)', () => {
    const result = parser.parse(buffer);

    // Bravo only attended AZ Region #1, NOT CA Invitational
    const bravoRows = result.rows.filter((r) => r.teamCode === 'BRV');
    expect(bravoRows).toHaveLength(1);
    expect(bravoRows[0].tournamentName).toBe('AZ Region #1');

    // Charlie only attended CA Invitational, NOT AZ Region #1
    const charlieRows = result.rows.filter((r) => r.teamCode === 'CHL');
    expect(charlieRows).toHaveLength(1);
    expect(charlieRows[0].tournamentName).toBe('CA Invitational');

    // Total rows: Alpha(2) + Bravo(1) + Charlie(1) + Delta(2) + Echo(2) = 8
    expect(result.rows).toHaveLength(8);
  });
});
