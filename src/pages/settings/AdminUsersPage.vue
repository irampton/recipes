<template>
  <section class="mx-auto flex max-w-5xl flex-col gap-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
    <div class="flex items-start justify-between gap-4">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.25em] text-orange-600">Admin</p>
        <h1 class="text-2xl font-semibold text-slate-900">Users</h1>
        <p class="text-sm text-slate-600">Manage users, roles, and issue join codes.</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <label class="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-700">
          Max uses
          <input
            v-model.number="state.maxUses"
            type="number"
            min="1"
            max="50"
            class="w-16 rounded border border-slate-200 px-2 py-1 text-sm font-semibold text-slate-900"
          />
        </label>
        <label class="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-700">
          Expires
          <input
            v-model="state.expiresAt"
            type="date"
            class="rounded border border-slate-200 px-2 py-1 text-sm font-semibold text-slate-900"
          />
        </label>
        <button
          class="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-100"
          type="button"
          :disabled="state.loading"
          @click="loadData"
        >
          Refresh
        </button>
        <button
          class="rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          :disabled="state.generating"
          @click="generateCode('user')"
        >
          New join code
        </button>
      </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div class="flex items-center justify-between">
          <p class="text-sm font-semibold text-slate-900">Users</p>
          <span class="text-xs font-semibold text-slate-600">{{ state.users.length }} total</span>
        </div>
        <div v-if="state.loading" class="mt-3 text-sm text-slate-600">Loading users…</div>
        <div v-else class="mt-3 space-y-2">
          <div
            v-for="user in state.users"
            :key="user.id"
            class="flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200"
          >
            <div>
              <p class="text-sm font-semibold text-slate-900">{{ user.username }}</p>
              <p class="text-xs uppercase tracking-[0.15em] text-orange-600">{{ user.role }}</p>
            </div>
            <div class="flex items-center gap-2">
              <select
                v-if="isOwner && user.role !== 'owner'"
                v-model="userRoles[user.id]"
                class="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-slate-800"
                @change="updateRole(user.id, userRoles[user.id])"
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
              <button
                v-if="user.role !== 'owner'"
                class="text-xs font-semibold text-red-600 hover:underline"
                type="button"
                @click="openDeleteDialog(user)"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-orange-100 bg-orange-50 p-4">
        <div class="flex items-center justify-between">
          <p class="text-sm font-semibold text-orange-900">Join codes</p>
          <span class="text-xs font-semibold text-orange-700">Share with care</span>
        </div>
        <div v-if="state.loading" class="mt-3 text-sm text-orange-800">Loading codes…</div>
        <div v-else class="mt-3 space-y-2">
          <div
            v-for="code in state.joinCodes"
            :key="code.code"
            class="flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-orange-100"
          >
            <div>
              <p class="font-mono text-sm font-semibold text-slate-900">{{ printableCode(code.code) }}</p>
              <p class="text-xs uppercase tracking-[0.15em] text-orange-600">{{ code.role }}</p>
            </div>
            <div class="flex items-center gap-3">
              <div class="text-right text-xs text-slate-600">
                <p>{{ code.usedCount }} / {{ code.maxUses }} used</p>
                <p v-if="code.expiresAt">Expires {{ formatDate(code.expiresAt) }}</p>
                <p v-else>Never expires</p>
              </div>
              <button
                class="text-xs font-semibold text-red-600 hover:underline"
                type="button"
                @click="removeCode(code.code)"
              >
                Delete
              </button>
            </div>
          </div>
          <p v-if="!state.joinCodes.length" class="text-sm text-orange-800">No codes yet.</p>
        </div>
      </div>
    </div>

    <p v-if="state.error" class="text-sm font-semibold text-red-600">{{ state.error }}</p>

    <ConfirmDialog
      :open="deleteDialog.open"
      :title="`Remove ${deleteDialog.user?.username || 'this user'}?`"
      :message="`This will permanently remove ${deleteDialog.user?.username || 'the user'} and their access. This cannot be undone.`"
      confirm-label="Remove"
      @cancel="closeDeleteDialog"
      @confirm="confirmRemove"
    />
  </section>
