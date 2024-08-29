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
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';
import TimerModal from '../components/modals/TimerModal';
import ChannelsList from '../components/modals/ChannelsList';
import { getDrawerScreens } from '../components/drawers/DrawerNavigator'; // Import the function to get drawer screens
import { useUrls } from '../context/UrlContext';

export default function SettingsScreen() {

  const navigation = useNavigation();
  const { urls, titles } = useUrls(); // Get URLs and titles from context
  const screens = getDrawerScreens(urls).map(screen => screen.name); // Extract screen names

  const [isEnabled, setIsEnabled] = useState(false);
  const [accessText, setAccessText] = useState('Read-only access');
  const [modalVisible, setModalVisible] = useState(false);
  const [ChannelsListVisible, setChannelsListVisible] = useState(false);

  const toggleSwitch = () => {
    setIsEnabled((previousState) => !previousState);
    setAccessText((previousState) => previousState === 'Read-only access' ? 'Write access' : 'Read-only access');
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

  const openChannelsListModal = () => setChannelsListVisible(true); 
  const closeCHannelsListModal = () => setChannelsListVisible(false); 

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
              title="Channels configuration"
              icon={<Octicons name="tools" size={24} color="black" />}
            />
            <Toggle 
              isEnabled={isEnabled}
              toggleSwitch={toggleSwitch}
            />
          </View>
          <Text style={styles.text}>{accessText}</Text>
          <View style={styles.configContainer}>
            <SettingsButton
              title="Access to the list of channels from the main interface"
              icon={<FontAwesome5 name="list-alt" size={24} color="black" />}
            />
            <Toggle />
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
            onPress={openChannelsListModal}
          />
          <HorizontalLine />
          <TitleSettings title="SECURITY" />
          <SettingsButton
            title="Password"
            icon={<Feather name="lock" size={24} />}
          />
          <Text style={styles.text}>No password has been defined</Text>
          <HorizontalLine />
          <TitleSettings title="INFORMATION" />
        </View>
      </View>
      <TimerModal visible={modalVisible} onClose={closeModal} />
      <ChannelsList visible={ChannelsListVisible} onClose={closeCHannelsListModal} screens={screens} titles={urls.map((url, index) => titles[index] || `WebView ${index + 1}`)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 30,
  },
  text: {
    fontFamily: 'Montserrat-medium',
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