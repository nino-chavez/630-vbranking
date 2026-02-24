import { describe, it, expect } from 'vitest';
import { normalizeAndAggregate } from '../normalize.js';
import type { AlgorithmResultMap, TeamInfo } from '../types.js';

describe('normalizeAndAggregate', () => {
  it('normalizes best=100, worst=0, middle=50 per algorithm', () => {
    const teams: TeamInfo[] = [
      { id: 'team-a', name: 'Alpha', code: 'ALP' },
      { id: 'team-b', name: 'Bravo', code: 'BRV' },
      { id: 'team-c', name: 'Charlie', code: 'CHL' },
    ];

    // All 5 algorithms produce the same linear ratings: A=100, B=50, C=0
    const algoResults: AlgorithmResultMap = {};
    for (const key of ['algo1', 'algo2', 'algo3', 'algo4', 'algo5']) {
      algoResults[key] = [
        { team_id: 'team-a', rating: 100, rank: 1 },
        { team_id: 'team-b', rating: 50, rank: 2 },
        { team_id: 'team-c', rating: 0, rank: 3 },
      ];
    }

    const results = normalizeAndAggregate(algoResults, teams);

    expect(results).toHaveLength(3);

    // Best team gets normalized 100 per algorithm
    const teamA = results.find((r) => r.team_id === 'team-a')!;
    expect(teamA.agg_rating).toBeCloseTo(100.0, 2);

    // Worst team gets normalized 0 per algorithm
    const teamC = results.find((r) => r.team_id === 'team-c')!;
    expect(teamC.agg_rating).toBeCloseTo(0.0, 2);

    // Middle team gets normalized 50 per algorithm
    const teamB = results.find((r) => r.team_id === 'team-b')!;
    expect(teamB.agg_rating).toBeCloseTo(50.0, 2);
  });

  it('assigns 50.0 to all teams when all have the same rating for an algorithm', () => {
    const teams: TeamInfo[] = [
      { id: 'team-a', name: 'Alpha', code: 'ALP' },
      { id: 'team-b', name: 'Bravo', code: 'BRV' },
    ];

    // All algorithms produce identical ratings for both teams
    const algoResults: AlgorithmResultMap = {};
    for (const key of ['algo1', 'algo2', 'algo3', 'algo4', 'algo5']) {
      algoResults[key] = [
        { team_id: 'team-a', rating: 0.5, rank: 1 },
        { team_id: 'team-b', rating: 0.5, rank: 2 },
      ];
    }

    const results = normalizeAndAggregate(algoResults, teams);

    expect(results).toHaveLength(2);

    // Both teams should have AggRating of 50.0 (since all normalized values are 50)
    for (const result of results) {
      expect(result.agg_rating).toBeCloseTo(50.0, 2);
    }
  });

  it('computes AggRating as arithmetic mean of five normalized values', () => {
    const teams: TeamInfo[] = [
      { id: 'team-a', name: 'Alpha', code: 'ALP' },
      { id: 'team-b', name: 'Bravo', code: 'BRV' },
    ];

    // Create different rating ranges per algorithm to verify normalization
    // algo1: A=10, B=0 -> normalized A=100, B=0
    // algo2: A=200, B=100 -> normalized A=100, B=0
    // algo3: A=0, B=50 -> normalized A=0, B=100
    // algo4: A=75, B=25 -> normalized A=100, B=0
    // algo5: A=1, B=1 -> normalized A=50, B=50 (equal case)
    const algoResults: AlgorithmResultMap = {
      algo1: [
        { team_id: 'team-a', rating: 10, rank: 1 },
        { team_id: 'team-b', rating: 0, rank: 2 },
      ],
      algo2: [
        { team_id: 'team-a', rating: 200, rank: 1 },
        { team_id: 'team-b', rating: 100, rank: 2 },
      ],
      algo3: [
        { team_id: 'team-a', rating: 0, rank: 2 },
        { team_id: 'team-b', rating: 50, rank: 1 },
      ],
      algo4: [
        { team_id: 'team-a', rating: 75, rank: 1 },
        { team_id: 'team-b', rating: 25, rank: 2 },
      ],
      algo5: [
        { team_id: 'team-a', rating: 1, rank: 1 },
        { team_id: 'team-b', rating: 1, rank: 2 },
      ],
    };

    const results = normalizeAndAggregate(algoResults, teams);

    // Team A: (100 + 100 + 0 + 100 + 50) / 5 = 350 / 5 = 70.0
    const teamA = results.find((r) => r.team_id === 'team-a')!;
    expect(teamA.agg_rating).toBeCloseTo(70.0, 2);

    // Team B: (0 + 0 + 100 + 0 + 50) / 5 = 150 / 5 = 30.0
    const teamB = results.find((r) => r.team_id === 'team-b')!;
    expect(teamB.agg_rating).toBeCloseTo(30.0, 2);
  });

  it('assigns AggRank correctly with ties broken alphabetically', () => {
    const teams: TeamInfo[] = [
      { id: 'team-a', name: 'Zebra', code: 'ZEB' },
      { id: 'team-b', name: 'Alpha', code: 'ALP' },
      { id: 'team-c', name: 'Middle', code: 'MID' },
    ];

    // All algorithms give the same ratings: all teams equal
    const algoResults: AlgorithmResultMap = {};
    for (const key of ['algo1', 'algo2', 'algo3', 'algo4', 'algo5']) {
      algoResults[key] = [
        { team_id: 'team-a', rating: 0.5, rank: 1 },
        { team_id: 'team-b', rating: 0.5, rank: 2 },
        { team_id: 'team-c', rating: 0.5, rank: 3 },
      ];
    }

    const results = normalizeAndAggregate(algoResults, teams);

    expect(results).toHaveLength(3);

    // All tied -> alphabetical: Alpha=1, Middle=2, Zebra=3
    const alpha = results.find((r) => r.team_id === 'team-b')!;
    const middle = results.find((r) => r.team_id === 'team-c')!;
    const zebra = results.find((r) => r.team_id === 'team-a')!;

    expect(alpha.agg_rank).toBe(1);
    expect(middle.agg_rank).toBe(2);
    expect(zebra.agg_rank).toBe(3);

    // Highest AggRating gets rank 1 (when not tied)
    // Here all are equal, so verify they are all 50.0
    expect(alpha.agg_rating).toBeCloseTo(50.0, 2);
    expect(middle.agg_rating).toBeCloseTo(50.0, 2);
    expect(zebra.agg_rating).toBeCloseTo(50.0, 2);
  });
});
