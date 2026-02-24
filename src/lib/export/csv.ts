/**
 * CSV export generator.
 *
 * Pure function -- no side effects, no DOM access.
 * Produces RFC 4180 compliant CSV with metadata comment header.
 */

import type { ExportRow, ExportMetadata, ExportOptions } from './types.js';
import type { OverrideData } from '../ranking/table-utils.js';
import {
	getColumnHeaders,
	rowToValues,
	buildMetadataLines,
	buildOverrideSummary,
} from './export-data.js';

/** Escape a single CSV field per RFC 4180. */
function escapeField(value: string | number | null): string {
	if (value === null || value === undefined) return '';
	const str = String(value);
	if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
		return `"${str.replace(/"/g, '""')}"`;
	}
	return str;
}

/**
 * Generate a complete CSV string from export data.
 */
export function generateCsv(
	rows: ExportRow[],
	metadata: ExportMetadata,
	overrides: Record<string, OverrideData>,
	teams: Record<string, { name: string; region: string }>,
	options: ExportOptions,
): string {
	const lines: string[] = [];
	const hasOverrides = Object.keys(overrides).length > 0;

	// Metadata comment header
	for (const line of buildMetadataLines(metadata)) {
		lines.push(`# ${line}`);
	}
	lines.push('');

	// Column headers
	const headers = getColumnHeaders(options, hasOverrides);
	lines.push(headers.map(escapeField).join(','));

	// Data rows
	for (const row of rows) {
		const values = rowToValues(row, options, hasOverrides);
		lines.push(values.map(escapeField).join(','));
	}

	// Override summary section
	if (hasOverrides) {
		lines.push('');
		lines.push('# Override Summary');
		lines.push('Team,Original Rank,Final Rank,Justification,Committee Member');
		const summary = buildOverrideSummary(overrides, teams);
		for (const entry of summary) {
			lines.push(
				[
					escapeField(entry.team_name),
					escapeField(entry.original_rank),
					escapeField(entry.final_rank),
					escapeField(entry.justification),
					escapeField(entry.committee_member),
				].join(','),
			);
		}
	}

	return lines.join('\n');
}
