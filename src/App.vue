<template>
  <div class="relative min-h-screen bg-slate-50 text-slate-900">
    <NavBar v-if="auth.state.user" :show-account="!!auth.state.user" @go-home="goHome" />
    <div v-if="showAppShell" class="grid min-h-screen md:grid-cols-[320px_1fr]">
      <SettingsSidebar
        v-if="showSettingsSidebar"
        :pending-count="friendStore.pendingCount()"
        :show-admin="canSeeAdmin"
      />
      <RecipeSidebar
        v-else
        :recipes="recipes"
        :shared-recipes="sharedRecipes"
        :loading="store.state.loading && !store.state.ready"
        :active-id="activeId"
        :active-share-token="activeShareToken"
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
import NavBar from './components/NavBar.vue';
import SettingsSidebar from './components/SettingsSidebar.vue';
import { useRecipeStore } from './stores/recipeStore';
import { useAuthStore } from './stores/authStore';
import { useSettingsStore } from './stores/settingsStore';
import { useFriendStore } from './stores/friendStore';

const store = useRecipeStore();
const auth = useAuthStore();
const settingsStore = useSettingsStore();
const friendStore = useFriendStore();
const route = useRoute();
const router = useRouter();

const recipes = computed(() => store.state.recipes);
const activeId = computed(() => route.params.id);
const sharedRecipes = computed(() => store.state.sharedRecipes);
const activeShareToken = computed(() => route.params.token);
const authRoutes = computed(() => ['login', 'signup']);
const canSeeAdmin = computed(() => ['owner', 'admin'].includes(auth.state.user?.role));
const isSettingsRoute = computed(() => Boolean(route.meta?.settingsPage));
const showSettingsSidebar = computed(() => isSettingsRoute.value);
const showAppShell = computed(() => auth.state.user && !authRoutes.value.includes(route.name));

watch(
  () => auth.state.user,
  (user) => {
    if (user) {
      store.loadRecipes();
      store.loadSharedRecipes();
      settingsStore.loadSettings();
      friendStore.loadFriends();
    } else {
      store.reset();
      settingsStore.reset();
      friendStore.reset();
    }
  },
  { immediate: true }
);

onMounted(async () => {
  await auth.ensureReady();
  if (auth.state.user) {
    store.loadRecipes();
    store.loadSharedRecipes();
    settingsStore.loadSettings();
    friendStore.loadFriends();
  } else if (!authRoutes.value.includes(route.name) && !route.meta?.allowShare) {
    router.replace({ name: 'login', query: { redirect: route.fullPath } });
  }
});

const goHome = () => {
  router.push({ name: 'home' });
};
</script>
