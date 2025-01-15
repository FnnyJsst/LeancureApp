import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions, Linking, Share, Alert, Platform, Image } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../../constants/style';
import { useDeviceType } from "../../../hooks/useDeviceType";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';

/** Component for previewing a document sent in a chat **/
export default function DocumentPreviewModal({ visible, onClose, fileUrl, fileName, fileSize, fileType, base64 }) {
  const { isSmartphone, isSmartphoneLandscape, isTabletLandscape } = useDeviceType();
  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;

  const renderPreview = () => {
    if (fileType?.includes('pdf')) {
      const pdfScale = isSmartphone ? 1.2 : (isTabletLandscape ? 2.8 : 2.3);
      
      return (
        <View style={styles.pdfWrapper}>
          <WebView
            source={{
              html: `
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
                        background: white;
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
                      pdfjsLib.getDocument({data: atob('${base64}')}).promise.then(function(pdf) {
                        pdf.getPage(1).then(function(page) {
                          const canvas = document.getElementById('pdfCanvas');
                          const context = canvas.getContext('2d');
                          const viewport = page.getViewport({scale: ${pdfScale}});
                          
                          canvas.width = viewport.width;
                          canvas.height = viewport.height;
                          
                          page.render({
                            canvasContext: context,
                            viewport: viewport
                          });
                        });
                      });
                    </script>
                  </body>
                </html>
              `
            }}
            style={styles.webview}
            originWhitelist={['*']}
            javaScriptEnabled={true}
            scalesPageToFit={false}
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

  const handleDownload = async () => {
    try {
      // Demander toutes les permissions nécessaires
      const permissions = await Promise.all([
        MediaLibrary.requestPermissionsAsync(),
        FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync()
      ]);

      if (permissions[0].status !== 'granted') {
        Alert.alert('Permission refusée', 'L\'accès au stockage est nécessaire pour télécharger le fichier');
        return;
      }

      const extension = fileType?.includes('pdf') ? '.pdf' : fileType?.includes('image') ? '.jpg' : '';
      const fileUri = `${FileSystem.cacheDirectory}${fileName.replace(/\s+/g, '_')}${extension}`;
      
      // Convertir le base64 en fichier
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (Platform.OS === 'android') {
        const directoryUri = permissions[1].granted ? permissions[1].directoryUri : null;
        if (directoryUri) {
          const destinationUri = await FileSystem.StorageAccessFramework.createFileAsync(
            directoryUri,
            fileName,
            fileType || 'application/octet-stream'
          );
          
          const fileContent = await FileSystem.readAsStringAsync(fileUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          
          await FileSystem.StorageAccessFramework.writeAsStringAsync(
            destinationUri,
            fileContent,
            { encoding: FileSystem.EncodingType.Base64 }
          );

          Alert.alert('Succès', 'Le fichier a été téléchargé avec succès');
        }
      } else {
        const asset = await MediaLibrary.createAssetAsync(fileUri);
        await MediaLibrary.createAlbumAsync('Downloads', asset, false);
        Alert.alert('Succès', 'Le fichier a été téléchargé dans le dossier Downloads');
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      Alert.alert('Erreur', 'Impossible de télécharger le fichier');
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
        <View style={[
          styles.modalContent,
          isSmartphoneLandscape && styles.modalContentSmartphoneLandscape,
          isTabletLandscape && styles.modalContentTabletLandscape
        ]}>
          <View style={styles.header}>
            <View style={styles.fileInfo}>
              <Text style={[styles.fileName, isSmartphone && styles.fileNameSmartphone]}>{fileName}</Text>
              <Text style={styles.fileSize}>{fileSize}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity 
                style={styles.downloadButton} 
                onPress={handleDownload}
              >
                <Ionicons name="download-outline" size={24} color={COLORS.white} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>
          {renderPreview()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    height: '50%',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadius.medium,
    overflow: 'hidden',
  },
  modalContentSmartphoneLandscape: {
    width: '45%',
    height: '90%',
  },
  modalContentTabletLandscape: {
    width: '80%',
    height: '90%',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    padding: 10,
    backgroundColor: COLORS.gray700,
    borderRadius: 20,
  },
  pdfWrapper: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  webview: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: COLORS.gray750,
    borderTopLeftRadius: SIZES.borderRadius.medium,
    borderTopRightRadius: SIZES.borderRadius.medium,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    color: COLORS.white,
    fontSize: SIZES.fonts.textTablet,
    marginBottom: 4,
  },
  fileNameSmartphone: {
    fontSize: SIZES.fonts.textSmartphone,
  },
  fileSize: {
    color: COLORS.gray300,
    fontSize: SIZES.fonts.smallTablet,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  downloadButton: {
    padding: 10,
    backgroundColor: COLORS.orange,
    borderRadius: 20,
  },
  closeButton: {
    padding: 10,
    backgroundColor: COLORS.gray700,
    borderRadius: 20,
  },
  imageWrapper: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
