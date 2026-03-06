import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types.js';
import type { IdentityConflict } from './types.js';

/**
 * Compute the Levenshtein edit distance between two strings.
 * Used for fuzzy matching of team codes and tournament names.
 */
export function levenshteinDistance(a: string, b: string): number {
	const la = a.length;
	const lb = b.length;

	// Optimization: empty string cases
	if (la === 0) return lb;
	if (lb === 0) return la;

	// Create a 2D matrix for dynamic programming
	const matrix: number[][] = [];

	for (let i = 0; i <= la; i++) {
		matrix[i] = [i];
	}
	for (let j = 0; j <= lb; j++) {
		matrix[0][j] = j;
	}

	for (let i = 1; i <= la; i++) {
		for (let j = 1; j <= lb; j++) {
			const cost = a[i - 1] === b[j - 1] ? 0 : 1;
			matrix[i][j] = Math.min(
				matrix[i - 1][j] + 1, // deletion
				matrix[i][j - 1] + 1, // insertion
				matrix[i - 1][j - 1] + cost, // substitution
			);
		}
	}

	return matrix[la][lb];
}

/**
 * Compute a normalized similarity score between 0 and 1.
 * 1.0 = exact match, 0.0 = completely different.
 */
function similarityScore(a: string, b: string): number {
	const maxLen = Math.max(a.length, b.length);
	if (maxLen === 0) return 1.0;
	const distance = levenshteinDistance(a.toLowerCase(), b.toLowerCase());
	return 1.0 - distance / maxLen;
}

/**
 * Service for resolving parsed team codes and tournament names
 * against existing database records.
 *
 * For unmatched entities, provides fuzzy-match suggestions using
 * Levenshtein distance.
 */
export class IdentityResolver {
	private supabase: SupabaseClient<Database>;

	constructor(supabase: SupabaseClient<Database>) {
		this.supabase = supabase;
	}

	/**
	 * Resolve team codes against existing teams in the database.
	 *
	 * @param teamCodes - Array of team codes extracted from the parsed file
	 * @param ageGroup - The age group to filter teams by
	 * @returns Matched map (code -> team_id) and unmatched conflicts with suggestions
	 */
	async resolveTeams(
		teamCodes: string[],
		ageGroup: string,
	): Promise<{ matched: Map<string, string>; unmatched: IdentityConflict[] }> {
		const matched = new Map<string, string>();
		const unmatched: IdentityConflict[] = [];

		// Deduplicate the team codes
		const uniqueCodes = [...new Set(teamCodes)];

		if (uniqueCodes.length === 0) {
			return { matched, unmatched };
		}

		// Query all teams for this age group
		const { data: teams, error } = await this.supabase
			.from('teams')
			.select('id, name, code')
			.eq('age_group', ageGroup as Database['vbranking']['Enums']['age_group_enum']);

		if (error) {
			throw new Error(`Failed to query teams: ${error.message}`);
		}

		const existingTeams = teams ?? [];

		// Build a lookup map by code (case-insensitive)
		const teamByCode = new Map<string, { id: string; name: string; code: string }>();
		for (const team of existingTeams) {
			teamByCode.set(team.code.toLowerCase(), team);
		}

		for (const code of uniqueCodes) {
			const existing = teamByCode.get(code.toLowerCase());

			if (existing) {
				matched.set(code, existing.id);
			} else {
				// Fuzzy match against all teams in this age group
				const suggestions = existingTeams
					.map((team) => {
						// Compare against both code and name
						const codeScore = similarityScore(code, team.code);
						const nameScore = similarityScore(code, team.name);
						const bestScore = Math.max(codeScore, nameScore);
						return {
							id: team.id,
							name: team.name,
							code: team.code,
							score: Math.round(bestScore * 100) / 100,
						};
					})
					.filter((s) => s.score > 0.3) // Only include somewhat relevant suggestions
					.sort((a, b) => b.score - a.score)
					.slice(0, 3);

				unmatched.push({
					type: 'team',
					parsedValue: code,
					suggestions,
				});
			}
		}

		return { matched, unmatched };
	}

	/**
	 * Resolve tournament names against existing tournaments in the database.
	 *
	 * @param tournamentNames - Array of tournament names extracted from the parsed file
	 * @param seasonId - The season ID to filter tournaments by
	 * @returns Matched map (name -> tournament_id) and unmatched conflicts with suggestions
	 */
	async resolveTournaments(
		tournamentNames: string[],
		seasonId: string,
	): Promise<{ matched: Map<string, string>; unmatched: IdentityConflict[] }> {
		const matched = new Map<string, string>();
		const unmatched: IdentityConflict[] = [];

		// Deduplicate the tournament names
		const uniqueNames = [...new Set(tournamentNames)];

		if (uniqueNames.length === 0) {
			return { matched, unmatched };
		}

		// Query all tournaments for this season
		const { data: tournaments, error } = await this.supabase
			.from('tournaments')
			.select('id, name')
			.eq('season_id', seasonId);

		if (error) {
			throw new Error(`Failed to query tournaments: ${error.message}`);
		}

		const existingTournaments = tournaments ?? [];

		// Build a lookup map by name (case-insensitive)
		const tournamentByName = new Map<string, { id: string; name: string }>();
		for (const tournament of existingTournaments) {
			tournamentByName.set(tournament.name.toLowerCase(), tournament);
		}

		for (const name of uniqueNames) {
			const existing = tournamentByName.get(name.toLowerCase());

			if (existing) {
				matched.set(name, existing.id);
			} else {
				// Fuzzy match against all tournaments in this season
				const suggestions = existingTournaments
					.map((tournament) => ({
						id: tournament.id,
						name: tournament.name,
						score: Math.round(similarityScore(name, tournament.name) * 100) / 100,
					}))
					.filter((s) => s.score > 0.3)
					.sort((a, b) => b.score - a.score)
					.slice(0, 3);

				unmatched.push({
					type: 'tournament',
					parsedValue: name,
					suggestions,
				});
			}
		}

		return { matched, unmatched };
	}
}
