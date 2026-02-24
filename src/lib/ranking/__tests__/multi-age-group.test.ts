import { describe, it, expect } from 'vitest';
import { computeColleyRatings } from '../colley.js';
import { deriveWinsLossesFromFinishes, flattenPairwiseGroups } from '../derive-wins-losses.js';
import { normalizeAndAggregate } from '../normalize.js';
import type { TeamInfo, AlgorithmResultMap } from '../types.js';

/**
 * Tests that prove the ranking pipeline produces independent results
 * when given different sets of teams (simulating different age groups).
 *
 * These are pure-function tests — no database or mock Supabase needed.
 */
describe('Multi-Age-Group Independence', () => {
	// --- 18U teams and results ---
	const teams18U: TeamInfo[] = [
		{ id: 'team-18-a', name: 'Alpha 18U', code: 'A18' },
		{ id: 'team-18-b', name: 'Bravo 18U', code: 'B18' },
		{ id: 'team-18-c', name: 'Charlie 18U', code: 'C18' },
	];

	const finishes18U = [
		{ team_id: 'team-18-a', tournament_id: 'tourn-1', division: 'Open', finish_position: 1 },
		{ team_id: 'team-18-b', tournament_id: 'tourn-1', division: 'Open', finish_position: 2 },
		{ team_id: 'team-18-c', tournament_id: 'tourn-1', division: 'Open', finish_position: 3 },
	];

	// --- 15U teams and results (different teams, same tournament) ---
	const teams15U: TeamInfo[] = [
		{ id: 'team-15-x', name: 'X-Ray 15U', code: 'X15' },
		{ id: 'team-15-y', name: 'Yankee 15U', code: 'Y15' },
		{ id: 'team-15-z', name: 'Zulu 15U', code: 'Z15' },
	];

	const finishes15U = [
		{ team_id: 'team-15-x', tournament_id: 'tourn-1', division: 'Open', finish_position: 3 },
		{ team_id: 'team-15-y', tournament_id: 'tourn-1', division: 'Open', finish_position: 1 },
		{ team_id: 'team-15-z', tournament_id: 'tourn-1', division: 'Open', finish_position: 2 },
	];

	const tournamentDates = new Map([['tourn-1', '2026-01-15']]);

	function computeRanks(teams: TeamInfo[], finishes: typeof finishes18U) {
		const tournamentGroups = deriveWinsLossesFromFinishes(finishes, tournamentDates);
		const flatRecords = flattenPairwiseGroups(tournamentGroups);
		const colleyResults = computeColleyRatings(flatRecords, teams, {});

		const algorithmResultMap: AlgorithmResultMap = {
			algo1: colleyResults,
			algo2: colleyResults,
			algo3: colleyResults,
			algo4: colleyResults,
			algo5: colleyResults,
		};

		return normalizeAndAggregate(algorithmResultMap, teams);
	}

	it('produces different rank orderings for different age groups', () => {
		const results18U = computeRanks(teams18U, finishes18U);
		const results15U = computeRanks(teams15U, finishes15U);

		// 18U: team-18-a should be #1 (finished 1st)
		const top18U = results18U.find((r) => r.agg_rank === 1);
		expect(top18U?.team_id).toBe('team-18-a');

		// 15U: team-15-y should be #1 (finished 1st)
		const top15U = results15U.find((r) => r.agg_rank === 1);
		expect(top15U?.team_id).toBe('team-15-y');
	});

	it('results contain only teams from the given age group', () => {
		const results18U = computeRanks(teams18U, finishes18U);
		const results15U = computeRanks(teams15U, finishes15U);

		const ids18U = results18U.map((r) => r.team_id);
		const ids15U = results15U.map((r) => r.team_id);

		// No overlap
		for (const id of ids18U) {
			expect(ids15U).not.toContain(id);
		}

		// Correct count
		expect(results18U).toHaveLength(3);
		expect(results15U).toHaveLength(3);
	});

	it('changing one age group does not affect the other', () => {
		// Compute 18U baseline
		const baseline18U = computeRanks(teams18U, finishes18U);

		// Now compute 15U with reversed finishes — should NOT change 18U results
		const reversed15U = [
			{ team_id: 'team-15-x', tournament_id: 'tourn-1', division: 'Open', finish_position: 1 },
			{ team_id: 'team-15-y', tournament_id: 'tourn-1', division: 'Open', finish_position: 3 },
			{ team_id: 'team-15-z', tournament_id: 'tourn-1', division: 'Open', finish_position: 2 },
		];

		// Recompute 18U — same input, same output
		const recomputed18U = computeRanks(teams18U, finishes18U);
		// Compute 15U with different data
		const results15UReversed = computeRanks(teams15U, reversed15U);

		// 18U results unchanged
		expect(recomputed18U).toEqual(baseline18U);

		// 15U results reflect the new ordering
		const top15U = results15UReversed.find((r) => r.agg_rank === 1);
		expect(top15U?.team_id).toBe('team-15-x');
	});
});

describe('Run History API Filtering Logic', () => {
	it('filters run list by age_group when provided', () => {
		// Simulate the filtering logic from the runs API
		const allRuns = [
			{
				id: 'run-1',
				season_id: 's1',
				age_group: '18U',
				ran_at: '2026-01-01T00:00:00Z',
				status: 'draft',
			},
			{
				id: 'run-2',
				season_id: 's1',
				age_group: '15U',
				ran_at: '2026-01-02T00:00:00Z',
				status: 'draft',
			},
			{
				id: 'run-3',
				season_id: 's1',
				age_group: '18U',
				ran_at: '2026-01-03T00:00:00Z',
				status: 'finalized',
			},
			{
				id: 'run-4',
				season_id: 's2',
				age_group: '18U',
				ran_at: '2026-01-04T00:00:00Z',
				status: 'draft',
			},
		];

		// Filter for season s1 + age_group 18U
		const filtered = allRuns.filter((r) => r.season_id === 's1' && r.age_group === '18U');

		expect(filtered).toHaveLength(2);
		expect(filtered.map((r) => r.id)).toEqual(['run-1', 'run-3']);
	});

	it('returns all age groups when age_group filter is not provided', () => {
		const allRuns = [
			{ id: 'run-1', season_id: 's1', age_group: '18U' },
			{ id: 'run-2', season_id: 's1', age_group: '15U' },
			{ id: 'run-3', season_id: 's1', age_group: '16U' },
		];

		// Filter for season s1 only (no age_group filter)
		const filtered = allRuns.filter((r) => r.season_id === 's1');

		expect(filtered).toHaveLength(3);
	});
});
