import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Referential integrity structural tests.
 *
 * Since there is no running Supabase instance, these tests verify that
 * the migration SQL files contain the expected foreign key constraints
 * by reading the SQL source and matching against expected patterns.
 */

const MIGRATIONS_DIR = resolve(import.meta.dirname, '../../supabase/migrations');

function readMigration(filename: string): string {
	return readFileSync(resolve(MIGRATIONS_DIR, filename), 'utf-8');
}

describe('referential integrity constraints in migration SQL', () => {
	it('tournaments migration contains REFERENCES seasons(id) ON DELETE CASCADE', () => {
		const sql = readMigration('20260223180006_create_tournaments_table.sql');

		// Verify season_id FK with CASCADE
		expect(sql).toMatch(
			/season_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+seasons\s*\(\s*id\s*\)\s+ON\s+DELETE\s+CASCADE/i,
		);
	});

	it('tournament_results migration contains REFERENCES teams(id) ON DELETE RESTRICT', () => {
		const sql = readMigration('20260223180008_create_tournament_results_table.sql');

		// Verify team_id FK with RESTRICT
		expect(sql).toMatch(
			/team_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+teams\s*\(\s*id\s*\)\s+ON\s+DELETE\s+RESTRICT/i,
		);
	});

	it('matches migration contains both team_a_id and team_b_id FK references to teams(id) ON DELETE RESTRICT', () => {
		const sql = readMigration('20260223180009_create_matches_table.sql');

		// Verify team_a_id FK with RESTRICT
		expect(sql).toMatch(
			/team_a_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+teams\s*\(\s*id\s*\)\s+ON\s+DELETE\s+RESTRICT/i,
		);

		// Verify team_b_id FK with RESTRICT
		expect(sql).toMatch(
			/team_b_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+teams\s*\(\s*id\s*\)\s+ON\s+DELETE\s+RESTRICT/i,
		);
	});

	it('ranking_runs migration contains REFERENCES seasons(id) ON DELETE CASCADE', () => {
		const sql = readMigration('20260223180010_create_ranking_runs_table.sql');

		// Verify season_id FK with CASCADE
		expect(sql).toMatch(
			/season_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+seasons\s*\(\s*id\s*\)\s+ON\s+DELETE\s+CASCADE/i,
		);
	});

	it('ranking_results migration contains REFERENCES ranking_runs(id) ON DELETE CASCADE and REFERENCES teams(id) ON DELETE RESTRICT', () => {
		const sql = readMigration('20260223180011_create_ranking_results_table.sql');

		// Verify ranking_run_id FK with CASCADE
		expect(sql).toMatch(
			/ranking_run_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+ranking_runs\s*\(\s*id\s*\)\s+ON\s+DELETE\s+CASCADE/i,
		);

		// Verify team_id FK with RESTRICT
		expect(sql).toMatch(
			/team_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+teams\s*\(\s*id\s*\)\s+ON\s+DELETE\s+RESTRICT/i,
		);
	});
});
