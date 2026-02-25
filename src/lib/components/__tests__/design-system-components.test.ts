// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import Button from '../Button.svelte';
import Banner from '../Banner.svelte';
import Card from '../Card.svelte';
import NavHeader from '../NavHeader.svelte';
import RankBadge from '../RankBadge.svelte';
import FreshnessIndicator from '../FreshnessIndicator.svelte';
import Select from '../Select.svelte';
import { createRawSnippet } from 'svelte';

afterEach(() => cleanup());

function textSnippet(text: string) {
	return createRawSnippet(() => ({
		render: () => `<span>${text}</span>`,
	}));
}

describe('Button', () => {
	it('renders all four variants with correct role', () => {
		for (const variant of ['primary', 'secondary', 'danger', 'ghost'] as const) {
			cleanup();
			render(Button, {
				props: { variant, children: textSnippet('Click') },
			});
			const btn = screen.getByRole('button', { name: /Click/i });
			expect(btn).toBeTruthy();
		}
	});

	it('renders disabled state and prevents onclick', async () => {
		const handler = vi.fn();
		render(Button, {
			props: { disabled: true, onclick: handler, children: textSnippet('Submit') },
		});
		const btn = screen.getByRole('button', { name: /Submit/i });
		expect(btn.hasAttribute('disabled')).toBe(true);
		btn.click();
		expect(handler).not.toHaveBeenCalled();
	});
});

describe('Banner', () => {
	it('renders error variant with role="alert" and title', () => {
		render(Banner, {
			props: { variant: 'error', title: 'Something failed', children: textSnippet('Details here') },
		});
		const alert = screen.getByRole('alert');
		expect(alert).toBeTruthy();
		expect(screen.getByText('Something failed')).toBeTruthy();
		expect(screen.getByText('Details here')).toBeTruthy();
	});
});

describe('Card', () => {
	it('renders children and optional header', () => {
		render(Card, {
			props: {
				header: textSnippet('Card Title'),
				children: textSnippet('Card Body'),
			},
		});
		expect(screen.getByText('Card Title')).toBeTruthy();
		expect(screen.getByText('Card Body')).toBeTruthy();
	});
});

describe('NavHeader', () => {
	it('renders dropdown triggers and highlights active group', () => {
		render(NavHeader, {
			props: { currentPath: '/import' },
		});
		const dataButton = screen.getByRole('button', { name: /Data/i });
		const rankingsButton = screen.getByRole('button', { name: /Rankings/i });
		expect(dataButton).toBeTruthy();
		expect(rankingsButton).toBeTruthy();
		// Data group trigger should be highlighted (white text) when /import is active
		expect(dataButton.className).toContain('text-white');
		// Rankings group trigger should not be highlighted
		expect(rankingsButton.className).not.toContain('text-white');
	});
});

describe('RankBadge', () => {
	it('renders rank with bold styling for top-5 and standard for others', () => {
		const { container: c1 } = render(RankBadge, { props: { rank: 3 } });
		const badge1 = c1.querySelector('span')!;
		expect(badge1.textContent?.trim()).toBe('3');
		expect(badge1.className).toContain('font-bold');

		cleanup();

		const { container: c2 } = render(RankBadge, { props: { rank: 12 } });
		const badge2 = c2.querySelector('span')!;
		expect(badge2.textContent?.trim()).toBe('12');
		expect(badge2.className).toContain('font-medium');
		expect(badge2.className).not.toContain('font-bold');
	});
});

describe('FreshnessIndicator', () => {
	it('renders relative time for a 5-minute-old timestamp', () => {
		const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
		render(FreshnessIndicator, { props: { timestamp: fiveMinAgo } });
		const timeEl = screen.getByText(/5 min ago/i);
		expect(timeEl).toBeTruthy();
	});
});

describe('Select', () => {
	it('renders label, options, and placeholder', () => {
		render(Select, {
			props: {
				label: 'Season',
				id: 'season',
				options: [
					{ value: '2025', label: '2025-2026' },
					{ value: '2024', label: '2024-2025' },
				],
				placeholder: 'Choose a season',
			},
		});
		const selectEl = screen.getByLabelText('Season');
		expect(selectEl).toBeTruthy();
		expect(selectEl.tagName).toBe('SELECT');
		const options = selectEl.querySelectorAll('option');
		expect(options.length).toBe(3); // placeholder + 2 options
		expect(options[0].textContent).toBe('Choose a season');
		expect(options[0].disabled).toBe(true);
	});
});
