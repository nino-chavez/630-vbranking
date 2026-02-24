import { z } from 'zod';
import { RankingScope } from './enums';

const uuidSchema = z.uuid();
const datetimeSchema = z.iso.datetime();

export const seasonSchema = z.object({
	id: uuidSchema,
	name: z.string().min(1),
	start_date: z.iso.date(),
	end_date: z.iso.date(),
	is_active: z.boolean(),
	ranking_scope: RankingScope,
	created_at: datetimeSchema,
	updated_at: datetimeSchema,
});

export const seasonInsertSchema = seasonSchema.omit({
	id: true,
	created_at: true,
	updated_at: true,
});

export const seasonUpdateSchema = seasonInsertSchema.partial();

export type Season = z.infer<typeof seasonSchema>;
export type SeasonInsert = z.infer<typeof seasonInsertSchema>;
export type SeasonUpdate = z.infer<typeof seasonUpdateSchema>;
