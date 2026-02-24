/**
 * Colley Matrix algorithm implementation.
 *
 * Constructs the Colley matrix C and right-hand-side vector b from
 * cumulative pairwise W/L records, then solves Cr=b via LU decomposition
 * using ml-matrix.
 *
 * Pure function -- no database access.
 */

import { Matrix, LuDecomposition } from 'ml-matrix';
import type { PairwiseRecord, AlgorithmResult, TeamInfo } from './types.js';

/**
 * Compute Colley ratings for all teams from pairwise records.
 *
 * @param pairwiseRecords - All pairwise W/L records (flattened across tournaments).
 * @param teams - List of teams with id, name, code for indexing and tie-breaking.
 * @returns AlgorithmResult[] sorted by rating descending, ties broken alphabetically.
 */
export function computeColleyRatings(
  pairwiseRecords: PairwiseRecord[],
  teams: TeamInfo[],
  weightMap?: Record<string, number>
): AlgorithmResult[] {
  const n = teams.length;

  // Edge case: no teams
  if (n === 0) {
    return [];
  }

  // Edge case: single team
  if (n === 1) {
    return [{ team_id: teams[0].id, rating: 0.5, rank: 1 }];
  }

  // Build team-index mapping
  const teamIndex = new Map<string, number>();
  for (let i = 0; i < teams.length; i++) {
    teamIndex.set(teams[i].id, i);
  }

  // Initialize Colley matrix: C[i][i] = 2, off-diagonal = 0
  const C: number[][] = [];
  for (let i = 0; i < n; i++) {
    C[i] = new Array<number>(n).fill(0);
    C[i][i] = 2;
  }

  // Initialize b vector: b[i] = 1
  const b: number[] = new Array<number>(n).fill(1);

  // Process pairwise records
  for (const record of pairwiseRecords) {
    const loserId = record.winner_id === record.team_a_id ? record.team_b_id : record.team_a_id;

    const winnerIdx = teamIndex.get(record.winner_id);
    const loserIdx = teamIndex.get(loserId);

    // Skip records involving teams not in the teams list
    if (winnerIdx === undefined || loserIdx === undefined) {
      continue;
    }

    const weight = weightMap?.[record.tournament_id] ?? 1.0;

    // Update diagonal (total games, scaled by weight)
    C[winnerIdx][winnerIdx] += weight;
    C[loserIdx][loserIdx] += weight;

    // Update off-diagonal (games between, scaled by weight)
    C[winnerIdx][loserIdx] -= weight;
    C[loserIdx][winnerIdx] -= weight;

    // Update b vector (scaled by weight)
    b[winnerIdx] += weight * 0.5;
    b[loserIdx] -= weight * 0.5;
  }

  // Solve Cr = b using ml-matrix LU decomposition
  const cMatrix = new Matrix(C);
  const bVector = Matrix.columnVector(b);
  const lu = new LuDecomposition(cMatrix);
  const rVector = lu.solve(bVector);

  // Extract ratings
  const ratingsWithTeams: Array<{ team: TeamInfo; rating: number }> = [];
  for (let i = 0; i < n; i++) {
    ratingsWithTeams.push({
      team: teams[i],
      rating: rVector.get(i, 0),
    });
  }

  // Sort by rating descending, ties broken alphabetically by team name ascending
  ratingsWithTeams.sort((a, b) => {
    if (b.rating !== a.rating) {
      return b.rating - a.rating;
    }
    return a.team.name.localeCompare(b.team.name);
  });

  // Assign ranks
  const results: AlgorithmResult[] = ratingsWithTeams.map((entry, index) => ({
    team_id: entry.team.id,
    rating: entry.rating,
    rank: index + 1,
  }));

  return results;
}
