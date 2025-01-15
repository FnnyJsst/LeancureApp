import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions, Linking, Share, Alert, Platform, Image } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../../constants/style';
import { useDeviceType } from "../../../hooks/useDeviceType";
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

/** Component for previewing a document sent in a chat **/
export default function DocumentPreviewModal({ visible, onClose, fileUrl, fileName, fileSize, fileType, base64 }) {

  // We create a hook to determine the device type
  const { isSmartphone, isSmartphoneLandscape, isTabletLandscape } = useDeviceType();

  // We get the window width and height
  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;

  // Function to render the preview
  const renderPreview = () => {
    if (fileType?.includes('pdf')) {
      const pdfScale = isSmartphone ? 1.2 : (isTabletLandscape ? 2.8 : 2.3);

      // We create the HTML for the PDF preview
      const PDF_PREVIEW_HTML = 
      `
        <!DOCTYPE html>
        <html>
          <head>
            <!-- We set the viewport to the device width and initial scale to 1.0 -->
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <!-- We load the PDF.js library -->
            <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.min.js"></script>

            <!-- We set the styles for the PDF preview -->
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
            <!-- We create a canvas to display the PDF preview -->
            <canvas id="pdfCanvas"></canvas>
            <script>
              // We get the PDF document and display the first page
              pdfjsLib.getDocument({data: atob('${base64}')}).promise.then(function(pdf) {
                pdf.getPage(1).then(function(page) {
                  const canvas = document.getElementById('pdfCanvas');
                  const context = canvas.getContext('2d');
                  const viewport = page.getViewport({scale: ${pdfScale}});
                  
                  // We set the canvas width and height
                  canvas.width = viewport.width;
                  canvas.height = viewport.height;
                  
                  // We render the page on the canvas
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
      
      // We return the PDF preview
      return (
        <View style={styles.pdfWrapper}>
          <WebView
            source={{
              html: PDF_PREVIEW_HTML
            }}
            // We allow all origins
            originWhitelist={['*']}
            // We enable JavaScript
            javaScriptEnabled={true}
            // We disable the scaling of the page to fit the screen
            scalesPageToFit={false}
          />
        </View>
      );
    } else if (fileType?.includes('image')) {
      return (
        <View style={styles.imageWrapper}>
          <Image
            // We display the image
            source={{ uri: `data:${fileType};base64,${base64}` }}
            style={styles.image}
            // We resize the image to fit the screen
            resizeMode="contain"
          />
        </View>
      );
    }
  };

  // Function to handle the download of the file
  const handleDownload = async () => {
    try {
      // We request all the necessary permissions
      const permissions = await Promise.all([
        // We request the permission to access the media library
        MediaLibrary.requestPermissionsAsync(),
        // We request the permission to access the storage directory
        FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync()
      ]);

      // If the permission is not granted, we display an alert
      if (permissions[0].status !== 'granted') {
        Alert.alert('Access denied', 'Storage access is required to download the file');
        return;
      }

      const extension = fileType?.includes('pdf') ? '.pdf' : fileType?.includes('image') ? '.jpg' : '';
      // We create the file URI
      const fileUri = `${FileSystem.cacheDirectory}${fileName.replace(/\s+/g, '_')}${extension}`;
      // We convert the base64 to a file
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // If we are on Android, we use the storage access framework to download the file
      if (Platform.OS === 'android') {
        const directoryUri = permissions[1].granted ? permissions[1].directoryUri : null;
        if (directoryUri) {
          const destinationUri = await FileSystem.StorageAccessFramework.createFileAsync(
            directoryUri,
            fileName,
            fileType || 'application/octet-stream'
          );
          // We read the file content
          const fileContent = await FileSystem.readAsStringAsync(fileUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          
          // We write the file content to the destination URI
          await FileSystem.StorageAccessFramework.writeAsStringAsync(
            destinationUri,
            fileContent,
            { encoding: FileSystem.EncodingType.Base64 }
          );

          // We display an alert to inform the user that the file has been downloaded
          Alert.alert('Success', 'The file has been downloaded successfully');
        }
      } else {
        const asset = await MediaLibrary.createAssetAsync(fileUri);
        await MediaLibrary.createAlbumAsync('Downloads', asset, false);
        // We display an alert to inform the user that the file has been downloaded
        Alert.alert('Success', 'The file has been downloaded in the Downloads folder');
      }
    } catch (error) {
      console.error('Error when downloading the file:', error);
      Alert.alert('Error', 'Impossible to download the file');
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
            <View>
              <Text style={[styles.fileName, isSmartphone && styles.fileNameSmartphone]}>{fileName}</Text>
              <Text style={[styles.fileSize, isSmartphone && styles.fileSizeSmartphone]}>{fileSize}</Text>
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
    backgroundColor: COLORS.backgroundModal,
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
  pdfWrapper: {
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
    fontSize: SIZES.fonts.textTablet,
  },
  fileSizeSmartphone: {
    fontSize: SIZES.fonts.textSmartphone,
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
    borderRadius: SIZES.borderRadius.xxLarge,
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
