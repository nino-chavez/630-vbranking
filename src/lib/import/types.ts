/**
 * Shared types for the data ingestion pipeline.
 *
 * These types are used across all parsers, the import service,
 * the identity resolver, and the API endpoints.
 */

/** Supported file formats for import */
export type ImportFormat = 'finishes' | 'colley';

/** How to handle existing data during import */
export type ImportMode = 'replace' | 'merge';

/** A single parsed row from the Finishes spreadsheet */
export interface ParsedFinishesRow {
	teamName: string;
	teamCode: string;
	tournamentName: string;
	division: string;
	finishPosition: number;
	fieldSize: number;
}

/** A single parsed row from the Colley spreadsheet */
export interface ParsedColleyRow {
	teamName: string;
	teamCode: string;
	wins: number;
	losses: number;
	algo1Rating: number | null;
	algo1Rank: number | null;
	algo2Rating: number | null;
	algo2Rank: number | null;
	algo3Rating: number | null;
	algo3Rank: number | null;
	algo4Rating: number | null;
	algo4Rank: number | null;
	algo5Rating: number | null;
	algo5Rank: number | null;
	aggRating: number | null;
	aggRank: number | null;
}

/** A parse error or warning attached to a specific cell */
export interface ParseError {
	row: number;
	column: string;
	message: string;
	severity: 'error' | 'warning';
}

/** An unresolved identity conflict discovered during parsing */
export interface IdentityConflict {
	type: 'team' | 'tournament';
	parsedValue: string;
	suggestions: Array<{
		id: string;
		name: string;
		code?: string;
		score: number;
	}>;
}

/** The result of parsing a file, generic over the row type */
export interface ParseResult<T> {
	rows: T[];
	errors: ParseError[];
	identityConflicts: IdentityConflict[];
	metadata: {
		format: ImportFormat;
		totalRowsParsed: number;
		totalColumnsDetected: number;
		tournamentsDetected?: string[];
	};
}

/** A user's resolution for a single identity conflict */
export interface IdentityMapping {
	type: 'team' | 'tournament';
	parsedValue: string;
	action: 'create' | 'map' | 'skip';
	mappedId?: string;
	newRecord?: Record<string, unknown>;
}

/** Summary data returned after a successful import */
export interface ImportSummaryData {
	rowsInserted: number;
	rowsUpdated: number;
	rowsSkipped: number;
	teamsCreated: number;
	tournamentsCreated: number;
	importMode: ImportMode;
	timestamp: string;
	seasonId: string;
	ageGroup: string;
}

/** Generic interface for all file parsers */
export interface FileParserInterface<T> {
	parse(buffer: ArrayBuffer, options?: Record<string, unknown>): ParseResult<T>;
}
