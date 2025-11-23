import { reactive } from 'vue';
import socket from '../services/socket';

const state = reactive({
  recipes: [],
  loading: false,
  error: null,
  ready: false,
  importedDraft: null,
});

const sortByTitle = (list) =>
  [...list].sort((a, b) => (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' }));

socket.on('recipes:updated', (payload) => {
  state.recipes = sortByTitle(payload || []);
  state.ready = true;
});

const loadRecipes = () => {
  if (state.loading) return;
  state.loading = true;
  state.error = null;

  socket.emit('recipes:list', (response) => {
    if (response?.success) {
      state.recipes = sortByTitle(response.data || []);
      state.ready = true;
    } else {
      state.error = response?.error || 'Unable to load recipes.';
    }
    state.loading = false;
  });
};

const saveRecipe = (recipe) =>
  new Promise((resolve, reject) => {
    state.error = null;
    socket.emit('recipe:save', recipe, (response) => {
      if (response?.success) {
        resolve(response.data);
      } else {
        const err = response?.error || 'Unable to save recipe.';
        state.error = err;
        reject(new Error(err));
      }
    });
  });

const getRecipeById = (id) => state.recipes.find((recipe) => recipe.id === id);

export const useRecipeStore = () => ({
  state,
  loadRecipes,
  saveRecipe,
  getRecipeById,
  setImportedDraft: (draft) => {
    state.importedDraft = draft || null;
  },
  consumeImportedDraft: () => {
    const draft = state.importedDraft;
    state.importedDraft = null;
    return draft;
  },
});
