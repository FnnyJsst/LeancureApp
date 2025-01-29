import { ActivityIndicator, View, Text } from 'react-native';
import Button from './Button';
import { COLORS } from '../../constants/style';

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
  return (
    <Button
      {...props}
      title={
        isLoading ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <ActivityIndicator size="small" color={COLORS.white} />
            <Text style={{ color: COLORS.white }}>Connecting...</Text>
          </View>
        ) : (
          title
        )
      }
      disabled={isLoading}
    />
  );
} 