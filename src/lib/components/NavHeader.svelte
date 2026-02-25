<script lang="ts">
	import type { User } from '@supabase/supabase-js';

	interface NavLink {
		href: string;
		label: string;
	}

	interface NavGroup {
		label: string;
		children: NavLink[];
	}

	type NavItem = NavLink | NavGroup;

	function isGroup(item: NavItem): item is NavGroup {
		return 'children' in item;
	}

	interface Props {
		currentPath: string;
		user?: User | null;
	}

	let { currentPath, user = null }: Props = $props();
	let mobileMenuOpen = $state(false);
	let openDropdown = $state<string | null>(null);

	const navItems: NavItem[] = [
		{
			label: 'Data',
			children: [
				{ href: '/import', label: 'Import' },
				{ href: '/import/sources', label: 'Sources' },
				{ href: '/import/jobs', label: 'Jobs' },
			],
		},
		{
			label: 'Rankings',
			children: [
				{ href: '/ranking', label: 'Rankings' },
				{ href: '/ranking/tournaments', label: 'Tournaments' },
				{ href: '/ranking/clubs', label: 'Clubs' },
				{ href: '/ranking/weights', label: 'Weights' },
			],
		},
		{ href: '/settings', label: 'Settings' },
		{ href: '/help', label: 'Help' },
	];

	function isActive(href: string): boolean {
		if (href === '/ranking') {
			return currentPath === '/ranking' || currentPath.startsWith('/ranking/team/');
		}
		if (href === '/import') {
			return currentPath === '/import';
		}
		return currentPath === href || currentPath.startsWith(href + '/');
	}

	function isGroupActive(group: NavGroup): boolean {
		return group.children.some((child) => isActive(child.href));
	}

	function toggleDropdown(label: string, event: MouseEvent) {
		event.stopPropagation();
		openDropdown = openDropdown === label ? null : label;
	}

	function closeDropdowns() {
		openDropdown = null;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeDropdowns();
		}
	}

	async function handleLogout() {
		const response = await fetch('/auth/logout', { method: 'POST' });
		if (response.ok) {
			window.location.href = '/auth/login';
		}
	}

	function toggleMenu() {
		mobileMenuOpen = !mobileMenuOpen;
		openDropdown = null;
	}
</script>

<svelte:window onclick={closeDropdowns} onkeydown={handleKeydown} />

