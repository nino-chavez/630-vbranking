import { describe, it, expect } from 'vitest';
import { deriveWinsLossesFromFinishes, flattenPairwiseGroups } from '../derive-wins-losses.js';
import { computeColleyRatings } from '../colley.js';
import { computeEloRatings, DEFAULT_K_FACTOR } from '../elo.js';
import { normalizeAndAggregate } from '../normalize.js';
import type { TeamInfo, AlgorithmResultMap } from '../types.js';

describe('Cross-Algorithm Integration', () => {
  it('end-to-end: team with most wins gets highest AggRating and AggRank=1', () => {
    const teams: TeamInfo[] = [
      { id: 'team-a', name: 'Alpha', code: 'ALP' },
      { id: 'team-b', name: 'Bravo', code: 'BRA' },
      { id: 'team-c', name: 'Charlie', code: 'CHA' },
      { id: 'team-d', name: 'Delta', code: 'DEL' },
    ];

    // Team A wins both tournaments, Team D loses both
    const results = [
      { team_id: 'team-a', tournament_id: 't1', division: 'Open', finish_position: 1 },
      { team_id: 'team-b', tournament_id: 't1', division: 'Open', finish_position: 2 },
      { team_id: 'team-c', tournament_id: 't1', division: 'Open', finish_position: 3 },
      { team_id: 'team-d', tournament_id: 't1', division: 'Open', finish_position: 4 },
      { team_id: 'team-a', tournament_id: 't2', division: 'Open', finish_position: 1 },
      { team_id: 'team-c', tournament_id: 't2', division: 'Open', finish_position: 2 },
      { team_id: 'team-b', tournament_id: 't2', division: 'Open', finish_position: 3 },
      { team_id: 'team-d', tournament_id: 't2', division: 'Open', finish_position: 4 },
    ];

    const dates = new Map([
      ['t1', '2026-01-10'],
      ['t2', '2026-02-15'],
    ]);

    const groups = deriveWinsLossesFromFinishes(results, dates);
    const flat = flattenPairwiseGroups(groups);

    const colley = computeColleyRatings(flat, teams);
    const elo2200 = computeEloRatings(groups, teams, 2200, DEFAULT_K_FACTOR);
    const elo2400 = computeEloRatings(groups, teams, 2400, DEFAULT_K_FACTOR);
    const elo2500 = computeEloRatings(groups, teams, 2500, DEFAULT_K_FACTOR);
    const elo2700 = computeEloRatings(groups, teams, 2700, DEFAULT_K_FACTOR);

    const algorithmResults: AlgorithmResultMap = {
      algo1: colley,
      algo2: elo2200,
      algo3: elo2400,
      algo4: elo2500,
      algo5: elo2700,
    };

    const normalized = normalizeAndAggregate(algorithmResults, teams);

    // Team A should be rank 1
    const teamA = normalized.find((r) => r.team_id === 'team-a');
    expect(teamA).toBeDefined();
    expect(teamA!.agg_rank).toBe(1);
    expect(teamA!.agg_rating).toBe(100); // Best in all algorithms = 100 normalized

    // Team D should be rank 4 (worst in all)
    const teamD = normalized.find((r) => r.team_id === 'team-d');
    expect(teamD).toBeDefined();
    expect(teamD!.agg_rank).toBe(4);
    expect(teamD!.agg_rating).toBe(0); // Worst in all algorithms = 0 normalized
  });

  it('division filtering: W/L derivation only pairs teams in same division', () => {
    const results = [
      { team_id: 'team-a', tournament_id: 't1', division: 'Open', finish_position: 1 },
      { team_id: 'team-b', tournament_id: 't1', division: 'Open', finish_position: 2 },
      { team_id: 'team-c', tournament_id: 't1', division: 'Club', finish_position: 1 },
      { team_id: 'team-d', tournament_id: 't1', division: 'Club', finish_position: 2 },
    ];

    const dates = new Map([['t1', '2026-01-10']]);
    const groups = deriveWinsLossesFromFinishes(results, dates);
    const flat = flattenPairwiseGroups(groups);

    // Should produce 2 records: A beats B (Open), C beats D (Club)
    expect(flat).toHaveLength(2);

    // No cross-division matchups
    const crossDiv = flat.find(
      (r) =>
        (r.team_a_id === 'team-a' && r.team_b_id === 'team-c') ||
        (r.team_a_id === 'team-c' && r.team_b_id === 'team-a') ||
        (r.team_a_id === 'team-a' && r.team_b_id === 'team-d') ||
        (r.team_a_id === 'team-d' && r.team_b_id === 'team-a') ||
        (r.team_a_id === 'team-b' && r.team_b_id === 'team-c') ||
        (r.team_a_id === 'team-c' && r.team_b_id === 'team-b') ||
        (r.team_a_id === 'team-b' && r.team_b_id === 'team-d') ||
        (r.team_a_id === 'team-d' && r.team_b_id === 'team-b'),
    );
    expect(crossDiv).toBeUndefined();
  });
});
