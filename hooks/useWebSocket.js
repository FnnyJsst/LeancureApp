import { useEffect, useRef, useCallback, useState } from 'react';
import { ENV } from '../config/env';
import { fetchChannelMessages } from '../services/api/messageApi';
import { useTranslation } from 'react-i18next';
import { handleError, ErrorType } from '../utils/errorHandling';
import { useNotification } from '../services/notification/notificationContext';
import { useCredentials } from '../hooks/useCredentials';

/**
 * Personalized hook to handle WebSocket connections
 * @param {Function} options.onMessage - Callback called when a message is received
 * @param {Function} options.onError - Callback called in case of error
 * @param {Array} options.channels - List of channels to monitor
 * @returns {Object} - Methods to interact with the WebSocket
 */
export const useWebSocket = ({ onMessage, onError, channels = [] }) => {
    // We get the translation function
    const { t } = useTranslation();

    // Access to the notification context to handle unread channels
    const { markChannelAsUnread, activeChannelId } = useNotification();

    // Use the useCredentials hook
    const { credentials, isLoading: credentialsLoading } = useCredentials();

    // We create a new WebSocket instance
    const ws = useRef(null);
    const isConnectingRef = useRef(false);
    const isClosingRef = useRef(false);
    const [isConnected, setIsConnected] = useState(false);
    const activeChannel = useRef(null);
    const reconnectTimeout = useRef(null);
    const reconnectAttempts = useRef(0);
    const MAX_RECONNECT_ATTEMPTS = 5;
    const RECONNECT_DELAY = 3000;
    const connectionTimeout = useRef(null);

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
        // Éviter les nettoyages multiples
        if (isClosingRef.current) {
            console.log('⚠️ Nettoyage déjà en cours, ignoré');
            return;
        }

        console.log('🧹 Nettoyage de la connexion WebSocket');
        isClosingRef.current = true;

        if (ws.current) {
            try {
                console.log('🔌 Fermeture de la connexion WebSocket');
                ws.current.close();
            } catch (error) {
                console.error('❌ Erreur lors de la fermeture de la connexion:', error);
            }
            ws.current = null;
        }

        if (reconnectTimeout.current) {
            console.log('⏱️ Nettoyage du timeout de reconnexion');
            clearTimeout(reconnectTimeout.current);
            reconnectTimeout.current = null;
        }

        if (connectionTimeout.current) {
            console.log('⏱️ Nettoyage du timeout de connexion');
            clearTimeout(connectionTimeout.current);
            connectionTimeout.current = null;
        }

        isConnectingRef.current = false;
        isClosingRef.current = false;
        setIsConnected(false);
        activeChannel.current = null;
        reconnectAttempts.current = 0;
        console.log('✅ Nettoyage terminé');
    }, []);

    /**
     * @description Send the subscription to the WebSocket server
     */
    const sendSubscription = useCallback(async () => {
        try {
            if (!ws.current || !channels.length || ws.current.readyState !== WebSocket.OPEN) {
                return;
            }

            const cleanChannels = channels.map(channel =>
                typeof channel === 'string' ?
                    channel.replace('channel_', '') :
                    channel.toString()
            );

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

            ws.current.send(JSON.stringify(subscriptionData));
        } catch (error) {
            handleWSError(error, 'sendSubscription');
        }
    }, [channels]);

    /**
     * @description Handle the notification message and mark channels as unread if needed
     * @param {Object} data - The parsed message data
     */
    const handleNotificationMessage = async (data) => {
        if (onMessage) {
            onMessage(data);
        }

        // We handle the notification message
        try {
            if (data.notification && data.notification.type === 'chat' && data.notification.message) {
                const notifMessage = data.notification.message;

                let channelId = notifMessage.channelId;
                if (!channelId && data.notification.filters && data.notification.filters.values) {
                    channelId = data.notification.filters.values.channel;
                }

                if (channelId && typeof channelId === 'string') {
                    channelId = channelId.replace('channel_', '');
                }

                // We check if the message is own
                const isOwnMessage = credentials && notifMessage.login === credentials.login;

                // If the message is not own and the channel id is not the active channel id, we mark the channel as unread
                if (!isOwnMessage && channelId && channelId !== activeChannelId) {
                    console.log('🔔 Marquage du canal comme non lu:', channelId);
                    markChannelAsUnread(channelId);
                }
            }

            if (data.message && data.message.type === 'messages' && Array.isArray(data.message.messages)) {
                // We check if there are new messages
                const hasNewMessages = data.message.messages.some(msg =>
                    credentials && msg.login !== credentials.login
                );

                let channelId = null;
                if (data.filters && data.filters.values) {
                    channelId = data.filters.values.channel;
                }

                if (channelId && typeof channelId === 'string') {
                    channelId = channelId.replace('channel_', '');
                }

                if (hasNewMessages && channelId && channelId !== activeChannelId) {
                    console.log('🔔 Marquage du canal comme non lu (nouveaux messages):', channelId);
                    markChannelAsUnread(channelId);
                }
            }
        } catch (error) {
            console.error('❌ Erreur lors du traitement du message pour les canaux non lus:', error);
        }
    };

    // Connect to the WebSocket server
    const connect = useCallback(async () => {
        if (isConnectingRef.current || isClosingRef.current || reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
            console.log('⚠️ Tentative de connexion ignorée:', {
                isConnecting: isConnectingRef.current,
                isClosing: isClosingRef.current,
                reconnectAttempts: reconnectAttempts.current
            });
            return;
        }

        if (ws.current) {
            console.log('🔄 Nettoyage de la connexion existante avant nouvelle connexion');
            cleanup();
        }

        try {
            isConnectingRef.current = true;
            const wsUrl = await ENV.WS_URL();
            console.log('🌐 Tentative de connexion à:', wsUrl);

            connectionTimeout.current = setTimeout(() => {
                if (ws.current && ws.current.readyState !== WebSocket.OPEN) {
                    console.log('⏰ Timeout de connexion WebSocket');
                    cleanup();
                    reconnectAttempts.current++;
                    if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
                        console.log(`🔄 Tentative de reconnexion ${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS}`);
                        reconnectTimeout.current = setTimeout(() => {
                            connect();
                        }, RECONNECT_DELAY);
                    }
                }
            }, 5000);

            ws.current = new WebSocket(wsUrl);

            ws.current.onopen = () => {
                if (!ws.current) return;
                console.log('🟢 WebSocket connecté avec succès. État:', ws.current.readyState);
                if (connectionTimeout.current) {
                    clearTimeout(connectionTimeout.current);
                }
                isConnectingRef.current = false;
                setIsConnected(true);
                reconnectAttempts.current = 0;
                sendSubscription();
            };

            ws.current.onclose = (event) => {
                if (isClosingRef.current) {
                    console.log('🔌 Fermeture intentionnelle de la connexion');
                    return;
                }
                console.log('🔌 WebSocket fermé. Code:', event.code, 'Raison:', event.reason);
                cleanup();
                clearInterval(pingInterval);

                if (event.code !== 1000) {
                    reconnectAttempts.current++;
                    if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
                        console.log(`🔄 Tentative de reconnexion ${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS}`);
                        reconnectTimeout.current = setTimeout(() => {
                            connect();
                        }, RECONNECT_DELAY);
                    } else {
                        console.error('❌ Nombre maximum de tentatives de reconnexion atteint');
                        handleWSError(new Error('Nombre maximum de tentatives de reconnexion atteint'), 'connection.max_attempts');
                    }
                }
            };

            ws.current.onerror = (error) => {
                console.error('❌ Erreur WebSocket:', error);
                handleWSError(error, 'connection.error');
                if (!isClosingRef.current) {
                    cleanup();
                    reconnectAttempts.current++;
                    if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
                        console.log(`🔄 Tentative de reconnexion ${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS}`);
                        reconnectTimeout.current = setTimeout(() => {
                            connect();
                        }, RECONNECT_DELAY);
                    }
                }
            };

            // We handle the notification event received from the WebSocket server
            ws.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    // If the message is a refresh content, we refresh the messages
                    if (data.type === 'refreshcontent') {
                        refreshMessages();
                        return;
                    }

                    if (data && typeof data === 'object') {
                        // We check the message format
                        if (data.message && data.message.type === 'messages') {
                            handleNotificationMessage(data);
                        } else if (data.type === 'notification') {
                            handleNotificationMessage(data);
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

            // We add a ping to keep the connection active
            const pingInterval = setInterval(() => {
                if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                    try {
                        ws.current.send(JSON.stringify({ type: 'ping' }));
                    } catch (error) {
                        console.log('❌ Erreur lors de l\'envoi du ping:', error);
                    }
                }
            }, 30000); // Ping every 30 seconds

        } catch (error) {
            console.error('❌ Erreur lors de la création de la connexion:', error);
            handleWSError(error, 'connection.create');
            isConnectingRef.current = false;
            cleanup();
            reconnectAttempts.current++;
            if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
                console.log(`🔄 Tentative de reconnexion ${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS}`);
                reconnectTimeout.current = setTimeout(() => {
                    connect();
                }, RECONNECT_DELAY);
            }
        }
    }, [onMessage, sendSubscription, cleanup]);

    // Nettoyage lors du démontage du composant
    useEffect(() => {
        console.log('🔄 Initialisation du hook useWebSocket');
        let isMounted = true;
        let cleanupCalled = false;

        return () => {
            if (!isMounted || cleanupCalled) return;
            console.log('🧹 Démontage du hook useWebSocket');
            isMounted = false;
            cleanupCalled = true;

            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
            }
            cleanup();
        };
    }, []);

    // Handle the channel change with debounce
    useEffect(() => {
        if (channels.length === 0) {
            if (ws.current && !isClosingRef.current) {
                cleanup();
            }
            return;
        }

        const currentChannel = channels[0];
        const cleanCurrentChannel = currentChannel?.replace('channel_', '');
        const cleanActiveChannel = activeChannel.current?.replace('channel_', '');

        if (cleanCurrentChannel !== cleanActiveChannel) {
            activeChannel.current = currentChannel;

            // Si nous avons une connexion active, on met juste à jour l'abonnement
            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                console.log('🔄 Mise à jour de l\'abonnement pour le canal:', cleanCurrentChannel);
                sendSubscription();
            } else if (!isConnectingRef.current && !isClosingRef.current) {
                // Sinon on établit une nouvelle connexion
                if (reconnectTimeout.current) {
                    clearTimeout(reconnectTimeout.current);
                }

                reconnectTimeout.current = setTimeout(() => {
                    connect();
                }, 500);
            }
        }
    }, [channels, connect, cleanup, sendSubscription]);

    /**
     * @description Refresh the messages when the channel is changed
     */
    const refreshMessages = useCallback(async () => {
        if (!channels.length || !credentials) {
            return;
        }

        try {

            const cleanChannelId = activeChannel.current?.replace('channel_', '');

            const messages = await fetchChannelMessages(cleanChannelId, credentials);

            if (onMessage && Array.isArray(messages)) {
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
    }, [channels, onMessage, credentials]);

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
            if (!credentials) {
                throw new Error(t('errors.noCredentialsFound'));
            }

            const cleanChannelId = activeChannel.current?.replace('channel_', '');

            const messageData = {
                "sender": "client",
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

            ws.current.send(JSON.stringify(messageData));
            return true;
        } catch (error) {
            handleWSError(error, 'sendMessage.process');
            return false;
        }
    };

    // Gestion des erreurs de connexion
    const handleConnectionError = useCallback((error, source) => {
        console.error(`❌ Erreur de connexion (${source}):`, error);
        handleWSError(error, source);
        cleanup();
        reconnectAttempts.current++;
        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
            console.log(`🔄 Tentative de reconnexion ${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS}`);
            reconnectTimeout.current = setTimeout(() => {
                connect();
            }, RECONNECT_DELAY);
        } else {
            console.error('❌ Nombre maximum de tentatives de reconnexion atteint');
        }
    }, [connect, cleanup]);

    return {
        sendMessage,
        closeConnection: cleanup,
        isConnected
    };
};