<template>
  <aside class="border-b border-slate-200 bg-white/90 backdrop-blur md:border-b-0 md:border-r">
    <div class="flex items-center justify-between border-b border-slate-200 px-4 py-4 md:h-20 md:py-0">
      <button type="button" class="flex flex-col text-left" @click="$emit('go-home')" title="Home">
        <span class="text-sm font-semibold text-slate-900">Lembas</span>
        <span class="text-xs text-slate-500">Recipies worth sharing</span>
      </button>
      <div class="inline-flex overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm">
        <button
          type="button"
          class="inline-flex h-9 items-center gap-2 border-r border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:text-orange-700"
          @click="$emit('go-home')"
          title="Home"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 12l9-8 9 8M5 10v10h4V14h6v6h4V10" />
          </svg>
        </button>
        <RouterLink
          :to="{ name: 'recipe-new' }"
          class="inline-flex h-9 items-center justify-center border-l border-slate-200 bg-orange-600 px-3 text-xs font-semibold text-white transition hover:bg-orange-700 hover:shadow-lg hover:shadow-orange-200 active:scale-95"
          title="Create recipe"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </RouterLink>
      </div>
    </div>

    <div class="flex flex-col gap-4 px-4 py-4">
      <div class="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
        <span>Recipes</span>
        <span class="text-slate-400">{{ recipes.length }}</span>
      </div>

      <div v-if="loading" class="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
        Loading recipes...
      </div>
      <div
        v-else-if="!recipes.length"
        class="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
      >
        No recipes yet. Tap the + to create one.
      </div>

      <ul class="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white shadow-sm">
        <li v-for="recipe in recipes" :key="recipe.id">
          <RouterLink
            :to="{ name: 'recipe-detail', params: { id: recipe.id } }"
            class="flex items-center gap-2 px-3 py-3 text-sm transition hover:bg-orange-50"
            :class="{ 'bg-orange-50 text-orange-800 font-semibold': activeId === recipe.id }"
          >
            <span class="truncate whitespace-nowrap">{{ recipe.title }}</span>
          </RouterLink>
        </li>
      </ul>
    </div>
  </aside>
</template>

<script setup>
import { RouterLink } from 'vue-router';

defineProps({
  recipes: {
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
});

defineEmits(['go-home']);
</script>
