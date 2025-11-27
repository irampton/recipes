<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
    <div class="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h3 class="text-lg font-semibold text-slate-900">{{ isNew ? 'Create cookbook' : 'Cookbook details' }}</h3>
          <p class="text-sm text-slate-600">Name it, pick a color, and set who can see it.</p>
        </div>
        <button type="button" class="text-slate-500 hover:text-slate-700" @click="$emit('close')">✕</button>
      </div>

      <div class="mt-4 grid gap-4 md:grid-cols-[2fr_1fr]">
        <div class="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <label class="flex items-center justify-between gap-3 text-sm font-semibold text-slate-800">
            <span class="flex-1">Name</span>
            <input
              v-model="form.color"
              type="color"
              class="h-8 w-8 flex-shrink-0 cursor-pointer rounded-full border border-slate-200 bg-white p-0 disabled:cursor-not-allowed"
              :disabled="!canEditDetails && !isNew"
              aria-label="Pick cookbook color"
            />
          </label>
          <input
            v-model="form.name"
            type="text"
            class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-100"
            placeholder="My Cookbook"
            :disabled="!canEditDetails && !isNew"
          />
          <label class="flex flex-col gap-1 text-sm font-semibold text-slate-800">
            Description
            <textarea
              v-model="form.description"
              rows="3"
              class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              placeholder="What goes in this collection?"
              :disabled="!canEditDetails && !isNew"
            ></textarea>
          </label>
          <p v-if="!isNew && !canEditDetails" class="text-xs font-semibold uppercase tracking-wide text-slate-500">
            View-only access — only the owner can edit details.
          </p>
          <div class="flex gap-2">
            <button
              type="button"
              class="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="!form.name || saving || (!canEditDetails && !isNew)"
              @click="save"
            >
              {{ saving ? 'Saving…' : isNew ? 'Create cookbook' : 'Save changes' }}
            </button>
            <button
              type="button"
              class="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-orange-200 hover:text-orange-700"
              @click="$emit('close')"
            >
              Close
            </button>
          </div>
          <p v-if="error" class="text-sm font-semibold text-red-600">{{ error }}</p>
        </div>

        <div class="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold text-slate-900">Sharing</p>
              <p class="text-xs text-slate-500">Link sharing or invite a friend.</p>
            </div>
            <span v-if="isNew" class="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase text-slate-500">
              Save to share
            </span>
          </div>

          <div v-if="isNew" class="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            Save your cookbook to unlock sharing options.
          </div>

          <div v-else-if="canManageSharing" class="space-y-3">
            <div class="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div class="flex items-center justify-between">
                <div class="flex flex-col">
                  <p class="text-sm font-semibold text-slate-900">Public</p>
                  <p class="text-xs text-slate-600">Anyone with the link can view this cookbook.</p>
                </div>
                <ToggleSwitch :model-value="Boolean(publicShare)" @update:modelValue="togglePublic" />
              </div>
              <div v-if="publicShare" class="mt-2 space-y-2">
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

            <div class="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
              <div class="flex items-center justify-between">
                <p class="text-sm font-semibold text-slate-900">Share with a friend</p>
                <span class="text-xs font-semibold text-slate-500">{{ userShares.length }} shared</span>
              </div>
              <UserAutocomplete v-model="selectedUser" :friends-only="true" placeholder="Search friends" />
              <label class="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
                <input v-model="canEditSelected" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500" />
                Allow edit
              </label>
              <div class="flex gap-2">
                <button
                  type="button"
                  class="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
                  :disabled="!selectedUser || savingShare"
                  @click="saveUserShare"
                >
                  {{ savingShare ? 'Saving…' : selectedUser ? `Share with ${selectedUser.username}` : 'Share' }}
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
                    <p class="text-xs text-slate-600">{{ share.canEdit ? 'Edit access' : 'View only' }}</p>
                  </div>
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

          <div
            v-else
            class="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-600"
          >
            Only the owner can manage sharing for this cookbook.
          </div>
          <p v-if="shareError" class="text-sm font-semibold text-red-600">{{ shareError }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useAuthStore } from '../stores/authStore';
import UserAutocomplete from './UserAutocomplete.vue';
import ToggleSwitch from '../baseComponents/ToggleSwitch.vue';

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  cookbook: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['close', 'saved', 'created']);
const auth = useAuthStore();

