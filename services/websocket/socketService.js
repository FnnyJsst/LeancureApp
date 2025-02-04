import { io } from 'socket.io-client';
import { ENV } from '../../config/env';

let socket;

export const initSocket = (userCredentials) => {
  if (!userCredentials) {
    console.error('🔴 Credentials required for socket initialization');
    return null;
  }

  socket = io(ENV.API_URL, {
    auth: {
      contractNumber: userCredentials.contractNumber,
      login: userCredentials.login
    },
    transports: ['websocket']
  });

  socket.on('connect', () => {
    console.log('🔌 Socket connecté');
  });

  socket.on('disconnect', () => {
    console.log('🔌 Socket déconnecté');
  });

  socket.on('error', (error) => {
    console.error('🔴 Erreur socket:', error);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
  }
};
