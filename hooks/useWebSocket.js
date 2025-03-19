import { useEffect, useRef, useCallback, useState } from 'react';
import { ENV } from '../config/env';
import { useTranslation } from 'react-i18next';
import * as SecureStore from 'expo-secure-store';

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

    const { t } = useTranslation();

    const cleanup = useCallback(() => {
        console.log('🧹 Nettoyage de la connexion WebSocket');
        if (ws.current) {
            console.log('🔌 État WebSocket avant fermeture:', {
                readyState: ws.current.readyState,
                bufferedAmount: ws.current.bufferedAmount,
                protocol: ws.current.protocol,
                url: ws.current.url
            });
            ws.current.close();
            ws.current = null;
        }
        isConnecting.current = false;
        setIsConnected(false);
        activeChannel.current = null;
    }, []);

    const sendSubscription = useCallback(async () => {
        if (!ws.current || ws.current.readyState !== WebSocket.OPEN || !channels.length) {
            console.log('❌ Impossible d\'envoyer la souscription:', {
                wsExists: !!ws.current,
                readyState: ws.current?.readyState,
                channelsLength: channels.length,
                channels: channels
            });
            return;
        }

        const cleanId = typeof channels[0] === 'string' ?
            channels[0].replace('channel_', '') :
            channels[0].toString();

        console.log('📢 Envoi de la souscription pour le canal:', cleanId);

        try {
            const credentialsStr = await SecureStore.getItemAsync('userCredentials');
            if (!credentialsStr) {
                throw new Error('Pas de credentials trouvés dans SecureStore');
            }

            const credentials = JSON.parse(credentialsStr);

            const timestamp = Date.now();
            const subscriptionData = {
                "package": "amaiia_msg_srv",
                "page": "message",
                "cmd": [
                    {
                        "amaiia_msg_srv": {
                            "message": {
                                "subscribe": {
                                    "channelid": parseInt(cleanId, 10)
                                }
                            }
                        }
                    }
                ]
            };

            console.log('📤 Données de souscription:', JSON.stringify(subscriptionData, null, 2));
            ws.current.send(JSON.stringify(subscriptionData));
            console.log('✅ Souscription envoyée avec succès');
        } catch (error) {
            const errorDetails = {
                name: error.name,
                message: error.message,
                stack: error.stack,
                wsState: ws.current?.readyState
            };
            console.error('🔴 Erreur détaillée lors de l\'envoi de la souscription:', errorDetails);
            if (onError) onError(errorDetails);
        }
    }, [channels]);

    const connect = useCallback(async () => {
        if (isConnecting.current || ws.current?.readyState === WebSocket.OPEN) {
            console.log('⏳ État actuel de la connexion:', {
                isConnecting: isConnecting.current,
                wsState: ws.current?.readyState,
                wsUrl: ws.current?.url
            });
            return;
        }

        try {
            console.log('🔄 Tentative de connexion WebSocket...');
            isConnecting.current = true;
            const wsUrl = await ENV.WS_URL();
            console.log('🌐 URL WebSocket:', wsUrl);

            ws.current = new WebSocket(wsUrl);
            console.log('📡 Instance WebSocket créée avec les propriétés:', {
                protocol: ws.current.protocol,
                readyState: ws.current.readyState,
                url: ws.current.url
            });

            ws.current.onopen = () => {
                console.log('🟢 WebSocket connecté avec succès. État:', ws.current.readyState);
                isConnecting.current = false;
                setIsConnected(true);
                console.log('⏰ Attente avant envoi de la souscription...');
                setTimeout(() => {
                    console.log('🕐 Délai écoulé, envoi de la souscription...');
                    sendSubscription();
                }, 1000);
            };

            ws.current.onclose = (event) => {
                const closeInfo = {
                    code: event.code,
                    reason: event.reason,
                    wasClean: event.wasClean,
                    timestamp: new Date().toISOString()
                };
                console.log('🔵 WebSocket fermé avec les détails:', closeInfo);
                cleanup();

                if (onError) {
                    onError({
                        type: 'WebSocketClose',
                        details: closeInfo,
                        message: `WebSocket fermé avec le code ${event.code}${event.reason ? ': ' + event.reason : ''}`
                    });
                }
            };

            ws.current.onerror = (error) => {
                const errorInfo = {
                    type: error.type,
                    message: error.message,
                    error: error,
                    wsState: ws.current?.readyState,
                    wsUrl: ws.current?.url,
                    timestamp: new Date().toISOString()
                };
                console.error('🔴 Erreur WebSocket détaillée:', errorInfo);
                if (onError) onError(errorInfo);
                cleanup();
            };

            ws.current.onmessage = (event) => {
                console.log('📨 Message WebSocket reçu - données brutes:', event.data);
                try {
                    const data = JSON.parse(event.data);
                    console.log('📩 Message parsé:', JSON.stringify(data, null, 2));
                    if (data && typeof data === 'object' && onMessage) {
                        console.log('✅ Transmission du message au gestionnaire');
                        onMessage(data);
                    } else {
                        console.log('⚠️ Message ignoré:', {
                            hasData: !!data,
                            isObject: typeof data === 'object',
                            hasOnMessage: !!onMessage
                        });
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

    useEffect(() => {
        console.log('🔄 Changement de canaux détecté:', channels);
        if (channels.length === 0) {
            console.log('❌ Aucun canal disponible, nettoyage...');
            cleanup();
            return;
        }

        const currentChannel = channels[0];
        if (currentChannel !== activeChannel.current) {
            console.log('📢 Changement de canal:', {
                ancien: activeChannel.current,
                nouveau: currentChannel
            });

            // On ne fait pas de cleanup ici, on change juste le canal actif
            activeChannel.current = currentChannel;

            // Si pas de connexion active, on se connecte
            if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
                connect();
            } else {
                // Si déjà connecté, on envoie juste la nouvelle souscription
                sendSubscription();
            }
        }
    }, [channels, connect, cleanup]);

    // Cleanup uniquement au démontage du composant
    useEffect(() => {
        return () => {
            console.log('🧹 Nettoyage au démontage du composant');
            cleanup();
        };
    }, [cleanup]);

    return {
        sendMessage: async (message) => {
            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                try {
                    const credentialsStr = await SecureStore.getItemAsync('userCredentials');
                    if (!credentialsStr) {
                        throw new Error('Pas de credentials trouvés pour l\'envoi du message');
                    }

                    const credentials = JSON.parse(credentialsStr);
                    const cleanChannelId = activeChannel.current?.replace('channel_', '');
                    const timestamp = Date.now();

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