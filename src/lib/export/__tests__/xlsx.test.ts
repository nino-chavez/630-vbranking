import { describe, it, expect } from 'vitest';
import { generateXlsx } from '../xlsx.js';
import { assembleExportRows } from '../export-data.js';
import type { NormalizedTeamResult } from '../../ranking/types.js';
import type { OverrideData } from '../../ranking/table-utils.js';
import type { ExportMetadata } from '../types.js';
import * as XLSX from 'xlsx';

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

const metadata: ExportMetadata = {
	season_name: '2025-2026',
	age_group: '18U',
	ran_at: '2026-02-24T12:00:00Z',
	teams_ranked: 3,
	run_status: 'draft',
	exported_at: '2026-02-24T13:00:00Z',
};

describe('generateXlsx', () => {
	it('creates a workbook with a Rankings sheet', async () => {
		const rows = assembleExportRows(
			results,
			teams,
			seedingFactors,
			{},
			{ includeAlgorithmBreakdowns: false },
		);
		const buffer = await generateXlsx(rows, metadata, {}, teams, {
			includeAlgorithmBreakdowns: false,
		});

		const wb = XLSX.read(buffer, { type: 'array' });
		expect(wb.SheetNames).toContain('Rankings');
	});

	it('has correct row count in Rankings sheet', async () => {
		const rows = assembleExportRows(
			results,
			teams,
			seedingFactors,
			{},
			{ includeAlgorithmBreakdowns: false },
		);
		const buffer = await generateXlsx(rows, metadata, {}, teams, {
			includeAlgorithmBreakdowns: false,
		});

		const wb = XLSX.read(buffer, { type: 'array' });
		const ws = wb.Sheets['Rankings'];
		const sheetData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[][];

		// 6 metadata lines + 1 blank + 1 header + 3 data rows = 11
		expect(sheetData.length).toBe(11);
	});

	it('does not include Overrides sheet when no overrides', async () => {
		const rows = assembleExportRows(
			results,
			teams,
			seedingFactors,
			{},
			{ includeAlgorithmBreakdowns: false },
		);
		const buffer = await generateXlsx(rows, metadata, {}, teams, {
			includeAlgorithmBreakdowns: false,
		});

		const wb = XLSX.read(buffer, { type: 'array' });
		expect(wb.SheetNames).not.toContain('Overrides');
	});

	it('includes Overrides sheet when overrides exist', async () => {
		const overrides: Record<string, OverrideData> = {
			B: { original_rank: 3, final_rank: 1, justification: 'Promoted', committee_member: 'Jane' },
		};

		const rows = assembleExportRows(results, teams, seedingFactors, overrides, {
			includeAlgorithmBreakdowns: false,
		});
		const buffer = await generateXlsx(rows, metadata, overrides, teams, {
			includeAlgorithmBreakdowns: false,
		});

		const wb = XLSX.read(buffer, { type: 'array' });
		expect(wb.SheetNames).toContain('Overrides');

		const ows = wb.Sheets['Overrides'];
		const overrideData = XLSX.utils.sheet_to_json(ows, { header: 1 }) as unknown[][];
		// 1 header + 1 data row = 2
		expect(overrideData.length).toBe(2);
	});

	it('returns an ArrayBuffer', async () => {
		const rows = assembleExportRows(
			results,
			teams,
			seedingFactors,
			{},
			{ includeAlgorithmBreakdowns: false },
		);
		const buffer = await generateXlsx(rows, metadata, {}, teams, {
			includeAlgorithmBreakdowns: false,
		});

		expect(buffer).toBeInstanceOf(ArrayBuffer);
	});
});
