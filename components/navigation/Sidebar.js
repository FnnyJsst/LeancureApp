import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, ScrollView, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDeviceType } from '../../hooks/useDeviceType';
import { COLORS, SIZES } from '../../constants/style';
import { fetchUserChannels } from '../../services/messageApi';

// GroupItem is a component that displays a group of channels
function GroupItem({ name, channels, onChannelSelect, isSelected, onGroupSelect }) {

  // Customized hook to determine the device type and orientation
  const { isSmartphone} = useDeviceType();

  // State management for the group expansion
  const [isGroupExpanded, setIsGroupExpanded] = useState(false);

  // When the user clicks on a channel, we select it
  const handleChannelSelect = (channel) => {
    // We send the channel name and the messages to the parent component
    onChannelSelect(channel.name, channel.messages || []);
  };

  return (
    <View style={styles.groupItem}>
      {/* When the user clicks on a group, we expand it */}
      <TouchableOpacity 
        style={[styles.groupHeader, isSelected && styles.selectedGroup]}
        onPress={() => {
          setIsGroupExpanded(!isGroupExpanded);
          onGroupSelect(name);
        }}
      >
        <Ionicons 
          name={isGroupExpanded ? 'chevron-down' : 'chevron-forward'} 
          size={20} 
          color={COLORS.gray300} 
        />
        <Text style={[styles.groupName, isSmartphone && styles.groupNameSmartphone]}>
          {name}
        </Text>
      </TouchableOpacity>
      
      {isGroupExpanded && channels && channels.length > 0 && (
        <View>
          {channels.map((channel) => (
            <TouchableOpacity 
              key={channel.id}
              style={styles.channelItem}
              onPress={() => handleChannelSelect(channel)}
            >
              <Text style={[styles.channelName, isSmartphone && styles.channelNameSmartphone]}>
                {channel.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

export default function Sidebar({ onChannelSelect, selectedGroup, onGroupSelect, isExpanded, toggleMenu }) {

  // State management for the channels  
  const [channels, setChannels] = useState({ publicChannels: [], privateGroups: [] });

  // Customized hook to determine the device type and orientation
  const { isSmartphone, isSmartphoneLandscape } = useDeviceType();
  
  // Animation for the sidebar
  const slideAnim = useRef(new Animated.Value(
    // We slide the sidebar to the left
    isSmartphone ? (isSmartphoneLandscape ? -300 : -500) : -300
  )).current;

  // Animation for the overlay
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // When the sidebar is expanded, we slide it to the left
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: isExpanded ? 0 : (isSmartphone ? -500 : -300),
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(fadeAnim, {
        toValue: isExpanded ? 0.6 : 0,
        duration: 300,
        useNativeDriver: true
      })
    ]).start();
  }, [isExpanded]);

  useEffect(() => {
    // We load the channels
    const loadChannels = async () => {
      try {
        // We fetch the channels
        const data = await fetchUserChannels();
        // We set the channels
        setChannels(data);
      } catch (error) {
        console.error("Error loading channels:", error);
      }
    };
    
    loadChannels();
  }, []);

  return (
    <>
      {isExpanded && (
        <Animated.View 
          style={[
            styles.overlay,
            {
              opacity: fadeAnim,
            }
          ]}
          // We make the overlay clickable
          pointerEvents="auto"
          // When the user clicks on the overlay, we close the sidebar
          onTouchStart={toggleMenu}
        />
      )}
      <Animated.View style={[
        styles.sidebar,
        isSmartphone && styles.sidebarSmartphone,
        isSmartphoneLandscape && styles.sidebarSmartphoneLandscape,
        {
          transform: [{
            translateX: slideAnim
          }]
        }
      ]}>
      {/* When the user clicks on the close button, we close the sidebar */}
      <TouchableOpacity 
        onPress={toggleMenu}
        style={styles.closeButton}
      >
        <Ionicons 
          name="close"
          size={isSmartphone ? 30 : 40} 
          color={COLORS.gray300} 
        />
      </TouchableOpacity>

      {/* We display the channels */}
      <ScrollView style={styles.groupsList}>
        {/* Public channels */}
        {channels.publicChannels.length > 0 && (
          <GroupItem 
            name="Public"
            channels={channels.publicChannels}
            onChannelSelect={onChannelSelect}
            isSelected={selectedGroup === "Public"}
            onGroupSelect={onGroupSelect}
          />
        )}

        {/* Private groups */}
        {channels.privateGroups.map(group => (
          <GroupItem 
            key={group.id}
            name={group.name}
            channels={group.channels}
            onChannelSelect={onChannelSelect}
            isSelected={selectedGroup === group.name}
            onGroupSelect={onGroupSelect}
          />
        ))}
      </ScrollView>
    </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    top: -25,
    zIndex: 999,
    padding: 10,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 998,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: '#1E1E1E',
    zIndex: 999,
    paddingTop: 80,
    width: '35%',
    height: '100%',
    borderTopRightRadius: SIZES.borderRadius.small,
    borderBottomRightRadius: SIZES.borderRadius.small,
  },
  sidebarSmartphone: {
    width: '75%',
    height: '100%',
  },
  sidebarSmartphoneLandscape: {
    width: '45% ',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1000,
    padding: 10,
  },
  inputContainer: {
    width: '85%',
    backgroundColor: COLORS.gray650,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
    borderRadius: SIZES.borderRadius.small,
  },
  searchInput: {
    flex: 1,
    color: COLORS.gray300,
    padding: 8,
    fontSize: SIZES.fonts.subtitleTablet,
    fontWeight: SIZES.fontWeight.light,
  },
  searchInputSmartphone: {
    fontSize: SIZES.fonts.subtitleSmartphone,
  },
  groupsList: {
    paddingHorizontal: 25,
  },
  groupItem: {
    marginVertical: 8,
  },
  selectedGroup: {
    backgroundColor: COLORS.gray650,
    borderRadius: SIZES.borderRadius.small,
    marginBottom: 10,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  groupName: {
    color: COLORS.gray300,
    marginLeft: 10,
    fontSize: SIZES.fonts.subtitleTablet,
  },
  groupNameSmartphone: {
    fontSize: SIZES.fonts.subtitleSmartphone,
  },
  channelItem: {
    padding: 12,
    marginLeft: 10,
  },
  channelName: {
    color: COLORS.gray300,
    fontSize: SIZES.fonts.textTablet,
  },
  channelNameSmartphone: {
    fontSize: SIZES.fonts.textSmartphone,
  },
  errorText: {
    color: COLORS.red,
    fontSize: SIZES.fonts.textSmartphone,
    textAlign: 'center',
    marginTop: 10,
  },
});