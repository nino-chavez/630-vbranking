import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { requireAuth } from '$lib/auth-guard.js';
import { supabaseServer } from '$lib/supabase-server.js';
import { AgeGroup } from '$lib/schemas/enums.js';
import { RankingService } from '$lib/ranking/ranking-service.js';
import { DEFAULT_K_FACTOR, ELO_STARTING_RATINGS } from '$lib/ranking/elo.js';

export const config = {
	maxDuration: 60,
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const authError = requireAuth(locals);
	if (authError) return authError;

	try {
		const body = await request.json();

		// Validate season_id
		const seasonId = body.season_id;
		if (!seasonId || typeof seasonId !== 'string') {
			return json({ success: false, error: 'Missing required field: season_id' }, { status: 400 });
		}

		// Validate age_group
		const ageGroupResult = AgeGroup.safeParse(body.age_group);
		if (!ageGroupResult.success) {
			return json(
				{
					success: false,
					error: `Invalid age_group: "${body.age_group ?? ''}". Must be one of: 15U, 16U, 17U, 18U`,
				},
				{ status: 400 },
			);
		}

		const service = new RankingService(supabaseServer);
		const output = await service.runRanking({
			season_id: seasonId,
			age_group: ageGroupResult.data,
			k_factor: DEFAULT_K_FACTOR,
			elo_starting_ratings: [...ELO_STARTING_RATINGS],
		});

		// Build seeding_factors as a Record keyed by team_id for frontend convenience
		const seedingFactorsMap: Record<
			string,
			{
				win_pct: number;
				best_national_finish: number | null;
				best_national_tournament_name: string | null;
			}
		> = {};
		for (const sf of output.seeding_factors ?? []) {
			seedingFactorsMap[sf.team_id] = {
				win_pct: sf.win_pct,
				best_national_finish: sf.best_national_finish,
				best_national_tournament_name: sf.best_national_tournament_name,
			};
		}

		return json({
			success: true,
			data: {
				ranking_run_id: output.ranking_run_id,
				teams_ranked: output.teams_ranked,
				ran_at: output.ran_at,
				seeding_factors: seedingFactorsMap,
			},
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : 'An unexpected error occurred';
		return json({ success: false, error: message }, { status: 500 });
	}
};
