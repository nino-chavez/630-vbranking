import type { PageServerLoad } from './$types.js';
import { supabaseServer } from '$lib/supabase-server.js';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, url }) => {
	const teamId = params.id;
	const runId = url.searchParams.get('run_id');

	if (!runId) {
		throw error(400, 'Missing required parameter: run_id');
	}

	// Fetch team info
	const { data: team, error: teamError } = await supabaseServer
		.from('teams')
		.select('id, name, code, region, age_group')
		.eq('id', teamId)
		.single();

	if (teamError || !team) {
		throw error(404, 'Team not found');
	}

	// Fetch ranking results for this team in this run
	const { data: rankingRow } = await supabaseServer
		.from('ranking_results')
		.select(
			'algo1_rating, algo1_rank, algo2_rating, algo2_rank, algo3_rating, algo3_rank, algo4_rating, algo4_rank, algo5_rating, algo5_rank, agg_rating, agg_rank',
		)
		.eq('ranking_run_id', runId)
		.eq('team_id', teamId)
		.single();

	// Fetch the ranking run to get season_id
	const { data: run } = await supabaseServer
		.from('ranking_runs')
		.select('id, season_id, ran_at')
		.eq('id', runId)
		.single();

	const seasonId = run?.season_id ?? '';

	// Fetch tournament history for this team in this season
	let history: Array<{
		tournament_name: string;
		tournament_date: string;
		division: string;
		finish_position: number;
		field_size: number;
	}> = [];

	if (seasonId) {
		const { data: tournaments } = await supabaseServer
			.from('tournaments')
			.select('id, name, date')
			.eq('season_id', seasonId)
			.order('date');

		const tournamentIds = (tournaments ?? []).map((t) => t.id);
		const tournamentMap = new Map(
			(tournaments ?? []).map((t) => [t.id, { name: t.name, date: t.date }]),
		);

		if (tournamentIds.length > 0) {
			const { data: results } = await supabaseServer
				.from('tournament_results')
				.select('tournament_id, division, finish_position, field_size')
				.eq('team_id', teamId)
				.in('tournament_id', tournamentIds);

			history = (results ?? [])
				.map((r) => {
					const tourn = tournamentMap.get(r.tournament_id);
					return {
						tournament_name: tourn?.name ?? '',
						tournament_date: tourn?.date ?? '',
						division: r.division,
						finish_position: r.finish_position,
						field_size: r.field_size,
					};
				})
				.sort((a, b) => a.tournament_date.localeCompare(b.tournament_date));
		}
	}

	// Fetch H2H records from matches table
	let h2h: {
		total_wins: number;
		total_losses: number;
		has_match_data: boolean;
		opponents: Array<{ id: string; name: string; wins: number; losses: number }>;
	} = { total_wins: 0, total_losses: 0, has_match_data: false, opponents: [] };

	if (seasonId) {
		const { data: tournaments } = await supabaseServer
			.from('tournaments')
			.select('id')
			.eq('season_id', seasonId);

		const tournamentIds = (tournaments ?? []).map((t) => t.id);

		if (tournamentIds.length > 0) {
			const { data: matchesA } = await supabaseServer
				.from('matches')
				.select('team_a_id, team_b_id, winner_id')
				.eq('team_a_id', teamId)
				.in('tournament_id', tournamentIds);

			const { data: matchesB } = await supabaseServer
				.from('matches')
				.select('team_a_id, team_b_id, winner_id')
				.eq('team_b_id', teamId)
				.in('tournament_id', tournamentIds);

			const allMatches = [...(matchesA ?? []), ...(matchesB ?? [])];

			if (allMatches.length > 0) {
				const opponentStats = new Map<string, { wins: number; losses: number }>();
				let totalWins = 0;
				let totalLosses = 0;

				for (const match of allMatches) {
					const opponentId = match.team_a_id === teamId ? match.team_b_id : match.team_a_id;
					const won = match.winner_id === teamId;

					if (!opponentStats.has(opponentId)) {
						opponentStats.set(opponentId, { wins: 0, losses: 0 });
					}
					const stats = opponentStats.get(opponentId)!;
					if (won) {
						stats.wins++;
						totalWins++;
					} else {
						stats.losses++;
						totalLosses++;
					}
				}

				const opponentIds = [...opponentStats.keys()];
				const { data: opponentRows } = await supabaseServer
					.from('teams')
					.select('id, name')
					.in('id', opponentIds.length > 0 ? opponentIds : ['__none__']);

				const nameMap = new Map((opponentRows ?? []).map((t) => [t.id, t.name]));

				h2h = {
					total_wins: totalWins,
					total_losses: totalLosses,
					has_match_data: true,
					opponents: opponentIds
						.map((id) => ({
							id,
							name: nameMap.get(id) ?? id,
							wins: opponentStats.get(id)!.wins,
							losses: opponentStats.get(id)!.losses,
						}))
						.sort((a, b) => a.name.localeCompare(b.name)),
				};
			}
		}
	}

	// Fetch override for this team in this run
	const { data: overrideRow } = await supabaseServer
		.from('ranking_overrides')
		.select('original_rank, final_rank, justification, committee_member, created_at, updated_at')
		.eq('ranking_run_id', runId)
		.eq('team_id', teamId)
		.maybeSingle();

	return {
		team,
		ranking: rankingRow
			? {
					algo1_rating: rankingRow.algo1_rating ?? 0,
					algo1_rank: rankingRow.algo1_rank ?? 0,
					algo2_rating: rankingRow.algo2_rating ?? 0,
					algo2_rank: rankingRow.algo2_rank ?? 0,
					algo3_rating: rankingRow.algo3_rating ?? 0,
					algo3_rank: rankingRow.algo3_rank ?? 0,
					algo4_rating: rankingRow.algo4_rating ?? 0,
					algo4_rank: rankingRow.algo4_rank ?? 0,
					algo5_rating: rankingRow.algo5_rating ?? 0,
					algo5_rank: rankingRow.algo5_rank ?? 0,
					agg_rating: rankingRow.agg_rating ?? 0,
					agg_rank: rankingRow.agg_rank ?? 0,
				}
			: null,
		override: overrideRow
			? {
					original_rank: overrideRow.original_rank,
					final_rank: overrideRow.final_rank,
					justification: overrideRow.justification,
					committee_member: overrideRow.committee_member,
					created_at: overrideRow.created_at,
					updated_at: overrideRow.updated_at,
				}
			: null,
		history,
		h2h,
		runId,
	};
};
