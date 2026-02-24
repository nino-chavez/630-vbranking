/**
 * Table utility functions for sorting and filtering ranking results.
 *
 * All pure functions -- no side effects, no database access.
 */

import type { NormalizedTeamResult } from './types.js';

export type SortKey = 'agg_rank' | 'agg_rating' | 'win_pct' | 'team_name' | 'final_rank';
export type SortDirection = 'asc' | 'desc';

/** Override data for a single team. */
export interface OverrideData {
	original_rank: number;
	final_rank: number;
	justification: string;
	committee_member: string;
}

/**
 * Compute final ranks by merging algorithmic ranks with committee overrides.
 *
 * Teams with overrides get the override's final_rank.
 * Teams without overrides keep their agg_rank.
 * Returns a map of team_id -> final_rank.
 */
export function computeFinalRanks(
	results: NormalizedTeamResult[],
	overrides: Record<string, OverrideData>,
): Record<string, number> {
	const finalRanks: Record<string, number> = {};

	for (const r of results) {
		const override = overrides[r.team_id];
		finalRanks[r.team_id] = override ? override.final_rank : r.agg_rank;
	}

	return finalRanks;
}

/**
 * Sort ranking results by the given key and direction.
 */
export function sortResults(
	results: NormalizedTeamResult[],
	teams: Record<string, { name: string; region: string }>,
	seedingFactors: Record<string, { win_pct: number }>,
	sortKey: SortKey,
	sortDirection: SortDirection,
	overrides?: Record<string, OverrideData>,
): NormalizedTeamResult[] {
	const sorted = [...results];

	const finalRanks = overrides ? computeFinalRanks(results, overrides) : undefined;

	sorted.sort((a, b) => {
		let cmp = 0;

		switch (sortKey) {
			case 'agg_rank':
				cmp = a.agg_rank - b.agg_rank;
				break;
			case 'agg_rating':
				cmp = a.agg_rating - b.agg_rating;
				break;
			case 'win_pct': {
				const aPct = seedingFactors[a.team_id]?.win_pct ?? 0;
				const bPct = seedingFactors[b.team_id]?.win_pct ?? 0;
				cmp = aPct - bPct;
				break;
			}
			case 'team_name': {
				const aName = teams[a.team_id]?.name ?? '';
				const bName = teams[b.team_id]?.name ?? '';
				cmp = aName.localeCompare(bName);
				break;
			}
			case 'final_rank': {
				const aFinal = finalRanks?.[a.team_id] ?? a.agg_rank;
				const bFinal = finalRanks?.[b.team_id] ?? b.agg_rank;
				cmp = aFinal - bFinal;
				break;
			}
		}

		return sortDirection === 'desc' ? -cmp : cmp;
	});

	return sorted;
}

/**
 * Filter ranking results by search text and region.
 */
export function filterResults(
	results: NormalizedTeamResult[],
	teams: Record<string, { name: string; region: string }>,
	searchText: string,
	regionFilter: string,
): NormalizedTeamResult[] {
	const search = searchText.toLowerCase().trim();

	return results.filter((r) => {
		const team = teams[r.team_id];
		if (!team) return false;

		// Region filter
		if (regionFilter && team.region !== regionFilter) {
			return false;
		}

		// Search filter (name or code-like substring)
		if (search) {
			const nameMatch = team.name.toLowerCase().includes(search);
			if (!nameMatch) return false;
		}

		return true;
	});
}
