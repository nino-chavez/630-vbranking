import { z } from 'zod';

const uuidSchema = z.uuid();
const datetimeSchema = z.iso.datetime();

export const matchSchema = z
	.object({
		id: uuidSchema,
		team_a_id: uuidSchema,
		team_b_id: uuidSchema,
		winner_id: uuidSchema.nullable(),
		tournament_id: uuidSchema,
		set_scores: z.unknown().nullable(),
		point_differential: z.number().int().nullable(),
		metadata: z.unknown().nullable(),
		created_at: datetimeSchema,
		updated_at: datetimeSchema,
	})
	.refine((data) => data.team_a_id !== data.team_b_id, {
		message: 'team_a_id and team_b_id must be different',
		path: ['team_b_id'],
	})
	.refine(
		(data) =>
			data.winner_id === null ||
			data.winner_id === data.team_a_id ||
			data.winner_id === data.team_b_id,
		{
			message: 'winner_id must be either team_a_id or team_b_id when not null',
			path: ['winner_id'],
		},
	);

export const matchInsertSchema = z
	.object({
		team_a_id: uuidSchema,
		team_b_id: uuidSchema,
		winner_id: uuidSchema.nullable(),
		tournament_id: uuidSchema,
		set_scores: z.unknown().nullable(),
		point_differential: z.number().int().nullable(),
		metadata: z.unknown().nullable(),
	})
	.refine((data) => data.team_a_id !== data.team_b_id, {
		message: 'team_a_id and team_b_id must be different',
		path: ['team_b_id'],
	})
	.refine(
		(data) =>
			data.winner_id === null ||
			data.winner_id === data.team_a_id ||
			data.winner_id === data.team_b_id,
		{
			message: 'winner_id must be either team_a_id or team_b_id when not null',
			path: ['winner_id'],
		},
	);

export const matchUpdateSchema = z
	.object({
		team_a_id: uuidSchema,
		team_b_id: uuidSchema,
		winner_id: uuidSchema.nullable(),
		tournament_id: uuidSchema,
		set_scores: z.unknown().nullable(),
		point_differential: z.number().int().nullable(),
		metadata: z.unknown().nullable(),
	})
	.partial();

export type Match = z.infer<typeof matchSchema>;
export type MatchInsert = z.infer<typeof matchInsertSchema>;
export type MatchUpdate = z.infer<typeof matchUpdateSchema>;
