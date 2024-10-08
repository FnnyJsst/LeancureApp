import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';

const ChannelsListScreen = ({ route, navigation }) => {
  const { channels } = route.params;
  const [selectedChannels, setSelectedChannels] = useState([]);

  const toggleChannelSelection = (channel) => {
    setSelectedChannels((prevSelected) => {
      if (prevSelected.includes(channel)) {
        return prevSelected.filter((c) => c !== channel);
      } else {
        return [...prevSelected, channel];
      }
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Channels</Text>
      <FlatList
        data={channels}
        keyExtractor={(item) => item.href}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.channelContainer}
            onPress={() => toggleChannelSelection(item)}
          >
            <Text style={styles.channelTitle}>{item.title}</Text>
            <Text style={styles.checkbox}>
              {selectedChannels.includes(item) ? '☑' : '☐'}
            </Text>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  channelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  channelTitle: {
    fontSize: 18,
  },
  checkbox: {
    fontSize: 18,
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#FF4500',
    borderRadius: 5,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default ChannelsListScreen;