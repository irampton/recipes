import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '../pages/HomePage.vue';
import RecipeDetailPage from '../pages/RecipeDetailPage.vue';
import RecipeFormPage from '../pages/RecipeFormPage.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomePage },
    { path: '/recipes/new', name: 'recipe-new', component: RecipeFormPage },
    { path: '/recipes/:id', name: 'recipe-detail', component: RecipeDetailPage, props: true },
    { path: '/recipes/:id/edit', name: 'recipe-edit', component: RecipeFormPage, props: true },
  ],
  scrollBehavior() {
    return { top: 0, behavior: 'smooth' };
  },
});

export default router;
