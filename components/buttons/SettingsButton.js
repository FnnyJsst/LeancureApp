import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useDeviceType } from '../../hooks/useDeviceType';
import { SIZES,COLORS } from '../../assets/styles/constants';

export default function SettingsButton({ icon, title, onPress }) {
  const { isSmartphone } = useDeviceType();

  return (
    <View style={[
      styles.container,
      isSmartphone && styles.containerSmartphone
    ]}>
      <TouchableOpacity 
        style={[
          styles.button,
          isSmartphone && styles.buttonSmartphone
        ]} 
        onPress={onPress}
      >
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <Text style={[
          styles.text,
          isSmartphone && styles.textSmartphone
        ]}>
          {title}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  // Tablet styles
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 30,
  },
  button: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 10,
  },
  text: {
    fontSize: SIZES.fonts.large,
    color: COLORS.lightGray,
    fontWeight: SIZES.fontWeight.medium,
  },

  // Smartphone styles
  containerSmartphone: {
    marginLeft: 15,
  },
  buttonSmartphone: {
    paddingVertical: 2,
  },
  textSmartphone: {
    fontSize: SIZES.fonts.medium,
  },
});