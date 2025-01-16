import { useState } from 'react';
import { View, Text, StyleSheet} from 'react-native';
import Navbar from '../../components/navigation/Navbar';
import AccountImage from '../../components/AccountImage';
import AccountImageInput from '../../components/inputs/AccountImageInput';
import Button from '../../components/buttons/Button';
import Header from '../../components/Header';
import { useDeviceType } from '../../hooks/useDeviceType';
import { useNavbarNavigation } from '../../hooks/UseNavbarNavigation';
import { COLORS, SIZES } from '../../constants/style';
import { SCREENS } from '../../constants/screens';

export default function AccountScreen({ onNavigate }) {
  
  const { isTablet, isSmartphone } = useDeviceType();
  const [profileImage, setProfileImage] = useState(null);

  // Custom hook to handle the navbar navigation
  const handleSectionChange = useNavbarNavigation(onNavigate);

  return (
    <View style={styles.container}>
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
      <Navbar 
        currentSection='account' 
        onSectionChange={handleSectionChange}
      />
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