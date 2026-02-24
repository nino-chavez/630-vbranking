<script lang="ts">
  import FileDropZone from '$lib/components/FileDropZone.svelte';
  import IdentityResolutionPanel from '$lib/components/IdentityResolutionPanel.svelte';
  import DataPreviewTable from '$lib/components/DataPreviewTable.svelte';
  import ImportSummary from '$lib/components/ImportSummary.svelte';
  import { AgeGroup } from '$lib/schemas/enums.js';
  import type {
    ImportFormat,
    ImportMode,
    ParseResult,
    ParsedFinishesRow,
    ParsedColleyRow,
    ParseError,
    IdentityConflict,
    IdentityMapping,
    ImportSummaryData,
  } from '$lib/import/types.js';

  /** Server data: list of seasons */
  let { data } = $props<{
    data: {
      seasons: Array<{
        id: string;
        name: string;
        start_date: string;
        end_date: string;
        is_active: boolean;
      }>;
    };
  }>();

  // --- State Machine ---
  type Step = 'select' | 'parsing' | 'preview' | 'importing' | 'complete' | 'error';
  let step = $state<Step>('select');

  // --- Context Selectors ---
  let selectedSeasonId = $state('');
  let selectedAgeGroup = $state('');
  let selectedFormat = $state<ImportFormat>('finishes');

  // --- Parse Result State ---
  let parseResult = $state<ParseResult<ParsedFinishesRow | ParsedColleyRow> | null>(null);
  let identityMappings = $state<IdentityMapping[]>([]);
  let editedRows = $state<Map<string, string>>(new Map());
  let skippedRowIndices = $state<Set<number>>(new Set());
  let importMode = $state<ImportMode>('merge');
  let importSummary = $state<ImportSummaryData | null>(null);
  let errorMessage = $state('');

  // --- Available Enum Values ---
  const ageGroupOptions = AgeGroup.options;
  const formatOptions: Array<{ value: ImportFormat; label: string }> = [
    { value: 'finishes', label: 'Finishes' },
    { value: 'colley', label: 'Colley' },
  ];

  // --- Derived State ---
  let contextReady = $derived(
    selectedSeasonId !== '' && selectedAgeGroup !== '',
  );

  let allConflictsResolved = $derived(() => {
    if (!parseResult) return true;
    const conflicts = parseResult.identityConflicts;
    if (conflicts.length === 0) return true;
    return conflicts.every((conflict) =>
      identityMappings.some(
        (m) => m.type === conflict.type && m.parsedValue === conflict.parsedValue,
      ),
    );
  });

  let unresolvedErrorCount = $derived(() => {
    if (!parseResult) return 0;
    return parseResult.errors.filter(
      (e) => e.severity === 'error' && !skippedRowIndices.has(e.row),
    ).length;
  });

  let canConfirm = $derived(
    allConflictsResolved() && unresolvedErrorCount() === 0,
  );

  // --- Actions ---
  async function handleFileDrop(file: File) {
    step = 'parsing';
    errorMessage = '';

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('season_id', selectedSeasonId);
      formData.append('age_group', selectedAgeGroup);
      formData.append('format', selectedFormat);

      const response = await fetch('/api/import/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        errorMessage = result.error || 'Upload failed. Please try again.';
        step = 'error';
        return;
      }

      parseResult = result.data;
      // Pre-populate identity mappings from server-matched entities
      if (result.identityMappings) {
        identityMappings = [...result.identityMappings];
      }

      // Reset editing state
      editedRows = new Map();
      skippedRowIndices = new Set();
      importMode = 'merge';

      step = 'preview';
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred during upload.';
      step = 'error';
    }
  }

  function handleResolve(mapping: IdentityMapping) {
    // Update or add the mapping
    const existingIndex = identityMappings.findIndex(
      (m) => m.type === mapping.type && m.parsedValue === mapping.parsedValue,
    );
    if (existingIndex >= 0) {
      identityMappings[existingIndex] = mapping;
    } else {
      identityMappings = [...identityMappings, mapping];
    }
  }

  function handleEditCell(rowIndex: number, column: string, value: string) {
    const key = `${rowIndex}:${column}`;
    editedRows.set(key, value);
    editedRows = new Map(editedRows);

    // Update the row in parseResult
    if (parseResult) {
      const row = parseResult.rows[rowIndex] as Record<string, unknown>;
      if (row) {
        // Try to convert to number for numeric fields
        const numericFields = ['finishPosition', 'fieldSize', 'wins', 'losses'];
        if (numericFields.includes(column)) {
          const numVal = parseInt(value, 10);
          row[column] = isNaN(numVal) ? value : numVal;
        } else {
          row[column] = value;
        }
        // Trigger reactivity
        parseResult = { ...parseResult, rows: [...parseResult.rows] };
      }
    }
  }

  function handleSkipRow(rowIndex: number) {
    if (skippedRowIndices.has(rowIndex)) {
      skippedRowIndices.delete(rowIndex);
    } else {
      skippedRowIndices.add(rowIndex);
    }
    skippedRowIndices = new Set(skippedRowIndices);
  }

  async function handleConfirm() {
    if (!parseResult) return;

    step = 'importing';
    errorMessage = '';

    try {
      // Filter out skipped rows
      const activeRows = parseResult.rows.filter(
        (_, idx) => !skippedRowIndices.has(idx),
      );

      const response = await fetch('/api/import/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: activeRows,
          identityMappings,
          importMode,
          seasonId: selectedSeasonId,
          ageGroup: selectedAgeGroup,
          format: selectedFormat,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        errorMessage = result.error || 'Import failed. Please try again.';
        step = 'error';
        return;
      }

      importSummary = result.summary;
      step = 'complete';
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred during import.';
      step = 'error';
    }
  }

  function handleReset() {
    step = 'select';
    parseResult = null;
    identityMappings = [];
    editedRows = new Map();
    skippedRowIndices = new Set();
    importMode = 'merge';
    importSummary = null;
    errorMessage = '';
  }

  function handleCancel() {
    handleReset();
  }
