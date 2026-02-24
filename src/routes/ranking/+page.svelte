<script lang="ts">
  import RankingResultsTable from '$lib/components/RankingResultsTable.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import Card from '$lib/components/Card.svelte';
  import Select from '$lib/components/Select.svelte';
  import Button from '$lib/components/Button.svelte';
  import Banner from '$lib/components/Banner.svelte';
  import FreshnessIndicator from '$lib/components/FreshnessIndicator.svelte';
  import { AgeGroup } from '$lib/schemas/enums.js';
  import type { NormalizedTeamResult } from '$lib/ranking/types.js';

  /** Server data: list of seasons */
  let { data } = $props<{
    data: {
      seasons: Array<{ id: string; name: string }>;
    };
  }>();

  // --- State Machine ---
  type Step = 'idle' | 'running' | 'results' | 'error';
  let step = $state<Step>('idle');

  // --- Context Selectors ---
  let selectedSeasonId = $state('');
  let selectedAgeGroup = $state('');

  // --- Results State ---
  let rankingResults = $state<NormalizedTeamResult[]>([]);
  let teamNames = $state<Map<string, string>>(new Map());
  let seedingFactors = $state<Record<string, {
    win_pct: number;
    best_national_finish: number | null;
    best_national_tournament_name: string | null;
  }>>({});
  let runSummary = $state<{
    ranking_run_id: string;
    teams_ranked: number;
    ran_at: string;
  } | null>(null);
  let errorMessage = $state('');

  // --- Available Options ---
  const ageGroupOptions = AgeGroup.options;

  const seasonSelectOptions = $derived(
    data.seasons.map((s) => ({ value: s.id, label: s.name })),
  );

  const ageGroupSelectOptions = ageGroupOptions.map((ag) => ({
    value: ag,
    label: ag,
  }));

  // --- Derived State ---
  let contextReady = $derived(
    selectedSeasonId !== '' && selectedAgeGroup !== '',
  );

  // --- Actions ---
  async function handleRunRankings() {
    step = 'running';
    errorMessage = '';

    try {
      const response = await fetch('/api/ranking/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          season_id: selectedSeasonId,
          age_group: selectedAgeGroup,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        errorMessage = result.error || 'Ranking run failed. Please try again.';
        step = 'error';
        return;
      }

      runSummary = result.data;

      // Extract seeding factors from the run response
      if (result.data.seeding_factors) {
        seedingFactors = result.data.seeding_factors;
      }

      // Fetch full results using the ranking_run_id
      const resultsResponse = await fetch(
        `/api/ranking/results?ranking_run_id=${result.data.ranking_run_id}`,
      );

      if (resultsResponse.ok) {
        const resultsData = await resultsResponse.json();
        if (resultsData.success) {
          rankingResults = resultsData.data.results;
          teamNames = new Map(
            Object.entries(resultsData.data.teams) as [string, string][],
          );
        }
      }

      step = 'results';
    } catch (err) {
      errorMessage =
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred.';
      step = 'error';
    }
  }

  function handleReset() {
    step = 'idle';
    rankingResults = [];
    teamNames = new Map();
    seedingFactors = {};
    runSummary = null;
    errorMessage = '';
  }
</script>

<PageHeader
  title="Rankings"
  subtitle="Run ranking algorithms to compute team ratings and aggregate rankings."
/>

<div class="space-y-6">
  {#if step === 'error'}
    <Banner variant="error" title="Ranking Error">
      <p class="whitespace-pre-wrap">{errorMessage}</p>
      <div class="mt-4">
        <Button variant="danger" onclick={handleReset}>Try Again</Button>
      </div>
    </Banner>
  {/if}

  {#if step === 'results'}
    {#if runSummary}
      <Banner variant="success">
        <div class="flex items-center gap-3">
          <span>Ranked {runSummary.teams_ranked} teams</span>
          <FreshnessIndicator timestamp={runSummary.ran_at} />
        </div>
      </Banner>
    {/if}

    <RankingResultsTable results={rankingResults} teams={teamNames} {seedingFactors} />

    <div class="flex justify-end">
      <Button variant="primary" onclick={handleReset}>Run Again</Button>
    </div>
  {/if}

  {#if step === 'idle' || step === 'running'}
    <Card>
      {#snippet header()}
        <h2 class="text-lg font-semibold text-text-primary">Ranking Settings</h2>
      {/snippet}
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Season"
          id="ranking-season-select"
          options={seasonSelectOptions}
          bind:value={selectedSeasonId}
          placeholder="Select a season..."
          disabled={step === 'running'}
        />
        <Select
          label="Age Group"
          id="ranking-age-group-select"
          options={ageGroupSelectOptions}
          bind:value={selectedAgeGroup}
          placeholder="Select age group..."
          disabled={step === 'running'}
        />
      </div>

      <div class="mt-6">
        <Button
          variant="primary"
          disabled={!contextReady || step === 'running'}
          loading={step === 'running'}
          onclick={handleRunRankings}
        >
          {step === 'running' ? 'Running...' : 'Run Rankings'}
        </Button>
      </div>
    </Card>

    {#if !contextReady && step === 'idle'}
      <p class="text-center text-sm text-warning">
        Please select a season and age group before running rankings.
      </p>
    {/if}
  {/if}
</div>
