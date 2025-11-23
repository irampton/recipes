<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <div class="grid min-h-screen md:grid-cols-[320px_1fr]">
      <RecipeSidebar
        :recipes="recipes"
        :loading="store.state.loading && !store.state.ready"
        :active-id="activeId"
        @go-home="goHome"
      />
      <section class="relative flex min-h-screen flex-col">
        <header
          class="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-4 backdrop-blur md:px-8"
        >
          <div class="flex flex-col gap-0.5">
            <span class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Cookbook</span>
            <span class="text-lg font-semibold text-slate-900">Your recipes, in sync</span>
          </div>
          <RouterLink
            :to="{ name: 'recipe-new' }"
            class="group inline-flex h-10 w-10 items-center justify-center rounded-full bg-orange-600 text-white shadow-none transition hover:bg-orange-700 hover:shadow-lg hover:shadow-orange-200 active:scale-95"
            title="Create recipe"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </RouterLink>
        </header>
        <main class="flex-1 px-4 py-6 md:px-8">
          <RouterView :key="$route.fullPath" />
        </main>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';
import RecipeSidebar from './components/sidebar/RecipeSidebar.vue';
import { useRecipeStore } from './stores/recipeStore';

const store = useRecipeStore();
const route = useRoute();
const router = useRouter();

const recipes = computed(() => store.state.recipes);
const activeId = computed(() => route.params.id);

onMounted(() => {
  store.loadRecipes();
});

const goHome = () => {
  router.push({ name: 'home' });
};
</script>
