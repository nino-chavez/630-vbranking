/**
 * Browser download utilities for export files.
 */

/**
 * Trigger a file download from a Blob using a hidden anchor element.
 */
export function triggerDownload(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

/**
 * Generate a standardized export filename.
 * Example: "rankings_18U_2026-02-24.csv"
 */
export function exportFilename(ageGroup: string, ext: string): string {
	const date = new Date().toISOString().slice(0, 10);
	const sanitized = ageGroup.replace(/[^a-zA-Z0-9]/g, '_');
	return `rankings_${sanitized}_${date}.${ext}`;
}
