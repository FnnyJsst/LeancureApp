import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ButtonLarge from '../../components/buttons/ButtonLarge';
import { COLORS, SIZES } from '../../constants/style';

export default function SimplifiedLogin({ 
    contractNumber, 
    login, 
    onSwitchAccount 
}) {
    return (
      <View>
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>Welcome back</Text>
        </View>
        <View style={styles.loginContainer}>
          <View style={styles.connectedAccountContainer}>
              <Text style={styles.connectedAccountText}>Connected account</Text>
          </View>
          <View style={styles.accountContainer}>
            <View style={styles.accountDetailsContainer}>
              <View style={styles.iconTextContainer}>
                <MaterialCommunityIcons 
                    name="account-outline" 
                    size={24} 
                    color={COLORS.lightGray} 
                />
                <Text style={styles.contractNumberText}>
                  Contract number 
                </Text>
              </View>
              <Text style={styles.contractNumber}>{contractNumber}</Text>
            </View>
          </View>
          <View style={styles.buttonContainer}>
            <ButtonLarge 
                title="Switch account"
                onPress={() => setIsSimplifiedLogin(false)}
                backgroundColor={COLORS.orange}
            />
          </View>
        </View>
      </View>
    );
  }

  const styles = StyleSheet.create({
    welcomeContainer: {
      alignItems: 'center',
      marginVertical: 50,
  },
  loginContainer: {
      gap: 20,
      backgroundColor: '#232424',
      alignItems: 'center',
      paddingVertical: 30,
      paddingHorizontal: 20,
      marginHorizontal: 20,
  },
  welcomeText: {
      color: "white",
      fontWeight: SIZES.fontWeight.regular,
      fontSize: SIZES.fonts.xLarge,
  },
  connectedAccountContainer: {
      alignItems: 'flex-start',
      width: '100%',
      marginLeft: 10,
  },
  connectedAccountText: {
      color: 'white',
      fontSize: SIZES.fonts.medium,
      fontWeight: SIZES.fontWeight.regular,
  },
  accountContainer: {
      width: '100%',
      backgroundColor: COLORS.sidebarGray,
      borderRadius: 10,
      padding: 20,
      marginTop: 20,
  },
  accountDetailsContainer: {
      flexDirection: 'column',
      alignItems: 'flex-start',
  },
  contractNumberText: {
      color: COLORS.lightGray,
      fontSize: SIZES.fonts.medium,
  },
  contractNumber: {
    color: 'white',
    fontSize: SIZES.fonts.small,
    fontWeight: SIZES.fontWeight.medium,
    marginLeft: 35,
    marginTop: 5,
  },
  iconTextContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
  },
  buttonContainer: {
    width: '100%',
  },
});