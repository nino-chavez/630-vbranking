<script lang="ts">
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
    // Check file extension
    const fileName = file.name.toLowerCase();
    const acceptedExtensions = accept
      .split(',')
      .map((ext) => ext.trim().toLowerCase());
    const hasValidExtension = acceptedExtensions.some((ext) =>
      fileName.endsWith(ext),
    );

    if (!hasValidExtension) {
      return `Invalid file type. Only ${accept} files are accepted.`;
    }

    // Check file size
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
    // Reset the input so the same file can be selected again
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
    ? 'border-2 border-dashed border-blue-500 bg-blue-50'
    : errorMessage
      ? 'border-2 border-dashed border-red-500 bg-red-50'
      : 'border-2 border-dashed border-gray-300 bg-white hover:border-blue-500 hover:bg-blue-50'}
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
    <div class="absolute inset-0 flex items-center justify-center rounded-lg bg-white/70">
      <div class="flex items-center gap-2 text-gray-600">
        <svg
          class="h-5 w-5 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <span>Processing...</span>
      </div>
    </div>
  {/if}

  <div class="mb-4">
    <svg
      class="mx-auto h-12 w-12 text-gray-400"
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

  <p class="mb-2 text-gray-600">
    Drag & drop {accept} file here
  </p>

  <p class="mb-4 text-sm text-gray-400">or</p>

  <button
    type="button"
    class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    disabled={disabled}
    onclick={openFilePicker}
  >
    Browse Files
  </button>

  <p class="mt-3 text-xs text-gray-400">
    Maximum file size: {maxSizeMB} MB
  </p>

  <input
    bind:this={fileInputRef}
    type="file"
    accept={accept}
    class="hidden"
    onchange={handleFileInput}
    tabindex={-1}
    aria-hidden="true"
  />

  {#if errorMessage}
    <div
      class="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700"
      role="alert"
      aria-live="assertive"
    >
      <span class="font-medium">Error:</span>
      {errorMessage}
    </div>
  {/if}
</div>
