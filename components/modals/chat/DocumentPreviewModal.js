import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions, Image, Platform } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from "../../../assets/styles/constants";
import { WebView } from 'react-native-webview';
import ButtonLarge from "../../buttons/ButtonLarge";
import Separator from "../../Separator";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/** Component for previewing a document sent in a chat **/
export default function DocumentPreviewModal({ visible, onClose, fileUrl, fileName, fileSize, fileType, base64 }) {

  // Définir handleDownload dans le composant principal
  const handleDownload = async () => {
    try {
      // Créer un fichier temporaire avec le contenu base64
      const fileUri = FileSystem.documentDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Partager le fichier
      await Sharing.shareAsync(fileUri, {
        mimeType: fileType,
        dialogTitle: 'Télécharger ' + fileName,
      });

    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      alert('Erreur lors du téléchargement du fichier');
    }
  };

  // Render the preview of the document
  const renderPreview = () => {
    // If the file URL is not available, display an error message
    if (!fileUrl) {
      return (
        <View style={styles.noPreviewContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.lightGray} />
          <Text style={styles.noPreviewText}>URL du fichier non disponible</Text>
        </View>
      );
    }

    // If the file is an image, display it
    if (fileType?.includes('image')) {
      return (
        <Image 
          source={{ uri: `data:${fileType};base64,${base64}` }} 
          style={styles.preview} 
          resizeMode="contain"
        />
      );
    } 
    
    // If the file is a PDF, display it
    if (fileType?.includes('pdf')) {
      // console.log('PDF URL:', fileUrl);
      // console.log('Base64:', base64 ? base64.substring(0, 50) + '...' : 'No base64');
      return (
        <View style={styles.pdfContainer}>
          <WebView
            // Display the PDF in the WebView
            source={{
              html: `
                <!DOCTYPE html>
                <html>
                  <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.min.js"></script>
                    <style>
                      body { margin: 0; padding: 0; }
                      #viewer { width: 100%; height: 100vh; }
                    </style>
                  </head>
                  <body>
                    <div id="viewer"></div>
                    <script>
                      const pdfData = atob('${base64}');
                      const pdfBytes = new Uint8Array(pdfData.length);
                      for (let i = 0; i < pdfData.length; i++) {
                        pdfBytes[i] = pdfData.charCodeAt(i);
                      }
                      
                      pdfjsLib.getDocument({data: pdfBytes}).promise.then(function(pdf) {
                        pdf.getPage(1).then(function(page) {
                          const canvas = document.createElement('canvas');
                          document.getElementById('viewer').appendChild(canvas);
                          const viewport = page.getViewport({scale: 0.55});
                          canvas.width = viewport.width;
                          canvas.height = viewport.height;
                          page.render({
                            canvasContext: canvas.getContext('2d'),
                            viewport: viewport
                          });
                        });
                      });
                    </script>
                  </body>
                </html>
              `
            }}
            style={styles.preview}
            originWhitelist={['*']}
            javaScriptEnabled={true}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.warn('WebView error:', nativeEvent);
            }}
            onLoadEnd={() => {
              console.log('WebView loaded');
            }}
          />
        </View>
      );
    }

    return (
      <View style={styles.noPreviewContainer}>
        <Ionicons name="document-outline" size={48} color={COLORS.lightGray} />
        <Text style={styles.noPreviewText}>
          Type de fichier : {fileType || 'Inconnu'}
        </Text>
        <Text style={styles.fileSize}>{fileSize}</Text>
      </View>
    );
  };

  return (
    <Modal visible={visible} onRequestClose={onClose} transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>{fileName}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.lightGray} />
            </TouchableOpacity>
          </View>
          <Text style={styles.fileSize}>{fileSize}</Text>
          <Separator />
          <View style={styles.previewContainer}>
            {renderPreview()}
          </View>
          <ButtonLarge title="Download" onPress={handleDownload} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    height: '80%',
    backgroundColor: COLORS.darkGray,
    borderRadius: SIZES.borderRadius.medium,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: 'white',
    fontSize: SIZES.fonts.small,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: SIZES.borderRadius.small,
    overflow: 'hidden',
    marginVertical: 10,
  },
  preview: {
    flex: 1,
    backgroundColor: 'white',
    width: '100%',
    height: '100%',
  },
  noPreviewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPreviewText: {
    color: COLORS.lightGray,
    marginTop: 10,
  },
  fileInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  fileSize: {
    color: COLORS.lightGray,
    fontWeight: SIZES.fontWeight.light,
    fontSize: SIZES.fonts.xSmall,
  },
  fileType: {
    color: COLORS.lightGray,
  },
  pdfContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: 'white',
  },
  pdf: {
    flex: 1,
    width: '100%',
    height: '100%',
  }
});
