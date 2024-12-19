import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, SIZES } from "../../assets/styles/constants";
import { Ionicons } from '@expo/vector-icons';

export default function ChatMessage({ message, isOwnMessage, onFileClick }) {

  if (message.type === 'file') {
    return (
      <View style={[styles.messageContainer, isOwnMessage ? styles.ownMessage : styles.otherMessage]}>
        <TouchableOpacity onPress={() => onFileClick(message.uri)}>
          <View style={styles.fileContent}>
            <Ionicons name="document-outline" size={24} color={COLORS.lightGray} />
            <Text style={styles.fileName}>{message.fileName}</Text>
            <Text style={styles.fileSize}>{message.fileSize}</Text>
          </View>
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
       <Text style={styles.username}>{message.username}</Text>
     )}
     <Text style={styles.messageText}>{message.text}</Text>
     <Text style={styles.timestamp}>{message.timestamp}</Text>
   </View>
 );
}

const styles = StyleSheet.create({
 messageContainer: {
   maxWidth: '80%',
   padding: 10,
   marginVertical: 5,
   borderRadius: SIZES.borderRadius.small,
 },
 ownMessage: {
   alignSelf: 'flex-end',
   backgroundColor: COLORS.orange,
 },
 otherMessage: {
   alignSelf: 'flex-start',
   backgroundColor: COLORS.buttonGray,
 },
 username: {
   color: COLORS.lightGray,
   fontSize: SIZES.fonts.small,
   marginBottom: 2,
 },
 messageText: {
   color: 'white',
   fontSize: SIZES.fonts.medium,
 },
 timestamp: {
   color: COLORS.lightGray,
   fontSize: SIZES.fonts.xSmall,
   alignSelf: 'flex-end',
   marginTop: 2,
 }
});
