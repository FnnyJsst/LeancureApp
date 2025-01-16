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

  console.log('Rendering ChatMessage component');
  console.log('Message type:', message.type);
  console.log('Is Emulator:', isEmulator);

  const PDF_PREVIEW_HTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
        <style>
          body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            background-color: #f0f0f0;
          }
          #pdf-viewer {
            width: 100%;
            height: 100%;
            border: none;
          }
        </style>
      </head>
      <body>
        <script>
          function sendToReact(message) {
            window.ReactNativeWebView.postMessage(JSON.stringify(message));
          }

          try {
            sendToReact({ type: 'info', message: 'Starting PDF viewer script' });
            
            // Create object element for PDF viewing
            const obj = document.createElement('object');
            obj.id = 'pdf-viewer';
            obj.type = 'application/pdf';
            obj.data = 'data:application/pdf;base64,${message.base64}';
            document.body.appendChild(obj);
            
            sendToReact({ type: 'info', message: 'PDF viewer object created and appended' });
            
            // Add load event listener
            obj.addEventListener('load', function() {
              sendToReact({ type: 'info', message: 'PDF loaded in object element' });
            });
            
            // Add error event listener
            obj.addEventListener('error', function(error) {
              sendToReact({ type: 'error', message: 'Object error: ' + error.message });
            });
            
          } catch (error) {
            sendToReact({ type: 'error', message: 'Error in PDF viewer script: ' + error.message });
          }
        </script>
      </body>
    </html>
  `;

  if (message.type === 'file') {
    const isPDF = message.fileType === 'application/pdf';
    const isImage = message.fileType?.includes('image');
    
    console.log('File detected:', message.fileName);
    console.log('Is PDF:', isPDF);
    console.log('Is Image:', isImage);
    
    return (
      <View style={[styles.messageContainer, isOwnMessage ? styles.ownMessage : styles.otherMessage]}>
        <TouchableOpacity onPress={() => {
          console.log('File clicked:', message.fileName);
          onFileClick(message);
        }} style={styles.fileContainer}>
          {isPDF && message.base64 && (
            <View style={styles.previewContainer}>
              {isEmulator ? (
                <View style={[styles.preview, { justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.overlayLight }]}>
                  <Text style={{ color: COLORS.white }}>
                    Prévisualisation PDF non disponible sur l'émulateur
                  </Text>
                </View>
              ) : (
                <WebView
                  source={{
                    html: `
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
                          <style>
                            body, html {
                              margin: 0;
                              padding: 0;
                              width: 100%;
                              height: 100%;
                              overflow: hidden;
                              background-color: #f0f0f0;
                            }
                            #pdf-viewer {
                              width: 100%;
                              height: 100%;
                              border: none;
                            }
                          </style>
                        </head>
                        <body>
                          <object
                            id="pdf-viewer"
                            type="application/pdf"
                            data="data:application/pdf;base64,${message.base64}"
                            width="100%"
                            height="100%"
                          >
                          </object>
                        </body>
                      </html>
                    `
                  }}
                  style={styles.preview}
                  originWhitelist={['*']}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  allowFileAccess={true}
                  allowUniversalAccessFromFileURLs={true}
                  allowFileAccessFromFileURLs={true}
                />
              )}
              <View style={styles.fileHeader}>
                <Ionicons 
                  name="document-outline" 
                  size={25} 
                  color={COLORS.white} 
                />
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

  console.log('Rendering text message:', message.text);

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
    width: '100%',
    height: 200,
    borderRadius: SIZES.borderRadius.small,
    overflow: 'hidden',
    backgroundColor: COLORS.overlayLight,
  },
  preview: {
    width: '100%',
    height: '100%',
  }
});