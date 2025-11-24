import { reactive } from 'vue';
import socket from '../services/socket';

const state = reactive({
  user: null,
  ready: false,
  loading: false,
  error: null,
});

const setUser = (user) => {
  state.user = user || null;
  state.error = null;
  state.ready = true;
  if (state.user) {
    if (!socket.connected) socket.connect();
  } else {
    if (socket.connected) socket.disconnect();
  }
};

const fetchMe = async () => {
  try {
    const res = await fetch('/api/me', { credentials: 'include' });
    if (!res.ok) {
      setUser(null);
      return null;
    }
    const data = await res.json();
    if (data.success) {
      setUser(data.user);
      return data.user;
    }
    setUser(null);
    return null;
  } catch (error) {
    state.error = 'Unable to verify session.';
    setUser(null);
    return null;
  }
};

const ensureReady = async () => {
  if (state.ready) return state.user;
  return fetchMe();
};

const login = async ({ username, password }) => {
  state.loading = true;
  state.error = null;
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      const err = data?.error || 'Login failed.';
      state.error = err;
      throw new Error(err);
    }
    setUser(data.user);
    return data.user;
  } finally {
    state.loading = false;
  }
};

const signup = async ({ username, password, joinCode }) => {
  state.loading = true;
  state.error = null;
  try {
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password, joinCode }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      const err = data?.error || 'Signup failed.';
      state.error = err;
      throw new Error(err);
    }
    setUser(data.user);
    return data.user;
  } finally {
    state.loading = false;
  }
};

const logout = async () => {
  try {
    await fetch('/api/logout', { method: 'POST', credentials: 'include' });
  } catch {
    // ignore logout network errors
  }
  setUser(null);
};

export const useAuthStore = () => ({
  state,
  ensureReady,
  fetchMe,
  login,
  signup,
  logout,
  canManageUsers: () => ['owner', 'admin'].includes(state.user?.role),
  isOwner: () => state.user?.role === 'owner',
});
