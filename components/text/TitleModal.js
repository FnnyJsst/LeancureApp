import { View, StyleSheet } from 'react-native';
import { useDeviceType } from '../../hooks/useDeviceType';
import { SIZES, COLORS } from '../../constants/style';
import { Text } from './CustomText';

/**
 * @component TitleModal
 * @description A component that renders a title for a modal
 * 
 * @param {Object} props - The properties of the component
 * @param {string} props.title - The title of the modal
 */
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
    fontSize: SIZES.fonts.subtitleTablet,
    fontWeight: SIZES.fontWeight.bold,
    marginBottom: 20,
    marginHorizontal: '2%',
    width: '100%',
    color: COLORS.white,
  },
  titleSmartphone: {
    fontSize: SIZES.fonts.biggerTextSmartphone
  },
});