<template>
  <span
    class="group inline-flex max-w-full items-center gap-1 truncate rounded-full border border-orange-100 bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-700"
  >
    <slot>
      <span class="block truncate">{{ label }}</span>
    </slot>
  </span>
</template>

<script setup>
defineProps({
  label: {
    type: String,
    default: '',
  },
});
</script>
