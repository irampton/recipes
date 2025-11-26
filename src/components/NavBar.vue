<template>
  <nav
    class="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur transition-transform duration-300"
    :class="{ '-translate-y-full': hidden }"
  >
    <div class="w-full px-4">
      <div class="grid items-center gap-3 py-3 md:grid-cols-[300px_minmax(0,1fr)_auto]">
        <div class="flex justify-center md:justify-center">
          <div class="inline-flex overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm">
            <button
              type="button"
              class="inline-flex h-10 items-center gap-2 border-r border-slate-200 px-4 text-xs font-semibold text-slate-700 transition hover:text-orange-700"
              @click="$emit('go-home')"
              title="Home"
            >
              <HomeIcon class="h-4 w-4" />
              <span class="hidden sm:inline">Home</span>
            </button>
            <RouterLink
              :to="{ name: 'recipe-new' }"
              class="inline-flex h-10 items-center justify-center border-l border-slate-200 bg-orange-600 px-4 text-xs font-semibold text-white transition hover:bg-orange-700 hover:shadow-lg hover:shadow-orange-200 active:scale-95"
              title="Create recipe"
            >
              <PlusIcon class="h-4 w-4" />
              <span class="hidden sm:inline">New</span>
            </RouterLink>
          </div>
        </div>

        <div class="flex items-center gap-3 md:justify-start">
          <img src="/assests/lembas.svg" alt="Lembas logo" class="h-12 w-12 rounded-2xl object-cover" />
          <div>
            <p class="text-base font-semibold text-slate-900">Lembas</p>
            <p class="text-xs text-slate-500">Recipes worth sharing</p>
          </div>
        </div>

        <div class="flex justify-end">
          <AccountMenu v-if="showAccount" />
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { HomeIcon, PlusIcon } from '@heroicons/vue/24/outline';
import AccountMenu from './AccountMenu.vue';

defineProps({
  showAccount: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['go-home']);

const hidden = ref(false);
let lastY = 0;

const handleScroll = () => {
  const current = window.scrollY;
  if (current > lastY && current > 50) {
    hidden.value = true;
  } else {
    hidden.value = false;
  }
  lastY = current;
};

onMounted(() => {
  lastY = window.scrollY;
  window.addEventListener('scroll', handleScroll, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>
