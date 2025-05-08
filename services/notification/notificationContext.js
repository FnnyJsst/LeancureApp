import { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

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

  currentlyViewedChannelId = channelId ? channelId.toString() : null;

  // Update the global variable for easy access
  if (typeof global !== 'undefined') {
    global.currentlyViewedChannel = currentlyViewedChannelId;
  }
};

/**
 * @function emitUnreadMessage
 * @description Emit an unread message event
 * @param {string} channelId - The ID of the channel
 */
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
  const updateActiveChannel = async (channelId, channelTitle) => {

    setActiveChannelId(channelId);
    setCurrentlyViewedChannel(channelId);

    // If activating a channel, mark as read
    if (channelId && unreadChannels[channelId]) {
      const updatedUnreadChannels = { ...unreadChannels };
      delete updatedUnreadChannels[channelId];
      setUnreadChannels(updatedUnreadChannels);
      saveUnreadChannels(updatedUnreadChannels);
    }

    // Store the channel name if available
    if (channelId && channelTitle) {
      try {
        await SecureStore.setItemAsync('viewedChannelName', channelTitle);

      } catch (err) {
        console.error('[NotificationContext] Error while saving the channel name:', err);
      }
    } else {
      try {
        await SecureStore.deleteItemAsync('viewedChannelName');
      } catch (err) {
        console.error('[NotificationContext] Error while deleting the channel name:', err);
      }
    }
  };

  // Record the timestamp of the sent message
  const recordSentMessage = (timestamp = Date.now()) => {
    setLastSentMessageTimestamp(timestamp);
  };

  /**
   * @function markChannelAsUnread
   * @description Mark a channel as unread
   * @param {string} channelId - The ID of the channel
   * @param {boolean} isUnread - Whether the channel is unread
   */
  const markChannelAsUnread = (channelId, isUnread = true) => {

    // If it's the active channel, don't mark as unread
    if (!channelId || channelId === activeChannelId) {
      return;
    }

    setUnreadChannels(prev => {
      // If marking as read, remove from dictionary
      if (!isUnread && prev[channelId]) {
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

    try {
      await SecureStore.setItemAsync('unreadChannels', JSON.stringify(unreadState));
    } catch (err) {
      console.error('[NotificationContext] Error while saving the unread channels:', err);
    }
  };

  // Load unread channels state on app startup
  useEffect(() => {
    const loadUnreadChannels = async () => {
      try {
        // We get the unread channels data from the secure store
        const unreadChannelsData = await SecureStore.getItemAsync('unreadChannels');
        if (unreadChannelsData) {
          const parsedData = JSON.parse(unreadChannelsData);

          setUnreadChannels(parsedData);
        }
      } catch (err) {
        console.error('[NotificationContext] Error while loading the unread channels:', err);
      }
    };

    loadUnreadChannels();
  }, []);

  // Clean up resources when unmounting
  useEffect(() => {
    return () => {
      setCurrentlyViewedChannel(null);
      SecureStore.deleteItemAsync('viewedChannelName')
        .catch(err => {
          console.error('[NotificationContext] Error while cleaning up the notification:', err);
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
    console.error('[NotificationContext] Error while using the notification context:', err);
  }
  return context;
};
