import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../constants/style';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useDeviceType } from '../hooks/useDeviceType';

export default function Card({ 
  backgroundColor, 
  iconName = "person-outline", 
  iconColor = COLORS.orange,  
  title = "Group",            
  description = "Management group" 
}) {
  const { isSmartphone, isTablet } = useDeviceType();

  return (
    <View style={[
      styles.container, 
      isSmartphone && styles.containerSmartphone, 
      { backgroundColor: backgroundColor }
    ]}>
      <View style={styles.iconTextContainer}>
        <Ionicons 
          name={iconName} 
          size={isTablet ? 30 : 24} 
          color={iconColor} 
        />
        <View style={styles.textContent}>
          <Text style={[
            styles.textContentTitle, 
            isSmartphone && styles.textContentTitleSmartphone
          ]}>
            {title}
          </Text>
          <Text style={[
            styles.textContentDescription, 
            isSmartphone && styles.textContentDescriptionSmartphone
          ]}>
            {description}
          </Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 25,
    marginTop: 20,
    width: '95%',
    borderRadius: SIZES.borderRadius.medium,
  },
  containerSmartphone: {
    padding: 10,
    width: '90%',
  },
  iconTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  textContentTitle: {
    color: COLORS.white,
    fontSize: SIZES.fonts.subtitleTablet,
    marginLeft: 10,
  },
  textContentDescription: {
    color: COLORS.gray300,
    fontSize: SIZES.fonts.subtitleTablet,
    marginLeft: 10,
  },
  textContentTitleSmartphone: {
    fontSize: SIZES.fonts.subtitleSmartphone,
  },
  textContentDescriptionSmartphone: {
    fontSize: SIZES.fonts.subtitleSmartphone,
  },
});