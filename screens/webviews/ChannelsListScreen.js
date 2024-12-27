import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import Header from '../../components/Header';
import Button from '../../components/buttons/Button';
import { useDeviceType } from '../../hooks/useDeviceType'; 
import { COLORS, SIZES } from '../../constants/style';

export default function ChannelsListScreen({ channels, selectedChannels, onBack, onBackPress }) {
  const [localSelectedChannels, setLocalSelectedChannels] = useState([]);
  const [availableChannels, setAvailableChannels] = useState([]);
  const { isTablet, isPortrait, isSmartphone, isSmartphonePortrait } = useDeviceType();

  useEffect(() => {
    const filteredChannels = channels.filter(newChannel => 
      !selectedChannels?.some(existingChannel => 
        existingChannel.href === newChannel.href
      )
    );
    setAvailableChannels(filteredChannels);
  }, [channels, selectedChannels]);

  const toggleChannelSelection = (channel) => {
    setLocalSelectedChannels(prevSelected => {
      if (prevSelected.some(c => c.href === channel.href)) {
        return prevSelected.filter(c => c.href !== channel.href);
      } else {
        return [...prevSelected, channel];
      }
    });
  };

  const handleImportChannels = () => {
    if (localSelectedChannels.length > 0) {
      onBack(localSelectedChannels);
    }
  };

  return (
    <View style={[styles.pageContainer, isSmartphone && styles.containerSmartphone]}>
      <Header 
        title="IMPORT CHANNELS"
        onBackPress={onBackPress}
        showIcons={false}
      />
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
      <View style={styles.buttonContainer}>
        <Button 
          title="Import channels" 
          backgroundColor={COLORS.orange} 
          color="white" 
          width={isTablet ? (isPortrait ? "20%" : "13%") : (isPortrait ? "35%" : "18%")}
          onPress={handleImportChannels} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    paddingTop: 30,
    paddingHorizontal: 30,
  },
  containerSmartphone: {
    paddingHorizontal: 5,
    paddingTop: 15,
  },
  channelContainer: {
    flexDirection: 'row',
    paddingVertical: 10,
    marginTop: 15,
    marginHorizontal: 30,
    backgroundColor: COLORS.darkGray,
    borderRadius: 10,
    padding: 10,
  },
  channelContainerSmartphonePortrait: {
    marginHorizontal: 5,
    marginTop: 20,
  },
  channelTitle: {
    fontSize: SIZES.fonts.large,
    textAlign: 'left',
    marginLeft: 10,
    color: COLORS.gray,
  },
  channelTitleSmartphone: {
    fontSize: SIZES.fonts.medium,
  },
  checkbox: {
    fontSize: SIZES.fonts.large,
    color: COLORS.gray,
  },
  checkboxSelected: {
    color: COLORS.orange,
  },
  buttonContainer: {
    bottom: 30,
    alignItems: 'center',
  }
});