import { useState } from 'react';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { COLORS } from '../constants/style';

/**
 * @component AccountImage
 * @description A component that renders the account image
 * 
 * @param {Object} props - The properties of the component
 * @param {Function} props.setCurrentScreen - The function to call when the account image is selected
 * @param {number} props.width - The width of the account image
 * @param {number} props.height - The height of the account image
 * @param {string} props.customImage - The custom image of the account
 * @param {boolean} props.alwaysSelected - Whether the account image is always selected
 * 
 * @example
 * <AccountImage setCurrentScreen={() => console.log('Account image selected')} width={100} height={100} customImage="https://example.com/image.png" alwaysSelected={false} />
 */
export default function AccountImage({ setCurrentScreen, width, height, customImage, alwaysSelected }) {

  const [isSelected, setIsSelected] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  /**
   * @function handlePress
   * @description A function to handle the press of the account image
   */
  const handlePress = () => {
    setIsSelected(true);
    if (setCurrentScreen) {
      setCurrentScreen('AccountScreen');
    }
  };


  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.imageContainer}
        onPress={handlePress}
      >
        <Image 
          source={customImage ? { uri: customImage } : require('../assets/images/accountimage.png')} 
          style={[
            styles.image,
            { width: width, height: height },
            (isSelected || alwaysSelected) && styles.selected
          ]}
        />
        {isOnline && <View style={styles.onlineIndicator} />}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginRight: 10,
  },
  imageContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    borderRadius: 100,
    borderWidth: 2,
  },
  selected: {
    borderColor: COLORS.orange,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 100,
    backgroundColor: COLORS.green,
    borderWidth: 2,
    borderColor: COLORS.gray900,
  },
});