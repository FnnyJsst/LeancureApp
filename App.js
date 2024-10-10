import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
// import { NavigationContainer } from '@react-navigation/native';
// import { createStackNavigator } from '@react-navigation/stack';
// import { SafeAreaProvider } from 'react-native-safe-area-context';
// import DrawerNavigator from './components/drawers/DrawerNavigator';
import ScreenSaver from './screens/ScreenSaver';
// import { UrlProvider } from './context/UrlContext';
import ParameterButton from './components/buttons/ParameterButton';
import SettingsScreen from './screens/SettingsScreen';
import NoUrlScreen from './screens/NoUrlScreen';
import ChannelsManagementScreen from './screens/ChannelsManagementScreen';
// const Stack = createStackNavigator();

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('NoUrlScreen');
  const [isLoading, setIsLoading] = useState(true);


  const navigateToSettings = () => {
    setCurrentScreen('SettingsScreen');
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <ScreenSaver />
    );
  }

  return (
    // <NavigationContainer>
    //   <Stack.Navigator initialRouteName="NoUrlScreen">
    //     <Stack.Screen name="NoUrlScreen" component={NoUrlScreen} />
    //     <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
    //   </Stack.Navigator>
    // </NavigationContainer>
    <View style={{ flex: 1 }}>
      {currentScreen === 'NoUrlScreen' && <NoUrlScreen onNavigate={navigateToSettings} />}
      {currentScreen === 'SettingsScreen' && <SettingsScreen onNavigate={setCurrentScreen} />}
      {currentScreen === 'ChannelsManagementScreen' && <ChannelsManagementScreen />}
  </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashImage: {
    width: 500,
    height: 230,
  },
  text: {
    fontSize: 20,
    color: 'black',
  },
});