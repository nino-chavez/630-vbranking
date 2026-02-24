/**
 * XLSX export generator.
 *
 * Uses the existing `xlsx` library (already installed for import).
 * Dynamically imported at call time for code splitting.
 */

import type { ExportRow, ExportMetadata, ExportOptions } from './types.js';
import type { OverrideData } from '../ranking/table-utils.js';
import {
	getColumnHeaders,
	rowToValues,
	buildMetadataLines,
	buildOverrideSummary,
} from './export-data.js';

/**
 * Generate an XLSX workbook buffer.
 *
 * Sheet 1: "Rankings" -- metadata rows + column headers + data
 * Sheet 2: "Overrides" -- override summary (only if overrides exist)
 */
export async function generateXlsx(
	rows: ExportRow[],
	metadata: ExportMetadata,
	overrides: Record<string, OverrideData>,
	teams: Record<string, { name: string; region: string }>,
	options: ExportOptions,
): Promise<ArrayBuffer> {
	const XLSX = await import('xlsx');
	const hasOverrides = Object.keys(overrides).length > 0;

	const wb = XLSX.utils.book_new();

	// --- Rankings Sheet ---
	const metaLines = buildMetadataLines(metadata);
	const headers = getColumnHeaders(options, hasOverrides);

	const sheetData: (string | number | null)[][] = [];

	// Metadata rows (single-column)
	for (const line of metaLines) {
		sheetData.push([line]);
	}
	sheetData.push([]); // blank separator

	// Header row
	sheetData.push(headers);

	// Data rows
	for (const row of rows) {
		sheetData.push(rowToValues(row, options, hasOverrides));
	}

	const ws = XLSX.utils.aoa_to_sheet(sheetData);
	XLSX.utils.book_append_sheet(wb, ws, 'Rankings');

	// --- Overrides Sheet ---
	if (hasOverrides) {
		const overrideHeaders = [
			'Team',
			'Original Rank',
			'Final Rank',
			'Justification',
			'Committee Member',
		];
		const summary = buildOverrideSummary(overrides, teams);
		const overrideData: (string | number)[][] = [overrideHeaders];
		for (const entry of summary) {
			overrideData.push([
				entry.team_name,
				entry.original_rank,
				entry.final_rank,
				entry.justification,
				entry.committee_member,
			]);
		}
		const ows = XLSX.utils.aoa_to_sheet(overrideData);
		XLSX.utils.book_append_sheet(wb, ows, 'Overrides');
	}

	const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
	return buf;
}
