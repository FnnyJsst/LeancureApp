import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Platform, Image } from 'react-native';
import { WebView } from 'react-native-webview';
import { COLORS, SIZES } from '../../../constants/style';
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
    // Message pour l'émulateur uniquement pour les PDFs
    if (isEmulator && fileType?.includes('pdf')) {
      return (
        <View style={[styles.previewWrapper, { justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.overlayLight }]}>
          <Text style={{ color: COLORS.white }}>
            Prévisualisation PDF non disponible sur l'émulateur
          </Text>
        </View>
      );
    }

    if (fileType?.includes('pdf') && !isEmulator) {
      const pdfScale = isSmartphone ? 1.2 : (isTabletLandscape ? 2.8 : 2.3);

      const PDF_PREVIEW_HTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.min.js"></script>
            <style>
              body {
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                background: transparent;
                min-height: 100vh;
                overflow: hidden;
              }
              canvas {
                width: 100%;
                height: 100%;
                max-width: ${windowWidth * 0.9}px;
                max-height: ${windowHeight * 0.9}px;
                object-fit: contain;
              }
            </style>
          </head>
          <body>
            <canvas id="pdfCanvas"></canvas>
            <script>
              console.log('Starting PDF.js script');
              try {
                pdfjsLib.getDocument({data: atob('${base64}')}).promise.then(function(pdf) {
                  console.log('PDF document loaded');
                  pdf.getPage(1).then(function(page) {
                    console.log('Page 1 loaded');
                    const canvas = document.getElementById('pdfCanvas');
                    const context = canvas.getContext('2d');
                    const viewport = page.getViewport({scale: ${pdfScale}});
                    
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    
                    page.render({
                      canvasContext: context,
                      viewport: viewport
                    }).promise.then(function() {
                      console.log('Page rendered successfully');
                    }).catch(function(error) {
                      console.error('Error rendering page:', error);
                    });
                  }).catch(function(error) {
                    console.error('Error loading page:', error);
                  });
                }).catch(function(error) {
                  console.error('Error loading PDF document:', error);
                });
              } catch (error) {
                console.error('Error in PDF.js script:', error);
              }
            </script>
          </body>
        </html>
      `;
      
      return (
        <View style={styles.previewWrapper}>
          <WebView
            source={{ html: PDF_PREVIEW_HTML }}
            originWhitelist={['*']}
            javaScriptEnabled={true}
            scalesPageToFit={false}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.warn('WebView error: ', nativeEvent);
            }}
            onLoadEnd={() => console.log('WebView load ended')}
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
      <View style={styles.modalContainer}>
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
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
