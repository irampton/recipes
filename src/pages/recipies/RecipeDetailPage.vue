<template>
  <section class="mx-auto flex max-w-5xl flex-col gap-6">
    <div
      v-if="!isShareRoute && store.state.loading && !store.state.ready"
      class="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm"
    >
      Loading recipe…
    </div>

    <div v-else-if="isShareRoute && shareLoading" class="rounded-xl border border-slate-200 bg-white px-4 py-5 text-slate-700 shadow-sm md:px-6">
      <p class="text-sm">Loading shared recipe…</p>
    </div>

    <div
      v-else-if="!recipe && !isShareRoute"
      class="rounded-xl border border-slate-200 bg-white px-4 py-5 text-slate-700 shadow-sm md:px-6"
    >
      <p class="text-lg font-semibold text-slate-900">Recipe not found</p>
      <p class="mt-1 text-sm">It might have been removed or not saved yet. Create a new one to get started.</p>
      <div class="mt-4 flex gap-3">
        <RouterLink
          :to="{ name: 'recipe-new' }"
          class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700"
        >
          <PlusIcon class="h-4 w-4" />
          Create recipe
        </RouterLink>
        <RouterLink
          :to="{ name: 'home' }"
          class="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-200 hover:text-emerald-700"
        >
          Go home
        </RouterLink>
      </div>
    </div>

    <div v-else-if="shareError" class="rounded-xl border border-slate-200 bg-white px-4 py-5 text-slate-700 shadow-sm md:px-6">
      <p class="text-lg font-semibold text-slate-900">Unable to load shared recipe</p>
      <p class="mt-1 text-sm">{{ shareError }}</p>
    </div>

    <div v-else class="space-y-6">
      <div class="flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 md:flex-row md:items-start md:justify-between">
        <div class="space-y-4">
          <h1 class="text-3xl font-bold text-slate-900">{{ recipe.title }}</h1>
          <p v-if="metaLine" class="text-sm text-slate-600">{{ metaLine }}</p>
          <p class="text-slate-600" v-if="recipe.description">{{ recipe.description }}</p>
          <div class="space-y-2">
            <div class="flex flex-wrap items-center gap-2">
              <TagPill v-for="tag in recipe.tags" :key="`${recipe.id}-${tag}`">
                <template #default>
                  <span class="truncate">{{ tag }}</span>
                  <button
                    v-if="canEditRecipe"
                    type="button"
                    class="hidden h-4 w-4 items-center justify-center rounded-full bg-orange-200 text-orange-800 hover:bg-orange-300 group-hover:flex"
                    @click="removeTag(tag)"
                    title="Remove tag"
                  >
                    ×
                  </button>
                </template>
              </TagPill>
              <button
                v-if="canEditRecipe"
                type="button"
                class="relative inline-flex items-center justify-center rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-700 shadow-sm transition hover:bg-orange-100"
                title="Add tag"
                @click="toggleTagInput"
              >
                +
              </button>
              <span v-if="!recipe.tags?.length" class="text-xs text-slate-500">No tags yet</span>
            </div>
            <div
              v-if="showTagInput"
              class="relative inline-block"
            >
              <div class="absolute z-10 mt-2 w-52 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
                <div class="flex flex-col gap-2">
                  <input
                    v-model="tagInput"
                    type="text"
                    class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100"
                    placeholder="Type a tag"
                    @keyup.enter="confirmTag"
                    autofocus
                  />
                  <div class="flex gap-2">
                    <button
                      type="button"
                      class="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-orange-600 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-orange-700"
                      @click="confirmTag"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      class="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-orange-200 hover:text-orange-700"
                      @click="closeTagInput"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="canEditRecipe" class="inline-flex overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm">
          <button
            type="button"
            class="inline-flex h-10 items-center justify-center px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-orange-700 active:scale-95"
            @click="editRecipe"
            title="Edit recipe"
          >
            <PencilSquareIcon class="h-4 w-4" />
          </button>
          <button
            type="button"
            class="inline-flex h-10 items-center justify-center border-l border-r border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-orange-700 active:scale-95"
            title="Share recipe"
            @click="shareDialogOpen = true"
          >
            <ShareIcon class="h-4 w-4" />
          </button>
          <button
            type="button"
            class="inline-flex h-10 items-center justify-center px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 hover:text-rose-800 active:scale-95"
            @click="openDeleteDialog"
            title="Delete recipe"
          >
            <TrashIcon class="h-4 w-4" />
          </button>
        </div>
        <RouterLink
          v-else-if="sharePermissions.canEdit"
          :to="{ name: 'recipe-share-edit', params: { token: route.params.token } }"
          class="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-orange-300 hover:text-orange-700 active:scale-95"
          title="Edit shared recipe"
        >
          <PencilSquareIcon class="h-4 w-4" />
        </RouterLink>
      </div>

      <div class="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <div class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-slate-900">Ingredients</h2>
          </div>
          <div class="mt-4 rounded-xl border border-slate-200">
            <ul class="divide-y divide-slate-200 text-sm text-slate-800">
              <li
                v-for="(item, idx) in recipe.ingredients"
                :key="item.id || idx"
                class="grid grid-cols-[2.5em_3em_1fr] items-center gap-2 px-4 py-2"
              >
                <span class="font-semibold text-slate-900 text-right">{{ item.quantity }}</span>
                <span
                  class="truncate text-slate-700 text-left"
                  :title="item.unit"
                >
                  {{ formatUnit(item.unit, item.quantity) }}
                </span>
                <span class="truncate" :title="item.name">{{ item.name }}</span>
              </li>
              <li v-if="!recipe.ingredients?.length" class="px-4 py-3 text-sm text-slate-500">No ingredients added yet.</li>
            </ul>
          </div>
        </div>

        <div class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-slate-900">Directions</h2>
          </div>
          <ol class="mt-4 space-y-4">
            <li
              v-for="(step, index) in recipe.steps"
              :key="`${recipe.id}-step-${index}`"
              class="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 shadow-sm"
            >
              <div class="flex flex-col gap-1 min-h-[56px]">
                <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">Step {{ index + 1 }}</span>
                <p class="leading-relaxed">{{ step || 'No instructions yet.' }}</p>
              </div>
            </li>
            <li v-if="!recipe.steps?.length" class="text-sm text-slate-500">No steps added yet.</li>
          </ol>
        </div>
      </div>

      <div class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-slate-900">Notes</h2>
        </div>
        <div class="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800">
          <p v-if="recipe.notes" class="whitespace-pre-line leading-relaxed">{{ recipe.notes }}</p>
          <p v-else class="text-slate-500">No notes added yet.</p>
        </div>
      </div>

      <ConfirmDialog
        :open="showDeleteConfirm"
        title="Delete this recipe?"
        message="This will permanently remove the recipe. This cannot be undone."
        confirm-label="Delete"
        @cancel="cancelDelete"
        @confirm="confirmDelete"
      />
      <ShareDialog v-if="canEditRecipe && recipe" :open="shareDialogOpen" :recipe-id="recipe.id" @close="shareDialogOpen = false" />
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { PencilSquareIcon, PlusIcon, ShareIcon, TrashIcon } from '@heroicons/vue/24/outline';
import TagPill from '../../baseComponents/TagPill.vue';
import ConfirmDialog from '../../baseComponents/ConfirmDialog.vue';
import ShareDialog from '../../components/ShareDialog.vue';
import { useRecipeStore } from '../../stores/recipeStore.js';

