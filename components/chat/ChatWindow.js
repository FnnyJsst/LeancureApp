import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, SIZES } from '../../assets/styles/constants';
import { Ionicons } from '@expo/vector-icons';
import Separator from '../Separator';
import InputChatWindow from '../inputs/InputChatWindow';
import ChatMessage from './ChatMessage';

export default function ChatWindow({ channel, toggleMenu, onInputFocusChange }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      username: "John Doe",
      text: "Bonjour, comment ça va ?",
      timestamp: "10:30",
      isOwnMessage: false
    },
    {
      id: 2,
      username: "Moi",
      text: "Très bien, merci !",
      timestamp: "10:31",
      isOwnMessage: true
    }
  ]);

  const sendMessage = (text) => {
    const newMessage = {
      id: messages.length + 1,
      username: "Moi",
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwnMessage: true
    };
    setMessages([...messages, newMessage]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
          <Ionicons name="menu" size={30} color={COLORS.lightGray} />
        </TouchableOpacity>
        {channel && (
          <View style={styles.channelNameContainer}>
            <Text style={styles.channelName}>{channel}</Text>
          </View>
        )}
      </View>
      <Separator width="100%" marginTop={0} marginBottom={0} />
      <ScrollView style={styles.chatContainer}>
        {channel ? (
          messages.map(message => (
            <ChatMessage 
              key={message.id}
              message={message}
              isOwnMessage={message.isOwnMessage}
            />
          ))
        ) : (
          <View style={styles.noChannelContainer}>
            <Text style={styles.noChannelText}>Select a channel to start chatting</Text>
          </View>
        )}
      </ScrollView>
      {channel && <InputChatWindow 
       onSendMessage={sendMessage} 
       onFocusChange={onInputFocusChange}
     />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darkGray,
    marginTop: -28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  menuButton: {
    padding: 10,
  },
  channelNameContainer: {
    marginLeft: 20,
  },
  channelName: {
    fontSize: SIZES.fonts.large,
    color: COLORS.lightGray,
  },
  chatContainer: {
    flex: 1,
    padding: 20,
    marginBottom: 10,
  },
  placeholder: {
    color: COLORS.gray,
    fontSize: SIZES.fonts.medium,
    textAlign: 'center',
  },
  noChannelContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  noChannelText: {
    color: COLORS.gray,
    fontSize: SIZES.fonts.medium,
  },
});