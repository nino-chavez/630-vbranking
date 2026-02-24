import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { requireAuth } from '$lib/auth-guard.js';
import { supabaseServer } from '$lib/supabase-server.js';
import { rankingOverrideInsertSchema } from '$lib/schemas/ranking-override.js';

/**
 * GET /api/ranking/overrides?ranking_run_id=...
 *
 * Returns all overrides for a ranking run, keyed by team_id.
 */
export const GET: RequestHandler = async ({ url, locals }) => {
	const authError = requireAuth(locals);
	if (authError) return authError;

	const rankingRunId = url.searchParams.get('ranking_run_id');

	if (!rankingRunId) {
		return json(
			{ success: false, error: 'Missing required parameter: ranking_run_id' },
			{ status: 400 },
		);
	}

	try {
		const { data: overrides, error } = await supabaseServer
			.from('ranking_overrides')
			.select(
				'team_id, original_rank, final_rank, justification, committee_member, created_at, updated_at',
			)
			.eq('ranking_run_id', rankingRunId);

		if (error) {
			return json({ success: false, error: error.message }, { status: 500 });
		}

		const overridesMap: Record<
			string,
			{
				original_rank: number;
				final_rank: number;
				justification: string;
				committee_member: string;
				created_at: string;
				updated_at: string;
			}
		> = {};

		for (const o of overrides ?? []) {
			overridesMap[o.team_id] = {
				original_rank: o.original_rank,
				final_rank: o.final_rank,
				justification: o.justification,
				committee_member: o.committee_member,
				created_at: o.created_at,
				updated_at: o.updated_at,
			};
		}

		return json({ success: true, data: { overrides: overridesMap } });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'An unexpected error occurred';
		return json({ success: false, error: message }, { status: 500 });
	}
};

/**
 * POST /api/ranking/overrides
 *
 * Upsert an override for a team in a ranking run.
 * Validates that the run is still in 'draft' status.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	const authError = requireAuth(locals);
	if (authError) return authError;

	try {
		const body = await request.json();
		const parsed = rankingOverrideInsertSchema.safeParse(body);

		if (!parsed.success) {
			return json(
				{ success: false, error: 'Validation failed', details: parsed.error.issues },
				{ status: 400 },
			);
		}

		const { ranking_run_id, team_id, original_rank, final_rank, justification, committee_member } =
			parsed.data;

		// Check run status
		const { data: run, error: runError } = await supabaseServer
			.from('ranking_runs')
			.select('status')
			.eq('id', ranking_run_id)
			.single();

		if (runError || !run) {
			return json({ success: false, error: 'Ranking run not found' }, { status: 404 });
		}

		if (run.status === 'finalized') {
			return json(
				{ success: false, error: 'Cannot modify overrides on a finalized run' },
				{ status: 403 },
			);
		}

		// Upsert override
		const { data: override, error: upsertError } = await supabaseServer
			.from('ranking_overrides')
			.upsert(
				{
					ranking_run_id,
					team_id,
					original_rank,
					final_rank,
					justification,
					committee_member,
				},
				{ onConflict: 'ranking_run_id,team_id' },
			)
			.select(
				'team_id, original_rank, final_rank, justification, committee_member, created_at, updated_at',
			)
			.single();

		if (upsertError) {
			return json({ success: false, error: upsertError.message }, { status: 500 });
		}

		return json({ success: true, data: { override } });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'An unexpected error occurred';
		return json({ success: false, error: message }, { status: 500 });
	}
};

/**
 * DELETE /api/ranking/overrides?ranking_run_id=...&team_id=...
 *
 * Remove an override for a team in a ranking run.
 * Validates that the run is still in 'draft' status.
 */
export const DELETE: RequestHandler = async ({ url, locals }) => {
	const authError = requireAuth(locals);
	if (authError) return authError;

	const rankingRunId = url.searchParams.get('ranking_run_id');
	const teamId = url.searchParams.get('team_id');

	if (!rankingRunId || !teamId) {
		return json(
			{ success: false, error: 'Missing required parameters: ranking_run_id, team_id' },
			{ status: 400 },
		);
	}

	try {
		// Check run status
		const { data: run, error: runError } = await supabaseServer
			.from('ranking_runs')
			.select('status')
			.eq('id', rankingRunId)
			.single();

		if (runError || !run) {
			return json({ success: false, error: 'Ranking run not found' }, { status: 404 });
		}

		if (run.status === 'finalized') {
			return json(
				{ success: false, error: 'Cannot modify overrides on a finalized run' },
				{ status: 403 },
			);
		}

		const { error: deleteError } = await supabaseServer
			.from('ranking_overrides')
			.delete()
			.eq('ranking_run_id', rankingRunId)
			.eq('team_id', teamId);

		if (deleteError) {
			return json({ success: false, error: deleteError.message }, { status: 500 });
		}

		return json({ success: true });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'An unexpected error occurred';
		return json({ success: false, error: message }, { status: 500 });
	}
};
