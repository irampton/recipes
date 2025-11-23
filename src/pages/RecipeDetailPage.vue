<template>
  <section class="mx-auto flex max-w-5xl flex-col gap-6">
    <div
      v-if="store.state.loading && !store.state.ready"
      class="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm"
    >
      Loading recipe…
    </div>

    <div
      v-else-if="!recipe"
      class="rounded-xl border border-slate-200 bg-white px-4 py-5 text-slate-700 shadow-sm md:px-6"
    >
      <p class="text-lg font-semibold text-slate-900">Recipe not found</p>
      <p class="mt-1 text-sm">It might have been removed or not saved yet. Create a new one to get started.</p>
      <div class="mt-4 flex gap-3">
        <RouterLink
          :to="{ name: 'recipe-new' }"
          class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
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

    <div v-else class="space-y-6">
      <div class="flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 md:flex-row md:items-start md:justify-between">
        <div class="space-y-3">
          <div class="flex flex-wrap items-center gap-3">
            <span class="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">Recipe</span>
            <span class="text-xs text-slate-500">{{ metaLine }}</span>
          </div>
          <h1 class="text-3xl font-bold text-slate-900">{{ recipe.title }}</h1>
          <p class="text-slate-600" v-if="recipe.description">{{ recipe.description }}</p>
        </div>
        <button
          type="button"
          class="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-orange-300 hover:text-orange-700 active:scale-95"
          @click="editRecipe"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 17.25V20h2.75L17.81 8.94l-2.75-2.75L4 17.25z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.06 6.19l2.75 2.75" />
          </svg>
          Edit
        </button>
      </div>

      <div class="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-slate-900">Ingredients</h2>
            <span class="text-xs font-semibold uppercase tracking-wide text-slate-400">What you'll need</span>
          </div>
          <ul class="mt-4 space-y-3">
            <li
              v-for="item in recipe.ingredients"
              :key="item.id"
              class="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
            >
              <span class="font-semibold text-slate-900">
                {{ item.quantity }} <span v-if="item.unit">{{ item.unit }}</span>
              </span>
              <span class="truncate">{{ item.name }}</span>
            </li>
            <li v-if="!recipe.ingredients?.length" class="text-sm text-slate-500">No ingredients added yet.</li>
          </ul>
        </div>

        <div class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-slate-900">Details</h2>
            <span class="text-xs font-semibold uppercase tracking-wide text-slate-400">Edit tags inline</span>
          </div>
          <dl class="grid gap-3 text-sm text-slate-700">
            <div>
              <dt class="text-xs uppercase tracking-wide text-slate-500">Author / Source</dt>
              <dd class="font-medium text-slate-900">{{ recipe.author || 'Unknown' }}</dd>
            </div>
            <div>
              <dt class="text-xs uppercase tracking-wide text-slate-500">Created</dt>
              <dd class="font-medium text-slate-900">{{ formattedDate }}</dd>
            </div>
          </dl>

          <div class="space-y-2">
            <div class="flex flex-wrap items-center gap-2">
              <TagPill v-for="tag in recipe.tags" :key="`${recipe.id}-${tag}`">
                <template #default>
                  <span class="truncate">{{ tag }}</span>
                  <button
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
      </div>

      <div class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-slate-900">Directions</h2>
          <span class="text-xs font-semibold uppercase tracking-wide text-slate-400">Step-by-step</span>
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
  </section>
</template>

<script setup>
import { computed, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import TagPill from '../components/TagPill.vue';
import { useRecipeStore } from '../stores/recipeStore';

const store = useRecipeStore();
const route = useRoute();
const router = useRouter();

const recipe = computed(() => store.getRecipeById(route.params.id));
const tagInput = ref('');
const showTagInput = ref(false);

const formattedDate = computed(() => {
  if (!recipe.value?.createdAt) return 'Not set';
  const date = new Date(recipe.value.createdAt);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
});

const metaLine = computed(() => {
  const author = recipe.value?.author || 'Unknown author';
  return `${author} • ${formattedDate.value}`;
});

const editRecipe = () => {
  if (recipe.value) {
    router.push({ name: 'recipe-edit', params: { id: recipe.value.id } });
  }
};

const persistTags = async (tags) => {
  if (!recipe.value) return;
  try {
    await store.saveRecipe({ ...recipe.value, tags });
  } catch (error) {
    console.error(error);
  }
};

const toggleTagInput = () => {
  showTagInput.value = !showTagInput.value;
};

const closeTagInput = () => {
  showTagInput.value = false;
  tagInput.value = '';
};

const confirmTag = () => {
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
  if (!recipe.value) return;
  const tags = (recipe.value.tags || []).filter((t) => t !== tag);
  persistTags(tags);
};
</script>
