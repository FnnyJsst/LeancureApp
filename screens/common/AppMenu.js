import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../../constants/style';
import { useDeviceType } from '../../hooks/useDeviceType';
import { SCREENS } from '../../constants/screens';
import AppMenuCard from '../../components/cards/AppMenuCard';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '../../components/backgrounds/GradientBackground';

/**
 * AppMenu Component
 * Displays the app menu
 * 
 * @param {Function} onNavigate - A function to navigate to a screen
 * @returns {JSX.Element} - A JSX element
 * 
 * @example
 * <AppMenu onNavigate={(screen) => navigate(screen)} />
 */
export default function AppMenu({ onNavigate }) {
  const { isSmartphone, isSmartphoneLandscape } = useDeviceType();

  return (
    <>    
      <GradientBackground>
        <View style={styles.container}>
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
        </View>
      </GradientBackground>
    </>
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
