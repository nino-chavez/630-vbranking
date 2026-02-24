import type { FileParserInterface } from '../types.js';

/**
 * A single parsed row from a CSV match file.
 *
 * Expected CSV columns:
 *   - Team A: Name or code of the first team
 *   - Team B: Name or code of the second team
 *   - Winner: Name or code of the winning team, or null for a draw/unfinished match
 *   - Tournament: Name of the tournament the match was played in
 *
 * This type is defined for architecture purposes. The CSV match parser
 * implementation is deferred to a future feature.
 */
export interface ParsedMatchRow {
	teamA: string;
	teamB: string;
	winner: string | null;
	tournament: string;
}

/**
 * Interface for a CSV match file parser.
 *
 * Extends the generic FileParserInterface with ParsedMatchRow as the row type.
 * No implementation is provided -- this is an architecture-only contract
 * for a future CSV match ingestion feature.
 */
export type MatchFileParser = FileParserInterface<ParsedMatchRow>;
