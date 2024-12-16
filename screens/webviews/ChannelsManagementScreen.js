import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Header from '../../components/Header';
import ImportChannelDialog from '../../components/modals/webviews/ImportChannelDialog';
import EditChannel from '../../components/modals/webviews/EditChannel'; 
import DeleteChannel from '../../components/modals/webviews/DeleteChannel';
import AntDesign from '@expo/vector-icons/AntDesign';
import EvilIcons from '@expo/vector-icons/EvilIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDeviceType } from '../../hooks/useDeviceType';
import { SIZES, COLORS } from '../../assets/styles/constants';

/**
 * Channel Management Screen Component
 * Allows displaying, editing, deleting and reordering channels
 **/
export default function ChannelsManagementScreen({ 
  onImport, 
  selectedChannels, 
  onBackPress, 
  onNavigateToWebView, 
  setSelectedChannels, 
  saveSelectedChannels,
  isReadOnly 
}) {
  const { isTablet, isSmartphone, isSmartphoneLandscape, isSmartphonePortrait } = useDeviceType();

  // States for modals and interractions management
  const [isImportModalVisible, setImportModalVisible] = useState(false);
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const [channelToEdit, setChannelToEdit] = useState(null);
  const [channelToDelete, setChannelToDelete] = useState(null);

  // States for the colors of the interractions
  const [selectedTitleId, setSelectedTitleId] = useState(null);
  const [selectedPencilIndex, setSelectedPencilIndex] = useState(null);
  const [selectedBinIndex, setSelectedBinIndex] = useState(null);
  const [selectedUpIndex, setSelectedUpIndex] = useState(null);
  const [selectedDownIndex, setSelectedDownIndex] = useState(null);
  

  /////MODAL HANDLERS/////
  // Open and close the import modal    
  const openImportModal = () => setImportModalVisible(true);
  const closeImportModal = () => setImportModalVisible(false);

  // Open and close the edit modal
  const openEditModal = (channel) => {
    setChannelToEdit(channel);
    setEditModalVisible(true);
  };
  const closeEditModal = () => {
    setEditModalVisible(false);
    setChannelToEdit(null);
  };

  // Open and close the delete modal
  const openDeleteModal = (channel) => {
    setChannelToDelete(channel);
    setDeleteModalVisible(true);
  };
  const closeDeleteModal = () => setDeleteModalVisible(false);

  /////CHANNEL OPERATIONS/////
  // Delete a channel from the list
  const handleDeleteChannel = (channelToDelete) => {
    if (channelToDelete) {
      const updatedChannels = selectedChannels.filter(
        channel => channel.href !== channelToDelete.href
      );
      setSelectedChannels(updatedChannels);
      saveSelectedChannels(updatedChannels);
      closeDeleteModal();

      // Save the updated channels in AsyncStorage
      try {
        AsyncStorage.setItem('selectedChannels', JSON.stringify(updatedChannels));
      } catch (error) {
        console.error('Failed to save channels after deletion', error);
      }
    }
  };

  // Move a channel up
  const moveChannelUp = (index) => {
    if (index > 0) {
      const updatedChannels = [...selectedChannels];
      const temp = updatedChannels[index - 1];
      updatedChannels[index - 1] = updatedChannels[index];
      updatedChannels[index] = temp;
      setSelectedChannels(updatedChannels);
      saveSelectedChannels(updatedChannels);
    }
  };

  // Move a channel down
  const moveChannelDown = (index) => {
    if (index < selectedChannels.length - 1) {
      const updatedChannels = [...selectedChannels];
      const temp = updatedChannels[index + 1];
      updatedChannels[index + 1] = updatedChannels[index];
      updatedChannels[index] = temp;
      setSelectedChannels(updatedChannels);
      saveSelectedChannels(updatedChannels);
    }
  };

  // Edit a channel
  const handleEditChannel = async (oldChannel, newUrl, newTitle) => {
    const updatedChannels = selectedChannels.map(channel => {
      if (channel.href === oldChannel.href) {
        return { ...channel, href: newUrl, title: newTitle };
      }
      return channel;
    });
    
    setSelectedChannels(updatedChannels);
    await saveSelectedChannels(updatedChannels);
  };

return (
  <View style={styles.pageContainer}>
    <Header
      title="CHANNELS MANAGEMENT"
      onDialogPress={!isReadOnly ? openImportModal : null}
      onBackPress={onBackPress}
      showIcons={!isReadOnly}
    />
    <ImportChannelDialog
      visible={isImportModalVisible}
      onClose={closeImportModal}
      onImport={onImport}
    />
    <EditChannel
      visible={isEditModalVisible}
      onClose={closeEditModal}
      initialUrl={channelToEdit?.href}
      initialTitle={channelToEdit?.title}
      onSave={(newUrl, newTitle) => handleEditChannel(channelToEdit, newUrl, newTitle)}
    />
    <DeleteChannel
      visible={isDeleteModalVisible}
      onClose={closeDeleteModal}
      handleDelete={() => handleDeleteChannel(channelToDelete)}
    />
    <ScrollView>
      <View style={styles.channelsContainer}>
        {selectedChannels && selectedChannels.map((channel, index) => (
          <View 
            style={[
              styles.channelContainer,
              isSmartphone && styles.channelContainerSmartphone
            ]} 
            key={channel.href}
          >
            <TouchableOpacity
              style={[
                styles.titleContainer,
                isSmartphone && styles.titleContainerSmartphone
              ]}
              onPress={() => onNavigateToWebView(channel.href)}
              onPressIn={() => setSelectedTitleId(channel.href)}
              onPressOut={() => setSelectedTitleId(null)}
            >
              <Text 
                style={[
                  styles.text,
                  isSmartphone && styles.textSmartphone,
                  selectedTitleId === channel.href && styles.textSelected
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {channel.title}
              </Text>
            </TouchableOpacity>
            
            {!isReadOnly && (
              <View style={[
                styles.controlsContainer,
                isSmartphone && styles.controlsContainerSmartphone
              ]}>
                <View style={[
                  styles.arrowContainer,
                  isSmartphone && styles.arrowContainerSmartphone
                ]}>
                <TouchableOpacity
                onPress={() => moveChannelUp(index)}
                onPressIn={() => setSelectedUpIndex(index)}
                onPressOut={() => setSelectedUpIndex(null)}
                style={styles.arrowButton}
              >
                <AntDesign 
                  name="up" 
                  size={isTablet ? 30 : 23} 
                  style={[
                    { marginRight: isSmartphonePortrait ? 0 : 15 }, 
                    { color: selectedUpIndex === index ? COLORS.orange : COLORS.lightGray }
                  ]} 
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => moveChannelDown(index)}
                onPressIn={() => setSelectedDownIndex(index)}
                onPressOut={() => setSelectedDownIndex(null)}
                style={styles.arrowButton}
              >
                <AntDesign 
                  name="down" 
                  size={isTablet ? 30 : 23} 
                  style={[
                    { marginLeft: isSmartphonePortrait ? 0 : 15 },
                    { marginRight: isSmartphonePortrait ? 0 : 15 },
                    { color: selectedDownIndex === index ? COLORS.orange : COLORS.lightGray }
                  ]} 
                />
              </TouchableOpacity>
                </View>
                
                <View style={[
                  styles.iconsContainer,
                  isSmartphone && styles.iconsContainerSmartphone
                ]}>
                <TouchableOpacity
                  onPress={() => openEditModal(channel)}
                  onPressIn={() => setSelectedPencilIndex(index)}
                  onPressOut={() => setSelectedPencilIndex(null)}
                  style={styles.iconButton}
                >
                  <EvilIcons 
                    name="pencil" 
                    size={isTablet ? 40 : 29} 
                    style={[
                      { marginRight: isSmartphonePortrait ? 0 : 15 }, 
                      { color: isTablet && selectedPencilIndex === index ? COLORS.orange : COLORS.lightGray }
                    ]} 
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => openDeleteModal(channel)}
                  onPressIn={() => setSelectedBinIndex(index)}
                  onPressOut={() => setSelectedBinIndex(null)}
                  style={styles.iconButton}
                >
                  <Ionicons 
                    name="trash-outline" 
                    size={isTablet ? 30 : 23} 
                    style={{ color: selectedBinIndex === index ? COLORS.orange : COLORS.lightGray }} 
                  />
                </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  </View>
);
}

const styles = StyleSheet.create({
  pageContainer: {
    paddingTop: '3%',
    paddingHorizontal: '3%',
  },
  channelsContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  channelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 15,
    backgroundColor: COLORS.darkGray,
    height: 75,
    width: '95%',
    borderRadius: 12,
  },
  channelContainerSmartphone: {
    width: '100%',
    height: 65,
    marginVertical: 10,
  },
  titleContainer: {
    flex: 0.85,
    paddingLeft: 50,
  },
  titleContainerSmartphone: {
    paddingLeft: 15,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: '2%',
  },
  controlsContainerSmartphone: {
    flex: 0.55,
    paddingRight: 5,
    justifyContent: 'flex-end',
  },
  arrowContainer: {
    flexDirection: 'row',
    marginRight: 30,
  },
  arrowContainerSmartphone: {
    marginRight: 5,
  },
  arrowButton: {
    padding: 5,
  },
  iconsContainer: {
    flexDirection: 'row',
    marginRight: 10,
  },
  iconsContainerSmartphone: {
    marginRight: 0,
  },
  iconButton: {
    padding: 5,
  },
  text: {
    color: COLORS.lightGray,
    fontSize: SIZES.fonts.large,
  },
  textSmartphone: {
    fontSize: SIZES.fonts.small,
  },
  textSelected: {
    color: COLORS.orange,
  },
});