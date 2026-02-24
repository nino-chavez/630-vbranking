import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { requireAuth } from '$lib/auth-guard.js';
import { supabaseServer } from '$lib/supabase-server.js';

/**
 * GET /api/ranking/team/[id]/history?season_id=...
 *
 * Returns tournament history for a team in a given season.
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
			.select('id, name, date')
			.eq('season_id', seasonId)
			.order('date');

		if (tournError) {
			return json({ success: false, error: tournError.message }, { status: 500 });
		}

		const tournamentIds = (tournaments ?? []).map((t) => t.id);
		const tournamentMap = new Map(
			(tournaments ?? []).map((t) => [t.id, { name: t.name, date: t.date }]),
		);

		// Fetch tournament results for the team
		const { data: results, error: resultError } = await supabaseServer
			.from('tournament_results')
			.select('tournament_id, division, finish_position, field_size')
			.eq('team_id', teamId)
			.in('tournament_id', tournamentIds.length > 0 ? tournamentIds : ['__none__']);

		if (resultError) {
			return json({ success: false, error: resultError.message }, { status: 500 });
		}

		// Join with tournament info and sort by date
		const history = (results ?? [])
			.map((r) => {
				const tourn = tournamentMap.get(r.tournament_id);
				return {
					tournament_id: r.tournament_id,
					tournament_name: tourn?.name ?? '',
					tournament_date: tourn?.date ?? '',
					division: r.division,
					finish_position: r.finish_position,
					field_size: r.field_size,
				};
			})
			.sort((a, b) => a.tournament_date.localeCompare(b.tournament_date));

		return json({ success: true, data: { history } });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'An unexpected error occurred';
		return json({ success: false, error: message }, { status: 500 });
	}
};