<nav aria-label="Main navigation" class="bg-gradient-to-r from-[#0A0A0A] via-nav-bg to-[#0A0A0A] shadow-lg shadow-black/20">
	<div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
		<a
			href="/"
			class="group flex items-center gap-2 text-lg font-extrabold tracking-tight uppercase text-white hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent rounded transition-colors"
		>
			<span class="inline-block h-6 w-1 rounded-full bg-accent transition-all group-hover:h-7"></span>
			Volleyball Rankings
		</a>

		<!-- Desktop nav -->
		<div class="hidden lg:flex items-center gap-1">
			{#each navItems as item (isGroup(item) ? item.label : item.href)}
				{#if isGroup(item)}
					<div class="relative">
						<button
							type="button"
							class="inline-flex min-h-[44px] items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent
								{isGroupActive(item)
								? 'text-white'
								: 'text-nav-text hover:text-nav-text-active'}"
							aria-haspopup="true"
							aria-expanded={openDropdown === item.label}
							onclick={(e) => toggleDropdown(item.label, e)}
						>
							{item.label}
							<svg
								class="h-4 w-4 transition-transform duration-200 {openDropdown === item.label ? 'rotate-180' : ''}"
								fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"
							>
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
							</svg>
						</button>
						{#if openDropdown === item.label}
								<!-- svelte-ignore a11y_interactive_supports_focus -->
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<div
								class="absolute left-0 top-full z-20 mt-1 min-w-[180px] rounded-lg border border-nav-border bg-[#1A1A1A] py-1 shadow-xl"
								role="menu"
								onclick={(e) => e.stopPropagation()}
							>
								{#each item.children as child (child.href)}
									<a
										href={child.href}
										class="flex min-h-[44px] items-center px-4 text-sm font-medium transition-colors
											{isActive(child.href)
											? 'bg-white/10 text-white'
											: 'text-nav-text hover:bg-white/5 hover:text-nav-text-active'}"
										role="menuitem"
										aria-current={isActive(child.href) ? 'page' : undefined}
										onclick={closeDropdowns}
									>
										{child.label}
									</a>
								{/each}
							</div>
						{/if}
					</div>
				{:else}
					<a
						href={item.href}
						class="inline-flex min-h-[44px] items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent
							{isActive(item.href)
							? 'text-white'
							: 'text-nav-text hover:text-nav-text-active'}"
						aria-current={isActive(item.href) ? 'page' : undefined}
					>
						{item.label}
					</a>
				{/if}
			{/each}

			<div class="ml-4 flex items-center gap-3 border-l border-nav-border pl-4">
				{#if user}
					<span class="text-sm text-nav-text">{user.email}</span>
					<button
						type="button"
						class="min-h-[44px] px-2 text-sm font-medium text-nav-text hover:text-nav-text-active transition-colors rounded focus:outline-none focus:ring-2 focus:ring-accent"
						onclick={handleLogout}
					>
						Log out
					</button>
				{:else}
					<a
						href="/auth/login"
						class="text-sm font-medium text-accent hover:text-accent-hover transition-colors focus:outline-none focus:ring-2 focus:ring-accent rounded"
					>
						Log in
					</a>
				{/if}
			</div>
		</div>

		<!-- Mobile hamburger button -->
		<button
			type="button"
			class="lg:hidden inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-md text-nav-text hover:text-nav-text-active focus:outline-none focus:ring-2 focus:ring-accent"
			onclick={toggleMenu}
			aria-expanded={mobileMenuOpen}
			aria-controls="mobile-menu"
		>
			<span class="sr-only">{mobileMenuOpen ? 'Close menu' : 'Open menu'}</span>
			{#if mobileMenuOpen}
				<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			{:else}
				<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
				</svg>
			{/if}
		</button>
	</div>

	<!-- Mobile menu -->
	{#if mobileMenuOpen}
		<div id="mobile-menu" class="lg:hidden border-t border-nav-border bg-nav-bg">
			<div class="space-y-1 px-4 py-3">
				{#each navItems as item (isGroup(item) ? item.label : item.href)}
					{#if isGroup(item)}
						<p class="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-nav-text/60">{item.label}</p>
						{#each item.children as child (child.href)}
							<a
								href={child.href}
								class="block min-h-[44px] rounded-md pl-6 pr-3 py-3 text-base font-medium transition-colors
									{isActive(child.href)
									? 'bg-white/10 text-nav-text-active'
									: 'text-nav-text hover:bg-white/5 hover:text-nav-text-active'}"
								aria-current={isActive(child.href) ? 'page' : undefined}
								onclick={() => (mobileMenuOpen = false)}
							>
								{child.label}
							</a>
						{/each}
					{:else}
						<a
							href={item.href}
							class="block min-h-[44px] rounded-md px-3 py-3 text-base font-medium transition-colors
								{isActive(item.href)
								? 'bg-white/10 text-nav-text-active'
								: 'text-nav-text hover:bg-white/5 hover:text-nav-text-active'}"
							aria-current={isActive(item.href) ? 'page' : undefined}
							onclick={() => (mobileMenuOpen = false)}
						>
							{item.label}
						</a>
					{/if}
				{/each}
			</div>
			<div class="border-t border-nav-border px-4 py-3">
				{#if user}
					<p class="text-sm text-nav-text truncate">{user.email}</p>
					<button
						type="button"
						class="mt-2 block w-full min-h-[44px] rounded-md px-3 py-3 text-left text-base font-medium text-nav-text hover:bg-white/5 hover:text-nav-text-active transition-colors"
						onclick={handleLogout}
					>
						Log out
					</button>
				{:else}
					<a
						href="/auth/login"
						class="block min-h-[44px] rounded-md px-3 py-3 text-base font-medium text-accent hover:bg-white/5 transition-colors"
						onclick={() => (mobileMenuOpen = false)}
					>
						Log in
					</a>
				{/if}
			</div>
		</div>
	{/if}
</nav>
