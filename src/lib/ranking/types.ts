/**
 * Type definitions for the ranking algorithm engine.
 *
 * All types used across W/L derivation, Colley Matrix,
 * Elo variants, and normalization/aggregation.
 */

/** A single head-to-head result between two teams. */
export interface PairwiseRecord {
  team_a_id: string;
  team_b_id: string;
  winner_id: string;
  tournament_id: string;
}

/** Pairwise records grouped by tournament for chronological Elo processing. */
export interface TournamentPairwiseGroup {
  tournament_id: string;
  tournament_date: string;
  records: PairwiseRecord[];
}

/** Output of a single algorithm for one team. */
export interface AlgorithmResult {
  team_id: string;
  rating: number;
  rank: number;
}

/** Algorithm results keyed by algorithm name. */
export type AlgorithmResultMap = Record<string, AlgorithmResult[]>;

/** Final output row per team after normalization and aggregation. */
export interface NormalizedTeamResult {
  team_id: string;
  algo1_rating: number;
  algo1_rank: number;
  algo2_rating: number;
  algo2_rank: number;
  algo3_rating: number;
  algo3_rank: number;
  algo4_rating: number;
  algo4_rank: number;
  algo5_rating: number;
  algo5_rank: number;
  agg_rating: number;
  agg_rank: number;
}

/** Configuration for a ranking run. */
export interface RankingRunConfig {
  season_id: string;
  age_group: string;
  k_factor: number;
  elo_starting_ratings: number[];
}

/** Full output of a ranking run. */
export interface RankingRunOutput {
  ranking_run_id: string;
  results: NormalizedTeamResult[];
  teams_ranked: number;
  ran_at: string;
}

/** Minimal team reference for tie-breaking. */
export interface TeamInfo {
  id: string;
  name: string;
  code: string;
}
