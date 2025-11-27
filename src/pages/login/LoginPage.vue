<template>
  <div class="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl shadow-orange-100 ring-1 ring-orange-100">
    <p class="text-xs font-semibold uppercase tracking-[0.25em] text-orange-600">Welcome back</p>
    <h1 class="mt-2 text-2xl font-semibold text-slate-900">Sign in to Lembas</h1>
    <form class="mt-6 space-y-4" @submit.prevent="handleLogin">
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
          class="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
          autocomplete="current-password"
          required
        />
      </div>
      <p v-if="error" class="text-sm font-semibold text-red-600">{{ error }}</p>
      <button
        class="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="auth.state.loading"
        type="submit"
      >
        <span v-if="auth.state.loading">Signing in…</span>
        <span v-else>Sign in</span>
      </button>
    </form>
    <p class="mt-4 text-center text-sm text-slate-600">
      Need an account?
      <RouterLink class="font-semibold text-orange-700 hover:underline" :to="{ name: 'signup' }">Create one</RouterLink>
    </p>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { useAuthStore } from '../../stores/authStore.js';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const form = reactive({ username: '', password: '' });
const error = computed(() => auth.state.error);

const handleLogin = async () => {
  try {
    await auth.login({ username: form.username, password: form.password });
    const redirectTo = route.query.redirect || '/';
    router.push(redirectTo);
  } catch (err) {
    console.error(err);
  }
};
</script>
