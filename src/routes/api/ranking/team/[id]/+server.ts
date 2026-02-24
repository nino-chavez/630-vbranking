import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { requireAuth } from '$lib/auth-guard.js';
import { supabaseServer } from '$lib/supabase-server.js';

/**
 * GET /api/ranking/team/[id]
 *
 * Returns team info (name, code, region, age_group).
 */
export const GET: RequestHandler = async ({ params, locals }) => {
  const authError = requireAuth(locals);
  if (authError) return authError;

  const teamId = params.id;

  try {
    const { data: team, error } = await supabaseServer
      .from('teams')
      .select('id, name, code, region, age_group')
      .eq('id', teamId)
      .single();

    if (error || !team) {
      return json(
        { success: false, error: 'Team not found' },
        { status: 404 },
      );
    }

    return json({ success: true, data: { team } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return json({ success: false, error: message }, { status: 500 });
  }
};
