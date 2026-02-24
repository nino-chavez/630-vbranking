<script lang="ts">
  import { page } from '$app/state';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import Card from '$lib/components/Card.svelte';
  import Button from '$lib/components/Button.svelte';
</script>

<PageHeader title="Error {page.status}" subtitle={page.error?.message ?? 'Something went wrong.'} />

<Card>
  <div class="flex flex-col items-center gap-4 py-8 text-center">
    <p class="text-text-muted">
      {#if page.status === 404}
        The page you're looking for doesn't exist or has been moved.
      {:else}
        An unexpected error occurred. Please try again later.
      {/if}
    </p>
    <a href="/">
      <Button variant="primary">Go Home</Button>
    </a>
  </div>
</Card>
