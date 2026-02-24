import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { supabaseServer } from '$lib/supabase-server.js';
import { AgeGroup } from '$lib/schemas/enums.js';
import { RankingService } from '$lib/ranking/ranking-service.js';
import { DEFAULT_K_FACTOR, ELO_STARTING_RATINGS } from '$lib/ranking/elo.js';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();

    // Validate season_id
    const seasonId = body.season_id;
    if (!seasonId || typeof seasonId !== 'string') {
      return json(
        { success: false, error: 'Missing required field: season_id' },
        { status: 400 }
      );
    }

    // Validate age_group
    const ageGroupResult = AgeGroup.safeParse(body.age_group);
    if (!ageGroupResult.success) {
      return json(
        {
          success: false,
          error: `Invalid age_group: "${body.age_group ?? ''}". Must be one of: 15U, 16U, 17U, 18U`,
        },
        { status: 400 }
      );
    }

    const service = new RankingService(supabaseServer);
    const output = await service.runRanking({
      season_id: seasonId,
      age_group: ageGroupResult.data,
      k_factor: DEFAULT_K_FACTOR,
      elo_starting_ratings: [...ELO_STARTING_RATINGS],
    });

    return json({
      success: true,
      data: {
        ranking_run_id: output.ranking_run_id,
        teams_ranked: output.teams_ranked,
        ran_at: output.ran_at,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return json({ success: false, error: message }, { status: 500 });
  }
};
