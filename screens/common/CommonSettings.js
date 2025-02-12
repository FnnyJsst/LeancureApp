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

const CommonSettings = ({ onBackPress, onHideMessages, isMessagesHidden }) => {
    const { isSmartphone, isLandscape } = useDeviceType();
    const [hideMessagesModalVisible, setHideMessagesModalVisible] = useState(false);

    const handleToggleHideMessages = async (value) => {
        try {
            setHideMessagesModalVisible(false);
            await onHideMessages(value);
        } catch (error) {
            console.error('Erreur lors de la modification du paramètre:', error);
        }
    };

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
                            title="Show/hide messages"
                            iconBackgroundColor={COLORS.borderColor}
                            icon={
                                <Ionicons 
                                    name="remove-circle-outline" 
                                    size={isSmartphone ? 22 : 28} 
                                    color={COLORS.red} 
                                />
                            }
                            description="Show or hide the message section of the app"
                            onPress={() => setHideMessagesModalVisible(true)}
                        />
                    </View>
                    <TouchableOpacity 
                        style={styles.baseToggle} 
                        onPress={() => setHideMessagesModalVisible(true)}
                    >
                        <Text style={[styles.text, isSmartphone && styles.textSmartphone]}>
                            {isMessagesHidden ? 'Hide' : 'Show'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
            <HideMessagesModal
                visible={hideMessagesModalVisible}
                onClose={() => setHideMessagesModalVisible(false)}
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
