import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, ScrollView, TouchableOpacity, Animated, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/style';
import { useDeviceType } from '../../hooks/useDeviceType';
import { fetchUserChannels } from '../../services/api/messageApi';
import { SCREENS } from '../../constants/screens';
import { Text } from '../text/CustomText';
import { cleanSecureStore } from '../../utils/secureStore';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../../services/notification/notificationContext';
import { useCredentials } from '../../hooks/useCredentials';

/**
 * @component Sidebar
 * @description A component that renders the sidebar menu
 * @param {Function} props.onChannelSelect - The function to call when a channel is selected
 * @param {Object} props.selectedGroup - The selected group
 * @param {Function} props.onGroupSelect - The function to call when a group is selected
 * @param {boolean} props.isExpanded - Whether the sidebar is expanded
 * @param {Function} props.toggleMenu - The function to call when the menu is toggled
 * @param {Function} props.onNavigate - The function to call when the user navigates
 * @param {string} props.currentSection - The current section
 * @param {Function} props.onLogout - The function to call when the user logs out
 */
export default function Sidebar({ onChannelSelect, selectedGroup, onGroupSelect, isExpanded, toggleMenu, onNavigate, currentSection, onLogout }) {
  const [channels, setChannels] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGroups, setShowGroups] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Use the notification context to access the unread channels
  const { unreadChannels } = useNotification();
  const { credentials, isLoading: credentialsLoading } = useCredentials();
  const { isSmartphone } = useDeviceType();
  const { t } = useTranslation();

  /**
   * @description Animated value for sidebar sliding animation
   */
  const slideAnim = useRef(new Animated.Value(
    isSmartphone ? -500 : -300
  )).current;


  /**
   * @description Animated value for overlay fading animation
   */
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Animation pour le point orange
  const pulseAnim = useRef(new Animated.Value(1)).current;

  /**
   * @description Animate the sidebar and the overlay
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

  useEffect(() => {
    if (unreadChannels && Object.keys(unreadChannels).length > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [unreadChannels]);

  /**
   * @description Loads the channels and groups
   */
  useEffect(() => {
    const loadChannels = async () => {
      try {
        setLoading(true);

        // If the credentials are not found, clean the secure store and navigate to the login screen
        if (!credentials) {
          await cleanSecureStore();
          if (onNavigate) {onNavigate(SCREENS.LOGIN);}
          return;
        }

        try {
          // Parse the credentials
          const { contractNumber, login, password, accountApiKey } = credentials;

          // Fetch the user channels
          const response = await fetchUserChannels(contractNumber, login, password, '', accountApiKey);

          // If the response is ok and the private groups are found, set the groups and channels
          if (response.status === 'ok' && response.privateGroups) {
            setGroups(response.privateGroups);
            setChannels(response.publicChannels || []);

            // Store channels globally
            if (typeof global !== 'undefined') {
              const allChannels = [
                ...(response.publicChannels || []),
                ...response.privateGroups.flatMap(group => group.channels || [])
              ];
              global.channels = allChannels;
            }
          } else {
            throw new Error(t('errors.errorLoadingChannels'));
          }
        } catch (error) {
          if (error.message.includes(t('errors.couldNotDecrypt'))) {
            await cleanSecureStore();
            if (onNavigate) {onNavigate(SCREENS.LOGIN);}
          }
        }
      } catch (error) {
        await cleanSecureStore();
        if (onNavigate) {onNavigate(SCREENS.LOGIN);}
      } finally {
        setLoading(false);
      }
    };

    if (!credentialsLoading && credentials) {
      loadChannels();
    }
  }, [credentials, credentialsLoading, onNavigate, t]);

  /**
   * @function filteredGroups
   * @description Filter the groups in the sidebar based on the search query
   */
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) {
      return groups; // Return all groups if no search
    }

    return groups.map(group => ({
      ...group,
      channels: group.channels?.filter(channel => {
        const searchLower = searchQuery.toLowerCase();
        const titleMatch = channel.title.toLowerCase().includes(searchLower);
        return titleMatch;
      }),
    })).filter(group => group.channels?.length > 0);
  }, [groups, searchQuery]); // Dependencies: recalculate only if groups or searchQuery change


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

          {/* List of groups */}
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
                    const hasUnreadMessages = unreadChannels && unreadChannels[channel.id];

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
                        {hasUnreadMessages && (
                          <Animated.View
                            style={[
                              styles.unreadBadge,
                              {
                                transform: [{ scale: pulseAnim }]
                              }
                            ]}
                          >
                            <View style={styles.unreadDot} />
                          </Animated.View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* User profile banner */}
        <View style={styles.profileBanner}>
          <View />
          <TouchableOpacity
            onPress={onLogout}
            style={styles.logoutButton}
            testID="logout-button"
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
    shadowColor: COLORS.orange,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  unreadBadge: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 10,
  },
});