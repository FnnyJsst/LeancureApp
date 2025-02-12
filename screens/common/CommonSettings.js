import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '../../components/text/CustomText';
import { SCREENS } from '../../constants/screens';
import { FONTS } from '../../constants/style';
import Header from '../../components/Header';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/style';
import { useDeviceType } from '../../hooks/useDeviceType';
import SettingsCard from '../../components/cards/SettingsCard';
import HideMessagesModal from '../../components/modals/common/HideMessagesModal';
import * as SecureStore from 'expo-secure-store';

const CommonSettings = ({ onBackPress, onHideMessages }) => {
    const { isSmartphone, isLandscape } = useDeviceType();
    const [hideMessages, setHideMessages] = useState(false);
    const [hideMessagesModalVisible, setHideMessagesModalVisible] = useState(false);

    useEffect(() => {
        const loadHideMessagesState = async () => {
            try {
                const savedValue = await SecureStore.getItemAsync('isMessagesHidden');
                if (savedValue !== null) {
                    setHideMessages(JSON.parse(savedValue));
                }
            } catch (error) {
                console.error('Erreur lors du chargement du paramètre:', error);
            }
        };
        loadHideMessagesState();
    }, []);

    const handleToggleHideMessages = async (value) => {
        setHideMessages(value);
        try {
            await SecureStore.setItemAsync('isMessagesHidden', JSON.stringify(value));
        } catch (error) {
            console.error('Erreur lors de la sauvegarde du paramètre:', error);
        }
        closeHideMessagesModal();
    };

    const openHideMessagesModal = () => {
        setHideMessagesModalVisible(true);
    }

    const closeHideMessagesModal = () => {
        setHideMessagesModalVisible(false);
    }

    return (
        <>
          <Header 
            showBackButton={true}
            onBackPress={onBackPress}
          />
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Messages</Text>
          </View>
          <View style={[
            styles.configContainer,
            isSmartphone && styles.configContainerSmartphone,
            isLandscape && styles.configContainerLandscape
          ]}>
            <View style={styles.rowContainer}>
              <View style={styles.leftContent}>
                <SettingsCard
                    title="Hide messages"
                    iconBackgroundColor={COLORS.borderColor}
                    icon={
                        <Ionicons 
                          name="remove-circle-outline" 
                          size={isSmartphone ? 22 : 28} 
                          color={COLORS.red} 
                        />
                    }
                    description="Hide the message section of the app"
                    onPress={onHideMessages}
                  />
                </View>
                <TouchableOpacity 
                style={styles.baseToggle} 
                onPress={openHideMessagesModal}
              >
                  <Text style={[
                    styles.text,
                    isSmartphone && styles.textSmartphone 
                  ]}>
                  {hideMessages ? 'Yes' : 'No'}
                </Text>
              </TouchableOpacity>
              </View>
          </View>
          <HideMessagesModal
            visible={hideMessagesModalVisible}
            onClose={closeHideMessagesModal}
            onToggleHideMessages={handleToggleHideMessages}
          />
        </>
    );

};

const styles = StyleSheet.create({
  titleContainer: {
    marginHorizontal: 35,
    marginTop: 12,
  },
  title: {
    color: COLORS.gray300,
    fontFamily: FONTS.medium,
    fontSize: SIZES.fonts.smallTextTabletTablet,
  },
  configContainer: {
    backgroundColor: COLORS.gray850,
    borderRadius: SIZES.borderRadius.xLarge,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginHorizontal: 15,
    alignSelf: 'center',
    marginVertical: 12,
    borderWidth: 1,
    width: '95%',
  },
  configContainerSmartphone: {
    marginVertical: 8,
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

});

export default CommonSettings;
