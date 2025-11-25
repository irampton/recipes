<template>
  <aside class="border-b border-slate-200 bg-white/90 backdrop-blur md:border-b-0 md:border-r">
    <div class="flex flex-col gap-5 px-4 py-5">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-orange-600">Admin</p>
          <p class="text-sm font-semibold text-slate-900">Control panel</p>
        </div>
        <RouterLink
          :to="{ name: 'home' }"
          class="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-700"
        >
          <HomeIcon class="h-4 w-4" />
          Recipes
        </RouterLink>
      </div>

      <ul class="space-y-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        <li v-for="link in links" :key="link.name">
          <RouterLink
            :to="link.to"
            class="flex items-center justify-between rounded-lg px-3 py-3 text-sm font-semibold transition"
            :class="{
              'border border-orange-200 bg-orange-50 text-orange-800 shadow-sm': route.name === link.to.name,
              'text-slate-700 hover:bg-slate-50': route.name !== link.to.name,
            }"
          >
            <div class="flex items-center gap-3">
              <component :is="link.icon" class="h-4 w-4" />
              <span>{{ link.label }}</span>
            </div>
            <span class="text-xs font-semibold uppercase tracking-wide text-slate-400">{{ link.badge || '' }}</span>
          </RouterLink>
        </li>
      </ul>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { HomeIcon, ServerStackIcon, UserGroupIcon } from '@heroicons/vue/24/outline';

const route = useRoute();

const links = computed(() => [
  { name: 'admin-users', label: 'Users & access', to: { name: 'admin-users' }, icon: UserGroupIcon },
  { name: 'admin-server-settings', label: 'Server settings', to: { name: 'admin-server-settings' }, icon: ServerStackIcon },
]);
</script>
