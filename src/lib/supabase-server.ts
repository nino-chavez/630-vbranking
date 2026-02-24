import { createClient } from '@supabase/supabase-js';
import type { Database } from './types/database.types.js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

/**
 * Server-side Supabase client using the service role key.
 *
 * This client has elevated permissions and should ONLY be used
 * in server-side code (+server.ts, +page.server.ts, hooks.server.ts).
 *
 * Uses $env/static/private for the service role key, which is not
 * accessible in client-side code.
 */
export const supabaseServer = createClient<Database>(
	PUBLIC_SUPABASE_URL,
	SUPABASE_SERVICE_ROLE_KEY,
);
