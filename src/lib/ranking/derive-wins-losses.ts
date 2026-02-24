/**
 * Pairwise win/loss derivation from tournament finishes and match records.
 *
 * Pure functions -- no database access. Accept data, return results.
 */

import type { PairwiseRecord, TournamentPairwiseGroup } from './types.js';

/**
 * Input shape for tournament finish data.
 */
interface TournamentFinish {
  team_id: string;
  tournament_id: string;
  division: string;
  finish_position: number;
}

/**
 * Input shape for match record data.
 */
interface MatchRecord {
  team_a_id: string;
  team_b_id: string;
  winner_id: string | null;
  tournament_id: string;
}

/**
 * Derive pairwise W/L records from tournament finish positions.
 *
 * Groups results by tournament_id + division, then generates all pairwise
 * combinations where the lower finish position wins. Teams with identical
 * finish positions produce no pairwise record between them.
 *
 * Returns groups sorted by tournament_date ascending for Elo processing.
 */
export function deriveWinsLossesFromFinishes(
  tournamentResults: TournamentFinish[],
  tournamentDates: Map<string, string>
): TournamentPairwiseGroup[] {
  // Group by tournament_id + division
  const groups = new Map<string, TournamentFinish[]>();
  for (const result of tournamentResults) {
    const key = `${result.tournament_id}::${result.division}`;
    const group = groups.get(key);
    if (group) {
      group.push(result);
    } else {
      groups.set(key, [result]);
    }
  }

  // For each group, generate pairwise records
  const recordsByTournament = new Map<string, PairwiseRecord[]>();

  for (const [, results] of groups) {
    // Sort by finish_position for deterministic pair ordering
    const sorted = [...results].sort((a, b) => a.finish_position - b.finish_position);

    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const teamI = sorted[i];
        const teamJ = sorted[j];

        // Teams with identical finish positions produce no record
        if (teamI.finish_position === teamJ.finish_position) {
          continue;
        }

        // Lower finish position wins
        const record: PairwiseRecord = {
          team_a_id: teamI.team_id,
          team_b_id: teamJ.team_id,
          winner_id: teamI.team_id,
          tournament_id: teamI.tournament_id,
        };

        const existing = recordsByTournament.get(teamI.tournament_id);
        if (existing) {
          existing.push(record);
        } else {
          recordsByTournament.set(teamI.tournament_id, [record]);
        }
      }
    }
  }

  // Build TournamentPairwiseGroup array
  const result: TournamentPairwiseGroup[] = [];
  for (const [tournamentId, records] of recordsByTournament) {
    result.push({
      tournament_id: tournamentId,
      tournament_date: tournamentDates.get(tournamentId) ?? '',
      records,
    });
  }

  // Sort by tournament_date ascending
  result.sort((a, b) => a.tournament_date.localeCompare(b.tournament_date));

  return result;
}

/**
 * Derive pairwise W/L records from match records.
 *
 * Filters out draws (winner_id === null), converts each match to a
 * PairwiseRecord, groups by tournament, and sorts chronologically.
 */
export function deriveWinsLossesFromMatches(
  matches: MatchRecord[],
  tournamentDates: Map<string, string>
): TournamentPairwiseGroup[] {
  const recordsByTournament = new Map<string, PairwiseRecord[]>();

  for (const match of matches) {
    // Skip draws
    if (match.winner_id === null) {
      continue;
    }

    const record: PairwiseRecord = {
      team_a_id: match.team_a_id,
      team_b_id: match.team_b_id,
      winner_id: match.winner_id,
      tournament_id: match.tournament_id,
    };

    const existing = recordsByTournament.get(match.tournament_id);
    if (existing) {
      existing.push(record);
    } else {
      recordsByTournament.set(match.tournament_id, [record]);
    }
  }

  // Build TournamentPairwiseGroup array
  const result: TournamentPairwiseGroup[] = [];
  for (const [tournamentId, records] of recordsByTournament) {
    result.push({
      tournament_id: tournamentId,
      tournament_date: tournamentDates.get(tournamentId) ?? '',
      records,
    });
  }

  // Sort by tournament_date ascending
  result.sort((a, b) => a.tournament_date.localeCompare(b.tournament_date));

  return result;
}

/**
 * Flatten all tournament pairwise groups into a single array of records.
 *
 * Used by the Colley algorithm which does not need chronological ordering.
 */
export function flattenPairwiseGroups(groups: TournamentPairwiseGroup[]): PairwiseRecord[] {
  const result: PairwiseRecord[] = [];
  for (const group of groups) {
    for (const record of group.records) {
      result.push(record);
    }
  }
  return result;
}
