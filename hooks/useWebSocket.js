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

    const processedMessageIds = useRef(new Set());

    /**
     * @function cleanup
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
     * @function sendSubscription
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
    const handleWebSocketMessage = useCallback(async (data) => {
        try {
            const messageId = data.message?.id || data.notification?.message?.id;

            // Duplicate check
            if (messageId && processedMessageIds.current.has(messageId)) {
                return;
            }
            if (messageId) {
                processedMessageIds.current.add(messageId);
            }

            // Extraction and validation of the message
            let messageContent = null;
            if (data.notification?.type === 'chat' && data.notification.message) {
                messageContent = data.notification.message;
            } else if (data.message) {
                messageContent = data.message;
            }

            if (!messageContent) return;

            // Check the channel
            const channelId = data.filters?.values?.channel || data.notification?.filters?.values?.channel;
            const cleanChannelId = channelId?.toString()?.replace('channel_', '');
            const cleanActiveChannel = activeChannel.current?.toString()?.replace('channel_', '');

            // Handle messages for other channels
            if (cleanChannelId !== cleanActiveChannel) {
                if (!messageContent.isOwnMessage && cleanChannelId !== activeChannelId) {
                    markChannelAsUnread(cleanChannelId);
                }
                return;
            }

            // Enrich the message
            const enrichedMessage = {
                ...messageContent,
                channelId: cleanChannelId,
                isOwnMessage: credentials?.login === messageContent.login,
                type: messageContent.type || 'text',
                text: messageContent.text || messageContent.message || messageContent.details || '',
                details: messageContent.details || messageContent.text || messageContent.message || '',
                message: messageContent.message || messageContent.text || messageContent.details || '',
                fileType: messageContent.fileType || 'none',
                fileName: messageContent.fileName,
                fileSize: messageContent.fileSize,
                base64: messageContent.base64,
                uri: messageContent.uri
            };

            // Handle sound notifications
            if (!enrichedMessage.isOwnMessage) {
                await playNotificationSound(enrichedMessage, null, credentials);
            }

            // Format the messages
            const formatMessages = (messages) => {
                if (Array.isArray(messages)) {
                    return messages
                        .filter(msg => !processedMessageIds.current.has(msg.id))
                        .map(msg => {
                            processedMessageIds.current.add(msg.id);
                            return formatMessage(msg, credentials, t);
                        });
                }
                return [formatMessage(enrichedMessage, credentials, t)];
            };

            // Preparation of the formatted data
            const formattedData = {
                type: data.type || 'message',
                channelId: cleanChannelId,
                messages: formatMessages(
                    messageContent.type === 'messages' ? messageContent.messages : enrichedMessage
                )
            };

            // Call the callback with the formatted data
            if (onMessage) {
                onMessage(formattedData);
            }

        } catch (error) {
            console.error('[WebSocket] Error processing message:', error);
            if (onError) {
                onError(error);
            }
        }
    }, [credentials, t, markChannelAsUnread, activeChannelId, onMessage, onError]);

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

                    if (data.type === 'refreshcontent') {
                        refreshMessages();
                        return;
                    }

                    if (data && typeof data === 'object') {
                        handleWebSocketMessage(data);
                    }
                } catch (error) {
                    console.error('[WebSocket] Error parsing message:', error);
                    if (onError) {
                        onError(error);
                    }
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
    }, [cleanup, sendSubscription, t, handleWebSocketMessage]);

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
        // If the WebSocket is not connected, we return false
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

            // We get the clean channel id by removing the 'channel_' prefix
            const cleanChannelId = activeChannel.current?.replace('channel_', '');

            // We create the message data to send to the WebSocket server
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

    // Fonction utilitaire pour formater les messages
    const formatMessage = (msg, credentials, t) => {
        const messageText = msg.text || msg.message || msg.details || '';
        const isOwnMessageByLogin = msg.login === credentials?.login;

        // Calculate file size if necessary
        let fileSize = msg.fileSize;
        if (msg.type === 'file' && !fileSize && msg.base64) {
            fileSize = calculateFileSize(msg.base64);
        }

        return {
            id: msg.id?.toString() || Date.now().toString(),
            type: msg.type || 'text',
            text: messageText,
            details: msg.details || messageText,
            message: msg.message || messageText,
            savedTimestamp: msg.savedTimestamp || Date.now().toString(),
            fileType: msg.fileType || 'none',
            login: msg.login || 'unknown',
            isOwnMessage: isOwnMessageByLogin,
            isUnread: false,
            username: isOwnMessageByLogin ? t('messages.Me') : (msg.login || t('messages.unknownUser')),
            base64: msg.base64,
            fileSize: fileSize,
            fileName: msg.fileName,
            uri: msg.uri
        };
    };

    const calculateFileSize = (base64) => {
        if (!base64) return 0;
        const base64Length = base64.length;
        const paddingLength = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
        return Math.floor(((base64Length - paddingLength) * 3) / 4);
    };

    return {
        sendMessage,
        closeConnection: cleanup,
        isConnected,
        handleWebSocketMessage,
        formatMessage: (msg) => formatMessage(msg, credentials, t),
        calculateFileSize
    };
};