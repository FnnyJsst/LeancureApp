import React, { useState } from 'react';
import { View, Modal, StyleSheet, ActivityIndicator } from 'react-native';
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
  const [isDeleting, setIsDeleting] = useState(false);

  // Hook to determine the device type and orientation
  const { isSmartphone, isLowResTablet } = useDeviceType();

  const { t } = useTranslation();

  const handleDeleteWithLoading = async () => {
    setIsDeleting(true);
    try {
      await handleDelete();
    } catch (error) {
      throw new Error('Erreur lors de la suppression:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      animationType="fade"
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
              width={isSmartphone ? '27%' : '30%'}
              onPress={onClose}
              disabled={isDeleting}
            />
            <Button
              title={isDeleting ? t('buttons.deleting') : t('buttons.delete')}
              backgroundColor={COLORS.orange}
              color={COLORS.white}
              width={isSmartphone ? '27%' : '30%'}
              onPress={handleDeleteWithLoading}
              disabled={isDeleting}
              icon={isDeleting ?
                <ActivityIndicator size="small" color={COLORS.white} /> :
                null
              }
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContentSmartphone: {
    width: '60%',
  },
  modalContentLowResTablet: {
    width: '60%',
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
