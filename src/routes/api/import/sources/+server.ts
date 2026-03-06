import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { supabaseServer } from '$lib/supabase-server.js';
import { requireAuth } from '$lib/auth-guard.js';
import { importSourceInsertSchema, importSourceUpdateSchema } from '$lib/schemas/import-source.js';
import type { Database } from '$lib/types/database.types.js';

/**
 * GET /api/import/sources
 * List all import sources, optionally filtered by season_id and age_group.
 */
export const GET: RequestHandler = async ({ locals, url }) => {
	const authError = requireAuth(locals);
	if (authError) return authError;

	const seasonId = url.searchParams.get('season_id');
	const ageGroup = url.searchParams.get('age_group');

	let query = supabaseServer
		.from('import_sources')
		.select('*')
		.order('created_at', { ascending: false });

	if (seasonId) {
		query = query.eq('season_id', seasonId);
	}
	if (ageGroup) {
		query = query.eq('age_group', ageGroup as '15U' | '16U' | '17U' | '18U');
	}

	const { data, error } = await query;

	if (error) {
		return json({ success: false, error: error.message }, { status: 500 });
	}

	return json({ success: true, data: { sources: data ?? [] } });
};

/**
 * POST /api/import/sources
 * Create a new import source.
 */
export const POST: RequestHandler = async ({ locals, request }) => {
	const authError = requireAuth(locals);
	if (authError) return authError;

	const body = await request.json();
	const parsed = importSourceInsertSchema.safeParse(body);

	if (!parsed.success) {
		const errors = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
		return json({ success: false, error: errors.join('; ') }, { status: 400 });
	}

	const { data, error } = await supabaseServer
		.from('import_sources')
		.insert(parsed.data as Database['vbranking']['Tables']['import_sources']['Insert'])
		.select()
		.single();

	if (error) {
		return json({ success: false, error: error.message }, { status: 500 });
	}

	return json({ success: true, data: { source: data } }, { status: 201 });
};

/**
 * PUT /api/import/sources
 * Update an existing import source. Requires `id` in the request body.
 */
export const PUT: RequestHandler = async ({ locals, request }) => {
	const authError = requireAuth(locals);
	if (authError) return authError;

	const body = await request.json();
	const { id, ...fields } = body;

	if (!id) {
		return json({ success: false, error: 'Missing required field: id' }, { status: 400 });
	}

	const parsed = importSourceUpdateSchema.safeParse(fields);

	if (!parsed.success) {
		const errors = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
		return json({ success: false, error: errors.join('; ') }, { status: 400 });
	}

	const { data, error } = await supabaseServer
		.from('import_sources')
		.update(parsed.data as Database['vbranking']['Tables']['import_sources']['Update'])
		.eq('id', id)
		.select()
		.single();

	if (error) {
		return json({ success: false, error: error.message }, { status: 500 });
	}

	return json({ success: true, data: { source: data } });
};

/**
 * DELETE /api/import/sources
 * Delete an import source by `id` query parameter.
 */
export const DELETE: RequestHandler = async ({ locals, url }) => {
	const authError = requireAuth(locals);
	if (authError) return authError;

	const id = url.searchParams.get('id');
	if (!id) {
		return json({ success: false, error: 'Missing required query parameter: id' }, { status: 400 });
	}

	const { error } = await supabaseServer.from('import_sources').delete().eq('id', id);

	if (error) {
		return json({ success: false, error: error.message }, { status: 500 });
	}

	return json({ success: true });
};
