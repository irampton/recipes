<template>
  <div class="relative" data-user-autocomplete>
    <div class="flex items-center gap-2">
      <input
        v-model="query"
        type="text"
        class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100"
        placeholder="Search by username"
        @focus="open = true"
        @keydown.down.prevent="highlight(+1)"
        @keydown.up.prevent="highlight(-1)"
        @keydown.enter.prevent="selectHighlighted"
      />
      <button
        v-if="modelValue"
        type="button"
        class="text-xs font-semibold text-slate-500 hover:text-rose-600"
        @click="clearSelection"
      >
        Clear
      </button>
    </div>
    <div
      v-if="open && results.length"
      class="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
    >
      <button
        v-for="(user, idx) in results"
        :key="user.id"
        type="button"
        class="flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm transition hover:bg-orange-50"
        :class="{ 'bg-orange-50': idx === highlighted }"
        @click="select(user)"
      >
        <span class="font-semibold text-slate-800">{{ user.username }}</span>
      </button>
    </div>
    <p v-if="modelValue" class="mt-1 text-xs text-slate-600">
      Selected: <span class="font-semibold text-slate-800">{{ modelValue.username }}</span>
    </p>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: Object,
    default: null,
  },
  friendsOnly: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue']);

const query = ref('');
const results = ref([]);
const open = ref(false);
const highlighted = ref(-1);
let debounceId = null;

const fetchUsers = async (value) => {
  if (!value || !value.trim()) {
    results.value = [];
    return;
  }
  try {
    const scope = props.friendsOnly ? '&scope=friends' : '';
    const res = await fetch(`/api/users/search?q=${encodeURIComponent(value.trim())}${scope}`, { credentials: 'include' });
    const data = await res.json();
    if (res.ok && data.success) {
      results.value = data.users || [];
      highlighted.value = results.value.length ? 0 : -1;
    } else {
      results.value = [];
    }
  } catch {
    results.value = [];
  }
};

watch(
  () => query.value,
  (value) => {
    if (debounceId) clearTimeout(debounceId);
    debounceId = setTimeout(() => fetchUsers(value), 200);
  }
);

const select = (user) => {
  emit('update:modelValue', user);
  open.value = false;
};

const clearSelection = () => {
  emit('update:modelValue', null);
  query.value = '';
  results.value = [];
};

const highlight = (delta) => {
  if (!results.value.length) return;
  highlighted.value = (highlighted.value + delta + results.value.length) % results.value.length;
};

const selectHighlighted = () => {
  if (highlighted.value >= 0 && highlighted.value < results.value.length) {
    select(results.value[highlighted.value]);
  }
};

const handleClick = (event) => {
  if (!(event.target.closest && event.target.closest('[data-user-autocomplete]'))) {
    open.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClick);
});

onBeforeUnmount(() => {
  if (debounceId) clearTimeout(debounceId);
  document.removeEventListener('click', handleClick);
});
</script>
