<template>
  <section class="mx-auto w-full max-w-6xl">
    <div class="flex flex-col gap-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-orange-600">Settings</p>
          <h1 class="text-2xl font-semibold text-slate-900">Friends</h1>
          <p class="text-sm text-slate-600">Find friends, manage requests, and keep your sharing circle tidy.</p>
        </div>
        <button
            class="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-700"
            type="button"
            :disabled="friendStore.state.loading"
            @click="refresh"
        >
          Refresh
        </button>
      </div>

      <div class="grid gap-4 lg:grid-cols-2">
        <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold text-slate-900">Find people</p>
            <span class="text-xs font-semibold text-slate-500">Search & invite</span>
          </div>
          <label class="relative mt-3 block">
            <input
                v-model="searchQuery"
                type="search"
                inputmode="search"
                class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100"
                placeholder="Search by username"
            />
          </label>
          <p v-if="searchError" class="mt-2 text-xs font-semibold text-red-600">{{ searchError }}</p>
          <div v-if="searchLoading" class="mt-3 text-sm text-slate-600">Searching…</div>
          <div v-else-if="!searchResults.length && searchQuery.trim()" class="mt-3 text-sm text-slate-600">
            No users found.
          </div>
          <div v-else class="mt-3 space-y-2">
            <div
                v-for="user in searchResults"
                :key="user.id"
                class="flex items-center justify-between rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200"
            >
              <div>
                <p class="text-sm font-semibold text-slate-900">{{ user.username }}</p>
                <p class="text-xs text-slate-600">
                  <span v-if="user.isFriend">Already friends</span>
                  <span v-else-if="user.incomingRequest">Sent you a request</span>
                  <span v-else-if="user.outgoingRequest">Request sent</span>
                  <span v-else>Send a friend request</span>
                </p>
              </div>
              <div class="flex items-center gap-2">
                <button
                    v-if="user.isFriend"
                    type="button"
                    class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100"
                    disabled
                >
                  Friends
                </button>
                <div v-else-if="user.incomingRequest" class="flex items-center gap-2">
                  <button
                      class="rounded-full bg-orange-600 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-orange-700 disabled:opacity-60"
                      type="button"
                      :disabled="actionBusy === user.id"
                      @click="acceptIncoming(user.id)"
                  >
                    Accept
                  </button>
                  <button
                      class="text-xs font-semibold text-slate-600 hover:text-rose-600"
                      type="button"
                      :disabled="actionBusy === user.id"
                      @click="rejectIncoming(user.id)"
                  >
                    Reject
                  </button>
                </div>
                <button
                    v-else-if="user.outgoingRequest"
                    type="button"
                    class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                    disabled
                >
                  Pending
                </button>
                <button
                    v-else
                    class="rounded-full bg-orange-600 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
                    type="button"
                    :disabled="actionBusy === user.id"
                    @click="sendRequest(user.id)"
                >
                  Add friend
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold text-slate-900">Requests</p>
            <span class="text-xs font-semibold text-slate-500">{{ incomingRequests.length }} waiting</span>
          </div>
          <div class="mt-3 space-y-3">
            <div v-if="incomingRequests.length" class="space-y-2">
              <p class="text-xs font-semibold uppercase tracking-[0.15em] text-orange-600">Incoming</p>
              <div
                  v-for="req in incomingRequests"
                  :key="req.id"
                  class="flex items-center justify-between rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200"
              >
                <div>
                  <p class="text-sm font-semibold text-slate-900">{{ req.username }}</p>
                  <p class="text-xs text-slate-500">Sent a request</p>
                </div>
                <div class="flex items-center gap-2">
                  <button
                      class="rounded-full bg-orange-600 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-orange-700 disabled:opacity-60"
                      type="button"
                      :disabled="actionBusy === req.id"
                      @click="accept(req.id)"
                  >
                    Accept
                  </button>
                  <button
                      class="text-xs font-semibold text-slate-600 hover:text-rose-600"
                      type="button"
                      :disabled="actionBusy === req.id"
                      @click="reject(req.id)"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
            <div v-if="outgoingRequests.length" class="space-y-2">
              <p class="text-xs font-semibold uppercase tracking-[0.15em] text-slate-600">Outgoing</p>
              <div
                  v-for="req in outgoingRequests"
                  :key="req.id"
                  class="flex items-center justify-between rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200"
              >
                <div>
                  <p class="text-sm font-semibold text-slate-900">{{ req.username }}</p>
                  <p class="text-xs text-slate-500">Waiting on them</p>
                </div>
                <span class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Pending</span>
              </div>
            </div>
            <p v-if="!incomingRequests.length && !outgoingRequests.length" class="text-sm text-slate-600">
              No requests right now.
            </p>
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <p class="text-sm font-semibold text-slate-900">Your friends</p>
          <span class="text-xs font-semibold text-slate-500">{{ friends.length }} total</span>
        </div>
        <div v-if="friendStore.state.loading && !friendStore.state.ready" class="mt-3 text-sm text-slate-600">
          Loading friends…
        </div>
        <div v-else class="mt-3 space-y-2">
          <div
              v-for="friend in friends"
              :key="friend.userId"
              class="flex items-center justify-between rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200"
          >
            <div>
              <p class="text-sm font-semibold text-slate-900">{{ friend.username }}</p>
              <p class="text-xs text-slate-500">Connected</p>
            </div>
            <button
                class="text-xs font-semibold text-rose-600 hover:underline disabled:opacity-60"
                type="button"
                :disabled="actionBusy === friend.userId"
                @click="remove(friend)"
            >
              Remove
            </button>
          </div>
          <p v-if="!friends.length" class="text-sm text-slate-600">No friends yet. Send a request to get started.</p>
        </div>
      </div>

      <p v-if="pageError" class="text-sm font-semibold text-red-600">{{ pageError }}</p>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import SettingsSidebar from '../components/SettingsSidebar.vue';
