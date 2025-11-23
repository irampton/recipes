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
        <main class="flex-1 px-4 py-6 md:px-8">
          <RouterView :key="$route.fullPath" />
        </main>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { RouterView, useRoute, useRouter } from 'vue-router';
import RecipeSidebar from './components/RecipeSidebar.vue';
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
