import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { COLORS, SIZES } from "../../constants/style";
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useDeviceType } from '../../hooks/useDeviceType';

export default function ChatMessage({ message, isOwnMessage, onFileClick }) {
  const { isSmartphone } = useDeviceType();

  if (message.type === 'file') {
    const isPDF = message.fileType === 'application/pdf';
    const isImage = message.fileType?.includes('image');
    
    return (
      <View style={[styles.messageContainer, isOwnMessage ? styles.ownMessage : styles.otherMessage]}>
        <TouchableOpacity onPress={() => onFileClick(message)} style={styles.fileContainer}>
          
          {isPDF && message.base64 && (
            <View style={styles.previewContainer}>
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
                            align-items: flex-start;
                            background: transparent;
                            overflow: hidden;
                          }
                          #viewer {
                            width: 100%;
                            height: 100%;
                            display: flex;
                            justify-content: center;
                            align-items: flex-start;
                          }
                          canvas {
                            width: 100%;
                            height: auto;
                            transform: translateX(-15%);
                            transform: translateY(0%);
                          }
                        </style>
                      </head>
                      <body>
                        <div id="viewer"></div>
                        <script>
                          const pdfData = atob('${message.base64}');
                          const pdfBytes = new Uint8Array(pdfData.length);
                          for (let i = 0; i < pdfData.length; i++) {
                            pdfBytes[i] = pdfData.charCodeAt(i);
                          }
                          
                          pdfjsLib.getDocument({data: pdfBytes}).promise.then(function(pdf) {
                            pdf.getPage(1).then(function(page) {
                              const canvas = document.createElement('canvas');
                              const container = document.getElementById('viewer');
                              container.appendChild(canvas);
                              
                              const viewport = page.getViewport({scale: ${isSmartphone ? 2.0 : 2.5}});
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
              />
            <View style={styles.fileHeader}>
            <Ionicons 
              name="document-outline" 
              size={25} 
              color={'white'} 
            />
            <View style={styles.fileInfo}>
              <Text style={[styles.fileName, isOwnMessage && styles.ownFileName]} numberOfLines={1}>
                {message.fileName}
              </Text>
              <Text style={[styles.fileSize, isOwnMessage && styles.ownFileSize]}>
                PDF • {message.fileSize}
              </Text>
            </View>
    
          </View>
        </View>
          )}

          {isImage && message.base64 && (
            <View style={styles.previewContainer}>
              <Image 
                source={{ uri: `data:${message.fileType};base64,${message.base64}` }}
                style={styles.imagePreview}
                resizeMode="cover"
              />
              <View style={styles.fileHeader}>
                <Ionicons 
                  name="image-outline" 
                  size={25} 
                  color={'white'} 
                />
                <View style={styles.fileInfo}>
                  <Text style={[styles.fileName, isOwnMessage && styles.ownFileName]} numberOfLines={1}>
                    {message.fileName}
                  </Text>
                  <Text style={[styles.fileSize, isOwnMessage && styles.ownFileSize]}>
                    Image • {message.fileSize}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[
      styles.messageContainer,
      isOwnMessage ? styles.ownMessage : styles.otherMessage
    ]}>
      {!isOwnMessage && (
        <Text style={[
          styles.username,
          isSmartphone && styles.usernameSmartphone
        ]}>{message.username}</Text>
      )}
      <Text style={[
        styles.messageText,
        isSmartphone && styles.messageTextSmartphone
      ]}>{message.text}</Text>
      <Text style={styles.timestamp}>{message.timestamp}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  messageContainer: {
    maxWidth: '80%',
    padding: 8,
    marginVertical: 5,
    borderRadius: SIZES.borderRadius.small,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.messageOut,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.gray750,
  },
  username: {
    color: COLORS.gray300,
    fontSize: SIZES.fonts.textTablet,
    marginBottom: 2,
  },
  usernameSmartphone: {
    fontSize: SIZES.fonts.textSmartphone,
  },
  messageText: {
    color: COLORS.white,
    fontSize: SIZES.fonts.subtitleTablet,
  },
  messageTextSmartphone: {
    fontSize: SIZES.fonts.subtitleSmartphone,
  },
  timestamp: {
    color: COLORS.gray300,
    fontSize: SIZES.fonts.textSmartphone,
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  fileContainer: {
    minWidth: 280,
    padding: 8,
  },
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
    marginLeft: 10,
  },
  fileInfo: {
    flex: 1,
    marginTop: 2,
  },
  fileName: {
    color: COLORS.white,
    fontSize: SIZES.fonts.textSmartphone,
    fontWeight: SIZES.fontWeight.medium,
  },
  ownFileName: {
    color: COLORS.white,
  },
  fileSize: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: SIZES.fonts.errorText,
  },
  ownFileSize: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  previewContainer: {
    width: '100%',
    height: 200,
    borderRadius: SIZES.borderRadius.small,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: SIZES.borderRadius.small,
    marginBottom: 8,
  }
});
