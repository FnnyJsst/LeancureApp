import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { SCREENS } from '../../constants/screens';
import Header from '../../components/Header';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/style';
import { useDeviceType } from '../../hooks/useDeviceType';
import SettingsCard from '../../components/cards/SettingsCard';
import HideMessagesModal from '../../components/modals/common/HideMessagsModal';



const CommonSettings = ({ onBackPress, onHideMessages }) => {
    const { isSmartphone, isLandscape } = useDeviceType();

    const [hideMessages, setHideMessages] = useState(false);
    const [hideMessagesModalVisible, setHideMessagesModalVisible] = useState(false);

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
            onToggleHideMessages={setHideMessages}
          />
        </>
    );

};

const styles = StyleSheet.create({
  configContainer: {
    backgroundColor: COLORS.gray850,
    borderRadius: SIZES.borderRadius.xLarge,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginHorizontal: 15,
    alignSelf: 'center',
    marginVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.gray650,
    width: '95%',
  },
  configContainerSmartphone: {
    marginVertical: 8,
  },
  configContainerLandscape: {
    marginHorizontal: 50,
  },

});

export default CommonSettings;
