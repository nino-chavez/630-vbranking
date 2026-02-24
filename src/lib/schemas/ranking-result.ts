import { z } from 'zod';

const uuidSchema = z.uuid();
const datetimeSchema = z.iso.datetime();

export const rankingResultSchema = z.object({
	id: uuidSchema,
	ranking_run_id: uuidSchema,
	team_id: uuidSchema,
	algo1_rating: z.number().nullable(),
	algo1_rank: z.number().int().nullable(),
	algo2_rating: z.number().nullable(),
	algo2_rank: z.number().int().nullable(),
	algo3_rating: z.number().nullable(),
	algo3_rank: z.number().int().nullable(),
	algo4_rating: z.number().nullable(),
	algo4_rank: z.number().int().nullable(),
	algo5_rating: z.number().nullable(),
	algo5_rank: z.number().int().nullable(),
	agg_rating: z.number().nullable(),
	agg_rank: z.number().int().nullable(),
	created_at: datetimeSchema,
	updated_at: datetimeSchema,
});

export const rankingResultInsertSchema = rankingResultSchema.omit({
	id: true,
	created_at: true,
	updated_at: true,
});

export const rankingResultUpdateSchema = rankingResultInsertSchema.partial();

export type RankingResult = z.infer<typeof rankingResultSchema>;
export type RankingResultInsert = z.infer<typeof rankingResultInsertSchema>;
export type RankingResultUpdate = z.infer<typeof rankingResultUpdateSchema>;
