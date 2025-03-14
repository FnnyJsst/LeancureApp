import React, { useState, useEffect, useCallback, memo } from 'react';
import { View, Modal, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import Button from '../../buttons/Button';
import TitleModal from '../../text/TitleModal';
import { useDeviceType } from '../../../hooks/useDeviceType';
import { SIZES, COLORS, MODAL_STYLES } from '../../../constants/style';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../text/CustomText';
import { useTranslation } from 'react-i18next';

/**
 * @component AutoRefreshModal
 * @description A component that renders a modal for auto-refresh options
 *
 * @param {boolean} props.visible - Whether the modal is visible
 * @param {Function} props.onClose - The function to call when the modal is closed
 * @param {Function} props.onSelectOption - The function to call when the option is selected
 * @param {string} props.currentOption - The current selected option
 */

// Déplacer les options en dehors du composant pour éviter leur recréation à chaque rendu
const createOptions = (t) => [
  { label: t('modals.webview.refresh.never'), value: 'never' },
  { label: t('modals.webview.refresh.every1min'), value: 'every minute' },
  { label: t('modals.webview.refresh.every5min'), value: 'every 5 minutes' },
  { label: t('modals.webview.refresh.every15min'), value: 'every 15 minutes' },
  { label: t('modals.webview.refresh.every30min'), value: 'every 30 minutes' },
  { label: t('modals.webview.refresh.every1h'), value: 'every hour' },
  { label: t('modals.webview.refresh.every2h'), value: 'every 2 hours' },
  { label: t('modals.webview.refresh.every6h'), value: 'every 6 hours' },
];

// Mémoiser l'item de la liste
const RadioItem = memo(({ item, selectedOption, onSelect, isSmartphone }) => (
  <TouchableOpacity
    style={[
      styles.radioContainer,
      isSmartphone && styles.radioContainerSmartphone,
    ]}
    onPress={() => onSelect(item.value)}
  >
    <Ionicons
      name={selectedOption === item.value ? 'radio-button-on-outline' : 'radio-button-off-outline'}
      size={isSmartphone ? 20 : 24}
      color={selectedOption === item.value ? COLORS.orange : COLORS.gray600}
      style={styles.radioIcon}
    />
    <Text style={[
      styles.radioText,
      isSmartphone && styles.radioTextSmartphone
    ]}>{item.label}</Text>
  </TouchableOpacity>
));

const AutoRefreshModal = ({ visible, onClose, onSelectOption, testID, currentOption }) => {
  const { t } = useTranslation();
  const { isSmartphone, isLowResTablet } = useDeviceType();
  const [selectedOption, setSelectedOption] = useState(currentOption || 'never');

  // Mémoiser les options
  const options = React.useMemo(() => createOptions(t), [t]);

  useEffect(() => {
    if (currentOption) {
      setSelectedOption(currentOption);
    }
  }, [currentOption]);

  // Mémoiser les callbacks
  const handleSelect = useCallback((value) => {
    setSelectedOption(value);
  }, []);

  const handleSave = useCallback(() => {
    onSelectOption(selectedOption);
    onClose();
  }, [selectedOption, onSelectOption, onClose]);

  // Mémoiser le rendu des items
  const renderItem = useCallback(({ item }) => (
    <RadioItem
      item={item}
      selectedOption={selectedOption}
      onSelect={handleSelect}
      isSmartphone={isSmartphone}
    />
  ), [selectedOption, handleSelect, isSmartphone]);

  // Mémoiser le keyExtractor
  const keyExtractor = useCallback((item) => item.value, []);

  // Mémoiser les styles de la FlatList
  const contentContainerStyle = React.useMemo(() => [
    styles.optionsContainer,
    isSmartphone && styles.optionsContainerSmartphone,
  ], [isSmartphone]);

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={true}
      testID="auto-refresh-modal"
    >
      <View style={[
        styles.modalContainer,
        isSmartphone && styles.modalContainerSmartphone,
      ]}>
        <View style={[
          styles.modalContent,
          isSmartphone && styles.modalContentSmartphone,
        ]}>
          <TitleModal title={t('modals.webview.refresh.refreshChannels')}/>

          <FlatList
            data={options}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={contentContainerStyle}
            showsVerticalScrollIndicator={false}
            initialNumToRender={8}
            maxToRenderPerBatch={8}
            windowSize={2}
            removeClippedSubviews={true}
            getItemLayout={(data, index) => ({
              length: isSmartphone ? 30 : 40,
              offset: isSmartphone ? 30 * index : 40 * index,
              index,
            })}
          />

          <View style={MODAL_STYLES.buttonContainer}>
            <Button
              title={t('buttons.close')}
              backgroundColor={COLORS.gray950}
              textColor={COLORS.gray300}
              width={isSmartphone ? '23%' : isLowResTablet ? '30%' : '26%'}
              onPress={onClose}
            />
            <Button
              title={t('buttons.set')}
              backgroundColor={COLORS.orange}
              color={COLORS.white}
              width={isSmartphone ? '23%' : isLowResTablet ? '30%' : '26%'}
              onPress={handleSave}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({

  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundModal,
  },
  modalContainerSmartphone: {
    paddingBottom: 0,
  },
  modalContent: {
    width: '40%',
    padding: 20,
    backgroundColor: COLORS.gray850,
    borderRadius: SIZES.borderRadius.xxLarge,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
  },
  modalContentSmartphone: {
    width: '45%',
  },
  optionsContainer: {
    marginTop: 15,
    gap: 6,
  },
  optionsContainerSmartphone: {
    marginTop: 0,
    gap: 2,
  },
  radioContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    marginLeft: 25,
    alignItems: 'center',
  },
  radioContainerSmartphone: {
    marginBottom: 8,
    marginLeft: 20,
  },
  radioIcon: {
    marginRight: 10,
  },
  radioText: {
    fontSize: SIZES.fonts.textTablet,
    color: COLORS.gray300,
  },
  radioTextSmartphone: {
    fontSize: SIZES.fonts.textSmartphone,
    fontWeight: SIZES.fontWeight.medium,
  },
});

// Exporter le composant mémorisé
export default memo(AutoRefreshModal);
