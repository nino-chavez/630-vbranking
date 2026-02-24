import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '../types/database.types.js';
import { tournamentResultInsertSchema } from '../schemas/tournament-result.js';
import { rankingResultInsertSchema } from '../schemas/ranking-result.js';
import type {
	ParsedFinishesRow,
	ParsedColleyRow,
	IdentityMapping,
	ImportSummaryData,
	ImportFormat,
	ImportMode,
} from './types.js';

/** A row that has been validated and is ready for database insertion */
export interface ValidatedRow {
	/** The validated data object, conforming to the target table's insert schema */
	data: Record<string, unknown>;
	/** Whether this row passed validation */
	valid: boolean;
	/** Validation error messages, if any */
	errors: string[];
	/** The original row index from the parsed data (for reference) */
	originalIndex: number;
}

/**
 * Service that orchestrates the import flow: validates parsed rows against
 * Zod schemas, resolves identities, and executes database writes in either
 * replace or merge mode.
 */
export class ImportService {
	private supabase: SupabaseClient<Database>;

	constructor(supabase: SupabaseClient<Database>) {
		this.supabase = supabase;
	}

	/**
	 * Validate parsed Finishes rows by applying identity mappings and
	 * validating each row against the tournamentResultInsertSchema.
	 *
	 * @param rows - Parsed Finishes rows from the parser
	 * @param identityMappings - User's identity resolution mappings
	 * @returns Array of ValidatedRow objects with resolved UUIDs or validation errors
	 */
	validateFinishesRows(
		rows: ParsedFinishesRow[],
		identityMappings: IdentityMapping[],
	): ValidatedRow[] {
		// Build lookup maps from identity mappings
		const teamMappings = new Map<string, IdentityMapping>();
		const tournamentMappings = new Map<string, IdentityMapping>();

		for (const mapping of identityMappings) {
			if (mapping.type === 'team') {
				teamMappings.set(mapping.parsedValue, mapping);
			} else if (mapping.type === 'tournament') {
				tournamentMappings.set(mapping.parsedValue, mapping);
			}
		}

		const validatedRows: ValidatedRow[] = [];

		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];

			// Resolve team ID
			const teamMapping = teamMappings.get(row.teamCode);
			if (teamMapping?.action === 'skip') {
				continue; // Skip rows for skipped teams
			}

			// Resolve tournament ID
			const tournamentMapping = tournamentMappings.get(row.tournamentName);
			if (tournamentMapping?.action === 'skip') {
				continue; // Skip rows for skipped tournaments
			}

			const teamId = teamMapping?.mappedId;
			const tournamentId = tournamentMapping?.mappedId;

			const errors: string[] = [];

			if (!teamId) {
				errors.push(`No mapping found for team code: ${row.teamCode}`);
			}

			if (!tournamentId) {
				errors.push(`No mapping found for tournament: ${row.tournamentName}`);
			}

			if (errors.length > 0) {
				validatedRows.push({
					data: {},
					valid: false,
					errors,
					originalIndex: i,
				});
				continue;
			}

			// Build the insert data object
			const insertData = {
				team_id: teamId!,
				tournament_id: tournamentId!,
				division: row.division,
				finish_position: row.finishPosition,
				field_size: row.fieldSize,
			};

			// Validate against the Zod schema
			const result = tournamentResultInsertSchema.safeParse(insertData);

