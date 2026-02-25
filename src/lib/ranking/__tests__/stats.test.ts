import { describe, it, expect } from 'vitest';
import {
	computeMean,
	computeMedian,
	computeStdDev,
	computeHistogram,
	computeInsights,
} from '../stats.js';
import type { NormalizedTeamResult } from '../types.js';

describe('computeMean', () => {
	it('returns 0 for empty array', () => {
		expect(computeMean([])).toBe(0);
	});

	it('computes mean of values', () => {
		expect(computeMean([10, 20, 30])).toBe(20);
	});

	it('handles single value', () => {
		expect(computeMean([42])).toBe(42);
	});
});

describe('computeMedian', () => {
	it('returns 0 for empty array', () => {
		expect(computeMedian([])).toBe(0);
	});

	it('returns middle value for odd-length array', () => {
		expect(computeMedian([3, 1, 2])).toBe(2);
	});

	it('returns average of two middle values for even-length array', () => {
		expect(computeMedian([1, 2, 3, 4])).toBe(2.5);
	});

	it('handles single value', () => {
		expect(computeMedian([5])).toBe(5);
	});
});

describe('computeStdDev', () => {
	it('returns 0 for empty array', () => {
		expect(computeStdDev([])).toBe(0);
	});

	it('returns 0 for single value', () => {
		expect(computeStdDev([5])).toBe(0);
	});

	it('computes sample standard deviation', () => {
		// [2, 4, 4, 4, 5, 5, 7, 9] => mean=5, variance=4, stddev=2
		const result = computeStdDev([2, 4, 4, 4, 5, 5, 7, 9]);
		expect(result).toBeCloseTo(2, 0);
	});
});

describe('computeHistogram', () => {
	it('returns empty for empty array', () => {
		expect(computeHistogram([])).toEqual([]);
	});

	it('creates buckets with counts', () => {
		const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
		const buckets = computeHistogram(values, 5);
		expect(buckets).toHaveLength(5);
		expect(buckets.every((b) => b.count >= 1)).toBe(true);
	});

	it('handles all same values', () => {
		const buckets = computeHistogram([5, 5, 5], 3);
		expect(buckets).toHaveLength(1);
		expect(buckets[0].count).toBe(3);
	});
});

// --- computeInsights ---

function makeResult(overrides: Partial<NormalizedTeamResult> & { team_id: string }): NormalizedTeamResult {
	return {
		algo1_rating: 50,
		algo1_rank: 1,
		algo2_rating: 50,
		algo2_rank: 1,
		algo3_rating: 50,
		algo3_rank: 1,
		algo4_rating: 50,
		algo4_rank: 1,
		algo5_rating: 50,
		algo5_rank: 1,
		agg_rating: 50,
		agg_rank: 1,
		...overrides,
	};
}

