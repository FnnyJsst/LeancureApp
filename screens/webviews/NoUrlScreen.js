import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import ParameterButton from '../../components/buttons/ParameterButton';
import { Ionicons } from '@expo/vector-icons';
import { SIZES, COLORS } from '../../constants/style';
import { useDeviceType } from '../../hooks/useDeviceType';
import { SCREENS } from '../../constants/screens';
import { Text } from '../../components/text/CustomText';

/**
 * @component NoUrlScreen
 * @description Screen displayed when the user hasn't imported any channels
 * @param {Function} onNavigate - A function to navigate to a screen
 * @param {Function} handleSettingsAccess - A function to handle the settings access
 * @param {boolean} isMessagesHidden - A boolean indicating if messages are hidden
 */
export default function NoUrlScreen({
  onNavigate,
  handleSettingsAccess,
  isMessagesHidden,
  testID,
}) {

  const { isSmartphone } = useDeviceType();

  /**
   * @function handleBackPress
   * @description Handles the back button press
   */
  const handleBackPress = () => {
    onNavigate(SCREENS.APP_MENU);
  };

  return (
    <View style={styles.pageContainer} testID={testID}>
      {/* If messages are not hidden, display the back button so we can go back to the app menu */}
      {!isMessagesHidden && (
        <View style={styles.customHeaderContainer}>
          <TouchableOpacity
            style={[styles.backButton, isSmartphone && styles.backButtonSmartphone]}
            onPress={handleBackPress}
          >
            <Ionicons
              name="close-outline"
              size={isSmartphone ? 24 : 28}
              color={COLORS.white}
            />
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.textContainer}>
        <Text style={[
          styles.text,
          isSmartphone && styles.textSmartphone,
        ]}>Please enter settings to import channels</Text>
      </View>

      <View style={styles.buttonContainer}>
        <ParameterButton onPress={() => handleSettingsAccess()} testID="settings-button" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
  },
  customHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  backButton: {
    width: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    marginTop: 10,
  },
  backButtonSmartphone: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: SIZES.fonts.subtitleTablet,
    fontWeight: SIZES.fontWeight.bold,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  text: {
    fontSize: SIZES.fonts.subtitleTablet,
    color: COLORS.gray300,
    textAlign: 'center',
  },
  textSmartphone: {
    fontSize: SIZES.fonts.subtitleSmartphone,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
  },
});
