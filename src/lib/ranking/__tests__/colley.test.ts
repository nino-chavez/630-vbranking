import { describe, it, expect } from 'vitest';
import { computeColleyRatings } from '../colley.js';
import type { PairwiseRecord, TeamInfo } from '../types.js';

describe('computeColleyRatings', () => {
  it('produces correct ratings for 3-team known example (A>B, A>C, B>C)', () => {
    // A beats B, A beats C, B beats C
    // C matrix = [[4,-1,-1],[-1,4,-1],[-1,-1,4]]
    // b = [2.0, 1.0, 0.0]
    // Solution: A=0.7, B=0.5, C=0.3
    const teams: TeamInfo[] = [
      { id: 'team-a', name: 'Alpha', code: 'ALP' },
      { id: 'team-b', name: 'Bravo', code: 'BRV' },
      { id: 'team-c', name: 'Charlie', code: 'CHL' },
    ];

    const records: PairwiseRecord[] = [
      { team_a_id: 'team-a', team_b_id: 'team-b', winner_id: 'team-a', tournament_id: 't1' },
      { team_a_id: 'team-a', team_b_id: 'team-c', winner_id: 'team-a', tournament_id: 't1' },
      { team_a_id: 'team-b', team_b_id: 'team-c', winner_id: 'team-b', tournament_id: 't1' },
    ];

    const results = computeColleyRatings(records, teams);

    expect(results).toHaveLength(3);

    // Verify ratings match hand-computed values to within 0.0001
    const teamA = results.find((r) => r.team_id === 'team-a')!;
    const teamB = results.find((r) => r.team_id === 'team-b')!;
    const teamC = results.find((r) => r.team_id === 'team-c')!;

    expect(teamA.rating).toBeCloseTo(0.7, 4);
    expect(teamB.rating).toBeCloseTo(0.5, 4);
    expect(teamC.rating).toBeCloseTo(0.3, 4);

    // Verify ranks
    expect(teamA.rank).toBe(1);
    expect(teamB.rank).toBe(2);
    expect(teamC.rank).toBe(3);
  });

  it('returns rating 0.5 and rank 1 for a single team', () => {
    const teams: TeamInfo[] = [{ id: 'team-a', name: 'Alpha', code: 'ALP' }];
    const records: PairwiseRecord[] = [];

    const results = computeColleyRatings(records, teams);

    expect(results).toHaveLength(1);
    expect(results[0].team_id).toBe('team-a');
    expect(results[0].rating).toBeCloseTo(0.5, 4);
    expect(results[0].rank).toBe(1);
  });

  it('assigns rating 0.5 and alphabetical ranks when no games played', () => {
    const teams: TeamInfo[] = [
      { id: 'team-c', name: 'Charlie', code: 'CHL' },
      { id: 'team-a', name: 'Alpha', code: 'ALP' },
      { id: 'team-b', name: 'Bravo', code: 'BRV' },
    ];
    const records: PairwiseRecord[] = [];

    const results = computeColleyRatings(records, teams);

    expect(results).toHaveLength(3);

    // All teams should have rating 0.5
    for (const result of results) {
      expect(result.rating).toBeCloseTo(0.5, 4);
    }

    // Ranks should be alphabetical: Alpha=1, Bravo=2, Charlie=3
    const alpha = results.find((r) => r.team_id === 'team-a')!;
    const bravo = results.find((r) => r.team_id === 'team-b')!;
    const charlie = results.find((r) => r.team_id === 'team-c')!;

    expect(alpha.rank).toBe(1);
    expect(bravo.rank).toBe(2);
    expect(charlie.rank).toBe(3);
  });

  it('breaks ties alphabetically by team name', () => {
    // Two teams that each win one game against a third, producing identical records
    // A beats C, B beats C -> A and B have same W/L record
    const teams: TeamInfo[] = [
      { id: 'team-a', name: 'Zebra', code: 'ZEB' },
      { id: 'team-b', name: 'Alpha', code: 'ALP' },
      { id: 'team-c', name: 'Middle', code: 'MID' },
    ];

    // Symmetric scenario: A beats C, B beats C (A and B never play each other)
    // This creates a symmetric situation for A and B
    const records: PairwiseRecord[] = [
      { team_a_id: 'team-a', team_b_id: 'team-c', winner_id: 'team-a', tournament_id: 't1' },
      { team_a_id: 'team-b', team_b_id: 'team-c', winner_id: 'team-b', tournament_id: 't1' },
    ];

    const results = computeColleyRatings(records, teams);

    // A (Zebra) and B (Alpha) should have identical ratings
    const zebra = results.find((r) => r.team_id === 'team-a')!;
    const alpha = results.find((r) => r.team_id === 'team-b')!;

    expect(zebra.rating).toBeCloseTo(alpha.rating, 4);

    // Alpha (alphabetically first) should get the better rank
    expect(alpha.rank).toBeLessThan(zebra.rank);
  });
});
