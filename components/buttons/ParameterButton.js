import { TouchableOpacity, View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';  
import { useDeviceType } from '../../hooks/useDeviceType';
import { COLORS } from '../../assets/styles/constants';

export default function ParameterButton({ onPress }) {
  const { isSmartphone } = useDeviceType(); 

  const [iconColor, setIconColor] = useState(COLORS.gray);  
  const [borderColor, setBorderColor] = useState(COLORS.gray);

  const handlePressIn = () => {
    setIconColor(COLORS.orange);
    setBorderColor(COLORS.orange);
  };

  const handlePressOut = () => {
    setIconColor(COLORS.gray);
    setBorderColor(COLORS.gray);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        onPress={onPress}
        onPressIn={handlePressIn}   
        onPressOut={handlePressOut}  
      >
        <View style={[
          styles.iconContainer,
          { borderColor: borderColor } 
        ]}>
          <Ionicons 
            name="settings-outline" 
            color={iconColor}    
            size={isSmartphone ? 35 : 50} 
            style={styles.icon} 
          />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 25,
    left: 25,
  },
  icon: {
    padding: 8,
  },
});