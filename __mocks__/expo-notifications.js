// jest/mocks/expo-notifications.js
const mockNotifications = {
    getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'expo-push-token-123' }),
    getRegistrationInfoAsync: jest.fn().mockResolvedValue({}),
    setNotificationHandler: jest.fn(),
    addNotificationReceivedListener: jest.fn(),
    addNotificationResponseReceivedListener: jest.fn(),
    removeNotificationSubscription: jest.fn(),
    scheduleNotificationAsync: jest.fn(),
    cancelScheduledNotificationAsync: jest.fn(),
    dismissNotificationAsync: jest.fn(),
    getPresentedNotificationsAsync: jest.fn(),
    getBadgeCountAsync: jest.fn(),
    setBadgeCountAsync: jest.fn(),
  };
  
  module.exports = mockNotifications;