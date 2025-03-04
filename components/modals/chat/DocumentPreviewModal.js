import React, { useState } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { WebView } from 'react-native-webview';
import { COLORS, SIZES } from '../../../constants/style';
import { useDeviceType } from '../../../hooks/useDeviceType';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../../components/buttons/Button';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Text } from '../../text/CustomText';

/**
 * @component DocumentPreviewModal
 * @description A component that renders a document preview in the chat
 *
 * @param {Object} props - The properties of the component
 * @param {boolean} props.visible - Whether the modal is visible
 * @param {Function} props.onClose - The function to call when the modal is closed
 * @param {string} props.fileName - The name of the file
 * @param {string} props.fileSize - The size of the file
 * @param {string} props.fileType - The type of the file
 * @param {string} props.base64 - The base64 of the file
 *
 */
export default function DocumentPreviewModal({ visible, onClose, fileName, fileSize, fileType, base64 }) {
  const { isSmartphone, isSmartphoneLandscape, isLandscape } = useDeviceType();
  const [error, setError] = useState(null);

  /**
   * @function handleDownload
   * @description A function to handle the file download
   */
  const handleDownload = async () => {
    try {
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await Sharing.shareAsync(fileUri);
      setError('File downloaded successfully');
    } catch (downloadFileError) {
      setError(`Error downloading file: ${downloadFileError.message}`);
    }
  };

  /**
   * @function formatFileSize
   * @description Formate la taille du fichier avec l'unité appropriée
   */
  const formatFileSize = () => {
    // Si fileSize est fourni, l'utiliser
    let calculatedSize = fileSize;

    // Sinon, estimer la taille à partir du base64
    if (!calculatedSize && base64) {
      // La taille approximative en octets est la longueur de la chaîne base64 * 0.75
      calculatedSize = Math.round(base64.length * 0.75);
    }

    if (!calculatedSize) return '0 Ko';

    const units = ['Ko', 'Mo', 'Go'];
    let size = calculatedSize / 1024; // Conversion en Ko
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${Math.round(size)} ${units[unitIndex]}`;
  };

  /**
   * @function renderPreview
   * @description A function to render the preview of the file
   */
  const renderPreview = () => {
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
                      const loadingTask = pdfjsLib.getDocument({data: atob('${base64}')});
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
    } else if (fileType?.includes('image')) {
      return (
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: `data:${fileType};base64,${base64}` }}
            style={styles.image}
            resizeMode="contain"
          />
        </View>
      );
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
        isSmartphoneLandscape && styles.modalContainerSmartphoneLandscape,
        isLandscape && styles.modalContainerLandscape,
      ]}>
        <View style={[styles.modalContent, isLandscape && styles.modalContentLandscape]}>
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
              title="Download"
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
  modalContainerSmartphoneLandscape: {
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
  modalContentLandscape: {
    width: '32%',
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
    borderRadius: SIZES.borderRadius.medium,
    overflow: 'hidden',
    backgroundColor: COLORS.gray850,
  },
  image: {
    width: '100%',
    height: '100%',
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
});
