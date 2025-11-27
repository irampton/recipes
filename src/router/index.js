import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '../pages/recipies/HomePage.vue';
import RecipeDetailPage from '../pages/recipies/RecipeDetailPage.vue';
import RecipeFormPage from '../pages/recipies/RecipeFormPage.vue';
import RecipeImportPage from '../pages/recipies/RecipeImportPage.vue';
import CookbookSharePage from '../pages/recipies/CookbookSharePage.vue';
import LoginPage from '../pages/login/LoginPage.vue';
import SignupPage from '../pages/login/SignupPage.vue';
import AdminUsersPage from '../pages/settings/AdminUsersPage.vue';
import AdminServerSettingsPage from '../pages/settings/AdminServerSettingsPage.vue';
import FriendsPage from '../pages/settings/FriendsPage.vue';
import { useAuthStore } from '../stores/authStore';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomePage, meta: { requiresAuth: true } },
    { path: '/recipes/new', name: 'recipe-new', component: RecipeFormPage, meta: { requiresAuth: true } },
    { path: '/recipes/import', name: 'recipe-import', component: RecipeImportPage, meta: { requiresAuth: true } },
    { path: '/recipes/:id', name: 'recipe-detail', component: RecipeDetailPage, props: true, meta: { requiresAuth: true } },
    { path: '/recipes/:id/edit', name: 'recipe-edit', component: RecipeFormPage, props: true, meta: { requiresAuth: true } },
    { path: '/share/:token', name: 'recipe-share-view', component: RecipeDetailPage, props: true, meta: { allowShare: true } },
    { path: '/share/:token/edit', name: 'recipe-share-edit', component: RecipeFormPage, props: true, meta: { allowShare: true } },
    {
      path: '/cookbook-share/:token',
      name: 'cookbook-share-view',
      component: CookbookSharePage,
      props: true,
      meta: { allowShare: true, hideSidebar: true },
    },
    { path: '/login', name: 'login', component: LoginPage },
    { path: '/signup', name: 'signup', component: SignupPage },
    {
      path: '/settings/friends',
      name: 'settings-friends',
      component: FriendsPage,
      meta: { requiresAuth: true, settingsPage: true },
    },
    { path: '/admin', redirect: { name: 'admin-users' } },
    {
      path: '/settings/users',
      name: 'admin-users',
      component: AdminUsersPage,
      meta: { requiresAuth: true, requiresAdmin: true, isAdminPage: true, settingsPage: true },
    },
    {
      path: '/settings/server-settings',
      name: 'admin-server-settings',
      component: AdminServerSettingsPage,
      meta: { requiresAuth: true, requiresAdmin: true, isAdminPage: true, settingsPage: true },
    },
  ],
  scrollBehavior() {
    return { top: 0, behavior: 'smooth' };
  },
});

export default router;
