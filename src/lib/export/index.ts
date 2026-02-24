/**
 * Export module barrel.
 */

export type { ExportRow, ExportMetadata, ExportOptions } from './types.js';
export {
	assembleExportRows,
	getColumnHeaders,
	rowToValues,
	buildMetadataLines,
	buildOverrideSummary,
} from './export-data.js';
export { generateCsv } from './csv.js';
export { triggerDownload, exportFilename } from './download.js';

// XLSX and PDF are dynamically imported for code splitting.
// Import them directly when needed:
//   const { generateXlsx } = await import('./xlsx.js');
//   const { generatePdf } = await import('./pdf.js');
