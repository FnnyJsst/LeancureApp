import { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

// Créer un contexte pour les données de notification
export const NotificationContext = createContext();

// Initialiser une variable globale pour stocker l'ID du canal actuellement visualisé
let currentlyViewedChannelId = null;

// Fonctions d'accès à la variable globale
export const getCurrentlyViewedChannel = () => currentlyViewedChannelId;
export const setCurrentlyViewedChannel = (channelId) => {
  currentlyViewedChannelId = channelId ? channelId.toString() : null;

  // Mise à jour de la variable globale pour un accès facile
  if (typeof global !== 'undefined') {
    global.currentlyViewedChannel = currentlyViewedChannelId;
  }

  // Si un canal est défini, enregistrer également le nom pour comparaison avec les notifications
  if (channelId) {
    console.log('🔔 Canal actif mis à jour:', channelId);
  }
};

// Fournisseur de contexte pour les notifications
export const NotificationProvider = ({ children }) => {
  const [lastSentMessageTimestamp, setLastSentMessageTimestamp] = useState(null);
  const [activeChannelId, setActiveChannelId] = useState(null);

  // Mettre à jour le canal actif et la variable globale
  const updateActiveChannel = (channelId, channelTitle) => {
    setActiveChannelId(channelId);
    setCurrentlyViewedChannel(channelId);

    // Stocker le nom du canal si disponible
    if (channelId && channelTitle) {
      SecureStore.setItemAsync('viewedChannelName', channelTitle)
        .catch(err => console.error('❌ Erreur lors de l\'enregistrement du nom du canal:', err));
    } else {
      SecureStore.deleteItemAsync('viewedChannelName')
        .catch(err => console.error('❌ Erreur lors de la suppression du nom du canal:', err));
    }
  };

  // Enregistrer l'horodatage du message envoyé
  const recordSentMessage = (timestamp = Date.now()) => {
    setLastSentMessageTimestamp(timestamp);
  };

  // Nettoyer les ressources lors du démontage
  useEffect(() => {
    return () => {
      setCurrentlyViewedChannel(null);
      SecureStore.deleteItemAsync('viewedChannelName')
        .catch(err => console.error('❌ Erreur lors du nettoyage du nom du canal:', err));
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        activeChannelId,
        updateActiveChannel,
        lastSentMessageTimestamp,
        recordSentMessage
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte de notification
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification doit être utilisé à l\'intérieur d\'un NotificationProvider');
  }
  return context;
};