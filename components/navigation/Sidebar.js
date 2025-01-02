import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, ScrollView, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDeviceType } from '../../hooks/useDeviceType';
import { COLORS, SIZES } from '../../constants/style';

function GroupItem({ name, channels, onChannelSelect, isSelected, onGroupSelect }) {

  const { isSmartphone } = useDeviceType();

  const [isGroupExpanded, setIsGroupExpanded] = useState(false);

  return (
    <View style={styles.groupItem}>
      <TouchableOpacity 
        style={[
          styles.groupHeader,
          isSelected && styles.selectedGroup
        ]}
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
        <Text style={[
          styles.groupName,
          isSmartphone && styles.groupNameSmartphone
        ]}>{name}</Text>
      </TouchableOpacity>
      
      {isGroupExpanded && (
        <View>
          {channels.map((channel, index) => (
            <TouchableOpacity 
              key={index}
              style={styles.channelItem}
              onPress={() => onChannelSelect(channel)}
            >
              <Text style={[
                styles.channelName,
                isSmartphone && styles.channelNameSmartphone
              ]}>{channel}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

export default function Sidebar({ onChannelSelect, selectedGroup, onGroupSelect, isExpanded, toggleMenu }) {
  const { dpWidth, isTablet, isTabletPortrait, isSmartphone, isSmartphoneLandscape } = useDeviceType();

  const sidebarWidth = isTabletPortrait ? dpWidth * 1 : (isTablet ? dpWidth * 0.4 : dpWidth * 2.3);
  const slideAnim = useRef(new Animated.Value(-sidebarWidth)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const toValue = isExpanded ? 0 : -sidebarWidth;
    const opacityValue = isExpanded ? 1 : 0;

    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue,
        useNativeDriver: true,
        tension: 65,
        friction: 11
      }),
      Animated.timing(fadeAnim, {
        toValue: opacityValue,
        duration: 200,
        useNativeDriver: true
      })
    ]).start();
  }, [isExpanded, sidebarWidth]);

  return (
    <>
      <Animated.View 
        style={[
          styles.sidebar, 
          isSmartphone && styles.sidebarSmartphone,
          isSmartphoneLandscape && styles.sidebarSmartphoneLandscape,
          isTabletPortrait && styles.sidebarTabletPortrait,
          { 
            transform: [{ translateX: slideAnim }],
          }
        ]}
      >
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
        <View style={styles.sidebarHeader}>
          <View style={[
            styles.inputContainer,
            isTablet && styles.inputContainerTablet
          ]}>
            <TextInput 
              style={[
                styles.searchInput,
                isSmartphone && styles.searchInputSmartphone
              ]}
              placeholder="Search"
              placeholderTextColor={COLORS.gray300}
            />
            <Ionicons name="search" size={isSmartphone ? 20 : 25} color={COLORS.gray300} />
          </View>
        </View>
        
        <ScrollView style={styles.groupsList}>
          <GroupItem 
            name="Management" 
            channels={['# general', '# random', '# dev']}
            onChannelSelect={onChannelSelect}
            isSelected={selectedGroup === "Group 1"}
            onGroupSelect={onGroupSelect} 
          />
          <GroupItem 
            name="Maintenance" 
            channels={['# marketing', '# sales']}
            onChannelSelect={onChannelSelect}
            isSelected={selectedGroup === "Group 2"}
            onGroupSelect={onGroupSelect} 
          />
        </ScrollView>
      </Animated.View>

      {isExpanded && (
        <Animated.View 
          style={[
            styles.overlay,
            {
              opacity: fadeAnim
            }
          ]}
        >
          <TouchableOpacity 
            activeOpacity={1}
            onPress={toggleMenu}
          />
        </Animated.View>
      )}
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
    fontSize: SIZES.fonts.textTablet,
    fontWeight: SIZES.fontWeight.light,
  },
  searchInputSmartphone: {
    fontSize: SIZES.fonts.textSmartphone,
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
});