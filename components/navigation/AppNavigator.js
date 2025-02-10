import React from 'react';
import { SCREENS } from '../../constants/screens';
import AppMenu from '../../screens/common/AppMenu';
import NoUrlScreen from '../../screens/webviews/NoUrlScreen';
import SettingsWebviews from '../../screens/webviews/SettingsWebviews';
import WebviewsManagementScreen from '../../screens/webviews/WebviewsManagementScreen';
import WebviewsListScreen from '../../screens/webviews/WebviewsListScreen';
import WebViewScreen from '../../screens/webviews/WebViewScreen';
import Login from '../../screens/messages/login/Login';

import AccountScreen from '../../screens/messages/AccountScreen';
import ChatScreen from '../../screens/messages/ChatScreen';
import SettingsMessage from '../../screens/messages/SettingsMessage';

/**
 * @function renderWebviewScreen
 * @description Renders the screen
 * @returns {JSX.Element} - The screen
 */

export const AppNavigator = ({ 
  currentScreen,
  navigate,
  selectedWebviews,
  handleSettingsAccess,
  channelProps,
  settingsProps,
  chatProps,
  webViewProps
}) => {
  const renderWebviewScreen = () => {
    switch (currentScreen) {
      case SCREENS.APP_MENU:
        return (
          <AppMenu 
            onNavigate={(screen) => {
              if (screen === SCREENS.WEBVIEW) {
                navigate(selectedWebviews?.length > 0 ? SCREENS.WEBVIEW : SCREENS.NO_URL);
              } else if (screen === SCREENS.SETTINGS) {
                handleSettingsAccess();
              } else {
                navigate(screen);
              }
            }} 
          />
        );

      case SCREENS.NO_URL:
        return (
          <NoUrlScreen 
            onNavigate={navigate}
            {...settingsProps}
          />
        );

      case SCREENS.SETTINGS:
        return (
          <SettingsWebviews
            onNavigate={navigate}
            {...settingsProps}
          />
        );

      case SCREENS.WEBVIEWS_MANAGEMENT:
        return (
          <WebviewsManagementScreen
            onNavigate={navigate}
            {...channelProps}
          />
        );


      case SCREENS.WEVIEWS_LIST:
        return (
          <WebviewsListScreen
            onNavigate={navigate}
            {...channelProps}
          />
        );

      case SCREENS.WEBVIEW:
        return (
          <WebViewScreen 
            onNavigate={navigate}
            {...webViewProps}
          />
        );

      case SCREENS.LOGIN:
        return <Login onNavigate={navigate} />;

      case SCREENS.ACCOUNT:
        return <AccountScreen onNavigate={navigate} />;

      case SCREENS.CHAT:
        return (
          <ChatScreen 
            onNavigate={navigate}
            {...chatProps}
          />
        );

      case SCREENS.SETTINGS_MESSAGE:
        return (
          <SettingsMessage 
            onNavigate={navigate}
            {...chatProps}
          />
        );

      default:
        return null;
    }
  };

  return renderWebviewScreen();
};