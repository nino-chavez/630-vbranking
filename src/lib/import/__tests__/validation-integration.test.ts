import { describe, it, expect } from 'vitest';
import { tournamentResultInsertSchema } from '../../schemas/tournament-result.js';
import { rankingResultInsertSchema } from '../../schemas/ranking-result.js';

/**
 * Zod Validation Integration Tests (Task Group 4, Sub-task 4.2)
 *
 * These tests verify that parsed row shapes from the Finishes and Colley
 * parsers pass through the actual Zod schemas correctly. They test the
 * real schemas (not mocks) via .safeParse().
 */

describe('Zod validation: tournamentResultInsertSchema', () => {
	it('accepts valid Finishes rows and rejects rows where finish_position > field_size', () => {
		// Arrange: a valid row that matches what the Finishes parser + identity
		// resolver would produce (team_id and tournament_id are resolved UUIDs)
		const validRow = {
			team_id: '550e8400-e29b-41d4-a716-446655440001',
			tournament_id: '550e8400-e29b-41d4-a716-446655440002',
			division: '18O',
			finish_position: 3,
			field_size: 24,
		};

		// Act: validate the valid row
		const validResult = tournamentResultInsertSchema.safeParse(validRow);

		// Assert: valid row passes
		expect(validResult.success).toBe(true);

		// Arrange: an invalid row where finish_position > field_size
		const invalidRow = {
			team_id: '550e8400-e29b-41d4-a716-446655440001',
			tournament_id: '550e8400-e29b-41d4-a716-446655440002',
			division: '18O',
			finish_position: 25,
			field_size: 24,
		};

		// Act: validate the invalid row
		const invalidResult = tournamentResultInsertSchema.safeParse(invalidRow);

		// Assert: invalid row fails with the correct error about finish_position
		expect(invalidResult.success).toBe(false);
		if (!invalidResult.success) {
			const messages = invalidResult.error.issues.map((i) => i.message);
			expect(messages.some((m) => m.includes('finish_position'))).toBe(true);
		}
	});

	it('rejects a row with an empty division string', () => {
		// Arrange: row with empty division (violates z.string().min(1))
		const row = {
			team_id: '550e8400-e29b-41d4-a716-446655440001',
			tournament_id: '550e8400-e29b-41d4-a716-446655440002',
			division: '',
			finish_position: 3,
			field_size: 24,
		};

		// Act
		const result = tournamentResultInsertSchema.safeParse(row);

		// Assert: rejected because division must be a non-empty string
		expect(result.success).toBe(false);
		if (!result.success) {
			const divisionIssues = result.error.issues.filter((i) => i.path.includes('division'));
			expect(divisionIssues.length).toBeGreaterThan(0);
		}
	});
});

describe('Zod validation: rankingResultInsertSchema', () => {
	it('accepts Colley rows where all algo fields are null', () => {
		// Arrange: a Colley row with all nullable algo/rank/agg fields set to null
		// This verifies that the schema correctly handles nullable columns
		const row = {
			ranking_run_id: '550e8400-e29b-41d4-a716-446655440010',
			team_id: '550e8400-e29b-41d4-a716-446655440001',
			algo1_rating: null,
			algo1_rank: null,
			algo2_rating: null,
			algo2_rank: null,
			algo3_rating: null,
			algo3_rank: null,
			algo4_rating: null,
			algo4_rank: null,
			algo5_rating: null,
			algo5_rank: null,
			agg_rating: null,
			agg_rank: null,
		};

		// Act
		const result = rankingResultInsertSchema.safeParse(row);

		// Assert: all-null algo fields are accepted
		expect(result.success).toBe(true);

		// Also verify a fully-populated Colley row passes
		const fullRow = {
			ranking_run_id: '550e8400-e29b-41d4-a716-446655440010',
			team_id: '550e8400-e29b-41d4-a716-446655440001',
			algo1_rating: 0.85,
			algo1_rank: 1,
			algo2_rating: 0.82,
			algo2_rank: 2,
			algo3_rating: 0.9,
			algo3_rank: 1,
			algo4_rating: 0.88,
			algo4_rank: 1,
			algo5_rating: 0.79,
			algo5_rank: 3,
			agg_rating: 0.848,
			agg_rank: 1,
		};

		const fullResult = rankingResultInsertSchema.safeParse(fullRow);
		expect(fullResult.success).toBe(true);
	});
});
