import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, ScrollView, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDeviceType } from '../../hooks/useDeviceType';
import { COLORS, SIZES } from '../../assets/styles/constants';

function GroupItem({ name, channels, onChannelSelect, isSelected, onGroupSelect }) {
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
          color={COLORS.lightGray} 
        />
        <Text style={[
          styles.groupName,
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
              <Text style={styles.channelName}>{channel}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

export default function Sidebar({ onChannelSelect, selectedGroup, onGroupSelect, isExpanded, toggleMenu }) {
  const { dpWidth, isTablet } = useDeviceType();
  const sidebarWidth = isTablet ? dpWidth * 0.4 : dpWidth * 2.3;
  const slideAnim = useRef(new Animated.Value(-sidebarWidth)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isExpanded) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: -sidebarWidth,
          useNativeDriver: true,
          tension: 65,
          friction: 11
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [isExpanded]);
  return (
    <>
      <TouchableOpacity 
        style={styles.menuButton}
        onPress={toggleMenu}
      >
        <Ionicons 
          name={isExpanded ? "close" : "menu"} 
          size={30} 
          color={COLORS.lightGray} 
        />
      </TouchableOpacity>

      <Animated.View 
        style={[
          styles.sidebar, 
          { 
            width: sidebarWidth,
            transform: [{ translateX: slideAnim }],
          }
        ]}
      >
        <View style={styles.sidebarHeader}>
          <View style={styles.inputContainer}>
            <TextInput 
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor={COLORS.lightGray}
            />
            <Ionicons name="search" size={20} color={COLORS.lightGray} />
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
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 1000,
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
    bottom: 72,
    borderTopRightRadius: SIZES.borderRadius.small,
    borderBottomRightRadius: SIZES.borderRadius.small,
  },
  sidebarHeader: {
    alignItems: 'center',
  },
  inputContainer: {
    width: '85%',
    backgroundColor: '#313135',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 20,
    borderRadius: SIZES.borderRadius.small,
  },
  searchInput: {
    flex: 1,
    color: COLORS.lightGray,
    padding: 8,
    fontSize: SIZES.fonts.medium,
    fontWeight: SIZES.fontWeight.light,
  },
  groupsList: {
    paddingHorizontal: 25,
  },
  groupItem: {
    marginVertical: 8,
  },
  selectedGroup: {
    backgroundColor: '#313135',
    borderRadius: SIZES.borderRadius.small,
    marginBottom: 10,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  groupName: {
    color: COLORS.lightGray,
    marginLeft: 10,
    fontSize: SIZES.fonts.medium,
  },
  channelItem: {
    padding: 12,
    marginLeft: 10,
  },
  channelName: {
    color: COLORS.lightGray,
    fontSize: SIZES.fonts.small,
  },
});