describe('computeInsights', () => {
	it('returns clean insight for empty results', () => {
		const insights = computeInsights([], {}, {}, {});
		expect(insights).toHaveLength(1);
		expect(insights[0].id).toBe('clean');
	});

	it('returns clean insight when no conditions trigger', () => {
		const results = Array.from({ length: 10 }, (_, i) =>
			makeResult({
				team_id: `t${i}`,
				agg_rank: i + 1,
				agg_rating: 90 - i * 5, // spread of 45 pts — not tight
			}),
		);
		const insights = computeInsights(results, {}, {}, {});
		expect(insights).toHaveLength(1);
		expect(insights[0].id).toBe('clean');
	});

	it('detects tight-race when top 5 spread < 2 pts', () => {
		const results = Array.from({ length: 6 }, (_, i) =>
			makeResult({
				team_id: `t${i}`,
				agg_rank: i + 1,
				agg_rating: 80 + i * 0.3, // spread = 1.5 pts
			}),
		);
		const insights = computeInsights(results, {}, {}, {});
		const tightRace = insights.find((i) => i.id === 'tight-race');
		expect(tightRace).toBeDefined();
		expect(tightRace!.severity).toBe('warning');
	});

	it('does not trigger tight-race with < 5 results', () => {
		const results = Array.from({ length: 4 }, (_, i) =>
			makeResult({
				team_id: `t${i}`,
				agg_rank: i + 1,
				agg_rating: 80 + i * 0.1,
			}),
		);
		const insights = computeInsights(results, {}, {}, {});
		expect(insights.find((i) => i.id === 'tight-race')).toBeUndefined();
	});

	it('detects big-movers (10+ position change)', () => {
		const results = [
			makeResult({ team_id: 't1', agg_rank: 1 }),
			makeResult({ team_id: 't2', agg_rank: 15, agg_rating: 40 }),
		];
		const previousRanks = { t1: 2, t2: 3 }; // t2 moved from 3 to 15 = 12 positions
		const insights = computeInsights(results, previousRanks, {}, {});
		const bigMovers = insights.find((i) => i.id === 'big-movers');
		expect(bigMovers).toBeDefined();
		expect(bigMovers!.severity).toBe('warning');
		expect(bigMovers!.label).toContain('1 team');
	});

	it('detects algo-disagreement (rank spread > 15)', () => {
		const results = [
			makeResult({
				team_id: 't1',
				algo1_rank: 1,
				algo2_rank: 2,
				algo3_rank: 3,
				algo4_rank: 4,
				algo5_rank: 20, // spread = 19
			}),
		];
		const insights = computeInsights(results, {}, {}, {});
		const disagreement = insights.find((i) => i.id === 'algo-disagreement');
		expect(disagreement).toBeDefined();
		expect(disagreement!.severity).toBe('warning');
	});

	it('does not trigger algo-disagreement when spread <= 15', () => {
		const results = [
			makeResult({
				team_id: 't1',
				algo1_rank: 1,
				algo2_rank: 5,
				algo3_rank: 10,
				algo4_rank: 12,
				algo5_rank: 16, // spread = 15, not > 15
			}),
		];
		const insights = computeInsights(results, {}, {}, {});
		expect(insights.find((i) => i.id === 'algo-disagreement')).toBeUndefined();
	});

	it('detects new-teams when previousRanks is non-empty', () => {
		const results = [
			makeResult({ team_id: 't1', agg_rank: 1 }),
			makeResult({ team_id: 't2', agg_rank: 2, agg_rating: 45 }),
			makeResult({ team_id: 't3', agg_rank: 3, agg_rating: 40 }),
		];
		const previousRanks = { t1: 1 }; // t2 and t3 are new
		const insights = computeInsights(results, previousRanks, {}, {});
		const newTeams = insights.find((i) => i.id === 'new-teams');
		expect(newTeams).toBeDefined();
		expect(newTeams!.severity).toBe('info');
		expect(newTeams!.label).toContain('2 new teams');
	});

	it('does not trigger new-teams when previousRanks is empty', () => {
		const results = [makeResult({ team_id: 't1', agg_rank: 1 })];
		const insights = computeInsights(results, {}, {}, {});
		expect(insights.find((i) => i.id === 'new-teams')).toBeUndefined();
	});

	it('detects active-overrides', () => {
		const results = [makeResult({ team_id: 't1', agg_rank: 1 })];
		const overrides = { t1: { final_rank: 2 }, t2: { final_rank: 5 } };
		const insights = computeInsights(results, {}, overrides, {});
		const active = insights.find((i) => i.id === 'active-overrides');
		expect(active).toBeDefined();
		expect(active!.severity).toBe('info');
		expect(active!.label).toContain('2 active');
	});

	it('detects extreme-winrate (0% and 100%)', () => {
		const results = [
			makeResult({ team_id: 't1', agg_rank: 1 }),
			makeResult({ team_id: 't2', agg_rank: 2, agg_rating: 45 }),
			makeResult({ team_id: 't3', agg_rank: 3, agg_rating: 40 }),
		];
		const seedingFactors = {
			t1: { win_pct: 0 },
			t2: { win_pct: 1 },
			t3: { win_pct: 0.5 },
		};
		const insights = computeInsights(results, {}, {}, seedingFactors);
		const extreme = insights.find((i) => i.id === 'extreme-winrate');
		expect(extreme).toBeDefined();
		expect(extreme!.severity).toBe('warning');
		expect(extreme!.label).toContain('2 teams');
	});

	it('does not trigger extreme-winrate when seedingFactors is empty', () => {
		const results = [makeResult({ team_id: 't1', agg_rank: 1 })];
		const insights = computeInsights(results, {}, {}, {});
		expect(insights.find((i) => i.id === 'extreme-winrate')).toBeUndefined();
	});

	it('returns multiple insights when multiple conditions trigger', () => {
		const results = Array.from({ length: 6 }, (_, i) =>
			makeResult({
				team_id: `t${i}`,
				agg_rank: i + 1,
				agg_rating: 80 + i * 0.2, // tight race (spread = 1.0)
			}),
		);
		const overrides = { t0: { final_rank: 3 } };
		const insights = computeInsights(results, {}, overrides, {});
		const ids = insights.map((i) => i.id);
		expect(ids).toContain('tight-race');
		expect(ids).toContain('active-overrides');
		expect(ids).not.toContain('clean');
	});
});
