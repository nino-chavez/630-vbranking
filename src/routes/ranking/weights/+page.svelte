<script lang="ts">
  import PageHeader from '$lib/components/PageHeader.svelte';
  import Card from '$lib/components/Card.svelte';
  import Select from '$lib/components/Select.svelte';
  import Button from '$lib/components/Button.svelte';
  import Banner from '$lib/components/Banner.svelte';

  /** Server data: list of seasons */
  let { data } = $props<{
    data: {
      seasons: Array<{ id: string; name: string }>;
    };
  }>();

  interface WeightRow {
    tournament_id: string;
    tournament_name: string;
    tournament_date: string;
    weight: number;
    tier: number;
    has_custom_weight: boolean;
  }

  /** Default weights per tier. */
  const TIER_DEFAULTS: Record<number, number> = {
    1: 3.0,
    2: 2.5,
    3: 2.0,
    4: 1.5,
    5: 1.0,
  };

  // --- State ---
  let selectedSeasonId = $state('');
  let weights = $state<WeightRow[]>([]);
  let originalWeights = $state<WeightRow[]>([]);
  let saving = $state(false);
  let loadingWeights = $state(false);
  let feedbackMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);

  // --- Derived ---
  const hasChanges = $derived(JSON.stringify(weights) !== JSON.stringify(originalWeights));

  const seasonSelectOptions = $derived(
    data.seasons.map((s) => ({ value: s.id, label: s.name })),
  );

  const tierOptions = [
    { value: '1', label: 'Tier 1 (3.0)' },
    { value: '2', label: 'Tier 2 (2.5)' },
    { value: '3', label: 'Tier 3 (2.0)' },
    { value: '4', label: 'Tier 4 (1.5)' },
    { value: '5', label: 'Tier 5 (1.0)' },
  ];

  // --- Actions ---
  async function loadWeights() {
    if (!selectedSeasonId) return;

    loadingWeights = true;
    feedbackMessage = null;

    try {
      const response = await fetch(`/api/ranking/weights?season_id=${selectedSeasonId}`);
      const result = await response.json();

      if (result.success) {
        weights = result.data.weights;
        originalWeights = JSON.parse(JSON.stringify(result.data.weights));
      } else {
        feedbackMessage = { type: 'error', text: result.error || 'Failed to load weights.' };
      }
    } catch {
      feedbackMessage = { type: 'error', text: 'Failed to fetch tournament weights.' };
    } finally {
      loadingWeights = false;
    }
  }

  function handleSeasonChange() {
    loadWeights();
  }

  function handleTierChange(index: number, tierStr: string) {
    const tier = Number(tierStr);
    weights[index].tier = tier;
    weights[index].weight = TIER_DEFAULTS[tier] ?? 1.0;
  }

  function handleWeightChange(index: number, value: string) {
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      weights[index].weight = num;
    }
  }

  async function handleSave() {
    saving = true;
    feedbackMessage = null;

    try {
      const changedWeights = weights
        .filter((w, i) =>
          w.weight !== originalWeights[i].weight || w.tier !== originalWeights[i].tier
        )
        .map((w) => ({
          tournament_id: w.tournament_id,
          weight: w.weight,
          tier: w.tier,
        }));

      if (changedWeights.length === 0) return;

      const response = await fetch('/api/ranking/weights', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          season_id: selectedSeasonId,
          weights: changedWeights,
        }),
      });

      const result = await response.json();

      if (result.success) {
        feedbackMessage = { type: 'success', text: `Saved ${result.data.upserted} weight(s).` };
        originalWeights = JSON.parse(JSON.stringify(weights));
      } else {
        feedbackMessage = { type: 'error', text: result.error || 'Failed to save weights.' };
      }
    } catch {
      feedbackMessage = { type: 'error', text: 'Failed to save tournament weights.' };
    } finally {
      saving = false;
    }
  }
</script>

<PageHeader
  title="Tournament Weights"
  subtitle="Manage tournament importance weights for ranking calculations."
/>

