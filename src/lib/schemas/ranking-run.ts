import { z } from 'zod';

const uuidSchema = z.uuid();
const datetimeSchema = z.iso.datetime();

export const rankingRunSchema = z.object({
  id: uuidSchema,
  season_id: uuidSchema,
  ran_at: datetimeSchema,
  description: z.string().nullable(),
  parameters: z.unknown().nullable(),
  created_at: datetimeSchema,
  updated_at: datetimeSchema,
});

export const rankingRunInsertSchema = rankingRunSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const rankingRunUpdateSchema = rankingRunInsertSchema.partial();

export type RankingRun = z.infer<typeof rankingRunSchema>;
export type RankingRunInsert = z.infer<typeof rankingRunInsertSchema>;
export type RankingRunUpdate = z.infer<typeof rankingRunUpdateSchema>;
