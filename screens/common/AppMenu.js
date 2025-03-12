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
// import { VERSION } from '../../config/versioning/version';
import { useTranslation } from 'react-i18next';

/**
 * @function AppMenu Component
 * @description Displays the app menu with version-specific features
 *
 * @param {Function} onNavigate - A function to navigate to a screen
 */
export default function AppMenu({ onNavigate, testID }) {

  const { t } = useTranslation();

  const { isSmartphone, isSmartphoneLandscape } = useDeviceType();
  const [isMessagesHidden, setIsMessagesHidden] = useState(false);
  const [hideMessagesModalVisible, setHideMessagesModalVisible] = useState(false);

  // Load the messages visibility - Only for V2
  useEffect(() => {
    // if (VERSION === 'v2') {
      const loadMessagesVisibility = async () => {
        try {
          const savedValue = await SecureStore.getItemAsync('isMessagesHidden');
          if (savedValue !== null) {
            setIsMessagesHidden(JSON.parse(savedValue));
          }
        } catch (error) {
          console.error('Error loading messages visibility:', error);
        }
      };
      loadMessagesVisibility();
    // }
  }, []);

  /**
   * @function handleHideMessages
   * @description Handles the hide messages action - Only for V2
   * @param {boolean} shouldHide - Whether the messages should be hidden
   */
  const handleHideMessages = async (shouldHide) => {
    // if (VERSION === 'v2') {
      try {
        await SecureStore.setItemAsync('isMessagesHidden', JSON.stringify(shouldHide));
        setIsMessagesHidden(shouldHide);
      } catch (error) {
        console.error('Error saving messages visibility:', error);
      }
    // }
  };

  const renderCards = () => {
    return (
      <>
        {/* Messages card - Only shown in V2 when not hidden */}
        {/* {VERSION === 'v2' && !isMessagesHidden && ( */}
        {!isMessagesHidden && (
          <AppMenuCard
            title={t('buttons.messages')}
            icon={<Ionicons
              name="mail-outline"
              size={isSmartphone ? 24 : 30}
              color={COLORS.orange}
            />}
            onPress={() => onNavigate(SCREENS.LOGIN)}
            testID="messages-button"
          />
        )}

        {/* Webviews card - Always shown */}
        <AppMenuCard
          title={t('buttons.webviews')}
          icon={<Ionicons
            name="tv-outline"
            size={isSmartphone ? 24 : 30}
            color={COLORS.orange}
          />}
          onPress={() => onNavigate(SCREENS.WEBVIEW)}
          testID="webview-access-button"
        />
      </>
    );
  };

  return (
    <>
      <GradientBackground>
        <View style={styles.container} testID="app-menu-screen">
          <Text style={[
            styles.title,
            isSmartphone && styles.titleSmartphone,
          ]}>{t('titles.welcome')}</Text>

          <View style={[
            styles.cardsContainer,
            isSmartphoneLandscape && styles.cardsContainerLandscape
          ]}>
            {renderCards()}
          </View>

          {/* Settings button - Comportement différent selon la version */}
          <TouchableOpacity
            style={styles.settingsContainer}
            onPress={() => onNavigate(SCREENS.COMMON_SETTINGS)}
          >
            <Ionicons
              name="settings-outline"
              size={isSmartphone ? 35 : 40}
              color={COLORS.borderColor}
            />
          </TouchableOpacity>

          {/* Hide Messages Modal - Only for V2 */}
          {/* {VERSION === 'v2' && ( */}
            <HideMessagesModal
              visible={hideMessagesModalVisible}
              onClose={() => setHideMessagesModalVisible(false)}
              onToggleHideMessages={handleHideMessages}
            />
          {/* )} */}
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
