import { useEffect, useRef, useCallback } from 'react';
import { ENV } from '../config/env';
import { useTranslation } from 'react-i18next';

/**
 * Personalized hook to handle WebSocket connections
 * @param {Object} options - Configuration options
 * @param {Function} options.onMessage - Callback called when a message is received
 * @param {Function} options.onError - Callback called in case of error
 * @param {Array} options.channels - List of channels to monitor
 * @param {Array} options.subscriptions - List of subscriptions to send
 * @returns {Object} - Methods to interact with the WebSocket
 */
export const useWebSocket = ({ onMessage, onError, channels = [], subscriptions = [] }) => {
    //
    const ws = useRef(null);
    const reconnectTimeout = useRef(null);
    const isConnecting = useRef(false);
    const isSubscribed = useRef(false);

    // Translation
    const { t } = useTranslation();

    /**
     * @function sendSubscription
     * @description Send the subscription data to the server
     */
    const sendSubscription = useCallback(() => {
        // Check if the WebSocket is connected
        if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
            // console.log('🔸 WebSocket non connecté, impossible d\'envoyer la souscription');
            throw new Error(t('errors.webSocketNotConnected'));
        }

        // Prepare the subscription data
        const subscriptionData = {
            sender: "client",
            subscriptions: subscriptions.length > 0 ? subscriptions : [
                {
                    package: "amaiia_messages",
                    page: "message_reader",
                    filters: {
                        values: {
                            channel: channels
                        }
                    }
                }
            ]
        };

        try {
            // Send the subscription data to the server
            ws.current.send(JSON.stringify(subscriptionData));
            isSubscribed.current = true;
            // console.log('🔵 Souscription WebSocket envoyée:', JSON.stringify(subscriptionData));
        } catch (error) {
            // console.error('🔴 Erreur lors de l\'envoi de la souscription:', error);
            throw new Error(t('errors.errorSendingSubscription'), error);
        }
    }, [channels, subscriptions, onError]);

    /**
     * @function initializeWebSocket
     * @description Initialize the WebSocket connection
     */
    const initializeWebSocket = useCallback(async () => {
        // Check if the WebSocket is already connecting or open
        if (isConnecting.current || (ws.current && ws.current.readyState === WebSocket.OPEN)) {
            return;
        }

        isConnecting.current = true;
        isSubscribed.current = false;

        try {
            // Get the WebSocket URL
            const wsUrl = await ENV.WS_URL();
            if (!wsUrl) {
                throw new Error(t('errors.webSocketUrlNotDefined'));
            }

            // Close the current WebSocket connection if it exists
            if (ws.current) {
                ws.current.close();
                ws.current = null;
            }

            // Create a new WebSocket connection
            ws.current = new WebSocket(wsUrl);

            // Handle the WebSocket connection open event
            ws.current.onopen = () => {
                // console.log('🔵 Connexion WebSocket établie');
                isConnecting.current = false;
                sendSubscription();
            };

            // Handle the WebSocket connection message event
            ws.current.onmessage = (event) => {
                // Parse the message data
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'refreshcontent') {
                        onMessage && onMessage(data);
                    }
                } catch (error) {
                    throw new Error(t('errors.errorParsingMessage'), error);
                }
            };

            // Handle the WebSocket connection error event
            ws.current.onerror = (error) => {
                isConnecting.current = false;
                throw new Error(t('errors.errorWebSocket'), error);
            };

            // Handle the WebSocket connection close event
            ws.current.onclose = () => {
                // console.log('🔸 Connexion WebSocket fermée');
                isConnecting.current = false;
                isSubscribed.current = false;

                // Clear the reconnect timeout if it exists
                if (reconnectTimeout.current) {
                    clearTimeout(reconnectTimeout.current);
                }

                reconnectTimeout.current = setTimeout(() => {
                    // console.log('🔄 Tentative de reconnexion WebSocket...');
                    initializeWebSocket();
                }, 5000);
            };

        } catch (error) {
            isConnecting.current = false;
            throw new Error(t('errors.errorWebSocket'), error);
        }
    }, [sendSubscription, onMessage, onError]);

    /**
     * @function useEffect
     * @description Initialize the WebSocket connection
     */
    useEffect(() => {
        initializeWebSocket();

        return () => {
            // Nettoyage à la destruction du composant
            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
            }
            if (ws.current) {
                ws.current.close();
                ws.current = null;
            }
        };
    }, [initializeWebSocket]);

    /**
     * @function useEffect
     * @description Update the subscriptions when the channels change
     */
    useEffect(() => {
        // Check if the WebSocket is connected and the subscriptions are not already sent
        if (ws.current && ws.current.readyState === WebSocket.OPEN && !isSubscribed.current) {
            sendSubscription();
        }
    }, [channels, subscriptions, sendSubscription]);

    return {
        // Send a message to the WebSocket
        sendMessage: (message) => {
            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                ws.current.send(JSON.stringify(message));
            }
        },
        // Close the WebSocket connection
        closeConnection: () => {
            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
                reconnectTimeout.current = null;
            }
            if (ws.current) {
                ws.current.close();
                ws.current = null;
            }
            isConnecting.current = false;
            isSubscribed.current = false;
        }
    };
};