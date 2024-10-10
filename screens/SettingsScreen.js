import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, BackHandler } from 'react-native';
import Header from '../components/Header';
import TitleSettings from '../components/text/TitleSettings';
import SettingsButton from '../components/buttons/SettingsButton';
import Toggle from '../components/Toggle';
import HorizontalLine from '../components/HorizontalLine';
import Ionicons from '@expo/vector-icons/Ionicons';
import Feather from '@expo/vector-icons/Feather';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Octicons from '@expo/vector-icons/Octicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
// import { useNavigation } from '@react-navigation/native';
import TimerModal from '../components/modals/TimerModal';
// import { getDrawerScreens } from '../components/drawers/DrawerNavigator'; // Import the function to get drawer screens
// import { useUrls } from '../context/UrlContext';
import PasswordModal from '../components/modals/PasswordModal';

export default function SettingsScreen({ onNavigate }) {

  // const navigation = useNavigation();
  // const { urls, titles } = useUrls(); // Get URLs and titles from context
  // const screens = Array.isArray(urls) ? getDrawerScreens(urls, titles).map(screen => screen.name) : []; // Extract screen names

  const [isEnabled, setIsEnabled] = useState(false);
  // const [accessText, setAccessText] = useState('Read-only access');
  const [modalVisible, setModalVisible] = useState(false);
  const [isPasswordModalVisible, setPasswordModalVisible] = useState(false);


  const toggleSwitch = () => {
    setIsEnabled((previousState) => !previousState);
    // setAccessText((previousState) => previousState === 'Read-only access' ? 'Write access' : 'Read-only access');
  };

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

  return (
    <ScrollView>
      <View style={styles.container}>
        <Header 
          title="SETTINGS" 
          onBackPress={() => navigation.navigate('Home')} />
        <View>
          <TitleSettings title="GENERAL" />
          <SettingsButton
            title="Quit app"
            icon={<MaterialIcons name="exit-to-app" size={24} color="black" />}
            onPress={handleQuitApp}
          />
          <HorizontalLine />
          <TitleSettings title="CHANNELS MANAGEMENT" />
          <View style={styles.configContainer}>
            <SettingsButton
              title="Channels Management"
              icon={<Octicons name="tools" size={24} color="black" />}
              onPress={() => onNavigate('ChannelsManagementScreen')}
            />
            <Toggle 
              isEnabled={isEnabled}
              toggleSwitch={toggleSwitch}
            />
          </View>
          {/* <Text style={styles.text}>{accessText}</Text> */}
          <View style={styles.configContainer}>
          </View>
          <SettingsButton
            title="Auto-refresh"
            icon={<MaterialCommunityIcons name="reload" size={24} color="black" />}
          />
          <Text style={styles.text}>Never</Text>
          <SettingsButton
            title="View channels list"
            icon={<Ionicons name="list" size={24}/>} 
          />
          <HorizontalLine />
          <TitleSettings title="SECURITY" />
          <SettingsButton
            title="Password"
            icon={<Feather name="lock" size={24} />}
            onPress={openPasswordModal}
          />
          <Text style={styles.text}>No password has been defined</Text>
          <HorizontalLine />
          <TitleSettings title="INFORMATION" />
        </View>
      </View>
      <TimerModal visible={modalVisible} onClose={closeModal} />
      <PasswordModal visible={isPasswordModalVisible} onClose={closePasswordModal} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 30,
  },
  text: {
    paddingLeft: 45,
    marginLeft: 30,
    marginTop: 5,
    fontSize: 14,
    color: "#6E7280",
  },
  configContainer: {
    flexDirection: 'row',
  },
});