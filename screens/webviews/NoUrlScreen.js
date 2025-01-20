import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import ParameterButton from '../../components/buttons/ParameterButton';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { SIZES, COLORS } from '../../constants/style';
import { useDeviceType } from '../../hooks/useDeviceType';
import { SCREENS } from '../../constants/screens';

/**
 * Screen displayed when the user hasn't imported any channels
 **/
export default function NoUrlScreen({ 
  onNavigate, 
}) {

  // Customized hook to determine the device type and orientation
  const { isSmartphone } = useDeviceType();

  // Function to handle the back button press
  const handleBackPress = () => {
    onNavigate(SCREENS.APP_MENU);
  };

  return (
    <View style={styles.pageContainer}>
      <Header  onBackPress={() => onNavigate(SCREENS.APP_MENU)} />
      <View style={styles.textContainer}>
        <Text style={[
          styles.text,
          isSmartphone && styles.textSmartphone
        ]}>Please enter settings to add an URL</Text>
      </View>

      <View style={styles.buttonContainer}>
        <ParameterButton onPress={handleSettingsPress} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 55, 
    zIndex: 1,

  },
  leftArrowIcon: {
    color: COLORS.gray300,
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