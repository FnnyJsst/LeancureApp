import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import Header from '../../components/Header';
import { useDeviceType } from '../../hooks/useDeviceType'; 
import { COLORS, SIZES } from '../../constants/style';
import Button from '../../components/buttons/Button';

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
      <Header 
        onBackPress={onBackPress}
        showIcons={false}
      />
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
              <Text style={[
                styles.checkbox,
                isSmartphone && styles.checkboxSmartphone,
                localSelectedChannels.some(c => c.href === item.href) && styles.checkboxSelected
              ]}>
                {localSelectedChannels.some(c => c.href === item.href) ? '☑' : '☐'}
              </Text>
              <Text style={[styles.channelTitle, isSmartphone && styles.channelTitleSmartphone]}>
                {item.title}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
      <View style={styles.buttonContainer}>
        <Button 
          title="Import channels"
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
    marginTop: 15,
    marginHorizontal: 30,
    borderRadius: SIZES.borderRadius.large,
    padding: 10,
  },
  channelContainerSmartphonePortrait: {
    marginHorizontal: 5,
    marginTop: 20,
  },
  channelTitle: {
    fontSize: SIZES.fonts.subtitleTablet,
    textAlign: 'left',
    marginLeft: 10,
    color: COLORS.white,
  },
  channelTitleSmartphone: {
    fontSize: SIZES.fonts.subtitleSmartphone,
  },
  checkbox: {
    fontSize: SIZES.fonts.subtitleTablet,
    color: COLORS.white,
  },
  checkboxSmartphone: {
    fontSize: SIZES.fonts.subtitleSmartphone,
  },
  checkboxSelected: {
    color: COLORS.orange,
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
  }
});