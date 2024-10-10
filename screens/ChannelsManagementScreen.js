import React from 'react';
import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Header from '../components/Header';
import ImportChannelDialog from '../components/modals/ImportChannelDialog';

export default function ChannelsManagementScreen() {
  const [isImportModalVisible, setImportModalVisible] = useState(false);

  const openImportModal = () => {
    setImportModalVisible(true);
  };
  const closeImportModal = () => {
    setImportModalVisible(false);
  };
  return (
    <View style={styles.container}>
      <Header 
        title="CHANNELS MANAGEMENT" 
        onDialogPress={openImportModal}
        showIcons={true} />
        <ImportChannelDialog 
        visible={isImportModalVisible} 
        onClose={closeImportModal} 
      />
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