<script lang="ts">
  import type { NormalizedTeamResult } from '$lib/ranking/types.js';

  let { results, teams }: {
    results: NormalizedTeamResult[];
    teams: Map<string, string>;
  } = $props();

  function fmt(value: number): string {
    return value.toFixed(2);
  }
</script>

{#if results.length === 0}
  <div class="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm">
    <p class="text-gray-500">No results</p>
  </div>
{:else}
  <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="sticky top-0 bg-gray-50">
        <tr>
          <th class="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-600">Rank</th>
          <th class="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Team Name</th>
          <th class="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">Colley Rating</th>
          <th class="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-600">Colley Rank</th>
          <th class="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">Elo-2200 Rating</th>
          <th class="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-600">Elo-2200 Rank</th>
          <th class="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">Elo-2400 Rating</th>
          <th class="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-600">Elo-2400 Rank</th>
          <th class="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">Elo-2500 Rating</th>
          <th class="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-600">Elo-2500 Rank</th>
          <th class="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">Elo-2700 Rating</th>
          <th class="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-600">Elo-2700 Rank</th>
          <th class="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">AggRating</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        {#each results as row, i (row.team_id)}
          <tr class={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
            <td class="whitespace-nowrap px-3 py-2 text-center text-sm font-medium text-gray-900">{row.agg_rank}</td>
            <td class="whitespace-nowrap px-3 py-2 text-left text-sm font-medium text-gray-900">{teams.get(row.team_id) ?? row.team_id}</td>
            <td class="whitespace-nowrap px-3 py-2 text-right text-sm tabular-nums text-gray-700">{fmt(row.algo1_rating)}</td>
            <td class="whitespace-nowrap px-3 py-2 text-center text-sm text-gray-600">{row.algo1_rank}</td>
            <td class="whitespace-nowrap px-3 py-2 text-right text-sm tabular-nums text-gray-700">{fmt(row.algo2_rating)}</td>
            <td class="whitespace-nowrap px-3 py-2 text-center text-sm text-gray-600">{row.algo2_rank}</td>
            <td class="whitespace-nowrap px-3 py-2 text-right text-sm tabular-nums text-gray-700">{fmt(row.algo3_rating)}</td>
            <td class="whitespace-nowrap px-3 py-2 text-center text-sm text-gray-600">{row.algo3_rank}</td>
            <td class="whitespace-nowrap px-3 py-2 text-right text-sm tabular-nums text-gray-700">{fmt(row.algo4_rating)}</td>
            <td class="whitespace-nowrap px-3 py-2 text-center text-sm text-gray-600">{row.algo4_rank}</td>
            <td class="whitespace-nowrap px-3 py-2 text-right text-sm tabular-nums text-gray-700">{fmt(row.algo5_rating)}</td>
            <td class="whitespace-nowrap px-3 py-2 text-center text-sm text-gray-600">{row.algo5_rank}</td>
            <td class="whitespace-nowrap px-3 py-2 text-right text-sm font-semibold tabular-nums text-gray-900">{fmt(row.agg_rating)}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}
