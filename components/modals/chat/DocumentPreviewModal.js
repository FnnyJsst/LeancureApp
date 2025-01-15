import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../../constants/style';
import { useDeviceType } from "../../../hooks/useDeviceType";

/** Component for previewing a document sent in a chat **/
export default function DocumentPreviewModal({ visible, onClose, fileUrl, fileName, fileSize, fileType, base64 }) {
  const { isSmartphone, isTabletLandscape } = useDeviceType();
  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;

  const renderPreview = () => {
    if (fileType?.includes('pdf')) {
      const pdfScale = isSmartphone ? 1.0 : (isTabletLandscape ? 2.5 : 2.0);
      
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
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        background: white;
                        min-height: 100vh;
                      }
                      canvas {
                        max-width: ${windowWidth * 0.8}px;
                        max-height: ${windowHeight * 0.8}px;
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
    }
    // ... reste du code pour les autres types de fichiers
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
          isTabletLandscape && styles.modalContentTablet
        ]}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.white} />
          </TouchableOpacity>
          {renderPreview()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    height: '80%',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadius.medium,
    overflow: 'hidden',
  },
  modalContentTablet: {
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
  }
});