const store = useRecipeStore();
const route = useRoute();
const router = useRouter();

const shareDialogOpen = ref(false);
const sharedRecipe = ref(null);
const sharePermissions = ref({ canEdit: false, type: null });
const shareError = ref(null);
const shareLoading = ref(false);
const isShareRoute = computed(() => route.name === 'recipe-share-view');
const shareToken = computed(() => route.params.token);

const recipe = computed(() => (isShareRoute.value ? sharedRecipe.value : store.getRecipeById(route.params.id)));
const canEditRecipe = computed(() => !isShareRoute.value && (recipe.value?.canEdit !== false));
const tagInput = ref('');
const showTagInput = ref(false);
const showDeleteConfirm = ref(false);
const deleting = ref(false);

const servingSize = computed(() => {
  const quantity = recipe.value?.servingsQuantity?.toString?.().trim() || '';
  const unit = recipe.value?.servingsUnit?.toString?.().trim() || '';
  const combined = [quantity, unit].filter(Boolean).join(' ').trim();
  return combined || '';
});

const formattedDate = computed(() => {
  if (!recipe.value?.createdAt) return '';
  const date = new Date(recipe.value.createdAt);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
});

const metaLine = computed(() => {
  const parts = [];
  if (recipe.value?.author) parts.push(recipe.value.author);
  if (formattedDate.value) parts.push(formattedDate.value);
  if (servingSize.value) parts.push(`Serves ${servingSize.value}`);
  return parts.join(' - ');
});

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
  // handle mixed numbers like "1 1/2"
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

