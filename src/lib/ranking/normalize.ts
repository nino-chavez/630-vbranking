/**
 * Min-max normalization and aggregation for ranking algorithm outputs.
 *
 * Normalizes each algorithm's ratings to a 0-100 scale, computes
 * AggRating (arithmetic mean of normalized scores), and assigns AggRank.
 *
 * Pure function -- no database access.
 */

import type { AlgorithmResultMap, NormalizedTeamResult, TeamInfo } from './types.js';

/** Algorithm keys in the expected order. */
const ALGO_KEYS = ['algo1', 'algo2', 'algo3', 'algo4', 'algo5'] as const;

/**
 * Normalize algorithm results and compute AggRating and AggRank.
 *
 * @param algorithmResults - Map of algorithm name to results array.
 * @param teams - Team info for tie-breaking by name.
 * @returns NormalizedTeamResult[] sorted by agg_rank ascending.
 */
export function normalizeAndAggregate(
	algorithmResults: AlgorithmResultMap,
	teams: TeamInfo[],
): NormalizedTeamResult[] {
	if (teams.length === 0) {
		return [];
	}

	// Build team name lookup for tie-breaking
	const teamNameMap = new Map<string, string>();
	for (const team of teams) {
		teamNameMap.set(team.id, team.name);
	}

	// Normalize each algorithm's ratings to 0-100 scale
	const normalizedByAlgo = new Map<string, Map<string, number>>();

	for (const algoKey of ALGO_KEYS) {
		const results = algorithmResults[algoKey];
		if (!results || results.length === 0) {
			continue;
		}

		// Find min and max ratings
		let minRating = Infinity;
		let maxRating = -Infinity;
		for (const result of results) {
			if (result.rating < minRating) minRating = result.rating;
			if (result.rating > maxRating) maxRating = result.rating;
		}

		const normalized = new Map<string, number>();

		if (maxRating === minRating) {
			// All teams have identical ratings: assign 50.0
			for (const result of results) {
				normalized.set(result.team_id, 50.0);
			}
		} else {
			// Min-max normalization to 0-100
			const range = maxRating - minRating;
			for (const result of results) {
				normalized.set(result.team_id, ((result.rating - minRating) / range) * 100);
			}
		}

		normalizedByAlgo.set(algoKey, normalized);
	}

	// Build per-algorithm rating and rank lookups
	const algoRatingMap = new Map<string, Map<string, number>>();
	const algoRankMap = new Map<string, Map<string, number>>();

	for (const algoKey of ALGO_KEYS) {
		const results = algorithmResults[algoKey];
		if (!results) continue;

		const ratingMap = new Map<string, number>();
		const rankMap = new Map<string, number>();
		for (const result of results) {
			ratingMap.set(result.team_id, result.rating);
			rankMap.set(result.team_id, result.rank);
		}
		algoRatingMap.set(algoKey, ratingMap);
		algoRankMap.set(algoKey, rankMap);
	}

	// Compute AggRating for each team
	const teamAggData: Array<{
		team_id: string;
		teamName: string;
		aggRating: number;
		algo1_rating: number;
		algo1_rank: number;
		algo2_rating: number;
		algo2_rank: number;
		algo3_rating: number;
		algo3_rank: number;
		algo4_rating: number;
		algo4_rank: number;
		algo5_rating: number;
		algo5_rank: number;
	}> = [];

	for (const team of teams) {
		let normalizedSum = 0;
		let algoCount = 0;

		for (const algoKey of ALGO_KEYS) {
			const normalized = normalizedByAlgo.get(algoKey);
			if (normalized) {
				normalizedSum += normalized.get(team.id) ?? 50.0;
				algoCount++;
			}
		}

		const aggRating = algoCount > 0 ? Math.round((normalizedSum / algoCount) * 100) / 100 : 50.0;

		teamAggData.push({
			team_id: team.id,
			teamName: team.name,
			aggRating,
			algo1_rating: algoRatingMap.get('algo1')?.get(team.id) ?? 0,
			algo1_rank: algoRankMap.get('algo1')?.get(team.id) ?? 0,
			algo2_rating: algoRatingMap.get('algo2')?.get(team.id) ?? 0,
			algo2_rank: algoRankMap.get('algo2')?.get(team.id) ?? 0,
			algo3_rating: algoRatingMap.get('algo3')?.get(team.id) ?? 0,
			algo3_rank: algoRankMap.get('algo3')?.get(team.id) ?? 0,
			algo4_rating: algoRatingMap.get('algo4')?.get(team.id) ?? 0,
			algo4_rank: algoRankMap.get('algo4')?.get(team.id) ?? 0,
			algo5_rating: algoRatingMap.get('algo5')?.get(team.id) ?? 0,
			algo5_rank: algoRankMap.get('algo5')?.get(team.id) ?? 0,
		});
	}

	// Sort by aggRating descending, ties broken alphabetically by team name ascending
	teamAggData.sort((a, b) => {
		if (b.aggRating !== a.aggRating) {
			return b.aggRating - a.aggRating;
		}
		return a.teamName.localeCompare(b.teamName);
	});

	// Assign agg_rank and build final results
	const results: NormalizedTeamResult[] = teamAggData.map((entry, index) => ({
		team_id: entry.team_id,
		algo1_rating: entry.algo1_rating,
		algo1_rank: entry.algo1_rank,
		algo2_rating: entry.algo2_rating,
		algo2_rank: entry.algo2_rank,
		algo3_rating: entry.algo3_rating,
		algo3_rank: entry.algo3_rank,
		algo4_rating: entry.algo4_rating,
		algo4_rank: entry.algo4_rank,
		algo5_rating: entry.algo5_rating,
		algo5_rank: entry.algo5_rank,
		agg_rating: entry.aggRating,
		agg_rank: index + 1,
	}));

	return results;
}
