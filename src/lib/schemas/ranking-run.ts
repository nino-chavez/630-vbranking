import { z } from 'zod';
import { AgeGroup } from './enums.js';

const uuidSchema = z.uuid();
const datetimeSchema = z.iso.datetime();

export const rankingRunSchema = z.object({
	id: uuidSchema,
	season_id: uuidSchema,
	age_group: AgeGroup,
	ran_at: datetimeSchema,
	description: z.string().nullable(),
	parameters: z.unknown().nullable(),
	status: z.enum(['draft', 'finalized']).default('draft'),
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
