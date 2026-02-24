import { z } from 'zod';
import { AgeGroup } from './enums';

const uuidSchema = z.uuid();
const datetimeSchema = z.iso.datetime();

export const teamSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1),
  code: z.string().min(1),
  region: z.string().min(1),
  age_group: AgeGroup,
  created_at: datetimeSchema,
  updated_at: datetimeSchema,
});

export const teamInsertSchema = teamSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const teamUpdateSchema = teamInsertSchema.partial();

export type Team = z.infer<typeof teamSchema>;
export type TeamInsert = z.infer<typeof teamInsertSchema>;
export type TeamUpdate = z.infer<typeof teamUpdateSchema>;
