<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
    <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
      <div class="flex items-start gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-700">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v4m0 4h.01M5.07 19h13.86a1 1 0 00.96-1.28l-5.18-14.2a1 1 0 00-1.88 0l-5.18 14.2A1 1 0 005.07 19z" />
          </svg>
        </div>
        <div class="space-y-2">
          <h3 class="text-lg font-semibold text-slate-900">{{ title }}</h3>
          <p class="text-sm text-slate-600">{{ message }}</p>
        </div>
      </div>
      <div class="mt-6 flex items-center justify-end gap-3">
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-orange-200 hover:text-orange-700"
          @click="$emit('cancel')"
        >
          Cancel
        </button>
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-rose-700"
          @click="$emit('confirm')"
        >
          {{ confirmLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: 'Confirm',
  },
  message: {
    type: String,
    default: 'Are you sure?',
  },
  confirmLabel: {
    type: String,
    default: 'Confirm',
  },
});

defineEmits(['cancel', 'confirm']);
</script>
