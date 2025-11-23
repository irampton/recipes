import { io } from 'socket.io-client';

const socket = io({
  transports: ['websocket', 'polling'],
  autoConnect: true,
});

socket.on('connect', () => {
  console.log('[socket] connected', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('[socket] disconnected', reason);
});

export default socket;
