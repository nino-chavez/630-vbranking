/**
 * Parameterized Elo algorithm implementation.
 *
 * Processes tournaments chronologically, updating ratings after each
 * matchup within a tournament. Four variants differ only in starting
 * rating (2200, 2400, 2500, 2700).
 *
 * Pure function -- no database access.
 */

import type { TournamentPairwiseGroup, AlgorithmResult, TeamInfo } from './types.js';

/** Default K-factor for Elo rating updates. */
export const DEFAULT_K_FACTOR = 32;

/** Starting ratings for the four Elo algorithm variants. */
export const ELO_STARTING_RATINGS = [2200, 2400, 2500, 2700] as const;

/**
 * Compute Elo ratings for all teams from chronologically ordered tournament groups.
 *
 * @param tournamentGroups - Pairwise records grouped by tournament, sorted by date ascending.
 * @param teams - List of teams with id, name, code for initialization and tie-breaking.
 * @param startingRating - Initial Elo rating for all teams.
 * @param kFactor - K-factor for rating updates.
 * @returns AlgorithmResult[] sorted by rating descending, ties broken alphabetically.
 */
export function computeEloRatings(
	tournamentGroups: TournamentPairwiseGroup[],
	teams: TeamInfo[],
	startingRating: number,
	kFactor: number,
	weightMap?: Record<string, number>,
): AlgorithmResult[] {
	const n = teams.length;

	// Edge case: no teams
	if (n === 0) {
		return [];
	}

	// Initialize rating map
	const ratings = new Map<string, number>();
	for (const team of teams) {
		ratings.set(team.id, startingRating);
	}

	// Process tournaments chronologically
	for (const group of tournamentGroups) {
		const weight = weightMap?.[group.tournament_id] ?? 1.0;
		const effectiveK = kFactor * weight;

		for (const record of group.records) {
			const loserId = record.winner_id === record.team_a_id ? record.team_b_id : record.team_a_id;

			const rWinner = ratings.get(record.winner_id);
			const rLoser = ratings.get(loserId);

			// Skip records involving teams not in the teams list
			if (rWinner === undefined || rLoser === undefined) {
				continue;
			}

			// Expected scores
			const eWinner = 1 / (1 + Math.pow(10, (rLoser - rWinner) / 400));
			const eLoser = 1 - eWinner;

			// Update ratings: winner scored 1, loser scored 0 (K-factor scaled by tournament weight)
			const newRWinner = rWinner + effectiveK * (1 - eWinner);
			const newRLoser = rLoser + effectiveK * (0 - eLoser);

			ratings.set(record.winner_id, newRWinner);
			ratings.set(loserId, newRLoser);
		}
	}

	// Build team name lookup for tie-breaking
	const teamNameMap = new Map<string, string>();
	for (const team of teams) {
		teamNameMap.set(team.id, team.name);
	}

	// Build results array
	const ratingsWithTeams: Array<{ teamId: string; teamName: string; rating: number }> = [];
	for (const team of teams) {
		ratingsWithTeams.push({
			teamId: team.id,
			teamName: team.name,
			rating: ratings.get(team.id) ?? startingRating,
		});
	}

	// Sort by rating descending, ties broken alphabetically by team name ascending
	ratingsWithTeams.sort((a, b) => {
		if (b.rating !== a.rating) {
			return b.rating - a.rating;
		}
		return a.teamName.localeCompare(b.teamName);
	});

	// Assign ranks
	const results: AlgorithmResult[] = ratingsWithTeams.map((entry, index) => ({
		team_id: entry.teamId,
		rating: entry.rating,
		rank: index + 1,
	}));

	return results;
}
