import React from 'react';
import { View, Modal, StyleSheet } from 'react-native';
import Button from '../../buttons/Button';
import { useDeviceType } from '../../../hooks/useDeviceType';
import { COLORS, MODAL_STYLES, SIZES } from '../../../constants/style';
import { Text } from '../../text/CustomText';
import { useTranslation } from 'react-i18next';

/**
 * @component DeleteWebviewModal
 * @description A component that renders a modal for deleting a webview
 *
 * @param {Object} props - The properties of the component
 * @param {boolean} props.visible - Whether the modal is visible
 * @param {Function} props.onClose - The function to call when the modal is closed
 * @param {Function} props.handleDelete - The function to call when the webview is deleted
 */
export default function DeleteWebviewModal({ visible, onClose, handleDelete, testID }) {

  // Hook to determine the device type and orientation
  const { isSmartphone, isLowResTablet } = useDeviceType();

  const { t } = useTranslation();

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={true}
      testID="delete-modal"
    >
      <View style={MODAL_STYLES.modalContainer}>
        <View style={[
          MODAL_STYLES.content,
          isSmartphone && styles.modalContentSmartphone,
          isLowResTablet && styles.modalContentLowResTablet,
        ]}>
          <View style={[
            styles.titleContainer,
            isSmartphone && styles.titleContainerSmartphone,
          ]}>
            <Text style={[
              styles.title,
              isSmartphone && styles.titleSmartphone,
            ]}>{t('settings.webview.deleteChannel')}</Text>
          </View>
          <View style={MODAL_STYLES.buttonContainer}>
            <Button
              title={t('buttons.cancel')}
              backgroundColor={COLORS.gray650}
              color={COLORS.white}
              width={isSmartphone ? '23%' : '26%'}
              onPress={onClose}
            />
            <Button
              title={t('buttons.delete')}
              backgroundColor={COLORS.orange}
              color={COLORS.white}
              width={isSmartphone ? '23%' : '26%'}
              onPress={() => handleDelete()}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContentSmartphone: {
    width: '55%',
  },
  modalContentLowResTablet: {
    width: '55%',
  },
  titleContainerSmartphone: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: SIZES.fonts.subtitleTablet,
    fontWeight: SIZES.fontWeight.semibold,
    color: COLORS.white,
  },
  titleSmartphone: {
    fontSize: SIZES.fonts.biggerTextSmartphone,
  },
});
