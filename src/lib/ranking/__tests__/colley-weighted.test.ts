import { describe, it, expect } from 'vitest';
import { computeColleyRatings } from '../colley.js';
import type { PairwiseRecord, TeamInfo } from '../types.js';

const teams: TeamInfo[] = [
	{ id: 'A', name: 'Alpha', code: 'ALP' },
	{ id: 'B', name: 'Bravo', code: 'BRV' },
	{ id: 'C', name: 'Charlie', code: 'CHA' },
];

// Tournament T1: A beats B, A beats C
// Tournament T2: B beats C
const records: PairwiseRecord[] = [
	{ team_a_id: 'A', team_b_id: 'B', winner_id: 'A', tournament_id: 'T1' },
	{ team_a_id: 'A', team_b_id: 'C', winner_id: 'A', tournament_id: 'T1' },
	{ team_a_id: 'B', team_b_id: 'C', winner_id: 'B', tournament_id: 'T2' },
];

describe('Weighted Colley Matrix', () => {
	it('applies weight map to bias ratings toward higher-weighted tournaments', () => {
		// T1 weight=2.0, T2 weight=1.0 -- A's dominance at T1 should be amplified
		const weightMap = { T1: 2.0, T2: 1.0 };
		const weighted = computeColleyRatings(records, teams, weightMap);
		const unweighted = computeColleyRatings(records, teams);

		// Both should rank A first
		expect(weighted[0].team_id).toBe('A');
		expect(unweighted[0].team_id).toBe('A');

		// Weighted A should have a higher rating than unweighted A (T1 emphasized)
		const weightedA = weighted.find((r) => r.team_id === 'A')!;
		const unweightedA = unweighted.find((r) => r.team_id === 'A')!;
		expect(weightedA.rating).toBeGreaterThan(unweightedA.rating);

		// Weighted C should have a lower rating (lost more weighted games)
		const weightedC = weighted.find((r) => r.team_id === 'C')!;
		const unweightedC = unweighted.find((r) => r.team_id === 'C')!;
		expect(weightedC.rating).toBeLessThan(unweightedC.rating);
	});

	it('produces identical results when no weight map is provided', () => {
		const withoutMap = computeColleyRatings(records, teams);
		const withUndefined = computeColleyRatings(records, teams, undefined);

		expect(withoutMap).toEqual(withUndefined);
	});

	it('produces identical results with an empty weight map', () => {
		const withoutMap = computeColleyRatings(records, teams);
		const withEmptyMap = computeColleyRatings(records, teams, {});

		expect(withoutMap).toEqual(withEmptyMap);
	});

	it('zero-weight tournament contributes nothing to the matrix', () => {
		// Zero out T1, only T2 (B beats C) should matter
		const weightMap = { T1: 0, T2: 1.0 };
		const result = computeColleyRatings(records, teams, weightMap);

		// A has no games (all were in T1 which has weight 0), so rating = 0.5
		const ratingA = result.find((r) => r.team_id === 'A')!;
		expect(ratingA.rating).toBeCloseTo(0.5, 4);

		// B beat C in T2, so B should be ranked above C
		const ratingB = result.find((r) => r.team_id === 'B')!;
		const ratingC = result.find((r) => r.team_id === 'C')!;
		expect(ratingB.rating).toBeGreaterThan(ratingC.rating);
	});
});
