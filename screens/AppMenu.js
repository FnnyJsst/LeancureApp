import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MenuButton from '../components/buttons/ButtonMenu';
import { COLORS, SIZES } from '../constants/style';
import { useDeviceType } from '../hooks/useDeviceType';
import { SCREENS } from '../constants/screens';
import AppMenuCard from '../components/cards/AppMenuCard';
import MessageIcon from '../components/icons/MessageIcon';
import { fetchUserChannels } from '../services/messageApi';

export default function AppMenu({ onNavigate }) {
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const data = await fetchUserChannels();
        setUnreadMessages(data.unreadCount);
      } catch (error) {
        console.error("Erreur lors du chargement des messages non lus:", error);
      }
    };
    
    loadUnreadCount();
  }, []);

  const { isLandscape, isSmartphone } = useDeviceType();

  return (
    <View style={styles.container}>
      <Text style={[
        styles.title,
        isSmartphone && styles.titleSmartphone
      ]}>Welcome</Text>
      <AppMenuCard
        title="Messages"
        icon={<MessageIcon />}
        onPress={() => onNavigate(SCREENS.LOGIN)}
        unreadCount={unreadMessages}
      />
      <MenuButton 
        icon="tv-outline" 
        text="WebViews" 
        onPress={() => onNavigate(SCREENS.WEBVIEW)} 
        isLandscape={isLandscape}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.gray900,
    gap: 20,
  },
  title: {
    color: COLORS.white,
    fontSize: SIZES.fonts.headerTablet,
    paddingVertical: 20,
  },
  titleSmartphone: {
    fontSize: SIZES.fonts.headerSmartphone,
  },
});
