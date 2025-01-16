import { useState } from 'react';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { COLORS } from '../constants/style';

export default function AccountImage({ setCurrentScreen, width, height, customImage, alwaysSelected }) {

  const [isSelected, setIsSelected] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  // When the user clicks on the account image, we select it
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
    borderWidth: 3,
    borderColor: COLORS.gray900,
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