<div class="space-y-6">
  {#if feedbackMessage}
    <Banner variant={feedbackMessage.type === 'success' ? 'success' : 'error'}>
      {feedbackMessage.text}
    </Banner>
  {/if}

  <Card>
    {#snippet header()}
      <h2 class="text-lg font-semibold text-text-primary">Select Season</h2>
    {/snippet}
    <Select
      label="Season"
      id="weights-season-select"
      options={seasonSelectOptions}
      bind:value={selectedSeasonId}
      placeholder="Select a season..."
      onchange={handleSeasonChange}
    />
  </Card>

  <Card>
    {#snippet header()}
      <h2 class="text-lg font-semibold text-text-primary">Tier Reference</h2>
    {/snippet}
    <div class="grid grid-cols-5 gap-2 text-center text-sm">
      {#each [
        { tier: 1, label: 'Tier 1', weight: 3.0, desc: 'National Championship' },
        { tier: 2, label: 'Tier 2', weight: 2.5, desc: 'Major National' },
        { tier: 3, label: 'Tier 3', weight: 2.0, desc: 'Regional Championship' },
        { tier: 4, label: 'Tier 4', weight: 1.5, desc: 'Regional Qualifier' },
        { tier: 5, label: 'Tier 5', weight: 1.0, desc: 'Local Tournament' },
      ] as ref}
        <div class="rounded-lg border border-border bg-surface-alt p-3">
          <div class="font-semibold text-text-primary">{ref.label}</div>
          <div class="text-lg font-bold text-accent">{ref.weight}x</div>
          <div class="text-xs text-text-muted">{ref.desc}</div>
        </div>
      {/each}
    </div>
  </Card>

  {#if loadingWeights}
    <Card>
      <div class="py-8 text-center text-text-muted">Loading tournament weights...</div>
    </Card>
  {:else if selectedSeasonId && weights.length > 0}
    <Card>
      {#snippet header()}
        <h2 class="text-lg font-semibold text-text-primary">Tournament Weights</h2>
      {/snippet}
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
              <th class="px-3 py-2">Tournament</th>
              <th class="px-3 py-2">Date</th>
              <th class="px-3 py-2">Tier</th>
              <th class="px-3 py-2">Weight</th>
              <th class="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            {#each weights as row, i (row.tournament_id)}
              <tr class="hover:bg-surface-alt/50">
                <td class="whitespace-nowrap px-3 py-2 font-medium text-text-primary">{row.tournament_name}</td>
                <td class="whitespace-nowrap px-3 py-2 text-text-secondary">{row.tournament_date}</td>
                <td class="px-3 py-2">
                  <select
                    class="rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    value={String(row.tier)}
                    onchange={(e) => handleTierChange(i, e.currentTarget.value)}
                  >
                    {#each tierOptions as opt}
                      <option value={opt.value}>{opt.label}</option>
                    {/each}
                  </select>
                </td>
                <td class="px-3 py-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    class="w-20 rounded border border-border bg-surface px-2 py-1 text-sm tabular-nums text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    value={row.weight}
                    oninput={(e) => handleWeightChange(i, e.currentTarget.value)}
                  />
                </td>
                <td class="px-3 py-2">
                  {#if row.has_custom_weight || row.weight !== (originalWeights[i]?.weight ?? 1.0) || row.tier !== (originalWeights[i]?.tier ?? 5)}
                    <span class="inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">Custom</span>
                  {:else}
                    <span class="inline-flex items-center rounded-full bg-surface-alt px-2 py-0.5 text-xs font-medium text-text-muted">Default</span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <div class="mt-4 flex justify-end">
        <Button
          variant="primary"
          disabled={!hasChanges || saving}
          loading={saving}
          onclick={handleSave}
        >
          {saving ? 'Saving...' : 'Save Weights'}
        </Button>
      </div>
    </Card>
  {:else if selectedSeasonId && weights.length === 0 && !loadingWeights}
    <Card>
      <div class="py-8 text-center text-text-muted">No tournaments found for this season.</div>
    </Card>
  {/if}
</div>
