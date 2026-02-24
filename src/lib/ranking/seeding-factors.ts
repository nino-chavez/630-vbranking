/**
 * Seeding factors computation.
 *
 * Computes supplementary seeding data (win %, best national finish)
 * displayed alongside algorithmic rankings. These factors are NOT
 * part of the ranking algorithm -- they are committee reference data.
 *
 * Pure function -- no database access.
 */

import type { PairwiseRecord, SeedingFactors, TeamInfo } from './types.js';

/** Tournament finish data pre-joined with tournament info. */
export interface Tier1Finish {
	team_id: string;
	tournament_id: string;
	tournament_name: string;
	finish_position: number;
}

/**
 * Compute seeding factors for all teams.
 *
 * @param pairwiseRecords - Flattened pairwise W/L records (same as used by algorithms).
 * @param teams - List of teams.
 * @param tier1TournamentFinishes - Pre-joined finish records at Tier-1 tournaments.
 * @returns SeedingFactors[] with one entry per team.
 */
export function computeSeedingFactors(
	pairwiseRecords: PairwiseRecord[],
	teams: TeamInfo[],
	tier1TournamentFinishes: Tier1Finish[],
): SeedingFactors[] {
	// Build win and game counts per team
	const wins = new Map<string, number>();
	const games = new Map<string, number>();

	for (const team of teams) {
		wins.set(team.id, 0);
		games.set(team.id, 0);
	}

	for (const record of pairwiseRecords) {
		// Count game for both participants
		if (games.has(record.team_a_id)) {
			games.set(record.team_a_id, (games.get(record.team_a_id) ?? 0) + 1);
		}
		if (games.has(record.team_b_id)) {
			games.set(record.team_b_id, (games.get(record.team_b_id) ?? 0) + 1);
		}

		// Count win for the winner
		if (wins.has(record.winner_id)) {
			wins.set(record.winner_id, (wins.get(record.winner_id) ?? 0) + 1);
		}
	}

	// Build best national finish per team
	const bestFinish = new Map<string, { position: number; tournament_name: string }>();

	for (const finish of tier1TournamentFinishes) {
		const existing = bestFinish.get(finish.team_id);
		if (!existing || finish.finish_position < existing.position) {
			bestFinish.set(finish.team_id, {
				position: finish.finish_position,
				tournament_name: finish.tournament_name,
			});
		}
	}

	// Build results
	return teams.map((team) => {
		const teamWins = wins.get(team.id) ?? 0;
		const teamGames = games.get(team.id) ?? 0;
		const winPct = teamGames > 0 ? Math.round((teamWins / teamGames) * 1000) / 10 : 0;

		const nationalFinish = bestFinish.get(team.id);

		return {
			team_id: team.id,
			win_pct: winPct,
			best_national_finish: nationalFinish?.position ?? null,
			best_national_tournament_name: nationalFinish?.tournament_name ?? null,
		};
	});
}
