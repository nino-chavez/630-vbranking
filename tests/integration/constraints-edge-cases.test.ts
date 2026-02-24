import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { rankingResultInsertSchema } from '../../src/lib/schemas/index';

/**
 * Constraint and edge case tests.
 *
 * Tests 6-9 verify UNIQUE constraints exist in migration SQL files
 * by structural analysis (string/regex matching).
 * Test 10 validates Zod schema behavior for nullable algo fields.
 */

const MIGRATIONS_DIR = resolve(import.meta.dirname, '../../supabase/migrations');

function readMigration(filename: string): string {
	return readFileSync(resolve(MIGRATIONS_DIR, filename), 'utf-8');
}

describe('unique constraints in migration SQL', () => {
	it('teams migration contains UNIQUE constraint on (code, age_group)', () => {
		const sql = readMigration('20260223180005_create_teams_table.sql');

		// Verify the UNIQUE constraint exists covering code and age_group
		expect(sql).toMatch(/UNIQUE\s*\(\s*code\s*,\s*age_group\s*\)/i);
	});

	it('tournament_weights migration contains UNIQUE constraint on (tournament_id, season_id)', () => {
		const sql = readMigration('20260223180007_create_tournament_weights_table.sql');

		// Verify the UNIQUE constraint on (tournament_id, season_id)
		expect(sql).toMatch(/UNIQUE\s*\(\s*tournament_id\s*,\s*season_id\s*\)/i);
	});

	it('tournament_results migration contains UNIQUE constraint on (team_id, tournament_id)', () => {
		const sql = readMigration('20260223180008_create_tournament_results_table.sql');

		// Verify the UNIQUE constraint on (team_id, tournament_id)
		expect(sql).toMatch(/UNIQUE\s*\(\s*team_id\s*,\s*tournament_id\s*\)/i);
	});

	it('ranking_results migration contains UNIQUE constraint on (ranking_run_id, team_id)', () => {
		const sql = readMigration('20260223180011_create_ranking_results_table.sql');

		// Verify the UNIQUE constraint on (ranking_run_id, team_id)
		expect(sql).toMatch(/UNIQUE\s*\(\s*ranking_run_id\s*,\s*team_id\s*\)/i);
	});
});

describe('Zod schema edge cases', () => {
	it('rankingResultInsertSchema accepts all algo fields as null', () => {
		const validInsert = {
			ranking_run_id: '550e8400-e29b-41d4-a716-446655440000',
			team_id: '660e8400-e29b-41d4-a716-446655440001',
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

		const result = rankingResultInsertSchema.safeParse(validInsert);
		expect(result.success).toBe(true);

		if (result.success) {
			// Verify each algo field is explicitly null in the parsed output
			expect(result.data.algo1_rating).toBeNull();
			expect(result.data.algo1_rank).toBeNull();
			expect(result.data.algo2_rating).toBeNull();
			expect(result.data.algo2_rank).toBeNull();
			expect(result.data.algo3_rating).toBeNull();
			expect(result.data.algo3_rank).toBeNull();
			expect(result.data.algo4_rating).toBeNull();
			expect(result.data.algo4_rank).toBeNull();
			expect(result.data.algo5_rating).toBeNull();
			expect(result.data.algo5_rank).toBeNull();
			expect(result.data.agg_rating).toBeNull();
			expect(result.data.agg_rank).toBeNull();
		}
	});
});
