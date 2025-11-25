import { reactive } from 'vue';
import socket from '../services/socket';

const state = reactive({
  recipes: [],
  sharedRecipes: [],
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

socket.on('connect', () => {
  if (!state.ready) {
    loadRecipes();
  }
});

socket.on('disconnect', () => {
  state.ready = false;
});

const loadRecipes = () => {
  if (!socket.connected) {
    socket.connect();
  }
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

const loadSharedRecipes = async () => {
  try {
    const res = await fetch('/api/shared-recipes', { credentials: 'include' });
    const data = await res.json();
    if (res.ok && data.success) {
      state.sharedRecipes = sortByTitle(data.recipes || []);
    }
  } catch (error) {
    console.error(error);
  }
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

const deleteRecipe = (id) =>
  new Promise((resolve, reject) => {
    if (!id) return reject(new Error('Missing recipe id.'));
    state.error = null;
    socket.emit('recipe:delete', id, (response) => {
      if (response?.success) {
        resolve(true);
      } else {
        const err = response?.error || 'Unable to delete recipe.';
        state.error = err;
        reject(new Error(err));
      }
    });
  });

const getRecipeById = (id) => state.recipes.find((recipe) => recipe.id === id);
const getSharedRecipeById = (id) => state.sharedRecipes.find((recipe) => recipe.id === id);

export const useRecipeStore = () => ({
  state,
  loadRecipes,
  loadSharedRecipes,
  saveRecipe,
  deleteRecipe,
  getRecipeById,
  getSharedRecipeById,
  reset: () => {
    state.recipes = [];
    state.sharedRecipes = [];
    state.ready = false;
    state.error = null;
  },
  setImportedDraft: (draft) => {
    state.importedDraft = draft || null;
  },
  consumeImportedDraft: () => {
    const draft = state.importedDraft;
    state.importedDraft = null;
    return draft;
  },
});
