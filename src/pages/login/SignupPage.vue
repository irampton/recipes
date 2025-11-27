<template>
  <div class="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl shadow-orange-100 ring-1 ring-orange-100">
    <p class="text-xs font-semibold uppercase tracking-[0.25em] text-orange-600">Join Lembas</p>
    <h1 class="mt-2 text-2xl font-semibold text-slate-900">Create your account</h1>
    <form class="mt-6 space-y-4" @submit.prevent="handleSignup">
      <div class="space-y-2">
        <label class="text-sm font-semibold text-slate-800" for="username">Username</label>
        <input
          id="username"
          v-model="form.username"
          type="text"
          class="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
          autocomplete="username"
          required
        />
      </div>
      <div class="space-y-2">
        <label class="text-sm font-semibold text-slate-800" for="password">Password</label>
        <input
          id="password"
          v-model="form.password"
          type="password"
          minlength="8"
          class="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
          autocomplete="new-password"
          required
        />
      </div>
      <div class="space-y-2">
        <label class="text-sm font-semibold text-slate-800" for="joinCode">Join code</label>
        <div class="relative">
          <input
            id="joinCode"
            ref="joinInput"
            :value="rawJoinCode"
            class="absolute inset-0 h-full w-full cursor-text opacity-0"
            type="text"
            autocomplete="off"
            spellcheck="false"
            @input="handleJoinInput"
            @paste="handleJoinInput"
          />
          <div
            class="flex items-center gap-2 rounded-xl border border-dashed border-orange-200 bg-orange-50 px-4 py-3 text-lg font-semibold tracking-[0.4em] text-orange-900"
            @click="focusJoinInput"
          >
            <template v-for="(char, idx) in 7" :key="idx">
              <span class="inline-flex h-10 w-8 items-center justify-center rounded-lg bg-white shadow-inner shadow-orange-100">
                {{ codeChars[idx] || '' }}
              </span>
              <span v-if="idx === 3" class="text-orange-400">-</span>
            </template>
          </div>
        </div>
        <p class="text-xs text-orange-700">Paste or type your invite (7 letters/numbers).</p>
      </div>
      <p v-if="error" class="text-sm font-semibold text-red-600">{{ error }}</p>
      <button
        class="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="auth.state.loading"
        type="submit"
      >
        <span v-if="auth.state.loading">Creating account…</span>
        <span v-else>Sign up</span>
      </button>
    </form>
    <p class="mt-4 text-center text-sm text-slate-600">
      Already have an account?
      <RouterLink class="font-semibold text-orange-700 hover:underline" :to="{ name: 'login' }">Sign in</RouterLink>
    </p>
  </div>
</template>

<script setup>
import { reactive, computed, ref, watch } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { useAuthStore } from '../../stores/authStore.js';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const form = reactive({ username: '', password: '', joinCode: '' });
const rawJoinCode = ref('');
const joinInput = ref(null);
const error = computed(() => auth.state.error);

const normalizedJoin = computed(() => rawJoinCode.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 7));
const codeChars = computed(() => normalizedJoin.value.split(''));

watch(
  normalizedJoin,
  (val) => {
    form.joinCode = val;
  },
  { immediate: true }
);

const handleJoinInput = (event) => {
  rawJoinCode.value = event.target.value || '';
};

const focusJoinInput = () => {
  joinInput.value?.focus();
};

const handleSignup = async () => {
  try {
    await auth.signup({ username: form.username, password: form.password, joinCode: normalizedJoin.value });
    const redirectTo = route.query.redirect || '/';
    router.push(redirectTo);
  } catch (err) {
    console.error(err);
  }
};
</script>
