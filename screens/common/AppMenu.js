import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SIZES } from '../../constants/style';
import { useDeviceType } from '../../hooks/useDeviceType';
import { SCREENS } from '../../constants/screens';
import AppMenuCard from '../../components/cards/AppMenuCard';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '../../components/backgrounds/GradientBackground';
import { Text } from '../../components/text/CustomText';
import * as SecureStore from 'expo-secure-store';
import HideMessagesModal from '../../components/modals/common/HideMessagesModal';

/**
 * @function AppMenu Component
 * @description Displays the app menu
 *
 * @param {Function} onNavigate - A function to navigate to a screen
 */
export default function AppMenu({ onNavigate, testID }) {
  const { isSmartphone, isSmartphoneLandscape } = useDeviceType();
  const [isMessagesHidden, setIsMessagesHidden] = useState(false);
  const [hideMessagesModalVisible, setHideMessagesModalVisible] = useState(false);

  // Load the messages visibility
  useEffect(() => {
    const loadMessagesVisibility = async () => {
      try {
        const savedValue = await SecureStore.getItemAsync('isMessagesHidden');
        if (savedValue !== null) {
          setIsMessagesHidden(JSON.parse(savedValue));
        }
      } catch (error) {
        throw new Error('Error loading messages visibility:', error);
      }
    };
    loadMessagesVisibility();
  }, []);


  /**
   * @function handleHideMessages
   * @description Handles the hide messages action. When the user hides the messages, he can only access the webviews
   * @param {boolean} shouldHide - Whether the messages should be hidden
   */
  const handleHideMessages = async (shouldHide) => {
    try {
      await SecureStore.setItemAsync('isMessagesHidden', JSON.stringify(shouldHide));
      setIsMessagesHidden(shouldHide);
    } catch (error) {
      console.error('Error saving messages visibility:', error);
    }
  };

  return (
    <>
      <GradientBackground>
        <View style={styles.container} testID="app-menu-screen">
          <Text style={[
            styles.title,
            isSmartphone && styles.titleSmartphone,
          ]}>Welcome</Text>
          <View style={[styles.cardsContainer, isSmartphoneLandscape && styles.cardsContainerLandscape]}>
              {!isMessagesHidden && (
                <AppMenuCard
                  title="Messages"
                  icon={<Ionicons name="mail-outline" size={isSmartphone ? 24 : 30} color={COLORS.orange} />}
                  onPress={() => onNavigate(SCREENS.LOGIN)}
                  testID="messages-button"
                />
              )}
              <AppMenuCard
                title="Webviews"
                icon={<Ionicons name="tv-outline" size={isSmartphone ? 24 : 30} color={COLORS.orange} />}
                onPress={() => onNavigate(SCREENS.WEBVIEW)}
                testID="webview-access-button"
              />
          </View>
          <TouchableOpacity style={styles.settingsContainer} onPress={() => onNavigate(SCREENS.COMMON_SETTINGS)}>
            <Ionicons name="settings-outline" size={isSmartphone ? 24 : 40} color={COLORS.borderColor} />
          </TouchableOpacity>
          <HideMessagesModal
            visible={hideMessagesModalVisible}
            onClose={() => setHideMessagesModalVisible(false)}
            onToggleHideMessages={handleHideMessages}
          />
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
    fontWeight: SIZES.fontWeight.semibold,
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
  cardsContainerLandscape: {
    flexDirection: 'row',
    width: '100%',
  },
  settingsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
  },
});
