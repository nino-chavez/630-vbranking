/**
 * PDF export generator.
 *
 * Uses jsPDF + jspdf-autotable (new dependencies).
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
 * Generate a PDF blob.
 *
 * Landscape orientation for detailed reports (many columns).
 * Portrait for summary reports.
 */
export async function generatePdf(
	rows: ExportRow[],
	metadata: ExportMetadata,
	overrides: Record<string, OverrideData>,
	teams: Record<string, { name: string; region: string }>,
	options: ExportOptions,
): Promise<Blob> {
	const { default: jsPDF } = await import('jspdf');
	await import('jspdf-autotable');

	const hasOverrides = Object.keys(overrides).length > 0;
	const orientation = options.includeAlgorithmBreakdowns ? 'landscape' : 'portrait';
	const doc = new jsPDF({ orientation, unit: 'pt', format: 'letter' });

	const pageWidth = doc.internal.pageSize.getWidth();

	// --- Title ---
	doc.setFontSize(16);
	doc.text('Volleyball Rankings Report', pageWidth / 2, 40, { align: 'center' });

	// --- Metadata ---
	doc.setFontSize(9);
	const metaLines = buildMetadataLines(metadata);
	let y = 60;
	for (const line of metaLines) {
		doc.text(line, 40, y);
		y += 12;
	}

	// --- Rankings Table ---
	const headers = getColumnHeaders(options, hasOverrides);
	const body = rows.map((row) =>
		rowToValues(row, options, hasOverrides).map((v) => (v === null ? '' : String(v))),
	);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- jspdf-autotable augments jsPDF via side-effect import
	(doc as any).autoTable({
		startY: y + 10,
		head: [headers],
		body,
		styles: { fontSize: 7, cellPadding: 3 },
		headStyles: { fillColor: [41, 65, 122], textColor: 255 },
		margin: { left: 30, right: 30 },
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		didDrawPage: (data: any) => {
			// Page number footer
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const pageCount = (doc as any).internal.getNumberOfPages();
			doc.setFontSize(8);
			doc.text(
				`Page ${data.pageNumber} of ${pageCount}`,
				pageWidth / 2,
				doc.internal.pageSize.getHeight() - 20,
				{ align: 'center' },
			);
		},
	});

	// --- Override Summary Table ---
	if (hasOverrides) {
		const summary = buildOverrideSummary(overrides, teams);
		const overrideBody = summary.map((e) => [
			e.team_name,
			String(e.original_rank),
			String(e.final_rank),
			e.justification,
			e.committee_member,
		]);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const lastY = (doc as any).lastAutoTable?.finalY ?? y + 100;
		doc.setFontSize(12);
		doc.text('Override Summary', 40, lastY + 25);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(doc as any).autoTable({
			startY: lastY + 35,
			head: [['Team', 'Original Rank', 'Final Rank', 'Justification', 'Committee Member']],
			body: overrideBody,
			styles: { fontSize: 7, cellPadding: 3 },
			headStyles: { fillColor: [130, 80, 50], textColor: 255 },
			margin: { left: 30, right: 30 },
		});
	}

	return doc.output('blob');
}
