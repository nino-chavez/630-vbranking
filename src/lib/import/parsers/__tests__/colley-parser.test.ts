import { describe, it, expect, beforeAll } from 'vitest';
import XLSX from 'xlsx';
import { ColleyParser } from '../colley-parser.js';

/**
 * Build a minimal Colley test fixture .xlsx buffer.
 *
 * 5 teams, all 16 columns populated:
 *   Team, teamcode, Wins, Losses,
 *   Algo1Rating, Algo1Rank, Algo2Rating, Algo2Rank,
 *   Algo3Rating, Algo3Rank, Algo4Rating, Algo4Rank,
 *   Algo5Rating, Algo5Rank, AggRating, AggRank
 */
function buildColleyFixture(): ArrayBuffer {
	const header = [
		'Team',
		'teamcode',
		'Wins',
		'Losses',
		'Algo1Rating',
		'Algo1Rank',
		'Algo2Rating',
		'Algo2Rank',
		'Algo3Rating',
		'Algo3Rank',
		'Algo4Rating',
		'Algo4Rank',
		'Algo5Rating',
		'Algo5Rank',
		'AggRating',
		'AggRank',
	];

	const data: (string | number)[][] = [
		['Alpha', 'ALP', 20, 5, 0.85, 1, 0.82, 2, 0.9, 1, 0.88, 1, 0.79, 3, 0.848, 1],
		['Bravo', 'BRV', 18, 7, 0.78, 2, 0.84, 1, 0.75, 3, 0.8, 2, 0.82, 1, 0.798, 2],
		['Charlie', 'CHL', 15, 10, 0.65, 3, 0.7, 3, 0.68, 4, 0.72, 3, 0.71, 4, 0.692, 3],
		['Delta', 'DLT', 12, 13, 0.55, 4, 0.58, 4, 0.8, 2, 0.6, 4, 0.62, 5, 0.63, 4],
		['Echo', 'ECH', 8, 17, 0.4, 5, 0.42, 5, 0.45, 5, 0.38, 5, 0.8, 2, 0.49, 5],
	];

	const aoa = [header, ...data];
	const ws = XLSX.utils.aoa_to_sheet(aoa);
	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, 'Colley');

	return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
}

/**
 * Build a Colley fixture with one row that has non-numeric values in rating/rank columns.
 */
function buildColleyFixtureWithErrors(): ArrayBuffer {
	const header = [
		'Team',
		'teamcode',
		'Wins',
		'Losses',
		'Algo1Rating',
		'Algo1Rank',
		'Algo2Rating',
		'Algo2Rank',
		'Algo3Rating',
		'Algo3Rank',
		'Algo4Rating',
		'Algo4Rank',
		'Algo5Rating',
		'Algo5Rank',
		'AggRating',
		'AggRank',
	];

	const data: (string | number)[][] = [
		['Alpha', 'ALP', 20, 5, 0.85, 1, 0.82, 2, 0.9, 1, 0.88, 1, 0.79, 3, 0.848, 1],
		[
			'BadTeam',
			'BAD',
			10,
			3,
			'N/A' as unknown as number,
			'abc' as unknown as number,
			0.82,
			2,
			0.9,
			1,
			0.88,
			1,
			0.79,
			3,
			0.848,
			1,
		],
	];

	const aoa = [header, ...data];
	const ws = XLSX.utils.aoa_to_sheet(aoa);
	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, 'Colley');

	return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
}

describe('ColleyParser', () => {
	let buffer: ArrayBuffer;
	let parser: ColleyParser;

	beforeAll(() => {
		buffer = buildColleyFixture();
		parser = new ColleyParser();
	});

	it('correctly maps all 16 columns to ParsedColleyRow fields', () => {
		const result = parser.parse(buffer);

		expect(result.rows).toHaveLength(5);
		expect(result.errors).toHaveLength(0);

		// Verify first row (Alpha)
		const alpha = result.rows[0];
		expect(alpha.teamName).toBe('Alpha');
		expect(alpha.teamCode).toBe('ALP');
		expect(alpha.wins).toBe(20);
		expect(alpha.losses).toBe(5);
		expect(alpha.algo1Rating).toBeCloseTo(0.85);
		expect(alpha.algo1Rank).toBe(1);
		expect(alpha.algo2Rating).toBeCloseTo(0.82);
		expect(alpha.algo2Rank).toBe(2);
		expect(alpha.algo3Rating).toBeCloseTo(0.9);
		expect(alpha.algo3Rank).toBe(1);
		expect(alpha.algo4Rating).toBeCloseTo(0.88);
		expect(alpha.algo4Rank).toBe(1);
		expect(alpha.algo5Rating).toBeCloseTo(0.79);
		expect(alpha.algo5Rank).toBe(3);
		expect(alpha.aggRating).toBeCloseTo(0.848);
		expect(alpha.aggRank).toBe(1);

		// Verify last row (Echo)
		const echo = result.rows[4];
		expect(echo.teamName).toBe('Echo');
		expect(echo.teamCode).toBe('ECH');
		expect(echo.wins).toBe(8);
		expect(echo.losses).toBe(17);
		expect(echo.algo5Rating).toBeCloseTo(0.8);
		expect(echo.algo5Rank).toBe(2);
		expect(echo.aggRating).toBeCloseTo(0.49);
		expect(echo.aggRank).toBe(5);
	});

	it('flags errors for rows with non-numeric values in rating/rank columns', () => {
		const errorBuffer = buildColleyFixtureWithErrors();
		const result = parser.parse(errorBuffer);

		// Both Alpha and BadTeam are included -- optional field errors don't exclude the row
		expect(result.rows).toHaveLength(2);
		expect(result.rows[0].teamName).toBe('Alpha');
		expect(result.rows[1].teamName).toBe('BadTeam');

		// BadTeam's non-numeric optional fields are set to null
		expect(result.rows[1].algo1Rating).toBeNull();
		expect(result.rows[1].algo1Rank).toBeNull();

		// Errors are flagged for the non-numeric values
		const algoErrors = result.errors.filter(
			(e) => e.column === 'Algo1Rating' || e.column === 'Algo1Rank',
		);
		expect(algoErrors.length).toBeGreaterThanOrEqual(1);
		expect(algoErrors.some((e) => e.message.includes('Non-numeric'))).toBe(true);
	});

	it('skips the header row and parses only data rows', () => {
		const result = parser.parse(buffer);

		// 5 data rows, header row skipped
		expect(result.rows).toHaveLength(5);
		expect(result.metadata.totalRowsParsed).toBe(5);

		// No row should have the header values as team name
		const teamNames = result.rows.map((r) => r.teamName);
		expect(teamNames).not.toContain('Team');
		expect(teamNames).not.toContain('teamcode');
	});
});
