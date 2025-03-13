import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useDeviceType } from '../../hooks/useDeviceType';
import { COLORS, SIZES } from '../../constants/style';
import Button from '../../components/buttons/Button';
import CheckBox from '../../components/inputs/CheckBox';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../components/text/CustomText';
import { useTranslation } from 'react-i18next';

/**
 * @component WebviewsListScreen
 * @description This screen displays the list of channels available for the user to import
 * @param {Array} channels - The list of channels
 * @param {Array} selectedWebviews - The list of selected channels
 * @param {Function} onBack - A function to navigate to a screen
 * @param {Function} onBackPress - A function to navigate to a screen
 */
export default function WebviewsListScreen({
  channels,
  selectedWebviews,
  setSelectedWebviews,
  saveSelectedWebviews,
  onBack,
  onBackPress
}) {



  // Translation
  const { t } = useTranslation();

  // Customized hook to determine the device type and orientation
  const { isSmartphone, isSmartphonePortrait, isLandscape } = useDeviceType();


  // Mémoiser les canaux disponibles
  const availableChannels = useMemo(() => {
    return channels.filter(newChannel =>
      !selectedWebviews?.some(existingChannel =>
        existingChannel.href === newChannel.href
      )
    );
  }, [channels, selectedWebviews]);

  // État pour les sélections
  const [localSelectedChannels, setLocalSelectedChannels] = useState([]);

  // Mémoiser la fonction de toggle
  const toggleChannelSelection = useCallback((channel) => {
    setLocalSelectedChannels(prevSelected => {
      if (prevSelected.some(c => c.href === channel.href)) {
        return prevSelected.filter(c => c.href !== channel.href);
      } else {
        return [...prevSelected, channel];
      }
    });
  }, []);

  // Mémoiser la fonction d'import
  const handleImportWebviews = useCallback(async () => {
    try {
      if (localSelectedChannels.length > 0) {
        // Vérifier que selectedWebviews existe
        const currentWebviews = selectedWebviews || [];

        // Ajouter les nouvelles webviews aux webviews existantes
        const updatedWebviews = [...currentWebviews, ...localSelectedChannels];

        // Sauvegarder les webviews mises à jour
        await saveSelectedWebviews(updatedWebviews);
        setSelectedWebviews(updatedWebviews);

        // Retourner à l'écran précédent
        onBackPress();
      }
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
    }
  }, [localSelectedChannels, selectedWebviews, setSelectedWebviews, saveSelectedWebviews, onBackPress]);

  // Modifier le bouton pour gérer le loading state
  const [isImporting, setIsImporting] = useState(false);

  const handleImportPress = async () => {
    setIsImporting(true);
    try {
      await handleImportWebviews();
    } finally {
      setIsImporting(false);
    }
  };

  // Mémoiser le rendu de l'item
  const renderItem = useCallback(({ item }) => {
    const isSelected = localSelectedChannels.some(c => c.href === item.href);
    return (
      <ChannelItem
        item={item}
        isSelected={isSelected}
        onToggle={toggleChannelSelection}
        isSmartphone={isSmartphone}
      />
    );
  }, [localSelectedChannels, toggleChannelSelection, isSmartphone]);

  // Mémoiser la fonction keyExtractor
  const keyExtractor = useCallback((item) => item.href, []);

  const ChannelItem = memo(({ item, isSelected, onToggle, isSmartphone }) => {
    return (
      <TouchableOpacity
        style={[
          styles.channelContainer,
          isSmartphone && styles.channelContainerSmartphonePortrait,
        ]}
        onPress={() => onToggle(item)}
      >
        <CheckBox
          checked={isSelected}
          onPress={() => onToggle(item)}
          label={item.title}
          labelStyle={[
            styles.channelTitle,
            isSmartphone && styles.channelTitleSmartphone
          ]}
        />
      </TouchableOpacity>
    );
  });

  return (
    <View style={styles.pageContainer}>
      <View style={styles.customHeaderContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBackPress}
        >
          <Ionicons
            name="chevron-back"
            size={isSmartphone ? 24 : 28}
            color={COLORS.white}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('buttons.importChannels')}</Text>
      </View>
      <View style={[styles.listContainer, isLandscape && styles.listContainerLandscape]}>
        <FlatList
          data={availableChannels}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          getItemLayout={(data, index) => ({
            length: 60,
            offset: 60 * index,
            index,
          })}
        />
      </View>
      <View style={styles.buttonContainer}>
        <Button
          title={isImporting ? t('buttons.importing') : t('buttons.import')}
          variant="large"
          backgroundColor={COLORS.orange}
          color={COLORS.white}
          onPress={handleImportPress}
          width="80%"
          disabled={isImporting || localSelectedChannels.length === 0}
          icon={isImporting ?
            <ActivityIndicator
              size="small"
              color={COLORS.white}
              style={styles.spinner}
            /> :
            null
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
  },
  channelContainer: {
    flexDirection: 'row',
    marginHorizontal: 30,
    borderRadius: SIZES.borderRadius.large,
    padding: 10,
  },
  channelContainerSmartphonePortrait: {
    marginHorizontal: 5,
  },
  channelTitle: {
    fontSize: SIZES.fonts.subtitleTablet,
    textAlign: 'left',
    marginLeft: 10,
    color: COLORS.white,
  },
  channelTitleSmartphone: {
    fontSize: SIZES.fonts.biggerTextSmartphone,
  },
  listContainer: {
    flex: 1,
    padding: 15,
  },
  listContainerLandscape: {
    paddingHorizontal: 50,
  },
  buttonContainer: {
    bottom: 30,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  customHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 15,
    paddingHorizontal: 15,
  },
  backButton: {
    backgroundColor: '#271E1E',
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: SIZES.fonts.subtitleTablet,
    fontWeight: SIZES.fontWeight.semibold,
  },
  spinner: {
    marginLeft: 10,
  },
});
