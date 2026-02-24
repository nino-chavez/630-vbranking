import { describe, it, expect } from 'vitest';
import {
	assembleExportRows,
	getColumnHeaders,
	rowToValues,
	buildMetadataLines,
	buildOverrideSummary,
} from '../export-data.js';
import type { NormalizedTeamResult } from '../../ranking/types.js';
import type { OverrideData } from '../../ranking/table-utils.js';
import type { ExportMetadata, ExportOptions } from '../types.js';

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
	C: { name: 'Charlie Eagles', region: 'West' },
};

const seedingFactors: Record<string, { win_pct: number; best_national_finish: number | null }> = {
	A: { win_pct: 62.5, best_national_finish: 3 },
	B: { win_pct: 33.3, best_national_finish: null },
	C: { win_pct: 50.0, best_national_finish: 1 },
};

const results: NormalizedTeamResult[] = [
	makeResult('A', 2, 78.5),
	makeResult('B', 3, 45.2),
	makeResult('C', 1, 92.1),
];

describe('assembleExportRows', () => {
	it('sorts rows by final rank', () => {
		const rows = assembleExportRows(
			results,
			teams,
			seedingFactors,
			{},
			{ includeAlgorithmBreakdowns: false },
		);
		expect(rows.map((r) => r.final_rank)).toEqual([1, 2, 3]);
		expect(rows.map((r) => r.team_name)).toEqual(['Charlie Eagles', 'Alpha Wolves', 'Bravo Hawks']);
	});

	it('populates override fields when overrides exist', () => {
		const overrides: Record<string, OverrideData> = {
			B: {
				original_rank: 3,
				final_rank: 1,
				justification: 'Strong nationals',
				committee_member: 'Jane',
			},
		};

		const rows = assembleExportRows(results, teams, seedingFactors, overrides, {
			includeAlgorithmBreakdowns: false,
		});

		// B is now rank 1 due to override
		expect(rows[0].team_name).toBe('Bravo Hawks');
		expect(rows[0].final_rank).toBe(1);
		expect(rows[0].override_original_rank).toBe(3);
		expect(rows[0].override_justification).toBe('Strong nationals');
		expect(rows[0].override_committee_member).toBe('Jane');

		// C has no override fields
		expect(rows[1].override_original_rank).toBeUndefined();
	});

	it('includes algorithm breakdowns when option is set', () => {
		const rows = assembleExportRows(
			results,
			teams,
			seedingFactors,
			{},
			{ includeAlgorithmBreakdowns: true },
		);
		expect(rows[0].algo1_rating).toBe(80);
		expect(rows[0].algo5_rank).toBeDefined();
	});

	it('excludes algorithm breakdowns when option is false', () => {
		const rows = assembleExportRows(
			results,
			teams,
			seedingFactors,
			{},
			{ includeAlgorithmBreakdowns: false },
		);
		expect(rows[0].algo1_rating).toBeUndefined();
		expect(rows[0].algo5_rank).toBeUndefined();
	});

	it('handles empty results', () => {
		const rows = assembleExportRows(
			[],
			teams,
			seedingFactors,
			{},
			{ includeAlgorithmBreakdowns: false },
		);
		expect(rows).toEqual([]);
	});

	it('populates seeding factors', () => {
		const rows = assembleExportRows(
			results,
			teams,
			seedingFactors,
			{},
			{ includeAlgorithmBreakdowns: false },
		);
		const alpha = rows.find((r) => r.team_name === 'Alpha Wolves')!;
		expect(alpha.win_pct).toBe(62.5);
		expect(alpha.best_national_finish).toBe(3);
	});

	it('handles missing seeding factors gracefully', () => {
		const rows = assembleExportRows(results, teams, {}, {}, { includeAlgorithmBreakdowns: false });
		expect(rows[0].win_pct).toBeNull();
		expect(rows[0].best_national_finish).toBeNull();
	});
});

describe('getColumnHeaders', () => {
	it('returns summary headers without breakdowns', () => {
		const headers = getColumnHeaders({ includeAlgorithmBreakdowns: false }, false);
		expect(headers).toEqual([
			'Final Rank',
			'Team',
			'Region',
			'Agg Rating',
			'Agg Rank',
			'Win %',
			'Best National Finish',
		]);
	});

	it('includes algo columns when breakdowns enabled', () => {
		const headers = getColumnHeaders({ includeAlgorithmBreakdowns: true }, false);
		expect(headers).toContain('Algo 1 Rating');
		expect(headers).toContain('Algo 5 Rank');
		expect(headers.length).toBe(7 + 10); // 7 base + 5*2 algo
	});

	it('includes override columns when overrides exist', () => {
		const headers = getColumnHeaders({ includeAlgorithmBreakdowns: false }, true);
		expect(headers).toContain('Override Original Rank');
		expect(headers).toContain('Override Justification');
		expect(headers).toContain('Override Committee Member');
	});
});

describe('rowToValues', () => {
	it('matches header count for summary mode', () => {
		const options: ExportOptions = { includeAlgorithmBreakdowns: false };
		const rows = assembleExportRows(results, teams, seedingFactors, {}, options);
		const headers = getColumnHeaders(options, false);
		const values = rowToValues(rows[0], options, false);
		expect(values.length).toBe(headers.length);
	});

	it('matches header count for detailed mode with overrides', () => {
		const options: ExportOptions = { includeAlgorithmBreakdowns: true };
		const overrides: Record<string, OverrideData> = {
			B: { original_rank: 3, final_rank: 1, justification: 'Test', committee_member: 'Admin' },
		};
		const rows = assembleExportRows(results, teams, seedingFactors, overrides, options);
		const headers = getColumnHeaders(options, true);
		const values = rowToValues(rows[0], options, true);
		expect(values.length).toBe(headers.length);
	});
});

describe('buildMetadataLines', () => {
	it('returns all metadata fields', () => {
		const meta: ExportMetadata = {
			season_name: '2025-2026',
			age_group: '18U',
			ran_at: '2026-02-24T12:00:00Z',
			teams_ranked: 50,
			run_status: 'finalized',
			exported_at: '2026-02-24T13:00:00Z',
		};

		const lines = buildMetadataLines(meta);
		expect(lines).toHaveLength(6);
		expect(lines[0]).toContain('2025-2026');
		expect(lines[1]).toContain('18U');
		expect(lines[4]).toContain('finalized');
	});
});

describe('buildOverrideSummary', () => {
	it('lists overrides sorted by final rank', () => {
		const overrides: Record<string, OverrideData> = {
			A: { original_rank: 2, final_rank: 5, justification: 'Moved down', committee_member: 'Jane' },
			B: { original_rank: 3, final_rank: 1, justification: 'Promoted', committee_member: 'Bob' },
		};

		const summary = buildOverrideSummary(overrides, teams);
		expect(summary).toHaveLength(2);
		expect(summary[0].team_name).toBe('Bravo Hawks');
		expect(summary[0].final_rank).toBe(1);
		expect(summary[1].team_name).toBe('Alpha Wolves');
		expect(summary[1].final_rank).toBe(5);
	});

	it('returns empty array when no overrides', () => {
		const summary = buildOverrideSummary({}, teams);
		expect(summary).toEqual([]);
	});
});
