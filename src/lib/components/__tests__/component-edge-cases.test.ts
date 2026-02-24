// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import FreshnessIndicator from '../FreshnessIndicator.svelte';
import TierRow from '../TierRow.svelte';
import Card from '../Card.svelte';
import Button from '../Button.svelte';
import { createRawSnippet } from 'svelte';

afterEach(() => cleanup());

describe('FreshnessIndicator edge cases', () => {
	it('handles now, 90-minute, and 2-day timestamps', () => {
		// Just now
		render(FreshnessIndicator, {
			props: { timestamp: new Date().toISOString() },
		});
		expect(screen.getByText('Just now')).toBeTruthy();
		cleanup();

		// 90 minutes ago → "1 hour ago"
		const ninetyMinAgo = new Date(Date.now() - 90 * 60 * 1000).toISOString();
		render(FreshnessIndicator, { props: { timestamp: ninetyMinAgo } });
		expect(screen.getByText(/1 hour ago/)).toBeTruthy();
		cleanup();

		// 2 days ago
		const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
		render(FreshnessIndicator, { props: { timestamp: twoDaysAgo } });
		expect(screen.getByText(/2 days ago/)).toBeTruthy();
	});
});

describe('TierRow boundary values', () => {
	it('assigns correct tier class at boundaries', () => {
		const snippet = createRawSnippet(() => ({
			render: () => '<td>cell</td>',
		}));

		const testCases = [
			{ rank: 5, expected: 'bg-tier-1' },
			{ rank: 6, expected: 'bg-tier-2' },
			{ rank: 15, expected: 'bg-tier-2' },
			{ rank: 16, expected: 'bg-tier-3' },
			{ rank: 30, expected: 'bg-tier-3' },
			{ rank: 31, expected: 'bg-tier-4' },
		];

		// We need to render inside a table for valid HTML
		for (const { rank, expected } of testCases) {
			cleanup();
			const { container: _container } = render(TierRow, {
				props: { rank, children: snippet },
				target: (() => {
					const table = document.createElement('table');
					const tbody = document.createElement('tbody');
					table.appendChild(tbody);
					document.body.appendChild(table);
					return tbody;
				})(),
			});
			const tr = document.querySelector('tr');
			expect(tr?.className, `rank ${rank}`).toContain(expected);
			// Clean up the table we added
			document.querySelectorAll('table').forEach((t) => t.remove());
		}
	});
});

describe('Card padding variants', () => {
	it('renders without padding when padding="none"', () => {
		const { container } = render(Card, {
			props: {
				padding: 'none',
				children: createRawSnippet(() => ({
					render: () => '<span>Content</span>',
				})),
			},
		});

		// The content wrapper should NOT have p-6 class
		const contentDiv = container.querySelector('.rounded-lg > div:last-child');
		expect(contentDiv?.className).not.toContain('p-6');
	});
});

describe('Button loading state', () => {
	it('renders spinner and prevents click when loading', () => {
		const handler = vi.fn();
		const { container } = render(Button, {
			props: {
				loading: true,
				onclick: handler,
				children: createRawSnippet(() => ({
					render: () => '<span>Save</span>',
				})),
			},
		});

		// Should have a spinner SVG
		const spinner = container.querySelector('svg.animate-spin');
		expect(spinner).toBeTruthy();

		// Button should be disabled
		const btn = screen.getByRole('button');
		expect(btn.hasAttribute('disabled')).toBe(true);

		// Click should not trigger handler
		btn.click();
		expect(handler).not.toHaveBeenCalled();
	});
});
