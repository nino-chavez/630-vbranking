import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import { supabaseServer } from '$lib/supabase-server.js';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.session) {
		redirect(303, '/auth/login');
	}
	const { data: seasons, error } = await supabaseServer
		.from('seasons')
		.select('id, name')
		.order('start_date', { ascending: false });

	if (error) {
		console.error('Failed to load seasons:', error.message);
		return { seasons: [] };
	}

	return { seasons: seasons ?? [] };
};
