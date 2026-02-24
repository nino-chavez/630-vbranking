import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * Returns a 401 JSON response if the user is not authenticated.
 * Use at the top of API route handlers for per-endpoint auth checks.
 */
export function requireAuth(locals: RequestEvent['locals']): Response | null {
	if (!locals.user) {
		return json({ success: false, error: 'Unauthorized' }, { status: 401 });
	}
	return null;
}
