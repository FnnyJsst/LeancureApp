import { useEffect, useRef, useCallback } from 'react';
import { ENV } from '../config/env';

/**
 * Hook personnalisé pour gérer les connexions WebSocket
 * @param {Object} options - Options de configuration
 * @param {Function} options.onMessage - Callback appelé quand un message est reçu
 * @param {Function} options.onError - Callback appelé en cas d'erreur
 * @param {Array} options.channels - Liste des canaux à surveiller
 * @param {Array} options.subscriptions - Liste des souscriptions à envoyer
 * @returns {Object} - Méthodes pour interagir avec le WebSocket
 */
export const useWebSocket = ({ onMessage, onError, channels = [], subscriptions = [] }) => {
    const ws = useRef(null);
    const reconnectTimeout = useRef(null);
    const isConnecting = useRef(false);
    const isSubscribed = useRef(false);

    /**
     * Envoie les données de souscription au serveur
     */
    const sendSubscription = useCallback(() => {
        if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
            console.log('🔸 WebSocket non connecté, impossible d\'envoyer la souscription');
            return;
        }

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
            ws.current.send(JSON.stringify(subscriptionData));
            isSubscribed.current = true;
            console.log('🔵 Souscription WebSocket envoyée:', JSON.stringify(subscriptionData));
        } catch (error) {
            console.error('🔴 Erreur lors de l\'envoi de la souscription:', error);
            onError && onError(error);
        }
    }, [channels, subscriptions, onError]);

    /**
     * Initialise la connexion WebSocket
     */
    const initializeWebSocket = useCallback(async () => {
        if (isConnecting.current || (ws.current && ws.current.readyState === WebSocket.OPEN)) {
            return;
        }

        isConnecting.current = true;
        isSubscribed.current = false;

        try {
            const wsUrl = await ENV.WS_URL();
            if (!wsUrl) {
                throw new Error('URL WebSocket non définie');
            }

            if (ws.current) {
                ws.current.close();
                ws.current = null;
            }

            ws.current = new WebSocket(wsUrl);

            ws.current.onopen = () => {
                console.log('🔵 Connexion WebSocket établie');
                isConnecting.current = false;
                sendSubscription();
            };

            ws.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'refreshcontent') {
                        onMessage && onMessage(data);
                    }
                } catch (error) {
                    console.error('🔴 Erreur parsing message WebSocket:', error);
                }
            };

            ws.current.onerror = (error) => {
                console.error('🔴 Erreur WebSocket:', error);
                isConnecting.current = false;
                onError && onError(error);
            };

            ws.current.onclose = () => {
                console.log('🔸 Connexion WebSocket fermée');
                isConnecting.current = false;
                isSubscribed.current = false;

                if (reconnectTimeout.current) {
                    clearTimeout(reconnectTimeout.current);
                }

                reconnectTimeout.current = setTimeout(() => {
                    console.log('🔄 Tentative de reconnexion WebSocket...');
                    initializeWebSocket();
                }, 5000);
            };

        } catch (error) {
            console.error('🔴 Erreur initialisation WebSocket:', error);
            isConnecting.current = false;
            onError && onError(error);
        }
    }, [sendSubscription, onMessage, onError]);

    // Initialisation de la connexion
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

    // Mise à jour des souscriptions quand les canaux changent
    useEffect(() => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN && !isSubscribed.current) {
            sendSubscription();
        }
    }, [channels, subscriptions, sendSubscription]);

    return {
        sendMessage: (message) => {
            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                ws.current.send(JSON.stringify(message));
            }
        },
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