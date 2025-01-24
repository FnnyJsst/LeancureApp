import { TouchableOpacity, View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';  
import { useDeviceType } from '../../hooks/useDeviceType';
import { COLORS } from '../../constants/style';

export default function ParameterButton({ onPress }) {

  // Customized hook to determine the device type and orientation
  const { isSmartphone } = useDeviceType(); 

  // State to handle the icon color and border color
  const [iconColor, setIconColor] = useState(COLORS.white);  

  // When we press the button, we change the icon color to orange
  const handlePressIn = () => {
    setIconColor(COLORS.orange);
  };

  // When we release the button, we change the icon color back to gray
  const handlePressOut = () => {
    setIconColor(COLORS.white);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.buttonContainer}
        onPress={onPress}
        onPressIn={handlePressIn}   
        onPressOut={handlePressOut}  
      >
        <View style={styles.iconContainer}>
          <Ionicons 
            name="settings-outline" 
            color={iconColor}    
            size={isSmartphone ? 24 : 28} 
          />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
  },
  buttonContainer: {
    backgroundColor: '#271E1E',
    width: 45,
    height: 45,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  }
});