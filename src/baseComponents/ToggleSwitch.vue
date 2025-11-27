<template>
  <button
    type="button"
    class="inline-flex items-center"
    :aria-pressed="modelValue"
    :disabled="disabled"
    @click="toggle"
  >
    <span
      class="relative inline-flex h-6 w-10 items-center rounded-full transition-colors duration-200"
      :class="modelValue ? 'bg-orange-500' : 'bg-slate-200'"
    >
      <span
        class="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200"
        :class="modelValue ? 'translate-x-4' : ''"
      ></span>
    </span>
  </button>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue']);

const toggle = () => {
  if (props.disabled) return;
  emit('update:modelValue', !props.modelValue);
};
</script>
