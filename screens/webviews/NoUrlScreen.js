import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import ParameterButton from '../../components/buttons/ParameterButton';
import { Ionicons } from '@expo/vector-icons';
import { SIZES, COLORS } from '../../constants/style';
import { useDeviceType } from '../../hooks/useDeviceType';
import { SCREENS } from '../../constants/screens';

/**
 * Screen displayed when no URL is entered 
 **/
export default function NoUrlScreen({ onNavigate, isPasswordRequired, password, setPasswordCheckModalVisible }) {

  const { isTablet, isSmartphone } = useDeviceType();

  const handleSettingsPress = () => {
    if (isPasswordRequired && password) {
      setPasswordCheckModalVisible(true);
    } else {
      onNavigate(SCREENS.SETTINGS);
    }
  };
  

  return (
    <View style={styles.pageContainer}>
      <TouchableOpacity 
        onPress={() => onNavigate(SCREENS.APP_MENU)} 
        style={styles.backButton}
      >
        <Ionicons 
          name="arrow-back" 
          size={isTablet ? 35 : 35} 
          style={styles.leftArrowIcon} 
        />
      </TouchableOpacity>

      <View style={styles.textContainer}>
        <Text style={styles.text}>Please enter settings to add an URL</Text>
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
    top: 30,
    left: 30,
    zIndex: 1,
  },
  leftArrowIcon: {
    color: COLORS.gray,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  text: {
    fontSize: SIZES.fonts.medium,
    color: COLORS.lightGray,
    textAlign: 'center',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
  },
});