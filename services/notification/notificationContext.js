import { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { handleError, ErrorType } from '../../utils/errorHandling';
import i18n from '../../i18n';

// We create a context for notification data, to share the data between the components
export const NotificationContext = createContext();

// Initialize a global variable to store the ID of the currently viewed channel
let currentlyViewedChannelId = null;

// Initialize a global event emitter for unread messages
if (typeof global !== 'undefined') {
  global.unreadMessageEmitter = {
    listeners: new Set(),
    emit: function(channelId) {
      this.listeners.forEach(listener => listener(channelId));
    },
    addListener: function(listener) {
      this.listeners.add(listener);
    },
    removeListener: function(listener) {
      this.listeners.delete(listener);
    }
  };
}

// Functions to access the global variable
export const getCurrentlyViewedChannel = () => currentlyViewedChannelId;
export const setCurrentlyViewedChannel = (channelId) => {
  currentlyViewedChannelId = channelId ? channelId.toString() : null;

  // Update the global variable for easy access
  if (typeof global !== 'undefined') {
    global.currentlyViewedChannel = currentlyViewedChannelId;
  }
};

// Function to emit unread message event
export const emitUnreadMessage = (channelId) => {
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
        markChannelAsUnread(channelId, true);
      };

      global.unreadMessageEmitter.addListener(handleUnreadMessage);

      return () => {
        global.unreadMessageEmitter.removeListener(handleUnreadMessage);
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
    setActiveChannelId(channelId);
    setCurrentlyViewedChannel(channelId);

    // If activating a channel, mark as read
    if (channelId && unreadChannels[channelId]) {
      const updatedUnreadChannels = { ...unreadChannels };
      delete updatedUnreadChannels[channelId];
      setUnreadChannels(updatedUnreadChannels);

      // Save unread channels state
      saveUnreadChannels(updatedUnreadChannels);
    }

    // Store the channel name if available
    if (channelId && channelTitle) {
      SecureStore.setItemAsync('viewedChannelName', channelTitle)
        .catch(err => handleError(err, i18n.t('error.setChannelName'), {
          type: ErrorType.SYSTEM
        }));
    } else {
      SecureStore.deleteItemAsync('viewedChannelName')
        .catch(err => handleError(err, i18n.t('error.deleteChannelName'), {
          type: ErrorType.SYSTEM
        }));
    }
  };

  // Record the timestamp of the sent message
  const recordSentMessage = (timestamp = Date.now()) => {
    setLastSentMessageTimestamp(timestamp);
  };

  // Mark a channel as unread
  const markChannelAsUnread = (channelId, isUnread = true) => {
    console.log('📝 markChannelAsUnread appelé avec:', { channelId, isUnread });

    if (!channelId) {
      console.log('❌ Pas d\'ID de canal fourni');
      return;
    }

    // If it's the active channel, don't mark as unread
    if (channelId === activeChannelId) {
      console.log('🔕 Canal actif, pas marqué comme non lu');
      return;
    }

    setUnreadChannels(prev => {
      console.log('📊 État précédent des canaux non lus:', prev);

      // If marking as read, remove from dictionary
      if (!isUnread && prev[channelId]) {
        const updated = { ...prev };
        delete updated[channelId];
        console.log('✅ Canal marqué comme lu:', channelId);

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
        console.log('✅ Canal marqué comme non lu:', channelId);
        console.log('📊 Nouvel état des canaux non lus:', updated);

        // Save updated state
        saveUnreadChannels(updated);
        return updated;
      }

      return prev;
    });
  };

  // Save unread channels state
  const saveUnreadChannels = async (unreadState) => {
    try {
      console.log('💾 Sauvegarde des canaux non lus:', unreadState);
      await SecureStore.setItemAsync('unreadChannels', JSON.stringify(unreadState));
      console.log('✅ État des canaux non lus sauvegardé');
    } catch (err) {
      console.error('❌ Erreur lors de la sauvegarde des canaux non lus:', err);
      handleError(err, i18n.t('error.saveUnreadChannels'), {
        type: ErrorType.SYSTEM
      });
    }
  };

  // Load unread channels state on startup
  useEffect(() => {
    const loadUnreadChannels = async () => {
      try {
        const unreadChannelsData = await SecureStore.getItemAsync('unreadChannels');
        if (unreadChannelsData) {
          setUnreadChannels(JSON.parse(unreadChannelsData));
        }
      } catch (err) {
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
      setCurrentlyViewedChannel(null);
      SecureStore.deleteItemAsync('viewedChannelName')
        .catch(err => handleError(err, i18n.t('error.notificationCleanup'), {
          type: ErrorType.SYSTEM
        }));
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