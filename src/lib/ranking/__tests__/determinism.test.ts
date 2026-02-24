import { describe, it, expect } from 'vitest';
import { deriveWinsLossesFromFinishes, flattenPairwiseGroups } from '../derive-wins-losses.js';
import { computeColleyRatings } from '../colley.js';
import { computeEloRatings, DEFAULT_K_FACTOR } from '../elo.js';
import { normalizeAndAggregate } from '../normalize.js';
import type { TeamInfo, AlgorithmResultMap } from '../types.js';

const teams: TeamInfo[] = [
	{ id: 'team-a', name: 'Alpha', code: 'ALP' },
	{ id: 'team-b', name: 'Bravo', code: 'BRA' },
	{ id: 'team-c', name: 'Charlie', code: 'CHA' },
	{ id: 'team-d', name: 'Delta', code: 'DEL' },
	{ id: 'team-e', name: 'Echo', code: 'ECH' },
];

const tournamentResults = [
	{ team_id: 'team-a', tournament_id: 't1', division: 'Open', finish_position: 1 },
	{ team_id: 'team-b', tournament_id: 't1', division: 'Open', finish_position: 2 },
	{ team_id: 'team-c', tournament_id: 't1', division: 'Open', finish_position: 3 },
	{ team_id: 'team-d', tournament_id: 't1', division: 'Open', finish_position: 4 },
	{ team_id: 'team-e', tournament_id: 't1', division: 'Open', finish_position: 5 },
	{ team_id: 'team-c', tournament_id: 't2', division: 'Open', finish_position: 1 },
	{ team_id: 'team-a', tournament_id: 't2', division: 'Open', finish_position: 2 },
	{ team_id: 'team-b', tournament_id: 't2', division: 'Open', finish_position: 3 },
	{ team_id: 'team-e', tournament_id: 't2', division: 'Open', finish_position: 4 },
	{ team_id: 'team-d', tournament_id: 't2', division: 'Open', finish_position: 5 },
	{ team_id: 'team-b', tournament_id: 't3', division: 'Open', finish_position: 1 },
	{ team_id: 'team-d', tournament_id: 't3', division: 'Open', finish_position: 2 },
	{ team_id: 'team-a', tournament_id: 't3', division: 'Open', finish_position: 3 },
	{ team_id: 'team-c', tournament_id: 't3', division: 'Open', finish_position: 4 },
	{ team_id: 'team-e', tournament_id: 't3', division: 'Open', finish_position: 5 },
];

const tournamentDates = new Map([
	['t1', '2026-01-10'],
	['t2', '2026-02-15'],
	['t3', '2026-03-20'],
]);

function runFullPipeline(inputTeams: TeamInfo[]) {
	const groups = deriveWinsLossesFromFinishes(tournamentResults, tournamentDates);
	const flat = flattenPairwiseGroups(groups);

	const colley = computeColleyRatings(flat, inputTeams);
	const elo2200 = computeEloRatings(groups, inputTeams, 2200, DEFAULT_K_FACTOR);
	const elo2400 = computeEloRatings(groups, inputTeams, 2400, DEFAULT_K_FACTOR);
	const elo2500 = computeEloRatings(groups, inputTeams, 2500, DEFAULT_K_FACTOR);
	const elo2700 = computeEloRatings(groups, inputTeams, 2700, DEFAULT_K_FACTOR);

	const algorithmResults: AlgorithmResultMap = {
		algo1: colley,
		algo2: elo2200,
		algo3: elo2400,
		algo4: elo2500,
		algo5: elo2700,
	};

	return normalizeAndAggregate(algorithmResults, inputTeams);
}

describe('Determinism', () => {
	it('produces byte-identical results when run twice with same input', () => {
		const run1 = runFullPipeline(teams);
		const run2 = runFullPipeline(teams);

		expect(run1).toEqual(run2);
	});

	it('produces identical results regardless of team input order', () => {
		const shuffledTeams: TeamInfo[] = [
			teams[3], // Delta
			teams[0], // Alpha
			teams[4], // Echo
			teams[1], // Bravo
			teams[2], // Charlie
		];

		const run1 = runFullPipeline(teams);
		const run2 = runFullPipeline(shuffledTeams);

		// Same team_ids should have the same aggregate ratings and ranks
		// (Per-algorithm ratings may have minor floating point differences
		// due to matrix indexing order in LU decomposition, but the final
		// aggregated result should be stable.)
		for (const r1 of run1) {
			const r2 = run2.find((r) => r.team_id === r1.team_id);
			expect(r2).toBeDefined();
			expect(r1.agg_rating).toBeCloseTo(r2!.agg_rating, 2);
			expect(r1.agg_rank).toBe(r2!.agg_rank);
		}
	});
});
