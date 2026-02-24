<script lang="ts">
  import type { IdentityConflict, IdentityMapping } from '$lib/import/types.js';

  let { conflicts, onResolve } = $props<{
    conflicts: IdentityConflict[];
    onResolve: (mapping: IdentityMapping) => void;
  }>();

  let resolvedMappings = $state<Map<string, IdentityMapping>>(new Map());
  let expandedDropdowns = $state<Set<string>>(new Set());
  let searchFilters = $state<Map<string, string>>(new Map());

  let unresolvedTeamCount = $derived(
    conflicts.filter(
      (c: IdentityConflict) => c.type === 'team' && !resolvedMappings.has(conflictKey(c)),
    ).length,
  );

  let unresolvedTournamentCount = $derived(
    conflicts.filter(
      (c: IdentityConflict) => c.type === 'tournament' && !resolvedMappings.has(conflictKey(c)),
    ).length,
  );

  let totalUnresolved = $derived(unresolvedTeamCount + unresolvedTournamentCount);

  function conflictKey(conflict: IdentityConflict): string {
    return `${conflict.type}:${conflict.parsedValue}`;
  }

  function handleSkip(conflict: IdentityConflict) {
    const mapping: IdentityMapping = {
      type: conflict.type,
      parsedValue: conflict.parsedValue,
      action: 'skip',
    };
    resolvedMappings.set(conflictKey(conflict), mapping);
    resolvedMappings = new Map(resolvedMappings);
    onResolve(mapping);
  }

  function handleCreateNew(conflict: IdentityConflict) {
    const mapping: IdentityMapping = {
      type: conflict.type,
      parsedValue: conflict.parsedValue,
      action: 'create',
      newRecord: conflict.type === 'team'
        ? { name: conflict.parsedValue, code: conflict.parsedValue }
        : { name: conflict.parsedValue },
    };
    resolvedMappings.set(conflictKey(conflict), mapping);
    resolvedMappings = new Map(resolvedMappings);
    onResolve(mapping);
  }

  function handleMapTo(conflict: IdentityConflict, suggestion: { id: string; name: string; code?: string }) {
    const mapping: IdentityMapping = {
      type: conflict.type,
      parsedValue: conflict.parsedValue,
      action: 'map',
      mappedId: suggestion.id,
    };
    resolvedMappings.set(conflictKey(conflict), mapping);
    resolvedMappings = new Map(resolvedMappings);
    expandedDropdowns.delete(conflictKey(conflict));
    expandedDropdowns = new Set(expandedDropdowns);
    onResolve(mapping);
  }

  function toggleDropdown(conflict: IdentityConflict) {
    const key = conflictKey(conflict);
    if (expandedDropdowns.has(key)) {
      expandedDropdowns.delete(key);
    } else {
      expandedDropdowns.add(key);
    }
    expandedDropdowns = new Set(expandedDropdowns);
  }

  function getFilteredSuggestions(conflict: IdentityConflict) {
    const filter = searchFilters.get(conflictKey(conflict)) || '';
    if (!filter) return conflict.suggestions;
    const lower = filter.toLowerCase();
    return conflict.suggestions.filter(
      (s) =>
        s.name.toLowerCase().includes(lower) ||
        (s.code && s.code.toLowerCase().includes(lower)),
    );
  }

  function updateSearchFilter(conflict: IdentityConflict, value: string) {
    searchFilters.set(conflictKey(conflict), value);
    searchFilters = new Map(searchFilters);
  }

  function isResolved(conflict: IdentityConflict): boolean {
    return resolvedMappings.has(conflictKey(conflict));
  }

  function getResolutionLabel(conflict: IdentityConflict): string {
    const mapping = resolvedMappings.get(conflictKey(conflict));
    if (!mapping) return '';
    switch (mapping.action) {
      case 'create':
        return 'Will create new';
      case 'map':
        return 'Mapped to existing';
      case 'skip':
        return 'Skipped';
      default:
        return '';
    }
  }
</script>

