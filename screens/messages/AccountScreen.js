import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet} from 'react-native';
import Navbar from '../../components/navigation/Navbar';
import AccountImage from '../../components/AccountImage';
import AccountImageInput from '../../components/AccountImageInput';
import Button from '../../components/buttons/Button';
import Card from '../../components/Card';
import { useDeviceType } from '../../hooks/useDeviceType';
import { COLORS, SIZES } from '../../assets/styles/constants';


export default function AccountScreen({ setCurrentScreen }) {
  
  const { isTablet, isSmartphone } = useDeviceType();
  const [profileImage, setProfileImage] = useState(null);

  const handleSectionChange = (section) => {
    if (section === 'chat') {
      setCurrentScreen('Chat');
    } else if (section === 'account') {
      setCurrentScreen('AccountScreen');
    } else if (section === 'settings') {
      setCurrentScreen('SettingsMessage');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
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
          <Card />
          <Card />
          <View style={[styles.buttonContainer, isSmartphone && styles.buttonContainerSmartphone]}>
            <Button 
              title="Edit" 
              onPress={() => {}} 
              backgroundColor={COLORS.orange}
              color="white"
              width={isTablet ? 100 : 80}
            />
          </View>
        </View>
      </ScrollView>
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
    backgroundColor: COLORS.darkGray,
  },
  scrollViewContent: {
    flexGrow: 1,
    minHeight: '90%',
  },
  content: {
    flex: 1,
    backgroundColor: '#232424',
    margin: 20,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 30,
  },
  contentTablet: {
    gap: 30,
  },
  accountInfos: {
    marginTop: 10,
    alignItems: 'center',
    gap: 2,
  },
  accountName: {
    color: 'white',
    fontSize: SIZES.fonts.large,
    fontWeight: SIZES.fontWeight.bold,
  },
  accountNameSmartphone: {
    fontSize: SIZES.fonts.medium,
  },
  accountJobTitle: {
    color: COLORS.orange,
    fontSize: SIZES.fonts.medium,
    fontWeight: SIZES.fontWeight.medium,
  },
  accountJobTitleSmartphone: {
    fontSize: SIZES.fonts.xSmall,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    width: '100%',
    padding: 20,
  },
});