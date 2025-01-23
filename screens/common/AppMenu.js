import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../../constants/style';
import { useDeviceType } from '../../hooks/useDeviceType';
import { SCREENS } from '../../constants/screens';
import AppMenuCard from '../../components/cards/AppMenuCard';
import { fetchUserChannels } from '../../services/messageApi';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function AppMenu({ onNavigate }) {
  // const [unreadMessages, setUnreadMessages] = useState(0);
  const { isLandscape, isSmartphone, isSmartphoneLandscape } = useDeviceType();

  // useEffect(() => {
  //   const loadUnreadCount = async () => {
  //     try {
  //       const data = await fetchUserChannels();
  //       setUnreadMessages(data.unreadCount);
  //     } catch (error) {
  //       console.error("Erreur lors du chargement des messages non lus:", error);
  //     }
  //   };
    
  //   loadUnreadCount();
  // }, []);

  return (
    <LinearGradient
      colors={[
        '#2a1c15',  // Marron très foncé (presque noir)
        '#1a1614',  // Transition très subtile
        '#121212',  // Gris très foncé
        '#121212',  // Gris très foncé
      ]}
      locations={[0, 0.1, 0.2, 1]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      <Text style={[
        styles.title,
        isSmartphone && styles.titleSmartphone
      ]}>Welcome</Text>
      <View style={[styles.cardsContainer, isSmartphoneLandscape && styles.cardsContainerSmartphoneLandscape]}>
        <AppMenuCard
          title="Messages"
          icon={<Ionicons name="mail-outline" size={isSmartphone ? 24 : 30} color={COLORS.orange} />}
          onPress={() => onNavigate(SCREENS.LOGIN)}
          // unreadCount={unreadMessages}
        />
        <AppMenuCard
          title="WebViews"
          icon={<Ionicons name="tv-outline" size={isSmartphone ? 24 : 30} color={COLORS.orange} />}
          onPress={() => onNavigate(SCREENS.WEBVIEW)}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: COLORS.white,
    fontSize: SIZES.fonts.headerTablet,
    fontWeight: SIZES.fontWeight.bold,
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
  },
  cardsContainerSmartphoneLandscape: {
    flexDirection: 'row',
  }
});
