import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { requireAuth } from '$lib/auth-guard.js';
import { supabaseServer } from '$lib/supabase-server.js';
import { AgeGroup } from '$lib/schemas/enums.js';
import { getParser } from '$lib/import/parsers/index.js';
import { IdentityResolver } from '$lib/import/identity-resolver.js';
import { detectDuplicateFinishes } from '$lib/import/duplicate-detector.js';
import { ImportService } from '$lib/import/import-service.js';
import type { ImportFormat, ParseResult, ParsedFinishesRow, ParsedColleyRow } from '$lib/import/types.js';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * POST /api/import/upload
 *
 * Accepts multipart/form-data with:
 * - file: .xlsx binary
 * - season_id: UUID string
 * - age_group: enum string (15U/16U/17U/18U)
 * - format: 'finishes' | 'colley'
 *
 * Returns ParseResult JSON with parsed rows, errors, and identity conflicts.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
  const authError = requireAuth(locals);
  if (authError) return authError;

  try {
    const formData = await request.formData();

    // Extract and validate parameters
    const file = formData.get('file') as File | null;
    const seasonId = formData.get('season_id') as string | null;
    const ageGroup = formData.get('age_group') as string | null;
    const format = formData.get('format') as string | null;

    // Validate required fields
    if (!file) {
      return json({ success: false, error: 'Missing required field: file' }, { status: 400 });
    }

    if (!seasonId) {
      return json({ success: false, error: 'Missing required field: season_id' }, { status: 400 });
    }

    if (!ageGroup) {
      return json({ success: false, error: 'Missing required field: age_group' }, { status: 400 });
    }

    if (!format) {
      return json({ success: false, error: 'Missing required field: format' }, { status: 400 });
    }

    // Validate file extension
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx')) {
      return json(
        { success: false, error: 'Invalid file type. Only .xlsx files are accepted.' },
        { status: 400 },
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return json(
        { success: false, error: 'File size exceeds the 10 MB limit.' },
        { status: 400 },
      );
    }

    // Validate age_group enum
    const ageGroupResult = AgeGroup.safeParse(ageGroup);
    if (!ageGroupResult.success) {
      return json(
        { success: false, error: `Invalid age_group. Must be one of: 15U, 16U, 17U, 18U` },
        { status: 400 },
      );
    }

    // Validate format
    if (format !== 'finishes' && format !== 'colley') {
      return json(
        { success: false, error: `Invalid format. Must be 'finishes' or 'colley'.` },
        { status: 400 },
      );
    }

    const importFormat: ImportFormat = format;

    // Read file into ArrayBuffer
    const buffer = await file.arrayBuffer();

    // Parse the file
    const parser = getParser(importFormat);
    const parseResult = parser.parse(buffer);

    // Run identity resolution
    const resolver = new IdentityResolver(supabaseServer);

    if (importFormat === 'finishes') {
      const finishesResult = parseResult as ParseResult<ParsedFinishesRow>;
      const teamCodes = [...new Set(finishesResult.rows.map((r) => r.teamCode))];
      const tournamentNames = [...new Set(finishesResult.rows.map((r) => r.tournamentName))];

      const teamResolution = await resolver.resolveTeams(teamCodes, ageGroup);
      const tournamentResolution = await resolver.resolveTournaments(tournamentNames, seasonId);

      // Merge identity conflicts into the parse result
      finishesResult.identityConflicts = [
        ...teamResolution.unmatched,
        ...tournamentResolution.unmatched,
      ];

      // Build identity mappings for matched entities to include in response
      const identityMappings = [
        ...Array.from(teamResolution.matched.entries()).map(([code, id]) => ({
          type: 'team' as const,
          parsedValue: code,
          action: 'map' as const,
          mappedId: id,
        })),
        ...Array.from(tournamentResolution.matched.entries()).map(([name, id]) => ({
          type: 'tournament' as const,
          parsedValue: name,
          action: 'map' as const,
          mappedId: id,
        })),
      ];

      // Detect duplicates using matched IDs
      const importService = new ImportService(supabaseServer);
      const validatedRows = importService.validateFinishesRows(finishesResult.rows, identityMappings);
      const duplicates = await detectDuplicateFinishes(validatedRows, supabaseServer);

      return json({
        success: true,
        data: finishesResult,
        identityMappings,
        duplicates: Object.fromEntries(duplicates),
      });
    } else {
      const colleyResult = parseResult as ParseResult<ParsedColleyRow>;
      const teamCodes = [...new Set(colleyResult.rows.map((r) => r.teamCode))];

      const teamResolution = await resolver.resolveTeams(teamCodes, ageGroup);

      colleyResult.identityConflicts = [...teamResolution.unmatched];

      const identityMappings = Array.from(teamResolution.matched.entries()).map(([code, id]) => ({
        type: 'team' as const,
        parsedValue: code,
        action: 'map' as const,
        mappedId: id,
      }));

      return json({
        success: true,
        data: colleyResult,
        identityMappings,
        duplicates: {},
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return json({ success: false, error: message }, { status: 500 });
  }
};
