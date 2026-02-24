import { describe, it, expect } from 'vitest';
import { computeEloRatings, DEFAULT_K_FACTOR } from '../elo.js';
import type { TournamentPairwiseGroup, TeamInfo } from '../types.js';

const teams: TeamInfo[] = [
	{ id: 'A', name: 'Alpha', code: 'ALP' },
	{ id: 'B', name: 'Bravo', code: 'BRV' },
];

// Single game: A beats B
const singleGame: TournamentPairwiseGroup[] = [
	{
		tournament_id: 'T1',
		tournament_date: '2026-01-01',
		records: [{ team_a_id: 'A', team_b_id: 'B', winner_id: 'A', tournament_id: 'T1' }],
	},
];

describe('Weighted Elo', () => {
	it('scales K-factor by tournament weight -- double weight produces double rating change', () => {
		const startRating = 2200;
		const unweighted = computeEloRatings(singleGame, teams, startRating, DEFAULT_K_FACTOR);
		const weighted = computeEloRatings(singleGame, teams, startRating, DEFAULT_K_FACTOR, {
			T1: 2.0,
		});

		const unweightedA = unweighted.find((r) => r.team_id === 'A')!;
		const weightedA = weighted.find((r) => r.team_id === 'A')!;

		// Rating change with weight=2.0 should be exactly double
		const unweightedChange = unweightedA.rating - startRating;
		const weightedChange = weightedA.rating - startRating;
		expect(weightedChange).toBeCloseTo(unweightedChange * 2, 6);
	});

	it('produces identical results when no weight map is provided', () => {
		const startRating = 2400;
		const withoutMap = computeEloRatings(singleGame, teams, startRating, DEFAULT_K_FACTOR);
		const withUndefined = computeEloRatings(
			singleGame,
			teams,
			startRating,
			DEFAULT_K_FACTOR,
			undefined,
		);

		expect(withoutMap).toEqual(withUndefined);
	});

	it('handles multiple tournaments with different weights', () => {
		const threeTeams: TeamInfo[] = [
			{ id: 'A', name: 'Alpha', code: 'ALP' },
			{ id: 'B', name: 'Bravo', code: 'BRV' },
			{ id: 'C', name: 'Charlie', code: 'CHA' },
		];

		// T1 (weight 2.0): A beats B
		// T2 (weight 1.0): C beats A
		const groups: TournamentPairwiseGroup[] = [
			{
				tournament_id: 'T1',
				tournament_date: '2026-01-01',
				records: [{ team_a_id: 'A', team_b_id: 'B', winner_id: 'A', tournament_id: 'T1' }],
			},
			{
				tournament_id: 'T2',
				tournament_date: '2026-02-01',
				records: [{ team_a_id: 'C', team_b_id: 'A', winner_id: 'C', tournament_id: 'T2' }],
			},
		];

		const weightMap = { T1: 2.0, T2: 1.0 };
		const weighted = computeEloRatings(groups, threeTeams, 2200, DEFAULT_K_FACTOR, weightMap);
		const unweighted = computeEloRatings(groups, threeTeams, 2200, DEFAULT_K_FACTOR);

		// Both should produce valid ratings
		expect(weighted.length).toBe(3);
		expect(unweighted.length).toBe(3);

		// With T1 weighted 2x, A's win over B is amplified
		const weightedA = weighted.find((r) => r.team_id === 'A')!;
		const unweightedA = unweighted.find((r) => r.team_id === 'A')!;
		expect(weightedA.rating).not.toBe(unweightedA.rating);
	});

	it('zero-weight tournament produces no rating changes', () => {
		const startRating = 2500;
		const result = computeEloRatings(singleGame, teams, startRating, DEFAULT_K_FACTOR, { T1: 0 });

		// Both teams should still have starting rating (no change)
		for (const r of result) {
			expect(r.rating).toBe(startRating);
		}
	});
});
