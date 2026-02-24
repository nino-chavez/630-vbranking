/**
 * RankingService -- orchestrates the full ranking pipeline.
 *
 * Fetches data from Supabase, calls the pure algorithm functions,
 * writes results back to the database, and handles error cleanup.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types.js';
import type {
	RankingRunConfig,
	RankingRunOutput,
	NormalizedTeamResult,
	TeamInfo,
	AlgorithmResultMap,
	SeedingFactors,
} from './types.js';
import { AgeGroup } from '../schemas/enums.js';
import {
	deriveWinsLossesFromFinishes,
	deriveWinsLossesFromMatches,
	flattenPairwiseGroups,
} from './derive-wins-losses.js';
import { computeColleyRatings } from './colley.js';
import { computeEloRatings } from './elo.js';
import { normalizeAndAggregate } from './normalize.js';
import { computeSeedingFactors } from './seeding-factors.js';

export class RankingService {
	private supabase: SupabaseClient<Database>;

	constructor(supabase: SupabaseClient<Database>) {
		this.supabase = supabase;
	}

	/**
	 * Execute a full ranking run for the given config.
	 */
	async runRanking(config: RankingRunConfig): Promise<RankingRunOutput> {
		// 1. Validate inputs
		const ageGroupResult = AgeGroup.safeParse(config.age_group);
		if (!ageGroupResult.success) {
			throw new Error(
				`Invalid age_group: "${config.age_group}". Must be one of: 15U, 16U, 17U, 18U`,
			);
		}

		const { data: season, error: seasonError } = await this.supabase
			.from('seasons')
			.select('id')
			.eq('id', config.season_id)
			.single();

		if (seasonError || !season) {
			throw new Error(`Season not found: "${config.season_id}"`);
		}

		// 2. Create ranking run record
		const ranAt = new Date().toISOString();
		const { data: runRow, error: runError } = await this.supabase
			.from('ranking_runs')
			.insert({
				season_id: config.season_id,
				age_group: ageGroupResult.data,
				ran_at: ranAt,
				parameters: {
					k_factor: config.k_factor,
					elo_starting_ratings: config.elo_starting_ratings,
					data_source: 'tournament_finishes',
				},
			})
			.select('id')
			.single();

		if (runError || !runRow) {
			throw new Error(
				`Failed to create ranking run record: ${runError?.message ?? 'unknown error'}`,
			);
		}

		const rankingRunId = runRow.id;

		try {
			// 3. Fetch teams filtered by age group
			const validatedAgeGroup = ageGroupResult.data;
			const { data: teamRows, error: teamError } = await this.supabase
				.from('teams')
				.select('id, name, code')
				.eq('age_group', validatedAgeGroup)
				.order('name');

			if (teamError) {
				throw new Error(`Failed to fetch teams: ${teamError.message}`);
			}

			const teams: TeamInfo[] = (teamRows ?? []).map((t) => ({
				id: t.id,
				name: t.name,
				code: t.code,
			}));

			if (teams.length === 0) {
				throw new Error(`No teams found for age group "${config.age_group}"`);
			}

			// 4. Fetch tournaments for this season
			const { data: tournamentRows, error: tournError } = await this.supabase
				.from('tournaments')
				.select('id, date')
				.eq('season_id', config.season_id)
				.order('date');

			if (tournError) {
				throw new Error(`Failed to fetch tournaments: ${tournError.message}`);
			}

			const tournaments = tournamentRows ?? [];
			const tournamentIds = tournaments.map((t) => t.id);
			const tournamentDates = new Map(tournaments.map((t) => [t.id, t.date]));

			// 4b. Fetch tournament weights
			const { data: weightRows, error: weightError } = await this.supabase
				.from('tournament_weights')
				.select('tournament_id, weight, tier')
				.eq('season_id', config.season_id)
				.in('tournament_id', tournamentIds.length > 0 ? tournamentIds : ['__none__']);

			if (weightError) {
				throw new Error(`Failed to fetch tournament weights: ${weightError.message}`);
			}

			const weightMap: Record<string, number> = {};
			const tierMap: Record<string, number> = {};
			for (const row of weightRows ?? []) {
				weightMap[row.tournament_id] = Number(row.weight);
				tierMap[row.tournament_id] = row.tier;
			}

			// Update run parameters with weights
			await this.supabase
				.from('ranking_runs')
				.update({
					parameters: {
						k_factor: config.k_factor,
						elo_starting_ratings: config.elo_starting_ratings,
						data_source: 'tournament_finishes',
						weights: weightMap,
					},
				})
				.eq('id', rankingRunId);

			// 5. Check for match records (prefer over finishes when available)
			let dataSource: 'match_records' | 'tournament_finishes' = 'tournament_finishes';

			const { count: matchCount } = await this.supabase
				.from('matches')
				.select('id', { count: 'exact', head: true })
				.in('tournament_id', tournamentIds.length > 0 ? tournamentIds : ['__none__']);

			if (matchCount && matchCount > 0) {
				dataSource = 'match_records';
			}

			// 6. Derive pairwise records
			const teamIdSet = new Set(teams.map((t) => t.id));

			if (dataSource === 'match_records') {
				// Fetch match records
				const { data: matchRows, error: matchError } = await this.supabase
					.from('matches')
					.select('team_a_id, team_b_id, winner_id, tournament_id')
					.in('tournament_id', tournamentIds);

				if (matchError) {
					throw new Error(`Failed to fetch matches: ${matchError.message}`);
				}

				// Filter to only matches involving teams in our age group
				const filteredMatches = (matchRows ?? []).filter(
					(m) => teamIdSet.has(m.team_a_id) && teamIdSet.has(m.team_b_id),
				);

				const tournamentGroups = deriveWinsLossesFromMatches(filteredMatches, tournamentDates);
				const flatRecords = flattenPairwiseGroups(tournamentGroups);

				// 7-10. Run algorithms with weights
				const algorithmResults = this.executeAlgorithms(
					flatRecords,
					tournamentGroups,
					teams,
					config,
					weightMap,
				);

				// 11. Compute seeding factors
				const seedingFactors = await this.computeSeedingFactorsForRun(
					flatRecords,
					teams,
					tierMap,
					config.season_id,
					teamIdSet,
				);

				// 12. Insert results
				await this.insertResults(rankingRunId, algorithmResults);

				return {
					ranking_run_id: rankingRunId,
					results: algorithmResults,
					seeding_factors: seedingFactors,
					teams_ranked: algorithmResults.length,
					ran_at: ranAt,
				};
			}

			// Default: derive from tournament finishes
			const { data: resultRows, error: resultError } = await this.supabase
				.from('tournament_results')
				.select('team_id, tournament_id, division, finish_position')
				.in('tournament_id', tournamentIds.length > 0 ? tournamentIds : ['__none__']);

			if (resultError) {
				throw new Error(`Failed to fetch tournament results: ${resultError.message}`);
			}

			// Filter to only results for teams in our age group
			const filteredResults = (resultRows ?? []).filter((r) => teamIdSet.has(r.team_id));

			const tournamentGroups = deriveWinsLossesFromFinishes(filteredResults, tournamentDates);
			const flatRecords = flattenPairwiseGroups(tournamentGroups);

			// 7-10. Run algorithms with weights
			const algorithmResults = this.executeAlgorithms(
				flatRecords,
				tournamentGroups,
				teams,
				config,
				weightMap,
			);

			// 11. Compute seeding factors
			const seedingFactors = await this.computeSeedingFactorsForRun(
				flatRecords,
				teams,
				tierMap,
				config.season_id,
				teamIdSet,
			);

			// 12. Insert results
			await this.insertResults(rankingRunId, algorithmResults);

			return {
				ranking_run_id: rankingRunId,
				results: algorithmResults,
				seeding_factors: seedingFactors,
				teams_ranked: algorithmResults.length,
				ran_at: ranAt,
			};
		} catch (error) {
			// Error cleanup: delete the ranking run record and any partial results
			await this.supabase.from('ranking_results').delete().eq('ranking_run_id', rankingRunId);
			await this.supabase.from('ranking_runs').delete().eq('id', rankingRunId);
			throw error;
		}
	}

	/**
	 * Execute all five algorithms and normalize results.
	 */
	private executeAlgorithms(
		flatRecords: ReturnType<typeof flattenPairwiseGroups>,
		tournamentGroups: ReturnType<typeof deriveWinsLossesFromFinishes>,
		teams: TeamInfo[],
		config: RankingRunConfig,
		weightMap: Record<string, number>,
	): NormalizedTeamResult[] {
		// Algo1: Colley (with tournament weights)
		const colleyResults = computeColleyRatings(flatRecords, teams, weightMap);

		// Algo2-5: Elo variants (with tournament weights scaling K-factor)
		const eloResults = config.elo_starting_ratings.map((startRating) =>
			computeEloRatings(tournamentGroups, teams, startRating, config.k_factor, weightMap),
		);

		const algorithmResultMap: AlgorithmResultMap = {
			algo1: colleyResults,
			algo2: eloResults[0],
			algo3: eloResults[1],
			algo4: eloResults[2],
			algo5: eloResults[3],
		};

		return normalizeAndAggregate(algorithmResultMap, teams);
	}

	/**
	 * Compute seeding factors (win %, best national finish) for a ranking run.
	 */
	private async computeSeedingFactorsForRun(
		flatRecords: ReturnType<typeof flattenPairwiseGroups>,
		teams: TeamInfo[],
		tierMap: Record<string, number>,
		_seasonId: string,
		teamIdSet: Set<string>,
	): Promise<SeedingFactors[]> {
		// Find Tier-1 tournament IDs
		const tier1TournamentIds = Object.entries(tierMap)
			.filter(([, tier]) => tier === 1)
			.map(([id]) => id);

		if (tier1TournamentIds.length === 0) {
			// No Tier-1 tournaments — compute with empty finishes
			return computeSeedingFactors(flatRecords, teams, []);
		}

		// Fetch Tier-1 tournament finishes with tournament names
		const { data: tier1Results } = await this.supabase
			.from('tournament_results')
			.select('team_id, tournament_id, finish_position')
			.in('tournament_id', tier1TournamentIds);

		const { data: tier1Tournaments } = await this.supabase
			.from('tournaments')
			.select('id, name')
			.in('id', tier1TournamentIds);

		const tournamentNameMap = new Map((tier1Tournaments ?? []).map((t) => [t.id, t.name]));

		const tier1Finishes = (tier1Results ?? [])
			.filter((r) => teamIdSet.has(r.team_id))
			.map((r) => ({
				team_id: r.team_id,
				tournament_id: r.tournament_id,
				tournament_name: tournamentNameMap.get(r.tournament_id) ?? '',
				finish_position: r.finish_position,
			}));

		return computeSeedingFactors(flatRecords, teams, tier1Finishes);
	}

	/**
	 * Batch insert ranking results for a run.
	 */
	private async insertResults(
		rankingRunId: string,
		results: NormalizedTeamResult[],
	): Promise<void> {
		const rows = results.map((r) => ({
			ranking_run_id: rankingRunId,
			team_id: r.team_id,
			algo1_rating: r.algo1_rating,
			algo1_rank: r.algo1_rank,
			algo2_rating: r.algo2_rating,
			algo2_rank: r.algo2_rank,
			algo3_rating: r.algo3_rating,
			algo3_rank: r.algo3_rank,
			algo4_rating: r.algo4_rating,
			algo4_rank: r.algo4_rank,
			algo5_rating: r.algo5_rating,
			algo5_rank: r.algo5_rank,
			agg_rating: r.agg_rating,
			agg_rank: r.agg_rank,
		}));

		const { error } = await this.supabase.from('ranking_results').insert(rows);

		if (error) {
			throw new Error(`Failed to insert ranking results: ${error.message}`);
		}
	}

	/**
	 * Fetch results for a completed ranking run.
	 */
	async getRunResults(rankingRunId: string): Promise<NormalizedTeamResult[]> {
		const { data, error } = await this.supabase
			.from('ranking_results')
			.select(
				'team_id, algo1_rating, algo1_rank, algo2_rating, algo2_rank, algo3_rating, algo3_rank, algo4_rating, algo4_rank, algo5_rating, algo5_rank, agg_rating, agg_rank',
			)
			.eq('ranking_run_id', rankingRunId)
			.order('agg_rank');

		if (error) {
			throw new Error(`Failed to fetch ranking results: ${error.message}`);
		}

		return (data ?? []).map((r) => ({
			team_id: r.team_id,
			algo1_rating: r.algo1_rating ?? 0,
			algo1_rank: r.algo1_rank ?? 0,
			algo2_rating: r.algo2_rating ?? 0,
			algo2_rank: r.algo2_rank ?? 0,
			algo3_rating: r.algo3_rating ?? 0,
			algo3_rank: r.algo3_rank ?? 0,
			algo4_rating: r.algo4_rating ?? 0,
			algo4_rank: r.algo4_rank ?? 0,
			algo5_rating: r.algo5_rating ?? 0,
			algo5_rank: r.algo5_rank ?? 0,
			agg_rating: r.agg_rating ?? 0,
			agg_rank: r.agg_rank ?? 0,
		}));
	}
}
