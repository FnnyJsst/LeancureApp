import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, SIZES } from '../../assets/styles/constants';
import { Ionicons } from '@expo/vector-icons';
import Separator from '../Separator';
import InputChatWindow from '../inputs/InputChatWindow';

export default function ChatWindow({ channel, toggleMenu, isExpanded }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={toggleMenu}
          style={styles.menuButton}
        >
          <Ionicons 
            name="menu"
            size={30} 
            color={COLORS.lightGray} 
          />
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
          <>
            <Text style={styles.placeholder}>Messages will appear here</Text>
          </> 
        ) : (
          <View style={styles.noChannelContainer}>
            <Text style={styles.noChannelText}>Select a channel to start chatting</Text>
          </View>
        )}
      </ScrollView>
      { channel && <InputChatWindow /> }
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