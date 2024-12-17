import { View, Image, StyleSheet, TouchableOpacity } from 'react-native';
import  Separator  from '../Separator';
import { useDeviceType } from '../../hooks/useDeviceType';
import AccountImage from '../AccountImage';

export default function ChatHeader({ setCurrentScreen }) {

  const { isTablet, isSmartphone } = useDeviceType();
  return (
    <View>
      <View style={[styles.imagesContainer, isTablet ? styles.imagesContainerTablet : styles.imagesContainerSmartphone]}>
        <Image 
          source={require('../../assets/images/logo.png')} 
          style={[styles.logo, isTablet ? styles.logoTablet : styles.logoSmartphone]} 
        />
        <AccountImage setCurrentScreen={setCurrentScreen} width={50} height={50} />
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
    top: 0,
    paddingTop: 6,
    paddingBottom: 34,
  },
  imagesContainerSmartphone: {
    paddingTop: 0,
    paddingBottom: 30,
  },
  logo: {
    objectFit: 'contain',
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
