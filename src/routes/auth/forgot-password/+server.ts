import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ request, locals, url }) => {
	const { email } = await request.json();

	if (!email) {
		return json({ error: 'Email is required.' }, { status: 400 });
	}

	const redirectTo = `${url.origin}/auth/reset-password`;

	const { error } = await locals.supabase.auth.resetPasswordForEmail(email, { redirectTo });

	if (error) {
		// Don't reveal whether the email exists — always return success
		console.error('Password reset error:', error.message);
	}

	return json({ success: true });
};
