// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import RankingResultsTable from '../RankingResultsTable.svelte';
import PageShell from '../PageShell.svelte';
import type { NormalizedTeamResult } from '$lib/ranking/types.js';
import { createRawSnippet } from 'svelte';

afterEach(() => cleanup());

function makeResult(
	overrides: Partial<NormalizedTeamResult> & {
		team_id: string;
		agg_rank: number;
		agg_rating: number;
	},
): NormalizedTeamResult {
	return {
		algo1_rating: 0.5,
		algo1_rank: 1,
		algo2_rating: 2200,
		algo2_rank: 1,
		algo3_rating: 2400,
		algo3_rank: 1,
		algo4_rating: 2500,
		algo4_rank: 1,
		algo5_rating: 2700,
		algo5_rank: 1,
		...overrides,
	};
}

describe('RankingResultsTable - Tier Colors', () => {
	it('renders tier-colored rows based on rank', () => {
		const results: NormalizedTeamResult[] = [
			makeResult({ team_id: 't1', agg_rank: 1, agg_rating: 95 }),
			makeResult({ team_id: 't2', agg_rank: 10, agg_rating: 70 }),
			makeResult({ team_id: 't3', agg_rank: 20, agg_rating: 50 }),
			makeResult({ team_id: 't4', agg_rank: 35, agg_rating: 20 }),
		];
		const teams: Record<string, { name: string; region: string }> = {
			t1: { name: 'Alpha', region: '' },
			t2: { name: 'Bravo', region: '' },
			t3: { name: 'Charlie', region: '' },
			t4: { name: 'Delta', region: '' },
		};

		const { container } = render(RankingResultsTable, { props: { results, teams } });
		const rows = container.querySelectorAll('tbody tr');

		expect(rows[0].className).toContain('bg-tier-1');
		expect(rows[1].className).toContain('bg-tier-2');
		expect(rows[2].className).toContain('bg-tier-3');
		expect(rows[3].className).toContain('bg-tier-4');
	});
});

describe('RankingResultsTable - RankBadge', () => {
	it('renders rank badges with correct styling', () => {
		const results: NormalizedTeamResult[] = [
			makeResult({ team_id: 't1', agg_rank: 1, agg_rating: 95 }),
			makeResult({ team_id: 't2', agg_rank: 15, agg_rating: 50 }),
		];
		const teams: Record<string, { name: string; region: string }> = {
			t1: { name: 'Alpha', region: '' },
			t2: { name: 'Bravo', region: '' },
		};

		const { container } = render(RankingResultsTable, { props: { results, teams } });
		const badges = container.querySelectorAll('span.tabular-nums');

		// Rank 1 should have font-bold
		expect(badges[0].className).toContain('font-bold');
		// Rank 15 should have font-medium (not bold)
		expect(badges[1].className).toContain('font-medium');
		expect(badges[1].className).not.toContain('font-bold');
	});
});

describe('RankingResultsTable - Semantic Markup', () => {
	it('uses semantic table elements with scope attributes', () => {
		const results: NormalizedTeamResult[] = [
			makeResult({ team_id: 't1', agg_rank: 1, agg_rating: 95 }),
		];
		const teams: Record<string, { name: string; region: string }> = {
			t1: { name: 'Alpha', region: '' },
		};

		const { container } = render(RankingResultsTable, { props: { results, teams } });

		expect(container.querySelector('thead')).toBeTruthy();
		const ths = container.querySelectorAll('th[scope="col"]');
		expect(ths.length).toBeGreaterThan(0);
		expect(container.querySelector('caption')).toBeTruthy();
	});
});

describe('RankingResultsTable - No Hardcoded Colors', () => {
	it('contains no hardcoded gray/blue Tailwind classes', () => {
		const source = readFileSync(resolve(__dirname, '../RankingResultsTable.svelte'), 'utf-8');

		// Should NOT contain old hardcoded patterns
		expect(source).not.toMatch(/bg-gray-/);
		expect(source).not.toMatch(/text-gray-/);
		expect(source).not.toMatch(/divide-gray-/);
		expect(source).not.toMatch(/border-gray-/);
		expect(source).not.toMatch(/bg-blue-/);
		expect(source).not.toMatch(/text-blue-/);
	});
});

describe('PageShell', () => {
	it('renders children inside a main element', () => {
		render(PageShell, {
			props: {
				children: createRawSnippet(() => ({
					render: () => '<p>Test content</p>',
				})),
			},
		});

		const main = document.querySelector('main');
		expect(main).toBeTruthy();
		expect(screen.getByText('Test content')).toBeTruthy();
	});
});