const openDeleteDialog = () => {
  if (!canEditRecipe.value) return;
  showDeleteConfirm.value = true;
};

const cancelDelete = () => {
  showDeleteConfirm.value = false;
};

const confirmDelete = async () => {
  if (!recipe.value || !canEditRecipe.value) return;
  deleting.value = true;
  try {
    await store.deleteRecipe(recipe.value.id);
    router.push({ name: 'home' });
  } catch (error) {
    console.error(error);
  } finally {
    deleting.value = false;
    showDeleteConfirm.value = false;
  }
};

const editRecipe = () => {
  if (!recipe.value) return;
  if (isShareRoute.value && sharePermissions.value.canEdit) {
    router.push({ name: 'recipe-share-edit', params: { token: shareToken.value } });
    return;
  }
  if (!canEditRecipe.value) return;
  router.push({ name: 'recipe-edit', params: { id: recipe.value.id } });
};

const persistTags = async (tags) => {
  if (!canEditRecipe.value) return;
  if (!recipe.value) return;
  try {
    await store.saveRecipe({ ...recipe.value, tags });
  } catch (error) {
    console.error(error);
  }
};

const toggleTagInput = () => {
  if (!canEditRecipe.value) return;
  showTagInput.value = !showTagInput.value;
};

const closeTagInput = () => {
  showTagInput.value = false;
  tagInput.value = '';
};

const confirmTag = () => {
  if (!canEditRecipe.value) return;
  const value = tagInput.value.trim();
  if (!value || !recipe.value) {
    closeTagInput();
    return;
  }
  const tags = Array.from(new Set([...(recipe.value.tags || []), value]));
  tagInput.value = '';
  showTagInput.value = false;
  persistTags(tags);
};

const removeTag = (tag) => {
  if (!canEditRecipe.value) return;
  if (!recipe.value) return;
  const tags = (recipe.value.tags || []).filter((t) => t !== tag);
  persistTags(tags);
};

const loadSharedRecipe = async () => {
  if (!shareToken.value || !isShareRoute.value) return;
  shareLoading.value = true;
  shareError.value = null;
  try {
    const res = await fetch(`/api/share/${shareToken.value}`, { credentials: 'include' });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data?.error || 'Unable to load shared recipe.');
    sharedRecipe.value = data.recipe;
    sharePermissions.value = data.permissions || { canEdit: false, type: null };
  } catch (error) {
    shareError.value = error.message || 'Unable to load shared recipe.';
  } finally {
    shareLoading.value = false;
  }
};

watch(
  () => shareToken.value,
  () => loadSharedRecipe(),
  { immediate: true }
);
</script>
