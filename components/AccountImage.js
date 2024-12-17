import { useState } from 'react';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { COLORS } from '../assets/styles/constants';
import { useDeviceType } from '../hooks/useDeviceType';

export default function AccountImage() {

  const { isTablet, isSmartphone } = useDeviceType();
  const [isSelected, setIsSelected] = useState(false);
  const [isOnline, setIsOnline] = useState(false);



  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.imageContainer}
        onPress={() => setIsSelected(true)}
      >
        <Image source={require('../assets/images/accountimage.png')} 
          style={[styles.image, 
          isSmartphone && styles.imageSmartphone,
          isSelected && styles.selected]} 
        />
        {isOnline && <View style={styles.onlineIndicator} />}
      </TouchableOpacity>
    </View>
  );
} 

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.darkGray,
    height: 100,
    padding: 10,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 100,
    borderWidth: 2,
    position: 'relative',
  },
  imageSmartphone: {
    width: 45,
    height: 45,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 100,
    backgroundColor: COLORS.green,
    position: 'absolute',
    borderWidth: 2,
    borderColor: COLORS.darkGray,
  },
  selected: {
    borderColor: COLORS.orange,
  },
});
