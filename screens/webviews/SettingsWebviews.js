import React, { useState, useCallback, memo, useEffect, useRef } from 'react';
import { ScrollView, View, StyleSheet, BackHandler, TouchableOpacity, findNodeHandle, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SettingsCard from '../../components/cards/SettingsCard';
import AutoRefreshModal from '../../components/modals/webviews/AutoRefreshModal';
import ReadOnlyModal from '../../components/modals/webviews/ReadOnlyModal';
import PasswordDefineModal from '../../components/modals/webviews/PasswordDefineModal';
import HideMessagesModal from '../../components/modals/common/HideMessagesModal';
import TooltipModal from '../../components/modals/webviews/TooltipModal';
import { useDeviceType } from '../../hooks/useDeviceType';
import { SIZES, COLORS, FONTS } from '../../constants/style';
import { SCREENS } from '../../constants/screens';
import { Text } from '../../components/text/CustomText';
import { useTranslation } from 'react-i18next';
import * as SecureStore from 'expo-secure-store';

/**
 * Memoized components to prevent unnecessary re-renders
 * This optimization is particularly important for modals and cards
 * that don't need to re-render unless their props change
 */
const MemoizedAutoRefreshModal = memo(AutoRefreshModal);
const MemoizedReadOnlyModal = memo(ReadOnlyModal);
const MemoizedPasswordDefineModal = memo(PasswordDefineModal);
const MemoizedHideMessagesModal = memo(HideMessagesModal);
const MemoizedSettingsCard = memo(SettingsCard);
const MemoizedTooltipModal = memo(TooltipModal);

/**
 * @component SettingsWebviews
 * @description Displays the settings for the webviews
 * @param {Function} onNavigate - A function to navigate to a screen
 * @param {Array} selectedWebviews - The list of selected channels
 * @param {string} refreshOption - The refresh option
 * @param {Function} handlePasswordSubmit - A function to handle the password submit
 * @param {boolean} isPasswordRequired - A boolean to indicate if the password is required
 * @param {Function} disablePassword - A function to disable the password
 * @param {boolean} isReadOnly - A boolean to indicate if the user is read only
 * @param {Function} toggleReadOnly - A function to toggle the read only mode
 * @param {Function} handleSelectOption - A function to handle the select option
 * @param {boolean} isMessagesHidden - A boolean to indicate if messages are hidden
 * @param {Function} onToggleHideMessages - A function to toggle the hide messages mode
 */
export default function SettingsWebviews({
  onNavigate,
  selectedWebviews,
  refreshOption,
  handlePasswordSubmit,
  isPasswordRequired,
  disablePassword,
  isReadOnly,
  toggleReadOnly,
  handleSelectOption,
  isMessagesHidden,
  onToggleHideMessages,
  testID,
}) {
  const { t } = useTranslation();
  const { isSmartphone, isLandscape, isSmartphonePortrait } = useDeviceType();

  // Références pour les boutons
  const autoRefreshButtonRef = useRef(null);
  const readOnlyButtonRef = useRef(null);
  const passwordButtonRef = useRef(null);
  const hideMessagesButtonRef = useRef(null);

  // Position du tooltip
  const [tooltipPosition, setTooltipPosition] = useState({ top: '45%', left: '50%' });
  // Tooltip actif
  const [activeTooltip, setActiveTooltip] = useState(null);

  /**
   * Consolidated modal state management
   * Using a single state object instead of multiple useState calls
   * reduces the number of re-renders and simplifies state updates
   */
  const [modalState, setModalState] = useState({
    autoRefresh: false,
    password: false,
    readOnly: false,
    hideMessages: false,
    tooltip: false
  });

  // State pour savoir si les tooltips ont déjà été affichés
  const [hasSeenTooltips, setHasSeenTooltips] = useState({
    autoRefresh: true,
    readOnly: true,
    password: true,
    hideMessages: true
  });

  // Charger l'état des tooltips au chargement du composant
  useEffect(() => {
    const checkTooltipsStatus = async () => {
      try {
        // Vérifier l'état de chaque tooltip
        const tooltipKeys = ['autoRefresh', 'readOnly', 'password', 'hideMessages'];
        const tooltipValues = {};

        for (const key of tooltipKeys) {
          const hasSeenTooltipStr = await SecureStore.getItemAsync(`hasSeen${key.charAt(0).toUpperCase() + key.slice(1)}Tooltip`);
          tooltipValues[key] = hasSeenTooltipStr === 'true';
        }

        setHasSeenTooltips(tooltipValues);
      } catch (error) {
        console.error('Erreur lors du chargement de l\'état des tooltips:', error);
        // Par défaut, ne pas afficher les tooltips si une erreur se produit
        setHasSeenTooltips({
          autoRefresh: true,
          readOnly: true,
          password: true,
          hideMessages: true
        });
      }
    };

    checkTooltipsStatus();
  }, []);

  /**
   * Memoized callbacks to prevent unnecessary re-renders
   * These functions are only recreated when their dependencies change
   */
  const handleQuitApp = useCallback(() => {
    BackHandler.exitApp();
  }, []);

  const handleBackPress = useCallback(() => {
    if (selectedWebviews && selectedWebviews.length > 0) {
      onNavigate(SCREENS.WEBVIEW);
    } else {
      onNavigate(SCREENS.NO_URL);
    }
  }, [selectedWebviews, onNavigate]);

  /**
   * Memoized function to format the refresh option text
   * Only recreated when the translation function changes
   */
  const formatRefreshOption = useCallback((option) => {
    if (!option || option === 'never') {
      return t('modals.webview.refresh.never');
    }

    const match = option.match(/every (\d+) (\w+)/i);
    if (!match) {
      if (option === 'every hour') return t('modals.webview.refresh.every1h');
      if (option === 'every day') return t('modals.webview.refresh.everyDay');
      if (option === 'every minute') return t('modals.webview.refresh.every1min');
      return option;
    }

    const [_, number, unit] = match;
    const key = unit.includes('hour')
      ? `every${number}h`
      : `every${number}min`;

    return t(`modals.webview.refresh.${key}`);
  }, [t]);

  /**
   * Memoized function to handle hiding messages
   * Includes error handling and modal state management
   */
  const handleToggleHideMessages = useCallback(async (value) => {
    try {
      setModalState(prev => ({ ...prev, hideMessages: false }));
      await onToggleHideMessages(value);
    } catch (error) {
      throw error;
    }
  }, [onToggleHideMessages]);

  /**
   * Memoized function to update modal state
   * Uses functional updates to ensure state updates are based on the latest state
   */
  const updateModalState = useCallback((key, value) => {
    setModalState(prev => ({ ...prev, [key]: value }));
  }, []);

  /**
   * Fonction pour marquer un tooltip comme vu
   */
  const markTooltipAsSeen = useCallback(async (tooltipKey) => {
    try {
      await SecureStore.setItemAsync(`hasSeen${tooltipKey.charAt(0).toUpperCase() + tooltipKey.slice(1)}Tooltip`, 'true');
      setHasSeenTooltips(prev => ({ ...prev, [tooltipKey]: true }));
      setActiveTooltip(null);
      updateModalState('tooltip', false);

      // Ouvrir le modal correspondant après la fermeture du tooltip
      updateModalState(tooltipKey, true);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'état du tooltip:', error);
    }
  }, [updateModalState]);

  /**
   * Mesurer la position d'un bouton
   */
  const measureButton = useCallback((buttonRef) => {
    if (buttonRef.current) {
      try {
        const nodeHandle = findNodeHandle(buttonRef.current);
        if (nodeHandle) {
          UIManager.measure(nodeHandle, (x, y, width, height, pageX, pageY) => {
            // Positionner le tooltip au-dessus du bouton avec plus de précision
            setTooltipPosition({
              top: pageY - 15, // Un peu au-dessus du bouton
              left: pageX + width / 2, // Exactement au centre du bouton
            });
          });
        }
      } catch (error) {
        console.log('Erreur de mesure:', error);
        // Position par défaut en cas d'erreur
        setTooltipPosition({ top: '35%', left: '50%' });
      }
    }
  }, []);

  /**
   * Fonction générique pour ouvrir un modal avec vérification de tooltip
   */
  const openModalWithTooltip = useCallback((modalKey, buttonRef) => {
    return () => {
      // Si l'utilisateur n'a jamais vu le tooltip, on l'affiche
      if (!hasSeenTooltips[modalKey]) {
        // Mesurer la position du bouton avant d'afficher le tooltip
        measureButton(buttonRef);
        setActiveTooltip(modalKey);
        updateModalState('tooltip', true);
      } else {
        // Sinon, on ouvre directement le modal
        updateModalState(modalKey, true);
      }
    };
  }, [hasSeenTooltips, measureButton, updateModalState]);

  // Memoized handlers pour chaque bouton
  const openAutoRefreshModal = useCallback(openModalWithTooltip('autoRefresh', autoRefreshButtonRef),
    [openModalWithTooltip, autoRefreshButtonRef]);

  const openReadOnlyModal = useCallback(openModalWithTooltip('readOnly', readOnlyButtonRef),
    [openModalWithTooltip, readOnlyButtonRef]);

  const openPasswordModal = useCallback(openModalWithTooltip('password', passwordButtonRef),
    [openModalWithTooltip, passwordButtonRef]);

  const openHideMessagesModal = useCallback(openModalWithTooltip('hideMessages', hideMessagesButtonRef),
    [openModalWithTooltip, hideMessagesButtonRef]);

  /**
   * Gère la fermeture du tooltip actif
   */
  const handleTooltipClose = useCallback(() => {
    if (activeTooltip) {
      markTooltipAsSeen(activeTooltip);
    }
  }, [activeTooltip, markTooltipAsSeen]);

  return (
    <View testID={testID}>
      <ScrollView showsVerticalScrollIndicator={true}>
        <View style={styles.customHeaderContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
            testID="back-button"
          >
            <Ionicons
              name="close-outline"
              size={isSmartphone ? 24 : 28}
              color={COLORS.white}
            />
          </TouchableOpacity>
        </View>

        <View testID={testID} style={[styles.pageContainer, isSmartphonePortrait && styles.pageContainerSmartphonePortrait]}>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, isSmartphone && styles.titleSmartphone]}>
              {t('titles.app')}
            </Text>
          </View>
          <View style={[styles.configContainer, isSmartphone && styles.configContainerSmartphone, isLandscape && styles.configContainerLandscape]}>
            <MemoizedSettingsCard
              title={t('settings.webview.quit')}
              iconBackgroundColor={COLORS.burgundy}
              icon={
                <Ionicons
                  name="exit-outline"
                  size={isSmartphone ? 22 : 28}
                  color={COLORS.red}
                />
              }
              description={t('settings.webview.quitDescription')}
              onPress={handleQuitApp}
              testID="quit-button"
            />
          </View>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, isSmartphone && styles.titleSmartphone]}>
              {t('titles.channels')}
            </Text>
          </View>
          <View style={[styles.configContainer, isSmartphone && styles.configContainerSmartphone, isLandscape && styles.configContainerLandscape]}>
            <MemoizedSettingsCard
              title={t('settings.webview.management')}
              description={t('settings.webview.managementDescription')}
              icon={<Ionicons name="build-outline" size={isSmartphone ? 22 : 28} color={COLORS.orange} />}
              onPress={() => onNavigate(SCREENS.WEBVIEWS_MANAGEMENT)}
            />
            <View style={styles.separator} />
            <View style={styles.rowContainer}>
              <View style={styles.leftContent}>
                <MemoizedSettingsCard
                  title={t('settings.webview.autoRefresh')}
                  description={t('settings.webview.autoRefreshDescription')}
                  icon={<Ionicons name="reload-outline" size={isSmartphone ? 22 : 28} color={COLORS.orange} />}
                  onPress={openAutoRefreshModal}
                  testID="open-auto-refresh-button"
                />
              </View>
              <TouchableOpacity
                ref={autoRefreshButtonRef}
                style={styles.baseToggle}
                onPress={openAutoRefreshModal}
              >
                <Text style={[styles.text, isSmartphone && styles.textSmartphone]}>
                  {formatRefreshOption(refreshOption)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, isSmartphone && styles.titleSmartphone]}>
              {t('titles.security')}
            </Text>
          </View>
          <View style={[styles.configContainer, isSmartphone && styles.configContainerSmartphone, isLandscape && styles.configContainerLandscape]}>
            <View style={styles.rowContainer}>
              <View style={styles.leftContent}>
                <MemoizedSettingsCard
                  title={t('settings.webview.readOnly')}
                  description={t('settings.webview.readOnlyDescription')}
                  icon={<Ionicons name="eye-outline" size={isSmartphone ? 22 : 28} color={COLORS.orange} />}
                  onPress={openReadOnlyModal}
                  testID="open-read-only-button"
                />
              </View>
              <TouchableOpacity
                ref={readOnlyButtonRef}
                style={styles.baseToggle}
                onPress={openReadOnlyModal}
              >
                <Text style={[styles.text, isSmartphone && styles.textSmartphone]}>
                  {isReadOnly ? t('buttons.yes') : t('buttons.no')}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.separator} />
            <View style={styles.rowContainer}>
              <View style={styles.leftContent}>
                <MemoizedSettingsCard
                  title={t('titles.password')}
                  description={t('settings.webview.passwordDescription')}
                  icon={<Ionicons name="lock-closed-outline" size={isSmartphone ? 22 : 28} color={COLORS.orange} />}
                  onPress={openPasswordModal}
                  testID="open-password-button"
                />
              </View>
              <TouchableOpacity
                ref={passwordButtonRef}
                style={styles.baseToggle}
                onPress={openPasswordModal}
              >
                <Text style={[styles.text, isSmartphone && styles.textSmartphone]}>
                  {isPasswordRequired ? t('buttons.yes') : t('buttons.no')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, isSmartphone && styles.titleSmartphone]}>{t('titles.messages')}</Text>
          </View>
          <View style={[styles.configContainer, isSmartphone && styles.configContainerSmartphone, isLandscape && styles.configContainerLandscape]}>
            <View style={styles.rowContainer}>
              <View style={styles.leftContent}>
                <MemoizedSettingsCard
                  title={t('settings.common.showHide')}
                  iconBackgroundColor={COLORS.borderColor}
                  icon={
                    <Ionicons
                      name="remove-circle-outline"
                      size={isSmartphone ? 22 : 28}
                      color={COLORS.red}
                    />
                  }
                  description={t('settings.common.showHideDescription')}
                  onPress={openHideMessagesModal}
                  testID="open-hide-messages-button"
                />
              </View>
              <TouchableOpacity
                ref={hideMessagesButtonRef}
                style={styles.baseToggle}
                onPress={openHideMessagesModal}
              >
                <Text style={[styles.text, isSmartphone && styles.textSmartphone]}>
                  {isMessagesHidden ? t('buttons.hide') : t('buttons.show')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, isSmartphone && styles.titleSmartphone]}>
            {t('titles.version') + ' 2.0.0'}
          </Text>
        </View>
      </ScrollView>

      {/* Tooltip qui s'affiche uniquement la première fois */}
      <MemoizedTooltipModal
        visible={modalState.tooltip}
        onClose={handleTooltipClose}
        title={activeTooltip ? t(`tooltips.${activeTooltip}.title`) : ''}
        message={activeTooltip ? t(`tooltips.${activeTooltip}.message`) : ''}
        position={tooltipPosition}
      />

      {/* Modals mémorisés */}
      <MemoizedAutoRefreshModal
        visible={modalState.autoRefresh}
        onClose={() => updateModalState('autoRefresh', false)}
        onSelectOption={handleSelectOption}
        testID={testID}
      />
      <MemoizedReadOnlyModal
        visible={modalState.readOnly}
        onClose={() => updateModalState('readOnly', false)}
        onToggleReadOnly={toggleReadOnly}
        testID={testID}
      />
      <MemoizedPasswordDefineModal
        visible={modalState.password}
        onClose={() => updateModalState('password', false)}
        onSubmitPassword={handlePasswordSubmit}
        onDisablePassword={disablePassword}
        testID="password-define-modal"
      />
      <MemoizedHideMessagesModal
        visible={modalState.hideMessages}
        onClose={() => updateModalState('hideMessages', false)}
        onToggleHideMessages={handleToggleHideMessages}
      />
    </View>
  );
}

