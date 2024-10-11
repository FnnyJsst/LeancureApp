import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import Header from '../components/Header';

const ChannelsListScreen = ({ channels, onBack }) => {
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

  const handleImportChannels = () => {
    console.log('Selected Channels:', selectedChannels); // Log pour vérifier les chaînes sélectionnées
    onBack(selectedChannels);
  };

  return (
    <View style={styles.container}>
      <Header 
        title="IMPORT CHANNELS"
        showIcons={false}
      />
      <FlatList
        data={channels}
        keyExtractor={(item) => item.href}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.channelContainer}
            onPress={() => toggleChannelSelection(item)}
          >
            <Text style={styles.checkbox}>
              {selectedChannels.includes(item) ? '☑' : '☐'}
            </Text>
            <Text style={styles.channelTitle}>{item.title}</Text>
          </TouchableOpacity>
        )}
      />
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.closeButton} onPress={handleImportChannels}>
          <Text style={styles.closeButtonText}>IMPORT CHANNELS</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  channelContainer: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginTop: 10,
    marginHorizontal: 30,
  },
  channelTitle: {
    fontSize: 18,
    textAlign: 'left',
    marginLeft: 10,
  },
  checkbox: {
    fontSize: 18,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  closeButton: {
    width: '15%',
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