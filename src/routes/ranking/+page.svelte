<script lang="ts">
  import RankingResultsTable from '$lib/components/RankingResultsTable.svelte';
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
  let runSummary = $state<{
    ranking_run_id: string;
    teams_ranked: number;
    ran_at: string;
  } | null>(null);
  let errorMessage = $state('');

  // --- Available Options ---
  const ageGroupOptions = AgeGroup.options;

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

      // If results endpoint isn't available yet, use the summary data
      if (rankingResults.length === 0 && runSummary) {
        // Results will be viewable via the results endpoint when available
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
    runSummary = null;
    errorMessage = '';
  }
</script>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
  <!-- Page Title -->
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900">Rankings</h1>
    <p class="mt-2 text-sm text-gray-600">
      Run ranking algorithms to compute team ratings and aggregate rankings.
    </p>
  </div>

  <div class="space-y-6">
    <!-- Error Banner -->
    {#if step === 'error'}
      <div class="rounded-lg border border-red-300 bg-red-50 p-6">
        <div class="flex items-start gap-3">
          <svg
            class="h-6 w-6 flex-shrink-0 text-red-600"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
              clip-rule="evenodd"
            />
          </svg>
          <div>
            <h3 class="text-lg font-semibold text-red-800">Ranking Error</h3>
            <p class="mt-1 text-sm text-red-700 whitespace-pre-wrap">
              {errorMessage}
            </p>
            <button
              type="button"
              class="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              onclick={handleReset}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    {/if}

    <!-- Results View -->
    {#if step === 'results'}
      {#if runSummary}
        <div class="rounded-lg border border-green-300 bg-green-50 p-4">
          <p class="text-sm font-medium text-green-800">
            Ranked {runSummary.teams_ranked} teams at {new Date(runSummary.ran_at).toLocaleString()}
          </p>
        </div>
      {/if}

      <RankingResultsTable results={rankingResults} teams={teamNames} />

      <div class="flex justify-end">
        <button
          type="button"
          class="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          onclick={handleReset}
        >
          Run Again
        </button>
      </div>
    {/if}

    <!-- Idle & Running States -->
    {#if step === 'idle' || step === 'running'}
      <!-- Context Selectors -->
      <div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 class="mb-4 text-lg font-semibold text-gray-900">
          Ranking Settings
        </h2>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <!-- Season Dropdown -->
          <div>
            <label
              for="ranking-season-select"
              class="block text-sm font-medium text-gray-700"
            >
              Season
            </label>
            <select
              id="ranking-season-select"
              class="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
              bind:value={selectedSeasonId}
              disabled={step === 'running'}
            >
              <option value="">Select a season...</option>
              {#each data.seasons as season (season.id)}
                <option value={season.id}>{season.name}</option>
              {/each}
            </select>
          </div>

          <!-- Age Group Dropdown -->
          <div>
            <label
              for="ranking-age-group-select"
              class="block text-sm font-medium text-gray-700"
            >
              Age Group
            </label>
            <select
              id="ranking-age-group-select"
              class="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
              bind:value={selectedAgeGroup}
              disabled={step === 'running'}
            >
              <option value="">Select age group...</option>
              {#each ageGroupOptions as ag (ag)}
                <option value={ag}>{ag}</option>
              {/each}
            </select>
          </div>
        </div>

        <!-- Run Button -->
        <div class="mt-6">
          <button
            type="button"
            class="inline-flex items-center rounded-md bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!contextReady || step === 'running'}
            onclick={handleRunRankings}
          >
            {#if step === 'running'}
              <svg
                class="-ml-1 mr-2 h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Running...
            {:else}
              Run Rankings
            {/if}
          </button>
        </div>
      </div>

      {#if !contextReady && step === 'idle'}
        <p class="text-center text-sm text-amber-600">
          Please select a season and age group before running rankings.
        </p>
      {/if}
    {/if}
  </div>
</div>
