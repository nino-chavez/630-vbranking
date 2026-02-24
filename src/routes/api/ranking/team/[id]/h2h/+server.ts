import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { requireAuth } from '$lib/auth-guard.js';
import { supabaseServer } from '$lib/supabase-server.js';

/**
 * GET /api/ranking/team/[id]/h2h?season_id=...
 *
 * Returns head-to-head records for a team in a given season.
 * Derived from the matches table.
 */
export const GET: RequestHandler = async ({ params, url, locals }) => {
	const authError = requireAuth(locals);
	if (authError) return authError;

	const teamId = params.id;
	const seasonId = url.searchParams.get('season_id');

	if (!seasonId) {
		return json(
			{ success: false, error: 'Missing required parameter: season_id' },
			{ status: 400 },
		);
	}

	try {
		// Fetch tournaments for the season
		const { data: tournaments, error: tournError } = await supabaseServer
			.from('tournaments')
			.select('id')
			.eq('season_id', seasonId);

		if (tournError) {
			return json({ success: false, error: tournError.message }, { status: 500 });
		}

		const tournamentIds = (tournaments ?? []).map((t) => t.id);

		if (tournamentIds.length === 0) {
			return json({
				success: true,
				data: { total_wins: 0, total_losses: 0, opponents: [], has_match_data: false },
			});
		}

		// Fetch matches involving this team
		const { data: matchesA, error: errA } = await supabaseServer
			.from('matches')
			.select('team_a_id, team_b_id, winner_id')
			.eq('team_a_id', teamId)
			.in('tournament_id', tournamentIds);

		if (errA) {
			return json({ success: false, error: errA.message }, { status: 500 });
		}

		const { data: matchesB, error: errB } = await supabaseServer
			.from('matches')
			.select('team_a_id, team_b_id, winner_id')
			.eq('team_b_id', teamId)
			.in('tournament_id', tournamentIds);

		if (errB) {
			return json({ success: false, error: errB.message }, { status: 500 });
		}

		const allMatches = [...(matchesA ?? []), ...(matchesB ?? [])];

		if (allMatches.length === 0) {
			return json({
				success: true,
				data: { total_wins: 0, total_losses: 0, opponents: [], has_match_data: false },
			});
		}

		// Group by opponent
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

		// Fetch opponent names
		const opponentIds = [...opponentStats.keys()];
		const { data: opponentRows } = await supabaseServer
			.from('teams')
			.select('id, name')
			.in('id', opponentIds.length > 0 ? opponentIds : ['__none__']);

		const nameMap = new Map((opponentRows ?? []).map((t) => [t.id, t.name]));

		const opponents = opponentIds
			.map((id) => {
				const stats = opponentStats.get(id)!;
				return {
					id,
					name: nameMap.get(id) ?? id,
					wins: stats.wins,
					losses: stats.losses,
				};
			})
			.sort((a, b) => a.name.localeCompare(b.name));

		return json({
			success: true,
			data: { total_wins: totalWins, total_losses: totalLosses, opponents, has_match_data: true },
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : 'An unexpected error occurred';
		return json({ success: false, error: message }, { status: 500 });
	}
};
