import { describe, it, expect } from 'vitest';
import { requireAuth } from '../auth-guard.js';

function makeLocals(user: unknown) {
	return { user } as Parameters<typeof requireAuth>[0];
}

describe('requireAuth', () => {
	it('returns null when user is present', () => {
		const result = requireAuth(makeLocals({ id: 'u1', email: 'a@b.com' }));
		expect(result).toBeNull();
	});

	it('returns 401 Response when user is null', async () => {
		const result = requireAuth(makeLocals(null));
		expect(result).toBeInstanceOf(Response);
		expect(result!.status).toBe(401);

		const body = await result!.json();
		expect(body.success).toBe(false);
		expect(body.error).toBe('Unauthorized');
	});

	it('returns 401 Response when user is undefined', async () => {
		const result = requireAuth(makeLocals(undefined));
		expect(result).toBeInstanceOf(Response);
		expect(result!.status).toBe(401);
	});
});
