import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useDeviceType } from '../../hooks/useDeviceType';
import { COLORS, SIZES } from '../../constants/style';
import Button from '../../components/buttons/Button';
import CheckBox from '../../components/inputs/CheckBox';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../components/text/CustomText';
import { useTranslation } from 'react-i18next';

/**
 * @component WebviewsListScreen
 * @description This screen displays the list of channels available for the user to import
 * @param {Array} channels - The list of channels
 * @param {Array} selectedWebviews - The list of selected channels
 * @param {Function} onBack - A function to navigate to a screen
 * @param {Function} onBackPress - A function to navigate to a screen
 */
export default function WebviewsListScreen({ channels, selectedWebviews, onBack, onBackPress }) {

  const { t } = useTranslation();
  // Customized hook to determine the device type and orientation
  const { isSmartphone, isSmartphonePortrait, isLandscape, isSmartphoneLandscape } = useDeviceType();

  // States related to the channels list
  const [localSelectedChannels, setLocalSelectedChannels] = useState([]);
  const [availableChannels, setAvailableChannels] = useState([]);

  /**
   * @function useEffect
   * @description Filters the channels that are not already selected to display them in the list
   */
  useEffect(() => {
    // Filter the channels that are not already selected
    const filteredChannels = channels.filter(newChannel =>
      // Check if the channel is not already selected
      !selectedWebviews?.some(existingChannel =>
        // Check if the channel href is the same as the existing channel href
        existingChannel.href === newChannel.href
      )
    );

    // Set the available channels
    setAvailableChannels(filteredChannels);
  }, [channels, selectedWebviews]);

  /**
   * @function toggleChannelSelection
   * @description Toggles the channel selection
   * @param {Object} channel - The channel to toggle
   */
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

  /**
   * @function handleImportWebviews
   * @description Handles the import of the channels
   */
  const handleImportWebviews = () => {
    if (localSelectedChannels.length > 0) {
      onBack(localSelectedChannels);
      // Add a small delay to ensure the webviews are well imported
      setTimeout(() => {
        onBackPress();  // To redirect to WebviewsManagementScreen
      }, 100);
    }
  };

  return (
    <View style={styles.pageContainer}>
      <View style={[styles.customHeaderContainer, isSmartphoneLandscape && styles.customHeaderContainerSmartphoneLandscape]}>
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
        <Text style={styles.headerTitle}>{t('buttons.importChannels')}</Text>
      </View>
      <View style={[styles.listContainer, isLandscape && styles.listContainerLandscape, isSmartphone && styles.listContainerSmartphone]}>
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
          onPress={handleImportWebviews}
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
    fontSize: SIZES.fonts.biggerTextSmartphone,
  },
  listContainer: {
    flex: 1,
    padding: 30,
  },
  listContainerLandscape: {
    paddingHorizontal: 50,
  },
  listContainerSmartphone: {
    paddingTop: 0,
  },
  buttonContainer: {
    bottom: 30,
    alignItems: 'center',
  },
  customHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginBottom: 20,
  },
  customHeaderContainerSmartphoneLandscape: {
    marginBottom: 0,
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
    fontWeight: SIZES.fontWeight.semibold,
  },
});
