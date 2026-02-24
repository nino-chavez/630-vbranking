import { describe, it, expect } from 'vitest';
import {
	rankingOverrideSchema,
	rankingOverrideInsertSchema,
	rankingOverrideUpdateSchema,
} from '../ranking-override.js';

describe('rankingOverrideSchema', () => {
	const validOverride = {
		id: '550e8400-e29b-41d4-a716-446655440000',
		ranking_run_id: '550e8400-e29b-41d4-a716-446655440001',
		team_id: '550e8400-e29b-41d4-a716-446655440002',
		original_rank: 5,
		final_rank: 3,
		justification: 'Strong head-to-head record and recent performance',
		committee_member: 'Coach Smith',
		created_at: '2026-02-23T18:00:00Z',
		updated_at: '2026-02-23T18:00:00Z',
	};

	it('accepts a valid override', () => {
		const result = rankingOverrideSchema.safeParse(validOverride);
		expect(result.success).toBe(true);
	});

	it('rejects non-UUID id', () => {
		const result = rankingOverrideSchema.safeParse({ ...validOverride, id: 'not-a-uuid' });
		expect(result.success).toBe(false);
	});

	it('rejects justification shorter than 10 characters', () => {
		const result = rankingOverrideSchema.safeParse({
			...validOverride,
			justification: 'Too short',
		});
		expect(result.success).toBe(false);
	});

	it('accepts justification with exactly 10 characters', () => {
		const result = rankingOverrideSchema.safeParse({
			...validOverride,
			justification: '1234567890',
		});
		expect(result.success).toBe(true);
	});

	it('rejects committee_member shorter than 2 characters', () => {
		const result = rankingOverrideSchema.safeParse({ ...validOverride, committee_member: 'A' });
		expect(result.success).toBe(false);
	});

	it('accepts committee_member with exactly 2 characters', () => {
		const result = rankingOverrideSchema.safeParse({ ...validOverride, committee_member: 'AB' });
		expect(result.success).toBe(true);
	});

	it('rejects non-integer original_rank', () => {
		const result = rankingOverrideSchema.safeParse({ ...validOverride, original_rank: 1.5 });
		expect(result.success).toBe(false);
	});

	it('rejects non-integer final_rank', () => {
		const result = rankingOverrideSchema.safeParse({ ...validOverride, final_rank: 2.7 });
		expect(result.success).toBe(false);
	});
});

describe('rankingOverrideInsertSchema', () => {
	const validInsert = {
		ranking_run_id: '550e8400-e29b-41d4-a716-446655440001',
		team_id: '550e8400-e29b-41d4-a716-446655440002',
		original_rank: 5,
		final_rank: 3,
		justification: 'Strong head-to-head record and recent performance',
		committee_member: 'Coach Smith',
	};

	it('accepts a valid insert (no id, timestamps)', () => {
		const result = rankingOverrideInsertSchema.safeParse(validInsert);
		expect(result.success).toBe(true);
	});

	it('rejects insert with missing required fields', () => {
		const { justification: _justification, ...incomplete } = validInsert;
		const result = rankingOverrideInsertSchema.safeParse(incomplete);
		expect(result.success).toBe(false);
	});
});

describe('rankingOverrideUpdateSchema', () => {
	it('accepts partial updates', () => {
		const result = rankingOverrideUpdateSchema.safeParse({ final_rank: 2 });
		expect(result.success).toBe(true);
	});

	it('accepts empty object (all fields optional)', () => {
		const result = rankingOverrideUpdateSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it('validates fields when provided', () => {
		const result = rankingOverrideUpdateSchema.safeParse({ justification: 'short' });
		expect(result.success).toBe(false);
	});
});
