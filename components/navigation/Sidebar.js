import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, ScrollView, TouchableOpacity, Animated, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/style';
import { useDeviceType } from '../../hooks/useDeviceType';
import { fetchUserChannels } from '../../services/api/messageApi';
import * as SecureStore from 'expo-secure-store';
import { SCREENS } from '../../constants/screens';
import { Text } from '../text/CustomText';
import { clearSecureStorage } from '../../services/api/authApi';
import { useTranslation } from 'react-i18next';

/**
 * @component Sidebar
 * @description A component that renders the sidebar menu
 *
 * @param {Object} props - The properties of the component
 * @param {Function} props.onChannelSelect - The function to call when a channel is selected
 * @param {Object} props.selectedGroup - The selected group
 * @param {Function} props.onGroupSelect - The function to call when a group is selected
 * @param {boolean} props.isExpanded - Whether the sidebar is expanded
 * @param {Function} props.toggleMenu - The function to call when the menu is toggled
 * @param {Function} props.onNavigate - The function to call when the user navigates
 * @param {string} props.currentSection - The current section
 * @param {Object} props.unreadChannels - The unread channels
 * @param {Function} props. - The function to call when the user logs out
 *
 * @example
 * <Sidebar onChannelSelect={() => console.log('Channel selected')} selectedGroup={selectedGroup} onGroupSelect={() => console.log('Group selected')} isExpanded={isExpanded} toggleMenu={() => console.log('Menu toggled')} onNavigate={() => console.log('Navigated')} currentSection="settings" unreadChannels={unreadChannels} onLogout={() => console.log('Logged out')} />
 */
