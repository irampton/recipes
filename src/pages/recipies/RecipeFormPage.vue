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
            v-if="!isEditing && llmAvailable"
            :to="{ name: 'recipe-import' }"
            class="inline-flex items-center gap-2 rounded-lg border border-emerald-600 bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700"
          >
            <ArrowDownTrayIcon class="h-4 w-4" />
            Import via LLM
          </RouterLink>
          <RouterLink
            v-if="isShareEdit && shareToken"
            :to="{ name: 'recipe-share-view', params: { token: shareToken } }"
            class="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-200 hover:text-emerald-700"
          >
            Cancel
          </RouterLink>
          <RouterLink
            v-else-if="isEditing && currentRecipe"
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
            <CheckIcon class="h-4 w-4" />
            {{ isSaving ? 'Saving…' : 'Save recipe' }}
          </button>
        </div>
      </div>
      <div v-if="store.state.error" class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {{ store.state.error }}
      </div>
      <div v-if="shareError" class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {{ shareError }}
      </div>
      <div class="grid gap-4 md:grid-cols-2">
        <label v-if="showCookbookSelect" class="col-span-full flex flex-col gap-2">
          <span class="text-sm font-semibold text-slate-800">Cookbook</span>
          <CookbookSelect
            v-model="selectedCookbook"
            :items="cookbookOptions"
            placeholder="Choose a cookbook"
            :disabled="cookbookReadonly"
          />
        </label>
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
              <XMarkIcon class="h-4 w-4" />
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
        <PlusIcon class="h-4 w-4" />
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
            <XMarkIcon class="h-4 w-4" />
          </button>
        </div>
      </div>

      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-lg border border-dashed border-orange-300 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 transition hover:bg-orange-100"
        @click="addStep"
      >
        <PlusIcon class="h-4 w-4" />
        Add another step
      </button>
    </div>

    <div class="grid gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 md:grid-cols-[1fr_1fr]">
      <div class="space-y-2">
        <h2 class="text-lg font-semibold text-slate-900">Serving size</h2>
        <p class="text-sm text-slate-600">Optional details for how much this recipe yields.</p>
        <div class="grid gap-3 md:grid-cols-2">
          <label class="flex flex-col gap-1 text-sm font-semibold text-slate-800">
            Quantity
            <input
              v-model="form.servingsQuantity"
              type="text"
              class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100"
              placeholder="4"
            />
          </label>
          <label class="flex flex-col gap-1 text-sm font-semibold text-slate-800">
            Unit / label
            <input
              v-model="form.servingsUnit"
              type="text"
              class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100"
              placeholder="servings, slices, people..."
            />
          </label>
        </div>
      </div>
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-slate-900">Notes</h2>
          <span class="text-xs font-semibold uppercase tracking-wide text-slate-400">Optional</span>
        </div>
        <textarea
          v-model="form.notes"
          rows="5"
          class="h-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100"
          placeholder="Finishing tips, substitutions, storage notes..."
        ></textarea>
      </div>
    </div>

    <div class="flex flex-col items-stretch gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 md:flex-row md:items-center md:justify-between">
      <span class="text-sm text-slate-600">All set? Save your recipe when you're ready.</span>
      <button
        type="button"
        class="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="isSaving || (isShareEdit && !sharedRecipe)"
        @click="save"
      >
        <CheckIcon class="h-4 w-4" />
        {{ isSaving ? 'Saving…' : 'Save recipe' }}
      </button>
    </div>
  </section>
</template>

<script>
import { ArrowDownTrayIcon, CheckIcon, PlusIcon, XMarkIcon } from '@heroicons/vue/24/outline';
import { RouterLink } from 'vue-router';
import UserAutocomplete from '../../components/UserAutocomplete.vue';
import CookbookSelect from '../../components/CookbookSelect.vue';
import { useRecipeStore } from '../../stores/recipeStore.js';
import { useSettingsStore } from '../../stores/settingsStore.js';
import { useAuthStore } from '../../stores/authStore.js';

