/**
 * Data assembly layer for exports.
 *
 * Pure functions that transform ranking state into flat export rows
 * consumable by CSV, XLSX, and PDF generators.
 */

import type { NormalizedTeamResult } from '../ranking/types.js';
import type { OverrideData } from '../ranking/table-utils.js';
import { computeFinalRanks } from '../ranking/table-utils.js';
import type { ExportRow, ExportMetadata, ExportOptions } from './types.js';

/**
 * Assemble flat export rows from ranking state, sorted by final rank.
 */
export function assembleExportRows(
	results: NormalizedTeamResult[],
	teams: Record<string, { name: string; region: string }>,
	seedingFactors: Record<string, { win_pct: number; best_national_finish: number | null }>,
	overrides: Record<string, OverrideData>,
	options: ExportOptions,
): ExportRow[] {
	const finalRanks = computeFinalRanks(results, overrides);

	const rows: ExportRow[] = results.map((r) => {
		const team = teams[r.team_id] ?? { name: 'Unknown', region: '' };
		const sf = seedingFactors[r.team_id];
		const override = overrides[r.team_id];

		const row: ExportRow = {
			final_rank: finalRanks[r.team_id],
			team_name: team.name,
			region: team.region,
			agg_rating: r.agg_rating,
			agg_rank: r.agg_rank,
			win_pct: sf?.win_pct ?? null,
			best_national_finish: sf?.best_national_finish ?? null,
		};

		if (options.includeAlgorithmBreakdowns) {
			row.algo1_rating = r.algo1_rating;
			row.algo1_rank = r.algo1_rank;
			row.algo2_rating = r.algo2_rating;
			row.algo2_rank = r.algo2_rank;
			row.algo3_rating = r.algo3_rating;
			row.algo3_rank = r.algo3_rank;
			row.algo4_rating = r.algo4_rating;
			row.algo4_rank = r.algo4_rank;
			row.algo5_rating = r.algo5_rating;
			row.algo5_rank = r.algo5_rank;
		}

		if (override) {
			row.override_original_rank = override.original_rank;
			row.override_justification = override.justification;
			row.override_committee_member = override.committee_member;
		}

		return row;
	});

	rows.sort((a, b) => a.final_rank - b.final_rank);
	return rows;
}

/**
 * Return column headers matching the ExportRow shape.
 */
export function getColumnHeaders(options: ExportOptions, hasOverrides: boolean): string[] {
	const headers = [
		'Final Rank',
		'Team',
		'Region',
		'Agg Rating',
		'Agg Rank',
		'Win %',
		'Best National Finish',
	];

	if (options.includeAlgorithmBreakdowns) {
		for (let i = 1; i <= 5; i++) {
			headers.push(`Algo ${i} Rating`, `Algo ${i} Rank`);
		}
	}

	if (hasOverrides) {
		headers.push('Override Original Rank', 'Override Justification', 'Override Committee Member');
	}

	return headers;
}

/**
 * Convert an ExportRow to a flat value array matching getColumnHeaders order.
 */
export function rowToValues(
	row: ExportRow,
	options: ExportOptions,
	hasOverrides: boolean,
): (string | number | null)[] {
	const values: (string | number | null)[] = [
		row.final_rank,
		row.team_name,
		row.region,
		row.agg_rating,
		row.agg_rank,
		row.win_pct,
		row.best_national_finish,
	];

	if (options.includeAlgorithmBreakdowns) {
		values.push(
			row.algo1_rating ?? null,
			row.algo1_rank ?? null,
			row.algo2_rating ?? null,
			row.algo2_rank ?? null,
			row.algo3_rating ?? null,
			row.algo3_rank ?? null,
			row.algo4_rating ?? null,
			row.algo4_rank ?? null,
			row.algo5_rating ?? null,
			row.algo5_rank ?? null,
		);
	}

	if (hasOverrides) {
		values.push(
			row.override_original_rank ?? null,
			row.override_justification ?? null,
			row.override_committee_member ?? null,
		);
	}

	return values;
}

/**
 * Build metadata lines for report headers.
 */
export function buildMetadataLines(metadata: ExportMetadata): string[] {
	return [
		`Season: ${metadata.season_name}`,
		`Age Group: ${metadata.age_group}`,
		`Run At: ${metadata.ran_at}`,
		`Teams Ranked: ${metadata.teams_ranked}`,
		`Status: ${metadata.run_status}`,
		`Exported At: ${metadata.exported_at}`,
	];
}

/**
 * Build override summary entries, sorted by final rank.
 */
export function buildOverrideSummary(
	overrides: Record<string, OverrideData>,
	teams: Record<string, { name: string; region: string }>,
): Array<{
	team_name: string;
	original_rank: number;
	final_rank: number;
	justification: string;
	committee_member: string;
}> {
	return Object.entries(overrides)
		.map(([teamId, o]) => ({
			team_name: teams[teamId]?.name ?? 'Unknown',
			original_rank: o.original_rank,
			final_rank: o.final_rank,
			justification: o.justification,
			committee_member: o.committee_member,
		}))
		.sort((a, b) => a.final_rank - b.final_rank);
}
