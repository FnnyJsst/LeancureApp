import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, ScrollView, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDeviceType } from '../../hooks/useDeviceType';
import { COLORS, SIZES } from '../../constants/style';
import { fetchUserChannels } from '../../services/messageApi';

function GroupItem({ name, channels, onChannelSelect, isSelected, onGroupSelect }) {
  const { isSmartphone } = useDeviceType();
  const [isGroupExpanded, setIsGroupExpanded] = useState(false);

  const handleChannelSelect = (channel) => {
    console.log('Canal sélectionné:', channel);
    onChannelSelect(channel.name, channel.messages || []);
  };

  return (
    <View style={styles.groupItem}>
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
  const [channels, setChannels] = useState({ publicChannels: [], privateGroups: [] });
  const { isSmartphone, isTablet } = useDeviceType();
  
  const sidebarWidth = isSmartphone ? '75%' : '25%';
  const slideAnim = useRef(new Animated.Value(-300)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isExpanded ? 0 : -300,
      duration: 300,
      useNativeDriver: true
    }).start();
  }, [isExpanded]);

  useEffect(() => {
    const loadChannels = async () => {
      try {
        const data = await fetchUserChannels();
        setChannels(data);
      } catch (error) {
        console.error("Erreur lors du chargement des canaux:", error);
      }
    };
    
    loadChannels();
  }, []);

  return (
    <Animated.View style={[
      styles.sidebar,
      isSmartphone && styles.sidebarSmartphone,
      {
        transform: [{
          translateX: slideAnim
        }]
      }
    ]}>
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

      <ScrollView style={styles.groupsList}>
        {/* Canaux publics */}
        {channels.publicChannels.length > 0 && (
          <GroupItem 
            name="Public"
            channels={channels.publicChannels}
            onChannelSelect={onChannelSelect}
            isSelected={selectedGroup === "Public"}
            onGroupSelect={onGroupSelect}
          />
        )}

        {/* Groupes privés */}
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
    backgroundColor: '#1E1E1E',
    zIndex: 999,
    paddingTop: 80,
    bottom: 65,
    width: '25%',
    borderTopRightRadius: SIZES.borderRadius.small,
    borderBottomRightRadius: SIZES.borderRadius.small,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1000,
    padding: 10,
  },
  sidebarSmartphone: {
    bottom: 56,
    width: '75%',
  },
  sidebarSmartphoneLandscape: {
    width: '50%',
  },
  sidebarTabletPortrait: {
    width: '50%',
  },
  sidebarHeader: {
    alignItems: 'center',
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
  inputContainerTablet: {
    marginTop: 20,
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