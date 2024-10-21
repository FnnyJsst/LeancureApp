import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Header from '../components/Header';
import ImportChannelDialog from '../components/modals/ImportChannelDialog';
import AntDesign from '@expo/vector-icons/AntDesign';
import EvilIcons from '@expo/vector-icons/EvilIcons';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function ChannelsManagementScreen({ onImport, selectedChannels, onBackPress }) {
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
        onBackPress={onBackPress} // Ajoutez cette ligne
        showIcons={true} 
      />
      <ImportChannelDialog 
        visible={isImportModalVisible} 
        onClose={closeImportModal} 
        onImport={onImport}
      />
      <View style={styles.channelsContainer}>
        {selectedChannels && selectedChannels.map((channel, index) => (
          <View style={styles.channelContainer} key={channel.href}>
            <Text style={styles.text}>{channel.title}</Text>
            <View style={styles.arrowContainer}>
              <TouchableOpacity 
                // onPress={onMoveUp}
                onPressIn={() => setUpColor('#ff4500')}
                onPressOut={() => setUpColor('black')}
              >
                <AntDesign name="up" size={30} style={styles.up} />
              </TouchableOpacity>
              <TouchableOpacity 
                // onPress={onMoveDown}
                onPressIn={() => setDownColor('#ff4500')}
                onPressOut={() => setDownColor('black')}
              >
                <AntDesign name="down" size={30} />
              </TouchableOpacity>
            </View>
            <View style={styles.iconsContainer}>
              <TouchableOpacity 
                // onPress={onEdit}
                onPressIn={() => setPencilColor('#ff4500')}
                onPressOut={() => setPencilColor('black')}
              >
                <EvilIcons name="pencil" size={40} style={styles.pencil}/>
              </TouchableOpacity>
              <TouchableOpacity 
                // onPress={onDelete}
                onPressIn={() => setBinColor('#ff4500')}
                onPressOut={() => setBinColor('black')}
              >
                <Ionicons name="trash-outline" size={30} />
              </TouchableOpacity>
            </View>
          </View>
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
    width: '100%',
  },
  channelsContainer: {
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  channelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    backgroundColor: '#d9d9d9',
    height: 60,
    width: '95%',
    borderRadius: 5,
  },
  arrowContainer: {
    flexDirection: 'row',
    marginLeft: 'auto',
    marginRight: 100,
  },
  up: {
    marginRight: 25,
  },
  iconsContainer: {
    flexDirection: 'row',
    marginRight: 30,
  },
  pencil: {
    marginLeft: 10,
    marginRight: 25,
  },
  text: {
    fontSize: 20,
    color: 'black',
    marginVertical: 15,
    marginLeft: 50,
    fontSize: 18,
  },
});