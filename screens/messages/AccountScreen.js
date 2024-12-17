import { useState } from 'react';
import { View, Text, StyleSheet} from 'react-native';
import Navbar from '../../components/navigation/Navbar';
import AccountImage from '../../components/AccountImage';
import AccountImageInput from '../../components/AccountImageInput';
import { useDeviceType } from '../../hooks/useDeviceType';
import { COLORS } from '../../assets/styles/constants';


export default function AccountScreen() {
  
  const { isTablet, isSmartphone } = useDeviceType();
  const [profileImage, setProfileImage] = useState(null);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.accountInfos}>
          <AccountImage customImage={profileImage} width={isTablet ? 100 : 70} height={isTablet ? 100 : 70} />
          <AccountImageInput onImageSelected={setProfileImage} />
          <Text style={styles.accountName}>John Doe</Text>
          <Text style={styles.accountJobTitle}>Technician</Text>
        </View>
      </View>
      <Navbar 
        currentSection='account' 
        onSectionChange={() => {}}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darkGray,
    justifyContent: 'space-between', 
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#232424',
    margin: 20,
  },
});