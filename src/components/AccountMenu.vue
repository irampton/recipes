<template>
  <div class="relative" data-account-menu>
    <button
      class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-orange-200 hover:text-orange-700"
      type="button"
      @click="open = !open"
    >
      <span class="relative inline-flex h-8 w-8 items-center justify-center rounded-full bg-orange-600 text-xs font-bold uppercase text-white">
        {{ user.username?.slice(0, 2) || '?' }}
        <span
          v-if="hasPendingRequests"
          class="absolute -right-1 -top-1 inline-flex h-3 w-3 rounded-full bg-orange-100 ring-2 ring-white"
        >
          <span class="m-auto h-2 w-2 rounded-full bg-orange-600"></span>
        </span>
      </span>
      <span class="hidden sm:inline">{{ user.username }}</span>
      <ChevronDownIcon class="h-4 w-4" />
    </button>

    <div
      v-if="open"
      class="absolute right-0 mt-2 w-64 rounded-2xl bg-white p-3 shadow-xl shadow-slate-200 ring-1 ring-slate-200"
    >
      <div class="mb-2">
        <p class="text-sm font-semibold text-slate-900">{{ user.username }}</p>
      </div>
      <div class="space-y-2">
        <RouterLink
          :to="{ name: 'settings-friends' }"
          class="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 transition hover:-translate-y-[1px] hover:border-orange-300 hover:bg-orange-50"
          @click="open = false"
        >
          Friends
          <span
            v-if="pendingCount"
            class="inline-flex min-w-[20px] items-center justify-center rounded-full bg-orange-600 px-2 text-[11px] font-bold uppercase tracking-wide text-white"
          >
            {{ pendingCount }}
          </span>
        </RouterLink>
        <RouterLink
          v-if="canManageUsers"
          :to="{ name: 'admin-users' }"
          class="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 transition hover:-translate-y-[1px] hover:border-orange-300 hover:bg-orange-50"
          @click="open = false"
        >
          Admin dashboard
        </RouterLink>
        <RouterLink
          v-if="isOwner"
          :to="{ name: 'admin-server-settings' }"
          class="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 transition hover:-translate-y-[1px] hover:border-orange-300 hover:bg-orange-50"
          @click="open = false"
        >
          Server settings
        </RouterLink>
        <button
          class="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 transition hover:-translate-y-[1px] hover:border-slate-300 hover:bg-slate-100"
          type="button"
          @click="handleLogout"
        >
          Log out
          <ArrowRightOnRectangleIcon class="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import { useFriendStore } from '../stores/friendStore';
import { ArrowRightOnRectangleIcon, ChevronDownIcon } from '@heroicons/vue/24/outline';

const auth = useAuthStore();
const friendStore = useFriendStore();
const router = useRouter();
const open = ref(false);

const user = computed(() => auth.state.user || {});
const canManageUsers = computed(() => ['owner', 'admin'].includes(user.value.role));
const isOwner = computed(() => user.value.role === 'owner');
const pendingCount = computed(() => friendStore.pendingCount());
const hasPendingRequests = computed(() => friendStore.hasPendingRequests());

const handleLogout = async () => {
  await auth.logout();
  open.value = false;
  router.push({ name: 'login' });
};

const handleClickOutside = (event) => {
  if (!(event.target.closest && event.target.closest('[data-account-menu]'))) {
    open.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>
