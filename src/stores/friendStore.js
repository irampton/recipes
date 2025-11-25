import { reactive } from 'vue';
import socket from '../services/socket';

const state = reactive({
  friends: [],
  incoming: [],
  outgoing: [],
  loading: false,
  ready: false,
  error: null,
});

let socketBound = false;

const ensureSocketBound = () => {
  if (socketBound) return;
  socket.on('friends:updated', () => {
    loadFriends(true);
  });
  socketBound = true;
};

const loadFriends = async (force = false) => {
  ensureSocketBound();
  if (state.loading || (state.ready && !force)) return state.friends;
  state.loading = true;
  state.error = null;
  try {
    const res = await fetch('/api/friends', { credentials: 'include' });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data?.error || 'Unable to load friends.');
    state.friends = data.friends || [];
    state.incoming = data.requests?.incoming || [];
    state.outgoing = data.requests?.outgoing || [];
    state.ready = true;
    return state.friends;
  } catch (error) {
    state.error = error.message || 'Unable to load friends.';
    throw error;
  } finally {
    state.loading = false;
  }
};

const sendRequest = async (userId) => {
  if (!userId) throw new Error('Missing user id.');
  const res = await fetch('/api/friend-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ userId }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data?.error || 'Unable to send request.');
  await loadFriends(true);
  return data;
};

const acceptRequest = async (requestId) => {
  const res = await fetch(`/api/friend-requests/${requestId}/accept`, { method: 'POST', credentials: 'include' });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data?.error || 'Unable to accept request.');
  await loadFriends(true);
  return data;
};

const rejectRequest = async (requestId) => {
  const res = await fetch(`/api/friend-requests/${requestId}/reject`, { method: 'POST', credentials: 'include' });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data?.error || 'Unable to reject request.');
  await loadFriends(true);
  return data;
};

const removeFriend = async (userId) => {
  const res = await fetch(`/api/friends/${userId}`, { method: 'DELETE', credentials: 'include' });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data?.error || 'Unable to remove friend.');
  await loadFriends(true);
  return true;
};

const reset = () => {
  state.friends = [];
  state.incoming = [];
  state.outgoing = [];
  state.loading = false;
  state.ready = false;
  state.error = null;
};

const hasPendingRequests = () => (state.incoming || []).length > 0;
const pendingCount = () => (state.incoming || []).length;

export const useFriendStore = () => ({
  state,
  loadFriends,
  sendRequest,
  acceptRequest,
  rejectRequest,
  removeFriend,
  reset,
  hasPendingRequests,
  pendingCount,
});
