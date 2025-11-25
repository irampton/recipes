<template>
  <aside class="border-b border-slate-200 bg-white/90 backdrop-blur md:border-b-0 md:border-r">
    <div class="flex flex-col gap-5 px-4 py-5">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.25em] text-orange-600">Settings</p>
        <p class="text-sm font-semibold text-slate-900">Control panel</p>
      </div>

      <div class="space-y-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-500">User</p>
        <ul class="space-y-2">
          <li>
            <RouterLink
              :to="{ name: 'settings-friends' }"
              class="flex items-center justify-between rounded-lg px-3 py-3 text-sm font-semibold transition"
              :class="{
                'border border-orange-200 bg-orange-50 text-orange-800 shadow-sm': route.name === 'settings-friends',
                'text-slate-700 hover:bg-slate-50': route.name !== 'settings-friends',
              }"
            >
              <div class="flex items-center gap-3">
                <UserGroupIcon class="h-4 w-4" />
                <span>Friends</span>
              </div>
              <span
                v-if="pendingCount"
                class="inline-flex min-w-[24px] items-center justify-center rounded-full bg-orange-600 px-2 text-[11px] font-bold uppercase tracking-wide text-white"
              >
                {{ pendingCount }}
              </span>
            </RouterLink>
          </li>
        </ul>
      </div>

      <div v-if="showAdmin" class="space-y-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Admin</p>
        <ul class="space-y-2">
          <li>
            <RouterLink
              :to="{ name: 'admin-users' }"
              class="flex items-center justify-between rounded-lg px-3 py-3 text-sm font-semibold transition"
              :class="{
                'border border-orange-200 bg-orange-50 text-orange-800 shadow-sm': route.name === 'admin-users',
                'text-slate-700 hover:bg-slate-50': route.name !== 'admin-users',
              }"
            >
              <div class="flex items-center gap-3">
                <UserGroupIcon class="h-4 w-4" />
                <span>Users & access</span>
              </div>
            </RouterLink>
          </li>
          <li>
            <RouterLink
              :to="{ name: 'admin-server-settings' }"
              class="flex items-center justify-between rounded-lg px-3 py-3 text-sm font-semibold transition"
              :class="{
                'border border-orange-200 bg-orange-50 text-orange-800 shadow-sm': route.name === 'admin-server-settings',
                'text-slate-700 hover:bg-slate-50': route.name !== 'admin-server-settings',
              }"
            >
              <div class="flex items-center gap-3">
                <ServerStackIcon class="h-4 w-4" />
                <span>Server settings</span>
              </div>
            </RouterLink>
          </li>
        </ul>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { RouterLink, useRoute } from 'vue-router';
import { UserGroupIcon, ServerStackIcon } from '@heroicons/vue/24/outline';

defineProps({
  pendingCount: {
    type: Number,
    default: 0,
  },
  showAdmin: {
    type: Boolean,
    default: false,
  },
});

const route = useRoute();
</script>
