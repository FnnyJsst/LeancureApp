import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Platform } from "react-native";
import { COLORS, SIZES } from "../../constants/style";
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useDeviceType } from '../../hooks/useDeviceType';

// Définir isEmulator comme une constante
const isEmulator = Platform.OS === 'android' && !Platform.isTV;

// ChatMessage is used in the ChatScreen to display the messages
export default function ChatMessage({ message, isOwnMessage, onFileClick }) {

  // Customized hook to determine the device type and orientation
  const { isSmartphone } = useDeviceType();

  if (message.type === 'file') {
    const isPDF = message.fileType === 'application/pdf';
    const isImage = message.fileType?.includes('image');
    
    return (
      <View style={[
        styles.messageContainer, 
        isOwnMessage ? styles.ownMessage : styles.otherMessage,
        styles.fileMessageContainer
      ]}>
        <TouchableOpacity onPress={() => {
          console.log('File clicked:', message.fileName);
          onFileClick(message);
        }} style={styles.fileContainer}>
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
                          
                          const loadingTask = pdfjsLib.getDocument({data: atob('${message.base64}')});
                          loadingTask.promise.then(function(pdf) {
                            pdf.getPage(1).then(function(page) {
                              const canvas = document.createElement('canvas');
                              const context = canvas.getContext('2d');
                              const viewport = page.getViewport({scale: 1.0});
                              
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
                style={styles.preview}
                originWhitelist={['*']}
                scalesPageToFit={true}
                javaScriptEnabled={true}
              />
              <View style={styles.fileHeader}>
                <Ionicons name="document-outline" size={25} color={COLORS.white} />
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {message.fileName}
                  </Text>
                  <Text style={styles.fileSize}>
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
                style={styles.preview}
                resizeMode="cover"
              />
              <View style={styles.fileHeader}>
                <Ionicons 
                  name="image-outline" 
                  size={25} 
                  color={COLORS.white} 
                />
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {message.fileName}
                  </Text>
                  <Text style={styles.fileSize}>
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
      isOwnMessage ? styles.ownMessage : styles.otherMessage,
      styles.textMessageContainer
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
    maxWidth: '70%',
    marginVertical: 5,
    borderRadius: SIZES.borderRadius.small,
  },
  textMessageContainer: {
    padding: 8,
  },
  fileMessageContainer: {
    padding: 0,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.orange,
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
    fontSize: SIZES.fonts.messageTextSmartphone,
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    color: COLORS.white,
    fontSize: SIZES.fonts.textSmartphone,
    fontWeight: SIZES.fontWeight.medium,
  },
  fileSize: {
    color: COLORS.gray300,
    fontSize: SIZES.fonts.errorText,
  },
  previewContainer: {
    width: '93%',
    height: 150,
    borderRadius: SIZES.borderRadius.small,
    overflow: 'hidden',
    backgroundColor: COLORS.overlayLight,
  },
  preview: {
    width: '100%',
    height: '100%',
  }
});