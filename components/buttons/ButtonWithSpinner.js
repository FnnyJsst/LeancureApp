import { ActivityIndicator, View, Text } from 'react-native';
import Button from './Button';
import { COLORS } from '../../constants/style';

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