/**
 * Styles defined outside the component to prevent recreation on each render
 * This is a performance optimization as StyleSheet.create is expensive
 */
const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  pageContainerSmartphonePortrait: {
    paddingHorizontal: 4,
  },
  configContainer: {
    backgroundColor: COLORS.gray850,
    borderRadius: SIZES.borderRadius.xLarge,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginHorizontal: 15,
    alignSelf: 'center',
    marginVertical: 12,
    width: '95%',
  },
  configContainerSmartphone: {
    marginVertical: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  configContainerLandscape: {
    marginHorizontal: 50,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftContent: {
    flex: 1,
  },
  text: {
    color: COLORS.gray600,
    fontSize: SIZES.fonts.textTablet,
    fontWeight: SIZES.fontWeight.regular,
  },
  textSmartphone: {
    fontSize: SIZES.fonts.textSmartphone,
  },
  baseToggle: {
    backgroundColor: COLORS.gray650,
    borderRadius: SIZES.borderRadius.small,
    padding: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  customHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  backButton: {
    marginRight: 15,
    marginTop: 10,
  },
  titleContainer: {
    marginHorizontal: 35,
    marginTop: 12,
  },
  title: {
    color: COLORS.gray300,
    fontFamily: FONTS.medium,
    fontSize: SIZES.fonts.smallTextTablet,
  },
  titleSmartphone: {
    fontSize: SIZES.fonts.smallTextSmartphone,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.gray700,
    marginVertical: 12,
  },
});