const form = reactive({
  name: '',
  description: '',
  color: '#fb923c',
});
const saving = ref(false);
const error = ref(null);
const shareError = ref(null);
const activeCookbook = ref(null);
const publicShare = ref(null);
const userShares = ref([]);
const selectedUser = ref(null);
const canEditSelected = ref(false);
const savingShare = ref(false);

const isNew = computed(() => !activeCookbook.value?.id);
const publicLink = computed(() =>
  publicShare.value ? `${window.location.origin}/cookbook-share/${publicShare.value.token}` : ''
);
const canEditDetails = computed(() => {
  if (isNew.value) return true;
  const cb = activeCookbook.value;
  const userId = auth.state.user?.id;
  if (!cb) return false;
  return cb.ownerId === userId || Boolean(cb.canEdit);
});
const canManageSharing = computed(() => {
  const cb = activeCookbook.value;
  const userId = auth.state.user?.id;
  if (!cb || isNew.value) return false;
  return cb.ownerId === userId;
});

const hydrate = (source) => {
  form.name = source?.name || '';
  form.description = source?.description || '';
  form.color = source?.color || '#fb923c';
};

const loadShares = async () => {
  if (!activeCookbook.value?.id) return;
  if (!canManageSharing.value) {
    publicShare.value = null;
    userShares.value = [];
    return;
  }
  shareError.value = null;
  try {
    const res = await fetch(`/api/cookbooks/${activeCookbook.value.id}/shares`, { credentials: 'include' });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data?.error || 'Unable to load shares.');
    publicShare.value = data.shares.publicShare;
    userShares.value = data.shares.userShares || [];
  } catch (err) {
    shareError.value = err.message || 'Unable to load shares.';
  }
};

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      activeCookbook.value = props.cookbook || null;
      hydrate(props.cookbook);
      shareError.value = null;
      error.value = null;
      loadShares();
    } else {
      selectedUser.value = null;
      canEditSelected.value = false;
      publicShare.value = null;
      userShares.value = [];
    }
  }
);

watch(
  () => props.cookbook,
  (cb) => {
    if (props.open) {
      activeCookbook.value = cb || null;
      hydrate(cb);
      loadShares();
    }
  }
);

onMounted(() => {
  if (props.open) {
    activeCookbook.value = props.cookbook || null;
    hydrate(props.cookbook);
    loadShares();
  }
});

const save = async () => {
  saving.value = true;
  error.value = null;
  try {
    const payload = {
      name: form.name,
      description: form.description,
      color: form.color,
    };
    const url = isNew.value ? '/api/cookbooks' : `/api/cookbooks/${activeCookbook.value.id}`;
    const method = isNew.value ? 'POST' : 'PUT';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data?.error || 'Unable to save cookbook.');
    activeCookbook.value = data.cookbook;
    emit(isNew.value ? 'created' : 'saved', data.cookbook);
    if (isNew.value) {
      await loadShares();
    }
  } catch (err) {
    error.value = err.message || 'Unable to save cookbook.';
  } finally {
    saving.value = false;
  }
};

const togglePublic = async (enabled) => {
  if (!activeCookbook.value?.id) return;
  try {
    const res = await fetch(`/api/cookbooks/${activeCookbook.value.id}/share/public`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ enabled }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data?.error || 'Unable to update sharing.');
    publicShare.value = data.share;
  } catch (err) {
    shareError.value = err.message || 'Unable to update sharing.';
  }
};

const saveUserShare = async () => {
  if (!activeCookbook.value?.id || !selectedUser.value) return;
  savingShare.value = true;
  shareError.value = null;
  try {
    const res = await fetch(`/api/cookbooks/${activeCookbook.value.id}/share/user`, {
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
  } catch (err) {
    shareError.value = err.message || 'Unable to share with user.';
  } finally {
    savingShare.value = false;
  }
};

const removeShare = async (share) => {
  if (!activeCookbook.value?.id) return;
  try {
    const res = await fetch(`/api/cookbooks/${activeCookbook.value.id}/share/user/${share.userId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data?.error || 'Unable to remove share.');
    userShares.value = userShares.value.filter((s) => s.userId !== share.userId);
  } catch (err) {
    shareError.value = err.message || 'Unable to remove share.';
  }
};

const copyLink = async (value) => {
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    shareError.value = 'Unable to copy link.';
  }
};
</script>
