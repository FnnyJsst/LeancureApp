import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ButtonLarge from '../../components/buttons/ButtonLarge';
import { COLORS, SIZES } from '../../constants/style';
import { useDeviceType } from '../../hooks/useDeviceType';

export default function SimplifiedLogin({ contractNumber, onSwitchAccount, handleLogin }) {
  const { isSmartphone, isLandscape } = useDeviceType();
  
  return (
    <View>
      <View style={[styles.welcomeContainer, isLandscape && styles.welcomeContainerLandscape]}>
        <Text style={[
          styles.welcomeText,
          isSmartphone && styles.welcomeTextSmartphone
        ]}>Welcome back</Text>
      </View>
      <View style={[styles.loginContainer, isLandscape && styles.loginContainerLandscape]}>
        <View style={styles.accountContainer}>
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
            <Ionicons name="log-in-outline" size={isSmartphone ? 28 : 40} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        <View style={styles.buttonContainer}>
          <ButtonLarge 
            title="Switch account"
            onPress={onSwitchAccount}
            backgroundColor={COLORS.orange}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  welcomeContainer: {
    marginTop: 50,
    marginBottom: 30,
    width: '70%',
    alignSelf: 'center',
  },
  welcomeContainerLandscape: {
    width: '40%',
  },
  loginContainer: {
    gap: 20,
    backgroundColor: COLORS.gray800,
    alignSelf: 'center',
    padding: 20,
    marginHorizontal: 20,
    borderRadius: SIZES.borderRadius.small, 
    width: '70%',
  },
  loginContainerLandscape: {
    width: '40%',
    alignSelf: 'center',
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
  accountDetailsContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    flex: 1,
  },
  contractNumberText: {
    color: COLORS.gray300,
    fontSize: SIZES.fonts.textTablet,
  },
  contractNumberTextSmartphone: {
    fontSize: SIZES.fonts.textSmartphone,
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
