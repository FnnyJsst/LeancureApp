import { useEffect, useRef, useCallback, useState } from 'react';
import { ENV } from '../config/env';
import { fetchChannelMessages } from '../services/api/messageApi';
import { useTranslation } from 'react-i18next';
import { handleError, ErrorType } from '../utils/errorHandling';
import { useNotification } from '../services/notificationContext';
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
        // Set the connection state to disconnected and the active channel to null
        isConnecting.current = false;
        setIsConnected(false);
        activeChannel.current = null;
    }, []);

    /**
     * @description Send the subscription to the WebSocket server
     */
    const sendSubscription = useCallback(async () => {
        try {
            // Check if the WebSocket is not initialized or if there are no channels
            if (!ws.current || !channels.length ||ws.current.readyState !== WebSocket.OPEN)  {
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
        // We check if the connection is already in progress
        if (isConnecting.current) {
            return;
        }

        // We clean the existing connection
        if (ws.current) {
            console.log('🧹 Cleaning the existing connection');
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
                sendSubscription();
            };

            // We handle the connection close event
            ws.current.onclose = (event) => {
                cleanup();

                // If the disconnection is not normal, we try to reconnect
                if (event.code !== 1000) {
                    setTimeout(() => {
                        connect();
                    }, 3000);
                }
            };

            // We handle the connection error event
            ws.current.onerror = (error) => {
                console.error('❌ Erreur WebSocket:', error);
                handleWSError(error, 'connection.error');
                // We try to reconnect
                setTimeout(() => {
                    connect();
                }, 3000);
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

            // We clean the interval when the connection is closed
            ws.current.onclose = (event) => {
                clearInterval(pingInterval);
            };

        } catch (error) {
            // If the connection is not created, we log the error
            handleWSError(error, 'connection.create');
            isConnecting.current = false;
            // We try to reconnect
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
            // We update the active channel
            activeChannel.current = currentChannel;

            // We reconnect to ensure we have a clean connection
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

            ws.current.send(JSON.stringify(messageData));
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