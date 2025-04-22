import React from 'react';
import { View } from 'react-native';

export const WebView = jest.fn().mockImplementation(props =>
  <View testID="mocked-webview" {...props} />
);