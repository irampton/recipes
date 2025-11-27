<template>
  <section class="mx-auto flex max-w-5xl flex-col gap-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">Import</p>
        <h1 class="text-2xl font-semibold text-slate-900">Import a recipe via LLM</h1>
        <p class="text-sm text-slate-600">Paste recipe text or upload a photo. We will extract the text and ask the LLM to build a recipe.</p>
      </div>
      <RouterLink
        :to="{ name: 'recipe-new' }"
        class="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-200 hover:text-emerald-700"
      >
        Back to create form
      </RouterLink>
    </div>

    <div
      v-if="settingsLoading"
      class="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
    >
      Checking LLM import availability…
    </div>
    <div
      v-else-if="settingsReady && !llmAvailable"
      class="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
    >
      LLM import is currently disabled or not configured. Ask an admin to enable it in Server settings.
    </div>

    <form @submit.prevent="submit" class="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-slate-900">Paste recipe content</h2>
          <p class="text-sm text-slate-600">We will ask for structured JSON with title, tags, ingredients, steps, serving size, and notes.</p>
        </div>
        <span v-if="loading" class="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
          <ArrowPathIcon class="h-4 w-4 animate-spin" />
          Importing…
        </span>
      </div>

      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold text-slate-800">Recipe image (optional)</span>
            <button
              v-if="imageData"
              type="button"
              class="text-xs font-semibold text-slate-600 hover:text-slate-800"
              @click="clearImage"
            >
              Remove
            </button>
          </div>
          <label
            :class="[
              'flex min-h-[196px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600 transition hover:border-orange-200 hover:bg-orange-50',
              isDragging ? 'border-orange-300 bg-orange-50 ring-2 ring-orange-100' : '',
            ]"
            @dragover.prevent="onDragOver"
            @dragleave.prevent="onDragLeave"
            @drop.prevent="onDrop"
          >
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              class="sr-only"
              :disabled="loading || !llmAvailable || !settingsReady"
              @change="onImageChange"
            />
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
              <span class="text-lg font-semibold text-slate-700">+</span>
            </div>
            <div>
              <p class="font-semibold text-slate-800">Upload or drop a photo of the recipe</p>
              <p class="text-xs text-slate-500">Clear shots of cards or magazines work best. JPG, PNG, or WEBP.</p>
            </div>
            <p v-if="imageName" class="text-xs font-semibold text-orange-700">Selected: {{ imageName }}</p>
            <p v-else class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Drag & drop an image</p>
          </label>

          <div
            v-if="imageData"
            class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ring-1 ring-orange-50"
          >
            <img :src="imageData" alt="Selected recipe" class="max-h-80 w-full object-cover" />
          </div>
        </div>

        <label class="flex flex-col gap-2">
          <span class="text-sm font-semibold text-slate-800">Raw recipe text</span>
          <textarea
            v-model="text"
            rows="12"
            class="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-slate-900 shadow-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100"
            placeholder="Paste any recipe text, article, or notes here... (optional if you upload a photo)"
            :disabled="loading || !llmAvailable || !settingsReady"
          ></textarea>
        </label>
      </div>

      <div class="grid gap-3 rounded-xl border border-dashed border-orange-200 bg-orange-50 p-4 text-sm text-slate-700 md:grid-cols-2">
        <div class="space-y-1">
          <p class="text-xs font-semibold uppercase tracking-wide text-orange-700">What we ask the model</p>
          <ul class="list-disc space-y-1 pl-5">
            <li>Extract title, description, author/source, tags</li>
            <li>Build ingredients with quantity + unit where possible</li>
            <li>Return ordered steps as short instructions</li>
            <li>Collect serving size (quantity + unit text) and any cook's notes</li>
          </ul>
        </div>
        <div class="space-y-1">
          <p class="text-xs font-semibold uppercase tracking-wide text-orange-700">Tips</p>
          <ul class="list-disc space-y-1 pl-5">
            <li>Include the full ingredients and directions text if you paste</li>
            <li>Upload a sharp, well-lit image for better OCR results</li>
            <li>Add any personal notes — they will populate notes</li>
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
          class="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="loading || !llmAvailable || !settingsReady"
        >
          <ArrowDownTrayIcon v-if="!loading" class="h-4 w-4" />
          <ArrowPathIcon v-else class="h-4 w-4 animate-spin" />
          {{ loading ? 'Importing…' : 'Import via LLM' }}
        </button>
      </div>
    </form>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { ArrowDownTrayIcon, ArrowPathIcon } from '@heroicons/vue/24/outline';
import { importRecipeFromText } from '../../services/importer.js';
import { useRecipeStore } from '../../stores/recipeStore.js';
import { useSettingsStore } from '../../stores/settingsStore.js';

const router = useRouter();
const store = useRecipeStore();
const settingsStore = useSettingsStore();

const text = ref('');
const imageData = ref('');
const imageName = ref('');
const fileInput = ref(null);
const isDragging = ref(false);
const loading = ref(false);
const error = ref(null);
const llmAvailable = computed(() => settingsStore.isLlmEnabled());
const settingsReady = computed(() => settingsStore.state.ready);
const settingsLoading = computed(() => settingsStore.state.loading && !settingsStore.state.ready);

const processFile = (file) => {
  error.value = null;
  if (!file) {
    imageData.value = '';
    imageName.value = '';
    return;
  }

  if (!file.type.startsWith('image/')) {
    error.value = 'Please choose an image file.';
    if (fileInput.value) fileInput.value.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    imageData.value = reader.result?.toString() || '';
    imageName.value = file.name;
    if (fileInput.value) fileInput.value.value = '';
  };
  reader.onerror = () => {
    error.value = 'We could not read that image file.';
    imageData.value = '';
    imageName.value = '';
    if (fileInput.value) fileInput.value.value = '';
  };
  reader.readAsDataURL(file);
};

const onImageChange = (event) => {
  const file = event.target?.files?.[0];
  if (!file) {
    imageData.value = '';
    imageName.value = '';
    return;
  }
  processFile(file);
};

const onDragOver = () => {
  if (loading.value || !llmAvailable.value || !settingsReady.value) return;
  isDragging.value = true;
};

const onDragLeave = () => {
  isDragging.value = false;
};

const onDrop = (event) => {
  isDragging.value = false;
  if (loading.value || !llmAvailable.value || !settingsReady.value) return;
  const file = event.dataTransfer?.files?.[0];
  if (!file) return;
  processFile(file);
};

const clearImage = () => {
  imageData.value = '';
  imageName.value = '';
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const submit = async () => {
  if (!settingsReady.value) {
    error.value = 'Still loading settings. Please try again.';
    return;
  }

  if (!llmAvailable.value) {
    error.value = 'LLM import is disabled right now.';
    return;
  }

  if (!text.value.trim() && !imageData.value) {
    error.value = 'Please paste some recipe text or upload a photo.';
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const recipe = await importRecipeFromText({
      text: text.value,
      imageBase64: imageData.value || undefined,
    });
    store.setImportedDraft(recipe);
    router.push({ name: 'recipe-new' });
  } catch (err) {
    error.value = err?.message || 'Something went wrong while importing.';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  settingsStore.loadSettings();
});
</script>
