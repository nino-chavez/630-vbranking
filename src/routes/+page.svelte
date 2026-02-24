<script lang="ts">
  import PageHeader from '$lib/components/PageHeader.svelte';
  import Card from '$lib/components/Card.svelte';
  import Button from '$lib/components/Button.svelte';

  const actions = [
    {
      href: '/import',
      title: 'Import Data',
      description: 'Upload Excel spreadsheets with tournament results or Colley ratings to populate the system.',
    },
    {
      href: '/ranking',
      title: 'Rankings',
      description: 'View, compute, and manage team rankings across age groups using the five-algorithm ensemble.',
    },
    {
      href: '/ranking/weights',
      title: 'Tournament Weights',
      description: 'Adjust tournament importance multipliers to fine-tune how results affect final rankings.',
    },
  ];
</script>

<PageHeader
  title="Volleyball Ranking Engine"
  subtitle="Compute, review, and export AAU volleyball team rankings using a five-algorithm ensemble (Colley Matrix + four Elo variants)."
/>

<div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
  {#each actions as action (action.href)}
    <a href={action.href} class="group block">
      <Card>
        <div class="flex flex-col gap-3">
          <h2 class="text-lg font-semibold text-text-primary group-hover:text-accent transition-colors">
            {action.title}
          </h2>
          <p class="text-sm text-text-secondary">{action.description}</p>
          <div class="mt-auto pt-2">
            <Button variant="secondary" size="sm">Open</Button>
          </div>
        </div>
      </Card>
    </a>
  {/each}
</div>
