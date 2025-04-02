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
        //If the WebSocket connection is not open or there are no channels, return null
        if (!ws.current || ws.current.readyState !== WebSocket.OPEN || !channels.length) {
            return;
        }

        // Clean the channels
        const cleanChannels = channels.map(channel =>
            typeof channel === 'string' ?
                channel.replace('channel_', '') :
                channel.toString()
        );

        // Send the subscription to the WebSocket server to receive messages from the channels
        try {
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

            // We send the subscription to the WebSocket server
            ws.current.send(JSON.stringify(subscriptionData));
            // If there is an error, we log it
        } catch (error) {
            handleWSError(error, 'sendSubscription');
        }
    }, [channels]);

    // Connect to the WebSocket server
    const connect = useCallback(async () => {
        //If the connection is already in progress or the connection is already open, return null
        if (isConnecting.current || ws.current?.readyState === WebSocket.OPEN) {
            return;
        }

        // Try to connect to the WebSocket server
        try {
            isConnecting.current = true;
            // We get the WebSocket URL from the environment variables
            const wsUrl = await ENV.WS_URL();
            console.log('🌐 URL WebSocket:', wsUrl);

            // We create a new WebSocket instance
            ws.current = new WebSocket(wsUrl);

            // We handle the connection open event
            ws.current.onopen = () => {
                console.log('🟢 WebSocket connecté avec succès. État:', ws.current.readyState);
                isConnecting.current = false;
                setIsConnected(true);
                // We send the subscription to the WebSocket server to receive messages from the channels
                setTimeout(() => {
                    sendSubscription();
                }, 1000);
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

                // If the WebSocket is not closed normally, we log the error
                if (event.code !== 1000) { // 1000 = normal closure
                    handleWSError(
                        `WebSocket fermé avec le code ${event.code}${event.reason ? ': ' + event.reason : ''}`,
                        'connection.close',
                        { silent: false }
                    );
                }
            };

            // We handle the connection error event
            ws.current.onerror = (error) => {
                handleWSError(error, 'connection.error');
                // We clean the connection
                cleanup();
            };

            // We handle the notification event received from the WebSocket server
            ws.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.type === 'refreshcontent') {
                        refreshMessages();
                        return;
                    }

                    if (data && typeof data === 'object' && onMessage) {
                        // D'abord, traiter le message normalement
                        onMessage(data);

                        // Ensuite, essayer d'envoyer la notification
                        try {
                            if (data.message && data.message.type === 'messages') {
                                const lastMessage = data.message.messages[data.message.messages.length - 1];
                                if (lastMessage && !lastMessage.isOwnMessage) {
                                    scheduleNotification(
                                        'Nouveau message',
                                        `${lastMessage.username}: ${lastMessage.message}`,
                                        { channelId: activeChannel.current }
                                    ).catch(error => {
                                        console.log('Erreur lors de l\'envoi de la notification:', error);
                                    });
                                }
                            }
                        } catch (notificationError) {
                            console.log('Erreur lors de la gestion de la notification:', notificationError);
                        }
                    }
                } catch (error) {
                    handleWSError(
                        { ...error, data: event.data },
                        'message.parsing'
                    );
                }
            };
        } catch (error) {
            // If the connection is not created, we log the error
            handleWSError(error, 'connection.create');
            isConnecting.current = false;
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

            // If the WebSocket connection is open, we close it
            if (ws.current) {
                ws.current.close();
                ws.current = null;
            }

            // We update the active channel
            activeChannel.current = currentChannel;

            // We establish a new connection
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