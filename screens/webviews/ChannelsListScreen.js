import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import Header from '../../components/Header';
import { useDeviceType } from '../../hooks/useDeviceType'; 
import { COLORS, SIZES } from '../../constants/style';
import Button from '../../components/buttons/Button';
import CheckBox from '../../components/inputs/CheckBox';
import { Ionicons } from '@expo/vector-icons';

// This screen displays the list of channels available for the user to import
export default function ChannelsListScreen({ channels, selectedChannels, onBack, onBackPress }) {

  // Customized hook to determine the device type and orientation
  const { isSmartphone, isSmartphonePortrait, isLandscape } = useDeviceType();

  // States related to the channels list
  const [localSelectedChannels, setLocalSelectedChannels] = useState([]);
  const [availableChannels, setAvailableChannels] = useState([]);

  //useEffect to filter the channels that are not already selected to display them in the list
  useEffect(() => {
    // Filter the channels that are not already selected
    const filteredChannels = channels.filter(newChannel => 
      // Check if the channel is not already selected
      !selectedChannels?.some(existingChannel => 
        // Check if the channel href is the same as the existing channel href
        existingChannel.href === newChannel.href
      )
    );

    // Set the available channels
    setAvailableChannels(filteredChannels);
  }, [channels, selectedChannels]);

  // Function to toggle the channel selection
  const toggleChannelSelection = (channel) => {
    // Set the local selected channels
    setLocalSelectedChannels(prevSelected => {
      // Check if the channel is already selected
      if (prevSelected.some(c => c.href === channel.href)) {
        // If the channel is already selected, remove it from the list
        return prevSelected.filter(c => c.href !== channel.href);
      } else {
        // If the channel is not selected, add it to the list
        return [...prevSelected, channel];
      }
    });
  };

  // Function to handle the import of the channels
  const handleImportChannels = () => {
    // Check if the local selected channels are not empty
    if (localSelectedChannels.length > 0) {
      // Call the onBack function with the local selected channels
      onBack(localSelectedChannels);
    }
  };

  return (
    <View style={styles.pageContainer}>
      <View style={styles.customHeaderContainer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={onBackPress}
        >
          <Ionicons 
            name="chevron-back" 
            size={isSmartphone ? 24 : 28} 
            color={COLORS.white} 
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Import channels</Text>
      </View>
      <View style={[styles.listContainer, isLandscape && styles.listContainerLandscape]}>
        <FlatList
          data={availableChannels}
          keyExtractor={(item) => item.href}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.channelContainer,
                isSmartphonePortrait && styles.channelContainerSmartphonePortrait,
              ]}
              onPress={() => toggleChannelSelection(item)}
            >
              <CheckBox
                checked={localSelectedChannels.some(c => c.href === item.href)}
                onPress={() => toggleChannelSelection(item)}
                label={item.title}
                labelStyle={[styles.channelTitle, isSmartphone && styles.channelTitleSmartphone]}
              />
            </TouchableOpacity>
          )}
        />
      </View>
      <View style={styles.buttonContainer}>
        <Button 
          title="Import channels"
          variant="large"
          backgroundColor={COLORS.orange}
          color={COLORS.white}
          onPress={handleImportChannels}
          width="90%"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
  },
  channelContainer: {
    flexDirection: 'row',
    marginHorizontal: 30,
    borderRadius: SIZES.borderRadius.large,
    padding: 10,
  },
  channelContainerSmartphonePortrait: {
    marginHorizontal: 5,
  },
  channelTitle: {
    fontSize: SIZES.fonts.subtitleTablet,
    textAlign: 'left',
    marginLeft: 10,
    color: COLORS.white,
  },
  channelTitleSmartphone: {
    fontSize: 16,
  },
  listContainer: {
    flex: 1,
    padding: 30,
  },
  listContainerLandscape: {
    paddingHorizontal: 50,
  },
  buttonContainer: {
    bottom: 30,
    alignItems: 'center',
  },
  customHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#271E1E',
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: SIZES.fonts.subtitleTablet,
    fontWeight: SIZES.fontWeight.bold,
  },
});