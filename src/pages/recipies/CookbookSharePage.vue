<template>
  <section class="mx-auto flex max-w-7xl flex-col gap-6">
    <div
      v-if="loading"
      class="rounded-xl border border-slate-200 bg-white px-4 py-5 text-slate-700 shadow-sm md:px-6"
    >
      <p class="text-sm">Loading shared cookbook…</p>
    </div>

    <div
      v-else-if="error"
      class="rounded-xl border border-slate-200 bg-white px-4 py-5 text-slate-700 shadow-sm md:px-6"
    >
      <p class="text-lg font-semibold text-slate-900">Unable to load shared cookbook</p>
      <p class="mt-1 text-sm">{{ error }}</p>
    </div>

    <div v-else-if="cookbook" class="space-y-6">
      <div class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div class="space-y-2">
            <p class="text-xs font-semibold uppercase tracking-[0.25em] text-orange-600">Shared cookbook</p>
            <h1 class="text-3xl font-bold text-slate-900">{{ cookbook.name }}</h1>
            <p class="text-sm text-slate-600">by {{ ownerName }}</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <span
              class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600"
            >
              <span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: accentColor }"></span>
              <span>{{ recipes.length }} {{ recipes.length === 1 ? 'recipe' : 'recipes' }}</span>
            </span>
            <span
              class="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700"
            >
              Public link
            </span>
          </div>
        </div>
        <p v-if="cookbook.description" class="mt-4 text-slate-700">{{ cookbook.description }}</p>
      </div>

      <div
        v-if="!recipes.length"
        class="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-5 text-sm text-slate-600 shadow-sm"
      >
        No recipes have been added to this cookbook yet.
      </div>

      <div v-else class="grid gap-4 md:grid-cols-[280px_1fr]">
        <aside class="h-max rounded-xl border border-slate-200 bg-white shadow-sm">
          <div class="flex items-center justify-between px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            <span>Recipes</span>
            <span class="text-slate-400">{{ recipes.length }}</span>
          </div>
          <div class="divide-y divide-slate-200">
            <button
              v-for="recipe in recipes"
              :key="recipe.id"
              type="button"
              class="flex w-full items-center justify-between px-4 py-3 text-left text-sm transition hover:bg-orange-50"
              :class="{ 'bg-orange-50 text-orange-800 font-semibold': selectedId === recipe.id }"
              @click="selectedId = recipe.id"
            >
              <span class="truncate">{{ recipe.title }}</span>
              <span class="text-xs text-slate-400">{{ servingsShort(recipe) }}</span>
            </button>
          </div>
        </aside>

        <article
          v-if="selectedRecipe"
          class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100"
        >
          <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div class="space-y-2">
              <h2 class="text-xl font-semibold text-slate-900">{{ selectedRecipe.title }}</h2>
              <p v-if="selectedRecipe.description" class="text-sm text-slate-600">{{ selectedRecipe.description }}</p>
              <p v-if="metaLine(selectedRecipe)" class="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {{ metaLine(selectedRecipe) }}
              </p>
              <div class="flex flex-wrap gap-2">
                <TagPill v-for="tag in selectedRecipe.tags" :key="`${selectedRecipe.id}-${tag}`">
                  <span class="truncate">{{ tag }}</span>
                </TagPill>
                <span v-if="!selectedRecipe.tags?.length" class="text-xs text-slate-400">No tags yet</span>
              </div>
            </div>
            <div
              class="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600"
            >
              <span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: accentColor }"></span>
              <span>{{ servingsLabel(selectedRecipe) }}</span>
            </div>
          </div>

          <div class="mt-4 grid gap-4 md:grid-cols-[1fr_1.2fr]">
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p class="text-sm font-semibold text-slate-900">Ingredients</p>
              <ul class="mt-3 space-y-2 text-sm text-slate-800">
                <li
                  v-for="(item, idx) in selectedRecipe.ingredients"
                  :key="item.id || idx"
                  class="flex flex-wrap items-baseline gap-2"
                >
                  <span class="font-semibold text-slate-900">{{ item.quantity }}</span>
                  <span class="text-slate-700">{{ formatUnit(item.unit, item.quantity) }}</span>
                  <span class="truncate text-slate-800">{{ item.name }}</span>
                </li>
                <li v-if="!selectedRecipe.ingredients?.length" class="text-xs text-slate-500">No ingredients listed.</li>
              </ul>
            </div>

            <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p class="text-sm font-semibold text-slate-900">Steps</p>
              <ol class="mt-3 space-y-3 text-sm text-slate-800">
                <li
                  v-for="(step, index) in selectedRecipe.steps"
                  :key="`${selectedRecipe.id}-step-${index}`"
                  class="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm"
                >
                  <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">Step {{ index + 1 }}</span>
                  <p class="mt-1 leading-relaxed">{{ step || 'No instructions yet.' }}</p>
                </li>
                <li v-if="!selectedRecipe.steps?.length" class="text-xs text-slate-500">No steps yet.</li>
              </ol>
            </div>
          </div>

          <div class="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">
            <p class="font-semibold text-slate-900">Notes</p>
            <p v-if="selectedRecipe.notes" class="mt-2 whitespace-pre-line leading-relaxed">{{ selectedRecipe.notes }}</p>
            <p v-else class="mt-2 text-slate-500">No notes added.</p>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import TagPill from '../../baseComponents/TagPill.vue';

