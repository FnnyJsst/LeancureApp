import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Platform, Image } from 'react-native';
import { WebView } from 'react-native-webview';
import { COLORS, SIZES, MODAL_STYLES } from '../../../constants/style';
import { useDeviceType } from '../../../hooks/useDeviceType';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/** Component for previewing a document sent in a chat **/
export default function DocumentPreviewModal({ visible, onClose, fileUrl, fileName, fileSize, fileType, base64 }) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const { isSmartphone, isTabletLandscape } = useDeviceType();
  const isEmulator = Platform.OS === 'android' && !Platform.isTV;

  // Function to handle file download
  const handleDownload = async () => {
    try {
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await Sharing.shareAsync(fileUri);
      console.log('File downloaded successfully');
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  // Function to render the preview
  const renderPreview = () => {
    if (fileType?.includes('pdf')) {
      return (
        <View style={styles.previewWrapper}>
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
                      }
                      #viewer {
                        width: 100%;
                        height: 100%;
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
                          const viewport = page.getViewport({scale: 0.70});
                          
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
              `
            }}
            style={[styles.previewWrapper, { backgroundColor: 'white' }]}
            originWhitelist={['*']}
            scalesPageToFit={true}
            javaScriptEnabled={true}
          />
        </View>
      );
    } else if (fileType?.includes('image')) {
      return (
        <View style={styles.previewWrapper}>
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
      <View style={styles=MODAL_STYLES.modalContainer}>
        <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
          <View style={styles.iconContainer}>
            <Ionicons name="cloud-download-outline" size={24} color={COLORS.white} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <View style={styles.iconContainer}>
            <Ionicons name="close" size={24} color={COLORS.white} />
          </View>
        </TouchableOpacity>
        {renderPreview()}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.gray900,
    marginTop: '20%',
    marginBottom: '20%',
    padding: 20,
    backgroundColor: COLORS.gray750,
    borderRadius: SIZES.borderRadius.large,
  },
  downloadButton: {
    position: 'absolute',
    top: 40,
    right: 60,
    zIndex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
  },
  iconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.overlayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewWrapper: {
    flex: 1,
    backgroundColor: 'transparent',
    marginTop: 30,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
