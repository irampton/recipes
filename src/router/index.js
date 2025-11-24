import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '../pages/HomePage.vue';
import RecipeDetailPage from '../pages/RecipeDetailPage.vue';
import RecipeFormPage from '../pages/RecipeFormPage.vue';
import RecipeImportPage from '../pages/RecipeImportPage.vue';
import LoginPage from '../pages/LoginPage.vue';
import SignupPage from '../pages/SignupPage.vue';
import AdminDashboardPage from '../pages/AdminDashboardPage.vue';
import { useAuthStore } from '../stores/authStore';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomePage, meta: { requiresAuth: true } },
    { path: '/recipes/new', name: 'recipe-new', component: RecipeFormPage, meta: { requiresAuth: true } },
    { path: '/recipes/import', name: 'recipe-import', component: RecipeImportPage, meta: { requiresAuth: true } },
    { path: '/recipes/:id', name: 'recipe-detail', component: RecipeDetailPage, props: true, meta: { requiresAuth: true } },
    { path: '/recipes/:id/edit', name: 'recipe-edit', component: RecipeFormPage, props: true, meta: { requiresAuth: true } },
    { path: '/login', name: 'login', component: LoginPage },
    { path: '/signup', name: 'signup', component: SignupPage },
    { path: '/admin', name: 'admin', component: AdminDashboardPage, meta: { requiresAuth: true, requiresAdmin: true } },
  ],
  scrollBehavior() {
    return { top: 0, behavior: 'smooth' };
  },
});

router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore();
  await auth.ensureReady();

  const isAuthRoute = to.name === 'login' || to.name === 'signup';
  const requiresAuth = to.meta.requiresAuth;
  const requiresAdmin = to.meta.requiresAdmin;

  if (!auth.state.user && requiresAuth) {
    return next({ name: 'login', query: { redirect: to.fullPath } });
  }

  if (auth.state.user && isAuthRoute) {
    return next({ name: 'home' });
  }

  if (requiresAdmin && !['owner', 'admin'].includes(auth.state.user?.role)) {
    return next({ name: 'home' });
  }

  next();
});

export default router;
