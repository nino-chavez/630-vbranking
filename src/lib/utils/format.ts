/**
 * Shared formatting utilities.
 */

/**
 * Convert a number to its ordinal string (1st, 2nd, 3rd, 4th, ...).
 */
export function toOrdinal(n: number): string {
	const s = ['th', 'st', 'nd', 'rd'];
	const v = n % 100;
	return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Format an ISO date string as a short human-readable date.
 * Example: "2026-02-23" → "Feb 23, 2026"
 */
export function formatDate(dateStr: string): string {
	const date = new Date(dateStr + 'T00:00:00');
	return date.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});
}

/**
 * Format an ISO datetime string as a readable timestamp.
 * Example: "2026-02-23T23:19:41.000Z" → "Feb 23, 2026 at 11:19 PM"
 */
export function formatTimestamp(isoStr: string): string {
	const date = new Date(isoStr);
	return (
		date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		}) +
		' at ' +
		date.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true,
		})
	);
}
