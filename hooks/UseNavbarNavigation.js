import { useCallback } from 'react';

export function useNavbarNavigation(onNavigate) {
  return useCallback((section) => {
    if (section === 'chat') {
      onNavigate('CHAT');
    } else if (section === 'account') {
      onNavigate('ACCOUNT');
    } else if (section === 'settings') {
      onNavigate('SETTINGS_MESSAGE');
    }
  }, [onNavigate]);
}