import { z } from 'zod';

const uuidSchema = z.uuid();
const datetimeSchema = z.iso.datetime();

export const tournamentWeightSchema = z.object({
	id: uuidSchema,
	tournament_id: uuidSchema,
	season_id: uuidSchema,
	weight: z.number().positive(),
	tier: z.number().int().positive(),
	created_at: datetimeSchema,
	updated_at: datetimeSchema,
});

export const tournamentWeightInsertSchema = tournamentWeightSchema.omit({
	id: true,
	created_at: true,
	updated_at: true,
});

export const tournamentWeightUpdateSchema = tournamentWeightInsertSchema.partial();

export type TournamentWeight = z.infer<typeof tournamentWeightSchema>;
export type TournamentWeightInsert = z.infer<typeof tournamentWeightInsertSchema>;
export type TournamentWeightUpdate = z.infer<typeof tournamentWeightUpdateSchema>;
