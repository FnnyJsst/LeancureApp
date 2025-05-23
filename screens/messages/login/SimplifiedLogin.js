import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import InputLogin from '../../../components/inputs/InputLogin';
import { COLORS, SIZES } from '../../../constants/style';
import { useDeviceType } from '../../../hooks/useDeviceType';
import ButtonWithSpinner from '../../../components/buttons/ButtonWithSpinner';
import { Text } from '../../../components/text/CustomText';
import { useTranslation } from 'react-i18next';

/**
 * @component SimplifiedLogin
 * @description Simplified login screen is used when the user has already logged in and checked "Stay connected" on the login screen
 * @param {string} contractNumber - The contract number of the user
 * @param {Function} onSwitchAccount - A function to switch to another account
 * @param {Function} handleLogin - A function to handle the login process
 * @param {boolean} isLoading - A boolean to indicate if the login process is loading
 */
export default function SimplifiedLogin({
    contractNumber,
    onSwitchAccount,
    handleLogin,
    isLoading,
}) {
    const { isSmartphone, isLandscape } = useDeviceType();
    const { t } = useTranslation();

    return (
        <View style={styles.container}>
          <View style={[
            styles.loginContainer,
            isSmartphone && styles.loginContainerSmartphone,
            isLandscape && styles.loginContainerLandscape,
          ]}>
        <View>
          <Text style={[
            styles.welcomeText,
            isSmartphone && styles.welcomeTextSmartphone]}>
            {t('titles.welcomeBack')}
          </Text>
        </View>

        <View style={styles.inputGroup}>

          <Text style={[
            styles.inputTitle,
            isSmartphone && styles.inputTitleSmartphone,
          ]}>
            {t('titles.contractNumber')}
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
            title={t('buttons.login')}
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
          {t('buttons.switchAccount')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
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
    width: '98%',
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
