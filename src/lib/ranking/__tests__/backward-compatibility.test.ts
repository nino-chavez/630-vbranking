import { describe, it, expect } from 'vitest';
import { computeColleyRatings } from '../colley.js';
import { computeEloRatings, DEFAULT_K_FACTOR } from '../elo.js';
import type { PairwiseRecord, TournamentPairwiseGroup, TeamInfo } from '../types.js';

const teams: TeamInfo[] = [
  { id: 'A', name: 'Alpha', code: 'ALP' },
  { id: 'B', name: 'Bravo', code: 'BRV' },
  { id: 'C', name: 'Charlie', code: 'CHA' },
  { id: 'D', name: 'Delta', code: 'DLT' },
  { id: 'E', name: 'Echo', code: 'ECH' },
];

// 3 tournaments with varied matchups
const records: PairwiseRecord[] = [
  // T1: A>B, A>C, B>D
  { team_a_id: 'A', team_b_id: 'B', winner_id: 'A', tournament_id: 'T1' },
  { team_a_id: 'A', team_b_id: 'C', winner_id: 'A', tournament_id: 'T1' },
  { team_a_id: 'B', team_b_id: 'D', winner_id: 'B', tournament_id: 'T1' },
  // T2: C>D, E>A, D>E
  { team_a_id: 'C', team_b_id: 'D', winner_id: 'C', tournament_id: 'T2' },
  { team_a_id: 'E', team_b_id: 'A', winner_id: 'E', tournament_id: 'T2' },
  { team_a_id: 'D', team_b_id: 'E', winner_id: 'D', tournament_id: 'T2' },
  // T3: B>E, C>A, D>A
  { team_a_id: 'B', team_b_id: 'E', winner_id: 'B', tournament_id: 'T3' },
  { team_a_id: 'C', team_b_id: 'A', winner_id: 'C', tournament_id: 'T3' },
  { team_a_id: 'D', team_b_id: 'A', winner_id: 'D', tournament_id: 'T3' },
];

const groups: TournamentPairwiseGroup[] = [
  {
    tournament_id: 'T1',
    tournament_date: '2026-01-01',
    records: records.filter((r) => r.tournament_id === 'T1'),
  },
  {
    tournament_id: 'T2',
    tournament_date: '2026-02-01',
    records: records.filter((r) => r.tournament_id === 'T2'),
  },
  {
    tournament_id: 'T3',
    tournament_date: '2026-03-01',
    records: records.filter((r) => r.tournament_id === 'T3'),
  },
];

describe('Backward Compatibility', () => {
  it('all weights = 1.0 equals unweighted for Colley and Elo', () => {
    const allOnesMap = { T1: 1.0, T2: 1.0, T3: 1.0 };

    // Colley: unweighted vs all-ones weight map
    const colleyUnweighted = computeColleyRatings(records, teams);
    const colleyWeighted = computeColleyRatings(records, teams, allOnesMap);
    expect(colleyWeighted).toEqual(colleyUnweighted);

    // Elo: unweighted vs all-ones weight map
    const eloUnweighted = computeEloRatings(groups, teams, 2200, DEFAULT_K_FACTOR);
    const eloWeighted = computeEloRatings(groups, teams, 2200, DEFAULT_K_FACTOR, allOnesMap);
    expect(eloWeighted).toEqual(eloUnweighted);
  });

  it('Colley: undefined vs {} vs missing entries all produce identical output', () => {
    const withUndefined = computeColleyRatings(records, teams, undefined);
    const withEmpty = computeColleyRatings(records, teams, {});
    const withoutArg = computeColleyRatings(records, teams);

    expect(withUndefined).toEqual(withoutArg);
    expect(withEmpty).toEqual(withoutArg);
  });
});
