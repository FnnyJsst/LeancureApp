import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/style';
import { useDeviceType } from '../../hooks/useDeviceType';
import { fetchUserChannels } from '../../services/messageApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SCREENS } from '../../constants/screens';

export default function Sidebar({ onChannelSelect, selectedGroup, selectedChannel, onGroupSelect, isExpanded, toggleMenu, onNavigate, currentSection }) {
  const [channels, setChannels] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGroups, setShowGroups] = useState(false);
  const { isSmartphone } = useDeviceType();
  
  const slideAnim = useRef(new Animated.Value(
    isSmartphone ? -500 : -300
  )).current;

  const fadeAnim = useRef(new Animated.Value(0)).current;

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
  }, [isExpanded, isSmartphone]);

  useEffect(() => {
    const loadChannels = async () => {
      try {
        setLoading(true);
        const credentials = await AsyncStorage.getItem('userCredentials');
        if (!credentials) {
          throw new Error('No credentials found');
        }
        const { contractNumber, login, password } = JSON.parse(credentials);
        
        const response = await fetchUserChannels(contractNumber, login, password);
        console.log('📊 Données chargées:', response);
        
        setChannels(response.publicChannels || []);
        setGroups(response.privateGroups || []);
      } catch (error) {
        console.error('🔴 Erreur dans Sidebar:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadChannels();
  }, []);

  return (
    <>
      {isExpanded && (
        <Animated.View 
          style={[styles.overlay, { opacity: fadeAnim }]}
          pointerEvents="auto"
          onTouchStart={toggleMenu}
        />
      )}
      <Animated.View style={[
        styles.sidebar,
        isSmartphone && styles.sidebarSmartphone,
        { transform: [{ translateX: slideAnim }] }
      ]}>
        <TouchableOpacity onPress={toggleMenu} style={styles.closeButton}>
          <Ionicons name="close" size={isSmartphone ? 30 : 40} color={COLORS.gray300} />
        </TouchableOpacity>

        <ScrollView style={styles.menuList}>
          {/* Bouton Groupes */}
          <TouchableOpacity 
            style={[
              styles.menuItem,
              showGroups && styles.selectedItem
            ]}
            onPress={() => setShowGroups(!showGroups)}
          >
            <Ionicons name="people-outline" size={24} color={COLORS.gray300} />
            <Text style={styles.menuText}>Groupes</Text>
            <Ionicons 
              name={showGroups ? "chevron-down" : "chevron-forward"} 
              size={24} 
              color={COLORS.gray300} 
              style={styles.chevron}
            />
          </TouchableOpacity>

          {/* Liste des groupes si showGroups est true */}
          {showGroups && (
            <View style={styles.groupsList}>
              {loading ? (
                <Text style={styles.loadingText}>Chargement...</Text>
              ) : groups.map((group) => (
                <View key={group.id} style={[
                  styles.groupItem,
                  selectedGroup?.id === group.id && styles.selectedGroup
                ]}>
                  <TouchableOpacity 
                    style={styles.groupHeader}
                    onPress={() => onGroupSelect(group)}
                  >
                    <View style={styles.groupHeaderContent}>
                      <Ionicons 
                        name={selectedGroup?.id === group.id ? "chevron-down" : "chevron-forward"} 
                        size={24} 
                        color={COLORS.gray300}
                        style={styles.groupChevron}
                      />
                      <Text style={[
                        styles.groupName,
                        isSmartphone && styles.groupNameSmartphone
                      ]}>{group.title}</Text>
                    </View>
                  </TouchableOpacity>

                  {selectedGroup?.id === group.id && group.channels && group.channels.map((channel) => (
                    <TouchableOpacity
                      key={channel.id}
                      style={styles.channelItem}
                      onPress={() => onChannelSelect(channel)}
                    >
                      <Text style={[
                        styles.channelName,
                        isSmartphone && styles.channelNameSmartphone
                      ]}>{channel.title}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>
          )}

          {/* Bouton Dashboard */}
          <TouchableOpacity 
            style={[
              styles.menuItem,
              currentSection === 'dashboard' && styles.selectedItem
            ]}
            onPress={() => onNavigate(SCREENS.DASHBOARD)}
          >
            <Ionicons name="grid-outline" size={24} color={COLORS.gray300} />
            <Text style={styles.menuText}>Dashboard</Text>
          </TouchableOpacity>

          {/* Bouton Logout */}
          <TouchableOpacity 
            style={[
              styles.menuItem,
              styles.logoutButton,
              currentSection === 'logout' && styles.selectedItem
            ]}
            onPress={() => onNavigate(SCREENS.LOGIN)}
          >
            <Ionicons name="log-out-outline" size={24} color={COLORS.gray900} />
            <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.black,
    zIndex: 1
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 300,
    backgroundColor: COLORS.gray900,
    zIndex: 2,
    paddingTop: 20,
    borderRightWidth: 1,
    borderRightColor: COLORS.gray800
  },
  sidebarSmartphone: {
    width: '80%',
    maxWidth: 500
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 3,
    padding: 10
  },
  menuList: {
    marginTop: 60,
    paddingHorizontal: 20
  },
  loadingText: {
    color: COLORS.gray300,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20
  },
  noChannelsText: {
    color: COLORS.gray300,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20
  },
  groupItem: {
    marginBottom: 15
  },
  selectedItem: {
    backgroundColor: COLORS.gray800,
    borderRadius: 8,
    padding: 8,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8
  },
  groupHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupChevron: {
    marginRight: 10,
  },
  groupName: {
    color: COLORS.gray300,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10
  },
  groupNameSmartphone: {
    fontSize: SIZES.fonts.subtitleSmartphone
  },
  channelItem: {
    paddingVertical: 8,
    paddingHorizontal: 32,
    marginLeft: 20,
  },
  channelContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  channelIcon: {
    marginRight: 8,
  },
  channelName: {
    color: COLORS.gray300,
    fontSize: 16
  },
  channelNameSmartphone: {
    fontSize: 14,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 4,
  },
  menuText: {
    color: COLORS.gray300,
    fontSize: 16,
    marginLeft: 15,
  },
  chevron: {
    marginLeft: 'auto',
  },
  logoutButton: {
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: COLORS.gray800,
  },
  logoutText: {
    color: COLORS.gray300
  },
  groupsList: {
    marginLeft: 20,
  },
});