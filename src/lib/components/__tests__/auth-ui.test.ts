// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import NavHeader from '../NavHeader.svelte';

afterEach(() => cleanup());

describe('NavHeader auth states', () => {
	it('shows "Log in" link when user is null', () => {
		render(NavHeader, { props: { currentPath: '/', user: null } });

		const loginLink = screen.getByRole('link', { name: /log in/i });
		expect(loginLink).toBeTruthy();
		expect(loginLink.getAttribute('href')).toBe('/auth/login');
	});

	it('shows "Log in" link when user is not provided', () => {
		render(NavHeader, { props: { currentPath: '/' } });

		const loginLink = screen.getByRole('link', { name: /log in/i });
		expect(loginLink).toBeTruthy();
	});

	it('shows user email and "Log out" button when user is present', () => {
		render(NavHeader, {
			props: {
				currentPath: '/',
				user: { email: 'test@example.com' } as Parameters<typeof NavHeader>[1]['user'],
			},
		});

		expect(screen.getByText('test@example.com')).toBeTruthy();
		expect(screen.getByText('Log out')).toBeTruthy();
	});

	it('does not show "Log in" link when user is present', () => {
		render(NavHeader, {
			props: {
				currentPath: '/',
				user: { email: 'test@example.com' } as Parameters<typeof NavHeader>[1]['user'],
			},
		});

		const loginLinks = screen.queryAllByRole('link', { name: /log in/i });
		expect(loginLinks.length).toBe(0);
	});

	it('always shows navigation links regardless of auth state', () => {
		render(NavHeader, { props: { currentPath: '/', user: null } });

		expect(screen.getByRole('link', { name: 'Import' })).toBeTruthy();
		expect(screen.getByRole('link', { name: 'Rankings' })).toBeTruthy();
		expect(screen.getByRole('link', { name: 'Weights' })).toBeTruthy();
	});
});
