import React, { useState, memo } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import ImportWebviewModal from '../../components/modals/webviews/ImportWebviewModal';
import EditWebviewModal from '../../components/modals/webviews/EditWebviewModal';
import DeleteWebviewModal from '../../components/modals/webviews/DeleteWebviewModal';
import AntDesign from '@expo/vector-icons/AntDesign';
import EvilIcons from '@expo/vector-icons/EvilIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '../../components/text/CustomText';
import { useDeviceType } from '../../hooks/useDeviceType';
import { SIZES, COLORS } from '../../constants/style';
import { SCREENS } from '../../constants/screens';
import Entypo from '@expo/vector-icons/Entypo';
import { useTranslation } from 'react-i18next';

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

// We create a separate component for each webview
const WebviewItem = memo(({
  channel,
  index,
  isSmartphone,
  onNavigateToWebview,
  renderControls,
  isReadOnly
}) => {
  return (
    <View
      testID={`webview-container-${index}`}
      style={[
        styles.channelContainer,
        isSmartphone && styles.channelContainerSmartphone,
      ]}
    >
      <Pressable
        testID={`webview-item-${index}`}
        style={[
          styles.titleContainer,
          isSmartphone && styles.titleContainerSmartphone,
        ]}
        onPress={() => onNavigateToWebview(channel.href)}
      >
        <Text
          style={[
            styles.text,
            isSmartphone && styles.textSmartphone,
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {channel.title}
        </Text>
      </Pressable>

      {!isReadOnly && renderControls(channel, index)}
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function to avoid unnecessary re-renders
  return (
    prevProps.channel.href === nextProps.channel.href &&
    prevProps.channel.title === nextProps.channel.title &&
    prevProps.index === nextProps.index &&
    prevProps.isSmartphone === nextProps.isSmartphone &&
    prevProps.isTablet === nextProps.isTablet &&
    prevProps.isReadOnly === nextProps.isReadOnly
  );
});

/**
 * @component WebviewsManagementScreen
 * @description Allows displaying, editing, deleting and reordering webviews
 * @param {Function} onNavigate - A function to navigate to a screen
 * @param {Array} selectedWebviews - The list of selected channels
 * @param {Function} setSelectedWebviews - A function to set the selected channels
 */
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

  // Translation
  const { t } = useTranslation();

  // Customized hook to determine the device type and orientation
  const { isTablet, isSmartphone } = useDeviceType();

  // Réduire le nombre d'états
  const [modals, setModals] = useState({
    import: false,
    edit: false,
    delete: false
  });
  const [activeWebview, setActiveWebview] = useState(null);
  const [indices, setIndices] = useState([...Array(selectedWebviews.length).keys()]);

  // Simplifier la gestion des modales
  const toggleModal = (modalType, webview = null) => {
    setModals(prev => ({ ...prev, [modalType]: !prev[modalType] }));
    setActiveWebview(webview);
  };

  // Optimiser les fonctions de mouvement
  const moveWebview = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= indices.length) return;

    const newIndices = [...indices];
    [newIndices[index], newIndices[newIndex]] = [newIndices[newIndex], newIndices[index]];
    setIndices(newIndices);
  };

  /**
   * @function handleDelete
   * @description Handles the deletion of a webview
   */
  const handleDelete = async () => {
    if (!activeWebview) return;

    const updatedWebviews = selectedWebviews.filter(
      channel => channel.href !== activeWebview.href
    );
    setSelectedWebviews(updatedWebviews);
    saveSelectedWebviews(updatedWebviews);
    toggleModal('delete');
  };

  /**
   * @function handleEdit
   * @description Handles the editing of a webview
   */
  const handleEdit = async (newUrl, newTitle) => {
    if (!activeWebview) return;

    const updatedWebviews = selectedWebviews.map(channel =>
      channel.href === activeWebview.href
        ? { ...channel, href: newUrl, title: newTitle }
        : channel
    );
    setSelectedWebviews(updatedWebviews);
    await saveSelectedWebviews(updatedWebviews);
    toggleModal('edit');
  };

  /**
   * @function renderControls
   * @description Renders the controls for a webview to move it up or down, edit it or delete it
   */
  const renderControls = (channel, index) => (
    <View style={[styles.controlsContainer, isSmartphone && styles.controlsContainerSmartphone]}>
      <View style={[styles.arrowContainer, isSmartphone && styles.arrowContainerSmartphone]}>
        <Pressable
          testID={`move-up-${index}`}
          onPress={() => moveWebview(index, 'up')}
          style={styles.arrowButton}
        >
          <AntDesign
            name="up"
            size={isTablet ? 30 : 23}
            color={COLORS.gray300}
          />
        </Pressable>
        <Pressable
          testID={`move-down-${index}`}
          onPress={() => moveWebview(index, 'down')}
          style={styles.arrowButton}
        >
          <AntDesign
            name="down"
            size={isTablet ? 30 : 23}
            color={COLORS.gray300}
          />
        </Pressable>
      </View>

      <View style={[styles.iconsContainer, isSmartphone && styles.iconsContainerSmartphone]}>
        <Pressable
          testID={`edit-button-${index}`}
          onPress={() => toggleModal('edit', channel)}
          style={styles.iconButton}
        >
          <EvilIcons
            name="pencil"
            size={isTablet ? 40 : 29}
            color={COLORS.gray300}
          />
        </Pressable>
        <Pressable
          testID={`delete-button-${index}`}
          onPress={() => toggleModal('delete', channel)}
          style={styles.iconButton}
        >
          <Ionicons
            name="trash-outline"
            size={isTablet ? 30 : 23}
            color={COLORS.gray300}
          />
        </Pressable>
      </View>
    </View>
  );

  /**
   * @function handleClose
   * @description Handles the closing of the webviews management screen
   */
  const handleClose = async () => {
    try {
      // Reorder the webviews according to the indices
      const reorderedWebviews = indices.map(i => selectedWebviews[i]);

      // Save in the state and SecureStore
      setSelectedWebviews(reorderedWebviews);
      await saveSelectedWebviews(reorderedWebviews);

      // Navigate to Settings
      onNavigate(SCREENS.SETTINGS);
    } catch (error) {
      throw new Error(t('errors.saveOrder'));
    }
  };

  return (
    <View style={styles.pageContainer}>
      <View style={styles.customHeaderContainer}>
        <TouchableOpacity
          testID="back-button"
          onPress={handleClose}
        >
          <Ionicons
            name="close-outline"
            size={isSmartphone ? 24 : 28}
            color={COLORS.white}
          />
        </TouchableOpacity>
        {!isReadOnly && (
          <TouchableOpacity
            testID="import-button"
            onPress={() => toggleModal('import')}
          >
            <Entypo
              name="add-to-list"
              size={isSmartphone ? 24 : 28}
              color={COLORS.white}
            />
          </TouchableOpacity>
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

      <ScrollView>
        <View style={styles.channelsContainer}>
          {indices.map((originalIndex, currentIndex) => {
            const channel = selectedWebviews[originalIndex];
            return (
              <WebviewItem
                key={channel.href}
                channel={channel}
                index={currentIndex}
                isSmartphone={isSmartphone}
                isTablet={isTablet}
                onNavigateToWebview={onNavigateToWebview}
                renderControls={renderControls}
                isReadOnly={isReadOnly}
              />
            );
          })}
        </View>
      </ScrollView>

      <ImportWebviewModal
        visible={modals.import}
        onClose={() => toggleModal('import')}
        onImport={onImport}
        testID={testID}
        selectedWebviews={selectedWebviews}
      />

      <EditWebviewModal
        testID={testID}
        visible={modals.edit}
        onClose={() => toggleModal('edit')}
        initialUrl={activeWebview?.href}
        initialTitle={activeWebview?.title}
        onSave={handleEdit}
      />

      <DeleteWebviewModal
        testID={testID}
        visible={modals.delete}
        onClose={() => toggleModal('delete')}
        handleDelete={handleDelete}
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
  headerSmartphone: {
    fontSize: SIZES.fonts.headerSmartphone,
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
    marginRight: 40,
    gap: 15,
  },
  arrowContainerSmartphone: {
    marginRight: 15,
    gap: 10,
  },
  arrowButton: {
    padding: 5,
  },
  iconsContainer: {
    flexDirection: 'row',
    marginRight: 50,
    height: 45,
    width: 120,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
  },
  iconsContainerSmartphone: {
    marginRight: 10,
    height: 40,
    width: 100,
    gap: 15,
  },
  iconButton: {
    padding: 8,
    minWidth: 44,
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
  customHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
    paddingHorizontal: '2%',
  },
});
