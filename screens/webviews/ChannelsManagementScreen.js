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
import { SIZES, COLORS } from '../../constants/style';
import { SCREENS } from '../../constants/screens';
import Entypo from '@expo/vector-icons/Entypo';

/** 
 * @component ChannelsManagementScreen
 * @description Allows displaying, editing, deleting and reordering channels
 * @param {Function} onNavigate - A function to navigate to a screen
 * @param {Array} selectedChannels - The list of selected channels
 * @param {Function} setSelectedChannels - A function to set the selected channels
 * @param {Function} saveSelectedChannels - A function to save the selected channels
 * @param {boolean} isReadOnly - A boolean to indicate if the user is read only
 * @param {Function} onNavigateToWebView - A function to navigate to a webview
 * @param {Function} onImport - A function to import channels
 * @returns {JSX.Element} - A JSX element
 * 
 * @example
 * <ChannelsManagementScreen onNavigate={(screen) => navigate(screen)} selectedChannels={selectedChannels} setSelectedChannels={setSelectedChannels} saveSelectedChannels={saveSelectedChannels} isReadOnly={isReadOnly} onNavigateToWebView={onNavigateToWebView} onImport={onImport} />
 */
export default function ChannelsManagementScreen({ 
  onNavigate,
  selectedChannels, 
  setSelectedChannels, 
  saveSelectedChannels,
  isReadOnly,
  onNavigateToWebView,
  onImport
}) {

  // Customized hook to determine the device type and orientation
  const { isTablet, isSmartphone, isSmartphonePortrait } = useDeviceType();

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
  /**
   * @function openImportModal
   * @description Opens the import modal
   */
  const openImportModal = () => setImportModalVisible(true);

  /**
   * @function closeImportModal
   * @description Closes the import modal
   */
  const closeImportModal = () => setImportModalVisible(false);

  /**
   * @function openEditModal
   * @description Opens the edit modal
   * @param {Object} channel - The channel to edit
   */
  const openEditModal = (channel) => {
    setChannelToEdit(channel);
    setEditModalVisible(true);
  };

  /**
   * @function closeEditModal
   * @description Closes the edit modal
   */
  const closeEditModal = () => {
    setEditModalVisible(false);
    setChannelToEdit(null);
  };

  /**
   * @function openDeleteModal
   * @description Opens the delete modal
   * @param {Object} channel - The channel to delete
   */
  const openDeleteModal = (channel) => {
    setChannelToDelete(channel);
    setDeleteModalVisible(true);
  };

  /**
   * @function closeDeleteModal
   * @description Closes the delete modal
   */
  const closeDeleteModal = () => setDeleteModalVisible(false);

  /////CHANNEL OPERATIONS/////
  /**
   * @function handleDeleteChannel
   * @description Deletes a channel from the list
   * @param {Object} channelToDelete - The channel to delete
   */
  const handleDeleteChannel = (channelToDelete) => {
    // Check if the channel to delete is not null
    if (channelToDelete) {
      // Filter the channels to remove the one to delete
      const updatedChannels = selectedChannels.filter(
        channel => channel.href !== channelToDelete.href
      );
      // Set the updated channels
      setSelectedChannels(updatedChannels);
      // Save the updated channels
      saveSelectedChannels(updatedChannels);
      // Close the delete modal
      closeDeleteModal();

      // Save the updated channels in AsyncStorage
      try {
        AsyncStorage.setItem('selectedChannels', JSON.stringify(updatedChannels));
      } catch (error) {
        console.error('Failed to save channels after deletion', error);
      }
    }
  };

  /**
   * @function moveChannelUp
   * @description Moves a channel up
   * @param {number} index - The index of the channel to move up
   */
  const moveChannelUp = (index) => {
    // Check if we are not at the first channel
    if (index > 0) {
      // Create a copy of the selected channels
      const updatedChannels = [...selectedChannels];
      // Swap the channel with the one above
      const temp = updatedChannels[index - 1];
      updatedChannels[index - 1] = updatedChannels[index];
      updatedChannels[index] = temp;
      // Set the updated channels
      setSelectedChannels(updatedChannels);
      saveSelectedChannels(updatedChannels);
    }
  };

  /**
   * @function moveChannelDown
   * @description Moves a channel down
   * @param {number} index - The index of the channel to move down
   */
  const moveChannelDown = (index) => {
    // Check if we are not at the last channel
    if (index < selectedChannels.length - 1) {
      // Create a copy of the selected channels
      const updatedChannels = [...selectedChannels];
      // Swap the channel with the one below
      const temp = updatedChannels[index + 1];
      updatedChannels[index + 1] = updatedChannels[index];
      updatedChannels[index] = temp;
      // Set the updated channels
      setSelectedChannels(updatedChannels);
      // Save the updated channels
      saveSelectedChannels(updatedChannels);
    }
  };

  /**
   * @function handleEditChannel
   * @description Edits a channel
   * @param {Object} oldChannel - The old channel
   * @param {string} newUrl - The new url
   * @param {string} newTitle - The new title
   */
  const handleEditChannel = async (oldChannel, newUrl, newTitle) => {
    // Create a copy of the selected channels
    const updatedChannels = selectedChannels.map(channel => {
      // Check if the channel href is the same as the old channel href
      if (channel.href === oldChannel.href) {
        return { ...channel, href: newUrl, title: newTitle };
      }
      return channel;
    });
    // Set the updated channels
    setSelectedChannels(updatedChannels);
    // Save the updated channels
    await saveSelectedChannels(updatedChannels);
  };

  return (
    <View style={styles.pageContainer}>
      <View style={styles.customHeaderContainer}>
        <TouchableOpacity 
          style={styles.iconBackground}
          onPress={() => onNavigate(SCREENS.SETTINGS)}
        >
          <Ionicons 
            name="chevron-back-outline" 
            size={isSmartphone ? 24 : 28} 
            color={COLORS.gray300} 
          />
        </TouchableOpacity>
        {!isReadOnly && (
          <TouchableOpacity 
            style={styles.iconBackground}
            onPress={openImportModal}
          >
            <Entypo 
              name="add-to-list"
              size={isSmartphone ? 24 : 28}
              color={COLORS.gray300}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {selectedChannels.length === 0 && (
        <Text style={[
          styles.addChannelText, 
          isSmartphone && styles.addChannelTextSmartphone
        ]}>
          Use the top right button to add a channel
        </Text>
      )}

      {/* Modal to import channels */}
      <ImportChannelDialog
        visible={isImportModalVisible}
        onClose={closeImportModal}
        onImport={onImport}
      />
      {/* Modal to edit a channel */}
      <EditChannel
        visible={isEditModalVisible}
        onClose={closeEditModal}
        initialUrl={channelToEdit?.href}
        initialTitle={channelToEdit?.title}
        onSave={(newUrl, newTitle) => handleEditChannel(channelToEdit, newUrl, newTitle)}
      />
      {/* Modal to delete a channel */}
      <DeleteChannel
        visible={isDeleteModalVisible}
        onClose={closeDeleteModal}
        handleDelete={() => handleDeleteChannel(channelToDelete)}
      />
      {/* List of channels */}
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
                // Navigate to the webview with the channel href
                onPress={() => onNavigateToWebView(channel.href)}
                // Set the selected title id
                onPressIn={() => setSelectedTitleId(channel.href)}
                // Reset the selected title id
                onPressOut={() => setSelectedTitleId(null)}
              >
                <Text 
                  style={[
                    styles.text,
                    isSmartphone && styles.textSmartphone,
                    selectedTitleId === channel.href && styles.textSelected
                  ]}
                  numberOfLines={1}
                  // Add an ellipsis at the end of the text if it is too long
                  ellipsizeMode="tail"
                >
                  {channel.title}
                </Text>
              </TouchableOpacity>
              
              {/* Check if the user is not read only */}
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
                      { color: selectedUpIndex === index ? COLORS.orange : COLORS.gray300 }
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
                      { color: selectedDownIndex === index ? COLORS.orange : COLORS.gray300 }
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
                        { color: isTablet && selectedPencilIndex === index ? COLORS.orange : COLORS.gray300 }
                      ]} 
                    />
                  </TouchableOpacity>
                  {/* Delete a channel */}
                  <TouchableOpacity
                    onPress={() => openDeleteModal(channel)}
                    onPressIn={() => setSelectedBinIndex(index)}
                    onPressOut={() => setSelectedBinIndex(null)}
                    style={styles.iconButton}
                  >
                    <Ionicons 
                      name="trash-outline" 
                      size={isTablet ? 30 : 23} 
                      style={{ color: selectedBinIndex === index ? COLORS.orange : COLORS.gray300 }} 
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
    paddingHorizontal: '3%',
  },
  headerContainer: {
    alignSelf: 'flex-start',
    marginBottom: 20,
    marginTop: 20,
    marginLeft: 30,
  },
  header: {
    color: COLORS.white,
    fontSize: SIZES.fonts.headerTablet,
    fontWeight: SIZES.fontWeight.bold,
  },
  headerSmartphone: {
    fontSize: SIZES.fonts.headerSmartphone,
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
    backgroundColor: COLORS.gray850,
    height: 75,
    width: '95%',
    borderRadius: SIZES.borderRadius.xLarge,
    borderWidth: 1,
    borderColor: COLORS.borderColor
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
    color: COLORS.gray300,
    fontSize: SIZES.fonts.textTablet,
  },
  textSmartphone: {
    fontSize: SIZES.fonts.textSmartphone,
  },
  addChannelText: {
    color: COLORS.gray300,
    fontSize: SIZES.fonts.textTablet,
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  addChannelTextSmartphone: {
    fontSize: 16,
  },
  textSelected: {
    color: COLORS.orange,
  },
  customHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginBottom: 5,
  },
  iconBackground: {
    backgroundColor: '#271E1E',
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});