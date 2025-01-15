import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../constants/style';
import { useDeviceType } from '../hooks/useDeviceType';
import { SCREENS } from '../constants/screens';
import AppMenuCard from '../components/cards/AppMenuCard';
import { fetchUserChannels } from '../services/messageApi';
import { Ionicons } from '@expo/vector-icons';

export default function AppMenu({ onNavigate }) {
  const [unreadMessages, setUnreadMessages] = useState(0);
  const { isLandscape, isSmartphone } = useDeviceType();

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

  return (
    <View style={styles.container}>
      <Text style={[
        styles.title,
        isSmartphone && styles.titleSmartphone
      ]}>Welcome</Text>
      <View style={styles.cardsContainer}>
        <AppMenuCard
          title="Messages"
          icon={<Ionicons name="mail-outline" size={isSmartphone ? 24 : 30} color={COLORS.white} />}
          onPress={() => onNavigate(SCREENS.LOGIN)}
          unreadCount={unreadMessages}
        />
        <AppMenuCard
          title="WebViews"
          icon={<Ionicons name="tv-outline" size={isSmartphone ? 24 : 30} color={COLORS.white} />}
          onPress={() => onNavigate(SCREENS.WEBVIEW)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.gray900,
  },
  title: {
    color: COLORS.white,
    fontSize: SIZES.fonts.headerTablet,
    paddingVertical: 30,
  },
  titleSmartphone: {
    fontSize: SIZES.fonts.headerSmartphone,
  },
  cardsContainer: {
    flexDirection: 'column',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15,
  }
});
