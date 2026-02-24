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
		primary: 'bg-accent text-white hover:bg-accent-hover focus:ring-accent',
		secondary:
			'bg-surface text-text-secondary border border-border hover:bg-surface-alt focus:ring-accent',
		danger: 'bg-error text-white hover:bg-red-700 focus:ring-error',
		ghost: 'text-text-secondary hover:bg-surface-alt focus:ring-accent',
	};

	const sizeClasses: Record<string, string> = {
		sm: 'px-3 py-1.5 text-xs',
		md: 'px-4 py-2 text-sm',
	};

	const baseClasses =
		'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

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
