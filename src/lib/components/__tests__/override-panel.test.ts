// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import OverridePanel from '../OverridePanel.svelte';

afterEach(() => cleanup());

const baseProps = {
	open: true,
	teamName: 'Alpha Wolves',
	teamId: 'team-a',
	originalRank: 5,
	runStatus: 'draft' as const,
	existingOverride: null,
	onsave: vi.fn(),
	onremove: vi.fn(),
	onclose: vi.fn(),
};

describe('OverridePanel', () => {
	it('renders team name and original rank when open', () => {
		render(OverridePanel, { props: baseProps });
		expect(screen.getByText('Alpha Wolves')).toBeTruthy();
		expect(screen.getByText(/Algorithmic Rank:/)).toBeTruthy();
	});

	it('does not render content when closed', () => {
		render(OverridePanel, { props: { ...baseProps, open: false } });
		expect(screen.queryByText('Alpha Wolves')).toBeNull();
	});

	it('shows Save Override button for new override', () => {
		render(OverridePanel, { props: baseProps });
		expect(screen.getByRole('button', { name: /Save Override/i })).toBeTruthy();
		expect(screen.queryByRole('button', { name: /Remove/i })).toBeNull();
	});

	it('shows Update Override and Remove buttons for existing override', () => {
		render(OverridePanel, {
			props: {
				...baseProps,
				existingOverride: {
					final_rank: 3,
					justification: 'Strong head-to-head record against higher-ranked teams',
					committee_member: 'Coach Smith',
				},
			},
		});
		expect(screen.getByRole('button', { name: /Update Override/i })).toBeTruthy();
		expect(screen.getByRole('button', { name: /Remove/i })).toBeTruthy();
	});

	it('shows read-only banner and Close button when finalized', () => {
		render(OverridePanel, {
			props: { ...baseProps, runStatus: 'finalized' },
		});
		expect(screen.getByText(/finalized/i)).toBeTruthy();
		// There should be a Close text button (in the footer) and a Close panel icon button
		const closeButtons = screen.getAllByRole('button', { name: /Close/i });
		expect(closeButtons.length).toBeGreaterThanOrEqual(1);
		expect(screen.queryByRole('button', { name: /Save Override/i })).toBeNull();
	});

	it('has form inputs with correct labels', () => {
		render(OverridePanel, { props: baseProps });
		expect(screen.getByLabelText('Final Seed')).toBeTruthy();
		expect(screen.getByLabelText('Justification')).toBeTruthy();
		expect(screen.getByLabelText('Committee Member')).toBeTruthy();
	});

	it('calls onclose when Cancel button is clicked', async () => {
		const onclose = vi.fn();
		render(OverridePanel, { props: { ...baseProps, onclose } });
		const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
		cancelBtn.click();
		expect(onclose).toHaveBeenCalledOnce();
	});

	it('calls onclose when close icon button is clicked', async () => {
		const onclose = vi.fn();
		render(OverridePanel, { props: { ...baseProps, onclose } });
		const closeBtn = screen.getByRole('button', { name: /Close panel/i });
		closeBtn.click();
		expect(onclose).toHaveBeenCalledOnce();
	});
});
