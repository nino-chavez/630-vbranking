import XLSX from 'xlsx';
import type { FileParserInterface, ParsedColleyRow, ParseError, ParseResult } from '../types.js';

/**
 * Parser for the Colley Excel spreadsheet format.
 *
 * Fixed column mapping (0-indexed):
 *   0=Team, 1=teamcode, 2=Wins, 3=Losses,
 *   4=Algo1Rating, 5=Algo1Rank, 6=Algo2Rating, 7=Algo2Rank,
 *   8=Algo3Rating, 9=Algo3Rank, 10=Algo4Rating, 11=Algo4Rank,
 *   12=Algo5Rating, 13=Algo5Rank, 14=AggRating, 15=AggRank.
 *
 * Row 1 is the header row and is skipped.
 * Rows 2+ are data rows.
 */
export class ColleyParser implements FileParserInterface<ParsedColleyRow> {
	parse(buffer: ArrayBuffer): ParseResult<ParsedColleyRow> {
		const workbook = XLSX.read(buffer, { type: 'array' });
		const sheetName = workbook.SheetNames[0];
		const sheet = workbook.Sheets[sheetName];

		if (!sheet || !sheet['!ref']) {
			return this.emptyResult();
		}

		const range = XLSX.utils.decode_range(sheet['!ref']);
		const rows: ParsedColleyRow[] = [];
		const errors: ParseError[] = [];

		// Skip header row (row index 0). Parse row index 1+ as data.
		for (let r = 1; r <= range.e.r; r++) {
			const teamName = this.cellToString(sheet[XLSX.utils.encode_cell({ r, c: 0 })]);
			const teamCode = this.cellToString(sheet[XLSX.utils.encode_cell({ r, c: 1 })]);

			// Skip completely empty rows
			if (!teamName && !teamCode) {
				continue;
			}

			if (!teamName) {
				errors.push({
					row: r + 1,
					column: 'A',
					message: 'Missing team name',
					severity: 'error',
				});
				continue;
			}

			if (!teamCode) {
				errors.push({
					row: r + 1,
					column: 'B',
					message: 'Missing team code',
					severity: 'error',
				});
				continue;
			}

			const wins = this.parseRequiredNumber(sheet, r, 2, 'Wins', errors);
			const losses = this.parseRequiredNumber(sheet, r, 3, 'Losses', errors);

			if (wins === null || losses === null) {
				continue;
			}

			const algo1Rating = this.parseOptionalNumber(sheet, r, 4, 'Algo1Rating', errors);
			const algo1Rank = this.parseOptionalInteger(sheet, r, 5, 'Algo1Rank', errors);
			const algo2Rating = this.parseOptionalNumber(sheet, r, 6, 'Algo2Rating', errors);
			const algo2Rank = this.parseOptionalInteger(sheet, r, 7, 'Algo2Rank', errors);
			const algo3Rating = this.parseOptionalNumber(sheet, r, 8, 'Algo3Rating', errors);
			const algo3Rank = this.parseOptionalInteger(sheet, r, 9, 'Algo3Rank', errors);
			const algo4Rating = this.parseOptionalNumber(sheet, r, 10, 'Algo4Rating', errors);
			const algo4Rank = this.parseOptionalInteger(sheet, r, 11, 'Algo4Rank', errors);
			const algo5Rating = this.parseOptionalNumber(sheet, r, 12, 'Algo5Rating', errors);
			const algo5Rank = this.parseOptionalInteger(sheet, r, 13, 'Algo5Rank', errors);
			const aggRating = this.parseOptionalNumber(sheet, r, 14, 'AggRating', errors);
			const aggRank = this.parseOptionalInteger(sheet, r, 15, 'AggRank', errors);

			rows.push({
				teamName,
				teamCode,
				wins,
				losses,
				algo1Rating,
				algo1Rank,
				algo2Rating,
				algo2Rank,
				algo3Rating,
				algo3Rank,
				algo4Rating,
				algo4Rank,
				algo5Rating,
				algo5Rank,
				aggRating,
				aggRank,
			});
		}

		return {
			rows,
			errors,
			identityConflicts: [],
			metadata: {
				format: 'colley',
				totalRowsParsed: rows.length,
				totalColumnsDetected: Math.min(range.e.c + 1, 16),
			},
		};
	}

	/** Read a cell as a trimmed string */
	private cellToString(cell: XLSX.CellObject | undefined): string {
		if (!cell || cell.v === undefined || cell.v === null) return '';
		return String(cell.v).trim();
	}

	/** Parse a required numeric value (must be present and numeric) */
	private parseRequiredNumber(
		sheet: XLSX.WorkSheet,
		r: number,
		c: number,
		columnName: string,
		errors: ParseError[],
	): number | null {
		const cell = sheet[XLSX.utils.encode_cell({ r, c })];
		const value = this.cellToString(cell);

		if (!value) {
			errors.push({
				row: r + 1,
				column: columnName,
				message: `Missing required value for ${columnName}`,
				severity: 'error',
			});
			return null;
		}

		const num = Number(value);
		if (isNaN(num)) {
			errors.push({
				row: r + 1,
				column: columnName,
				message: `Non-numeric value in ${columnName}: "${value}"`,
				severity: 'error',
			});
			return null;
		}

		return num;
	}

	/** Parse an optional number (null if empty, error if non-numeric) */
	private parseOptionalNumber(
		sheet: XLSX.WorkSheet,
		r: number,
		c: number,
		columnName: string,
		errors: ParseError[],
	): number | null {
		const cell = sheet[XLSX.utils.encode_cell({ r, c })];
		const value = this.cellToString(cell);

		if (!value) return null;

		const num = Number(value);
		if (isNaN(num)) {
			errors.push({
				row: r + 1,
				column: columnName,
				message: `Non-numeric value in ${columnName}: "${value}"`,
				severity: 'error',
			});
			return null;
		}

		return num;
	}

	/** Parse an optional integer (null if empty, error if non-numeric/non-integer) */
	private parseOptionalInteger(
		sheet: XLSX.WorkSheet,
		r: number,
		c: number,
		columnName: string,
		errors: ParseError[],
	): number | null {
		const cell = sheet[XLSX.utils.encode_cell({ r, c })];
		const value = this.cellToString(cell);

		if (!value) return null;

		const num = Number(value);
		if (isNaN(num)) {
			errors.push({
				row: r + 1,
				column: columnName,
				message: `Non-numeric value in ${columnName}: "${value}"`,
				severity: 'error',
			});
			return null;
		}

		if (!Number.isInteger(num)) {
			errors.push({
				row: r + 1,
				column: columnName,
				message: `Non-integer value in ${columnName}: "${value}"`,
				severity: 'warning',
			});
		}

		return num;
	}

	/** Return an empty ParseResult */
	private emptyResult(): ParseResult<ParsedColleyRow> {
		return {
			rows: [],
			errors: [],
			identityConflicts: [],
			metadata: {
				format: 'colley',
				totalRowsParsed: 0,
				totalColumnsDetected: 0,
			},
		};
	}
}
