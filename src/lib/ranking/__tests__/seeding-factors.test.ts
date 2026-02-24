import { describe, it, expect } from 'vitest';
import { computeSeedingFactors } from '../seeding-factors.js';
import type { PairwiseRecord, TeamInfo } from '../types.js';
import type { Tier1Finish } from '../seeding-factors.js';

const teams: TeamInfo[] = [
	{ id: 'A', name: 'Alpha', code: 'ALP' },
	{ id: 'B', name: 'Bravo', code: 'BRV' },
	{ id: 'C', name: 'Charlie', code: 'CHA' },
];

// A: 5 wins, 3 losses (8 games)
// B: 2 wins, 4 losses (6 games)
// C: 3 wins, 3 losses (6 games)
const records: PairwiseRecord[] = [
	// A vs B: A wins 3 times
	{ team_a_id: 'A', team_b_id: 'B', winner_id: 'A', tournament_id: 'T1' },
	{ team_a_id: 'A', team_b_id: 'B', winner_id: 'A', tournament_id: 'T2' },
	{ team_a_id: 'A', team_b_id: 'B', winner_id: 'A', tournament_id: 'T3' },
	// A vs C: A wins 2, C wins 3
	{ team_a_id: 'A', team_b_id: 'C', winner_id: 'A', tournament_id: 'T1' },
	{ team_a_id: 'A', team_b_id: 'C', winner_id: 'A', tournament_id: 'T2' },
	{ team_a_id: 'A', team_b_id: 'C', winner_id: 'C', tournament_id: 'T3' },
	{ team_a_id: 'A', team_b_id: 'C', winner_id: 'C', tournament_id: 'T4' },
	{ team_a_id: 'A', team_b_id: 'C', winner_id: 'C', tournament_id: 'T5' },
	// B vs C: B wins 2, C wins 0 -- wait, let me recount
	// Actually let me recalculate:
	// A: appears in records 1-8 = 8 games, wins records 1,2,3,4,5 = 5 wins. 5/8 = 62.5%
	// B: appears in records 1,2,3 + (need B vs C records)
	// Let me add B vs C records
	{ team_a_id: 'B', team_b_id: 'C', winner_id: 'B', tournament_id: 'T1' },
	{ team_a_id: 'B', team_b_id: 'C', winner_id: 'B', tournament_id: 'T2' },
	{ team_a_id: 'B', team_b_id: 'C', winner_id: 'C', tournament_id: 'T3' },
];

// Now:
// A: 8 games (3 vs B, 5 vs C), 5 wins → 62.5%
// B: 6 games (3 vs A, 3 vs C), 2 wins → 33.3%
// C: 8 games (5 vs A, 3 vs B), 4 wins → 50.0%

describe('Seeding Factors', () => {
	it('computes win percentage correctly', () => {
		const result = computeSeedingFactors(records, teams, []);

		const factorsA = result.find((f) => f.team_id === 'A')!;
		const factorsB = result.find((f) => f.team_id === 'B')!;
		const factorsC = result.find((f) => f.team_id === 'C')!;

		expect(factorsA.win_pct).toBe(62.5);
		expect(factorsB.win_pct).toBeCloseTo(33.3, 1);
		expect(factorsC.win_pct).toBe(50.0);
	});

	it('returns win_pct = 0 for a team with no games', () => {
		const extraTeam: TeamInfo[] = [...teams, { id: 'D', name: 'Delta', code: 'DLT' }];
		const result = computeSeedingFactors(records, extraTeam, []);

		const factorsD = result.find((f) => f.team_id === 'D')!;
		expect(factorsD.win_pct).toBe(0);
	});

	it('reports best national finish from Tier-1 tournaments only', () => {
		const tier1Finishes: Tier1Finish[] = [
			{
				team_id: 'A',
				tournament_id: 'T_NAT',
				tournament_name: 'AAU Nationals',
				finish_position: 2,
			},
		];

		const result = computeSeedingFactors([], teams, tier1Finishes);

		const factorsA = result.find((f) => f.team_id === 'A')!;
		expect(factorsA.best_national_finish).toBe(2);
		expect(factorsA.best_national_tournament_name).toBe('AAU Nationals');

		// B and C have no Tier-1 finishes
		const factorsB = result.find((f) => f.team_id === 'B')!;
		expect(factorsB.best_national_finish).toBeNull();
		expect(factorsB.best_national_tournament_name).toBeNull();
	});

	it('takes the lowest finish when team has multiple Tier-1 results', () => {
		const tier1Finishes: Tier1Finish[] = [
			{
				team_id: 'A',
				tournament_id: 'T_NAT1',
				tournament_name: 'AAU Nationals',
				finish_position: 3,
			},
			{ team_id: 'A', tournament_id: 'T_NAT2', tournament_name: 'BJNC', finish_position: 1 },
		];

		const result = computeSeedingFactors([], teams, tier1Finishes);
		const factorsA = result.find((f) => f.team_id === 'A')!;

		expect(factorsA.best_national_finish).toBe(1);
		expect(factorsA.best_national_tournament_name).toBe('BJNC');
	});

	it('returns null for best_national_finish when no Tier-1 tournaments exist', () => {
		const result = computeSeedingFactors(records, teams, []);

		for (const factor of result) {
			expect(factor.best_national_finish).toBeNull();
			expect(factor.best_national_tournament_name).toBeNull();
		}
	});
});
