import { useState } from 'react';
import { StyleSheet, ActivityIndicator } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useFonts } from 'expo-font';
import ChannelsImport from '../modals/ChannelsImport';
import AddChannels from '../modals/AddChannels';
import Header from '../Header'; 

export default function DrawerContent(props) {
  const [isImportModalVisible, setImportModalVisible] = useState(false);
  const [isAddModalVisible, setAddModalVisible] = useState(false);

  // Fonts
  const [fontsLoaded, error] = useFonts({
    'Montserrat': require('../../assets/fonts/Montserrat-Regular.ttf'),
    'Montserrat-medium': require('../../assets/fonts/Montserrat-Medium.ttf'),
  });

  // Functions to open and close both modal windows
  const openImportModal = () => {
    setImportModalVisible(true);
  };
  const closeImportModal = () => {
    setImportModalVisible(false);
  };

  const openAddModal = () => {
    setAddModalVisible(true);
  };
  const closeAddModal = () => {
    setAddModalVisible(false);
  };

  // If the fonts are not loaded, show an activity indicator
  if (!fontsLoaded) {
    return <ActivityIndicator size="small" color="#ff4500" />; 
  }

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContent}>
      <Header 
        title="CHANNELS MANAGEMENT" 
        onBackPress={() => props.navigation.closeDrawer()} 
        onImportPress={openImportModal} 
        onAddPress={openAddModal} 
        showIcons={true} 
      />
      <DrawerItemList {...props} />
      <ChannelsImport visible={isImportModalVisible} onClose={closeImportModal} />
      <AddChannels visible={isAddModalVisible} onClose={closeAddModal} />
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  drawerContent: {
    paddingTop: 25,
  },
});