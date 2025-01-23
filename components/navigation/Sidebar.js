import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/style';
import { useDeviceType } from '../../hooks/useDeviceType';
import { fetchUserChannels } from '../../services/messageApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SCREENS } from '../../constants/screens';
import AccountImage from '../../components/AccountImage';


// Sidebar menu component
export default function Sidebar({ onChannelSelect, selectedGroup, onGroupSelect, isExpanded, toggleMenu, onNavigate, currentSection }) {
  const [channels, setChannels] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGroups, setShowGroups] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Get the device type
  const { isSmartphone } = useDeviceType();
  
  // Animation for the sidebar
  const slideAnim = useRef(new Animated.Value(
    isSmartphone ? -500 : -300
  )).current;

  // Animation for the overlay
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Animation for the sidebar
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

  // Load the channels and groups
  useEffect(() => {
    const loadChannels = async () => {
      try {
        // Set the loading state to true
        setLoading(true);
        // Get the credentials from the async storage
        const credentials = await AsyncStorage.getItem('userCredentials');
        if (!credentials) {
          throw new Error('No credentials found');
        }
        // Parse the credentials
        const { contractNumber, login, password } = JSON.parse(credentials);
        // Fetch the user channels
        const response = await fetchUserChannels(contractNumber, login, password);
        console.log('📊 Données chargées:', response);
        // Set the channels and groups
        setChannels(response.publicChannels || []);
        setGroups(response.privateGroups || []);
        // If there is an error, log it
      } catch (error) {
        console.error('🔴 Erreur dans Sidebar:', error);
      } finally {
        setLoading(false);
      }
    };
    // Load the channels and groups
    loadChannels();
  }, []);

  // Filtrer les channels en fonction de la recherche
  const filteredGroups = groups.map(group => ({
    ...group,
    channels: group.channels?.filter(channel => 
      channel.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(group => group.channels?.length > 0);

  // Fonction pour gérer le clic sur le bouton Groupes
  const handleGroupsClick = () => {
    if (currentSection === 'settings') {
      onNavigate(SCREENS.CHAT); // Retourner au chat si on est dans settings
      setShowGroups(true); // Ouvrir les groupes
      return;
    }
    setShowGroups(!showGroups);
  };

  // Fonction pour gérer le clic sur Settings
  const handleSettingsClick = () => {
    if (showGroups) {
      setShowGroups(false); // Fermer les groupes si ouverts
    }
    onNavigate(SCREENS.SETTINGS_MESSAGE);
  };

  return (
    <>
      {/* Overlay */}
      {isExpanded && (
        <Animated.View 
          style={[styles.overlay, { opacity: fadeAnim }]}
          pointerEvents="auto"
          onTouchStart={toggleMenu}
        />
      )}
      {/* Sidebar */}
      <Animated.View style={[
        styles.sidebar,
        isSmartphone && styles.sidebarSmartphone,
        { transform: [{ translateX: slideAnim }] }
      ]}>
        {/* Close button */}
        <TouchableOpacity onPress={toggleMenu} style={styles.closeButton}>
          <Ionicons name="close" size={isSmartphone ? 30 : 40} color={COLORS.gray300} />
        </TouchableOpacity>

        {/* Menu list */}
        <ScrollView style={styles.menuList}>
          {/* Search input */}
          <View style={styles.searchContainer}>
            <Ionicons 
              name="search-outline" 
              size={isSmartphone ? 20 : 24} 
              color={COLORS.gray300} 
            />
            <TextInput
              style={[
                styles.searchInput,
                isSmartphone && styles.searchInputSmartphone
              ]}
              placeholder="Search a channel"
              placeholderTextColor={COLORS.gray300}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Group button */}
          <TouchableOpacity 
            style={[
              styles.menuItem,
              showGroups && styles.selectedItem
            ]}
            onPress={handleGroupsClick}
          >
            <Ionicons 
              name="people-outline" 
              size={isSmartphone ? 20 : 24} 
              color={showGroups ? COLORS.orange : COLORS.gray300} 
            />
            <Text style={[
              styles.menuText, 
              isSmartphone && styles.menuTextSmartphone,
              showGroups && { color: COLORS.orange }
            ]}>Groupes</Text>
          </TouchableOpacity>

          {/* List of groups if showGroups is true */}
          {showGroups && (
            <View style={styles.groupsList}>
              {loading ? (
                <Text style={styles.loadingText}>Loading...</Text>
              ) : filteredGroups.map((group) => (
                <View key={group.id} style={[
                  styles.groupItem,
                  selectedGroup?.id === group.id
                ]}>
                  <TouchableOpacity 
                    style={styles.groupHeader}
                    onPress={() => onGroupSelect(group)}
                  >
                    <View style={styles.groupHeaderContent}>
                      <Ionicons 
                        name={selectedGroup?.id === group.id ? "chevron-down" : "chevron-forward"} 
                        size={isSmartphone ? 20 : 24} 
                        color={COLORS.gray300}
                      />
                      <Text style={[
                        styles.groupName,
                        isSmartphone && styles.groupNameSmartphone
                      ]}>{group.title}</Text>
                    </View>
                  </TouchableOpacity>

                  {/* List of channels if the group is selected */}
                  {selectedGroup?.id === group.id && group.channels && group.channels.map((channel) => (
                    <TouchableOpacity
                      key={channel.id}
                      style={styles.channelItem}
                      onPress={() => onChannelSelect(channel)}
                    >
                      <View style={styles.channelContent}>
                        <Text style={[
                          styles.channelIcon,
                          styles.hashIcon
                        ]}>#</Text>
                        <Text style={[
                          styles.channelName,
                          isSmartphone && styles.channelNameSmartphone
                        ]}>{channel.title}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>
          )}

          {/* Settings button */}
          <TouchableOpacity 
            style={[
              styles.menuItem,
              currentSection === 'settings' && styles.selectedItem
            ]}
            onPress={handleSettingsClick}
          >
            <Ionicons 
              name="settings-outline" 
              size={isSmartphone ? 20 : 24} 
              color={currentSection === 'settings' ? COLORS.orange : COLORS.gray300} 
            />
            <Text style={[
              styles.menuText, 
              isSmartphone && styles.menuTextSmartphone,
              currentSection === 'settings' && { color: COLORS.orange }
            ]}>Settings</Text>
          </TouchableOpacity>
        </ScrollView>
        
        {/* User profile banner */}
        <View style={styles.profileBanner}>
          <View style={styles.profileInfo}>
            <AccountImage width={40} height={40} />
            <View style={styles.userInfo}>
              <Text style={[styles.userName, isSmartphone && styles.userNameSmartphone]}>John Doe</Text>
              <Text style={[styles.userRole, isSmartphone && styles.userRoleSmartphone]}>Technician</Text>
            </View>
          </View>
          <TouchableOpacity 
            onPress={() => onNavigate(SCREENS.LOGIN)}
            style={styles.settingsButton}
          >
            <Ionicons name="power-outline" size={20} color={COLORS.gray300} />
          </TouchableOpacity>
        </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 1
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 300,
    backgroundColor: "#111111",
    zIndex: 2,
    paddingTop: 20,
    borderRightWidth: 1,
    borderRightColor: '#403430',
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
    paddingHorizontal: 20,
    paddingBottom: 90,
  },
  loadingText: {
    color: COLORS.gray300,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20
  },
  groupItem: {
    marginBottom: 15
  },
  selectedItem: {
    backgroundColor: "#271E1E",
    borderRadius: SIZES.borderRadius.large,
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
  groupName: {
    color: COLORS.gray300,
    fontSize: SIZES.fonts.subtitleTablet,
    marginLeft: 10
  },
  groupNameSmartphone: {
    fontSize: 14,
  },
  channelItem: {
    paddingVertical: 8,
    paddingHorizontal: 30,
    marginBottom: 6,
  },
  channelContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  channelIcon: {
    marginRight: 8,
  },
  hashIcon: {
    color: COLORS.gray300,
    fontSize: SIZES.fonts.subtitleTablet,
    fontWeight: SIZES.fontWeight.medium,
  },
  channelName: {
    color: COLORS.gray300,
    fontSize: SIZES.fonts.sideBarTextTablet,
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
    fontSize: SIZES.fonts.subtitleTablet,
    marginLeft: 15,
  },
  menuTextSmartphone: {
    fontSize: 15,
  },
  logoutButton: {
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: COLORS.gray800,
  },
  groupsList: {
    marginLeft: 20,
  },
  profileBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: "#111111",
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: "#403430",
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userInfo: {
    justifyContent: 'center',
  },
  userName: {
    color: COLORS.white,
    fontSize: SIZES.fonts.textTablet,
    fontWeight: SIZES.fontWeight.medium,
  },
  userNameSmartphone: {
    fontSize: 14,
  },
  userRole: {
    color: COLORS.gray300,
    fontSize: SIZES.fonts.textTablet,
    fontWeight: SIZES.fontWeight.regular,
  },
  userRoleSmartphone: {
    fontSize: 12,
  },
  settingsButton: {
    backgroundColor: "#271E1E",
    // padding: 5,
    borderRadius: SIZES.borderRadius.small,
    width: 50,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevron: {
    marginLeft: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray900,
    borderRadius: SIZES.borderRadius.large,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    color: COLORS.white,
    marginLeft: 8,
    fontSize: SIZES.fonts.textTablet,
  },
  searchInputSmartphone: {
    fontSize: 14,
    
  },
});