</template>

<script setup>
import { computed, onMounted, reactive } from 'vue';
import ConfirmDialog from '../../baseComponents/ConfirmDialog.vue';
import { useAuthStore } from '../../stores/authStore';

const auth = useAuthStore();
const state = reactive({
  users: [],
  joinCodes: [],
  userRoles: {},
  maxUses: 1,
  expiresAt: '',
  loading: false,
  generating: false,
  error: null,
});

const userRoles = state.userRoles;
const isOwner = computed(() => auth.isOwner());
const deleteDialog = reactive({
  open: false,
  user: null,
  deleting: false,
});

const loadData = async () => {
  state.loading = true;
  state.error = null;
  try {
    const [usersRes, codesRes] = await Promise.all([
      fetch('/api/users', { credentials: 'include' }),
      fetch('/api/join-codes', { credentials: 'include' }),
    ]);
    const usersData = await usersRes.json();
    const codesData = await codesRes.json();
    if (!usersRes.ok || !usersData.success) throw new Error(usersData?.error || 'Unable to load users.');
    if (!codesRes.ok || !codesData.success) throw new Error(codesData?.error || 'Unable to load join codes.');
    state.users = usersData.users || [];
    state.joinCodes = codesData.joinCodes || [];
    state.users.forEach((u) => {
      userRoles[u.id] = u.role;
    });
  } catch (error) {
    state.error = error.message || 'Unable to load admin data.';
  } finally {
    state.loading = false;
  }
};

const generateCode = async (role) => {
  state.generating = true;
  state.error = null;
  try {
    const res = await fetch('/api/join-codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ role, expiresAt: state.expiresAt || null, maxUses: state.maxUses || 1 }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data?.error || 'Unable to create join code.');
    state.joinCodes.unshift({
      code: data.code,
      role,
      usedBy: null,
      usedCount: 0,
      maxUses: state.maxUses || 1,
      expiresAt: state.expiresAt || null,
    });
  } catch (error) {
    state.error = error.message || 'Unable to create join code.';
  } finally {
    state.generating = false;
  }
};

const openDeleteDialog = (user) => {
  deleteDialog.user = user;
  deleteDialog.open = true;
  state.error = null;
};

const closeDeleteDialog = () => {
  deleteDialog.open = false;
  deleteDialog.user = null;
};

const confirmRemove = async () => {
  if (!deleteDialog.user || deleteDialog.deleting) return;
  deleteDialog.deleting = true;
  try {
    const res = await fetch(`/api/users/${deleteDialog.user.id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data?.error || 'Unable to remove user.');
    state.users = state.users.filter((u) => u.id !== deleteDialog.user.id);
    closeDeleteDialog();
  } catch (error) {
    state.error = error.message || 'Unable to remove user.';
  } finally {
    deleteDialog.deleting = false;
  }
};

const updateRole = async (id, role) => {
  if (!isOwner.value) return;
  try {
    const res = await fetch(`/api/users/${id}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ role }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data?.error || 'Unable to update role.');
  } catch (error) {
    state.error = error.message || 'Unable to update role.';
  }
};

onMounted(() => {
  loadData();
});

const printableCode = (code) => `${code.slice(0, 4)}-${code.slice(4)}`;
const formatDate = (value) => new Date(value).toLocaleDateString();

const removeCode = async (code) => {
  if (!window.confirm('Delete this code?')) return;
  try {
    const res = await fetch(`/api/join-codes/${code}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data?.error || 'Unable to delete code.');
    state.joinCodes = state.joinCodes.filter((c) => c.code !== code);
  } catch (error) {
    state.error = error.message || 'Unable to delete code.';
  }
};
</script>
