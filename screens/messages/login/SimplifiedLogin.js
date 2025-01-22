import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../../components/buttons/Button';
import { COLORS, SIZES } from '../../../constants/style';
import { useDeviceType } from '../../../hooks/useDeviceType';

// Simplified login screen is used when the user has already logged in and checked "Stay connected" on the login screen
export default function SimplifiedLogin({ contractNumber, onSwitchAccount, handleLogin }) {

  // Customized hook to determine the device type and orientation
  const { isSmartphone, isLandscape, isSmartphonePortrait, isSmartphoneLandscape } = useDeviceType();
  
  return (
    <View>
      {/* <View style={[styles.welcomeContainer, isLandscape && styles.welcomeContainerLandscape, isSmartphonePortrait && styles.welcomeContainerSmartphonePortrait, isSmartphoneLandscape && styles.welcomeContainerSmartphoneLandscape]}>
        <Text style={[
          styles.welcomeText,
          isSmartphone && styles.welcomeTextSmartphone,
          isSmartphoneLandscape && styles.welcomeContainerSmartphoneLandscape
        ]}>Welcome back</Text>
      </View> */}
      <View style={[styles.loginContainer, isSmartphone && styles.loginContainerSmartphone, isLandscape && styles.loginContainerLandscape]}>
        <View style={[styles.accountContainer, isSmartphone && styles.accountContainerSmartphone]}>
          <View style={styles.accountDetailsContainer}>
            <Text style={[styles.contractNumberText, isSmartphone && styles.contractNumberTextSmartphone]}>
              Contract number
            </Text>
            <Text style={[styles.contractNumber, isSmartphone && styles.contractNumberSmartphone]}>{contractNumber}</Text>
          </View>
          <TouchableOpacity 
            style={styles.loginIcon}
            onPress={() => handleLogin()}
          >
            <Ionicons name="chevron-forward-outline" size={isSmartphone ? 25 : 40} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        <View style={styles.buttonContainer}>
          <Button 
            title="Switch account"
            variant="large"
            onPress={onSwitchAccount}
            backgroundColor={COLORS.orange}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // welcomeContainer: {
  //   marginTop: 50,
  //   marginBottom: 30,
  //   width: '70%',
  //   alignSelf: 'center',
  // },
  // welcomeContainerSmartphonePortrait: {
  //   width: '95%',
  // },
  // welcomeContainerLandscape: {
  //   width: '50%',
  //   marginTop: 4,
  // },
  // welcomeContainerSmartphoneLandscape: {
  //   marginTop: 0,
  //   marginBottom: 10,
  // },
  loginContainer: {
    gap: 20,
    backgroundColor: COLORS.gray800,
    alignSelf: 'center',
    padding: 20,
    borderRadius: SIZES.borderRadius.small, 
    width: '70%',
  },
  loginContainerSmartphone: {
    width: '95%',
  },
  loginContainerLandscape: {
    width: '50%',
  },
  accountContainer: {
    width: '100%',
    backgroundColor: COLORS.gray650,
    borderRadius: SIZES.borderRadius.large,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  accountContainerSmartphone: {
    paddingVertical: 10,
  },
  accountDetailsContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    flex: 1,
  },
  contractNumberText: {
    color: COLORS.gray300,
    fontSize: SIZES.fonts.subtitleTablet,
  },
  contractNumberTextSmartphone: {
    fontSize: SIZES.fonts.subtitleSmartphone,
  },
  contractNumber: {
    color: COLORS.white,
    fontSize: SIZES.fonts.textTablet,
    fontWeight: SIZES.fontWeight.medium,
    marginTop: 5,
  },
  contractNumberSmartphone: {
    fontSize: SIZES.fonts.textSmartphone,
  },
  loginIcon: {
    padding: 10,
  },
  welcomeText: {
    color: COLORS.white,
    fontWeight: SIZES.fontWeight.bold,
    fontSize: SIZES.fonts.headerTablet,
  },
  welcomeTextSmartphone: {
    fontSize: SIZES.fonts.headerSmartphone,
  },
  buttonContainer: {
    width: '100%',
  },
});
