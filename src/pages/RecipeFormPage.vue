<template>
  <section class="mx-auto flex max-w-5xl flex-col gap-6">
    <div class="flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">{{ isEditing ? 'Edit' : 'Create' }} recipe</p>
          <h1 class="text-2xl font-semibold text-slate-900">{{ isEditing ? 'Update your recipe' : 'Craft something new' }}</h1>
          <p class="text-sm text-slate-600">Fill in the details below and hit save when you are ready.</p>
        </div>
        <div class="flex gap-3">
          <RouterLink
            v-if="isEditing && currentRecipe"
            :to="{ name: 'recipe-detail', params: { id: currentRecipe.id } }"
            class="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-200 hover:text-emerald-700"
          >
            Cancel
          </RouterLink>
          <RouterLink
            v-else
            :to="{ name: 'home' }"
            class="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-200 hover:text-emerald-700"
          >
            Cancel
          </RouterLink>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="isSaving"
            @click="save"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 13l4 4L19 7" />
            </svg>
            {{ isSaving ? 'Saving…' : 'Save recipe' }}
          </button>
        </div>
      </div>
      <div v-if="store.state.error" class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {{ store.state.error }}
      </div>
      <div class="grid gap-4 md:grid-cols-2">
        <label class="flex flex-col gap-2">
          <span class="text-sm font-semibold text-slate-800">Title</span>
          <input
            v-model="form.title"
            type="text"
            class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100"
            placeholder="Grilled Lemon Chicken"
          />
        </label>
        <label class="flex flex-col gap-2">
          <span class="text-sm font-semibold text-slate-800">Author / Source</span>
          <input
            v-model="form.author"
            type="text"
            class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100"
            placeholder="Grandma June, Bon Appetit…"
          />
        </label>
        <label class="col-span-full flex flex-col gap-2">
          <span class="text-sm font-semibold text-slate-800">Description</span>
          <textarea
            v-model="form.description"
            rows="3"
            class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100"
            placeholder="A quick summary of flavor, notes, or when to serve."
          ></textarea>
        </label>
        <label class="flex flex-col gap-2">
          <span class="text-sm font-semibold text-slate-800">Date created</span>
          <input
            v-model="form.createdAt"
            type="date"
            class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100"
          />
        </label>
        <label class="flex flex-col gap-2">
          <span class="text-sm font-semibold text-slate-800">Tags (comma separated)</span>
          <input
            v-model="tagInput"
            type="text"
            class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100"
            placeholder="weeknight, vegetarian, pasta"
          />
        </label>
      </div>
    </div>

    <div class="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-slate-900">Ingredients</h2>
        <span class="text-xs font-semibold uppercase tracking-wide text-slate-400">Add as many as you need</span>
      </div>

      <div class="space-y-3">
        <div
          v-for="(ingredient, index) in form.ingredients"
          :key="ingredient.id"
          class="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm md:grid-cols-[2fr_1fr_1fr_auto]"
        >
          <label class="flex flex-col gap-1 text-sm font-semibold text-slate-800">
            Name
            <input
              v-model="ingredient.name"
              type="text"
              class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100"
              placeholder="Flour"
            />
          </label>
          <label class="flex flex-col gap-1 text-sm font-semibold text-slate-800">
            Quantity
            <input
              v-model="ingredient.quantity"
              type="text"
              class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100"
              placeholder="1 1/2"
            />
          </label>
          <label class="flex flex-col gap-1 text-sm font-semibold text-slate-800">
            Unit
            <select
              v-model="ingredient.unit"
              class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100"
            >
              <option value="">Select</option>
              <option v-for="unit in units" :key="unit" :value="unit">{{ unit }}</option>
            </select>
          </label>
          <div class="flex items-end">
            <button
              type="button"
              class="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-transparent px-3 py-2 text-sm font-semibold text-slate-600 transition hover:text-rose-700 md:w-auto"
              :disabled="form.ingredients.length === 1"
              @click="removeIngredient(index)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18 6L6 18M6 6l12 12" />
              </svg>
              Remove
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
      class="inline-flex items-center gap-2 rounded-lg border border-dashed border-orange-300 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 transition hover:bg-orange-100"
      @click="addIngredient"
    >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add ingredient
      </button>
    </div>

    <div class="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-slate-900">Steps</h2>
        <span class="text-xs font-semibold uppercase tracking-wide text-slate-400">Add steps in order</span>
      </div>

      <div class="space-y-3">
        <div
          v-for="(step, index) in form.steps"
          :key="index"
          class="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm"
        >
          <span
            class="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-orange-300 bg-orange-50 text-sm font-semibold text-orange-700"
          >
            {{ index + 1 }}
          </span>
          <textarea
            v-model="form.steps[index]"
            rows="2"
            class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100"
            placeholder="Write the step here"
          ></textarea>
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-lg border border-transparent px-2 py-1 text-slate-500 transition hover:text-rose-700"
            :disabled="form.steps.length === 1"
            @click="removeStep(index)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-lg border border-dashed border-orange-300 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 transition hover:bg-orange-100"
        @click="addStep"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add another step
      </button>
    </div>

    <div class="flex flex-col items-stretch gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 md:flex-row md:items-center md:justify-between">
      <span class="text-sm text-slate-600">All set? Save your recipe when you're ready.</span>
      <button
        type="button"
        class="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="isSaving"
        @click="save"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 13l4 4L19 7" />
        </svg>
        {{ isSaving ? 'Saving…' : 'Save recipe' }}
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { useRecipeStore } from '../stores/recipeStore';

