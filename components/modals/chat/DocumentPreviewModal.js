import React, { useState, useEffect } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { WebView } from 'react-native-webview';
import { COLORS, SIZES } from '../../../constants/style';
import { useDeviceType } from '../../../hooks/useDeviceType';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../../components/buttons/Button';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Text } from '../../text/CustomText';
import { fetchMessageFile } from '../../../services/api/messageApi';
import * as SecureStore from 'expo-secure-store';
import { ActivityIndicator } from 'react-native';
import { handleError, ErrorType } from '../../../utils/errorHandling';
import { useTranslation } from 'react-i18next';

/**
 * @component DocumentPreviewModal
 * @description A component that renders a document preview in the chat
 * @param {Object} props - The properties of the component
 * @param {boolean} props.visible - Whether the modal is visible
 * @param {Function} props.onClose - The function to call when the modal is closed
 * @param {string} props.fileName - The name of the file
 * @param {string} props.fileSize - The size of the file
 * @param {string} props.fileType - The type of the file
 * @param {string} props.base64 - The base64 of the file
 */
export default function DocumentPreviewModal({ visible, onClose, fileName, fileSize, fileType, base64: initialBase64, messageId, channelId }) {

  // We get the device type and translation
  const { isSmartphone, isLandscape } = useDeviceType();
  const { t } = useTranslation();

  const [error, setError] = useState(null);
  const [highQualityBase64, setHighQualityBase64] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * @description Loads the high quality image
   */
  useEffect(() => {
    const isImageType = fileType?.toLowerCase().match(/jpg|jpeg|png|gif/);

    const loadHighQualityImage = async () => {
      if (!visible || !messageId || !channelId) return;

      try {
        setIsLoading(true);
        //We get and parse the credentials
        const credentialsStr = await SecureStore.getItemAsync('userCredentials');
        const credentials = JSON.parse(credentialsStr);

        if (!credentialsStr) {
          throw new Error(t('errors.noCredentialsFound'));
        }

        //We fetch the high quality image
        const highQualityData = await fetchMessageFile(messageId, {
          channelid: channelId
        }, credentials);

        if (highQualityData) {
          setHighQualityBase64(highQualityData);
        }
      } catch (err) {
        handleError(err, 'documentPreview.loadHighQualityImage', {
          type: ErrorType.SYSTEM,
          silent: false
        });
        setError(t('errors.errorLoadingFile'));
      } finally {
        setIsLoading(false);
      }
    };

    if (visible && isImageType && messageId && channelId) {
      loadHighQualityImage();
    }
  }, [visible, messageId, channelId, fileType, t]);

  /**
   * @function handleDownload
   * @description A function to handle the file download
   */
  const handleDownload = async () => {
    try {
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      //We write the file to the file system
      await FileSystem.writeAsStringAsync(fileUri, initialBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      //We share the file
      await Sharing.shareAsync(fileUri);
      setError(t('success.fileDownloaded'));
    } catch (downloadFileError) {
      handleError(downloadFileError, 'documentPreview.handleDownload', {
        type: ErrorType.SYSTEM,
        silent: false
      });
      setError(t('errors.errorLoadingFile'));
    }
  };

  /**
   * @function formatFileSize
   * @description Formats the file size with the appropriate unit
   */
  const formatFileSize = () => {
    try {
      let calculatedSize = 0;

      // Option 1: Use the provided size if it is valid
      if (fileSize && !isNaN(parseInt(fileSize, 10))) {
        calculatedSize = parseInt(fileSize, 10);
      }
      // Option 2: Estimate the size from the base64
      else if (initialBase64) {
        calculatedSize = Math.ceil(initialBase64.length * 0.75);
      }
      // Option 3: Use default values based on the type
      else {
        if (fileType?.toLowerCase().includes('pdf')) {
          calculatedSize = 150 * 1024; // ~150 Ko for a typical PDF
        } else if (fileType?.toLowerCase().match(/jpg|jpeg|png|gif/)) {
          calculatedSize = 350 * 1024; // ~350 Ko for a typical image
        } else {
          calculatedSize = 100 * 1024; // ~100 Ko by default
        }
      }

      if (!calculatedSize) return '0 Ko';

      // If the size is very small (< 100 bytes) for a real file,
      // assume it is already in Ko and not in bytes
      if (calculatedSize < 100) {
        const size = calculatedSize;
        return size < 10 ? `${size.toFixed(1)} Ko` : `${Math.round(size)} Ko`;
      }

      // Direct conversion to Ko, always start in Ko
      const units = ['Ko', 'Mo', 'Go'];
      let size = calculatedSize / 1024; // Direct conversion to Ko
      let unitIndex = 0;

      // For very small files (less than 0.1 Ko), display at least 0.1 Ko
      if (size < 0.1) {
        return '0.1 Ko';
      }

      // Increase in units if necessary
      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
      }

      // For small sizes (< 10), display one decimal for more precision
      if (size < 10) {
        return `${size.toFixed(1)} ${units[unitIndex]}`;
      }

      // For larger sizes, round to the nearest integer
      return `${Math.round(size)} ${units[unitIndex]}`;
    } catch (err) {
      handleError(err, 'documentPreview.formatFileSize', {
        type: ErrorType.SYSTEM,
        silent: true
      });
      return '0 Ko';
    }
  };

  /**
   * @function renderPreview
   * @description A function to render the preview of the file
   */
  const renderPreview = () => {
    try {
      if (fileType?.includes('pdf')) {
        return (
          <View style={styles.previewContainer}>
            <WebView
              source={{
                html: `
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.min.js"></script>
                      <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js"></script>
                      <style>
                        body, html {
                          margin: 0;
                          padding: 0;
                          width: 100%;
                          height: 100%;
                          background-color: white;
                          overflow: hidden;
                        }
                        #viewer {
                          width: 100%;
                          height: 100%;
                          overflow: hidden;
                        }
                      </style>
                    </head>
                    <body>
                      <div id="viewer"></div>
                      <script>
                        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';
                        const loadingTask = pdfjsLib.getDocument({data: atob('${initialBase64}')});
                        loadingTask.promise.then(function(pdf) {
                          pdf.getPage(1).then(function(page) {
                            const canvas = document.createElement('canvas');
                            const context = canvas.getContext('2d');
                            const viewport = page.getViewport({scale: 0.62});

                            canvas.width = viewport.width;
                            canvas.height = viewport.height;

                            const renderContext = {
                              canvasContext: context,
                              viewport: viewport
                            };

                            document.getElementById('viewer').appendChild(canvas);
                            page.render(renderContext);
                          });
                        });
                      </script>
                    </body>
                  </html>
                `,
              }}
              originWhitelist={['*']}
              scalesPageToFit={true}
              javaScriptEnabled={true}
            />
          </View>
        );
      } else if (fileType?.toLowerCase().match(/jpg|jpeg|png|gif/)) {
        const mimeType = fileType.includes('jpg') || fileType.includes('jpeg')
          ? 'image/jpeg'
          : 'image/png';

        const imageSource = {
          uri: `data:${mimeType};base64,${highQualityBase64 || initialBase64}`,
          cache: 'reload',
          timestamp: Date.now()
        };

        return (
          <View style={styles.imageWrapper}>
            <Image
              source={imageSource}
              style={styles.image}
              resizeMode="contain"
              onError={(error) => {
                handleError(error, 'documentPreview.imageLoad', {
                  type: ErrorType.SYSTEM,
                  silent: false
                });
                setError(t('errors.errorLoadingFile'));
              }}
            />
            {isLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={COLORS.orange} />
              </View>
            )}
            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}
          </View>
        );
      }
    } catch (err) {
      handleError(err, 'documentPreview.renderPreview', {
        type: ErrorType.SYSTEM,
        silent: false
      });
      setError(t('errors.errorLoadingFile'));
      return null;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[
        styles.modalContainer,
        isLandscape && styles.modalContainerLandscape,
      ]}>
        <View
          style={[
          styles.modalContent,
          isSmartphone && styles.modalContentSmartphone,
          isLandscape && styles.modalContentLandscape
        ]}>
          <TouchableOpacity style={styles.closeButtonContainer} onPress={onClose}>
            <View style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.white} />
            </View>
          </TouchableOpacity>

          <View style={styles.fileHeader}>
            <Ionicons
              name={fileType?.includes('pdf') ? 'document-outline' : 'image-outline'}
              size={24}
              color={COLORS.white}
            />
            <View style={styles.fileInfo}>
              <Text
                style={[styles.fileName, isSmartphone && styles.fileNameSmartphone]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {fileName}
              </Text>
              <Text style={[styles.fileSize, isSmartphone && styles.fileSizeSmartphone]}>
                {fileType?.includes('pdf') ? 'PDF' : 'Image'} • {formatFileSize()}
              </Text>
            </View>
          </View>
          {renderPreview()}
          <View style={styles.buttonContainer}>
            <Button
              title={t('buttons.download')}
              variant="large"
              onPress={handleDownload}
              width="100%"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingBottom: '40%',
    paddingTop: '20%',
  },
  modalContainerLandscape: {
    paddingBottom: '5%',
    paddingTop: '5%',
  },
  modalContent: {
    flex: 1,
    backgroundColor: COLORS.gray850,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    borderRadius: SIZES.borderRadius.xxLarge,
    marginTop: '10%',
    padding: 20,
    width: '50%',
    height: '50%',
  },
  modalContentSmartphone: {
    width: '90%',
  },
  modalContentLandscape: {
    width: '40%',
    height: '100%',
    marginTop: '0%',
  },
  closeButtonContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: 'rgba(50, 50, 50, 0.8)',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray700,
  },
  previewContainer: {
    flex: 1,
    marginTop: 15,
    backgroundColor: COLORS.gray850,
    overflow: 'hidden',
  },
  imageWrapper: {
    flex: 1,
    marginTop: 15,
    borderRadius: SIZES.borderRadius.medium,
    overflow: 'hidden',
    backgroundColor: COLORS.gray850,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileInfo: {
    marginLeft: 10,
    flex: 1,
  },
  fileName: {
    color: COLORS.white,
    fontSize: SIZES.fonts.textTablet,
    fontWeight: '500',
  },
  fileNameSmartphone: {
    fontSize: SIZES.fonts.textSmartphone,
  },
  fileSize: {
    color: COLORS.gray300,
    fontSize: SIZES.fonts.textTablet,
    marginTop: 2,
  },
  fileSizeSmartphone: {
    fontSize: SIZES.fonts.textSmartphone,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  errorText: {
    color: COLORS.red,
    marginTop: 10,
  }
});
