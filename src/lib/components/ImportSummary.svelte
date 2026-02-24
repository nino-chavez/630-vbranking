<script lang="ts">
  import type { ImportSummaryData } from '$lib/import/types.js';

  let { summary, onReset } = $props<{
    summary: ImportSummaryData;
    onReset: () => void;
  }>();

  let formattedTimestamp = $derived(() => {
    try {
      return new Date(summary.timestamp).toLocaleString();
    } catch {
      return summary.timestamp;
    }
  });
</script>

<div class="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
  <!-- Success Banner -->
  <div class="bg-green-600 px-6 py-4">
    <div class="flex items-center gap-3">
      <svg
        class="h-6 w-6 text-white"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fill-rule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
          clip-rule="evenodd"
        />
      </svg>
      <h3 class="text-lg font-semibold text-white">Import Completed Successfully</h3>
    </div>
  </div>

  <!-- Stats Grid -->
  <div class="px-6 py-6">
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      <div class="rounded-lg bg-blue-50 p-4">
        <p class="text-sm font-medium text-blue-600">Rows Inserted</p>
        <p class="mt-1 text-2xl font-bold text-blue-900">{summary.rowsInserted}</p>
      </div>

      <div class="rounded-lg bg-amber-50 p-4">
        <p class="text-sm font-medium text-amber-600">Rows Updated</p>
        <p class="mt-1 text-2xl font-bold text-amber-900">{summary.rowsUpdated}</p>
      </div>

      <div class="rounded-lg bg-gray-50 p-4">
        <p class="text-sm font-medium text-gray-600">Rows Skipped</p>
        <p class="mt-1 text-2xl font-bold text-gray-900">{summary.rowsSkipped}</p>
      </div>

      <div class="rounded-lg bg-green-50 p-4">
        <p class="text-sm font-medium text-green-600">Teams Created</p>
        <p class="mt-1 text-2xl font-bold text-green-900">{summary.teamsCreated}</p>
      </div>

      <div class="rounded-lg bg-green-50 p-4">
        <p class="text-sm font-medium text-green-600">Tournaments Created</p>
        <p class="mt-1 text-2xl font-bold text-green-900">{summary.tournamentsCreated}</p>
      </div>

      <div class="rounded-lg bg-purple-50 p-4">
        <p class="text-sm font-medium text-purple-600">Import Mode</p>
        <p class="mt-1 text-lg font-bold capitalize text-purple-900">
          {summary.importMode === 'merge' ? 'Merge/Update' : 'Replace All'}
        </p>
      </div>
    </div>

    <!-- Context Info -->
    <div class="mt-6 border-t border-gray-200 pt-4">
      <dl class="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
        <div>
          <dt class="font-medium text-gray-500">Season</dt>
          <dd class="text-gray-900">{summary.seasonId}</dd>
        </div>
        <div>
          <dt class="font-medium text-gray-500">Age Group</dt>
          <dd class="text-gray-900">{summary.ageGroup}</dd>
        </div>
        <div>
          <dt class="font-medium text-gray-500">Imported At</dt>
          <dd class="text-gray-900">{formattedTimestamp()}</dd>
        </div>
      </dl>
    </div>

    <!-- Action -->
    <div class="mt-6 border-t border-gray-200 pt-4">
      <button
        type="button"
        class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        onclick={onReset}
      >
        Import Another File
      </button>
    </div>
  </div>
</div>
