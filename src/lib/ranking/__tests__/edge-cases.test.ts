import { describe, it, expect } from 'vitest';
import { deriveWinsLossesFromFinishes, flattenPairwiseGroups } from '../derive-wins-losses.js';
import { computeColleyRatings } from '../colley.js';
import { computeEloRatings, DEFAULT_K_FACTOR } from '../elo.js';
import { normalizeAndAggregate } from '../normalize.js';
import type { TeamInfo, AlgorithmResultMap } from '../types.js';

describe('Edge Cases', () => {
	it('two teams with zero games: default ratings, normalization assigns 50.0', () => {
		const teams: TeamInfo[] = [
			{ id: 'team-a', name: 'Alpha', code: 'ALP' },
			{ id: 'team-b', name: 'Bravo', code: 'BRA' },
		];

		// No tournament results = no pairwise records
		const groups = deriveWinsLossesFromFinishes([], new Map());
		const flat = flattenPairwiseGroups(groups);

		expect(flat).toHaveLength(0);

		const colley = computeColleyRatings(flat, teams);
		const elo2200 = computeEloRatings(groups, teams, 2200, DEFAULT_K_FACTOR);
		const elo2400 = computeEloRatings(groups, teams, 2400, DEFAULT_K_FACTOR);
		const elo2500 = computeEloRatings(groups, teams, 2500, DEFAULT_K_FACTOR);
		const elo2700 = computeEloRatings(groups, teams, 2700, DEFAULT_K_FACTOR);

		// All teams should have default ratings
		for (const r of colley) {
			expect(r.rating).toBeCloseTo(0.5, 4);
		}
		for (const r of elo2200) {
			expect(r.rating).toBe(2200);
		}

		const algorithmResults: AlgorithmResultMap = {
			algo1: colley,
			algo2: elo2200,
			algo3: elo2400,
			algo4: elo2500,
			algo5: elo2700,
		};

		const normalized = normalizeAndAggregate(algorithmResults, teams);

		// All normalized = 50.0 (equal ratings edge case)
		for (const r of normalized) {
			expect(r.agg_rating).toBe(50);
		}
	});

	it('large dataset: 73 teams, 60 tournaments completes under 5 seconds', () => {
		const teams: TeamInfo[] = [];
		for (let i = 0; i < 73; i++) {
			teams.push({
				id: `team-${i.toString().padStart(3, '0')}`,
				name: `Team ${i.toString().padStart(3, '0')}`,
				code: `T${i.toString().padStart(3, '0')}`,
			});
		}

		// Generate deterministic finish data using a simple seed-like pattern
		const results: Array<{
			team_id: string;
			tournament_id: string;
			division: string;
			finish_position: number;
		}> = [];
		const dates = new Map<string, string>();

		for (let t = 0; t < 60; t++) {
			const tournId = `tourn-${t}`;
			const month = Math.floor(t / 5) + 1;
			const day = (t % 28) + 1;
			dates.set(
				tournId,
				`2026-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
			);

			// Assign finish positions using a rotation pattern for determinism
			const offset = t * 7; // rotate by 7 for each tournament
			for (let i = 0; i < 73; i++) {
				results.push({
					team_id: `team-${((i + offset) % 73).toString().padStart(3, '0')}`,
					tournament_id: tournId,
					division: 'Open',
					finish_position: i + 1,
				});
			}
		}

		const start = performance.now();

		const groups = deriveWinsLossesFromFinishes(results, dates);
		const flat = flattenPairwiseGroups(groups);

		const colley = computeColleyRatings(flat, teams);
		const elo2200 = computeEloRatings(groups, teams, 2200, DEFAULT_K_FACTOR);
		const elo2400 = computeEloRatings(groups, teams, 2400, DEFAULT_K_FACTOR);
		const elo2500 = computeEloRatings(groups, teams, 2500, DEFAULT_K_FACTOR);
		const elo2700 = computeEloRatings(groups, teams, 2700, DEFAULT_K_FACTOR);

		const algorithmResults: AlgorithmResultMap = {
			algo1: colley,
			algo2: elo2200,
			algo3: elo2400,
			algo4: elo2500,
			algo5: elo2700,
		};

		const normalized = normalizeAndAggregate(algorithmResults, teams);

		const elapsed = performance.now() - start;

		expect(normalized).toHaveLength(73);
		expect(elapsed).toBeLessThan(5000); // Under 5 seconds
	});

	it('all teams tied in every tournament: zero pairwise records, AggRating 50 for all', () => {
		const teams: TeamInfo[] = [
			{ id: 'team-a', name: 'Alpha', code: 'ALP' },
			{ id: 'team-b', name: 'Bravo', code: 'BRA' },
			{ id: 'team-c', name: 'Charlie', code: 'CHA' },
		];

		// All teams have finish position 1 in every tournament
		const results = [
			{ team_id: 'team-a', tournament_id: 't1', division: 'Open', finish_position: 1 },
			{ team_id: 'team-b', tournament_id: 't1', division: 'Open', finish_position: 1 },
			{ team_id: 'team-c', tournament_id: 't1', division: 'Open', finish_position: 1 },
			{ team_id: 'team-a', tournament_id: 't2', division: 'Open', finish_position: 1 },
			{ team_id: 'team-b', tournament_id: 't2', division: 'Open', finish_position: 1 },
			{ team_id: 'team-c', tournament_id: 't2', division: 'Open', finish_position: 1 },
		];

		const dates = new Map([
			['t1', '2026-01-10'],
			['t2', '2026-02-15'],
		]);

		const groups = deriveWinsLossesFromFinishes(results, dates);
		const flat = flattenPairwiseGroups(groups);

		// Zero pairwise records (all tied)
		expect(flat).toHaveLength(0);

		const colley = computeColleyRatings(flat, teams);
		const elo2200 = computeEloRatings(groups, teams, 2200, DEFAULT_K_FACTOR);
		const elo2400 = computeEloRatings(groups, teams, 2400, DEFAULT_K_FACTOR);
		const elo2500 = computeEloRatings(groups, teams, 2500, DEFAULT_K_FACTOR);
		const elo2700 = computeEloRatings(groups, teams, 2700, DEFAULT_K_FACTOR);

		const algorithmResults: AlgorithmResultMap = {
			algo1: colley,
			algo2: elo2200,
			algo3: elo2400,
			algo4: elo2500,
			algo5: elo2700,
		};

		const normalized = normalizeAndAggregate(algorithmResults, teams);

		// All AggRatings should be 50.00
		for (const r of normalized) {
			expect(r.agg_rating).toBe(50);
		}

		// Ranks should be 1-3, assigned alphabetically
		expect(normalized[0].team_id).toBe('team-a'); // Alpha = rank 1
		expect(normalized[0].agg_rank).toBe(1);
		expect(normalized[1].team_id).toBe('team-b'); // Bravo = rank 2
		expect(normalized[1].agg_rank).toBe(2);
		expect(normalized[2].team_id).toBe('team-c'); // Charlie = rank 3
		expect(normalized[2].agg_rank).toBe(3);
	});
});