import { useFriendStore } from '../stores/friendStore';

const friendStore = useFriendStore();

const friends = computed( () => friendStore.state.friends || [] );
const incomingRequests = computed( () => friendStore.state.incoming || [] );
const outgoingRequests = computed( () => friendStore.state.outgoing || [] );

const searchQuery = ref( '' );
const rawResults = ref( [] );
const searchLoading = ref( false );
const searchError = ref( null );
const pageError = ref( null );
const actionBusy = ref( null );
let debounceId = null;

const mergedResults = computed( () =>
    rawResults.value.map( ( user ) => {
      const isFriend = friends.value.some( ( f ) => f.userId === user.id ) || user.isFriend;
      const incomingRequest =
          incomingRequests.value.some( ( req ) => req.fromUserId === user.id ) || Boolean( user.incomingRequest );
      const outgoingRequest =
          outgoingRequests.value.some( ( req ) => req.toUserId === user.id ) || Boolean( user.outgoingRequest );
      return { ...user, isFriend, incomingRequest, outgoingRequest };
    } )
);

const searchResults = computed( () => mergedResults.value );

const refresh = async () => {
  pageError.value = null;
  try {
    await friendStore.loadFriends( true );
    if ( searchQuery.value.trim() ) {
      await runSearch( searchQuery.value );
    }
  } catch ( error ) {
    pageError.value = error.message || 'Unable to refresh friends.';
  }
};

const runSearch = async ( value ) => {
  const query = value.trim();
  if ( !query ) {
    rawResults.value = [];
    searchError.value = null;
    return;
  }
  searchLoading.value = true;
  searchError.value = null;
  try {
    const res = await fetch( `/api/friends/search?q=${ encodeURIComponent( query ) }`, { credentials: 'include' } );
    const data = await res.json();
    if ( !res.ok || !data.success ) throw new Error( data?.error || 'Unable to search users.' );
    rawResults.value = data.users || [];
  } catch ( error ) {
    searchError.value = error.message || 'Unable to search users.';
  } finally {
    searchLoading.value = false;
  }
};

watch(
    () => searchQuery.value,
    ( value ) => {
      if ( debounceId ) clearTimeout( debounceId );
      debounceId = setTimeout( () => runSearch( value ), 200 );
    }
);

const sendRequest = async ( userId ) => {
  pageError.value = null;
  actionBusy.value = userId;
  try {
    await friendStore.sendRequest( userId );
    await refresh();
  } catch ( error ) {
    pageError.value = error.message || 'Unable to send request.';
  } finally {
    actionBusy.value = null;
  }
};

const accept = async ( requestId ) => {
  pageError.value = null;
  actionBusy.value = requestId;
  try {
    await friendStore.acceptRequest( requestId );
    await refresh();
  } catch ( error ) {
    pageError.value = error.message || 'Unable to accept request.';
  } finally {
    actionBusy.value = null;
  }
};

const reject = async ( requestId ) => {
  pageError.value = null;
  actionBusy.value = requestId;
  try {
    await friendStore.rejectRequest( requestId );
    await refresh();
  } catch ( error ) {
    pageError.value = error.message || 'Unable to reject request.';
  } finally {
    actionBusy.value = null;
  }
};

const acceptIncoming = async ( userId ) => {
  const req = incomingRequests.value.find( ( r ) => r.fromUserId === userId );
  if ( !req ) return;
  await accept( req.id );
};

const rejectIncoming = async ( userId ) => {
  const req = incomingRequests.value.find( ( r ) => r.fromUserId === userId );
  if ( !req ) return;
  await reject( req.id );
};

const remove = async ( friend ) => {
  if ( !friend ) return;
  if ( !window.confirm( `Remove ${ friend.username } from your friends?` ) ) return;
  pageError.value = null;
  actionBusy.value = friend.userId;
  try {
    await friendStore.removeFriend( friend.userId );
    await refresh();
  } catch ( error ) {
    pageError.value = error.message || 'Unable to remove friend.';
  } finally {
    actionBusy.value = null;
  }
};

onMounted( () => {
  friendStore.loadFriends();
} );
</script>