const today = new Date().toISOString().slice(0, 10);
const makeId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
const blankIngredient = () => ({
  id: makeId(),
  name: '',
  quantity: '',
  unit: '',
});

export default {
  name: 'RecipeFormPage',
  components: {
    RouterLink,
    ArrowDownTrayIcon,
    CheckIcon,
    PlusIcon,
    XMarkIcon,
    UserAutocomplete,
    CookbookSelect,
  },
  data() {
    return {
      store: useRecipeStore(),
      settingsStore: useSettingsStore(),
      auth: useAuthStore(),
      form: {
        title: '',
        description: '',
        author: '',
        createdAt: today,
        ingredients: [blankIngredient()],
        steps: [''],
        notes: '',
        servingsQuantity: '',
        servingsUnit: '',
        cookbookId: '',
      },
      tagInput: '',
      isSaving: false,
      sharedRecipe: null,
      shareError: null,
      selectedCookbook: null,
      units: ['cup', 'tbsp', 'tsp', 'g', 'kg', 'oz', 'ml', 'l', 'piece', 'pinch'],
    };
  },
  computed: {
    shareToken() {
      return this.$route.params.token;
    },
    isShareEdit() {
      return this.$route.name === 'recipe-share-edit';
    },
    currentRecipe() {
      return this.isShareEdit ? this.sharedRecipe : this.store.getRecipeById(this.$route.params.id);
    },
    isEditing() {
      return Boolean(this.$route.params.id) || this.isShareEdit;
    },
    isShareOwner() {
      return this.sharedRecipe && this.auth.state.user?.id === this.sharedRecipe.ownerId;
    },
    showCookbookSelect() {
      return !this.isShareEdit || Boolean(this.isShareOwner);
    },
    cookbookReadonly() {
      if (!this.isEditing) return false;
      const ownerId = this.currentRecipe?.ownerId || '';
      return Boolean(ownerId && this.auth.state.user?.id && ownerId !== this.auth.state.user.id);
    },
    cookbookOptions() {
      const owned = (this.store.state.cookbooks || []).map((cb) => ({ ...cb, ownerUsername: 'You' }));
      const editableShared = (this.store.state.sharedCookbooks || []).filter((cb) => cb.canEdit);
      return [...owned, ...editableShared];
    },
    llmAvailable() {
      return this.settingsStore.isLlmEnabled();
    },
  },
  watch: {
    currentRecipe: {
      handler() {
        this.hydrateForm();
      },
      immediate: true,
    },
    shareToken: {
      handler() {
        this.loadSharedRecipe();
      },
      immediate: true,
    },
    'store.state.importedDraft': {
      handler(draft) {
        if (!draft || this.isEditing) return;
        this.applyDraft(draft, { replaceExisting: true });
        this.store.consumeImportedDraft();
      },
      immediate: true,
    },
    cookbookOptions: {
      handler() {
        this.syncSelectedCookbook(this.form.cookbookId);
      },
      deep: true,
      immediate: true,
    },
    selectedCookbook(cb) {
      this.form.cookbookId = cb?.id || '';
    },
  },
  mounted() {
    this.settingsStore.loadSettings();
    this.loadSharedRecipe();
  },
  methods: {
    applyDraft(data, { replaceExisting = false } = {}) {
      if (!data) return;
      const setField = (key, value) => {
        if (replaceExisting || value) {
          this.form[key] = value ?? '';
        }
      };

      setField('title', data.title);
      setField('description', data.description);
      setField('author', data.author);
      if (replaceExisting && data.createdAt) {
        this.form.createdAt = new Date(data.createdAt).toISOString().slice(0, 10);
      }
      setField('notes', data.notes);
      setField('servingsQuantity', data.servingsQuantity);
      setField('servingsUnit', data.servingsUnit);
      setField('cookbookId', data.cookbookId);

      const nextIngredients = (data.ingredients || []).map((item) => ({
        id: item.id || makeId(),
        name: item.name || '',
        quantity: item.quantity ?? '',
        unit: item.unit || '',
      }));
      if (replaceExisting || nextIngredients.length) {
        this.form.ingredients = nextIngredients.length ? nextIngredients : [blankIngredient()];
      }

      const nextSteps = (data.steps && data.steps.length ? [...data.steps] : ['']).map((step) => step || '');
      if (replaceExisting || (data.steps && data.steps.length)) {
        this.form.steps = nextSteps;
      }

      if (replaceExisting || (data.tags && data.tags.length)) {
        this.tagInput = (data.tags || []).join(', ');
      }
    },
    hydrateForm() {
      if (!this.isEditing || !this.currentRecipe) return;
      this.applyDraft(this.currentRecipe, { replaceExisting: true });
      this.syncSelectedCookbook(this.currentRecipe.cookbookId);
    },
    async loadSharedRecipe() {
      if (!this.isShareEdit || !this.shareToken) return;
      this.shareError = null;
      try {
        const res = await fetch(`/api/share/${this.shareToken}`, { credentials: 'include' });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data?.error || 'Unable to load shared recipe.');
        this.sharedRecipe = data.recipe;
        this.applyDraft(data.recipe, { replaceExisting: true });
        this.syncSelectedCookbook(data.recipe.cookbookId);
      } catch (err) {
        this.shareError = err.message || 'Unable to load shared recipe.';
      }
    },
    addIngredient() {
      this.form.ingredients.push(blankIngredient());
    },
    removeIngredient(index) {
      if (this.form.ingredients.length === 1) return;
      this.form.ingredients.splice(index, 1);
    },
    addStep() {
      this.form.steps.push('');
    },
    removeStep(index) {
      if (this.form.steps.length === 1) return;
      this.form.steps.splice(index, 1);
    },
    buildPayload() {
      const tags = this.tagInput
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);

      const ingredients = this.form.ingredients
        .filter((item) => item.name || item.quantity || item.unit)
        .map((item) => ({
          id: item.id || makeId(),
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
        }));

      const steps = this.form.steps.map((step) => step.trim()).filter(Boolean);

      return {
        ...(this.isEditing && this.currentRecipe ? { id: this.currentRecipe.id } : {}),
        title: this.form.title,
        description: this.form.description,
        author: this.form.author,
        createdAt: this.form.createdAt ? new Date(this.form.createdAt).toISOString() : new Date().toISOString(),
        tags,
        ingredients,
        steps,
        notes: this.form.notes,
        servingsQuantity: this.form.servingsQuantity,
        servingsUnit: this.form.servingsUnit,
        cookbookId: this.form.cookbookId,
      };
    },
    async save() {
      try {
        this.isSaving = true;
        if (this.isShareEdit) {
          this.shareError = null;
        }
        const payload = this.buildPayload();
        if (this.isShareEdit && this.shareToken) {
          const res = await fetch(`/api/share/${this.shareToken}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload),
          });
          const data = await res.json();
          if (!res.ok || !data.success) throw new Error(data?.error || 'Unable to save recipe.');
          this.$router.push({ name: 'recipe-share-view', params: { token: this.shareToken } });
        } else {
          const saved = await this.store.saveRecipe(payload);
          this.$router.push({ name: 'recipe-detail', params: { id: saved.id } });
        }
      } catch (error) {
        console.error(error);
        if (this.isShareEdit) {
          this.shareError = error.message || 'Unable to save recipe.';
        }
      } finally {
        this.isSaving = false;
      }
    },
    syncSelectedCookbook(cookbookId) {
      if (!this.showCookbookSelect) return;
      const targetId = cookbookId || this.form.cookbookId;
      if (targetId && this.selectedCookbook?.id === targetId) return;

      const match = this.cookbookOptions.find((cb) => cb.id === targetId);
      if (targetId && !match) {
        // Keep the id around until options load; don't overwrite with blank.
        return;
      }

      const fallback =
        this.cookbookOptions.find((cb) => cb.isDefault) ||
        this.cookbookOptions[0] ||
        null;

      this.selectedCookbook = match || fallback;
      this.form.cookbookId = this.selectedCookbook?.id || '';
    },
  },
};
</script>
