import React, { useState, useCallback, useMemo, memo } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import ImportWebviewModal from '../../components/modals/webviews/ImportWebviewModal';
import ImportFullUrlModal from '../../components/modals/webviews/ImportFullUrlModal';
import EditWebviewModal from '../../components/modals/webviews/EditWebviewModal';
import DeleteWebviewModal from '../../components/modals/webviews/DeleteWebviewModal';
import AntDesign from '@expo/vector-icons/AntDesign';
import EvilIcons from '@expo/vector-icons/EvilIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as SecureStore from 'expo-secure-store';
import { Text } from '../../components/text/CustomText';
import { useDeviceType } from '../../hooks/useDeviceType';
import { SIZES, COLORS } from '../../constants/style';
import { SCREENS } from '../../constants/screens';
import { useTranslation } from 'react-i18next';
import { handleError, ErrorType } from '../../utils/errorHandling';

/**
 * @component WebviewsManagementScreen
 * @description Allows displaying, editing, deleting and reordering webviews
 * @param {Function} onNavigate - A function to navigate to a screen
 * @param {Array} selectedWebviews - The list of selected channels
 * @param {Function} setSelectedWebviews - A function to set the selected channels
 * @param {Function} saveSelectedWebviews - A function to save the selected channels
 * @param {boolean} isReadOnly - A boolean to indicate if the user is read only
 * @param {Function} onNavigateToWebview - A function to navigate to a webview
 * @param {Function} onImport - A function to import channels
 */

