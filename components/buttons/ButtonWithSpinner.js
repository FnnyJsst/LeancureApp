import { ActivityIndicator, View, StyleSheet } from 'react-native';
import Button from './Button';
import { COLORS, SIZES } from '../../constants/style';
import { useDeviceType } from '../../hooks/useDeviceType';
import { Text } from '../text/CustomText';


/**
 * @component ButtonWithSpinner
 * @description A component that renders a button with a spinner used in the login screen
 * 
 * @param {Object} props - The properties of the component
 * @param {boolean} props.isLoading - Whether the button is loading
 * @param {string} props.title - The title of the button
 * 
 * @example
 * <ButtonWithSpinner isLoading={true} title="Connecting..." />
 */

export default function ButtonWithSpinner({ isLoading, title, ...props }) {
  const { isSmartphone } = useDeviceType();

  return (
    <Button
      {...props}

      title={
        isLoading ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <ActivityIndicator size="small" color={COLORS.white} />
            <Text style={[styles.buttonText, isSmartphone && styles.buttonTextSmartphone]}>Connecting...</Text>
          </View>
        ) : (
          title
        )
      }
      disabled={isLoading}
    />
  );
} 

const styles = StyleSheet.create({
  button: {
    height: 60,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: SIZES.fonts.textTablet,
  },
  buttonTextSmartphone: {
    fontSize: SIZES.fonts.textSmartphone,
  },
});



