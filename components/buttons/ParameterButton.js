import { TouchableOpacity, View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';  
import { useDeviceType } from '../../hooks/useDeviceType';
import { COLORS } from '../../constants/style';

/**
 * @component ParameterButton
 * @description A component that renders a button used to access the parameters screen
 * 
 * @param {Object} props - The properties of the component
 * @param {Function} props.onPress - The function to call when the button is pressed
 * 
 * @example
 * <ParameterButton onPress={() => console.log('Button pressed')} />
 */
export default function ParameterButton({ onPress }) {

  const { isSmartphone } = useDeviceType(); 

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
        style={[styles.buttonContainer, isSmartphone && styles.buttonContainerSmartphone]}
        onPress={onPress}
        onPressIn={handlePressIn}   
        onPressOut={handlePressOut}  
      >
        <View style={styles.iconContainer}>
          <Ionicons 
            name="settings-outline" 
            color={iconColor}    
            size={isSmartphone ? 22 : 24} 
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
    backgroundColor: COLORS.charcoal,
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    marginLeft: 10,
  },
  buttonContainerSmartphone: {
    width: 30,
    height: 30,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  }
});