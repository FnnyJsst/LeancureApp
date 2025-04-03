import { useEffect, useRef, useCallback, useState } from 'react';
import { ENV } from '../config/env';
import * as SecureStore from 'expo-secure-store';
import { fetchChannelMessages } from '../services/api/messageApi';
import { useTranslation } from 'react-i18next';
import { handleError, ErrorType } from '../utils/errorHandling';
import { scheduleNotification } from '../services/notificationService';

/**
 * Personalized hook to handle WebSocket connections
 * @param {Object} options - Configuration options
 * @param {Function} options.onMessage - Callback called when a message is received
 * @param {Function} options.onError - Callback called in case of error
 * @param {Array} options.channels - List of channels to monitor
 * @returns {Object} - Methods to interact with the WebSocket
 */
export const useWebSocket = ({ onMessage, onError, channels = [] }) => {
    // We get the translation function
    const { t } = useTranslation();

    // We create a new WebSocket instance
    const ws = useRef(null);
    const isConnecting = useRef(false);
    const [isConnected, setIsConnected] = useState(false);
    const activeChannel = useRef(null);

    /**
     * @description Handle WebSocket errors
     * @param {Error} error - The error
     * @param {string} source - The source
     * @param {object} options - Additional options
     * @returns {object} Formatted error
     */
    const handleWSError = (error, source, options = {}) => {
        return handleError(error, source, {
            type: ErrorType.WEBSOCKET,
            callback: onError,
            ...options
        });
    };

    /**
     * @description Cleanup the WebSocket connection
     */
    const cleanup = useCallback(() => {
        if (ws.current) {
            ws.current.close();
            ws.current = null;
        }
        // Set the connection state to disconnected
        isConnecting.current = false;
        setIsConnected(false);
        // Set the active channel to null
        activeChannel.current = null;
    }, []);

    /**
     * @description Send the subscription to the WebSocket server
     */
    const sendSubscription = useCallback(async () => {
        try {
            // Vérification plus robuste de l'état de la connexion
            if (!ws.current || !channels.length) {
                console.log('❌ Impossible d\'envoyer la souscription: WebSocket non initialisé ou pas de canaux');
                return;
            }

            if (ws.current.readyState !== WebSocket.OPEN) {
                console.log('❌ Impossible d\'envoyer la souscription: WebSocket non connecté');
                return;
            }

            // Clean the channels
            const cleanChannels = channels.map(channel =>
                typeof channel === 'string' ?
                    channel.replace('channel_', '') :
                    channel.toString()
            );

            // Send the subscription to the WebSocket server to receive messages from the channels
            const subscriptionData = {
                "sender": "client",
                "subscriptions": [
                    {
                        "package": "amaiia_messages",
                        "page": "message_reader",
                        "filters": {
                            "values": {
                                "channel": cleanChannels
                            }
                        }
                    }
                ]
            };

            console.log('📤 Envoi de la souscription pour les canaux:', cleanChannels);
            ws.current.send(JSON.stringify(subscriptionData));
        } catch (error) {
            handleWSError(error, 'sendSubscription');
        }
    }, [channels]);

    // Connect to the WebSocket server
    const connect = useCallback(async () => {
        // Vérification plus robuste de l'état de la connexion
        if (isConnecting.current) {
            console.log('⚠️ Connexion déjà en cours...');
            return;
        }

        // Nettoyage de la connexion existante
        if (ws.current) {
            console.log('🧹 Nettoyage de la connexion existante');
            cleanup();
        }

        // Try to connect to the WebSocket server
        try {
            isConnecting.current = true;
            // We get the WebSocket URL from the environment variables
            const wsUrl = await ENV.WS_URL();
            console.log('🌐 Tentative de connexion à:', wsUrl);

            // We create a new WebSocket instance
            ws.current = new WebSocket(wsUrl);

            // We handle the connection open event
            ws.current.onopen = () => {
                console.log('🟢 WebSocket connecté avec succès. État:', ws.current.readyState);
                isConnecting.current = false;
                setIsConnected(true);
                // Envoi immédiat de la souscription
                sendSubscription();
            };

            // We handle the connection close event
            ws.current.onclose = (event) => {
                // We get the close event details
                const closeInfo = {
                    code: event.code,
                    reason: event.reason,
                    wasClean: event.wasClean,
                    timestamp: new Date().toISOString()
                };
                console.log('🔵 WebSocket fermé avec les détails:', closeInfo);
                // We clean the connection
                cleanup();

                // Si la déconnexion n'est pas normale, on essaie de se reconnecter
                if (event.code !== 1000) {
                    console.log('🔄 Tentative de reconnexion dans 3 secondes...');
                    setTimeout(() => {
                        connect();
                    }, 3000);
                }
            };

            // We handle the connection error event
            ws.current.onerror = (error) => {
                console.error('❌ Erreur WebSocket:', error);
                handleWSError(error, 'connection.error');
                // On essaie de se reconnecter
                setTimeout(() => {
                    connect();
                }, 3000);
            };

            // We handle the notification event received from the WebSocket server
            ws.current.onmessage = (event) => {
                try {
                    console.log('📨 Message brut reçu:', event.data);
                    const data = JSON.parse(event.data);
                    console.log('📨 Message parsé:', data);

                    if (data.type === 'refreshcontent') {
                        console.log('🔄 Rafraîchissement du contenu demandé');
                        refreshMessages();
                        return;
                    }

                    if (data && typeof data === 'object') {
                        // Vérification du format du message
                        if (data.message && data.message.type === 'messages') {
                            console.log('📨 Message de type "messages" reçu:', data.message);
                            if (onMessage) {
                                onMessage(data);
                            }
                        } else if (data.type === 'notification') {
                            console.log('📨 Notification reçue:', data);
                            if (onMessage) {
                                onMessage(data);
                            }
                        } else {
                            console.log('⚠️ Format de message non reconnu:', data);
                        }
                    } else {
                        console.log('⚠️ Message reçu non valide:', data);
                    }
                } catch (error) {
                    console.error('❌ Erreur lors du traitement du message:', error);
                    handleWSError(
                        { ...error, data: event.data },
                        'message.parsing'
                    );
                }
            };

            // Ajout d'un ping pour maintenir la connexion active
            const pingInterval = setInterval(() => {
                if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                    try {
                        console.log('🏓 Envoi d\'un ping');
                        ws.current.send(JSON.stringify({ type: 'ping' }));
                    } catch (error) {
                        console.log('❌ Erreur lors de l\'envoi du ping:', error);
                    }
                }
            }, 30000); // Ping toutes les 30 secondes

            // Nettoyage de l'intervalle lors de la déconnexion
            ws.current.onclose = (event) => {
                clearInterval(pingInterval);
                // ... reste du code existant ...
            };

        } catch (error) {
            // If the connection is not created, we log the error
            handleWSError(error, 'connection.create');
            isConnecting.current = false;
            // On essaie de se reconnecter
            setTimeout(() => {
                connect();
            }, 3000);
        }
    }, [onMessage, sendSubscription, cleanup]);

    // Handle the channel change
    useEffect(() => {
        // If there are no channels, we clean the connection
        if (channels.length === 0) {
            cleanup();
            return;
        }

        // We get the current channel
        const currentChannel = channels[0];

        // We clean the current and active channels
        const cleanCurrentChannel = currentChannel?.replace('channel_', '');
        const cleanActiveChannel = activeChannel.current?.replace('channel_', '');

        // If the current channel is different from the active channel, we change the channel
        if (cleanCurrentChannel !== cleanActiveChannel) {
            console.log('🔄 Changement de canal:', cleanCurrentChannel);
            // We update the active channel
            activeChannel.current = currentChannel;

            // On se reconnecte pour s'assurer d'avoir une connexion propre
            connect();
        }
    }, [channels, connect, cleanup]);

    // When the component is unmounted, we clean the connection
    useEffect(() => {
        return () => {
            cleanup();
        };
    }, [cleanup]);

    /**
     * @description Refresh the messages when the channel is changed
     */
    const refreshMessages = useCallback(async () => {
        // If there are no channels, we return null
        if (!channels.length) {
            return;
        }

        try {
            // We get the user credentials
            const credentialsStr = await SecureStore.getItemAsync('userCredentials');
            // If the credentials are not found, we throw an error
            if (!credentialsStr) {
                throw new Error(t('errors.noCredentialsFound'));
            }

            const credentials = JSON.parse(credentialsStr);
            const cleanChannelId = activeChannel.current?.replace('channel_', '');

            // We fetch the channel messages
            const messages = await fetchChannelMessages(cleanChannelId, credentials);

            if (onMessage && Array.isArray(messages)) {

                // We format the messages to match the expected format
                const formattedData = {
                    type: 'notification',
                    filters: {
                        values: {
                            channel: cleanChannelId
                        }
                    },
                    message: {
                        type: 'messages',
                        messages: messages.map(msg => ({
                            id: msg.id?.toString() || '',
                            type: msg.type || 'text',
                            message: msg.message || msg.text || '',
                            savedTimestamp: msg.savedTimestamp?.toString() || Date.now().toString(),
                            fileType: msg.fileType || 'none',
                            login: msg.login || '',
                            isOwnMessage: msg.login === credentials.login,
                            isUnread: false,
                            username: msg.login === credentials.login ? 'Me' : (msg.login || 'Unknown')
                        }))
                    }
                };

                onMessage(formattedData);
            }
        } catch (error) {
            handleWSError(error, 'refreshMessages');
        }
    }, [channels, onMessage]);

    /**
     * @description Send a message to the WebSocket server
     * @param {object} message - The message to send
     * @returns {boolean} - True if the message is sent, false otherwise
     */
    const sendMessage = async (message) => {
        if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
            const stateError = {
                message: 'WebSocket non connecté',
                wsExists: !!ws.current,
                readyState: ws.current?.readyState
            };
            handleWSError(stateError, 'sendMessage.connection', { silent: false });
            return false;
        }

        try {
            // We get the user credentials
            const credentialsStr = await SecureStore.getItemAsync('userCredentials');
            // If the credentials are not found, we throw an error
            if (!credentialsStr) {
                throw new Error(t('errors.noCredentialsFound'));
            }

            // We parse the credentials
            const credentials = JSON.parse(credentialsStr);
            // We get the clean channel id
            const cleanChannelId = activeChannel.current?.replace('channel_', '');

            // We create the message data
            const messageData = {
                "package": "amaiia_msg_srv",
                "page": "message",
                "cmd": [
                    {
                        "amaiia_msg_srv": {
                            "message": {
                                "add": {
                                    "channelid": parseInt(cleanChannelId, 10),
                                    "title": message.title || "Message",
                                    "details": message.text || message,
                                    "enddatets": 0,
                                    "sentby": credentials.accountApiKey
                                }
                            }
                        }
                    }
                ]
            };
            // We send the message to the WebSocket server
            ws.current.send(JSON.stringify(messageData));
            // If the message is sent, we log the success
            console.log('✅ Message envoyé avec succès');
            return true;
        } catch (error) {
            handleWSError(error, 'sendMessage.process');
            return false;
        }
    };

    return {
        sendMessage,
        closeConnection: cleanup,
        isConnected
    };
};