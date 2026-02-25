<script lang="ts">
	import type { Snippet } from 'svelte';
	import Spinner from './Spinner.svelte';

	interface Props {
		variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
		size?: 'sm' | 'md';
		disabled?: boolean;
		loading?: boolean;
		type?: 'button' | 'submit';
		onclick?: () => void;
		children: Snippet;
	}

	let {
		variant = 'primary',
		size = 'md',
		disabled = false,
		loading = false,
		type = 'button',
		onclick,
		children,
	}: Props = $props();

	const variantClasses: Record<string, string> = {
		primary:
			'bg-accent text-white hover:bg-accent-hover focus:ring-accent shadow-md hover:shadow-lg hover:-translate-y-0.5',
		secondary:
			'bg-surface text-text-secondary border-2 border-border hover:bg-surface-alt hover:border-border-strong focus:ring-accent',
		danger:
			'bg-error text-white hover:bg-red-700 focus:ring-error shadow-md hover:shadow-lg hover:-translate-y-0.5',
		ghost: 'text-text-secondary hover:bg-surface-alt focus:ring-accent',
	};

	const sizeClasses: Record<string, string> = {
		sm: 'px-3 py-1.5 text-xs min-h-[36px]',
		md: 'px-5 py-2.5 text-sm min-h-[44px]',
	};

	const baseClasses =
		'inline-flex items-center justify-center gap-2 rounded-lg font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

	function handleClick() {
		if (!disabled && !loading && onclick) {
			onclick();
		}
	}
</script>

<button
	{type}
	class="{baseClasses} {variantClasses[variant]} {sizeClasses[size]}"
	disabled={disabled || loading}
	onclick={handleClick}
>
	{#if loading}
		<Spinner size="sm" />
	{/if}
	{@render children()}
</button>
