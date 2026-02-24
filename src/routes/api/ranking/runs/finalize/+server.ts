import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { requireAuth } from '$lib/auth-guard.js';
import { supabaseServer } from '$lib/supabase-server.js';

/**
 * POST /api/ranking/runs/finalize
 *
 * Set a ranking run's status to 'finalized', making it read-only.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	const authError = requireAuth(locals);
	if (authError) return authError;

	try {
		const body = await request.json();
		const { ranking_run_id } = body;

		if (!ranking_run_id) {
			return json(
				{ success: false, error: 'Missing required field: ranking_run_id' },
				{ status: 400 },
			);
		}

		// Check run exists and is currently draft
		const { data: run, error: runError } = await supabaseServer
			.from('ranking_runs')
			.select('id, status')
			.eq('id', ranking_run_id)
			.single();

		if (runError || !run) {
			return json({ success: false, error: 'Ranking run not found' }, { status: 404 });
		}

		if (run.status === 'finalized') {
			return json({ success: false, error: 'Run is already finalized' }, { status: 400 });
		}

		// Finalize
		const { error: updateError } = await supabaseServer
			.from('ranking_runs')
			.update({ status: 'finalized' })
			.eq('id', ranking_run_id);

		if (updateError) {
			return json({ success: false, error: updateError.message }, { status: 500 });
		}

		return json({ success: true, data: { status: 'finalized' } });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'An unexpected error occurred';
		return json({ success: false, error: message }, { status: 500 });
	}
};