// Composant WebviewItem mémorisé
const WebviewItem = memo(({
  channel,
  index,
  isReadOnly,
  isSmartphone,
  isTablet,
  isSmartphonePortrait,
  isLandscape,
  onNavigateToWebview,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
  selectedTitleId,
  selectedUpIndex,
  selectedDownIndex,
  selectedPencilIndex,
  selectedBinIndex,
  setSelectedTitleId,
  setSelectedUpIndex,
  setSelectedDownIndex,
  setSelectedPencilIndex,
  setSelectedBinIndex
}) => {
  // Styles memoized to avoid unnecessary recalculations
  const containerStyle = useMemo(() => [
    styles.channelContainer,
    isSmartphone && styles.channelContainerSmartphone,
  ], [isSmartphone]);

  const titleContainerStyle = useMemo(() => [
    styles.titleContainer,
    isSmartphone && styles.titleContainerSmartphone,
  ], [isSmartphone]);

  const textStyle = useMemo(() => [
    styles.text,
    isSmartphone && styles.textSmartphone,
    selectedTitleId === channel.href && styles.textSelected,
  ], [isSmartphone, selectedTitleId, channel.href]);

  const controlsContainerStyle = useMemo(() => [
    styles.controlsContainer,
    isSmartphone && styles.controlsContainerSmartphone,
  ], [isSmartphone]);

  const arrowContainerStyle = useMemo(() => [
    styles.arrowContainer,
    isSmartphone && styles.arrowContainerSmartphone,
  ], [isSmartphone]);

  const iconsContainerStyle = useMemo(() => [
    styles.iconsContainer,
    isSmartphone && styles.iconsContainerSmartphone,
    isLandscape && styles.iconsContainerLandscape,
  ], [isSmartphone, isLandscape]);

  // Memoization of callbacks to avoid unnecessary re-renders
  const handlePressIn = useCallback(() => {
    setSelectedTitleId(channel.href);
  }, [channel.href, setSelectedTitleId]);

  const handlePressOut = useCallback(() => {
    setSelectedTitleId(null);
  }, [setSelectedTitleId]);

  const handleMoveUpPress = useCallback(() => {
    onMoveUp(index);
  }, [onMoveUp, index]);

  const handleMoveDownPress = useCallback(() => {
    onMoveDown(index);
  }, [onMoveDown, index]);

  const handleEditPress = useCallback(() => {
    onEdit(channel);
  }, [onEdit, channel]);

  const handleDeletePress = useCallback(() => {
    onDelete(channel);
  }, [onDelete, channel]);

  return (
    <View
      testID={`webview-container-${index}`}
      style={containerStyle}
    >
      <TouchableOpacity
        testID={`webview-item-${index}`}
        style={titleContainerStyle}
        onPress={() => onNavigateToWebview(channel.href)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Text
          style={textStyle}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {channel.title}
        </Text>
      </TouchableOpacity>

      {!isReadOnly && (
        <View style={controlsContainerStyle}>
          <View style={arrowContainerStyle}>
            <TouchableOpacity
              testID={`move-up-${index}`}
              onPress={handleMoveUpPress}
              onPressIn={() => setSelectedUpIndex(index)}
              onPressOut={() => setSelectedUpIndex(null)}
              style={styles.arrowButton}
            >
              <AntDesign
                name="up"
                size={isTablet ? 30 : 23}
                style={[
                  { marginRight: isSmartphonePortrait ? 0 : 15 },
                  { color: selectedUpIndex === index ? COLORS.orange : COLORS.gray300 },
                ]}
              />
            </TouchableOpacity>
            <TouchableOpacity
              testID={`move-down-${index}`}
              onPress={handleMoveDownPress}
              onPressIn={() => setSelectedDownIndex(index)}
              onPressOut={() => setSelectedDownIndex(null)}
              style={styles.arrowButton}
            >
              <AntDesign
                name="down"
                size={isTablet ? 30 : 23}
                style={[
                  { marginLeft: isSmartphonePortrait ? 0 : 15 },
                  { marginRight: isSmartphonePortrait ? 0 : 15 },
                  { color: selectedDownIndex === index ? COLORS.orange : COLORS.gray300 },
                ]}
              />
            </TouchableOpacity>
          </View>

          <View style={iconsContainerStyle}>
            <TouchableOpacity
              testID={`edit-button-${index}`}
              onPress={handleEditPress}
              onPressIn={() => setSelectedPencilIndex(index)}
              onPressOut={() => setSelectedPencilIndex(null)}
              style={styles.iconButton}
            >
              <EvilIcons
                name="pencil"
                size={isTablet ? 40 : 29}
                style={[
                  { marginRight: isSmartphonePortrait ? 0 : 15 },
                  { color: isTablet && selectedPencilIndex === index ? COLORS.orange : COLORS.gray300 },
                ]}
              />
            </TouchableOpacity>
            <TouchableOpacity
              testID={`delete-button-${index}`}
              onPress={handleDeletePress}
              onPressIn={() => setSelectedBinIndex(index)}
              onPressOut={() => setSelectedBinIndex(null)}
              style={styles.iconButton}
            >
              <Ionicons
                name="trash-outline"
                size={isTablet ? 30 : 23}
                style={{ color: selectedBinIndex === index ? COLORS.orange : COLORS.gray300 }}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
});

// Memoized modals components
const MemoizedImportFullUrlModal = memo(ImportFullUrlModal);
const MemoizedImportWebviewModal = memo(ImportWebviewModal);
const MemoizedEditWebviewModal = memo(EditWebviewModal);
const MemoizedDeleteWebviewModal = memo(DeleteWebviewModal);

export default function WebviewsManagementScreen({
  onNavigate,
  selectedWebviews,
  setSelectedWebviews,
  saveSelectedWebviews,
  isReadOnly,
  onNavigateToWebview,
  onImport,
  testID,
}) {

  //Translation and device type hooks
  const { t } = useTranslation();
  const { isTablet, isSmartphone, isSmartphonePortrait, isLandscape } = useDeviceType();

  // Group all modal states in a single object
  const [modalState, setModalState] = useState({
    import: false,
    importFullUrl: false,
    edit: false,
    delete: false,
    webviewToEdit: null,
    webviewToDelete: null
  });

  // Group all selection states in a single object
  const [selectionState, setSelectionState] = useState({
    titleId: null,
    pencilIndex: null,
    binIndex: null,
    upIndex: null,
    downIndex: null
  });

  // Function to update the modal state
  const updateModalState = useCallback((key, value) => {
    setModalState(prev => ({ ...prev, [key]: value }));
  }, []);

  // Function to update the selection state
  const updateSelectionState = useCallback((key, value) => {
    setSelectionState(prev => ({ ...prev, [key]: value }));
  }, []);

  // Memoized modal management functions
  const handleOpenModal = useCallback((modalType) => {
    updateModalState(modalType, true);
  }, [updateModalState]);

  const handleCloseModal = useCallback((modalType) => {
    updateModalState(modalType, false);
    if (modalType === 'edit') {
      updateModalState('webviewToEdit', null);
    } else if (modalType === 'delete') {
      updateModalState('webviewToDelete', null);
    }
  }, [updateModalState]);

  const handleEdit = useCallback((channel) => {
    updateModalState('webviewToEdit', channel);
    updateModalState('edit', true);
  }, [updateModalState]);

  const handleDelete = useCallback((channel) => {
    updateModalState('webviewToDelete', channel);
    updateModalState('delete', true);
  }, [updateModalState]);

  // Memoized webviews management functions
  const handleDeleteWebview = useCallback(async (webviewToDelete) => {
    if (webviewToDelete) {
      try {
        // Filtrer les webviews pour ne garder que celles qui ne sont pas à supprimer
        const updatedWebviews = selectedWebviews.filter(
          webview => webview.href !== webviewToDelete.href
        );

        // Mettre à jour l'état local
        setSelectedWebviews(updatedWebviews);

        // Sauvegarder uniquement les données essentielles avec une taille limitée
        const simplifiedWebviews = updatedWebviews.map(webview => ({
          href: (webview.href || '').substring(0, 100),
          title: (webview.title || '').substring(0, 50)
        }));

        // Sauvegarder les webviews simplifiées
        await saveSelectedWebviews(simplifiedWebviews);

        // Fermer la modal
        handleCloseModal('delete');
      } catch (error) {
        handleError(error, t('errors.errorDeletingWebview'), {
          type: ErrorType.SYSTEM,
          silent: false
        });
      }
    }
  }, [selectedWebviews, setSelectedWebviews, saveSelectedWebviews, handleCloseModal, t]);

  // Memoized item rendering
  const renderItem = useCallback(({ item, index }) => (
    <WebviewItem
      channel={item}
      index={index}
      isReadOnly={isReadOnly}
      isSmartphone={isSmartphone}
      isTablet={isTablet}
      isSmartphonePortrait={isSmartphonePortrait}
      isLandscape={isLandscape}
      onNavigateToWebview={onNavigateToWebview}
      onMoveUp={handleMoveUp}
      onMoveDown={handleMoveDown}
      onEdit={handleEdit}
      onDelete={handleDelete}
      selectedTitleId={selectionState.titleId}
      selectedUpIndex={selectionState.upIndex}
      selectedDownIndex={selectionState.downIndex}
      selectedPencilIndex={selectionState.pencilIndex}
      selectedBinIndex={selectionState.binIndex}
      setSelectedTitleId={(value) => updateSelectionState('titleId', value)}
      setSelectedUpIndex={(value) => updateSelectionState('upIndex', value)}
      setSelectedDownIndex={(value) => updateSelectionState('downIndex', value)}
      setSelectedPencilIndex={(value) => updateSelectionState('pencilIndex', value)}
      setSelectedBinIndex={(value) => updateSelectionState('binIndex', value)}
    />
  ), [
    isReadOnly,
    isSmartphone,
    isTablet,
    isSmartphonePortrait,
    isLandscape,
    onNavigateToWebview,
    handleMoveUp,
    handleMoveDown,
    handleEdit,
    handleDelete,
    selectionState,
    updateSelectionState
  ]);

  // Memoized key extraction function
  const keyExtractor = useCallback((item, index) => `${item.href}-${index}`, []);

  /**
   * @function isDuplicate
   * @description Checks for duplicates
   * @param {Object} newWebview - The new webview
   * @returns {boolean} True if the webview is a duplicate, false otherwise
   */
  const isDuplicate = useCallback((newWebview) => {
    return selectedWebviews.some(webview => webview.href === newWebview.href);
  }, [selectedWebviews]);

  /**
   * @function handleImport
   * @description Handles the import of webviews
   * @param {Object} newWebviews - The new webviews
   */
  const handleImport = useCallback(async (newWebviews) => {
    try {
      // If it's a direct URL
      if (typeof newWebviews === 'string') {
        const webview = { href: newWebviews, title: newWebviews };

        // If the webview is not a duplicate
        if (!isDuplicate(webview)) {
          const updatedWebviews = [...selectedWebviews, webview];
          setSelectedWebviews(updatedWebviews);
          await saveSelectedWebviews(updatedWebviews);
        }
      }
      // If it's an array of webviews
      else if (Array.isArray(newWebviews)) {
        const uniqueWebviews = newWebviews.filter(webview => !isDuplicate(webview));
        if (uniqueWebviews.length > 0) {
          const updatedWebviews = [...selectedWebviews, ...uniqueWebviews];
          setSelectedWebviews(updatedWebviews);
          await saveSelectedWebviews(updatedWebviews);
        }
      }
    } catch (err) {
      handleError(err, i18n.t('errors.errorDuringImport'), {
        type: ErrorType.SYSTEM,
        silent: false
      });
    }
  }, [selectedWebviews, setSelectedWebviews, saveSelectedWebviews, isDuplicate]);

  /**
   * @function handleEditWebviewModal
   * @description Edits a channel name and/or url
   * @param {Object} oldChannel - The old channel
   * @param {string} newUrl - The new url
   * @param {string} newTitle - The new title
   */
  const handleEditWebviewModal = async (oldChannel, newUrl, newTitle) => {
    try {
      // Create a copy of the selected channels
      const updatedWebviews = selectedWebviews.map(channel => {
        // Check if the channel href is the same as the old channel href
        if (channel.href === oldChannel.href) {
          return { ...channel, href: newUrl, title: newTitle };
        }
        return channel;
      });
      // Set and save the updated channels
      setSelectedWebviews(updatedWebviews);
      await saveSelectedWebviews(updatedWebviews);
    } catch (err) {
      handleError(err, i18n.t('errors.errorEditingWebview'), {
        type: ErrorType.SYSTEM,
        silent: false
      });
    }
  };

  /**
  *@function handleMoveUp
  *@description Handles the move up of a webview
  *@param {number} index - The index of the webview
  */
  const handleMoveUp = useCallback(async (index) => {
    if (index > 0) {
      try {
        const updatedWebviews = [...selectedWebviews];
        const temp = updatedWebviews[index - 1];
        updatedWebviews[index - 1] = updatedWebviews[index];
        updatedWebviews[index] = temp;

        // Mettre à jour l'état local immédiatement
        setSelectedWebviews(updatedWebviews);

        // Sauvegarder uniquement les données essentielles avec une taille limitée
        const simplifiedWebviews = updatedWebviews.map(webview => ({
          href: (webview.href || '').substring(0, 100),
          title: (webview.title || '').substring(0, 50)
        }));

        // Utiliser uniquement saveSelectedWebviews qui gère déjà SecureStore
        await saveSelectedWebviews(simplifiedWebviews);
      } catch (error) {
        handleError(error, t('errors.errorMovingWebview'), {
          type: ErrorType.SYSTEM,
          silent: false
        });
      }
    }
  }, [selectedWebviews, setSelectedWebviews, saveSelectedWebviews, t]);

  /**
  *@function handleMoveDown
  *@description Handles the move down of a webview
  *@param {number} index - The index of the webview
  */
  const handleMoveDown = useCallback(async (index) => {
    if (index < selectedWebviews.length - 1) {
      try {
        const updatedWebviews = [...selectedWebviews];
        const temp = updatedWebviews[index + 1];
        updatedWebviews[index + 1] = updatedWebviews[index];
        updatedWebviews[index] = temp;

        // Mettre à jour l'état local immédiatement
        setSelectedWebviews(updatedWebviews);

        // Sauvegarder uniquement les données essentielles avec une taille limitée
        const simplifiedWebviews = updatedWebviews.map(webview => ({
          href: (webview.href || '').substring(0, 100),
          title: (webview.title || '').substring(0, 50)
        }));

        // Utiliser uniquement saveSelectedWebviews qui gère déjà SecureStore
        await saveSelectedWebviews(simplifiedWebviews);
      } catch (error) {
        handleError(error, t('errors.errorMovingWebview'), {
          type: ErrorType.SYSTEM,
          silent: false
        });
      }
    }
  }, [selectedWebviews, setSelectedWebviews, saveSelectedWebviews, t]);

  return (
    <View style={styles.pageContainer}>
      <View style={styles.customHeaderContainer}>
        <TouchableOpacity
          testID="back-button"
          onPress={() => onNavigate(SCREENS.SETTINGS)}
        >
          <Ionicons
            name="close-outline"
            size={isSmartphone ? 26 : 34}
            color={COLORS.white}
          />
        </TouchableOpacity>
        {!isReadOnly && (
          <View style={styles.headerIconsContainer}>
            <TouchableOpacity
              testID="add-button"
              onPress={() => handleOpenModal('importFullUrl')}
            >
              <AntDesign
                name="plus"
                size={isSmartphone ? 22 : 32}
                color={COLORS.white}
                style={{ marginRight: isSmartphone ? 40 : 50 }}
              />
            </TouchableOpacity>
            <TouchableOpacity
              testID="import-button"
              onPress={() => handleOpenModal('import')}
            >
              <AntDesign
                name="bars"
                size={isSmartphone ? 22 : 32}
                color={COLORS.white}
                style={{ marginRight: 10 }}

              />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {selectedWebviews.length === 0 && (
        <Text style={[
          styles.addChannelText,
          isSmartphone && styles.addChannelTextSmartphone,
        ]}>
          {t('screens.useButton')}
        </Text>
      )}

      {/* Modals */}
      <MemoizedImportFullUrlModal
        visible={modalState.importFullUrl}
        onClose={() => handleCloseModal('importFullUrl')}
        onImport={handleImport}
      />
      <MemoizedImportWebviewModal
        visible={modalState.import}
        onClose={() => handleCloseModal('import')}
        onImport={handleImport}
        selectedWebviews={selectedWebviews}
        testID={testID}
      />
      <MemoizedEditWebviewModal
        testID={testID}
        visible={modalState.edit}
        onClose={() => handleCloseModal('edit')}
        initialUrl={modalState.webviewToEdit?.href}
        initialTitle={modalState.webviewToEdit?.title}
        onSave={(newUrl, newTitle) => handleEditWebviewModal(modalState.webviewToEdit, newUrl, newTitle)}
      />
      <MemoizedDeleteWebviewModal
        testID={testID}
        visible={modalState.delete}
        onClose={() => handleCloseModal('delete')}
        handleDelete={() => handleDeleteWebview(modalState.webviewToDelete)}
      />

      {/* List of channels */}
      <FlatList
        data={selectedWebviews}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.channelsContainer}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        getItemLayout={(data, index) => ({
          length: isSmartphone ? 65 : 75,
          offset: (isSmartphone ? 65 : 75) * index,
          index,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    paddingHorizontal: '1%',
  },
  headerContainer: {
    alignSelf: 'flex-start',
    marginBottom: 20,
    marginTop: 20,
    marginLeft: 30,
  },
  header: {
    color: COLORS.white,
    fontSize: SIZES.fonts.headerTablet,
    fontWeight: SIZES.fontWeight.semibold,
  },
  channelsContainer: {
    marginTop: 10,
    alignItems: 'center',
    paddingBottom: 20,
  },
  channelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 15,
    backgroundColor: COLORS.gray850,
    height: 75,
    width: '95%',
    borderRadius: SIZES.borderRadius.xLarge,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
  },
  channelContainerSmartphone: {
    width: '100%',
    height: 65,
    marginVertical: 10,
  },
  titleContainer: {
    flex: 0.85,
    paddingLeft: 50,
  },
  titleContainerSmartphone: {
    paddingLeft: 15,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: '2%',
  },
  controlsContainerSmartphone: {
    flex: 0.55,
    paddingRight: 5,
    justifyContent: 'flex-end',
  },
  arrowContainer: {
    flexDirection: 'row',
    marginRight: 30,
  },
  arrowContainerSmartphone: {
    marginRight: 5,
  },
  arrowButton: {
    padding: 5,
  },
  iconsContainer: {
    flexDirection: 'row',
    marginRight: 10,
    height: 45,
    width: 90,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconsContainerLandscape: {
    marginRight: 50,
  },
  iconsContainerSmartphone: {
    marginRight: 0,
    height: 40,
    width: 80,
  },
  iconButton: {
    padding: 5,
    minWidth: 40,
  },
  text: {
    color: COLORS.gray300,
    fontSize: SIZES.fonts.subtitleTablet,
  },
  textSmartphone: {
    fontSize: SIZES.fonts.subtitleSmartphone,
  },
  addChannelText: {
    color: COLORS.gray300,
    fontSize: SIZES.fonts.subtitleTablet,
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  addChannelTextSmartphone: {
    fontSize: SIZES.fonts.biggerTextSmartphone,
  },
  textSelected: {
    color: COLORS.orange,
  },
  customHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    marginBottom: 5,
    marginTop: 20,
    paddingHorizontal: '2%',
  },
  errorText: {
    color: COLORS.red,
    textAlign: 'center',
    marginVertical: 10,
    fontSize: SIZES.fonts.textTablet,
  },
  headerIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
