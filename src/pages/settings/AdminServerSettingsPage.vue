<template>
  <section class="mx-auto flex max-w-5xl flex-col gap-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
    <header class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.25em] text-orange-600">Admin</p>
        <h1 class="text-2xl font-semibold text-slate-900">Server settings</h1>
        <p class="text-sm text-slate-600">Configure integrations and platform-wide toggles.</p>
      </div>
      <span
        v-if="status.loading"
        class="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
      >
        <ArrowPathIcon class="h-4 w-4 animate-spin" />
        Loading…
      </span>
    </header>

    <div class="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <form
        class="space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
        @submit.prevent="save"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-slate-900">LLM import</p>
            <p class="text-xs text-slate-600">Enable importing recipes through an OpenAI-compatible endpoint.</p>
          </div>
          <label class="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-800">
            <input v-model="form.enabled" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500" />
            Enabled
          </label>
        </div>

        <label class="flex flex-col gap-2">
          <span class="text-sm font-semibold text-slate-800">LLM endpoint</span>
          <input
            v-model="form.endpoint"
            type="text"
            class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100 disabled:bg-slate-100"
            placeholder="https://your-llm-server/v1/chat/completions"
            :disabled="!form.enabled || status.loading || settingsStore.state.saving"
          />
          <p class="text-xs text-slate-500">
            OpenAI-compatible endpoint (tested with llama.cpp). Required when LLM import is enabled.
          </p>
        </label>

        <div class="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            class="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="status.loading || settingsStore.state.saving"
          >
            <CheckIcon v-if="!settingsStore.state.saving" class="h-4 w-4" />
            <ArrowPathIcon v-else class="h-4 w-4 animate-spin" />
            {{ settingsStore.state.saving ? 'Saving…' : 'Save changes' }}
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-700"
            :disabled="status.loading || settingsStore.state.saving"
            @click="resetForm"
          >
            Reset
          </button>
          <span v-if="status.saved" class="text-sm font-semibold text-emerald-700">Saved.</span>
        </div>

        <div v-if="status.error" class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {{ status.error }}
        </div>
      </form>

      <div class="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-semibold text-slate-900">Status</p>
            <p class="text-xs text-slate-600">What users will see in the app.</p>
          </div>
          <span
            class="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
            :class="llmAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'"
          >
            {{ llmAvailable ? 'Enabled' : 'Disabled' }}
          </span>
        </div>
        <p class="text-sm text-slate-700">
          {{ llmAvailable ? 'LLM import is available on create/import pages.' : 'Users will not see LLM import until it is enabled with an endpoint.' }}
        </p>
        <div class="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
          <p class="font-semibold text-slate-800">Current endpoint</p>
          <p class="mt-1 break-words text-slate-700">
            {{ llmSettings.endpoint ? llmSettings.endpoint : 'Not configured' }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive } from 'vue';
import { ArrowPathIcon, CheckIcon } from '@heroicons/vue/24/outline';
import { useSettingsStore } from '../../stores/settingsStore';

const settingsStore = useSettingsStore();

const status = reactive({
  loading: true,
  saved: false,
  error: null,
});

const form = reactive({
  enabled: false,
  endpoint: '',
});

const llmSettings = computed(() => settingsStore.getLlmSettings());
const llmAvailable = computed(() => settingsStore.isLlmEnabled());

const syncForm = () => {
  form.enabled = Boolean(llmSettings.value.enabled);
  form.endpoint = llmSettings.value.endpoint || '';
};

const resetForm = () => {
  syncForm();
  status.saved = false;
  status.error = null;
};

const load = async () => {
  status.loading = true;
  status.error = null;
  try {
    await settingsStore.loadSettings(true);
    syncForm();
  } catch (error) {
    status.error = error?.message || 'Unable to load settings.';
  } finally {
    status.loading = false;
  }
};

const save = async () => {
  status.saved = false;
  status.error = null;
  try {
    await settingsStore.updateLlmSettings({ enabled: form.enabled, endpoint: form.endpoint });
    status.saved = true;
    syncForm();
  } catch (error) {
    status.error = error?.message || 'Unable to save settings.';
  }
};

onMounted(async () => {
  await load();
});
</script>
