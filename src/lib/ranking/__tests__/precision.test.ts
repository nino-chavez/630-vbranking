import { describe, it, expect } from 'vitest';
import { computeColleyRatings } from '../colley.js';
import { DEFAULT_K_FACTOR } from '../elo.js';
import type { PairwiseRecord, TeamInfo } from '../types.js';

describe('Numerical Precision', () => {
  it('Colley ratings sum to N/2 (theoretical invariant) for a 10-team dataset', () => {
    const teams: TeamInfo[] = [];
    for (let i = 0; i < 10; i++) {
      teams.push({
        id: `team-${i}`,
        name: `Team ${String.fromCharCode(65 + i)}`,
        code: `T${i}`,
      });
    }

    // Generate pairwise records: team i beats team j for i < j
    const records: PairwiseRecord[] = [];
    for (let i = 0; i < 10; i++) {
      for (let j = i + 1; j < 10; j++) {
        records.push({
          team_a_id: `team-${i}`,
          team_b_id: `team-${j}`,
          winner_id: `team-${i}`,
          tournament_id: 't1',
        });
      }
    }

    const results = computeColleyRatings(records, teams);
    const ratingSum = results.reduce((sum, r) => sum + r.rating, 0);

    // Theoretical invariant: sum of all Colley ratings = N * 0.5 = 5.0
    expect(ratingSum).toBeCloseTo(5.0, 4);
  });

  it('Elo with extreme rating gap: expected outcome produces small changes', () => {
    // Strong team at 2700, weak at 2200 (500 point gap)
    const strongStart = 2700;
    const weakStart = 2200;

    // Compute expected score for the strong team
    const E_strong = 1 / (1 + Math.pow(10, (weakStart - strongStart) / 400));
    // E_strong should be close to 1.0 (strong team is heavily favored)
    expect(E_strong).toBeGreaterThan(0.94);

    const E_weak = 1 - E_strong;
    // E_weak should be close to 0.0
    expect(E_weak).toBeLessThan(0.06);

    // When the expected outcome happens (strong beats weak):
    const K = DEFAULT_K_FACTOR;
    const strongGain = K * (1 - E_strong); // small gain (expected win)
    const weakLoss = Math.abs(K * (0 - E_weak)); // small loss (expected loss)

    // Both changes are small because the outcome was expected
    expect(strongGain).toBeLessThan(K * 0.1);
    expect(weakLoss).toBeLessThan(K * 0.1);

    // Verify symmetry: winner gain equals loser loss
    expect(strongGain).toBeCloseTo(weakLoss, 10);
  });
});