export default function Sidebar({ onChannelSelect, selectedGroup, onGroupSelect, isExpanded, toggleMenu, onNavigate, currentSection, unreadChannels, onLogout }) {
  const [channels, setChannels] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGroups, setShowGroups] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userInfo, setUserInfo] = useState({ firstname: '', lastname: '' });

  // Get the device type
  const { isSmartphone } = useDeviceType();

  const { t } = useTranslation();

  /**
   * @function slideAnim
   * @description A function to animate the sidebar
   */
  const slideAnim = useRef(new Animated.Value(
    isSmartphone ? -500 : -300
  )).current;

  /**
   * @function fadeAnim
   * @description A function to animate the overlay
   */
  const fadeAnim = useRef(new Animated.Value(0)).current;

  /**
   * @function useEffect
   * @description A function to animate the sidebar and the overlay
   */
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: isExpanded ? 0 : (isSmartphone ? -500 : -300),
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: isExpanded ? 0.6 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isExpanded, isSmartphone, slideAnim, fadeAnim]);

  /**
   * @function useEffect
   * @description A function to load the channels and groups
   */
  useEffect(() => {
    const loadChannels = async () => {
      try {
        setLoading(true);
        const credentials = await SecureStore.getItemAsync('userCredentials');

        if (!credentials) {
          await clearSecureStorage();
          if (onNavigate) {onNavigate(SCREENS.LOGIN);}
          return;
        }

        try {
          const { contractNumber, login, password, accountApiKey } = JSON.parse(credentials);
          const response = await fetchUserChannels(contractNumber, login, password, '', accountApiKey);

          if (response.status === 'ok' && response.privateGroups) {
            setGroups(response.privateGroups);
            setChannels(response.publicChannels || []);
          } else {
            throw new Error('Erreur lors du chargement des canaux');
          }
        } catch (error) {
          if (error.message.includes('Could not decrypt')) {
            await clearSecureStorage();
            if (onNavigate) {onNavigate(SCREENS.LOGIN);}
          }
        }
      } catch (error) {
        await clearSecureStorage();
        if (onNavigate) {onNavigate(SCREENS.LOGIN);}
      } finally {
        setLoading(false);
      }
    };

    loadChannels();
  }, [onNavigate]);

  useEffect(() => {
    const loadUserInfo = async () => {
      const credentialsStr = await SecureStore.getItemAsync('userCredentials');
      if (credentialsStr) {
        const credentials = JSON.parse(credentialsStr);
        setUserInfo({
          firstname: credentials.firstname || '',
          lastname: credentials.lastname || '',
        });
      }
    };

    loadUserInfo();
  }, []);

  // Remplacer la fonction filteredGroups par un useMemo
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) {
      return groups; // Retourner tous les groupes si pas de recherche
    }

    return groups.map(group => ({
      ...group,
      channels: group.channels?.filter(channel => {
        const searchLower = searchQuery.toLowerCase();
        const titleMatch = channel.title.toLowerCase().includes(searchLower);
        return titleMatch;
      }),
    })).filter(group => group.channels?.length > 0);
  }, [groups, searchQuery]); // Dépendances : recalcule uniquement si groups ou searchQuery change

  // Ajouter des stats de recherche (optionnel)
  const searchStats = useMemo(() => {
    const totalChannels = filteredGroups.reduce((acc, group) =>
      acc + (group.channels?.length || 0), 0);

    return {
      totalChannels,
      totalGroups: filteredGroups.length
    };
  }, [filteredGroups]);

  /**
   * @function handleGroupsClick
   * @description A function to handle the click on the Groups button
   */
  const handleGroupsClick = () => {
    if (currentSection === 'settings') {
      onNavigate(SCREENS.CHAT); // Go back to chat
      setShowGroups(true); // Open groups
      return;
    }
    setShowGroups(!showGroups);
  };

  /**
   * @function handleSettingsClick
   * @description A function to handle the click on Settings
   */
  const handleSettingsClick = () => {
    if (showGroups) {
      setShowGroups(false); // Close groups if open
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
        { transform: [{ translateX: slideAnim }] },
      ]}>
        {/* Close button */}
        <TouchableOpacity onPress={toggleMenu} style={styles.closeButton}>
          <Ionicons name="close" size={30} color={COLORS.gray300} />
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
                isSmartphone && styles.searchInputSmartphone,
              ]}
              placeholder={t('sidebar.search')}
              placeholderTextColor={COLORS.gray300}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

          </View>

          {/* Group button */}
          <TouchableOpacity
            style={[
              styles.menuItem,
              showGroups && styles.selectedItem,
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
              showGroups && { color: COLORS.orange },
            ]}>{t('sidebar.groups')}</Text>
          </TouchableOpacity>

          {/* List of groups if showGroups is true */}
          {showGroups && (
            <View style={styles.groupsList}>
              {loading ? (
                <Text style={styles.loadingText}>{t('sidebar.loading')}</Text>
              ) : filteredGroups.map((group) => (
                <View key={group.id} style={[
                  styles.groupItem,
                  selectedGroup?.id === group.id,
                ]}>
                  <TouchableOpacity
                    style={styles.groupHeader}
                    onPress={() => onGroupSelect(group)}
                  >
                    <View style={styles.groupHeaderContent}>
                      <Ionicons
                        name={selectedGroup?.id === group.id ? 'chevron-down' : 'chevron-forward'}
                        size={isSmartphone ? 10 : 15}
                        color={COLORS.gray300}
                      />
                      <Text style={[
                        styles.groupName,
                        isSmartphone && styles.groupNameSmartphone,
                      ]}>{group.title}</Text>
                    </View>
                  </TouchableOpacity>

                  {/* List of channels if the group is selected */}
                  {selectedGroup?.id === group.id && group.channels && group.channels.map((channel) => {
                    return (
                      <TouchableOpacity
                        key={channel.id}
                        style={styles.channelItem}
                        onPress={() => onChannelSelect(channel)}
                      >
                        <View style={styles.channelContent}>
                          <Text style={[
                            styles.hashIcon,
                            isSmartphone && styles.hashIconSmartphone,
                          ]}>#</Text>
                          <Text style={[
                            styles.channelName,
                            isSmartphone && styles.channelNameSmartphone,
                          ]}>{channel.title}</Text>
                        </View>
                        {unreadChannels[channel.id] && (
                          <View style={styles.unreadBadge}>
                            <View style={styles.unreadDot} />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          )}

          {/* Settings button */}
          {/* <TouchableOpacity
            style={[
              styles.menuItem,
              currentSection === 'settings' && styles.selectedItem,
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
              currentSection === 'settings' && { color: COLORS.orange },
            ]}>{t('sidebar.settings')}</Text>
          </TouchableOpacity> */}
        </ScrollView>

        {/* User profile banner */}
        <View style={styles.profileBanner}>
          <View style={styles.profileInfo}>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, isSmartphone && styles.userNameSmartphone]}>
                {userInfo.firstname} {userInfo.lastname}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={onLogout}
            style={styles.logoutButton}
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
    bottom: -20,
    backgroundColor: COLORS.backgroundModal,
    zIndex: 1,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: -20,
    width: 300,
    backgroundColor: COLORS.gray950,
    zIndex: 2,
    paddingTop: 20,
    borderRightWidth: 0.5,
    borderRightColor: COLORS.borderColor,
  },
  sidebarSmartphone: {
    width: '80%',
    maxWidth: 500,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 3,
    padding: 10,
  },
  menuList: {
    marginTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 90,
  },
  loadingText: {
    color: COLORS.gray300,
    fontSize: SIZES.fonts.smallTextTablet,
    textAlign: 'center',
    marginTop: 20,
  },
  loadingTextSmartphone: {
    fontSize: SIZES.fonts.smallTextSmartphone,
  },
  groupItem: {
    marginBottom: 15,
  },
  selectedItem: {
    backgroundColor: COLORS.charcoal,
    borderRadius: SIZES.borderRadius.large,
    padding: 8,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  groupHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupName: {
    color: COLORS.gray300,
    fontSize: SIZES.fonts.textTablet,
    marginLeft: 10,
  },
  groupNameSmartphone: {
    fontSize: SIZES.fonts.textSmartphone,
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 30,
    marginBottom: 6,
  },
  channelContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hashIcon: {
    color: COLORS.gray300,
    marginRight: 8,
    fontSize: SIZES.fonts.biggerTextTablet,
    fontWeight: SIZES.fontWeight.medium,
  },
  hashIconSmartphone: {
    fontSize: SIZES.fonts.textSmartphone,
  },
  channelName: {
    color: COLORS.gray300,
    fontSize: SIZES.fonts.textTablet,
  },
  channelNameSmartphone: {
    fontSize: SIZES.fonts.textSmartphone,
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
    fontWeight: SIZES.fontWeight.medium,
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
    backgroundColor: COLORS.gray950,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: COLORS.borderColor,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userInfo: {
    justifyContent: 'center',
    marginLeft: 10,
  },
  userName: {
    color: COLORS.white,
    fontSize: SIZES.fonts.smallTextTablet,
    fontWeight: SIZES.fontWeight.medium,
  },
  userNameSmartphone: {
    fontSize: SIZES.fonts.textSmartphone,
  },
  logoutButton: {
    backgroundColor: COLORS.charcoal,
    borderRadius: SIZES.borderRadius.medium,
    borderWidth: 0.5,
    borderColor: COLORS.borderColor,
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
    marginBottom: 30,
  },
  searchInput: {
    flex: 1,
    color: COLORS.white,
    marginLeft: 8,
    fontSize: SIZES.fonts.textTablet,
  },
  searchInputSmartphone: {
    fontSize: SIZES.fonts.textSmartphone,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.orange,
    marginLeft: 8,
  },
  unreadBadge: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchStats: {
    color: COLORS.gray300,
    fontSize: SIZES.fonts.smallTextSmartphone,
    marginLeft: 8,
  },
});