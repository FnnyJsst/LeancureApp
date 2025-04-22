export const useNotification = () => ({
  markChannelAsUnread: jest.fn(),
  activeChannelId: 'channel_1',
  updateActiveChannel: jest.fn(),
  getCurrentlyViewedChannel: jest.fn()
});

export const NotificationProvider = ({ children }) => children;

export const getCurrentlyViewedChannel = jest.fn();