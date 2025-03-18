import { useEffect, useRef, useCallback } from 'react';
import { ENV } from '../config/env';

/**
 * Hook personnalisé pour gérer les connexions WebSocket
 * @param {Object} options - Options de configuration
 * @param {Function} options.onMessage - Callback appelé quand un message est reçu
 * @param {Function} options.onError - Callback appelé en cas d'erreur
 * @param {Array} options.channels - Liste des canaux à surveiller
 * @returns {Object} - Méthodes pour interagir avec le WebSocket
 */
export const useWebSocket = ({ onMessage, onError, channels = [] }) => {
    const ws = useRef(null);
    const reconnectTimeout = useRef(null);

    /**
     * Envoie les données de souscription au serveur
     */
    const sendSubscription = useCallback(() => {
        if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;

        const subscriptionData = {
            sender: "client",
            subscriptions: [
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
            console.log('🔵 Souscription WebSocket envoyée:', subscriptionData);
        } catch (error) {
            console.error('🔴 Erreur lors de l\'envoi de la souscription:', error);
        }
    }, [channels]);

    /**
     * Initialise la connexion WebSocket
     */
    const initializeWebSocket = useCallback(async () => {
        try {
            const wsUrl = await ENV.WS_URL();
            if (!wsUrl) {
                throw new Error('URL WebSocket non définie');
            }

            ws.current = new WebSocket(wsUrl);

            ws.current.onopen = () => {
                console.log('🔵 Connexion WebSocket établie');
                sendSubscription();
            };

            ws.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('🔵 Message WebSocket reçu:', data);

                    if (data.type === 'refreshcontent') {
                        onMessage && onMessage(data);
                    } else if (data.type === 'changevalue') {
                        // Gérer les mises à jour de valeurs si nécessaire
                    }
                } catch (error) {
                    console.error('🔴 Erreur parsing message WebSocket:', error);
                }
            };

            ws.current.onerror = (error) => {
                console.error('🔴 Erreur WebSocket:', error);
                onError && onError(error);
            };

            ws.current.onclose = () => {
                console.log('🔸 Connexion WebSocket fermée, tentative de reconnexion...');
                // Tentative de reconnexion après 5 secondes
                reconnectTimeout.current = setTimeout(() => {
                    initializeWebSocket();
                }, 5000);
            };

        } catch (error) {
            console.error('🔴 Erreur initialisation WebSocket:', error);
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
            }
        };
    }, [initializeWebSocket]);

    // Mise à jour des souscriptions quand les canaux changent
    useEffect(() => {
        if (channels.length > 0) {
            sendSubscription();
        }
    }, [channels, sendSubscription]);

    return {
        sendMessage: (message) => {
            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                ws.current.send(JSON.stringify(message));
            }
        },
        closeConnection: () => {
            if (ws.current) {
                ws.current.close();
            }
        }
    };
};