/**
 * Types for ranking export/reporting.
 */

/** A flat row for export output -- one per ranked team. */
export interface ExportRow {
	final_rank: number;
	team_name: string;
	region: string;
	agg_rating: number;
	agg_rank: number;
	win_pct: number | null;
	best_national_finish: number | null;

	// Algorithm breakdowns (optional)
	algo1_rating?: number;
	algo1_rank?: number;
	algo2_rating?: number;
	algo2_rank?: number;
	algo3_rating?: number;
	algo3_rank?: number;
	algo4_rating?: number;
	algo4_rank?: number;
	algo5_rating?: number;
	algo5_rank?: number;

	// Override fields (populated when team has an override)
	override_original_rank?: number;
	override_justification?: string;
	override_committee_member?: string;
}

/** Metadata about the export/ranking run. */
export interface ExportMetadata {
	season_name: string;
	age_group: string;
	ran_at: string;
	teams_ranked: number;
	run_status: 'draft' | 'finalized';
	exported_at: string;
}

/** Options controlling export content. */
export interface ExportOptions {
	includeAlgorithmBreakdowns: boolean;
}
