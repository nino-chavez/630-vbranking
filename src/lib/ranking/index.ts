/**
 * Ranking algorithm engine barrel export.
 *
 * Re-exports all types, algorithm functions, and constants
 * from the ranking module.
 */

// Types
export type {
	PairwiseRecord,
	TournamentPairwiseGroup,
	AlgorithmResult,
	AlgorithmResultMap,
	NormalizedTeamResult,
	RankingRunConfig,
	RankingRunOutput,
	TeamInfo,
} from './types.js';

// W/L derivation
export {
	deriveWinsLossesFromFinishes,
	deriveWinsLossesFromMatches,
	flattenPairwiseGroups,
} from './derive-wins-losses.js';

// Colley Matrix algorithm
export { computeColleyRatings } from './colley.js';

// Elo algorithm
export { computeEloRatings, DEFAULT_K_FACTOR, ELO_STARTING_RATINGS } from './elo.js';

// Normalization and aggregation
export { normalizeAndAggregate } from './normalize.js';
