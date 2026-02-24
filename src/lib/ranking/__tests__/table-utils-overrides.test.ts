import { describe, it, expect } from 'vitest';
import { sortResults, computeFinalRanks, type OverrideData } from '../table-utils.js';
import type { NormalizedTeamResult } from '../types.js';

const teams: Record<string, { name: string; region: string }> = {
	A: { name: 'Alpha Wolves', region: 'Midwest' },
	B: { name: 'Bravo Hawks', region: 'East' },
	C: { name: 'Charlie Eagles', region: 'West' },
	D: { name: 'Delta Tigers', region: 'Midwest' },
};

const seedingFactors: Record<string, { win_pct: number }> = {
	A: { win_pct: 62.5 },
	B: { win_pct: 33.3 },
	C: { win_pct: 50.0 },
	D: { win_pct: 75.0 },
};

function makeResult(teamId: string, aggRank: number, aggRating: number): NormalizedTeamResult {
	return {
		team_id: teamId,
		algo1_rating: 0,
		algo1_rank: 0,
		algo2_rating: 0,
		algo2_rank: 0,
		algo3_rating: 0,
		algo3_rank: 0,
		algo4_rating: 0,
		algo4_rank: 0,
		algo5_rating: 0,
		algo5_rank: 0,
		agg_rating: aggRating,
		agg_rank: aggRank,
	};
}

const results: NormalizedTeamResult[] = [
	makeResult('A', 2, 78.5),
	makeResult('B', 4, 45.2),
	makeResult('C', 1, 92.1),
	makeResult('D', 3, 60.0),
];

describe('computeFinalRanks', () => {
	it('returns agg_rank for teams without overrides', () => {
		const finalRanks = computeFinalRanks(results, {});
		expect(finalRanks).toEqual({
			A: 2,
			B: 4,
			C: 1,
			D: 3,
		});
	});

	it('returns override final_rank for teams with overrides', () => {
		const overrides: Record<string, OverrideData> = {
			B: {
				original_rank: 4,
				final_rank: 2,
				justification: 'Strong recent performance and close matches',
				committee_member: 'Coach Smith',
			},
		};
		const finalRanks = computeFinalRanks(results, overrides);
		expect(finalRanks.B).toBe(2);
		expect(finalRanks.A).toBe(2); // unchanged (same as agg_rank)
		expect(finalRanks.C).toBe(1);
		expect(finalRanks.D).toBe(3);
	});

	it('handles multiple overrides', () => {
		const overrides: Record<string, OverrideData> = {
			A: {
				original_rank: 2,
				final_rank: 1,
				justification: 'Appeal accepted -- head-to-head advantage',
				committee_member: 'Committee Chair',
			},
			C: {
				original_rank: 1,
				final_rank: 3,
				justification: 'Key player injury for remainder of season',
				committee_member: 'Committee Chair',
			},
		};
		const finalRanks = computeFinalRanks(results, overrides);
		expect(finalRanks.A).toBe(1);
		expect(finalRanks.C).toBe(3);
		expect(finalRanks.B).toBe(4);
		expect(finalRanks.D).toBe(3);
	});
});

describe('sortResults with final_rank', () => {
	it('sorts by final_rank ascending using overrides', () => {
		const overrides: Record<string, OverrideData> = {
			B: {
				original_rank: 4,
				final_rank: 1,
				justification: 'Committee reviewed additional data points',
				committee_member: 'Committee Chair',
			},
		};

		const sorted = sortResults(results, teams, seedingFactors, 'final_rank', 'asc', overrides);
		// B has final_rank 1, C has agg_rank 1, A has agg_rank 2, D has agg_rank 3
		expect(sorted[0].team_id).toBe('B');
		expect(sorted[1].team_id).toBe('C');
		expect(sorted[2].team_id).toBe('A');
		expect(sorted[3].team_id).toBe('D');
	});

	it('sorts by final_rank descending', () => {
		const overrides: Record<string, OverrideData> = {
			B: {
				original_rank: 4,
				final_rank: 1,
				justification: 'Committee reviewed additional data points',
				committee_member: 'Committee Chair',
			},
		};

		const sorted = sortResults(results, teams, seedingFactors, 'final_rank', 'desc', overrides);
		// Descending: D(3), A(2), C(1), B(1) -- B and C both have final 1
		expect(sorted[0].team_id).toBe('D');
		expect(sorted[1].team_id).toBe('A');
	});

	it('falls back to agg_rank when no overrides provided', () => {
		const sorted = sortResults(results, teams, seedingFactors, 'final_rank', 'asc');
		expect(sorted.map((r) => r.agg_rank)).toEqual([1, 2, 3, 4]);
	});

	it('existing sort keys still work with overrides param', () => {
		const overrides: Record<string, OverrideData> = {
			B: {
				original_rank: 4,
				final_rank: 1,
				justification: 'Committee reviewed additional data points',
				committee_member: 'Committee Chair',
			},
		};

		// agg_rank sort should be unchanged
		const sorted = sortResults(results, teams, seedingFactors, 'agg_rank', 'asc', overrides);
		expect(sorted.map((r) => r.agg_rank)).toEqual([1, 2, 3, 4]);
	});
});
