<template>
  <h1 class="text-2xl">Recipe App</h1>
  <p class="italic text-center text-sm">
      Tailwind test
  </p>
</template>

<script>
import { io } from 'socket.io-client';

const socket = io();

export default {
  name: 'App',
  data() {
    return {};
  },
  computed: {},
  methods: {},
  mounted() {
    socket.on( 'connect', () => {
      console.log( '[socket] connected', socket.id );
    } );

    socket.on( 'disconnect', ( reason ) => {
      console.log( '[socket] disconnected', reason );
    } );
  }
};
</script>
