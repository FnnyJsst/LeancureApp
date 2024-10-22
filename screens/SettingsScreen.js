import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, BackHandler } from 'react-native';
import Header from '../components/Header';
import TitleSettings from '../components/text/TitleSettings';
import SettingsButton from '../components/buttons/SettingsButton';
import Ionicons from '@expo/vector-icons/Ionicons';
import Feather from '@expo/vector-icons/Feather';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Octicons from '@expo/vector-icons/Octicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import TimerModal from '../components/modals/TimerModal';
import PasswordModal from '../components/modals/PasswordModal';

export default function SettingsScreen({ onNavigate, selectedChannels }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [isPasswordModalVisible, setPasswordModalVisible] = useState(false);

  const handleQuitApp = () => {
    BackHandler.exitApp();
  };

  const openModal = () => {
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const openPasswordModal = () => setPasswordModalVisible(true);
  const closePasswordModal = () => setPasswordModalVisible(false);

  const handleBackPress = () => {
    if (selectedChannels && selectedChannels.length > 0) {
      onNavigate('WebViewScreen');
    } else {
      onNavigate('NoUrlScreen');
    }
  };

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        <Header 
          title="SETTINGS" 
          onBackPress={handleBackPress} 
        />
        <View>
          <TitleSettings title="GENERAL" />
          <View style={[styles.configContainer, styles.generalContainer]}>
            <SettingsButton
              title="Quit app"
              icon={<MaterialIcons name="exit-to-app" size={24} color="black" />}
              onPress={handleQuitApp}
            />
          </View>
          <TitleSettings title="CHANNELS MANAGEMENT" />
          <View style={[styles.configContainer, styles.channelsContainer]}>
            <SettingsButton
              title="Channels Management"
              icon={<Octicons name="tools" size={24} color="black" />}
              onPress={() => onNavigate('ChannelsManagementScreen')}
            />
          
          <View style={styles.channelsContainer}>
          </View>
          <SettingsButton
            title="Auto-refresh"
            icon={<MaterialCommunityIcons name="reload" size={24} color="black" />}
            onPress={openModal}
          />
          <Text style={styles.text}>Never</Text>
          <SettingsButton
            title="View channels list"
            icon={<Ionicons name="list" size={24}/>} 
            onPress={() => onNavigate('ChannelsListScreen')}
          />
          </View>
          <TitleSettings title="SECURITY" />
          <View style={[styles.configContainer, styles.securityContainer]}>
            <SettingsButton
              title="Password"
              icon={<Feather name="lock" size={24} />}
              onPress={openPasswordModal}
            />
            <Text style={styles.text}>No password has been defined</Text>
          </View>
          <TitleSettings title="INFORMATION" />
        </View>
      </View>
      <TimerModal visible={modalVisible} onClose={closeModal} />
      <PasswordModal visible={isPasswordModalVisible} onClose={closePasswordModal} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: '#f0f0f5', 
  },
  container: {
    flex: 1,
    paddingTop: 30,
    paddingHorizontal: 20,
  },
  text: {
    paddingLeft: 45,
    marginLeft: 20,
    marginBottom: 10,
    fontSize: 14,
    color: "#6E7280",
  },
  configContainer: {
    backgroundColor: '#ebebeb',
    borderRadius: 20,
    width: '95%',
    marginLeft: 'auto', 
    marginRight: 'auto', 
    paddingVertical: 25,
  },
  generalContainer: {
    marginVertical: 10,
    height: 80,
  },
  channelsContainer: {
    marginVertical: 10,
  },
  securityContainer: {
    marginVertical: 10,
    height: 90,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});