</script>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
  <!-- Page Title -->
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900">Import Data</h1>
    <p class="mt-2 text-sm text-gray-600">
      Upload Excel spreadsheets to import tournament results or ranking data.
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
            <h3 class="text-lg font-semibold text-red-800">Import Error</h3>
            <p class="mt-1 text-sm text-red-700 whitespace-pre-wrap">{errorMessage}</p>
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

    <!-- Step: Complete -->
    {#if step === 'complete' && importSummary}
      <ImportSummary summary={importSummary} onReset={handleReset} />
    {/if}

    <!-- Steps: Select, Parsing, Preview, Importing -->
    {#if step !== 'complete' && step !== 'error'}
      <!-- Context Selectors -->
      <div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 class="mb-4 text-lg font-semibold text-gray-900">Import Settings</h2>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <!-- Season Dropdown -->
          <div>
            <label
              for="season-select"
              class="block text-sm font-medium text-gray-700"
            >
              Season
            </label>
            <select
              id="season-select"
              class="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
              bind:value={selectedSeasonId}
              disabled={step !== 'select'}
            >
              <option value="">Select a season...</option>
              {#each data.seasons as season (season.id)}
                <option value={season.id}>
                  {season.name}
                  {season.is_active ? ' (Active)' : ''}
                </option>
              {/each}
            </select>
          </div>

          <!-- Age Group Dropdown -->
          <div>
            <label
              for="age-group-select"
              class="block text-sm font-medium text-gray-700"
            >
              Age Group
            </label>
            <select
              id="age-group-select"
              class="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
              bind:value={selectedAgeGroup}
              disabled={step !== 'select'}
            >
              <option value="">Select age group...</option>
              {#each ageGroupOptions as ag (ag)}
                <option value={ag}>{ag}</option>
              {/each}
            </select>
          </div>

          <!-- Format Dropdown -->
          <div>
            <label
              for="format-select"
              class="block text-sm font-medium text-gray-700"
            >
              Format
            </label>
            <select
              id="format-select"
              class="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
              bind:value={selectedFormat}
              disabled={step !== 'select'}
            >
              {#each formatOptions as fmt (fmt.value)}
                <option value={fmt.value}>{fmt.label}</option>
              {/each}
            </select>
          </div>
        </div>
      </div>

      <!-- File Upload Zone -->
      {#if step === 'select' || step === 'parsing'}
        <FileDropZone
          accept=".xlsx"
          maxSizeMB={10}
          disabled={step === 'parsing' || !contextReady}
          onFileDrop={handleFileDrop}
        />

        {#if !contextReady && step === 'select'}
          <p class="text-center text-sm text-amber-600">
            Please select a season and age group before uploading a file.
          </p>
        {/if}
      {/if}

      <!-- Step: Preview -->
      {#if step === 'preview' && parseResult}
        <!-- Identity Resolution Panel (if conflicts exist) -->
        {#if parseResult.identityConflicts.length > 0}
          <IdentityResolutionPanel
            conflicts={parseResult.identityConflicts}
            onResolve={handleResolve}
          />
        {/if}

        <!-- Data Preview Table -->
        <DataPreviewTable
          rows={parseResult.rows}
          errors={parseResult.errors}
          format={selectedFormat}
          skippedIndices={skippedRowIndices}
          onEditCell={handleEditCell}
          onSkipRow={handleSkipRow}
        />

        <!-- Import Mode Selector -->
        <div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 class="mb-4 text-lg font-semibold text-gray-900">Import Mode</h3>
          <div class="flex items-center gap-6">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="import-mode"
                value="merge"
                bind:group={importMode}
                class="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <span class="text-sm font-medium text-gray-700">
                Merge/Update
              </span>
              <span class="text-xs text-gray-500">
                (insert new, update changed, skip identical)
              </span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="import-mode"
                value="replace"
                bind:group={importMode}
                class="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <span class="text-sm font-medium text-gray-700">
                Replace All
              </span>
              <span class="text-xs text-gray-500">
                (delete existing, insert all new)
              </span>
            </label>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center justify-between">
          <button
            type="button"
            class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onclick={handleCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            class="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canConfirm}
            onclick={handleConfirm}
          >
            Confirm Import
          </button>
        </div>
      {/if}

      <!-- Step: Importing -->
      {#if step === 'importing'}
        <div class="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-12 shadow-sm">
          <div class="flex items-center gap-3 text-gray-600">
            <svg
              class="h-6 w-6 animate-spin"
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
            <span class="text-lg font-medium">Importing data...</span>
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>
