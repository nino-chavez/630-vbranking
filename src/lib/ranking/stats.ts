/**
 * Pure statistical functions for ranking summary calculations.
 */

import type { NormalizedTeamResult } from './types.js';

export function computeMean(values: number[]): number {
	if (values.length === 0) return 0;
	return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function computeMedian(values: number[]): number {
	if (values.length === 0) return 0;
	const sorted = [...values].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function computeStdDev(values: number[]): number {
	if (values.length < 2) return 0;
	const mean = computeMean(values);
	const squaredDiffs = values.map((v) => (v - mean) ** 2);
	return Math.sqrt(squaredDiffs.reduce((sum, v) => sum + v, 0) / (values.length - 1));
}

export interface HistogramBucket {
	label: string;
	min: number;
	max: number;
	count: number;
}

export function computeHistogram(
	values: number[],
	bucketCount: number = 10,
): HistogramBucket[] {
	if (values.length === 0) return [];

	const min = Math.min(...values);
	const max = Math.max(...values);
	const range = max - min;

	if (range === 0) {
		return [{ label: min.toFixed(1), min, max, count: values.length }];
	}

	const bucketSize = range / bucketCount;
	const buckets: HistogramBucket[] = Array.from({ length: bucketCount }, (_, i) => ({
		label: `${(min + i * bucketSize).toFixed(1)}`,
		min: min + i * bucketSize,
		max: min + (i + 1) * bucketSize,
		count: 0,
	}));

	for (const value of values) {
		const index = Math.min(Math.floor((value - min) / bucketSize), bucketCount - 1);
		buckets[index].count++;
	}

	return buckets;
}

export interface RankingInsight {
	id: string;
	severity: 'info' | 'warning';
	label: string;
	detail: string;
}

export function computeInsights(
	results: NormalizedTeamResult[],
	previousRanks: Record<string, number>,
	overrides: Record<string, unknown>,
	seedingFactors: Record<string, { win_pct: number }>,
): RankingInsight[] {
	if (results.length === 0) {
		return [{ id: 'clean', severity: 'info', label: 'No anomalies detected', detail: 'Rankings look clean' }];
	}

	const insights: RankingInsight[] = [];

	// tight-race: Top 5 agg_rating spread < 2.0 pts
	if (results.length >= 5) {
		const sorted = [...results].sort((a, b) => a.agg_rank - b.agg_rank);
		const top5 = sorted.slice(0, 5);
		const spread = Math.max(...top5.map((r) => r.agg_rating)) - Math.min(...top5.map((r) => r.agg_rating));
		if (spread < 2.0) {
			insights.push({
				id: 'tight-race',
				severity: 'warning',
				label: `Top 5 separated by ${spread.toFixed(2)} pts`,
				detail: 'Top 5 separated by less than 2 pts \u2014 overrides could shift order',
			});
		}
	}

	// big-movers: Any team moved 10+ positions
	const hasPrevious = Object.keys(previousRanks).length > 0;
	if (hasPrevious) {
		const bigMoverCount = results.filter((r) => {
			const prev = previousRanks[r.team_id];
			return prev !== undefined && Math.abs(r.agg_rank - prev) >= 10;
		}).length;
		if (bigMoverCount > 0) {
			insights.push({
				id: 'big-movers',
				severity: 'warning',
				label: `${bigMoverCount} team${bigMoverCount === 1 ? '' : 's'} moved 10+ positions`,
				detail: `${bigMoverCount} team${bigMoverCount === 1 ? '' : 's'} moved 10+ positions since last run`,
			});
		}
	}

	// algo-disagreement: max(algo_rank) - min(algo_rank) > 15
	const disagreementCount = results.filter((r) => {
		const ranks = [r.algo1_rank, r.algo2_rank, r.algo3_rank, r.algo4_rank, r.algo5_rank];
		return Math.max(...ranks) - Math.min(...ranks) > 15;
	}).length;
	if (disagreementCount > 0) {
		insights.push({
			id: 'algo-disagreement',
			severity: 'warning',
			label: `${disagreementCount} team${disagreementCount === 1 ? '' : 's'} with high algorithm disagreement`,
			detail: `${disagreementCount} team${disagreementCount === 1 ? '' : 's'} show algorithm rank spread > 15 positions`,
		});
	}

	// new-teams: Teams not in previousRanks (when previousRanks is non-empty)
	if (hasPrevious) {
		const newTeamCount = results.filter((r) => previousRanks[r.team_id] === undefined).length;
		if (newTeamCount > 0) {
			insights.push({
				id: 'new-teams',
				severity: 'info',
				label: `${newTeamCount} new team${newTeamCount === 1 ? '' : 's'} since last finalized run`,
				detail: `${newTeamCount} team${newTeamCount === 1 ? '' : 's'} not present in previous rankings`,
			});
		}
	}

	// active-overrides
	const overrideCount = Object.keys(overrides).length;
	if (overrideCount > 0) {
		insights.push({
			id: 'active-overrides',
			severity: 'info',
			label: `${overrideCount} active committee override${overrideCount === 1 ? '' : 's'}`,
			detail: `${overrideCount} team${overrideCount === 1 ? '' : 's'} with manual rank adjustments`,
		});
	}

	// extreme-winrate: win_pct === 0 or win_pct === 1
	const hasSeedingFactors = Object.keys(seedingFactors).length > 0;
	if (hasSeedingFactors) {
		const extremeCount = Object.values(seedingFactors).filter(
			(sf) => sf.win_pct === 0 || sf.win_pct === 1,
		).length;
		if (extremeCount > 0) {
			const zeroCount = Object.values(seedingFactors).filter((sf) => sf.win_pct === 0).length;
			const perfectCount = Object.values(seedingFactors).filter((sf) => sf.win_pct === 1).length;
			const parts: string[] = [];
			if (zeroCount > 0) parts.push(`${zeroCount} with 0% win rate`);
			if (perfectCount > 0) parts.push(`${perfectCount} with 100% win rate`);
			insights.push({
				id: 'extreme-winrate',
				severity: 'warning',
				label: `${extremeCount} team${extremeCount === 1 ? '' : 's'} with extreme win rate`,
				detail: `${parts.join(', ')} \u2014 may lack sufficient data`,
			});
		}
	}

	if (insights.length === 0) {
		return [{ id: 'clean', severity: 'info', label: 'No anomalies detected', detail: 'Rankings look clean' }];
	}

	return insights;
}
