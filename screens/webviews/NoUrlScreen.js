import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import ParameterButton from '../../components/buttons/ParameterButton';
import { Ionicons } from '@expo/vector-icons';
import { SIZES, COLORS } from '../../constants/style';
import { useDeviceType } from '../../hooks/useDeviceType';
import { SCREENS } from '../../constants/screens';

/**
 * @component NoUrlScreen
 * @description Screen displayed when the user hasn't imported any channels
 * @param {Function} onNavigate - A function to navigate to a screen
 * @param {Function} handleSettingsAccess - A function to handle the settings access
 * @returns {JSX.Element} - A JSX element
 * @example
 * <NoUrlScreen onNavigate={(screen) => navigate(screen)} handleSettingsAccess={handleSettingsAccess} />
 */
export default function NoUrlScreen({ 
  onNavigate, 
  handleSettingsAccess
}) {

  // Customized hook to determine the device type and orientation
  const { isSmartphone } = useDeviceType();

  /**
   * @function handleBackPress
   * @description Handles the back button press
   */
  const handleBackPress = () => {
    onNavigate(SCREENS.APP_MENU);
  };

  return (
    <View style={styles.pageContainer}>
      <View style={styles.customHeaderContainer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <Ionicons 
            name="chevron-back-outline" 
            size={isSmartphone ? 24 : 28} 
            color={COLORS.white} 
          />
        </TouchableOpacity>
      </View>
      <View style={styles.textContainer}>
        <Text style={[
          styles.text,
          isSmartphone && styles.textSmartphone
        ]}>Please enter settings to add an URL</Text>
      </View>

      <View style={styles.buttonContainer}>
        <ParameterButton onPress={() => handleSettingsAccess()} />
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
    marginBottom: 5,
  },
  backButton: {
    backgroundColor: '#271E1E',
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
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