<div class="rounded-lg border border-border bg-surface shadow-sm">
  <div class="flex items-center justify-between border-b border-border px-6 py-4">
    <h3 class="text-lg font-semibold text-text-primary">Identity Resolution</h3>
    {#if totalUnresolved > 0}
      <span
        class="inline-flex items-center rounded-full bg-warning-light px-3 py-1 text-sm font-medium text-amber-800"
      >
        {totalUnresolved} unresolved
      </span>
    {:else}
      <span
        class="inline-flex items-center rounded-full bg-success-light px-3 py-1 text-sm font-medium text-green-800"
      >
        All resolved
      </span>
    {/if}
  </div>

  {#if unresolvedTeamCount > 0 || unresolvedTournamentCount > 0}
    <div class="border-b border-border bg-surface-alt px-6 py-2 text-sm text-text-secondary">
      {#if unresolvedTeamCount > 0}
        <span>{unresolvedTeamCount} unmatched team{unresolvedTeamCount !== 1 ? 's' : ''}</span>
      {/if}
      {#if unresolvedTeamCount > 0 && unresolvedTournamentCount > 0}
        <span>, </span>
      {/if}
      {#if unresolvedTournamentCount > 0}
        <span>{unresolvedTournamentCount} unmatched tournament{unresolvedTournamentCount !== 1 ? 's' : ''}</span>
      {/if}
    </div>
  {/if}

  <div class="divide-y divide-border">
    {#each conflicts as conflict (conflictKey(conflict))}
      {@const resolved = isResolved(conflict)}
      {@const key = conflictKey(conflict)}
      <div
        class="px-6 py-4 transition-colors
          {resolved ? 'bg-success-light' : 'bg-surface'}"
      >
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-3 min-w-0">
            {#if resolved}
              <svg
                class="h-5 w-5 flex-shrink-0 text-success"
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
            {:else}
              <svg
                class="h-5 w-5 flex-shrink-0 text-warning"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                  clip-rule="evenodd"
                />
              </svg>
            {/if}

            <div class="min-w-0">
              <span
                class="inline-block rounded bg-surface-alt px-2 py-0.5 text-xs font-medium uppercase text-text-muted"
              >
                {conflict.type}
              </span>
              <span class="ml-2 font-medium text-text-primary">
                "{conflict.parsedValue}"
              </span>
              <span class="ml-1 text-sm text-text-muted">not found</span>
              {#if resolved}
                <span class="ml-2 text-sm text-green-700">
                  -- {getResolutionLabel(conflict)}
                </span>
              {/if}
            </div>
          </div>

          {#if !resolved}
            <div class="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                class="rounded-md border border-success bg-success-light px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-success focus:ring-offset-1"
                onclick={() => handleCreateNew(conflict)}
              >
                Create New
              </button>

              <div class="relative">
                <button
                  type="button"
                  class="rounded-md border border-accent bg-accent-light px-3 py-1.5 text-sm font-medium text-accent hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1"
                  onclick={() => toggleDropdown(conflict)}
                  disabled={conflict.suggestions.length === 0}
                >
                  Map To
                  <svg
                    class="ml-1 inline h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </button>

                {#if expandedDropdowns.has(key)}
                  <div
                    class="absolute right-0 z-10 mt-1 w-72 rounded-md border border-border bg-surface shadow-lg"
                  >
                    <div class="border-b border-border p-2">
                      <input
                        type="text"
                        placeholder="Search..."
                        class="w-full rounded border border-border px-2 py-1 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                        value={searchFilters.get(key) || ''}
                        oninput={(e) => updateSearchFilter(conflict, (e.target as HTMLInputElement).value)}
                      />
                    </div>
                    <ul class="max-h-48 overflow-y-auto py-1">
                      {#each getFilteredSuggestions(conflict) as suggestion (suggestion.id)}
                        <li>
                          <button
                            type="button"
                            class="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent-light"
                            onclick={() => handleMapTo(conflict, suggestion)}
                          >
                            <span>
                              <span class="font-medium">{suggestion.name}</span>
                              {#if suggestion.code}
                                <span class="ml-1 text-text-muted">({suggestion.code})</span>
                              {/if}
                            </span>
                            <span class="text-xs text-text-muted">
                              {Math.round(suggestion.score * 100)}% match
                            </span>
                          </button>
                        </li>
                      {:else}
                        <li class="px-3 py-2 text-sm text-text-muted">No matches found</li>
                      {/each}
                    </ul>
                  </div>
                {/if}
              </div>

              <button
                type="button"
                class="rounded-md border border-border bg-surface-alt px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1"
                onclick={() => handleSkip(conflict)}
              >
                Skip
              </button>
            </div>
          {/if}
        </div>
      </div>
    {/each}
  </div>

  {#if conflicts.length === 0}
    <div class="px-6 py-8 text-center text-sm text-text-muted">
      No identity conflicts to resolve.
    </div>
  {/if}
</div>
