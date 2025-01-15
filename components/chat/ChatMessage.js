import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { COLORS, SIZES } from "../../constants/style";
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useDeviceType } from '../../hooks/useDeviceType';

// ChatMessage is used in the ChatScreen to display the messages
export default function ChatMessage({ message, isOwnMessage, onFileClick }) {

  // Customized hook to determine the device type and orientation
  const { isSmartphone } = useDeviceType();

  const PDF_PREVIEW_HTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <!-- We set the viewport to the device width and initial scale to 1.0 -->
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <!-- We load the PDF.js library -->
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.min.js"></script>
        <!-- We set the styles for the PDF preview -->

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
        <!-- We create a div to display the PDF preview -->
        <div id="viewer"></div>

        <!-- We load the PDF.js library -->
        <script>
          // We decode the base64 encoded PDF data
          const pdfData = atob('${message.base64}');
          const pdfBytes = new Uint8Array(pdfData.length);
          for (let i = 0; i < pdfData.length; i++) {
            pdfBytes[i] = pdfData.charCodeAt(i);
          }

          // We get the PDF document and display the first page
          pdfjsLib.getDocument({data: pdfBytes}).promise.then(function(pdf) {
            pdf.getPage(1).then(function(page) {
              const canvas = document.createElement('canvas');
              const container = document.getElementById('viewer');
              container.appendChild(canvas);
              
              // We get the viewport of the page and set the canvas width and height
              const viewport = page.getViewport({scale: ${isSmartphone ? 2.0 : 2.5}});
              canvas.width = viewport.width;
              canvas.height = viewport.height;
              
              // We render the page on the canvas
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

  // If the message contains a file or image, we display it
  if (message.type === 'file') {
    const isPDF = message.fileType === 'application/pdf';
    const isImage = message.fileType?.includes('image');
    
    return (
      // We define different styles for the message depending on if it's an own message or not
      <View style={[styles.messageContainer, isOwnMessage ? styles.ownMessage : styles.otherMessage]}>
        <TouchableOpacity onPress={() => onFileClick(message)} style={styles.fileContainer}>
          {/* If the message is a PDF, we display the PDF preview */}
          {isPDF && message.base64 && (
            <View style={styles.previewContainer}>
              {/* We display the PDF preview using the WebView component */}
              <WebView
                source={{
                  html: PDF_PREVIEW_HTML
                }}
                style={styles.preview}
                // We allow the WebView to load any origin
                originWhitelist={['*']}
                // We enable JavaScript in the WebView
                javaScriptEnabled={true}
              />
              {/* We display the file header with the file icon and the file info */}
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

          {/* If the message is an image, we display the image preview */}
          {isImage && message.base64 && (
            <View style={styles.previewContainer}>
              {/* We display the image preview using the Image component */}
              <Image 
                source={{ uri: `data:${message.fileType};base64,${message.base64}` }}
                style={styles.preview}
                resizeMode="cover"
              />
              {/* We display the file header with the file icon and the file info */}
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