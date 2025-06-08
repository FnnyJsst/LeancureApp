import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import Button from './Button';
import { COLORS, SIZES } from '../../constants/style';
import { useDeviceType } from '../../hooks/useDeviceType';
import { Text } from '../text/CustomText';
import { useTranslation } from 'react-i18next';

/**
 * @component ButtonWithSpinner
 * @description A component that renders a button with a spinner used in the login screen
 * @param {boolean} props.isLoading - Whether the button is loading
 * @param {string} props.title - The title of the button
 */

export default function ButtonWithSpinner({ isLoading, title, testID, ...props }) {
  const { isSmartphone } = useDeviceType();
  const { t } = useTranslation();
  return (
    <Button
      {...props}
      testID={testID}
      title={
        isLoading ? (
          <View style={styles.button}>
            <ActivityIndicator size="small" color={COLORS.white} testID="spinner" />
            <Text style={[styles.buttonText, isSmartphone && styles.buttonTextSmartphone]}>{t('buttons.connecting')}</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: SIZES.fonts.textTablet,
  },
  buttonTextSmartphone: {
    fontSize: SIZES.fonts.textSmartphone,
  },
});
