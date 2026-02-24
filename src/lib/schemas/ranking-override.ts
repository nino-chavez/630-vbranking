import { z } from 'zod';

const uuidSchema = z.uuid();
const datetimeSchema = z.iso.datetime();

export const rankingOverrideSchema = z.object({
	id: uuidSchema,
	ranking_run_id: uuidSchema,
	team_id: uuidSchema,
	original_rank: z.number().int(),
	final_rank: z.number().int(),
	justification: z.string().min(10),
	committee_member: z.string().min(2),
	created_at: datetimeSchema,
	updated_at: datetimeSchema,
});

export const rankingOverrideInsertSchema = rankingOverrideSchema.omit({
	id: true,
	created_at: true,
	updated_at: true,
});

export const rankingOverrideUpdateSchema = rankingOverrideInsertSchema.partial();

export type RankingOverride = z.infer<typeof rankingOverrideSchema>;
export type RankingOverrideInsert = z.infer<typeof rankingOverrideInsertSchema>;
export type RankingOverrideUpdate = z.infer<typeof rankingOverrideUpdateSchema>;
