<script lang="ts">
	import Spinner from './Spinner.svelte';

	let {
		accept = '.xlsx',
		maxSizeMB = 10,
		disabled = false,
		onFileDrop,
	} = $props<{
		accept?: string;
		maxSizeMB?: number;
		disabled?: boolean;
		onFileDrop: (file: File) => void;
	}>();

	let isDragOver = $state(false);
	let errorMessage = $state('');
	let fileInputRef = $state<HTMLInputElement | null>(null);

	function validateFile(file: File): string | null {
		const fileName = file.name.toLowerCase();
		const acceptedExtensions = accept.split(',').map((ext: string) => ext.trim().toLowerCase());
		const hasValidExtension = acceptedExtensions.some((ext: string) => fileName.endsWith(ext));

		if (!hasValidExtension) {
			return `Invalid file type. Only ${accept} files are accepted.`;
		}

		const maxBytes = maxSizeMB * 1024 * 1024;
		if (file.size > maxBytes) {
			return `File size exceeds the ${maxSizeMB} MB limit. Your file is ${(file.size / (1024 * 1024)).toFixed(1)} MB.`;
		}

		return null;
	}

	function handleFile(file: File) {
		errorMessage = '';
		const error = validateFile(file);
		if (error) {
			errorMessage = error;
			return;
		}
		onFileDrop(file);
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		if (!disabled) {
			isDragOver = true;
		}
	}

	function handleDragLeave(event: DragEvent) {
		event.preventDefault();
		isDragOver = false;
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragOver = false;

		if (disabled) return;

		const files = event.dataTransfer?.files;
		if (files && files.length > 0) {
			handleFile(files[0]);
		}
	}

	function handleFileInput(event: Event) {
		const input = event.target as HTMLInputElement;
		const files = input.files;
		if (files && files.length > 0) {
			handleFile(files[0]);
		}
		input.value = '';
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (disabled) return;
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			fileInputRef?.click();
		}
	}

	function openFilePicker() {
		if (!disabled) {
			fileInputRef?.click();
		}
	}
</script>

<div
	class="relative rounded-lg p-8 text-center transition-colors duration-200
    {isDragOver
		? 'border-2 border-dashed border-accent bg-accent-light'
		: errorMessage
			? 'border-2 border-dashed border-error bg-error-light'
			: 'border-2 border-dashed border-border-strong bg-surface hover:border-accent hover:bg-accent-light'}
    {disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}"
	role="button"
	tabindex={disabled ? -1 : 0}
	aria-label="File upload drop zone. Press Enter or Space to open file picker."
	aria-disabled={disabled}
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
	onkeydown={handleKeyDown}
>
	{#if disabled}
		<div class="absolute inset-0 flex items-center justify-center rounded-lg bg-surface/70">
			<div class="flex items-center gap-2 text-text-secondary">
				<Spinner size="sm" />
				<span>Processing...</span>
			</div>
		</div>
	{/if}

	<div class="mb-4">
		<svg
			class="mx-auto h-12 w-12 text-text-muted"
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="1.5"
				d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
			/>
		</svg>
	</div>

	<p class="mb-2 text-text-secondary">
		Drag & drop {accept} file here
	</p>

	<p class="mb-4 text-sm text-text-muted">or</p>

	<button
		type="button"
		class="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
		{disabled}
		onclick={openFilePicker}
	>
		Browse Files
	</button>

	<p class="mt-3 text-xs text-text-muted">
		Maximum file size: {maxSizeMB} MB
	</p>

	<input
		bind:this={fileInputRef}
		type="file"
		{accept}
		class="hidden"
		onchange={handleFileInput}
		tabindex={-1}
		aria-hidden="true"
	/>

	{#if errorMessage}
		<div
			class="mt-4 rounded-md bg-error-light p-3 text-sm text-red-700"
			role="alert"
			aria-live="assertive"
		>
			<span class="font-medium">Error:</span>
			{errorMessage}
		</div>
	{/if}
</div>
