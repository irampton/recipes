import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '../pages/HomePage.vue';
import RecipeDetailPage from '../pages/RecipeDetailPage.vue';
import RecipeFormPage from '../pages/RecipeFormPage.vue';
import RecipeImportPage from '../pages/RecipeImportPage.vue';
import LoginPage from '../pages/LoginPage.vue';
import SignupPage from '../pages/SignupPage.vue';
import AdminUsersPage from '../pages/admin/AdminUsersPage.vue';
import AdminServerSettingsPage from '../pages/admin/AdminServerSettingsPage.vue';
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
    { path: '/login', name: 'login', component: LoginPage },
    { path: '/signup', name: 'signup', component: SignupPage },
    { path: '/admin', redirect: { name: 'admin-users' } },
    {
      path: '/admin/users',
      name: 'admin-users',
      component: AdminUsersPage,
      meta: { requiresAuth: true, requiresAdmin: true, isAdminPage: true },
    },
    {
      path: '/admin/server-settings',
      name: 'admin-server-settings',
      component: AdminServerSettingsPage,
      meta: { requiresAuth: true, requiresAdmin: true, isAdminPage: true },
    },
  ],
  scrollBehavior() {
    return { top: 0, behavior: 'smooth' };
  },
});

export default router;
