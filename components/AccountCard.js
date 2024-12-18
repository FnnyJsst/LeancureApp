import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../assets/styles/constants';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useDeviceType } from '../hooks/useDeviceType';

export default function AccountCard() {
  const { isSmartphone } = useDeviceType();

  return (
    <View style={[styles.container, isSmartphone && styles.containerSmartphone]}>
      <View style={styles.iconTextContainer}>
        <Ionicons name="person-outline" size={24} color={COLORS.orange} />
        <View style={styles.textContent}>
          <Text style={[styles.textContentTitle, isSmartphone && styles.textContentTitleSmartphone]}>Group</Text>
          <Text style={[styles.textContentDescription, isSmartphone && styles.textContentDescriptionSmartphone]}>Management group</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.sidebarGray,
    padding: 20,
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
    color: COLORS.lightGray,
    fontSize: SIZES.fonts.medium,
  },
  textContentDescription: {
    color: 'white',
    fontSize: SIZES.fonts.small,
  },
  textContentTitleSmartphone: {
    fontSize: SIZES.fonts.small,
  },
});