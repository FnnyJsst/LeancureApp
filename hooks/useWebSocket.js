import { useEffect, useRef, useCallback, useState } from 'react';
import { ENV } from '../config/env';
import { fetchChannelMessages } from '../services/api/messageApi';
import { useTranslation } from 'react-i18next';
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
     * @description Cleanup the WebSocket connection
     */
    const cleanup = useCallback(() => {
        if (isClosingRef.current) {
            return;
        }

        isClosingRef.current = true;

        if (ws.current) {
            try {
                ws.current.close();
            } catch (error) {
                console.error('[WebSocket] Error while closing the connection:', error);
            }
            ws.current = null;
        }

        if (reconnectTimeout.current) {
            clearTimeout(reconnectTimeout.current);
            reconnectTimeout.current = null;
        }

        if (connectionTimeout.current) {
            clearTimeout(connectionTimeout.current);
            connectionTimeout.current = null;
        }

        isConnectingRef.current = false;
        isClosingRef.current = false;
        setIsConnected(false);
        activeChannel.current = null;
        reconnectAttempts.current = 0;
    }, []);

    /**
     * @description Send the subscription to the WebSocket server
     */
    const sendSubscription = useCallback(async () => {
        try {
            if (!ws.current || !channels.length || ws.current.readyState !== WebSocket.OPEN) {
                return handleWSError(
                    { message: t('errors.websocket.notConnected') },
                    'websocket.subscription',
                    { silent: true }
                );
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
            console.error('[WebSocket] Error while sending the subscription:', error);
        }
    }, [channels, t]);

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
                    markChannelAsUnread(channelId);
                }
            }
        } catch (error) {
            console.error('[WebSocket] Error while processing the message for unread channels:', error);
        }
    };

    // Connect to the WebSocket server
    const connect = useCallback(async () => {
        if (isConnectingRef.current || isClosingRef.current || reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
            if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
                return handleWSError(
                    { message: t('errors.websocket.maxAttempts') },
                    'websocket.maxAttempts'
                );
            }
            return;
        }

        if (ws.current) {
            cleanup();
        }

        try {
            isConnectingRef.current = true;
            const wsUrl = await ENV.WS_URL();

            if (!wsUrl) {
                return handleWSError(
                    { message: t('errors.websocket.configuration') },
                    'websocket.configuration'
                );
            }

            connectionTimeout.current = setTimeout(() => {
                if (ws.current && ws.current.readyState !== WebSocket.OPEN) {
                    cleanup();
                    reconnectAttempts.current++;
                    if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
                        reconnectTimeout.current = setTimeout(() => {
                            connect();
                        }, RECONNECT_DELAY);
                    }
                }
            }, 5000);

            ws.current = new WebSocket(wsUrl);

            ws.current.onopen = () => {
                if (!ws.current) return;
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
                    return;
                }
                cleanup();

                if (event.code !== 1000) {
                    handleWSError(
                        { message: t('errors.websocket.connectionError') },
                        'websocket.connectionError',
                        { silent: true }
                    );

                    reconnectAttempts.current++;
                    if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
                        reconnectTimeout.current = setTimeout(() => {
                            connect();
                        }, RECONNECT_DELAY);
                    } else {
                        console.error('[WebSocket] Maximum number of reconnection attempts reached');
                    }
                }
            };

            ws.current.onerror = (error) => {
                console.error('[WebSocket] WebSocket error:', error);
                if (!isClosingRef.current) {
                    cleanup();
                    reconnectAttempts.current++;
                    if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
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
                        if (data.message && data.message.type === 'messages') {
                            handleNotificationMessage(data);
                        } else if (data.type === 'notification') {
                            handleNotificationMessage(data);
                        }
                    }
                } catch (error) {
                    console.error('[WebSocket] Error while processing the message:', error);
                }
            };

            // Add ping to keep connection alive
            const pingInterval = setInterval(() => {
                if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                    try {
                        ws.current.send(JSON.stringify({ type: 'ping' }));
                    } catch (error) {
                        console.error('[WebSocket] Error while sending the ping:', error);
                    }
                }
            }, 30000);

            return () => clearInterval(pingInterval);

        } catch (error) {
            console.error('[WebSocket] Error while creating the connection:', error);
            isConnectingRef.current = false;
            cleanup();
            reconnectAttempts.current++;
            if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
                reconnectTimeout.current = setTimeout(() => {
                    connect();
                }, RECONNECT_DELAY);
            }
        }
    }, [cleanup, sendSubscription, t]);

    // Cleanup when the component is unmounted
    useEffect(() => {
        let isMounted = true;
        let cleanupCalled = false;

        return () => {
            if (!isMounted || cleanupCalled) return;
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

            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                sendSubscription();
            } else if (!isConnectingRef.current && !isClosingRef.current) {
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
     *@function refreshMessages
     *@description Refresh the messages when the channel is changed
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
                            username: msg.login === credentials.login ? t('messages.Me') : (msg.login || t('messages.unknownUser'))
                        }))
                    }
                };

                onMessage(formattedData);
            }
        } catch (error) {
            console.error('[WebSocket] Error while refreshing the messages:', error);
        }
    }, [channels, onMessage, credentials, t]);

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
            console.error('[WebSocket] Error while sending the message:', stateError);
            return false;
        }

        try {
            if (!credentials) {
                console.error('[WebSocket] No credentials found');
                return false;
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
            console.error('[WebSocket] Error while sending the message:', error);
            return false;
        }
    };

    return {
        sendMessage,
        closeConnection: cleanup,
        isConnected
    };
};