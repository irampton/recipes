<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
    <div class="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h3 class="text-lg font-semibold text-slate-900">Share recipe</h3>
          <p class="text-sm text-slate-600">Share a view-only link or invite a user with optional edit permissions.</p>
        </div>
        <button type="button" class="text-slate-500 hover:text-slate-700" @click="$emit('close')">✕</button>
      </div>

      <div class="mt-4 grid gap-4 md:grid-cols-2">
        <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold text-slate-900">Anyone with the link</p>
              <p class="text-xs text-slate-600">View-only share link for anyone.</p>
            </div>
            <label class="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-800">
              <input
                :checked="Boolean(publicShare)"
                type="checkbox"
                class="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                @change="togglePublic($event.target.checked)"
              />
              Enabled
            </label>
          </div>
          <div v-if="publicShare" class="mt-3 space-y-2">
            <code class="block truncate rounded-lg bg-white px-3 py-2 text-xs text-slate-800 ring-1 ring-slate-200">{{ publicLink }}</code>
            <div class="flex gap-2">
              <button
                type="button"
                class="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-800 transition hover:border-orange-200 hover:text-orange-700"
                @click="copyLink(publicLink)"
              >
                Copy link
              </button>
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold text-slate-900">Share with a user</p>
            <span class="text-xs font-semibold text-slate-500">{{ userShares.length }} shared</span>
          </div>
          <UserAutocomplete v-model="selectedUser" />
          <label class="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
            <input v-model="canEditSelected" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500" />
            Allow edit
          </label>
          <div class="flex gap-2">
            <button
              type="button"
              class="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="!selectedUser || saving"
              @click="saveUserShare"
            >
              {{ saving ? 'Saving…' : selectedUser ? `Share with ${selectedUser.username}` : 'Share' }}
            </button>
          </div>
          <div v-if="userShares.length" class="mt-2 space-y-2">
            <div
              v-for="share in userShares"
              :key="share.id"
              class="flex items-center justify-between rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200"
            >
              <div>
                <p class="text-sm font-semibold text-slate-900">{{ share.username }}</p>
                <p class="text-xs text-slate-600">Can edit: {{ share.canEdit ? 'Yes' : 'No' }}</p>
              </div>
              <div class="flex flex-col gap-1">
                <button
                  type="button"
                  class="text-xs font-semibold text-rose-600 hover:underline"
                  @click="removeShare(share)"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p v-if="error" class="mt-3 text-sm font-semibold text-red-600">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import UserAutocomplete from './UserAutocomplete.vue';

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  recipeId: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['close', 'updated']);

const loading = ref(false);
const saving = ref(false);
const error = ref(null);
const publicShare = ref(null);
const userShares = ref([]);
const selectedUser = ref(null);
const canEditSelected = ref(false);

const publicLink = computed(() => (publicShare.value ? `${window.location.origin}/share/${publicShare.value.token}` : ''));

const loadShares = async () => {
  if (!props.recipeId || !props.open) return;
  loading.value = true;
  error.value = null;
  try {
    const res = await fetch(`/api/recipes/${props.recipeId}/shares`, { credentials: 'include' });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data?.error || 'Unable to load shares.');
    publicShare.value = data.shares.publicShare;
    userShares.value = data.shares.userShares || [];
  } catch (err) {
    error.value = err.message || 'Unable to load shares.';
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) loadShares();
  }
);

onMounted(() => {
  if (props.open) loadShares();
});

const togglePublic = async (enabled) => {
  if (!props.recipeId) return;
  try {
    const res = await fetch(`/api/recipes/${props.recipeId}/share/public`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ enabled }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data?.error || 'Unable to update sharing.');
    publicShare.value = data.share;
  } catch (err) {
    error.value = err.message || 'Unable to update sharing.';
  }
};

const saveUserShare = async () => {
  if (!selectedUser.value) return;
  saving.value = true;
  error.value = null;
  try {
    const res = await fetch(`/api/recipes/${props.recipeId}/share/user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ userId: selectedUser.value.id, canEdit: canEditSelected.value }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data?.error || 'Unable to share with user.');
    const existingIndex = userShares.value.findIndex((s) => s.userId === data.share.userId);
    if (existingIndex >= 0) {
      userShares.value.splice(existingIndex, 1, data.share);
    } else {
      userShares.value.unshift(data.share);
    }
    selectedUser.value = null;
    canEditSelected.value = false;
    emit('updated');
  } catch (err) {
    error.value = err.message || 'Unable to share with user.';
  } finally {
    saving.value = false;
  }
};

const removeShare = async (share) => {
  try {
    const res = await fetch(`/api/recipes/${props.recipeId}/share/user/${share.userId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data?.error || 'Unable to remove share.');
    userShares.value = userShares.value.filter((s) => s.userId !== share.userId);
  } catch (err) {
    error.value = err.message || 'Unable to remove share.';
  }
};

const copyLink = async (value) => {
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    error.value = 'Unable to copy link.';
  }
};
</script>
