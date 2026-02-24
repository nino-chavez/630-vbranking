import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { requireAuth } from '$lib/auth-guard.js';
import { supabaseServer } from '$lib/supabase-server.js';
import { tournamentWeightInsertSchema } from '$lib/schemas/tournament-weight.js';
import { z } from 'zod';

/**
 * GET /api/ranking/weights?season_id=...
 *
 * Returns all tournaments for a season with their weights.
 * Tournaments without custom weights get defaults (weight: 1.0, tier: 5).
 */
export const GET: RequestHandler = async ({ url, locals }) => {
  const authError = requireAuth(locals);
  if (authError) return authError;

  const seasonId = url.searchParams.get('season_id');

  if (!seasonId) {
    return json(
      { success: false, error: 'Missing required parameter: season_id' },
      { status: 400 },
    );
  }

  try {
    // Fetch tournaments for this season
    const { data: tournaments, error: tournError } = await supabaseServer
      .from('tournaments')
      .select('id, name, date')
      .eq('season_id', seasonId)
      .order('date');

    if (tournError) {
      return json({ success: false, error: tournError.message }, { status: 500 });
    }

    const tournamentIds = (tournaments ?? []).map((t) => t.id);

    // Fetch existing custom weights
    const { data: weightRows, error: weightError } = await supabaseServer
      .from('tournament_weights')
      .select('tournament_id, weight, tier')
      .eq('season_id', seasonId)
      .in('tournament_id', tournamentIds.length > 0 ? tournamentIds : ['__none__']);

    if (weightError) {
      return json({ success: false, error: weightError.message }, { status: 500 });
    }

    const weightMap = new Map(
      (weightRows ?? []).map((w) => [w.tournament_id, { weight: Number(w.weight), tier: w.tier }]),
    );

    // Merge: use custom weight if exists, otherwise defaults
    const weights = (tournaments ?? []).map((t) => {
      const custom = weightMap.get(t.id);
      return {
        tournament_id: t.id,
        tournament_name: t.name,
        tournament_date: t.date,
        weight: custom?.weight ?? 1.0,
        tier: custom?.tier ?? 5,
        has_custom_weight: !!custom,
      };
    });

    return json({ success: true, data: { weights } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return json({ success: false, error: message }, { status: 500 });
  }
};

/** Schema for the PUT request body. */
const putBodySchema = z.object({
  season_id: z.string().uuid(),
  weights: z.array(
    tournamentWeightInsertSchema.pick({
      tournament_id: true,
      weight: true,
      tier: true,
    }),
  ).min(1),
});

/**
 * PUT /api/ranking/weights
 *
 * Upserts tournament weight records for a season.
 */
export const PUT: RequestHandler = async ({ request, locals }) => {
  const authError = requireAuth(locals);
  if (authError) return authError;

  try {
    const body = await request.json();
    const parsed = putBodySchema.safeParse(body);

    if (!parsed.success) {
      return json(
        { success: false, error: parsed.error.issues.map((i) => i.message).join('; ') },
        { status: 400 },
      );
    }

    const { season_id, weights } = parsed.data;

    const rows = weights.map((w) => ({
      tournament_id: w.tournament_id,
      season_id,
      weight: w.weight,
      tier: w.tier,
    }));

    const { error } = await supabaseServer
      .from('tournament_weights')
      .upsert(rows, { onConflict: 'tournament_id,season_id' });

    if (error) {
      return json({ success: false, error: error.message }, { status: 500 });
    }

    return json({ success: true, data: { upserted: rows.length } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return json({ success: false, error: message }, { status: 500 });
  }
};
