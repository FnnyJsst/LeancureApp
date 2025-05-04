import { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { handleError, ErrorType } from '../../utils/errorHandling';
import i18n from '../../i18n';

// We create a context for notification data, to share the data between the components
export const NotificationContext = createContext();

// Initialize a global variable to store the ID of the currently viewed channel
let currentlyViewedChannelId = null;

// Initialize a global event emitter for unread messages
// We check if the global object exists to avoid errors
if (typeof global !== 'undefined') {
  // We create a global variable to store the unread message emitter
  global.unreadMessageEmitter = {
    // We create a set to store the listeners
    listeners: new Set(),
    // We create a function to emit the unread message event
    emit: function(channelId) {
      this.listeners.forEach(listener => listener(channelId));
    },
    // We create a function to add a listener
    addListener: function(listener) {
      this.listeners.add(listener);
    },
    // We create a function to remove a listener
    removeListener: function(listener) {
      this.listeners.delete(listener);
    }
  };
}

// Functions to access the global variable
export const getCurrentlyViewedChannel = () => currentlyViewedChannelId;
export const setCurrentlyViewedChannel = (channelId) => {
  console.log('👁️ [NotificationContext] Mise à jour du canal actuel:', {
    oldChannelId: currentlyViewedChannelId,
    newChannelId: channelId
  });

  currentlyViewedChannelId = channelId ? channelId.toString() : null;

  // Update the global variable for easy access
  if (typeof global !== 'undefined') {
    global.currentlyViewedChannel = currentlyViewedChannelId;
  }
};

// Function to emit unread message event
export const emitUnreadMessage = (channelId) => {
  console.log('🔔 [NotificationContext] Émission d\'un message non lu:', {
    channelId,
    currentlyViewedChannel: currentlyViewedChannelId
  });

  if (typeof global !== 'undefined' && global.unreadMessageEmitter) {
    global.unreadMessageEmitter.emit(channelId);
  }
};

// Context provider for notifications
export const NotificationProvider = ({ children }) => {
  const [lastSentMessageTimestamp, setLastSentMessageTimestamp] = useState(null);
  const [activeChannelId, setActiveChannelId] = useState(null);
  const [unreadChannels, setUnreadChannels] = useState({});

  // Listen for unread message events
  useEffect(() => {
    if (typeof global !== 'undefined' && global.unreadMessageEmitter) {
      const handleUnreadMessage = (channelId) => {
        console.log('👂 [NotificationContext] Réception d\'un événement de message non lu:', channelId);
        markChannelAsUnread(channelId, true);
      };

      global.unreadMessageEmitter.addListener(handleUnreadMessage);
      console.log('🎯 [NotificationContext] Écouteur d\'événements ajouté');

      return () => {
        global.unreadMessageEmitter.removeListener(handleUnreadMessage);
        console.log('🔕 [NotificationContext] Écouteur d\'événements supprimé');
      };
    }
  }, []);

  /**
   * @function updateActiveChannel
   * @description Update the active channel and the global variable
   * @param {string} channelId - The ID of the channel
   * @param {string} channelTitle - The title of the channel
   */
  const updateActiveChannel = (channelId, channelTitle) => {
    console.log('🔄 [NotificationContext] Mise à jour du canal actif:', {
      channelId,
      channelTitle,
      previousActiveChannel: activeChannelId
    });

    setActiveChannelId(channelId);
    setCurrentlyViewedChannel(channelId);

    // If activating a channel, mark as read
    if (channelId && unreadChannels[channelId]) {
      console.log('📖 [NotificationContext] Marquage du canal comme lu:', channelId);
      const updatedUnreadChannels = { ...unreadChannels };
      delete updatedUnreadChannels[channelId];
      setUnreadChannels(updatedUnreadChannels);

      // Save unread channels state
      saveUnreadChannels(updatedUnreadChannels);
    }

    // Store the channel name if available
    if (channelId && channelTitle) {
      console.log('💾 [NotificationContext] Sauvegarde du nom du canal:', channelTitle);
      SecureStore.setItemAsync('viewedChannelName', channelTitle)
        .catch(err => {
          console.error('❌ [NotificationContext] Erreur lors de la sauvegarde du nom du canal:', err);
          handleError(err, i18n.t('error.setChannelName'), {
            type: ErrorType.SYSTEM
          });
        });
    } else {
      console.log('🗑️ [NotificationContext] Suppression du nom du canal');
      SecureStore.deleteItemAsync('viewedChannelName')
        .catch(err => {
          console.error('❌ [NotificationContext] Erreur lors de la suppression du nom du canal:', err);
          handleError(err, i18n.t('error.deleteChannelName'), {
            type: ErrorType.SYSTEM
          });
        });
    }
  };

  // Record the timestamp of the sent message
  const recordSentMessage = (timestamp = Date.now()) => {
    console.log('⏰ [NotificationContext] Enregistrement du timestamp du message envoyé:', {
      timestamp,
      previousTimestamp: lastSentMessageTimestamp
    });
    setLastSentMessageTimestamp(timestamp);
  };

  /**
   * @function markChannelAsUnread
   * @description Mark a channel as unread
   * @param {string} channelId - The ID of the channel
   * @param {boolean} isUnread - Whether the channel is unread
   */
  const markChannelAsUnread = (channelId, isUnread = true) => {
    console.log('📝 [NotificationContext] Marquage du canal comme non lu:', {
      channelId,
      isUnread,
      isActiveChannel: channelId === activeChannelId
    });

    // If it's the active channel, don't mark as unread
    if (!channelId || channelId === activeChannelId) {
      console.log('ℹ️ [NotificationContext] Canal actif, pas marqué comme non lu');
      return;
    }

    setUnreadChannels(prev => {
      // If marking as read, remove from dictionary
      if (!isUnread && prev[channelId]) {
        console.log('📖 [NotificationContext] Marquage du canal comme lu:', channelId);
        const updated = { ...prev };
        delete updated[channelId];

        // Save updated state
        saveUnreadChannels(updated);
        return updated;
      }

      // If marking as unread, add to dictionary
      if (isUnread) {
        const updated = {
          ...prev,
          [channelId]: {
            timestamp: Date.now(),
            count: (prev[channelId]?.count || 0) + 1
          }
        };

        console.log('📝 [NotificationContext] Canal marqué comme non lu:', {
          channelId,
          count: updated[channelId].count
        });

        // Save updated state
        saveUnreadChannels(updated);
        return updated;
      }

      return prev;
    });
  };

  /**
   * @function saveUnreadChannels
   * @description Save the unread channels state
   * @param {Object} unreadState - The unread channels state
   */
  const saveUnreadChannels = async (unreadState) => {
    console.log('💾 [NotificationContext] Sauvegarde des canaux non lus:', {
      channelsCount: Object.keys(unreadState).length
    });

    try {
      await SecureStore.setItemAsync('unreadChannels', JSON.stringify(unreadState));
    } catch (err) {
      console.error('❌ [NotificationContext] Erreur lors de la sauvegarde des canaux non lus:', err);
      handleError(err, i18n.t('error.saveUnreadChannels'), {
        type: ErrorType.SYSTEM
      });
    }
  };

  // Load unread channels state on startup
  useEffect(() => {
    const loadUnreadChannels = async () => {
      console.log('📂 [NotificationContext] Chargement des canaux non lus');
      try {
        const unreadChannelsData = await SecureStore.getItemAsync('unreadChannels');
        if (unreadChannelsData) {
          const parsedData = JSON.parse(unreadChannelsData);
          console.log('📊 [NotificationContext] Canaux non lus chargés:', {
            channelsCount: Object.keys(parsedData).length
          });
          setUnreadChannels(parsedData);
        }
      } catch (err) {
        console.error('❌ [NotificationContext] Erreur lors du chargement des canaux non lus:', err);
        handleError(err, i18n.t('error.loadUnreadChannels'), {
          type: ErrorType.SYSTEM
        });
      }
    };

    loadUnreadChannels();
  }, []);

  // Clean up resources when unmounting
  useEffect(() => {
    return () => {
      console.log('🧹 [NotificationContext] Nettoyage des ressources');
      setCurrentlyViewedChannel(null);
      SecureStore.deleteItemAsync('viewedChannelName')
        .catch(err => {
          console.error('❌ [NotificationContext] Erreur lors du nettoyage:', err);
          handleError(err, i18n.t('error.notificationCleanup'), {
            type: ErrorType.SYSTEM
          });
        });
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        activeChannelId,
        updateActiveChannel,
        lastSentMessageTimestamp,
        recordSentMessage,
        unreadChannels,
        markChannelAsUnread
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use the notification context
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    handleError(err, i18n.t('error.notificationProvider'), {
      type: ErrorType.SYSTEM
    });
  }
  return context;
};