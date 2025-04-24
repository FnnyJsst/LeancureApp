import React from 'react';
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
 * @param {React.ReactNode} props.children - Optional children to render next to the title
 */
export default function TitleModal({ title, children }) {
  // Get device type
  const { isSmartphone } = useDeviceType();

  return (
    <View style={styles.container}>
      <Text style={[
        styles.title,
        isSmartphone && styles.titleSmartphone,
      ]}>
        {title}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: SIZES.fonts.subtitleTablet,
    fontWeight: SIZES.fontWeight.semibold,
    marginHorizontal: '2%',
    color: COLORS.white,
  },
  titleSmartphone: {
    fontSize: SIZES.fonts.biggerTextSmartphone,
  },
});