const store = useRecipeStore();
const route = useRoute();
const router = useRouter();

const today = new Date().toISOString().slice(0, 10);
const makeId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
const blankIngredient = () => ({
  id: makeId(),
  name: '',
  quantity: '',
  unit: '',
});

const form = reactive({
  title: '',
  description: '',
  author: '',
  createdAt: today,
  ingredients: [blankIngredient()],
  steps: [''],
});

const tagInput = ref('');
const isSaving = ref(false);

const currentRecipe = computed(() => store.getRecipeById(route.params.id));
const isEditing = computed(() => Boolean(route.params.id));
const units = ['cup', 'tbsp', 'tsp', 'g', 'kg', 'oz', 'ml', 'l', 'piece', 'pinch'];

const hydrateForm = () => {
  if (!isEditing.value || !currentRecipe.value) return;
  const data = currentRecipe.value;
  form.title = data.title || '';
  form.description = data.description || '';
  form.author = data.author || '';
  form.createdAt = data.createdAt ? new Date(data.createdAt).toISOString().slice(0, 10) : today;
  form.ingredients = (data.ingredients || []).map((item) => ({
    id: item.id || makeId(),
    name: item.name || '',
    quantity: item.quantity ?? '',
    unit: item.unit || '',
  }));
  if (!form.ingredients.length) {
    form.ingredients.push(blankIngredient());
  }
  form.steps = (data.steps && data.steps.length ? [...data.steps] : ['']).map((step) => step || '');
  tagInput.value = (data.tags || []).join(', ');
};

watch(
  () => currentRecipe.value,
  () => hydrateForm(),
  { immediate: true }
);

const addIngredient = () => {
  form.ingredients.push(blankIngredient());
};

const removeIngredient = (index) => {
  if (form.ingredients.length === 1) return;
  form.ingredients.splice(index, 1);
};

const addStep = () => {
  form.steps.push('');
};

const removeStep = (index) => {
  if (form.steps.length === 1) return;
  form.steps.splice(index, 1);
};

const buildPayload = () => {
  const tags = tagInput.value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

  const ingredients = form.ingredients
    .filter((item) => item.name || item.quantity || item.unit)
    .map((item) => ({
      id: item.id || makeId(),
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
    }));

  const steps = form.steps.map((step) => step.trim()).filter(Boolean);

  return {
    ...(isEditing.value && currentRecipe.value ? { id: currentRecipe.value.id } : {}),
    title: form.title,
    description: form.description,
    author: form.author,
    createdAt: form.createdAt ? new Date(form.createdAt).toISOString() : new Date().toISOString(),
    tags,
    ingredients,
    steps,
  };
};

const save = async () => {
  try {
    isSaving.value = true;
    const payload = buildPayload();
    const saved = await store.saveRecipe(payload);
    router.push({ name: 'recipe-detail', params: { id: saved.id } });
  } catch (error) {
    console.error(error);
  } finally {
    isSaving.value = false;
  }
};
</script>
