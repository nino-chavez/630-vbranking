import { describe, it, expect } from 'vitest';
import { computeEloRatings, DEFAULT_K_FACTOR, ELO_STARTING_RATINGS } from '../elo.js';
import type { TournamentPairwiseGroup, TeamInfo } from '../types.js';

describe('computeEloRatings', () => {
  it('computes correct rating update for 2-team single-game scenario (starting 2200)', () => {
    // A beats B, both start at 2200
    // E_A = 1 / (1 + 10^((2200-2200)/400)) = 1 / (1+1) = 0.5
    // New_R_A = 2200 + 32 * (1 - 0.5) = 2200 + 16 = 2216
    // New_R_B = 2200 + 32 * (0 - 0.5) = 2200 - 16 = 2184
    const teams: TeamInfo[] = [
      { id: 'team-a', name: 'Alpha', code: 'ALP' },
      { id: 'team-b', name: 'Bravo', code: 'BRV' },
    ];

    const groups: TournamentPairwiseGroup[] = [
      {
        tournament_id: 't1',
        tournament_date: '2026-01-15',
        records: [
          {
            team_a_id: 'team-a',
            team_b_id: 'team-b',
            winner_id: 'team-a',
            tournament_id: 't1',
          },
        ],
      },
    ];

    const results = computeEloRatings(groups, teams, 2200, DEFAULT_K_FACTOR);

    expect(results).toHaveLength(2);

    const teamA = results.find((r) => r.team_id === 'team-a')!;
    const teamB = results.find((r) => r.team_id === 'team-b')!;

    expect(teamA.rating).toBeCloseTo(2216, 4);
    expect(teamB.rating).toBeCloseTo(2184, 4);
    expect(teamA.rank).toBe(1);
    expect(teamB.rank).toBe(2);
  });

  it('processes tournaments chronologically using updated ratings from prior tournaments', () => {
    // Tournament 1: A beats B -> A=2216, B=2184
    // Tournament 2: B beats A -> uses updated ratings
    // E_B = 1 / (1 + 10^((2216-2184)/400)) = 1 / (1 + 10^(32/400))
    //      = 1 / (1 + 10^0.08) = 1 / (1 + 1.2023) = 1 / 2.2023 ~= 0.4541
    // New_R_B = 2184 + 32 * (1 - 0.4541) = 2184 + 32 * 0.5459 ~= 2184 + 17.469 ~= 2201.469
    // E_A = 1 - E_B ~= 0.5459
    // New_R_A = 2216 + 32 * (0 - 0.5459) ~= 2216 - 17.469 ~= 2198.531
    const teams: TeamInfo[] = [
      { id: 'team-a', name: 'Alpha', code: 'ALP' },
      { id: 'team-b', name: 'Bravo', code: 'BRV' },
    ];

    const groups: TournamentPairwiseGroup[] = [
      {
        tournament_id: 't1',
        tournament_date: '2026-01-15',
        records: [
          {
            team_a_id: 'team-a',
            team_b_id: 'team-b',
            winner_id: 'team-a',
            tournament_id: 't1',
          },
        ],
      },
      {
        tournament_id: 't2',
        tournament_date: '2026-02-15',
        records: [
          {
            team_a_id: 'team-a',
            team_b_id: 'team-b',
            winner_id: 'team-b',
            tournament_id: 't2',
          },
        ],
      },
    ];

    const results = computeEloRatings(groups, teams, 2200, DEFAULT_K_FACTOR);

    const teamA = results.find((r) => r.team_id === 'team-a')!;
    const teamB = results.find((r) => r.team_id === 'team-b')!;

    // After tournament 1: A=2216, B=2184
    // Tournament 2 uses these updated ratings, NOT 2200
    // B wins over A: B gains more than 16 (because B is the underdog), A loses more than 16
    // Verify B gained more than the equal-rating case (16 points)
    expect(teamB.rating - 2200).toBeGreaterThan(0);

    // Verify the expected score calculation used post-tournament-1 ratings
    // E_B based on 2184 vs 2216 (not 2200 vs 2200)
    const eB = 1 / (1 + Math.pow(10, (2216 - 2184) / 400));
    const expectedNewB = 2184 + 32 * (1 - eB);
    const eA = 1 - eB;
    const expectedNewA = 2216 + 32 * (0 - eA);

    expect(teamB.rating).toBeCloseTo(expectedNewB, 4);
    expect(teamA.rating).toBeCloseTo(expectedNewA, 4);
  });

  it('produces different absolute ratings but same relative ranks for all four starting ratings', () => {
    // A beats B, B beats C in one tournament
    const teams: TeamInfo[] = [
      { id: 'team-a', name: 'Alpha', code: 'ALP' },
      { id: 'team-b', name: 'Bravo', code: 'BRV' },
      { id: 'team-c', name: 'Charlie', code: 'CHL' },
    ];

    const groups: TournamentPairwiseGroup[] = [
      {
        tournament_id: 't1',
        tournament_date: '2026-01-15',
        records: [
          {
            team_a_id: 'team-a',
            team_b_id: 'team-b',
            winner_id: 'team-a',
            tournament_id: 't1',
          },
          {
            team_a_id: 'team-b',
            team_b_id: 'team-c',
            winner_id: 'team-b',
            tournament_id: 't1',
          },
        ],
      },
    ];

    const allResults = ELO_STARTING_RATINGS.map((startRating) =>
      computeEloRatings(groups, teams, startRating, DEFAULT_K_FACTOR)
    );

    // Verify all produce different absolute ratings
    const firstTeamARatings = allResults.map(
      (results) => results.find((r) => r.team_id === 'team-a')!.rating
    );
    const uniqueRatings = new Set(firstTeamARatings);
    expect(uniqueRatings.size).toBe(4);

    // Verify all produce the same relative rank order: A=1, B=2, C=3
    for (const results of allResults) {
      const teamA = results.find((r) => r.team_id === 'team-a')!;
      const teamB = results.find((r) => r.team_id === 'team-b')!;
      const teamC = results.find((r) => r.team_id === 'team-c')!;

      expect(teamA.rank).toBe(1);
      expect(teamB.rank).toBe(2);
      expect(teamC.rank).toBe(3);
    }
  });

  it('retains starting rating for teams with no games and ranks them alphabetically', () => {
    const teams: TeamInfo[] = [
      { id: 'team-c', name: 'Charlie', code: 'CHL' },
      { id: 'team-a', name: 'Alpha', code: 'ALP' },
      { id: 'team-b', name: 'Bravo', code: 'BRV' },
    ];

    const groups: TournamentPairwiseGroup[] = [];

    const results = computeEloRatings(groups, teams, 2200, DEFAULT_K_FACTOR);

    expect(results).toHaveLength(3);

    // All teams retain starting rating
    for (const result of results) {
      expect(result.rating).toBe(2200);
    }

    // All tied at 2200 -> ranked alphabetically
    const alpha = results.find((r) => r.team_id === 'team-a')!;
    const bravo = results.find((r) => r.team_id === 'team-b')!;
    const charlie = results.find((r) => r.team_id === 'team-c')!;

    expect(alpha.rank).toBe(1);
    expect(bravo.rank).toBe(2);
    expect(charlie.rank).toBe(3);
  });
});
