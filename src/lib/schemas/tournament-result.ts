import { z } from 'zod';

const uuidSchema = z.uuid();
const datetimeSchema = z.iso.datetime();

export const tournamentResultSchema = z
  .object({
    id: uuidSchema,
    team_id: uuidSchema,
    tournament_id: uuidSchema,
    division: z.string().min(1),
    finish_position: z.number().int().min(1),
    field_size: z.number().int().min(1),
    created_at: datetimeSchema,
    updated_at: datetimeSchema,
  })
  .refine((data) => data.finish_position <= data.field_size, {
    message: 'finish_position must be less than or equal to field_size',
    path: ['finish_position'],
  });

export const tournamentResultInsertSchema = z
  .object({
    team_id: uuidSchema,
    tournament_id: uuidSchema,
    division: z.string().min(1),
    finish_position: z.number().int().min(1),
    field_size: z.number().int().min(1),
  })
  .refine((data) => data.finish_position <= data.field_size, {
    message: 'finish_position must be less than or equal to field_size',
    path: ['finish_position'],
  });

export const tournamentResultUpdateSchema = z
  .object({
    team_id: uuidSchema,
    tournament_id: uuidSchema,
    division: z.string().min(1),
    finish_position: z.number().int().min(1),
    field_size: z.number().int().min(1),
  })
  .partial();

export type TournamentResult = z.infer<typeof tournamentResultSchema>;
export type TournamentResultInsert = z.infer<typeof tournamentResultInsertSchema>;
export type TournamentResultUpdate = z.infer<typeof tournamentResultUpdateSchema>;
