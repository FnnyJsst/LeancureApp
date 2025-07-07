import React, { useState, useEffect, useLayoutEffect } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { WebView } from 'react-native-webview';
import { COLORS, SIZES } from '../../../constants/style';
import { useDeviceType } from '../../../hooks/useDeviceType';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../../components/buttons/Button';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Text } from '../../text/CustomText';
import { fetchMessageFile } from '../../../services/api/messageApi';
import { ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Buffer } from 'buffer';
import { useCredentials } from '../../../hooks/useCredentials';
import * as ScreenOrientation from 'expo-screen-orientation';
import { formatFileSize } from '../../../utils/fileUtils';

/**
 * @component DocumentPreviewModal
 * @description A component that renders a document preview in the chat
 * @param {boolean} props.visible - Whether the modal is visible
 * @param {Function} props.onClose - The function to call when the modal is closed
 * @param {string} props.fileName - The name of the file
 * @param {string} props.fileSize - The size of the file
 * @param {string} props.fileType - The type of the file
 * @param {string} props.base64 - The base64 of the file
 */
export default function DocumentPreviewModal({ visible, onClose, fileName, fileSize, fileType, base64: initialBase64, messageId, channelId }) {

  const { isSmartphone, isLandscape, isLowResTabletPortrait, isLowResTabletLandscape, isLowResTablet } = useDeviceType();
  const { t } = useTranslation();

  // We get the credentials and loading state from the useCredentials hook
  const { credentials, isLoading: credentialsLoading } = useCredentials();

  const [error, setError] = useState(null);
  const [highQualityBase64, setHighQualityBase64] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [csvData, setCsvData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [isRotating, setIsRotating] = useState(false);

  useLayoutEffect(() => {
    setIsRotating(true);
    const timer = setTimeout(() => {
      setIsRotating(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [isLandscape]);

  useEffect(() => {
    const isImageType = fileType?.toLowerCase().match(/jpg|jpeg|png|gif/);

    /**
     * @function loadHighQualityImage
     * @description Loads the high quality image
     */
    const loadHighQualityImage = async () => {
      if (!visible || !messageId || !channelId || !credentials) return;

      try {
        setIsLoading(true);

        // We fetch the high quality image
        const highQualityData = await fetchMessageFile(messageId, {
          channelid: channelId
        }, credentials);

        if (highQualityData) {
          setHighQualityBase64(highQualityData);
        }
      } catch (err) {
        console.error('[DocumentPreview] Error while loading the high quality image:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (visible && isImageType && messageId && channelId && !credentialsLoading) {
      loadHighQualityImage();
    }
  }, [visible, messageId, channelId, fileType, credentials, credentialsLoading, t]);

  /**
   * @function parseCSV
   * @description Parse the CSV content into an array of data
   */
  const parseCSV = (base64Content) => {
    try {
      // Decode the base64 content to text
      const decodedContent = atob(base64Content);
      // Split into lines
      const lines = decodedContent.split('\n');

      // Parse each line into columns
      const data = lines.map(line => {
        const columns = [];
        let currentColumn = '';
        let isInQuotes = false;
        let i = 0;

        while (i < line.length) {
          const char = line[i];

          if (char === '"') {
            // Handle escaped quotes
            if (line[i + 1] === '"') {
              currentColumn += '"';
              i += 2;
            } else {
              isInQuotes = !isInQuotes;
              i++;
            }
          } else if (char === ',' && !isInQuotes) {
            columns.push(currentColumn.trim());
            currentColumn = '';
            i++;
          } else {
            currentColumn += char;
            i++;
          }
        }

        // Add the last column
        columns.push(currentColumn.trim());
        return columns;
      }).filter(row => row.length > 0); // Filtrer les lignes vides

      // Split the headers from the data
      const headers = data[0] || [];
      const rows = data.slice(1);

      return {
        headers,
        rows
      };
    } catch (error) {
      handleDocumentError(error, 'documentPreview.parseCSV', {
        type: ErrorType.SYSTEM,
        silent: false
      });
      return {
        headers: [],
        rows: []
      };
    }
  };

  // We parse the CSV when the modal opens
  useEffect(() => {
    if (visible && fileType?.toLowerCase().includes('csv') && initialBase64) {
      const { headers, rows } = parseCSV(initialBase64);
      setCsvData({ headers, rows });
      setTotalPages(Math.ceil(rows.length / rowsPerPage));
      setCurrentPage(1);
    }
  }, [visible, fileType, initialBase64]);

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
    } catch (downloadFileError) {
      setError(t('errors.errorDownloadingFile'));
    }
  };

  /**
   * @function renderCSVPreview
   * @description Display the CSV preview
   */
  const renderCSVPreview = () => {
    if (!csvData.headers || !csvData.rows.length) return null;

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const currentData = csvData.rows.slice(startIndex, endIndex);

    return (
      <View style={styles.csvContainer}>
        <ScrollView horizontal style={styles.csvScrollView}>
          <View style={styles.csvTable}>
            {/* Headers */}
            <View style={styles.csvHeader}>
              {csvData.headers.map((header, index) => (
                <View key={index} style={styles.csvHeaderCell}>
                  <Text style={styles.csvHeaderText}>{header}</Text>
                </View>
              ))}
            </View>
            {/* Data */}
            {currentData.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.csvRow}>
                {row.map((cell, cellIndex) => (
                  <View key={cellIndex} style={styles.csvCell}>
                    <Text style={styles.csvCellText}>{cell}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
        {/* Pagination */}
        <View style={styles.paginationContainer}>
          <TouchableOpacity
            style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
            onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <Text style={styles.paginationButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.paginationText}>
            {t('pagination.page')} {currentPage} / {totalPages}
          </Text>
          <TouchableOpacity
            style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
            onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            <Text style={styles.paginationButtonText}>→</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
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
                          display: flex;
                          justify-content: center;
                          align-items: center;
                        }
                        canvas {
                          max-width: 100%;
                          max-height: 100%;
                          object-fit: contain;
                        }
                      </style>
                    </head>
                    <body>
                      <div id="viewer"></div>
                      <script>
                        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';

                        const loadingTask = pdfjsLib.getDocument({
                          data: atob('${initialBase64}'),
                          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.11.338/cmaps/',
                          cMapPacked: true,
                        });

                        loadingTask.promise.then(function(pdf) {
                          pdf.getPage(1).then(function(page) {
                            const canvas = document.createElement('canvas');
                            const context = canvas.getContext('2d', { alpha: false });
                            const viewport = page.getViewport({ scale: 2.0 }); // Increase resolution

                            // Use a higher pixel ratio for high-density screens
                            const pixelRatio = window.devicePixelRatio || 1;

                            canvas.width = viewport.width * pixelRatio;
                            canvas.height = viewport.height * pixelRatio;

                            // Adjust the canvas display size
                            canvas.style.width = viewport.width + 'px';
                            canvas.style.height = viewport.height + 'px';

                            // Context configuration for better quality
                            context.imageSmoothingEnabled = true;
                            context.imageSmoothingQuality = 'high';

                            // Scale the context for high-density screens
                            context.scale(pixelRatio, pixelRatio);

                            const renderContext = {
                              canvasContext: context,
                              viewport: viewport,
                              enableWebGL: true,
                              renderInteractiveForms: true,
                              antialiasing: true
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
              style={styles.webview}
            />
          </View>
        );
      } else if (fileType?.toLowerCase().includes('csv')) {
        return (
          <View style={styles.previewContainer}>
            {renderCSVPreview()}
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
                setError(t('errors.errorLoadingImage'));
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
      setError(t('errors.errorRenderingPreview'));
      return null;
    }
  };

  useEffect(() => {
    const lockOrientation = async () => {
      if (visible) {
        const currentOrientation = await ScreenOrientation.getOrientationAsync();
        if (isLandscape) {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        } else {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
        }
      } else {
        await ScreenOrientation.unlockAsync();
      }
    };

    lockOrientation();
  }, [visible, isLandscape]);

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
        isLowResTablet && styles.modalContainerLowResTablet,
        isRotating && styles.modalContainerRotating,
      ]}>
        <View
          style={[
          styles.modalContent,
          isLowResTablet && styles.modalContentLowResTablet,
          isSmartphone && styles.modalContentSmartphone,
          isLandscape && styles.modalContentLandscape,
          isLowResTabletLandscape && styles.modalContentLowResTabletLandscape,
          isLowResTabletPortrait && styles.modalContentLowResTabletPortrait,
          isRotating && styles.modalContentRotating,
        ]}>
          <TouchableOpacity style={styles.closeButtonContainer} onPress={onClose} testID="close-button">
            <View style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.white} />
            </View>
          </TouchableOpacity>

          <View style={styles.fileHeader}>
            <View style={styles.fileTypeContainer}>
              <Ionicons
                name={
                  fileType?.includes('pdf') ? 'document-outline' :
                  fileType?.toLowerCase().includes('csv') ? 'document-text-outline' :
                  'image-outline'
                }
                size={24}
                color={COLORS.white}
              />
              <Text style={[styles.fileType, isSmartphone && styles.fileTypeSmartphone]}>
                {fileType?.includes('pdf') ? 'PDF' :
                  fileType?.toLowerCase().includes('csv') ? 'CSV' :
                  'Image'}
              </Text>
            </View>
            <View style={styles.fileSizeContainer}>
              <Text style={[styles.fileSize, isSmartphone && styles.fileSizeSmartphone]}>
                {formatFileSize(
                  // Calcul of the size in bytes
                  fileSize && !isNaN(parseInt(fileSize, 10))
                    ? parseInt(fileSize, 10)
                    : initialBase64
                      ? Math.ceil(initialBase64.length * 0.75)
                      : fileType?.toLowerCase().includes('pdf')
                        ? 150 * 1024  // ~150 Ko for a typical PDF
                        : fileType?.toLowerCase().includes('csv')
                          ? 100 * 1024  // ~100 Ko for a typical CSV
                          : fileType?.toLowerCase().match(/jpg|jpeg|png|gif/)
                            ? 350 * 1024  // ~350 Ko for a typical image
                            : 100 * 1024,  // ~100 Ko for a default
                  {
                    startWithBytes: false,  // Start with Ko
                    precision: 1,           // 1 decimal
                    defaultUnit: 'Ko'       // Default unit in Ko
                  }
                )}
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
      {/* Add a loading overlay if credentials are loading */}
      {credentialsLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.orange} />
        </View>
      )}
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
  modalContainerLowResTablet: {
    paddingBottom: '10%',
    paddingTop: '10%',
  },
  modalContentLowResTabletPortrait: {
    marginTop: '10%',
    marginBottom: '10%',
    width: '60%',
    height: '50%',
  },
  modalContentLowResTabletLandscape: {
    width: '50%',
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
    justifyContent: 'space-between',
    paddingRight: 50,
  },
  fileTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray700,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: SIZES.borderRadius.medium,
  },
  fileSizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray700,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: SIZES.borderRadius.medium,
  },
  fileType: {
    color: COLORS.white,
    fontSize: SIZES.fonts.textTablet,
    marginLeft: 8,
  },
  fileTypeSmartphone: {
    fontSize: SIZES.fonts.textSmartphone,
  },
  fileSize: {
    color: COLORS.white,
    fontSize: SIZES.fonts.textTablet,
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
  },
  csvContainer: {
    flex: 1,
    backgroundColor: COLORS.gray850,
    borderRadius: SIZES.borderRadius.medium,
    overflow: 'hidden',
  },
  csvScrollView: {
    flex: 1,
  },
  csvTable: {
    padding: 10,
  },
  csvHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray700,
    paddingBottom: 8,
    marginBottom: 8,
  },
  csvHeaderCell: {
    padding: 8,
    minWidth: 150,
  },
  csvHeaderText: {
    color: COLORS.orange,
    fontWeight: 'bold',
    fontSize: SIZES.fonts.textTablet,
  },
  csvRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray700,
    paddingVertical: 4,
  },
  csvCell: {
    padding: 8,
    minWidth: 150,
  },
  csvCellText: {
    color: COLORS.white,
    fontSize: SIZES.fonts.textTablet,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray700,
  },
  paginationButton: {
    backgroundColor: COLORS.orange,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: SIZES.borderRadius.medium,
    marginHorizontal: 10,
  },
  paginationButtonDisabled: {
    backgroundColor: COLORS.gray700,
  },
  paginationButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fonts.textTablet,
  },
  paginationText: {
    color: COLORS.white,
    fontSize: SIZES.fonts.textTablet,
    marginHorizontal: 10,
  },
  modalContainerRotating: {
    opacity: 0.8,
  },
  modalContentRotating: {
    transform: [{ scale: 0.95 }],
  },
  webview: {
    flex: 1,
  },
});
