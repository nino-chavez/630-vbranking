<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Card from '$lib/components/Card.svelte';

	let openSections = new SvelteSet<string>(['quick-start']);

	function toggle(id: string) {
		if (openSections.has(id)) {
			openSections.delete(id);
		} else {
			openSections.add(id);
		}
	}

	const sections = [
		{ id: 'quick-start', title: 'Quick Start' },
		{ id: 'importing-data', title: 'Importing Data' },
		{ id: 'tournament-weights', title: 'Tournament Weights' },
		{ id: 'running-rankings', title: 'Running Rankings' },
		{ id: 'how-rankings-work', title: 'How Rankings Work' },
		{ id: 'overrides-finalization', title: 'Overrides & Finalization' },
		{ id: 'exporting-results', title: 'Exporting Results' },
	] as const;
</script>

<div class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
	<PageHeader title="Help" subtitle="Learn how the Volleyball Ranking Engine works." />

	<div class="space-y-4">
		{#each sections as section (section.id)}
			{@const isOpen = openSections.has(section.id)}
			<Card padding="none">
				<button
					type="button"
					class="flex w-full items-center justify-between px-6 py-5 text-left cursor-pointer"
					onclick={() => toggle(section.id)}
					aria-expanded={isOpen}
					aria-controls="section-{section.id}"
				>
					<span class="text-lg font-semibold text-text-primary">{section.title}</span>
					<svg
						class="h-5 w-5 shrink-0 text-text-muted transition-transform duration-200 {isOpen ? 'rotate-180' : ''}"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						aria-hidden="true"
					>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
					</svg>
				</button>

				{#if isOpen}
					<div id="section-{section.id}" class="border-t border-border px-6 py-5">
						{#if section.id === 'quick-start'}
							<div class="help-content">
								<p class="mb-4 text-text-secondary">The complete workflow from import to export in eight steps.</p>
								<ol class="list-decimal space-y-3 pl-5 text-text-primary">
									<li><strong>Navigate to the app</strong> &mdash; Open the application URL. You'll see the "Volleyball Rankings" nav bar with links to Import, Rankings, and Weights.</li>
									<li><strong>Import tournament data</strong> &mdash; Go to <strong>Import</strong>, select a season and age group, then upload your <code>.xlsx</code> finishes spreadsheet. Review the parsed preview and resolve any team-name mismatches.</li>
									<li><strong>Set tournament weights</strong> <em>(optional)</em> &mdash; Go to <strong>Weights</strong>, select the season, and assign tiers (Tier 1 = 3.0x for nationals down to Tier 5 = 1.0x for locals). Save when done.</li>
									<li><strong>Run the ranking computation</strong> &mdash; Go to <strong>Rankings</strong>, select the same season and age group, then click <strong>Run Rankings</strong>. The system runs five algorithms and produces an aggregate rating for each team.</li>
									<li><strong>Review results</strong> &mdash; Browse the results table, search by team name, filter by region, or click a team to see their full algorithm breakdown and tournament history.</li>
									<li><strong>Apply overrides</strong> <em>(optional)</em> &mdash; Click <strong>Adjust</strong> on any team to set a committee override with a final seed, justification, and committee member name.</li>
									<li><strong>Finalize the run</strong> &mdash; When all overrides are confirmed, click <strong>Finalize Run</strong> to lock the ranking. This cannot be undone.</li>
									<li><strong>Export results</strong> &mdash; Click <strong>Export</strong> and choose CSV, Excel, or PDF. Optionally include individual algorithm breakdowns.</li>
								</ol>
							</div>

						{:else if section.id === 'importing-data'}
							<div class="help-content">
								<h3>Supported Formats</h3>
								<p>The system accepts <code>.xlsx</code> files in two formats:</p>
								<ul>
									<li><strong>Finishes</strong> (default) &mdash; Tournament placement data. Columns A-B hold team name and code; columns K onward hold tournament triplets of Division, Finish position, and Field size.</li>
									<li><strong>Colley</strong> &mdash; Pre-computed ranking data with team name, code, wins, losses, and optional algorithm rating/rank columns.</li>
								</ul>

								<h3>Identity Resolution</h3>
								<p>When the parser finds a team or tournament name that doesn't match an existing record, the Identity Resolution panel appears. For each mismatch you can:</p>
								<ul>
									<li><strong>Map to existing</strong> &mdash; Link to a suggested match (handles spelling variations, abbreviations, etc.)</li>
									<li><strong>Create new</strong> &mdash; Add a new team or tournament record</li>
									<li><strong>Skip</strong> &mdash; Ignore rows referencing the unrecognized name</li>
								</ul>

								<h3>Import Modes</h3>
								<ul>
									<li><strong>Merge/Update</strong> (recommended) &mdash; Inserts new records, updates changed records, skips identical ones. Use for incremental updates.</li>
									<li><strong>Replace All</strong> &mdash; Deletes all existing data for the selected season and age group, then inserts everything from the file. Use for a fresh start.</li>
								</ul>
							</div>

						{:else if section.id === 'tournament-weights'}
							<div class="help-content">
								<p>Tournament weights are multipliers that scale how much each tournament influences ranking algorithms. Set weights before your first ranking run.</p>

								<h3>Tier System</h3>
								<div class="overflow-x-auto">
									<table>
										<thead>
											<tr>
												<th>Tier</th>
												<th>Weight</th>
												<th>Typical Use</th>
											</tr>
										</thead>
										<tbody>
											<tr><td>Tier 1</td><td>3.0x</td><td>National Championship</td></tr>
											<tr><td>Tier 2</td><td>2.5x</td><td>Major National Tournament</td></tr>
											<tr><td>Tier 3</td><td>2.0x</td><td>Regional Championship</td></tr>
											<tr><td>Tier 4</td><td>1.5x</td><td>Regional Qualifier</td></tr>
											<tr><td>Tier 5</td><td>1.0x</td><td>Local Tournament</td></tr>
										</tbody>
									</table>
								</div>

								<h3>How Weights Affect Algorithms</h3>
								<ul>
									<li><strong>Colley Matrix</strong> &mdash; Weighted games count as multiple games. A 3.0x tournament shifts ratings three times as much as a 1.0x tournament.</li>
									<li><strong>Elo Ratings</strong> &mdash; The K-factor is multiplied by the weight. At 3.0x, rating changes per game are three times larger.</li>
								</ul>
								<p>After changing weights, you must <strong>re-run the ranking computation</strong> for changes to take effect.</p>

								<h3>Best Practices</h3>
								<ul>
									<li>Set weights before your first ranking run</li>
									<li>Use tiers for consistency; reserve custom values for special cases</li>
									<li>Discuss weight assignments with the committee and document the policy</li>
									<li>Be conservative &mdash; the 1.0 to 3.0 tier range is well-balanced</li>
									<li>Check newly imported tournaments, as they default to Tier 5</li>
								</ul>
							</div>

						{:else if section.id === 'running-rankings'}
							<div class="help-content">
								<h3>What Happens When You Click "Run Rankings"</h3>
								<ol class="list-decimal space-y-2 pl-5">
									<li>Fetches all teams for the selected age group</li>
									<li>Fetches all tournament results for the selected season</li>
									<li>Loads tournament weights</li>
									<li>Derives win/loss records from tournament finishes</li>
									<li>Runs Colley Matrix (Algorithm 1)</li>
									<li>Runs four Elo variants (Algorithms 2&ndash;5) with starting ratings 2200, 2400, 2500, 2700</li>
									<li>Normalizes all five rating sets to a 0&ndash;100 scale</li>
									<li>Computes aggregate rating (average of five normalized scores) and assigns ranks</li>
								</ol>

								<h3>Results Table Columns</h3>
								<div class="overflow-x-auto">
									<table>
										<thead>
											<tr>
												<th>Column</th>
												<th>Description</th>
											</tr>
										</thead>
										<tbody>
											<tr><td>Rank</td><td>Aggregate rank position (1 = best)</td></tr>
											<tr><td>Team Name</td><td>Clickable link to team detail page</td></tr>
											<tr><td>Colley Rating / Rank</td><td>Colley Matrix algorithm score and rank</td></tr>
											<tr><td>Elo-2200 through Elo-2700</td><td>Four Elo variant scores and ranks</td></tr>
											<tr><td>AggRating</td><td>Average of all five normalized scores (0&ndash;100)</td></tr>
										</tbody>
									</table>
								</div>
								<p>Use the <strong>Search</strong> box to filter by team name and the <strong>Region</strong> dropdown to filter by geography. Click any column header to sort.</p>
							</div>

						{:else if section.id === 'how-rankings-work'}
							<div class="help-content">
								<h3>Ensemble Approach</h3>
								<p>Rather than relying on one formula, the system runs <strong>five independent algorithms</strong> and averages their results. This cancels out individual biases and produces more balanced, defensible rankings.</p>

								<h3>The Five Algorithms</h3>
								<div class="overflow-x-auto">
									<table>
										<thead>
											<tr>
												<th>Algorithm</th>
												<th>Type</th>
												<th>How It Works</th>
											</tr>
										</thead>
										<tbody>
											<tr>
												<td>Colley Matrix</td>
												<td>Simultaneous</td>
												<td>Analyzes all games at once and solves for ratings that best explain observed win/loss records. Time-independent and self-correcting.</td>
											</tr>
											<tr>
												<td>Elo-2200</td>
												<td>Sequential</td>
												<td rowspan="4">Processes games chronologically, updating ratings after each game. Upsets cause larger rating swings. Four variants use different starting ratings (2200&ndash;2700) to capture a range of sensitivities.</td>
											</tr>
											<tr><td>Elo-2400</td><td>Sequential</td></tr>
											<tr><td>Elo-2500</td><td>Sequential</td></tr>
											<tr><td>Elo-2700</td><td>Sequential</td></tr>
										</tbody>
									</table>
								</div>

								<h3>Normalization</h3>
								<p>Each algorithm produces ratings on a different scale (Colley: ~0.3&ndash;0.7, Elo: ~1800&ndash;3100). To combine them, each set is normalized to 0&ndash;100 using min-max scaling:</p>
								<code class="block rounded bg-surface-alt px-4 py-2 text-sm">score = (rating - min) / (max - min) &times; 100</code>

								<h3>Aggregation</h3>
								<p>The <strong>AggRating</strong> is the arithmetic mean of the five normalized scores. Teams are ranked by AggRating (highest first), with alphabetical tie-breaking.</p>

								<h3>Why Ensemble?</h3>
								<ul>
									<li>Colley alone ignores game timing; Elo alone is sensitive to game order</li>
									<li>Multiple Elo starting ratings smooth out parameter sensitivity</li>
									<li>When all five algorithms agree, confidence is high; disagreement flags teams for committee review</li>
								</ul>
							</div>

						{:else if section.id === 'overrides-finalization'}
							<div class="help-content">
								<h3>Committee Overrides</h3>
								<p>Overrides let the committee adjust a team's final rank when the algorithms don't fully reflect their assessment. Use them sparingly &mdash; every override creates an audit trail.</p>

								<h3>Override Fields</h3>
								<ul>
									<li><strong>Final Seed</strong> &mdash; The desired rank position</li>
									<li><strong>Justification</strong> &mdash; Why this override is needed (minimum 10 characters). Be specific &mdash; this is part of the permanent record.</li>
									<li><strong>Committee Member</strong> &mdash; Who is making the decision (minimum 2 characters)</li>
								</ul>

								<h3>When to Override</h3>
								<ul>
									<li>Strong late-season tournament performance not fully reflected in algorithms</li>
									<li>Scheduling or travel issues caused missed tournaments</li>
									<li>Head-to-head results favor a different ordering among closely ranked teams</li>
									<li>Committee has context (roster changes, etc.) the algorithms can't capture</li>
								</ul>

								<h3>Finalization</h3>
								<p>Clicking <strong>Finalize Run</strong> permanently locks the ranking run:</p>
								<ul>
									<li>All overrides become read-only</li>
									<li>No new overrides can be added</li>
									<li>The run is marked "(Finalized)" in the Previous Runs dropdown</li>
									<li>This <strong>cannot be undone</strong> &mdash; to make changes, you must run a new computation</li>
								</ul>
								<p>Always review all overrides carefully and export a report before finalizing.</p>
							</div>

						{:else if section.id === 'exporting-results'}
							<div class="help-content">
								<h3>Export Formats</h3>
								<p>Click <strong>Export</strong> at the bottom of the results table and choose a format. Optionally check "Include algorithm breakdowns" for detailed per-algorithm scores.</p>

								<div class="overflow-x-auto">
									<table>
										<thead>
											<tr>
												<th>Format</th>
												<th>Best For</th>
												<th>Details</th>
											</tr>
										</thead>
										<tbody>
											<tr>
												<td>CSV</td>
												<td>Data analysis, database import</td>
												<td>UTF-8, comma-delimited, includes metadata header and override summary</td>
											</tr>
											<tr>
												<td>Excel (.xlsx)</td>
												<td>Committee review, spreadsheets</td>
												<td>Formatted workbook with Rankings sheet and (if overrides exist) Overrides sheet</td>
											</tr>
											<tr>
												<td>PDF</td>
												<td>Official distribution, printing</td>
												<td>Formatted report with page numbers, alternating rows, and override summary table</td>
											</tr>
										</tbody>
									</table>
								</div>

								<h3>Choosing a Format</h3>
								<ul>
									<li><strong>Sharing with committee</strong> &mdash; Excel</li>
									<li><strong>Official publication or printing</strong> &mdash; PDF</li>
									<li><strong>Importing into another system</strong> &mdash; CSV</li>
									<li><strong>Archival</strong> &mdash; Both PDF and CSV</li>
								</ul>
								<p>All formats include: Final Rank, Team, Region, Agg Rating, Agg Rank, Win %, and Best National Finish. Override details are included when overrides are active.</p>
							</div>
						{/if}
					</div>
				{/if}
			</Card>
		{/each}
	</div>
</div>

<style>
	.help-content h3 {
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-text-primary);
		margin-top: 1.25rem;
		margin-bottom: 0.5rem;
	}
	.help-content h3:first-child {
		margin-top: 0;
	}
	.help-content p {
		color: var(--color-text-secondary);
		margin-bottom: 0.75rem;
		line-height: 1.625;
	}
	.help-content ul,
	.help-content ol {
		color: var(--color-text-primary);
		margin-bottom: 0.75rem;
	}
	.help-content ul {
		list-style-type: disc;
		padding-left: 1.25rem;
	}
	.help-content li {
		margin-bottom: 0.375rem;
		line-height: 1.625;
	}
	.help-content code {
		font-size: 0.875rem;
		background-color: var(--color-surface-alt);
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
	}
	.help-content table {
		width: 100%;
		border-collapse: collapse;
		margin-bottom: 0.75rem;
		font-size: 0.875rem;
	}
	.help-content th {
		text-align: left;
		padding: 0.5rem 0.75rem;
		background-color: var(--color-surface-alt);
		color: var(--color-text-primary);
		font-weight: 600;
		border-bottom: 1px solid var(--color-border);
	}
	.help-content td {
		padding: 0.5rem 0.75rem;
		color: var(--color-text-secondary);
		border-bottom: 1px solid var(--color-border);
	}
	.help-content strong {
		color: var(--color-text-primary);
	}
	.help-content em {
		color: var(--color-text-muted);
	}
</style>
