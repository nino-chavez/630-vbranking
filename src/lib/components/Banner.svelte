<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		variant: 'success' | 'error' | 'warning' | 'info';
		title?: string;
		children: Snippet;
		dismissible?: boolean;
		compact?: boolean;
	}

	let { variant, title, children, dismissible = false, compact = false }: Props = $props();

	let visible = $state(true);

	const variantStyles: Record<string, { bg: string; border: string; text: string; icon: string }> =
		{
			success: {
				bg: 'bg-success-light',
				border: 'border-success',
				text: 'text-green-800',
				icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
			},
			error: {
				bg: 'bg-error-light',
				border: 'border-error',
				text: 'text-red-800',
				icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z',
			},
			warning: {
				bg: 'bg-warning-light',
				border: 'border-warning',
				text: 'text-amber-800',
				icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z',
			},
			info: {
				bg: 'bg-info-light',
				border: 'border-accent',
				text: 'text-blue-800',
				icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
			},
		};

	const style = $derived(variantStyles[variant]);
</script>

{#if visible}
	<div class="rounded-lg border-l-4 {compact ? 'px-3 py-2' : 'p-4'} {style.bg} {style.border} {style.text}" role="alert">
		<div class="flex">
			<div class="shrink-0">
				<svg
					class="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					aria-hidden="true"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={style.icon} />
				</svg>
			</div>
			<div class="ml-3 flex-1">
				{#if title}
					<h3 class="text-sm font-semibold">{title}</h3>
				{/if}
				<div class="text-sm {title ? 'mt-1' : ''}">
					{@render children()}
				</div>
			</div>
			{#if dismissible}
				<button
					type="button"
					class="ml-auto -mx-1.5 -my-1.5 rounded-md p-1.5 hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2"
					onclick={() => (visible = false)}
					aria-label="Dismiss"
				>
					<svg
						class="h-4 w-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			{/if}
		</div>
	</div>
{/if}
