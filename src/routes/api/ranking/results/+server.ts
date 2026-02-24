import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { supabaseServer } from '$lib/supabase-server.js';

export const GET: RequestHandler = async ({ url }) => {
  const rankingRunId = url.searchParams.get('ranking_run_id');

  if (!rankingRunId) {
    return json(
      { success: false, error: 'Missing required parameter: ranking_run_id' },
      { status: 400 },
    );
  }

  try {
    // Fetch ranking results with team names
    const { data: results, error } = await supabaseServer
      .from('ranking_results')
      .select(
        'team_id, algo1_rating, algo1_rank, algo2_rating, algo2_rank, algo3_rating, algo3_rank, algo4_rating, algo4_rank, algo5_rating, algo5_rank, agg_rating, agg_rank',
      )
      .eq('ranking_run_id', rankingRunId)
      .order('agg_rank');

    if (error) {
      return json({ success: false, error: error.message }, { status: 500 });
    }

    // Fetch team names for all team_ids in results
    const teamIds = (results ?? []).map((r) => r.team_id);
    const { data: teamRows } = await supabaseServer
      .from('teams')
      .select('id, name')
      .in('id', teamIds.length > 0 ? teamIds : ['__none__']);

    const teamsMap: Record<string, string> = {};
    for (const team of teamRows ?? []) {
      teamsMap[team.id] = team.name;
    }

    return json({
      success: true,
      data: {
        results: (results ?? []).map((r) => ({
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
        })),
        teams: teamsMap,
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'An unexpected error occurred';
    return json({ success: false, error: message }, { status: 500 });
  }
};
