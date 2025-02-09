import { useState } from 'react';
import { View, Text, StyleSheet} from 'react-native';
import AccountImage from '../../components/AccountImage';
import AccountImageInput from '../../components/inputs/AccountImageInput';
import Button from '../../components/buttons/Button';
import Header from '../../components/Header';
import { useDeviceType } from '../../hooks/useDeviceType';
import { COLORS, SIZES } from '../../constants/style';
import { SCREENS } from '../../constants/screens';

/**
 * @component AccountScreen
 * @description Displays the account screen
 * @param {Function} onNavigate - A function to navigate to a screen
 * @returns {JSX.Element} - A JSX element
 * 
 * @example
 * <AccountScreen onNavigate={(screen) => navigate(screen)} />
 */
export default function AccountScreen({ onNavigate }) {
  
  // Customized hook to determine the device type and orientation
  const { isTablet, isSmartphone } = useDeviceType();

  // We use the useState hook to store the profile image
  const [profileImage, setProfileImage] = useState(null);

  return (
    <View style={styles.container}>
      {/*We show the header with the menu icon, the account image and the back button*/}
      <Header showMenuIcon={false} showAccountImage={true} onNavigate={onNavigate} onBackPress={() => onNavigate(SCREENS.CHAT)} />
        <View style={[styles.content, isSmartphone && styles.contentSmartphone, isTablet && styles.contentTablet]}>
          <AccountImage 
            customImage={profileImage} 
            width={isTablet ? 120 : 90} 
            height={isTablet ? 120 : 90}
            alwaysSelected={true}
          />
          <View style={styles.accountInfos}>
            <AccountImageInput onImageSelected={setProfileImage} />
            <Text style={[styles.accountName, isSmartphone && styles.accountNameSmartphone]}>John Doe</Text>
            <Text style={[styles.accountJobTitle, isSmartphone && styles.accountJobTitleSmartphone]}>Technician</Text>
          </View>
          <View style={[styles.buttonContainer, isSmartphone && styles.buttonContainerSmartphone]}>
            <Button 
              title="Edit" 
              onPress={() => {}} 
              backgroundColor={COLORS.orange}
              width={isTablet ? 100 : 80}
            />
          </View>
        </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray900,
  },
  scrollViewContent: {
    flexGrow: 1,
    minHeight: '90%',
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.gray800,
    borderRadius: SIZES.borderRadius.small,
    margin: 20,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 30,
  },
  contentTablet: {
    gap: 30,
  },
  accountInfos: {
    marginTop: 0,
    alignItems: 'center',
    gap: 2,
  },
  accountName: {
    color: COLORS.white,
    fontSize: SIZES.fonts.titleTablet,
    fontWeight: SIZES.fontWeight.bold,
  },
  accountNameSmartphone: {
    fontSize: SIZES.fonts.titleSmartphone,
  },
  accountJobTitle: {
    color: COLORS.orange,
    fontSize: SIZES.fonts.subtitleTablet,
    fontWeight: SIZES.fontWeight.medium,
  },
  accountJobTitleSmartphone: {
    fontSize: SIZES.fonts.subtitleSmartphone,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    width: '100%',
    padding: 20,
  },
});