/**
 * Script to generate test fixture .xlsx files for the data ingestion pipeline.
 *
 * Run with: npx tsx src/lib/import/__fixtures__/create-fixtures.ts
 *
 * The fixtures are also created programmatically in the test files themselves,
 * so this script is provided as a convenience for manual inspection.
 */
import XLSX from 'xlsx';
import { writeFileSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function createFinishesFixture(): void {
	const row1: (string | null)[] = [];
	const row2: (string | null)[] = [];

	// Columns 0-9: Team-level headers
	row1[0] = 'Team Name';
	row1[1] = 'Code';
	for (let i = 2; i <= 9; i++) row1[i] = null;
	row2[0] = null;
	row2[1] = null;
	for (let i = 2; i <= 9; i++) row2[i] = null;

	// Columns 10-12: "AZ Region #1" with Div/Fin/Tot
	row1[10] = 'AZ Region #1';
	row1[11] = null;
	row1[12] = null;
	row2[10] = 'Div';
	row2[11] = 'Fin';
	row2[12] = 'Tot';

	// Columns 13-15: empty padding
	for (let i = 13; i <= 15; i++) {
		row1[i] = null;
		row2[i] = null;
	}

	// Columns 16-18: "CA Invitational" with Div/Fin/Tot
	row1[16] = 'CA Invitational';
	row1[17] = null;
	row1[18] = null;
	row2[16] = 'Div';
	row2[17] = 'Fin';
	row2[18] = 'Tot';

	// Columns 19-21: "Fake Event" -- header only, no sub-headers
	row1[19] = 'Fake Event';
	row1[20] = null;
	row1[21] = null;
	row2[19] = null;
	row2[20] = null;
	row2[21] = null;

	// Columns 22-26: trailing summary columns
	row1[22] = '# of Qual';
	row1[23] = 'Avg Finish';
	row1[24] = 'Last Result';
	row1[25] = 'Wins vs Field';
	row1[26] = 'Losses vs Field';
	for (let i = 22; i <= 26; i++) row2[i] = null;

	const dataRows: (string | number | null)[][] = [
		[
			'Alpha',
			'ALP',
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			'18O',
			3,
			24,
			null,
			null,
			null,
			'18O',
			5,
			16,
			null,
			null,
			null,
			2,
			4.0,
			3,
			10,
			5,
		],
		[
			'Bravo',
			'BRV',
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			'18O',
			1,
			24,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			1,
			1.0,
			1,
			20,
			3,
		],
		[
			'Charlie',
			'CHL',
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			'18O',
			2,
			16,
			null,
			null,
			null,
			1,
			2.0,
			2,
			8,
			6,
		],
		[
			'Delta',
			'DLT',
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			'18O',
			10,
			24,
			null,
			null,
			null,
			'18O',
			8,
			16,
			null,
			null,
			null,
			2,
			9.0,
			8,
			5,
			10,
		],
		[
			'Echo',
			'ECH',
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			'18O',
			5,
			24,
			null,
			null,
			null,
			'18O',
			1,
			16,
			null,
			null,
			null,
			2,
			3.0,
			1,
			15,
			3,
		],
	];

	const aoa = [row1, row2, ...dataRows];
	const ws = XLSX.utils.aoa_to_sheet(aoa);

	ws['!merges'] = [
		{ s: { r: 0, c: 10 }, e: { r: 0, c: 12 } },
		{ s: { r: 0, c: 16 }, e: { r: 0, c: 18 } },
		{ s: { r: 0, c: 19 }, e: { r: 0, c: 21 } },
	];

	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, 'Finishes');

	const xlsxData = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
	writeFileSync(`${__dirname}/finishes-test-fixture.xlsx`, xlsxData);
	console.log('Created finishes-test-fixture.xlsx');
}

function createColleyFixture(): void {
	const header = [
		'Team',
		'teamcode',
		'Wins',
		'Losses',
		'Algo1Rating',
		'Algo1Rank',
		'Algo2Rating',
		'Algo2Rank',
		'Algo3Rating',
		'Algo3Rank',
		'Algo4Rating',
		'Algo4Rank',
		'Algo5Rating',
		'Algo5Rank',
		'AggRating',
		'AggRank',
	];

	const data: (string | number)[][] = [
		['Alpha', 'ALP', 20, 5, 0.85, 1, 0.82, 2, 0.9, 1, 0.88, 1, 0.79, 3, 0.848, 1],
		['Bravo', 'BRV', 18, 7, 0.78, 2, 0.84, 1, 0.75, 3, 0.8, 2, 0.82, 1, 0.798, 2],
		['Charlie', 'CHL', 15, 10, 0.65, 3, 0.7, 3, 0.68, 4, 0.72, 3, 0.71, 4, 0.692, 3],
		['Delta', 'DLT', 12, 13, 0.55, 4, 0.58, 4, 0.8, 2, 0.6, 4, 0.62, 5, 0.63, 4],
		['Echo', 'ECH', 8, 17, 0.4, 5, 0.42, 5, 0.45, 5, 0.38, 5, 0.8, 2, 0.49, 5],
	];

	const aoa = [header, ...data];
	const ws = XLSX.utils.aoa_to_sheet(aoa);
	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, 'Colley');

	const xlsxData = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
	writeFileSync(`${__dirname}/colley-test-fixture.xlsx`, xlsxData);
	console.log('Created colley-test-fixture.xlsx');
}

createFinishesFixture();
createColleyFixture();
