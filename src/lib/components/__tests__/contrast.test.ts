import { describe, it, expect } from 'vitest';

/**
 * Compute relative luminance from a hex color.
 * Formula from WCAG 2.1: https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
function hexToRgb(hex: string): [number, number, number] {
	const h = hex.replace('#', '');
	return [
		parseInt(h.substring(0, 2), 16),
		parseInt(h.substring(2, 4), 16),
		parseInt(h.substring(4, 6), 16),
	];
}

function relativeLuminance(hex: string): number {
	const [r, g, b] = hexToRgb(hex).map((c) => {
		const s = c / 255;
		return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hex1: string, hex2: string): number {
	const l1 = relativeLuminance(hex1);
	const l2 = relativeLuminance(hex2);
	const lighter = Math.max(l1, l2);
	const darker = Math.min(l1, l2);
	return (lighter + 0.05) / (darker + 0.05);
}

describe('WCAG AA Contrast Verification', () => {
	it('all primary text/background pairings meet 4.5:1 for normal text', () => {
		const pairings: Array<{ fg: string; bg: string; label: string; minRatio: number }> = [
			{ fg: '#111827', bg: '#FAFAFA', label: 'text-primary on bg', minRatio: 4.5 },
			{ fg: '#111827', bg: '#FFFFFF', label: 'text-primary on surface', minRatio: 4.5 },
			{ fg: '#4B5563', bg: '#FFFFFF', label: 'text-secondary on surface', minRatio: 4.5 },
			{ fg: '#6B7280', bg: '#FFFFFF', label: 'text-muted on surface', minRatio: 4.5 },
			{ fg: '#2563EB', bg: '#FFFFFF', label: 'accent on surface', minRatio: 4.5 },
			{ fg: '#DC2626', bg: '#FFFFFF', label: 'error on surface', minRatio: 4.5 },
			{ fg: '#FFFFFF', bg: '#2563EB', label: 'white on accent', minRatio: 4.5 },
			{ fg: '#FFFFFF', bg: '#DC2626', label: 'white on error', minRatio: 4.5 },
		];

		for (const { fg, bg, label, minRatio } of pairings) {
			const ratio = contrastRatio(fg, bg);
			expect(ratio, `${label}: ${ratio.toFixed(2)} < ${minRatio}`).toBeGreaterThanOrEqual(minRatio);
		}
	});

	it('tier color backgrounds maintain text readability with text-primary', () => {
		const tierPairings: Array<{ bg: string; label: string }> = [
			{ bg: '#FEF9C3', label: 'text-primary on tier-1 (gold)' },
			{ bg: '#E0F2FE', label: 'text-primary on tier-2 (blue)' },
			{ bg: '#F0FDF4', label: 'text-primary on tier-3 (green)' },
		];

		const textPrimary = '#111827';
		for (const { bg, label } of tierPairings) {
			const ratio = contrastRatio(textPrimary, bg);
			expect(ratio, `${label}: ${ratio.toFixed(2)} < 4.5`).toBeGreaterThanOrEqual(4.5);
		}
	});
});
