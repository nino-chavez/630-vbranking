import { z } from 'zod';

const uuidSchema = z.uuid();
const datetimeSchema = z.iso.datetime();

export const tournamentSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1),
  date: z.iso.date(),
  season_id: uuidSchema,
  location: z.string().nullable(),
  created_at: datetimeSchema,
  updated_at: datetimeSchema,
});

export const tournamentInsertSchema = tournamentSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const tournamentUpdateSchema = tournamentInsertSchema.partial();

export type Tournament = z.infer<typeof tournamentSchema>;
export type TournamentInsert = z.infer<typeof tournamentInsertSchema>;
export type TournamentUpdate = z.infer<typeof tournamentUpdateSchema>;
