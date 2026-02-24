<script lang="ts">
  interface Props {
    currentPath: string;
  }

  let { currentPath }: Props = $props();

  const links = [
    { href: '/import', label: 'Import' },
    { href: '/ranking', label: 'Rankings' },
    { href: '/ranking/weights', label: 'Weights' },
  ];

  function isActive(href: string): boolean {
    return currentPath === href || currentPath.startsWith(href + '/');
  }
</script>

<nav aria-label="Main navigation" class="border-b border-border bg-surface">
  <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
    <a href="/" class="text-lg font-bold text-text-primary hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent rounded">
      Volleyball Rankings
    </a>
    <div class="flex items-center gap-6">
      {#each links as link}
        <a
          href={link.href}
          class="inline-flex items-center border-b-2 px-1 py-1 text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent rounded
            {isActive(link.href)
            ? 'border-accent text-accent'
            : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-strong'}"
          aria-current={isActive(link.href) ? 'page' : undefined}
        >
          {link.label}
        </a>
      {/each}
    </div>
  </div>
</nav>
