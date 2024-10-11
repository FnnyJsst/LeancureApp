import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Header from '../components/Header';
import ImportChannelDialog from '../components/modals/ImportChannelDialog';

export default function ChannelsManagementScreen({ onImport, selectedChannels }) {
  const [isImportModalVisible, setImportModalVisible] = useState(false);

  const openImportModal = () => {
    setImportModalVisible(true);
  };

  const closeImportModal = () => {
    setImportModalVisible(false);
  };

  console.log('Received selected channels:', selectedChannels); // Log pour vérifier les chaînes reçues

  return (
    <View style={styles.container}>
      <Header 
        title="CHANNELS MANAGEMENT" 
        onDialogPress={openImportModal}
        showIcons={true} 
      />
      <ImportChannelDialog 
        visible={isImportModalVisible} 
        onClose={closeImportModal} 
        onImport={onImport}
      />
      <View>
        {selectedChannels && selectedChannels.map((channel, index) => (
          <Text key={index} style={styles.text}>{channel.title}</Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 25,
  },
  text: {
    fontSize: 20,
    color: 'black',
  },
});