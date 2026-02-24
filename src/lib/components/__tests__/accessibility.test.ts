// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import Button from '../Button.svelte';
import NavHeader from '../NavHeader.svelte';
import Select from '../Select.svelte';
import Banner from '../Banner.svelte';
import { createRawSnippet } from 'svelte';

afterEach(() => cleanup());

describe('Accessibility', () => {
	it('Button has accessible name derived from children content', () => {
		render(Button, {
			props: {
				children: createRawSnippet(() => ({
					render: () => '<span>Submit</span>',
				})),
			},
		});
		const btn = screen.getByRole('button', { name: /Submit/i });
		expect(btn).toBeTruthy();
	});

	it('NavHeader links are keyboard-focusable with visible focus indicators', () => {
		render(NavHeader, { props: { currentPath: '/ranking' } });

		const links = screen.getAllByRole('link');
		// All navigation links should be present and focusable
		expect(links.length).toBeGreaterThanOrEqual(2);

		for (const link of links) {
			// Links should have tabindex >= 0 (default) and focus ring classes
			expect(link.tabIndex).toBeGreaterThanOrEqual(0);
			expect(link.className).toContain('focus:');
		}
	});

	it('Select associates label with select element via for/id', () => {
		render(Select, {
			props: {
				label: 'Season',
				id: 'season',
				options: [{ value: '2025', label: '2025-2026' }],
			},
		});
		const selectEl = screen.getByLabelText('Season');
		expect(selectEl).toBeTruthy();
		expect(selectEl.tagName).toBe('SELECT');
	});

	it('Banner with role="alert" contains title and message', () => {
		render(Banner, {
			props: {
				variant: 'error',
				title: 'Error Title',
				children: createRawSnippet(() => ({
					render: () => '<span>Error message body</span>',
				})),
			},
		});
		const alert = screen.getByRole('alert');
		expect(alert).toBeTruthy();
		expect(alert.textContent).toContain('Error Title');
		expect(alert.textContent).toContain('Error message body');
	});
});
