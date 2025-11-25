<template>
  <aside class="border-b border-slate-200 bg-white/90 backdrop-blur md:border-b-0 md:border-r">
    <div class="flex flex-col gap-4 px-4 py-4">
      <div class="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
        <span>Recipes</span>
        <span class="text-slate-400">{{ totalCount }}</span>
      </div>

      <label class="relative">
        <MagnifyingGlassIcon class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          v-model="searchQuery"
          type="search"
          inputmode="search"
          class="w-full rounded-lg border border-slate-200 bg-white px-9 py-2 text-sm text-slate-900 shadow-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100"
          placeholder="Search recipes..."
          aria-label="Search recipes"
        />
      </label>

      <div v-if="loading" class="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
        Loading recipes...
      </div>
      <div v-else-if="!totalCount" class="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
        No recipes yet. Tap the + to create one.
      </div>
      <div v-else-if="!hasAnyResults" class="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
        No recipes match “{{ searchQuery }}”.
      </div>

      <div v-else class="space-y-3">
        <div class="space-y-1">
          <div class="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            <span>Your recipes</span>
            <span class="text-slate-400">{{ filteredOwned.length }}</span>
          </div>
          <ul class="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white shadow-sm">
            <li v-for="recipe in filteredOwned" :key="recipe.id">
              <RouterLink
                :to="{ name: 'recipe-detail', params: { id: recipe.id } }"
                class="flex items-center gap-2 px-3 py-3 text-sm transition hover:bg-orange-50"
                :class="{ 'bg-orange-50 text-orange-800 font-semibold': activeId === recipe.id }"
              >
                <span class="truncate whitespace-nowrap">{{ recipe.title }}</span>
              </RouterLink>
            </li>
            <li v-if="!filteredOwned.length" class="px-3 py-2 text-xs text-slate-500">No matches.</li>
          </ul>
        </div>

        <div v-if="filteredShared.length" class="space-y-1">
          <div class="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            <span>Shared with you</span>
            <span class="text-slate-400">{{ filteredShared.length }}</span>
          </div>
          <ul class="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white shadow-sm">
            <li v-for="recipe in filteredShared" :key="recipe.id">
              <RouterLink
                :to="{ name: 'recipe-share-view', params: { token: recipe.shareToken } }"
                class="flex items-center gap-2 px-3 py-3 text-sm transition hover:bg-orange-50"
                :class="{ 'bg-orange-50 text-orange-800 font-semibold': activeShareToken === recipe.shareToken }"
              >
                <span class="truncate whitespace-nowrap">{{ recipe.title }}</span>
                <span class="truncate text-xs text-slate-400">• {{ recipe.ownerUsername || 'Shared' }}</span>
              </RouterLink>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { MagnifyingGlassIcon } from '@heroicons/vue/24/outline';

const props = defineProps({
  recipes: {
    type: Array,
    default: () => [],
  },
  sharedRecipes: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  activeId: {
    type: String,
    default: null,
  },
  activeShareToken: {
    type: String,
    default: null,
  },
});

defineEmits(['go-home']);

const searchQuery = ref('');

const mapWithHaystack = (list) =>
  list.map((recipe) => {
    const parts = [
      recipe.title,
      recipe.description,
      recipe.author,
      recipe.notes,
      recipe.ownerUsername,
      ...(recipe.tags || []),
      ...(recipe.ingredients || []).map((item) => `${item.name} ${item.quantity} ${item.unit}`),
      ...(recipe.steps || []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return { ...recipe, _haystack: parts };
  });

const preparedOwned = computed(() => mapWithHaystack(props.recipes));
const preparedShared = computed(() => mapWithHaystack(props.sharedRecipes));

const filteredOwned = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return props.recipes;
  const terms = query.split(/\s+/).filter(Boolean);
  return preparedOwned.value.filter((recipe) => terms.every((term) => recipe._haystack.includes(term)));
});

const filteredShared = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return props.sharedRecipes;
  const terms = query.split(/\s+/).filter(Boolean);
  return preparedShared.value.filter((recipe) => terms.every((term) => recipe._haystack.includes(term)));
});

const totalCount = computed(() => props.recipes.length + props.sharedRecipes.length);
const hasAnyResults = computed(() => filteredOwned.value.length + filteredShared.value.length > 0);
</script>
