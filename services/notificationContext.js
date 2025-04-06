import { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

// We create a context for notification data, to share the data between the components
export const NotificationContext = createContext();

// Initialize a global variable to store the ID of the currently viewed channel
let currentlyViewedChannelId = null;

// Functions to access the global variable
export const getCurrentlyViewedChannel = () => currentlyViewedChannelId;
export const setCurrentlyViewedChannel = (channelId) => {
  currentlyViewedChannelId = channelId ? channelId.toString() : null;

  // Update the global variable for easy access
  if (typeof global !== 'undefined') {
    global.currentlyViewedChannel = currentlyViewedChannelId;
  }
};

// Context provider for notifications
export const NotificationProvider = ({ children }) => {
  const [lastSentMessageTimestamp, setLastSentMessageTimestamp] = useState(null);
  const [activeChannelId, setActiveChannelId] = useState(null);

  // Update the active channel and the global variable
  const updateActiveChannel = (channelId, channelTitle) => {
    setActiveChannelId(channelId);
    setCurrentlyViewedChannel(channelId);

    // Store the channel name if available
    if (channelId && channelTitle) {
      SecureStore.setItemAsync('viewedChannelName', channelTitle)
        .catch(err => console.error('❌ Error storing the channel name:', err));
    } else {
      SecureStore.deleteItemAsync('viewedChannelName')
        .catch(err => console.error('❌ Erreur lors de la suppression du nom du canal:', err));
    }
  };

  // Record the timestamp of the sent message
  const recordSentMessage = (timestamp = Date.now()) => {
    setLastSentMessageTimestamp(timestamp);
  };

  // Clean up resources when unmounting
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

// Custom hook to use the notification context
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    console.error('❌ useNotification must be used within a NotificationProvider');
  }
  return context;
};