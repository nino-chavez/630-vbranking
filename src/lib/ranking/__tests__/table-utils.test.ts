import { describe, it, expect } from 'vitest';
import { sortResults, filterResults } from '../table-utils.js';
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

describe('Table Utilities', () => {
	describe('sortResults', () => {
		it('sorts by agg_rank ascending (default)', () => {
			const sorted = sortResults(results, teams, seedingFactors, 'agg_rank', 'asc');
			expect(sorted.map((r) => r.agg_rank)).toEqual([1, 2, 3, 4]);
		});

		it('sorts by agg_rating descending', () => {
			const sorted = sortResults(results, teams, seedingFactors, 'agg_rating', 'desc');
			expect(sorted.map((r) => r.team_id)).toEqual(['C', 'A', 'D', 'B']);
		});

		it('sorts by team name alphabetical', () => {
			const sorted = sortResults(results, teams, seedingFactors, 'team_name', 'asc');
			expect(sorted.map((r) => r.team_id)).toEqual(['A', 'B', 'C', 'D']);
		});
	});

	describe('filterResults', () => {
		it('filters by search text (case-insensitive)', () => {
			const filtered = filterResults(results, teams, 'alp', '');
			expect(filtered).toHaveLength(1);
			expect(filtered[0].team_id).toBe('A');
		});

		it('filters by region', () => {
			const filtered = filterResults(results, teams, '', 'Midwest');
			expect(filtered).toHaveLength(2);
			expect(filtered.map((r) => r.team_id).sort()).toEqual(['A', 'D']);
		});

		it('combines filter + sort', () => {
			const filtered = filterResults(results, teams, '', 'Midwest');
			const sorted = sortResults(filtered, teams, seedingFactors, 'agg_rating', 'desc');
			expect(sorted.map((r) => r.team_id)).toEqual(['A', 'D']);
		});
	});
});
