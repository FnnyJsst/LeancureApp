import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/style';

export default function MessageIcon() {
  return (
    <Ionicons 
      name="chatbubbles-outline" 
      size={40} 
      color={COLORS.white} 
    />
  );
} 