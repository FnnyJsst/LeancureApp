import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS, SIZES } from '../../assets/styles/constants';
import ChatHeader from './ChatHeader';
import Separator from '../Separator';

export default function ChatWindow({ channel }) {
  return (
    <View style={styles.container}>
      <ChatHeader />
      {channel && (
        <>
          <View style={styles.header}>
            <View style={styles.channelNameContainer}>
              <Separator width="110%" marginTop={0} marginBottom={0} /> 
              <Text style={styles.channelName}>{channel}</Text>
            </View>
          </View>
          <Separator width="100%" marginTop={0} marginBottom={0} />
        </>
      )}
      <ScrollView style={styles.chatContainer}>
        {channel ? (
          <Text style={styles.placeholder}>Messages will appear here</Text>
        ) : (
          <View style={styles.noChannelContainer}>
            <Text style={styles.noChannelText}>Select a channel to start chatting</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darkGray,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  channelNameContainer: {
    gap: 15  ,
    marginTop: 10,
  },
  channelName: {
    fontSize: SIZES.fonts.large,
    color: COLORS.lightGray,
    marginLeft: 40, 
  },
  chatContainer: {
    flex: 1,
    padding: 20,
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