const route = useRoute();

const loading = ref(false);
const error = ref(null);
const cookbook = ref(null);
const recipes = ref([]);
const selectedId = ref('');

const token = computed(() => route.params.token);
const ownerName = computed(() => cookbook.value?.ownerUsername || 'Unknown cook');
const accentColor = computed(() => cookbook.value?.color || '#fb923c');
const selectedRecipe = computed(() => recipes.value.find((r) => r.id === selectedId.value) || recipes.value[0] || null);

const loadShare = async () => {
  if (!token.value) return;
  loading.value = true;
  error.value = null;
  try {
    const res = await fetch(`/api/cookbook-share/${token.value}`, { credentials: 'include' });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data?.error || 'Unable to load cookbook.');
    cookbook.value = data.cookbook;
    recipes.value = data.recipes || [];
    selectedId.value = data.recipes?.[0]?.id || '';
  } catch (err) {
    error.value = err.message || 'Unable to load cookbook.';
  } finally {
    loading.value = false;
  }
};

const formattedDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const metaLine = (recipe) => {
  const parts = [];
  if (recipe?.author) parts.push(recipe.author);
  const created = formattedDate(recipe?.createdAt);
  if (created) parts.push(created);
  return parts.join(' • ');
};

const servingsLabel = (recipe) => {
  const qty = recipe?.servingsQuantity?.toString?.().trim?.() || '';
  const unit = recipe?.servingsUnit?.toString?.().trim?.() || '';
  const combined = [qty, unit].filter(Boolean).join(' ').trim();
  return combined ? `Serves ${combined}` : 'Shared recipe';
};

const servingsShort = (recipe) => {
  const qty = recipe?.servingsQuantity?.toString?.().trim?.() || '';
  const unit = recipe?.servingsUnit?.toString?.().trim?.() || '';
  const combined = [qty, unit].filter(Boolean).join(' ').trim();
  return combined || '—';
};

const abbreviations = {
  tablespoon: 'tbsp',
  tablespoons: 'tbsp',
  tbsp: 'tbsp',
  teaspoon: 'tsp',
  teaspoons: 'tsp',
  tsp: 'tsp',
  gram: 'g',
  grams: 'g',
  kilogram: 'kg',
  kilograms: 'kg',
  ounce: 'oz',
  ounces: 'oz',
  milliliter: 'ml',
  milliliters: 'ml',
  liter: 'l',
  liters: 'l',
  piece: 'pc',
  pieces: 'pc',
  pinch: 'pinch',
};

const parseQuantityNumber = (quantity) => {
  const val = (quantity || '').toString().trim();
  if (!val) return null;
  const parts = val.split(' ');
  let total = 0;
  parts.forEach((part) => {
    if (part.includes('/')) {
      const [num, den] = part.split('/').map(Number);
      if (!Number.isNaN(num) && !Number.isNaN(den) && den !== 0) total += num / den;
    } else {
      const n = Number(part);
      if (!Number.isNaN(n)) total += n;
    }
  });
  return total || null;
};

const formatUnit = (unit, quantity) => {
  const key = (unit || '').toLowerCase().trim();
  if (key === 'cup' || key === 'cups') {
    const qtyNum = parseQuantityNumber(quantity);
    const isSingular = qtyNum === 1;
    return isSingular ? 'cup' : 'cups';
  }
  return abbreviations[key] || unit;
};

watch(
  () => token.value,
  () => loadShare(),
  { immediate: true }
);
</script>
