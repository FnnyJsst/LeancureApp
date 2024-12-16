import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Login from './messages/Login';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../assets/styles/constants';

export default function AppMenu({ onNavigate }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome</Text>
      <TouchableOpacity 
        style={styles.menuItem} 
        onPress={() => onNavigate('Login')}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="mail-outline" style={styles.icon}/>
          <Text style={styles.menuText}>Messages</Text>
        </View>
      </TouchableOpacity>
      
      
        <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => onNavigate('WebViewsSection')}
        >
        <View style={styles.iconContainer}>
          <Ionicons name="tv-outline" style={styles.icon}/>
          <Text style={styles.menuText}>WebViews</Text>
        </View>
        
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.darkGray,
    gap: 20,
  },
  title: {
    color: "white",
    fontSize: SIZES.fonts.xXLarge,
    fontWeight: SIZES.fontWeight.medium,
    paddingVertical: 20, 
  },
  menuItem: {
    backgroundColor: COLORS.buttonGray,
    padding: 25,
    borderRadius: SIZES.borderRadius.large,
    width: '60%',
    alignItems: 'center',
  },
  menuText: {
    color: "white",
    fontSize: SIZES.fonts.large,
    fontWeight: SIZES.fontWeight.medium,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 25,
  },
  icon: {
    color: COLORS.orange,
    fontSize: SIZES.fonts.xLarge,
  },
});