import { describe, it, expect } from 'vitest';
import { computeColleyRatings } from '../colley.js';
import { computeEloRatings, DEFAULT_K_FACTOR } from '../elo.js';
import type { PairwiseRecord, TournamentPairwiseGroup, TeamInfo } from '../types.js';

const teams: TeamInfo[] = [
  { id: 'A', name: 'Alpha', code: 'ALP' },
  { id: 'B', name: 'Bravo', code: 'BRV' },
  { id: 'C', name: 'Charlie', code: 'CHA' },
];

// T1: A beats B, A beats C
// T2: B beats C
// T3: C beats A
// T4: B beats A
const records: PairwiseRecord[] = [
  { team_a_id: 'A', team_b_id: 'B', winner_id: 'A', tournament_id: 'T1' },
  { team_a_id: 'A', team_b_id: 'C', winner_id: 'A', tournament_id: 'T1' },
  { team_a_id: 'B', team_b_id: 'C', winner_id: 'B', tournament_id: 'T2' },
  { team_a_id: 'C', team_b_id: 'A', winner_id: 'C', tournament_id: 'T3' },
  { team_a_id: 'B', team_b_id: 'A', winner_id: 'B', tournament_id: 'T4' },
];

const groups: TournamentPairwiseGroup[] = [
  { tournament_id: 'T1', tournament_date: '2026-01-01', records: records.filter((r) => r.tournament_id === 'T1') },
  { tournament_id: 'T2', tournament_date: '2026-02-01', records: records.filter((r) => r.tournament_id === 'T2') },
  { tournament_id: 'T3', tournament_date: '2026-03-01', records: records.filter((r) => r.tournament_id === 'T3') },
  { tournament_id: 'T4', tournament_date: '2026-04-01', records: records.filter((r) => r.tournament_id === 'T4') },
];

describe('Weighting Edge Cases', () => {
  it('very large weight (100.0) produces valid, finite ratings', () => {
    const colley = computeColleyRatings(records, teams, { T1: 100.0 });
    for (const r of colley) {
      expect(Number.isFinite(r.rating)).toBe(true);
      expect(Number.isNaN(r.rating)).toBe(false);
    }

    const elo = computeEloRatings(groups, teams, 2200, DEFAULT_K_FACTOR, { T1: 100.0 });
    for (const r of elo) {
      expect(Number.isFinite(r.rating)).toBe(true);
      expect(Number.isNaN(r.rating)).toBe(false);
    }
  });

  it('single tournament with weight > 1 preserves relative rankings vs weight 1', () => {
    // Only use T1 records (single tournament)
    const singleRecords = records.filter((r) => r.tournament_id === 'T1');
    const singleGroups = groups.filter((g) => g.tournament_id === 'T1');

    // Colley: scaling all games equally should not change relative order
    const colleyBase = computeColleyRatings(singleRecords, teams);
    const colleyScaled = computeColleyRatings(singleRecords, teams, { T1: 5.0 });

    const baseRanks = colleyBase.map((r) => r.team_id);
    const scaledRanks = colleyScaled.map((r) => r.team_id);
    expect(scaledRanks).toEqual(baseRanks);

    // Elo: same relative ranking with single tournament
    const eloBase = computeEloRatings(singleGroups, teams, 2200, DEFAULT_K_FACTOR);
    const eloScaled = computeEloRatings(singleGroups, teams, 2200, DEFAULT_K_FACTOR, { T1: 5.0 });

    const eloBaseRanks = eloBase.map((r) => r.team_id);
    const eloScaledRanks = eloScaled.map((r) => r.team_id);
    expect(eloScaledRanks).toEqual(eloBaseRanks);
  });

  it('mixed weighted and unweighted tournaments produce different results', () => {
    const weightMap = { T1: 2.0, T3: 3.0 }; // T2 and T4 default to 1.0

    const colleyUnweighted = computeColleyRatings(records, teams);
    const colleyMixed = computeColleyRatings(records, teams, weightMap);

    // Team C: unweighted has 1 win, 2 losses (rating < 0.5).
    // With T3 weighted 3.0, C's win at T3 is amplified → rating changes.
    const unweightedC = colleyUnweighted.find((r) => r.team_id === 'C')!;
    const mixedC = colleyMixed.find((r) => r.team_id === 'C')!;
    expect(mixedC.rating).not.toBe(unweightedC.rating);

    // All ratings should be valid
    for (const r of colleyMixed) {
      expect(Number.isFinite(r.rating)).toBe(true);
    }
  });
});
