import { io } from 'socket.io-client';

let socket = null;

export const socketService = {
  connect: (token) => {
    if (socket?.connected) return socket;
    
    socket = io(window.location.origin, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    return socket;
  },

  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  getSocket: () => socket,

  joinDelivery: (deliveryId) => {
    socket?.emit('delivery:join', deliveryId);
  },

  leaveDelivery: (deliveryId) => {
    socket?.emit('delivery:leave', deliveryId);
  },

  emitLocation: (data) => {
    socket?.emit('postman:locationUpdate', data);
  },
};
