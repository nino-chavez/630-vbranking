import XLSX from 'xlsx';
import type { FileParserInterface, ParsedFinishesRow, ParseError, ParseResult } from '../types.js';

/**
 * Detected tournament column triplet.
 * Each triplet has a start column index and the tournament name from Row 1.
 */
interface TournamentTriplet {
	/** Column index of the "Div" cell in Row 2 */
	startCol: number;
	/** Tournament name extracted from the merged cell in Row 1 */
	tournamentName: string;
}

/**
 * Adaptive parser for the "Finishes" Excel spreadsheet format.
 *
 * Layout:
 * - Row 1: Tournament names in merged cells spanning 3 columns each.
 * - Row 2: Sub-headers with Div/Fin/Tot triplet patterns identifying valid tournament columns.
 * - Rows 3+: Team data rows.
 * - Columns 0-9: Team-level data (only col 0 = Team Name, col 1 = Code are extracted).
 * - Columns 10+: Tournament triplets (Div/Fin/Tot), possibly with padding columns.
 * - Last 5 columns: Summary columns (ignored).
 */
export class FinishesParser implements FileParserInterface<ParsedFinishesRow> {
	parse(buffer: ArrayBuffer): ParseResult<ParsedFinishesRow> {
		const workbook = XLSX.read(buffer, { type: 'array' });
		const sheetName = workbook.SheetNames[0];
		const sheet = workbook.Sheets[sheetName];

		if (!sheet || !sheet['!ref']) {
			return this.emptyResult();
		}

		const range = XLSX.utils.decode_range(sheet['!ref']);
		const merges = sheet['!merges'] || [];

		// Step 1: Build a map of column index -> tournament name from Row 1 merged cells
		const row1Names = this.scanRow1(sheet, range, merges);

		// Step 2: Detect Div/Fin/Tot triplets in Row 2
		const triplets = this.scanRow2(sheet, range, row1Names);

		// Step 3: Parse data rows (Row 3+, i.e., row index 2+)
		const rows: ParsedFinishesRow[] = [];
		const errors: ParseError[] = [];

		// Determine the effective last data column (exclude trailing 5 summary columns)
		const lastDataCol = range.e.c - 5;

		for (let r = 2; r <= range.e.r; r++) {
			const teamNameCell = sheet[XLSX.utils.encode_cell({ r, c: 0 })];
			const teamCodeCell = sheet[XLSX.utils.encode_cell({ r, c: 1 })];

			const teamName = this.cellToString(teamNameCell);
			const teamCode = this.cellToString(teamCodeCell);

			// Skip completely empty rows
			if (!teamName && !teamCode) {
				continue;
			}

			if (!teamName) {
				errors.push({
					row: r + 1, // 1-based for user display
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

			for (const triplet of triplets) {
				// Skip triplets beyond the data area
				if (triplet.startCol > lastDataCol) continue;

				const divCol = triplet.startCol;
				const finCol = triplet.startCol + 1;
				const totCol = triplet.startCol + 2;

				const divCell = sheet[XLSX.utils.encode_cell({ r, c: divCol })];
				const finCell = sheet[XLSX.utils.encode_cell({ r, c: finCol })];
				const totCell = sheet[XLSX.utils.encode_cell({ r, c: totCol })];

				const finValue = this.cellToString(finCell);
				const totValue = this.cellToString(totCell);

				// Skip if both Fin and Tot are empty (team didn't attend)
				if (!finValue && !totValue) {
					continue;
				}

				const division = this.cellToString(divCell);
				const finishPosition = this.parseInteger(finValue);
				const fieldSize = this.parseInteger(totValue);

				if (finishPosition === null) {
					errors.push({
						row: r + 1,
						column: XLSX.utils.encode_col(finCol),
						message: `Non-integer value in Fin column: "${finValue}"`,
						severity: 'error',
					});
					continue;
				}

				if (fieldSize === null) {
					errors.push({
						row: r + 1,
						column: XLSX.utils.encode_col(totCol),
						message: `Non-integer value in Tot column: "${totValue}"`,
						severity: 'error',
					});
					continue;
				}

				rows.push({
					teamName,
					teamCode,
					tournamentName: triplet.tournamentName,
					division,
					finishPosition,
					fieldSize,
				});
			}
		}

		return {
			rows,
			errors,
			identityConflicts: [],
			metadata: {
				format: 'finishes',
				totalRowsParsed: rows.length,
				totalColumnsDetected: range.e.c + 1,
				tournamentsDetected: triplets.map((t) => t.tournamentName),
			},
		};
	}

	/**
	 * Scan Row 1 to build a map of column index -> tournament name.
	 * For merged cells, the name is read from the leftmost cell in the merge range
	 * and applied to all columns in that range.
	 */
	private scanRow1(
		sheet: XLSX.WorkSheet,
		range: XLSX.Range,
		merges: XLSX.Range[],
	): Map<number, string> {
		const nameMap = new Map<number, string>();

		// First, process merged cells in row 0
		for (const merge of merges) {
			if (merge.s.r === 0 && merge.e.r === 0) {
				const leftmostCell = sheet[XLSX.utils.encode_cell({ r: 0, c: merge.s.c })];
				const name = this.cellToString(leftmostCell);
				if (name) {
					for (let c = merge.s.c; c <= merge.e.c; c++) {
						nameMap.set(c, name);
					}
				}
			}
		}

		// Then, process non-merged cells in row 0
		for (let c = 0; c <= range.e.c; c++) {
			if (!nameMap.has(c)) {
				const cell = sheet[XLSX.utils.encode_cell({ r: 0, c })];
				const name = this.cellToString(cell);
				if (name) {
					nameMap.set(c, name);
				}
			}
		}

		return nameMap;
	}

	/**
	 * Scan Row 2 to detect Div/Fin/Tot triplet patterns.
	 * A valid triplet is three consecutive cells matching (case-insensitive) Div, Fin, Tot.
	 * Returns only triplets that also have a tournament name in Row 1.
	 */
	private scanRow2(
		sheet: XLSX.WorkSheet,
		range: XLSX.Range,
		row1Names: Map<number, string>,
	): TournamentTriplet[] {
		const triplets: TournamentTriplet[] = [];

		let c = 10; // Tournament triplets start at column 10+
		const lastCol = range.e.c - 5; // Exclude trailing 5 summary columns

		while (c <= lastCol - 2) {
			const cell0 = this.cellToString(sheet[XLSX.utils.encode_cell({ r: 1, c })]);
			const cell1 = this.cellToString(sheet[XLSX.utils.encode_cell({ r: 1, c: c + 1 })]);
			const cell2 = this.cellToString(sheet[XLSX.utils.encode_cell({ r: 1, c: c + 2 })]);

			if (
				cell0.toLowerCase() === 'div' &&
				cell1.toLowerCase() === 'fin' &&
				cell2.toLowerCase() === 'tot'
			) {
				// Found a valid triplet -- look up the tournament name from Row 1
				const tournamentName = row1Names.get(c) || `Unknown Tournament (col ${c})`;
				triplets.push({ startCol: c, tournamentName });
				// Advance past the triplet (3 columns)
				c += 3;
			} else {
				// Not a valid triplet, skip this column (padding or header-only)
				c++;
			}
		}

		return triplets;
	}

	/** Read cell value as a trimmed string, or empty string if null/undefined */
	private cellToString(cell: XLSX.CellObject | undefined): string {
		if (!cell || cell.v === undefined || cell.v === null) return '';
		return String(cell.v).trim();
	}

	/** Parse a string as an integer, returning null if not a valid integer */
	private parseInteger(value: string): number | null {
		if (!value) return null;
		const num = Number(value);
		if (!Number.isInteger(num)) return null;
		return num;
	}

	/** Return an empty ParseResult */
	private emptyResult(): ParseResult<ParsedFinishesRow> {
		return {
			rows: [],
			errors: [],
			identityConflicts: [],
			metadata: {
				format: 'finishes',
				totalRowsParsed: 0,
				totalColumnsDetected: 0,
				tournamentsDetected: [],
			},
		};
	}
}
