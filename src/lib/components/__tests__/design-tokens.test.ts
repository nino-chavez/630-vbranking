import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const appCss = readFileSync(resolve(__dirname, '../../../../src/app.css'), 'utf-8');

describe('Design Tokens', () => {
	it('defines all required color custom properties', () => {
		const colorTokens = [
			'--color-bg',
			'--color-surface',
			'--color-surface-alt',
			'--color-border',
			'--color-border-strong',
			'--color-text-primary',
			'--color-text-secondary',
			'--color-text-muted',
			'--color-accent',
			'--color-accent-hover',
			'--color-accent-light',
			'--color-success',
			'--color-error',
			'--color-warning',
		];

		for (const token of colorTokens) {
			expect(appCss).toContain(token);
		}
	});

	it('defines all ranking tier color tokens', () => {
		const tierTokens = ['--color-tier-1', '--color-tier-2', '--color-tier-3', '--color-tier-4'];

		for (const token of tierTokens) {
			expect(appCss).toContain(token);
		}
	});

	it('defines spacing and typography tokens', () => {
		const spacingTokens = [
			'--space-1',
			'--space-2',
			'--space-3',
			'--space-4',
			'--space-6',
			'--space-8',
			'--space-12',
		];

		const typographyTokens = [
			'--text-h1',
			'--text-h2',
			'--text-h3',
			'--text-body',
			'--text-body-strong',
			'--text-caption',
			'--text-label',
			'--text-stat',
		];

		for (const token of spacingTokens) {
			expect(appCss).toContain(token);
		}

		for (const token of typographyTokens) {
			expect(appCss).toContain(token);
		}
	});
});
