import { useEffect, useRef, useCallback, useState } from 'react';
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
    const ws = useRef(null);
    const isConnecting = useRef(false);
    const [isConnected, setIsConnected] = useState(false);
    const activeChannel = useRef(null);
    const hasError = useRef(false);

    // Translation
    const { t } = useTranslation();

    const cleanup = useCallback(() => {
        if (ws.current) {
            ws.current.close();
            ws.current = null;
        }
        isConnecting.current = false;
        setIsConnected(false);
        activeChannel.current = null;
        hasError.current = false;
    }, []);

    const sendSubscription = useCallback(() => {
        if (!ws.current || ws.current.readyState !== WebSocket.OPEN || !channels.length) {
            return;
        }

        const subscriptionData = {
            sender: "client",
            type: "subscribe",
            subscriptions: channels.map(channelId => {
                const cleanId = typeof channelId === 'string' ?
                    channelId.replace('channel_', '') :
                    channelId.toString();

                return {
                    type: "channel",
                    filters: {
                        package: "amaiia_messages",
                        page: "message_reader",
                        values: cleanId
                    }
                };
            })
        };

        try {
            ws.current.send(JSON.stringify(subscriptionData));
            console.log('📤 Souscription envoyée pour les canaux:', channels);
        } catch (error) {
            console.error('🔴 Erreur lors de l\'envoi de la souscription:', error);
        }
    }, [channels]);

    const connect = useCallback(async () => {
        if (isConnecting.current || ws.current?.readyState === WebSocket.OPEN || hasError.current) {
            return;
        }

        try {
            isConnecting.current = true;
            const wsUrl = await ENV.WS_URL();
            ws.current = new WebSocket(wsUrl);

            ws.current.onopen = () => {
                console.log('🟢 WebSocket connecté');
                isConnecting.current = false;
                hasError.current = false;
                setIsConnected(true);
                sendSubscription();
            };

            ws.current.onclose = () => {
                if (!hasError.current) {
                    console.log('🔵 WebSocket fermé normalement');
                    cleanup();
                }
            };

            ws.current.onerror = (error) => {
                console.error('🔴 Erreur WebSocket:', error);
                hasError.current = true;
                if (onError) onError(error);
                cleanup();
            };

            ws.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data && typeof data === 'object' && onMessage) {
                        onMessage(data);
                    }
                } catch (error) {
                    console.error('🔴 Erreur lors du traitement du message:', error);
                }
            };
        } catch (error) {
            console.error('🔴 Erreur lors de la création du WebSocket:', error);
            hasError.current = true;
            isConnecting.current = false;
            if (onError) onError(error);
        }
    }, [onError, sendSubscription, onMessage, cleanup]);

    // Gérer la connexion/déconnexion initiale
    useEffect(() => {
        // Ne rien faire si aucun changement de canal
        if (channels.length === 0) {
            if (ws.current) {
                cleanup();
            }
            return;
        }

        // Si le canal actif est différent, reconnecter
        const currentChannel = channels[0];
        if (currentChannel !== activeChannel.current && !hasError.current) {
            cleanup();
            activeChannel.current = currentChannel;
            connect();
        }
    }, [channels, connect, cleanup]);

    // Nettoyage lors du démontage du composant
    useEffect(() => {
        return () => {
            cleanup();
        };
    }, [cleanup]);

    return {
        sendMessage: (message) => {
            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                ws.current.send(JSON.stringify(message));
            }
        },
        closeConnection: cleanup,
        isConnected
    };
};