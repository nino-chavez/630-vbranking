import { z } from 'zod';

export const AgeGroup = z.enum(['15U', '16U', '17U', '18U']);
export type AgeGroup = z.infer<typeof AgeGroup>;

export const RankingScope = z.enum(['single_season', 'cross_season']);
export type RankingScope = z.infer<typeof RankingScope>;
