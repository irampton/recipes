<template>
<div class="fixed right-4 top-4 z-50">
    <div class="w-64 rounded-2xl bg-white/90 p-3 shadow-xl shadow-slate-200 ring-1 ring-slate-200 backdrop-blur">
      <div class="flex items-center justify-between gap-3">
        <div>
          <p class="text-sm font-semibold text-slate-900">{{ user.username }}</p>
        </div>
        <button
          class="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          type="button"
          @click="open = !open"
        >
          <span class="sr-only">Toggle account menu</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>
      <div v-if="open" class="mt-3 space-y-2">
        <RouterLink
          v-if="canManageUsers"
          :to="{ name: 'admin' }"
          class="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 transition hover:-translate-y-[1px] hover:border-orange-300 hover:bg-orange-50"
        >
          Admin dashboard
          <span class="rounded-full bg-orange-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-white">Staff</span>
        </RouterLink>
        <button
          class="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 transition hover:-translate-y-[1px] hover:border-slate-300 hover:bg-slate-100"
          type="button"
          @click="handleLogout"
        >
          Log out
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';

const auth = useAuthStore();
const router = useRouter();
const open = ref(false);

const user = computed(() => auth.state.user || {});
const canManageUsers = computed(() => ['owner', 'admin'].includes(user.value.role));

const handleLogout = async () => {
  await auth.logout();
  router.push({ name: 'login' });
};
</script>
