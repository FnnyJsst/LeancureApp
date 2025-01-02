import { Modal, View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { COLORS, SIZES } from "../../../constants/style";
import ButtonLarge from "../../buttons/ButtonLarge";
import Separator from "../../Separator";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useDeviceType } from "../../../hooks/useDeviceType";

/** Component for previewing a document sent in a chat **/
export default function DocumentPreviewModal({ visible, onClose, fileUrl, fileName, fileSize, fileType, base64 }) {

  const { isSmartphone, isLandscape, isTabletLandscape, isSmartphonePortrait, isSmartphoneLandscape } = useDeviceType();

  // Définir handleDownload dans le composant principal
  const handleDownload = async () => {
    try {
      const fileUri = FileSystem.documentDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

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
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.gray300} />
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
      return (
        <View style={styles.pdfContainer}>
          <WebView
            source={{
              html: `
                <!DOCTYPE html>
                <html>
                  <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.min.js"></script>
                    <style>
                      html, body {
                        margin: 0;
                        padding: 0;
                        width: 100%;
                        height: 100%;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        background: white;
                      }
                      #viewer {
                        width: 100%;
                        height: 100%;
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
                      const pdfData = atob('${base64}');
                      const pdfBytes = new Uint8Array(pdfData.length);
                      for (let i = 0; i < pdfData.length; i++) {
                        pdfBytes[i] = pdfData.charCodeAt(i);
                      }
                      
                      pdfjsLib.getDocument({data: pdfBytes}).promise.then(function(pdf) {
                        pdf.getPage(1).then(function(page) {
                          const canvas = document.createElement('canvas');
                          const container = document.getElementById('viewer');
                          container.appendChild(canvas);
                          
                          // Calculer la bonne échelle en fonction de la taille du conteneur
                          const containerWidth = container.clientWidth;
                          const containerHeight = container.clientHeight;
                          const viewport = page.getViewport({scale: ${isSmartphone ? 0.55 : 0.80}});
                          
                          // Ajuster l'échelle pour remplir le conteneur
                          const scaleX = containerWidth / viewport.width;
                          const scaleY = containerHeight / viewport.height;
                          const scale = Math.min(scaleX, scaleY) * 0.95; // 0.95 pour avoir une petite marge
                          
                          const scaledViewport = page.getViewport({scale: scale});
                          canvas.width = scaledViewport.width;
                          canvas.height = scaledViewport.height;
                          
                          page.render({
                            canvasContext: canvas.getContext('2d'),
                            viewport: scaledViewport
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
          />
        </View>
      );
    }

    // Default case: display file info
    return (
      <View style={styles.noPreviewContainer}>
        <Ionicons name="document-outline" size={48} color={COLORS.gray300} />
        <Text style={styles.noPreviewText}>
          Type de fichier : {fileType || 'Inconnu'}
        </Text>
        <Text style={styles.fileSize}>{fileSize}</Text>
      </View>
    );
  };

  return (
    <Modal 
      visible={visible} 
      onRequestClose={onClose} 
      transparent>
      <View style={styles.modalContainer}>
        <View style={[styles.modalContent, {width: isLandscape ? '60%' : '100%'}]}>
          <View style={styles.header}>
            <Text style={styles.title}>{fileName}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.gray300} />
            </TouchableOpacity>
          </View>
          <Text style={styles.fileSize}>{fileSize}</Text>
          <View style={styles.separatorContainer}>
            <Separator width="105.5%" />
          </View>

          {isTabletLandscape ? (
            <View style={styles.tabletLandscapeLayout}>
              <View style={styles.tabletLandscapePreviewCard}>
                <View style={styles.tabletLandscapePreviewContainer}>
                  {renderPreview()}
                </View>
              </View>
              <View style={styles.tabletLandscapeButtonWrapper}>
                <ButtonLarge 
                  title="Download" 
                  onPress={handleDownload}
                  width={200} 
                />
              </View>
            </View>
          ) : (
            <>
              <View style={[styles.previewContainer, isSmartphonePortrait && styles.previewContainerSmartphonePortrait, isSmartphoneLandscape && styles.previewContainerSmartphoneLandscape]}>
                {renderPreview()}
              </View>
              <View style={[styles.buttonContainer, isTabletLandscape && styles.buttonContainerTabletLandscape]}>
                <ButtonLarge 
                  title="Download" 
                  onPress={handleDownload} 
                  style={{width: isTabletLandscape ? '100%' : '97.5%'}}
                />
              </View>
            </>
          )}
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
    backgroundColor: COLORS.backgroundModal,
    padding: 10,
  },
  modalContent: {
    width: '90%',
    height: '80%',
    backgroundColor: COLORS.gray900,
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
    fontSize: SIZES.fonts.subtitleSmartphone,
  },
  fileSize: {
    color: COLORS.gray300,
    fontWeight: SIZES.fontWeight.light,
    fontSize: SIZES.fonts.textSmartphone,
    marginTop: 5,
  },
  separatorContainer: {
    marginVertical: 10,
    width: '100%',
  },
  tabletLandscapeLayout: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  tabletLandscapePreviewCard: {
    flex: 0.7,
    backgroundColor: "#2c2c2f",
    borderRadius: SIZES.borderRadius.small,
    padding: 20,
  },
  tabletLandscapePreviewContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadius.small,
    overflow: 'hidden',
  },
  tabletLandscapeButtonWrapper: {
    flex: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadius.small,
    overflow: 'hidden',
    marginVertical: 10,
    marginHorizontal: 10,
  },
  previewContainerSmartphonePortrait: {
    flex: 5.5,
  },
  preview: {
    flex: 1,
    backgroundColor: COLORS.white,
    width: '100%',
    height: '100%',
  },
  noPreviewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPreviewText: {
    color: COLORS.gray300,
    marginTop: 10,
  },
  pdfContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: COLORS.white,
  },
  pdf: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  buttonContainer: {
    flex: 1,
    width: '97.5%',
    alignSelf: 'center',
    marginTop: 10,
  },
  buttonContainerTabletLandscape: {
    flex: 1.3,
    width: '100%',
  },
});
