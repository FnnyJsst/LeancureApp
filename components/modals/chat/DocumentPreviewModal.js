import React, { useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { WebView } from 'react-native-webview';
import * as ScreenOrientation from 'expo-screen-orientation';
import { COLORS, SIZES, MODAL_STYLES } from '../../../constants/style';
import { useDeviceType } from '../../../hooks/useDeviceType';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../../components/buttons/Button';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/** Component for previewing a document sent in a chat **/
export default function DocumentPreviewModal({ visible, onClose, fileName, fileSize, fileType, base64 }) {
  const { isSmartphone, isSmartphoneLandscape } = useDeviceType();

  // Lock the orientation to portrait when the modal is visible
  useEffect(() => {
    const lockOrientation = async () => {
      if (visible) {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
      } else {
        // Rétablir l'orientation automatique à la fermeture
        await ScreenOrientation.unlockAsync();
      }
    };

    lockOrientation();

    // Cleanup : rétablir l'orientation automatique quand le composant est démonté
    return () => {
      ScreenOrientation.unlockAsync();
    };
  }, [visible]);

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
                        border-radius: 8px;
                        overflow: hidden;
                      }
                      #viewer {
                        width: 100%;
                        height: 100%;
                        border-radius: 8px;
                        overflow: hidden;
                      }
                      canvas {
                        border-radius: 8px;
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
              `
            }}
            style={styles.previewContent}
            originWhitelist={['*']}
            scalesPageToFit={true}
            javaScriptEnabled={true}
          />
        </View>
      );
    } else if (fileType?.includes('image')) {
      return (
        <View style={styles.previewContainer}>
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
        MODAL_STYLES.modalContainer,
        isSmartphoneLandscape && styles.modalContainerSmartphoneLandscape,
      ]}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.white} />
          </TouchableOpacity>
          
          <View style={styles.fileHeader}>
            <Ionicons 
              name={fileType?.includes('pdf') ? "document-outline" : "image-outline"} 
              size={24} 
              color={COLORS.white} 
            />
            <View style={styles.fileInfo}>
              <Text style={[styles.fileName, isSmartphone && styles.fileNameSmartphone]} numberOfLines={1}>
                {fileName}
              </Text>
              <Text style={[styles.fileSize, isSmartphone && styles.fileSizeSmartphone]}>
                {fileType?.includes('pdf') ? 'PDF' : 'Image'} • {fileSize}
              </Text>
            </View>
          </View>
          <View style={styles.previewContainer}>
            {renderPreview()}
          </View>
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
  modalContent: {
    flex: 1,
    backgroundColor: COLORS.gray850,
    borderWidth: 1,
    borderColor: '#403430',
    marginTop: '10%',
    padding: 20,
    borderRadius: SIZES.borderRadius.xxLarge,
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1,
  },
  previewContainer: {
    flex: 1,
    marginTop: 15,
    backgroundColor: 'transparent',
    borderRadius: SIZES.borderRadius.medium,
    overflow: 'hidden',
  },
  previewContent: {
    flex: 1,
    backgroundColor: 'white',
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
    fontSize: SIZES.fonts.textSmartphone
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10
  },
});
