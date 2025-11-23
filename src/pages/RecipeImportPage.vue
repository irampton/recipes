<template>
  <section class="mx-auto flex max-w-5xl flex-col gap-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">Import</p>
        <h1 class="text-2xl font-semibold text-slate-900">Import a recipe via LLM</h1>
        <p class="text-sm text-slate-600">Paste any recipe text. We will ask the LLM to extract ingredients and steps.</p>
      </div>
      <RouterLink
        :to="{ name: 'recipe-new' }"
        class="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-200 hover:text-emerald-700"
      >
        Back to create form
      </RouterLink>
    </div>

    <form @submit.prevent="submit" class="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-slate-900">Paste recipe content</h2>
          <p class="text-sm text-slate-600">We will ask for structured JSON with title, tags, ingredients, and steps.</p>
        </div>
        <span v-if="loading" class="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
          <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" stroke-width="1.5" class="opacity-25" />
            <path d="M12 2a10 10 0 0110 10" stroke-width="1.5" stroke-linecap="round" class="opacity-75" />
          </svg>
          Importing…
        </span>
      </div>

      <label class="flex flex-col gap-2">
        <span class="text-sm font-semibold text-slate-800">Raw recipe text</span>
        <textarea
          v-model="text"
          rows="12"
          class="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-slate-900 shadow-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100"
          placeholder="Paste any recipe text, article, or notes here..."
          :disabled="loading"
        ></textarea>
      </label>

      <div class="grid gap-3 rounded-xl border border-dashed border-orange-200 bg-orange-50 p-4 text-sm text-slate-700 md:grid-cols-2">
        <div class="space-y-1">
          <p class="text-xs font-semibold uppercase tracking-wide text-orange-700">What we ask the model</p>
          <ul class="list-disc space-y-1 pl-5">
            <li>Extract title, description, author/source, tags</li>
            <li>Build ingredients with quantity + unit where possible</li>
            <li>Return ordered steps as short instructions</li>
          </ul>
        </div>
        <div class="space-y-1">
          <p class="text-xs font-semibold uppercase tracking-wide text-orange-700">Tips</p>
          <ul class="list-disc space-y-1 pl-5">
            <li>Include the full ingredients and directions text</li>
            <li>Add any personal notes — they will stay in description</li>
            <li>Nothing is saved until you review and click Save</li>
          </ul>
        </div>
      </div>

      <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {{ error }}
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p class="text-sm text-slate-600">We will return to the create form with the extracted details filled in.</p>
        <button
          type="submit"
          class="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="loading"
        >
          <svg v-if="!loading" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 5l7 7-7 7-7-7 7-7z" />
          </svg>
          <svg v-else class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" stroke-width="1.5" class="opacity-25" />
            <path d="M12 2a10 10 0 0110 10" stroke-width="1.5" stroke-linecap="round" class="opacity-75" />
          </svg>
          {{ loading ? 'Importing…' : 'Import via LLM' }}
        </button>
      </div>
    </form>
  </section>
</template>

<script setup>
import { ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { importRecipeFromText } from '../services/importer';
import { useRecipeStore } from '../stores/recipeStore';

const router = useRouter();
const store = useRecipeStore();

const text = ref('');
const loading = ref(false);
const error = ref(null);

const submit = async () => {
  if (!text.value.trim()) {
    error.value = 'Please paste some recipe text first.';
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const recipe = await importRecipeFromText(text.value);
    store.setImportedDraft(recipe);
    router.push({ name: 'recipe-new' });
  } catch (err) {
    error.value = err?.message || 'Something went wrong while importing.';
  } finally {
    loading.value = false;
  }
};
</script>
