import { View, Text, StyleSheet } from 'react-native';
import { useDeviceType } from '../../hooks/useDeviceType';
import { SIZES, COLORS } from '../../assets/styles/constants';

export default function TitleModal({ title }) {

  // Get device type
  const { isSmartphone } = useDeviceType();

  return (
    <View>
      <Text style={[
        styles.title,
        isSmartphone && styles.titleSmartphone,
      ]}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: SIZES.fonts.large,
    fontWeight: SIZES.fontWeight.bold,
    marginBottom: 20,
    marginHorizontal: '2%',
    width: '100%',
    color: COLORS.lightGray,
  },
  titleSmartphone: {
    fontSize: SIZES.fonts.medium,
  },
});