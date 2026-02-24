import type { PageServerLoad } from './$types.js';
import { supabaseServer } from '$lib/supabase-server.js';

/**
 * Server-side load function for the /import page.
 * Fetches all seasons from the database for the season dropdown.
 */
export const load: PageServerLoad = async () => {
  const { data: seasons, error } = await supabaseServer
    .from('seasons')
    .select('id, name, start_date, end_date, is_active')
    .order('start_date', { ascending: false });

  if (error) {
    console.error('Failed to load seasons:', error.message);
    return { seasons: [] };
  }

  return { seasons: seasons ?? [] };
};
