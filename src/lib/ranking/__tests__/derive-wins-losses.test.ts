import { describe, it, expect } from 'vitest';
import { deriveWinsLossesFromFinishes, flattenPairwiseGroups } from '../derive-wins-losses.js';

describe('deriveWinsLossesFromFinishes', () => {
	it('produces C(5,2)=10 pairwise records for 5 teams with finish positions 1-5', () => {
		const tournamentId = 'tournament-1';
		const tournamentResults = [
			{ team_id: 'team-a', tournament_id: tournamentId, division: 'Open', finish_position: 1 },
			{ team_id: 'team-b', tournament_id: tournamentId, division: 'Open', finish_position: 2 },
			{ team_id: 'team-c', tournament_id: tournamentId, division: 'Open', finish_position: 3 },
			{ team_id: 'team-d', tournament_id: tournamentId, division: 'Open', finish_position: 4 },
			{ team_id: 'team-e', tournament_id: tournamentId, division: 'Open', finish_position: 5 },
		];
		const tournamentDates = new Map([[tournamentId, '2026-01-15']]);

		const groups = deriveWinsLossesFromFinishes(tournamentResults, tournamentDates);
		const allRecords = flattenPairwiseGroups(groups);

		// C(5,2) = 10 pairwise records
		expect(allRecords).toHaveLength(10);

		// Every record should have the lower-finish-position team as winner
		for (const record of allRecords) {
			const winnerFinish = tournamentResults.find(
				(r) => r.team_id === record.winner_id,
			)!.finish_position;
			const loserId = record.winner_id === record.team_a_id ? record.team_b_id : record.team_a_id;
			const loserFinish = tournamentResults.find((r) => r.team_id === loserId)!.finish_position;
			expect(winnerFinish).toBeLessThan(loserFinish);
		}
	});

	it('produces NO pairwise record between teams with identical finish positions', () => {
		const tournamentId = 'tournament-1';
		const tournamentResults = [
			{ team_id: 'team-a', tournament_id: tournamentId, division: 'Open', finish_position: 1 },
			{ team_id: 'team-b', tournament_id: tournamentId, division: 'Open', finish_position: 1 },
			{ team_id: 'team-c', tournament_id: tournamentId, division: 'Open', finish_position: 3 },
		];
		const tournamentDates = new Map([[tournamentId, '2026-01-15']]);

		const groups = deriveWinsLossesFromFinishes(tournamentResults, tournamentDates);
		const allRecords = flattenPairwiseGroups(groups);

		// A and B are tied at position 1, so no record between A and B
		// But A beats C, and B beats C -> 2 records total
		expect(allRecords).toHaveLength(2);

		// Verify no record involves both team-a and team-b
		const abRecord = allRecords.find(
			(r) =>
				(r.team_a_id === 'team-a' && r.team_b_id === 'team-b') ||
				(r.team_a_id === 'team-b' && r.team_b_id === 'team-a'),
		);
		expect(abRecord).toBeUndefined();
	});

	it('produces zero pairwise records for a single team', () => {
		const tournamentId = 'tournament-1';
		const tournamentResults = [
			{ team_id: 'team-a', tournament_id: tournamentId, division: 'Open', finish_position: 1 },
		];
		const tournamentDates = new Map([[tournamentId, '2026-01-15']]);

		const groups = deriveWinsLossesFromFinishes(tournamentResults, tournamentDates);
		const allRecords = flattenPairwiseGroups(groups);

		expect(allRecords).toHaveLength(0);
	});

	it('groups results from two tournaments sorted by tournament date ascending', () => {
		const tournamentResults = [
			{
				team_id: 'team-a',
				tournament_id: 'tournament-2',
				division: 'Open',
				finish_position: 1,
			},
			{
				team_id: 'team-b',
				tournament_id: 'tournament-2',
				division: 'Open',
				finish_position: 2,
			},
			{
				team_id: 'team-a',
				tournament_id: 'tournament-1',
				division: 'Open',
				finish_position: 2,
			},
			{
				team_id: 'team-b',
				tournament_id: 'tournament-1',
				division: 'Open',
				finish_position: 1,
			},
		];
		const tournamentDates = new Map([
			['tournament-1', '2026-01-10'],
			['tournament-2', '2026-02-20'],
		]);

		const groups = deriveWinsLossesFromFinishes(tournamentResults, tournamentDates);

		expect(groups).toHaveLength(2);
		// First group should be tournament-1 (earlier date)
		expect(groups[0].tournament_id).toBe('tournament-1');
		expect(groups[0].tournament_date).toBe('2026-01-10');
		// Second group should be tournament-2 (later date)
		expect(groups[1].tournament_id).toBe('tournament-2');
		expect(groups[1].tournament_date).toBe('2026-02-20');

		// Each tournament has 1 pairwise record (2 teams)
		expect(groups[0].records).toHaveLength(1);
		expect(groups[1].records).toHaveLength(1);

		// Tournament-1: team-b wins (finish 1 vs 2)
		expect(groups[0].records[0].winner_id).toBe('team-b');
		// Tournament-2: team-a wins (finish 1 vs 2)
		expect(groups[1].records[0].winner_id).toBe('team-a');
	});
});
