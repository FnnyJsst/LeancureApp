import { View, StyleSheet, TouchableOpacity } from 'react-native';
import InputLogin from '../../../components/inputs/InputLogin';
import { COLORS, SIZES } from '../../../constants/style';
import { useDeviceType } from '../../../hooks/useDeviceType';
import ButtonWithSpinner from '../../../components/buttons/ButtonWithSpinner';
import { Text } from '../../../components/text/CustomText';

/**
 * @component SimplifiedLogin
 * @description Simplified login screen is used when the user has already logged in and checked "Stay connected" on the login screen
 * 
 * @param {string} contractNumber - The contract number of the user
 * @param {Function} onSwitchAccount - A function to switch to another account
 * @param {Function} handleLogin - A function to handle the login process
 * @param {boolean} isLoading - A boolean to indicate if the login process is loading
 * @returns {JSX.Element} - A JSX element
 */
export default function SimplifiedLogin({ 
    contractNumber, 
    onSwitchAccount, 
    handleLogin,
    isLoading 
}) {
  const { isSmartphone, isLandscape } = useDeviceType();
  
  return (
    <View>
      <View style={[
        styles.loginContainer, 
        isSmartphone && styles.loginContainerSmartphone, 
        isLandscape && styles.loginContainerLandscape
      ]}>
        <View style={styles.welcomeContainer}>
          <Text style={[
            styles.welcomeText, 
            isSmartphone && styles.welcomeTextSmartphone]}>
            Welcome back
          </Text>
        </View>

        <View style={styles.inputGroup}>

          <Text style={[
            styles.inputTitle,
            isSmartphone && styles.inputTitleSmartphone
          ]}>
            Contract number
          </Text>
          <View style={styles.inputWrapper}>
            <InputLogin 
              placeholder="Enter your contract number"
              value={contractNumber}
              editable={false}
              iconName="document-text-outline"
              iconLibrary="Ionicons"
            />
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <ButtonWithSpinner 
            variant="large"
            title="Login"
            isLoading={isLoading}
            onPress={handleLogin}
            width="100%"
          />
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.switchAccountLink}
        onPress={onSwitchAccount}
      >
        <Text style={[styles.switchAccountText, isSmartphone && styles.switchAccountTextSmartphone]}>
          Switch account
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  welcomeText: {
    color: COLORS.white,
    fontSize: SIZES.fonts.headerTablet,
    fontWeight: SIZES.fontWeight.semibold,
    textAlign: 'center',
    marginBottom: 30,
  },
  welcomeTextSmartphone: {
    fontSize: SIZES.fonts.headerSmartphone,
  },
  loginContainer: {
    backgroundColor: COLORS.charcoal,
    padding: 25,
    borderRadius: SIZES.borderRadius.xxLarge,
    alignSelf: 'center',
    width: '70%',
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    marginTop: 50,
  },
  loginContainerSmartphone: {
    width: '95%',
  },
  loginContainerLandscape: {
    width: '50%',
  },
  inputGroup: {
    marginBottom: 10,
  },

  inputTitle: {
    color: COLORS.gray300,
    fontSize: SIZES.fonts.subtitleTablet,
    fontWeight: SIZES.fontWeight.regular,
    marginLeft: 10,
    marginBottom: 5,
  },
  inputTitleSmartphone: {
    fontSize: SIZES.fonts.inputTitleSmartphone,
  },
  inputWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  buttonContainer: {
    width: '100%',
  },
  switchAccountLink: {
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  switchAccountText: {
    color: COLORS.gray300,
    fontSize: SIZES.fonts.textTablet,
    textDecorationLine: 'underline',
  },
  switchAccountTextSmartphone: {
    fontSize: SIZES.fonts.textSmartphone,
  },
});