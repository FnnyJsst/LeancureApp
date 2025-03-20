import { useEffect, useRef, useCallback, useState } from 'react';
import { ENV } from '../config/env';
import * as SecureStore from 'expo-secure-store';
import { fetchChannelMessages } from '../services/api/messageApi';
import { useTranslation } from 'react-i18next';

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

    // Close the WebSocket connection
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

    // Send the subscription to the WebSocket server
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

            // console.log('📤 Données de souscription:', JSON.stringify(subscriptionData, null, 2));
            ws.current.send(JSON.stringify(subscriptionData));
            // console.log('✅ Souscription envoyée avec succès');
        } catch (error) {
            const errorDetails = {
                name: error.name,
                message: error.message,
                stack: error.stack,
                wsState: ws.current?.readyState
            };
            console.error(errorDetails);
            if (onError) onError(errorDetails);
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
            console.log('🔄 Tentative de connexion WebSocket...');
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
                // If there is an error, we call the onError callback
                if (onError) {
                    onError({
                        type: 'WebSocketClose',
                        details: closeInfo,
                        message: `WebSocket fermé avec le code ${event.code}${event.reason ? ': ' + event.reason : ''}`
                    });
                }
            };

            // We handle the connection error event
            ws.current.onerror = (error) => {
                // We get the error details
                const errorInfo = {
                    type: error.type,
                    message: error.message,
                    error: error,
                    wsState: ws.current?.readyState,
                    wsUrl: ws.current?.url,
                    timestamp: new Date().toISOString()
                };
                console.error(errorInfo);
                if (onError) onError(errorInfo);
                // We clean the connection
                cleanup();
            };

            // We handle the notification event received from the WebSocket server
            ws.current.onmessage = (event) => {
                console.log('📨 Message WebSocket reçu - données brutes:', event.data);
                // We parse the notification event received from the WebSocket server
                try {
                    const data = JSON.parse(event.data);
                    console.log('📩 Notification reçue:', JSON.stringify(data, null, 2));

                    // If the notification type is refreshcontent, we refresh the messages
                    if (data.type === 'refreshcontent') {
                        console.log('🔄 Rafraîchissement du contenu demandé');
                        refreshMessages();
                        return;
                    }

                    // If the notification is valid, we call the onMessage callback
                    if (data && typeof data === 'object' && onMessage) {
                        onMessage(data);
                    }
                } catch (error) {
                    const parseError = {
                        name: error.name,
                        message: error.message,
                        data: event.data,
                        timestamp: new Date().toISOString()
                    };
                    console.error('🔴 Erreur lors du parsing du message:', parseError);
                    if (onError) onError(parseError);
                }
            };
        } catch (error) {
            const connectionError = {
                name: error.name,
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            };
            console.error('🔴 Erreur lors de la création du WebSocket:', connectionError);
            isConnecting.current = false;
            if (onError) onError(connectionError);
        }
    }, [onError, sendSubscription, onMessage, cleanup]);

    // Handle the channel change
    useEffect(() => {
        console.log('🔄 Changement de canaux détecté:', channels);
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
            console.log('📢 Changement de canal effectif:', {
                ancien: cleanActiveChannel,
                nouveau: cleanCurrentChannel
            });

            // If the WebSocket connection is open, we close it
            if (ws.current) {
                ws.current.close();
                ws.current = null;
            }

            // We update the active channel
            activeChannel.current = currentChannel;

            // We establish a new connection
            console.log('🔄 Établissement d\'une nouvelle connexion');
            connect();
        }
    }, [channels, connect, cleanup]);

    // When the component is unmounted, we clean the connection
    useEffect(() => {
        return () => {
            cleanup();
        };
    }, [cleanup]);

    // Refresh the messages
    const refreshMessages = useCallback(async () => {
        // If there are no channels, we return null
        if (!channels.length) {
            return;
        }

        try {
            const credentialsStr = await SecureStore.getItemAsync('userCredentials');
            if (!credentialsStr) {
                throw new Error(t('errors.noCredentialsFound'));
            }

            const credentials = JSON.parse(credentialsStr);
            const cleanChannelId = activeChannel.current?.replace('channel_', '');

            // We fetch the channel messages
            const messages = await fetchChannelMessages(cleanChannelId, credentials);

            if (onMessage && Array.isArray(messages)) {
                console.log('📦 Messages récupérés (brut):', messages);

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

                console.log('📤 Envoi des messages formatés:', JSON.stringify(formattedData, null, 2));
                onMessage(formattedData);
            }

            console.log('✅ Messages rafraîchis avec succès');
        } catch (error) {
            console.error('🔴 Erreur lors du rafraîchissement des messages:', error);
            if (onError) onError(error);
        }
    }, [channels, onMessage, onError]);

    return {
        sendMessage: async (message) => {
            // If the WebSocket connection is open, we send the message
            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                try {
                    // We get the credentials and parse them
                    const credentialsStr = await SecureStore.getItemAsync('userCredentials');
                    if (!credentialsStr) {
                        throw new Error(t('errors.noCredentialsFound'));
                    }

                    const credentials = JSON.parse(credentialsStr);

                    // We get the active channel
                    const cleanChannelId = activeChannel.current?.replace('channel_', '');

                    // We get the message data
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

                    console.log('📤 Envoi du message:', JSON.stringify(messageData, null, 2));
                    // We send the message to the WebSocket server
                    ws.current.send(JSON.stringify(messageData));
                    console.log('✅ Message envoyé avec succès');
                } catch (error) {
                    const sendError = {
                        name: error.name,
                        message: error.message,
                        stack: error.stack,
                        wsState: ws.current?.readyState,
                        timestamp: new Date().toISOString()
                    };
                    console.error('🔴 Erreur lors de l\'envoi du message:', sendError);
                    if (onError) onError(sendError);
                }
            } else {
                const stateError = {
                    message: 'WebSocket non connecté',
                    wsExists: !!ws.current,
                    readyState: ws.current?.readyState,
                    timestamp: new Date().toISOString()
                };
                console.log('❌ Impossible d\'envoyer le message:', stateError);
                if (onError) onError(stateError);
            }
        },
        closeConnection: cleanup,
        isConnected
    };
};