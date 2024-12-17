import { View, Image, StyleSheet } from 'react-native';
import  Separator  from '../Separator';
import { COLORS } from '../../assets/styles/constants';
import { useDeviceType } from '../../hooks/useDeviceType';
import AccountImage from '../AccountImage';

export default function ChatHeader() {

  const { isTablet, isSmartphone } = useDeviceType();
  return (
    <View>
      <View style={styles.imagesContainer}>
        <Image 
          source={require('../../assets/images/logo.png')} 
          style={[styles.logo, isTablet ? styles.logoTablet : styles.logoSmartphone]} 
        />
        <AccountImage />
      </View>
      <Separator width="100%" marginTop={-30} marginBottom={0} />
    </View>
  );
}

const styles = StyleSheet.create({
  imagesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 15,
  },
  logo: {
    objectFit: 'contain',
    top: -10,
  },
  logoTablet: {
    width: 120,
    height: 50,
  },
  logoSmartphone: {
    width: 90,
    height: 60,
  },
});
