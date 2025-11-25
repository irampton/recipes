<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
    <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
      <div class="flex items-start gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-700">
          <ExclamationTriangleIcon class="h-5 w-5" />
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
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline';

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
