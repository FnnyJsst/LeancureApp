// import React from 'react';
// import { render, act, fireEvent } from '@testing-library/react-native';
// import * as SecureStore from 'expo-secure-store';

// // Mocks - DOIVENT ÊTRE AVANT LES IMPORTS QUI LES UTILISENT
// jest.mock('expo-secure-store');
// jest.mock('expo-font', () => ({
//   useFonts: () => [true],
// }));

// // Mock plus détaillé de expo-screen-orientation
// jest.mock('expo-screen-orientation', () => ({
//   lockAsync: jest.fn(),
//   OrientationLock: {
//     LANDSCAPE_RIGHT: 3,
//     PORTRAIT: 1,
//   },
//   getOrientationAsync: jest.fn().mockResolvedValue(1),
// }));

// jest.mock('expo-linear-gradient', () => 'LinearGradient');

// jest.mock('expo-document-picker', () => ({
//   getDocumentAsync: jest.fn().mockResolvedValue({
//     uri: 'test-uri',
//     name: 'test-name',
//   }),
// }));

// jest.mock('expo-file-system', () => ({
//   getInfoAsync: jest.fn().mockResolvedValue({
//     size: 1000,
//   }),
// }));



// // Mock des composants
// jest.mock('../screens/common/ScreenSaver', () => 'ScreenSaver');
// jest.mock('../screens/webviews/SettingsWebviews', () => 'SettingsWebviews');
// jest.mock('../screens/webviews/NoUrlScreen', () => 'NoUrlScreen');
// jest.mock('../screens/messages/login/Login', () => 'Login');
// jest.mock('../components/modals/webviews/PasswordDefineModal', () => 'PasswordDefineModal');
// jest.mock('../components/modals/webviews/PasswordCheckModal', () => 'PasswordCheckModal');

// // APRÈS les mocks, on peut importer App et ScreenOrientation
// import App from '../App';
// import * as ScreenOrientation from 'expo-screen-orientation';

// describe('App', () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
//     SecureStore.getItemAsync.mockResolvedValue(null);
//     ScreenOrientation.lockAsync.mockResolvedValue();
//   });

//   it('should render loading screen initially', () => {
//     const { getByTestId } = render(<App />);
//     expect(getByTestId('screen-saver')).toBeTruthy();
//   });

//   // it('should navigate to login screen after loading', async () => {
//   //   const { getByTestId } = render(<App />);

//   //   await act(async () => {
//   //     // Attendre que le chargement initial soit terminé
//   //     await Promise.resolve();
//   //   });

//   //   expect(getByTestId('login-screen')).toBeTruthy();
//   // });

//   // it('should navigate to app menu when messages are not hidden', async () => {
//   //   SecureStore.getItemAsync.mockImplementation((key) => {
//   //     if (key === 'isMessagesHidden') {
//   //       return Promise.resolve('false');
//   //     }
//   //     return Promise.resolve(null);
//   //   });

//   //   const { getByTestId } = render(<App />);

//   //   await act(async () => {
//   //     await Promise.resolve();
//   //   });

//   //   expect(getByTestId('app-menu')).toBeTruthy();
//   // });

//   // it('should navigate to webview when messages are hidden and webviews exist', async () => {
//   //   SecureStore.getItemAsync.mockImplementation((key) => {
//   //     if (key === 'isMessagesHidden') {
//   //       return Promise.resolve('true');
//   //     }
//   //     if (key === 'selectedWebviews') {
//   //       return Promise.resolve(JSON.stringify(['webview1']));
//   //     }
//   //     return Promise.resolve(null);
//   //   });

//   //   const { getByTestId } = render(<App />);

//   //   await act(async () => {
//   //     await Promise.resolve();
//   //   });

//   //   expect(getByTestId('webview-screen')).toBeTruthy();
//   // });
// });
