<template>
  <div class="relative min-h-screen bg-slate-50 text-slate-900">
    <AccountMenu v-if="auth.state.user" />
    <div v-if="showAppShell" class="grid min-h-screen md:grid-cols-[320px_1fr]">
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
    <div v-else class="flex min-h-screen items-center justify-center px-4 py-10">
      <RouterView :key="$route.fullPath" />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue';
import { RouterView, useRoute, useRouter } from 'vue-router';
import RecipeSidebar from './components/RecipeSidebar.vue';
import AccountMenu from './components/AccountMenu.vue';
import { useRecipeStore } from './stores/recipeStore';
import { useAuthStore } from './stores/authStore';

const store = useRecipeStore();
const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const recipes = computed(() => store.state.recipes);
const activeId = computed(() => route.params.id);
const authRoutes = computed(() => ['login', 'signup']);
const showAppShell = computed(() => auth.state.user && !authRoutes.value.includes(route.name));

watch(
  () => auth.state.user,
  (user) => {
    if (user) {
      store.loadRecipes();
    } else {
      store.reset();
    }
  },
  { immediate: true }
);

onMounted(async () => {
  await auth.ensureReady();
  if (auth.state.user) {
    store.loadRecipes();
  } else if (!authRoutes.value.includes(route.name)) {
    router.replace({ name: 'login', query: { redirect: route.fullPath } });
  }
});

const goHome = () => {
  router.push({ name: 'home' });
};
</script>
