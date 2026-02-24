import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types.js';
import type { ValidatedRow } from './import-service.js';

/**
 * Detect duplicate Finishes rows by checking if any team_id + tournament_id
 * combinations in the validated rows already exist in the database.
 *
 * @param rows - Validated rows with resolved team_id and tournament_id
 * @param supabase - Supabase client instance
 * @returns Map of "team_id:tournament_id" -> existing record ID for duplicates
 */
export async function detectDuplicateFinishes(
	rows: ValidatedRow[],
	supabase: SupabaseClient<Database>,
): Promise<Map<string, string>> {
	const duplicates = new Map<string, string>();
	const validRows = rows.filter((r) => r.valid);

	if (validRows.length === 0) {
		return duplicates;
	}

	// Extract unique team_id and tournament_id values
	const teamIds = [...new Set(validRows.map((r) => r.data.team_id as string))];
	const tournamentIds = [...new Set(validRows.map((r) => r.data.tournament_id as string))];

	// Query existing records that match any of these team/tournament combinations
	const { data: existing, error } = await supabase
		.from('tournament_results')
		.select('id, team_id, tournament_id')
		.in('team_id', teamIds)
		.in('tournament_id', tournamentIds);

	if (error) {
		throw new Error(`Failed to query existing tournament results: ${error.message}`);
	}

	if (existing) {
		for (const record of existing) {
			const key = `${record.team_id}:${record.tournament_id}`;
			duplicates.set(key, record.id);
		}
	}

	return duplicates;
}

/**
 * Detect duplicate Colley rows by checking if any team_id + ranking_run_id
 * combinations in the validated rows already exist in the database.
 *
 * @param rows - Validated rows with resolved team_id and ranking_run_id
 * @param rankingRunId - The ranking run ID to check against
 * @param supabase - Supabase client instance
 * @returns Map of "team_id:ranking_run_id" -> existing record ID for duplicates
 */
export async function detectDuplicateColley(
	rows: ValidatedRow[],
	rankingRunId: string,
	supabase: SupabaseClient<Database>,
): Promise<Map<string, string>> {
	const duplicates = new Map<string, string>();
	const validRows = rows.filter((r) => r.valid);

	if (validRows.length === 0) {
		return duplicates;
	}

	// Extract unique team_id values
	const teamIds = [...new Set(validRows.map((r) => r.data.team_id as string))];

	// Query existing records for this ranking run
	const { data: existing, error } = await supabase
		.from('ranking_results')
		.select('id, team_id, ranking_run_id')
		.eq('ranking_run_id', rankingRunId)
		.in('team_id', teamIds);

	if (error) {
		throw new Error(`Failed to query existing ranking results: ${error.message}`);
	}

	if (existing) {
		for (const record of existing) {
			const key = `${record.team_id}:${record.ranking_run_id}`;
			duplicates.set(key, record.id);
		}
	}

	return duplicates;
}