			if (result.success) {
				validatedRows.push({
					data: result.data,
					valid: true,
					errors: [],
					originalIndex: i,
				});
			} else {
				const zodErrors = result.error.issues.map(
					(issue) => `${issue.path.join('.')}: ${issue.message}`,
				);
				validatedRows.push({
					data: insertData,
					valid: false,
					errors: zodErrors,
					originalIndex: i,
				});
			}
		}

		return validatedRows;
	}

	/**
	 * Validate parsed Colley rows by applying identity mappings and
	 * validating each row against the rankingResultInsertSchema.
	 *
	 * @param rows - Parsed Colley rows from the parser
	 * @param identityMappings - User's identity resolution mappings
	 * @param rankingRunId - The ranking run ID to associate results with
	 * @returns Array of ValidatedRow objects with resolved UUIDs or validation errors
	 */
	validateColleyRows(
		rows: ParsedColleyRow[],
		identityMappings: IdentityMapping[],
		rankingRunId: string,
	): ValidatedRow[] {
		// Build lookup map from identity mappings
		const teamMappings = new Map<string, IdentityMapping>();
		for (const mapping of identityMappings) {
			if (mapping.type === 'team') {
				teamMappings.set(mapping.parsedValue, mapping);
			}
		}

		const validatedRows: ValidatedRow[] = [];

		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];

			// Resolve team ID
			const teamMapping = teamMappings.get(row.teamCode);
			if (teamMapping?.action === 'skip') {
				continue; // Skip rows for skipped teams
			}

			const teamId = teamMapping?.mappedId;
			const errors: string[] = [];

			if (!teamId) {
				errors.push(`No mapping found for team code: ${row.teamCode}`);
			}

			if (errors.length > 0) {
				validatedRows.push({
					data: {},
					valid: false,
					errors,
					originalIndex: i,
				});
				continue;
			}

			// Build the insert data object
			const insertData = {
				ranking_run_id: rankingRunId,
				team_id: teamId!,
				algo1_rating: row.algo1Rating,
				algo1_rank: row.algo1Rank,
				algo2_rating: row.algo2Rating,
				algo2_rank: row.algo2Rank,
				algo3_rating: row.algo3Rating,
				algo3_rank: row.algo3Rank,
				algo4_rating: row.algo4Rating,
				algo4_rank: row.algo4Rank,
				algo5_rating: row.algo5Rating,
				algo5_rank: row.algo5Rank,
				agg_rating: row.aggRating,
				agg_rank: row.aggRank,
			};

			// Validate against the Zod schema
			const result = rankingResultInsertSchema.safeParse(insertData);

			if (result.success) {
				validatedRows.push({
					data: result.data,
					valid: true,
					errors: [],
					originalIndex: i,
				});
			} else {
				const zodErrors = result.error.issues.map(
					(issue) => `${issue.path.join('.')}: ${issue.message}`,
				);
				validatedRows.push({
					data: insertData,
					valid: false,
					errors: zodErrors,
					originalIndex: i,
				});
			}
		}

		return validatedRows;
	}

	/**
	 * Execute a replace import: atomically delete all existing records for the
	 * season+age_group (Finishes) or ranking_run_id (Colley), then insert all
	 * validated rows.
	 *
	 * Uses Supabase RPC functions for atomicity.
	 *
	 * @param validatedRows - Only valid rows (pre-filtered)
	 * @param seasonId - The season ID
	 * @param ageGroup - The age group
	 * @param format - The import format (finishes or colley)
	 * @param rankingRunId - Required for Colley format
	 * @returns Import summary with counts
	 */
	async executeReplace(
		validatedRows: ValidatedRow[],
		seasonId: string,
		ageGroup: string,
		format: ImportFormat,
		rankingRunId?: string,
	): Promise<ImportSummaryData> {
		const validRows = validatedRows.filter((r) => r.valid);

		if (format === 'finishes') {
			const rowsJsonb = validRows.map((r) => r.data) as Json;

			const { error } = await this.supabase.rpc('import_replace_tournament_results', {
				p_season_id: seasonId,
				p_age_group: ageGroup,
				p_rows: rowsJsonb,
			});

			if (error) {
				throw new Error(`Replace import failed: ${error.message}`);
			}

			return {
				rowsInserted: validRows.length,
				rowsUpdated: 0,
				rowsSkipped: validatedRows.length - validRows.length,
				teamsCreated: 0,
				tournamentsCreated: 0,
				importMode: 'replace' as ImportMode,
				timestamp: new Date().toISOString(),
				seasonId,
				ageGroup,
			};
		} else {
			// Colley format
			if (!rankingRunId) {
				throw new Error('rankingRunId is required for Colley replace mode');
			}

			const rowsJsonb = validRows.map((r) => r.data) as Json;

			const { error } = await this.supabase.rpc('import_replace_ranking_results', {
				p_ranking_run_id: rankingRunId,
				p_rows: rowsJsonb,
			});

			if (error) {
				throw new Error(`Replace import failed: ${error.message}`);
			}

			return {
				rowsInserted: validRows.length,
				rowsUpdated: 0,
				rowsSkipped: validatedRows.length - validRows.length,
				teamsCreated: 0,
				tournamentsCreated: 0,
				importMode: 'replace' as ImportMode,
				timestamp: new Date().toISOString(),
				seasonId,
				ageGroup,
			};
		}
	}

	/**
	 * Execute a merge import: insert new rows, update changed rows,
	 * skip identical rows.
	 *
	 * @param validatedRows - Only valid rows (pre-filtered)
	 * @param format - The import format (finishes or colley)
	 * @param seasonId - The season ID
	 * @param ageGroup - The age group
	 * @returns Import summary with counts
	 */
	async executeMerge(
		validatedRows: ValidatedRow[],
		format: ImportFormat,
		seasonId: string,
		ageGroup: string,
	): Promise<ImportSummaryData> {
		const validRows = validatedRows.filter((r) => r.valid);
		let rowsInserted = 0;
		let rowsUpdated = 0;
		let rowsSkipped = 0;

		if (format === 'finishes') {
			for (const row of validRows) {
				const data = row.data as {
					team_id: string;
					tournament_id: string;
					division: string;
					finish_position: number;
					field_size: number;
				};

				// Check if a record with this composite key already exists
				const { data: existing, error: selectError } = await this.supabase
					.from('tournament_results')
					.select('id, division, finish_position, field_size')
					.eq('team_id', data.team_id)
					.eq('tournament_id', data.tournament_id)
					.maybeSingle();

				if (selectError) {
					throw new Error(`Merge select failed: ${selectError.message}`);
				}

				if (!existing) {
					// INSERT new row
					const { error: insertError } = await this.supabase
						.from('tournament_results')
						.insert(data);

					if (insertError) {
						throw new Error(`Merge insert failed: ${insertError.message}`);
					}
					rowsInserted++;
				} else if (
					existing.division !== data.division ||
					existing.finish_position !== data.finish_position ||
					existing.field_size !== data.field_size
				) {
					// UPDATE changed row
					const { error: updateError } = await this.supabase
						.from('tournament_results')
						.update({
							division: data.division,
							finish_position: data.finish_position,
							field_size: data.field_size,
						})
						.eq('id', existing.id);

					if (updateError) {
						throw new Error(`Merge update failed: ${updateError.message}`);
					}
					rowsUpdated++;
				} else {
					// SKIP identical row
					rowsSkipped++;
				}
			}
		} else {
			// Colley format
			for (const row of validRows) {
				const data = row.data as {
					ranking_run_id: string;
					team_id: string;
					algo1_rating: number | null;
					algo1_rank: number | null;
					algo2_rating: number | null;
					algo2_rank: number | null;
					algo3_rating: number | null;
					algo3_rank: number | null;
					algo4_rating: number | null;
					algo4_rank: number | null;
					algo5_rating: number | null;
					algo5_rank: number | null;
					agg_rating: number | null;
					agg_rank: number | null;
				};

				// Check if a record with this composite key already exists
				const { data: existing, error: selectError } = await this.supabase
					.from('ranking_results')
					.select(
						'id, algo1_rating, algo1_rank, algo2_rating, algo2_rank, algo3_rating, algo3_rank, algo4_rating, algo4_rank, algo5_rating, algo5_rank, agg_rating, agg_rank',
					)
					.eq('team_id', data.team_id)
					.eq('ranking_run_id', data.ranking_run_id)
					.maybeSingle();

				if (selectError) {
					throw new Error(`Merge select failed: ${selectError.message}`);
				}

				if (!existing) {
					// INSERT new row
					const { error: insertError } = await this.supabase.from('ranking_results').insert(data);

					if (insertError) {
						throw new Error(`Merge insert failed: ${insertError.message}`);
					}
					rowsInserted++;
				} else if (
					existing.algo1_rating !== data.algo1_rating ||
					existing.algo1_rank !== data.algo1_rank ||
					existing.algo2_rating !== data.algo2_rating ||
					existing.algo2_rank !== data.algo2_rank ||
					existing.algo3_rating !== data.algo3_rating ||
					existing.algo3_rank !== data.algo3_rank ||
					existing.algo4_rating !== data.algo4_rating ||
					existing.algo4_rank !== data.algo4_rank ||
					existing.algo5_rating !== data.algo5_rating ||
					existing.algo5_rank !== data.algo5_rank ||
					existing.agg_rating !== data.agg_rating ||
					existing.agg_rank !== data.agg_rank
				) {
					// UPDATE changed row
					const { error: updateError } = await this.supabase
						.from('ranking_results')
						.update({
							algo1_rating: data.algo1_rating,
							algo1_rank: data.algo1_rank,
							algo2_rating: data.algo2_rating,
							algo2_rank: data.algo2_rank,
							algo3_rating: data.algo3_rating,
							algo3_rank: data.algo3_rank,
							algo4_rating: data.algo4_rating,
							algo4_rank: data.algo4_rank,
							algo5_rating: data.algo5_rating,
							algo5_rank: data.algo5_rank,
							agg_rating: data.agg_rating,
							agg_rank: data.agg_rank,
						})
						.eq('id', existing.id);

					if (updateError) {
						throw new Error(`Merge update failed: ${updateError.message}`);
					}
					rowsUpdated++;
				} else {
					// SKIP identical row
					rowsSkipped++;
				}
			}
		}

		// Add the count of invalid rows that were not processed
		const invalidCount = validatedRows.length - validRows.length;

		return {
			rowsInserted,
			rowsUpdated,
			rowsSkipped: rowsSkipped + invalidCount,
			teamsCreated: 0,
			tournamentsCreated: 0,
			importMode: 'merge' as ImportMode,
			timestamp: new Date().toISOString(),
			seasonId,
			ageGroup,
		};
	}
}
