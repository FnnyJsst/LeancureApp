// import { io } from 'socket.io-client';
// import { ENV } from '../../config/env';

// let socket;

// /**
//  * @function initSocket
//  * @description Initialize the socket connection
//  * @param {Object} userCredentials - The user credentials
//  * @returns {Object} The socket object
//  */
// export const initSocket = (userCredentials) => {
//   if (!userCredentials) {

//     console.error('🔴 Credentials required for socket initialization');
//     return null;
//   }
//   // We establish connection with the server and pass the user credentials
//   socket = io(ENV.API_URL, {
//     auth: {
//       contractNumber: userCredentials.contractNumber,
//       login: userCredentials.login
//     },
//     transports: ['websocket']
//   });

//   return socket;
// };


// /**
//  * @function getSocket
//  * @description Get the socket object
//  * @returns {Object} The socket object
//  */
// export const getSocket = () => socket;



// export const disconnectSocket = () => {
//   if (socket) {
//     socket.disconnect();
//   }
// };
