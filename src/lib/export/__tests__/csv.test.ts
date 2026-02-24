import { describe, it, expect } from 'vitest';
import { generateCsv } from '../csv.js';
import { assembleExportRows } from '../export-data.js';
import type { NormalizedTeamResult } from '../../ranking/types.js';
import type { OverrideData } from '../../ranking/table-utils.js';
import type { ExportMetadata } from '../types.js';

function makeResult(teamId: string, aggRank: number, aggRating: number): NormalizedTeamResult {
	return {
		team_id: teamId,
		algo1_rating: 80,
		algo1_rank: aggRank,
		algo2_rating: 75,
		algo2_rank: aggRank,
		algo3_rating: 70,
		algo3_rank: aggRank,
		algo4_rating: 65,
		algo4_rank: aggRank,
		algo5_rating: 60,
		algo5_rank: aggRank,
		agg_rating: aggRating,
		agg_rank: aggRank,
	};
}

const teams: Record<string, { name: string; region: string }> = {
	A: { name: 'Alpha Wolves', region: 'Midwest' },
	B: { name: 'Bravo Hawks', region: 'East' },
};

const seedingFactors: Record<string, { win_pct: number; best_national_finish: number | null }> = {
	A: { win_pct: 62.5, best_national_finish: 3 },
	B: { win_pct: 33.3, best_national_finish: null },
};

const results: NormalizedTeamResult[] = [makeResult('A', 1, 78.5), makeResult('B', 2, 45.2)];

const metadata: ExportMetadata = {
	season_name: '2025-2026',
	age_group: '18U',
	ran_at: '2026-02-24T12:00:00Z',
	teams_ranked: 2,
	run_status: 'draft',
	exported_at: '2026-02-24T13:00:00Z',
};

describe('generateCsv', () => {
	it('includes metadata comment lines', () => {
		const rows = assembleExportRows(
			results,
			teams,
			seedingFactors,
			{},
			{ includeAlgorithmBreakdowns: false },
		);
		const csv = generateCsv(rows, metadata, {}, teams, { includeAlgorithmBreakdowns: false });

		const lines = csv.split('\n');
		const commentLines = lines.filter((l) => l.startsWith('#'));
		expect(commentLines.length).toBeGreaterThanOrEqual(6);
		expect(commentLines[0]).toContain('Season: 2025-2026');
	});

	it('has correct header row', () => {
		const rows = assembleExportRows(
			results,
			teams,
			seedingFactors,
			{},
			{ includeAlgorithmBreakdowns: false },
		);
		const csv = generateCsv(rows, metadata, {}, teams, { includeAlgorithmBreakdowns: false });

		const lines = csv.split('\n');
		const headerLine = lines.find((l) => l.startsWith('Final Rank'));
		expect(headerLine).toBeDefined();
		expect(headerLine).toContain('Team');
		expect(headerLine).toContain('Region');
	});

	it('properly quotes values with commas', () => {
		const commaTeams = {
			...teams,
			A: { name: 'Alpha, Wolves', region: 'Midwest' },
		};

		const rows = assembleExportRows(
			results,
			commaTeams,
			seedingFactors,
			{},
			{ includeAlgorithmBreakdowns: false },
		);
		const csv = generateCsv(rows, metadata, {}, commaTeams, { includeAlgorithmBreakdowns: false });

		expect(csv).toContain('"Alpha, Wolves"');
	});

	it('properly escapes values with double quotes', () => {
		const quoteTeams = {
			...teams,
			A: { name: 'Alpha "The Best" Wolves', region: 'Midwest' },
		};

		const rows = assembleExportRows(
			results,
			quoteTeams,
			seedingFactors,
			{},
			{ includeAlgorithmBreakdowns: false },
		);
		const csv = generateCsv(rows, metadata, {}, quoteTeams, { includeAlgorithmBreakdowns: false });

		expect(csv).toContain('"Alpha ""The Best"" Wolves"');
	});

	it('appends override summary when overrides exist', () => {
		const overrides: Record<string, OverrideData> = {
			B: {
				original_rank: 2,
				final_rank: 1,
				justification: 'Strong finish',
				committee_member: 'Jane',
			},
		};

		const rows = assembleExportRows(results, teams, seedingFactors, overrides, {
			includeAlgorithmBreakdowns: false,
		});
		const csv = generateCsv(rows, metadata, overrides, teams, {
			includeAlgorithmBreakdowns: false,
		});

		expect(csv).toContain('# Override Summary');
		expect(csv).toContain('Bravo Hawks');
		expect(csv).toContain('Strong finish');
	});

	it('omits override summary when no overrides', () => {
		const rows = assembleExportRows(
			results,
			teams,
			seedingFactors,
			{},
			{ includeAlgorithmBreakdowns: false },
		);
		const csv = generateCsv(rows, metadata, {}, teams, { includeAlgorithmBreakdowns: false });

		expect(csv).not.toContain('Override Summary');
	});

	it('includes data rows with correct values', () => {
		const rows = assembleExportRows(
			results,
			teams,
			seedingFactors,
			{},
			{ includeAlgorithmBreakdowns: false },
		);
		const csv = generateCsv(rows, metadata, {}, teams, { includeAlgorithmBreakdowns: false });

		const lines = csv.split('\n').filter((l) => !l.startsWith('#') && l.trim() !== '');
		// First non-comment, non-empty line is the header, then data rows
		const dataLines = lines.slice(1);
		expect(dataLines.length).toBe(2);
		expect(dataLines[0]).toContain('Alpha Wolves');
	});
});
