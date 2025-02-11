import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import ParameterButton from '../../components/buttons/ParameterButton';
import { SCREENS } from '../../constants/screens';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/style';

const CommonSettings = () => {
    return (
        <View>
            <Text>CommonSettings</Text>
        </View>
    );

};

const styles = StyleSheet.create({

});

export default CommonSettings;
