import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../../constants/style';
import { useDeviceType } from '../../hooks/useDeviceType';
import { Text } from '../text/CustomText';
import { useTranslation } from 'react-i18next';
import { format, parse } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import * as Localization from 'expo-localization';

/**
 * @component DateBanner
 * @description A component that renders a date banner in the chat screen
 *
 * @param {Object} props - The properties of the component
 * @param {string} props.date - The date to display
 *
 * @example
 * <DateBanner date="2024-01-01" />
 */
export default function DateBanner({ date }) {

  // Hook to determine the device type
  const { isSmartphone } = useDeviceType();

  const { t } = useTranslation();

  // Récupérer la langue du système
  const locale = Localization.locale.split('-')[0] === 'fr' ? fr : enUS;

  // Vérifier si la date est valide
  let formattedDate;
  try {
    // Parser la date au format "February 13, 2025"
    const dateObj = parse(date, 'MMMM d, yyyy', new Date());

    // Vérifier si la date est valide
    if (isNaN(dateObj.getTime())) {
      console.warn('Date invalide reçue:', date);
      return null;
    }

    formattedDate = format(dateObj, 'EEEE, d MMMM yyyy', { locale });
  } catch (error) {
    console.error('Erreur de formatage de date:', error);
    return null;
  }

  return (
    <View style={[styles.container, isSmartphone && styles.smartphoneContainer]}>

      <Text style={[styles.text, isSmartphone && styles.textSmartphone]}>{formattedDate}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    backgroundColor: '#271E1E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginVertical: 10,
  },
  smartphoneContainer: {
    marginVertical: 5,
  },
  text: {
    color: COLORS.gray300,
    fontSize: SIZES.fonts.smallTextTablet,
    fontWeight: SIZES.fontWeight.medium,
  },
  textSmartphone: {
    fontSize: SIZES.fonts.smallTextSmartphone,
  },

});
