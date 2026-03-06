import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { requireAuth } from '$lib/auth-guard.js';
import { supabaseServer } from '$lib/supabase-server.js';
import { teamInsertSchema } from '$lib/schemas/team.js';
import { tournamentInsertSchema } from '$lib/schemas/tournament.js';
import { ImportService } from '$lib/import/import-service.js';
import type {
	ImportFormat,
	ImportMode,
	IdentityMapping,
	ParsedFinishesRow,
	ParsedColleyRow,
} from '$lib/import/types.js';
import type { Database } from '$lib/types/database.types.js';

interface ConfirmRequestBody {
	rows: ParsedFinishesRow[] | ParsedColleyRow[];
	identityMappings: IdentityMapping[];
	importMode: ImportMode;
	seasonId: string;
	ageGroup: string;
	format: ImportFormat;
}

/**
 * POST /api/import/confirm
 *
 * Accepts JSON body with resolved data and executes the import.
 * Creates new teams/tournaments from identity mappings where action === 'create',
 * then validates and imports rows based on the selected mode.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	const authError = requireAuth(locals);
	if (authError) return authError;

	try {
		const body = (await request.json()) as ConfirmRequestBody;
		const { rows, identityMappings, importMode, seasonId, ageGroup, format } = body;

		// Validate required fields
		if (!rows || !Array.isArray(rows)) {
			return json({ success: false, error: 'Missing or invalid field: rows' }, { status: 400 });
		}

		if (!identityMappings || !Array.isArray(identityMappings)) {
			return json(
				{ success: false, error: 'Missing or invalid field: identityMappings' },
				{ status: 400 },
			);
		}

		if (!importMode || (importMode !== 'replace' && importMode !== 'merge')) {
			return json(
				{
					success: false,
					error: "Missing or invalid field: importMode (must be 'replace' or 'merge')",
				},
				{ status: 400 },
			);
		}

		if (!seasonId) {
			return json({ success: false, error: 'Missing required field: seasonId' }, { status: 400 });
		}

		if (!ageGroup) {
			return json({ success: false, error: 'Missing required field: ageGroup' }, { status: 400 });
		}

		if (!format || (format !== 'finishes' && format !== 'colley')) {
			return json(
				{
					success: false,
					error: "Missing or invalid field: format (must be 'finishes' or 'colley')",
				},
				{ status: 400 },
			);
		}

		// Mutable copy of identity mappings so we can update with newly created IDs
		const resolvedMappings = [...identityMappings];

		let teamsCreated = 0;
		let tournamentsCreated = 0;

		// Create new teams from identity mappings where action === 'create'
		for (const mapping of resolvedMappings) {
			if (mapping.action !== 'create') continue;

			if (mapping.type === 'team' && mapping.newRecord) {
				const teamData = {
					name: mapping.newRecord.name as string,
					code: mapping.newRecord.code as string,
					region: mapping.newRecord.region as string,
					age_group: mapping.newRecord.age_group as string,
				};

				const validation = teamInsertSchema.safeParse(teamData);
				if (!validation.success) {
					const errors = validation.error.issues
						.map((i) => `${i.path.join('.')}: ${i.message}`)
						.join('; ');
					return json(
						{ success: false, error: `Invalid team data for "${mapping.parsedValue}": ${errors}` },
						{ status: 400 },
					);
				}

				const { data: newTeam, error: insertError } = await supabaseServer
					.from('teams')
					.insert(validation.data)
					.select('id')
					.single();

				if (insertError) {
					return json(
						{
							success: false,
							error: `Failed to create team "${mapping.parsedValue}": ${insertError.message}`,
						},
						{ status: 409 },
					);
				}

				// Update the mapping with the new ID
				mapping.mappedId = newTeam.id;
				mapping.action = 'map';
				teamsCreated++;
			}

			if (mapping.type === 'tournament' && mapping.newRecord) {
				const tournamentData = {
					name: mapping.newRecord.name as string,
					date: mapping.newRecord.date as string,
					season_id: mapping.newRecord.season_id as string,
					location: (mapping.newRecord.location as string) || null,
				};

				const validation = tournamentInsertSchema.safeParse(tournamentData);
				if (!validation.success) {
					const errors = validation.error.issues
						.map((i) => `${i.path.join('.')}: ${i.message}`)
						.join('; ');
					return json(
						{
							success: false,
							error: `Invalid tournament data for "${mapping.parsedValue}": ${errors}`,
						},
						{ status: 400 },
					);
				}

				const { data: newTournament, error: insertError } = await supabaseServer
					.from('tournaments')
					.insert(validation.data)
					.select('id')
					.single();

				if (insertError) {
					return json(
						{
							success: false,
							error: `Failed to create tournament "${mapping.parsedValue}": ${insertError.message}`,
						},
						{ status: 409 },
					);
				}

				// Update the mapping with the new ID
				mapping.mappedId = newTournament.id;
				mapping.action = 'map';
				tournamentsCreated++;
			}
		}

		const importService = new ImportService(supabaseServer);
		let rankingRunId: string | undefined;

		// For Colley imports, create a ranking_run record
		if (format === 'colley') {
			const { data: rankingRun, error: rrError } = await supabaseServer
				.from('ranking_runs')
				.insert({
					season_id: seasonId,
					age_group: ageGroup as Database['vbranking']['Enums']['age_group_enum'],
					description: 'Imported from Colley file',
				})
				.select('id')
				.single();

			if (rrError) {
				return json(
					{ success: false, error: `Failed to create ranking run: ${rrError.message}` },
					{ status: 500 },
				);
			}

			rankingRunId = rankingRun.id;
		}

		// Validate rows
		let validatedRows;
		if (format === 'finishes') {
			validatedRows = importService.validateFinishesRows(
				rows as ParsedFinishesRow[],
				resolvedMappings,
			);
		} else {
			validatedRows = importService.validateColleyRows(
				rows as ParsedColleyRow[],
				resolvedMappings,
				rankingRunId!,
			);
		}

		// Check for validation errors
		const invalidRows = validatedRows.filter((r) => !r.valid);
		if (invalidRows.length > 0) {
			const errorSummary = invalidRows
				.slice(0, 5)
				.map((r) => `Row ${r.originalIndex + 1}: ${r.errors.join('; ')}`)
				.join('\n');
			return json(
				{
					success: false,
					error: `${invalidRows.length} rows failed validation:\n${errorSummary}`,
				},
				{ status: 400 },
			);
		}

		// Execute import based on mode
		let summary;
		if (importMode === 'replace') {
			summary = await importService.executeReplace(
				validatedRows,
				seasonId,
				ageGroup,
				format,
				rankingRunId,
			);
		} else {
			summary = await importService.executeMerge(validatedRows, format, seasonId, ageGroup);
		}

		// Update summary with creation counts
		summary.teamsCreated = teamsCreated;
		summary.tournamentsCreated = tournamentsCreated;

		return json({ success: true, summary });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'An unexpected error occurred';
		return json({ success: false, error: message }, { status: 500 });
	}
};
