import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import App from '../../App';
import { SCREENS } from '../../constants/screens';
import ErrorBoundary from '../../components/ErrorBoundary';
import * as SecureStore from 'expo-secure-store';

// Mock pour LogBox de React Native
jest.mock('react-native/Libraries/LogBox/LogBox', () => ({
  __esModule: true,
  default: {
    ignoreLogs: jest.fn(),
    ignoreAllLogs: jest.fn(),
  },
}));

console.error = jest.fn();

// Mock pour useWebviews
jest.mock('../../hooks/useWebviews', () => ({
  useWebviews: () => ({
    channels: [],
    selectedWebviews: [],
    setSelectedWebviews: jest.fn(),
    webViewUrl: '',
    setRefreshInterval: jest.fn(),
    refreshOption: 'manual',
    isReadOnly: false,
    toggleReadOnly: jest.fn(),
    handleSelectChannels: jest.fn(),
    saveSelectedWebviews: jest.fn(),
    loadSelectedChannels: jest.fn().mockResolvedValue(),
    getIntervalInMilliseconds: jest.fn(),
    saveRefreshOption: jest.fn(),
    handleSelectOption: jest.fn(),
    navigateToChannelsList: jest.fn(),
    navigateToWebview: jest.fn(),
    loadPasswordFromSecureStore: jest.fn().mockResolvedValue(),
    loadRefreshOption: jest.fn().mockResolvedValue(),
  })
}));

// Mock pour useWebviewsPassword
jest.mock('../../hooks/useWebviewsPassword', () => ({
  useWebviewsPassword: () => ({
    password: null,
    isPasswordRequired: false,
    isPasswordDefineModalVisible: false,
    passwordCheckModalVisible: false,
    setPasswordCheckModalVisible: jest.fn(),
    handlePasswordSubmit: jest.fn(),
    handlePasswordCheck: jest.fn(),
    disablePassword: jest.fn(),
    openPasswordDefineModal: jest.fn(),
    closePasswordDefineModal: jest.fn()
  })
}));

// Mock pour expo-font
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('expo-font', () => ({
  useFonts: () => [true],  // Simule que les polices sont chargées
}));

// Mock pour useDeviceType
jest.mock('../../hooks/useDeviceType', () => ({
  useDeviceType: () => ({
    isSmartphone: true,
    isTablet: false,
    isSmartphoneLandscape: false,
    isTabletPortrait: false
  })
}));

jest.mock('../../hooks/useTimeout', () => ({
  useTimeout: () => ({
    timeoutInterval: 0,
    handleTimeoutSelection: jest.fn(),
    loadTimeoutInterval: jest.fn().mockResolvedValue(),
  })
}));

describe('Password Management Flow', () => {
  let component;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    SecureStore.getItemAsync.mockImplementation((key) => {
      switch (key) {
        case 'isMessagesHidden':
          return Promise.resolve('false');
        case 'selectedWebviews':
          return Promise.resolve('[]');
        case 'refreshOption':
          return Promise.resolve('manual');
        default:
          return Promise.resolve(null);
      }
    });
  });

  afterEach(() => {
    if (component) {
      component.unmount();
    }
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('should handle errors gracefully', async () => {

    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    SecureStore.getItemAsync.mockRejectedValueOnce(new Error('Storage error'));

      render(
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      );

      await act(async () => {
        await Promise.resolve();
      });

      expect(consoleError).toHaveBeenCalledWith(
        'Error initializing app:',
        expect.any(Error)
      );

      consoleError.mockRestore();

    // Utiliser la référence rendered au lieu d'une constante destructurée
    // await waitFor(() => {
    //   expect(rendered.getByTestId('error-boundary-fallback')).toBeTruthy();
    // });
  });

  // it('should complete the full password setup flow', async () => {
  //   await act(async () => {
  //     component = render(
  //       <ErrorBoundary>
  //         <App testID="app-root" />
  //       </ErrorBoundary>
  //     );
  //   });

  //   await waitFor(() => {
  //     expect(component.getByTestId('app-root')).toBeTruthy();
  //   });

  //   const { getByTestId, getByText } = component;

  //   // Navigation vers les paramètres
  //   await act(async () => {
  //     fireEvent.press(getByTestId('settings-button'));
  //     await waitFor(() => {
  //       expect(getByTestId('settings-screen')).toBeTruthy();
  //     });
  //   });

  //   // 2. Ouverture du modal de définition du mot de passe
  //   await waitFor(() => {
  //     fireEvent.press(getByTestId('open-password-button'));
  //     expect(getByTestId('password-define-modal')).toBeTruthy();
  //   });

  //   // 3. Saisie et confirmation du mot de passe
  //   const password = 'password123';
  //   fireEvent.changeText(
  //     getByTestId('password-input'),
  //     password
  //   );
  //   fireEvent.changeText(
  //     getByTestId('re-enter-password-input'),
  //     password
  //   );

  //   // 4. Soumission du mot de passe
  //   fireEvent.press(getByText('Ok'));

  //   // 5. Vérification de l'alerte de succès
  //   await waitFor(() => {
  //     expect(getByText('Success')).toBeTruthy();
  //     expect(getByText('Password has been set successfully')).toBeTruthy();
  //   });

  //   // 6. Confirmation de l'alerte
  //   fireEvent.press(getByTestId('alert-confirm-button'));

  //   // 7. Vérification que le modal est fermé
  //   await waitFor(() => {
  //     expect(() => getByTestId('password-define-modal')).toThrow();
  //   });
  // });

  // it('should handle password verification flow', async () => {
  //   const { getByTestId, getByText, getByPlaceholderText } = render(<App />);

  //   // 1. Définir d'abord un mot de passe
  //   const password = 'password123';
  //   await setupPassword(password);

  //   // 2. Tenter d'accéder aux paramètres
  //   fireEvent.press(getByTestId('settings-button'));

  //   // 3. Vérifier que le modal de vérification apparaît
  //   await waitFor(() => {
  //     expect(getByTestId('password-check-modal')).toBeTruthy();
  //   });

  //   // 4. Entrer le bon mot de passe
  //   fireEvent.changeText(
  //     getByPlaceholderText('Enter password'),
  //     password
  //   );
  //   fireEvent.press(getByText('Confirm'));

  //   // 5. Vérifier l'accès aux paramètres
  //   await waitFor(() => {
  //     expect(getByTestId('settings-screen')).toBeTruthy();
  //   });
  // });

  // it('should handle password disable flow', async () => {
  //   let rendered;

  //   await act(async () => {
  //     rendered = render(
  //       <ErrorBoundary>
  //         <App testID="app-root" />
  //       </ErrorBoundary>
  //     );
  //     // Attendre que les promesses soient résolues
  //     await Promise.resolve();
  //     // Avancer les timers
  //     jest.runAllTimers();
  //   });

  //   const { getByTestId } = rendered;

  //   await waitFor(() => {
  //     expect(getByTestId('app-root')).toBeTruthy();
  //   });

  //   await act(async () => {
  //     fireEvent.press(getByTestId('settings-button'));
  //     await Promise.resolve();
  //     jest.runAllTimers();
  //   });

  //   // Vérifier que l'écran des paramètres est affiché
  //   await waitFor(() => {
  //     expect(getByTestId('settings-screen')).toBeTruthy();
  //   });

  //   // 2. Ouvrir le modal de mot de passe
  //   await waitFor(() => {
  //     expect(getByTestId('settings-screen')).toBeTruthy();
  //     fireEvent.press(getByTestId('open-password-button'));
  //   });

  //   // 3. Cliquer sur "Do not use"
  //   fireEvent.press(getByTestId('disable-password-button'));

  //   // 4. Vérifier que le modal est fermé
  //   await waitFor(() => {
  //     expect(() => getByTestId('password-define-modal')).toThrow();
  //   });

  //   // 5. Vérifier que l'accès aux paramètres ne nécessite plus de mot de passe
  //   fireEvent.press(getByTestId('back-button'));
  //   fireEvent.press(getByTestId('settings-button'));

  //   await waitFor(() => {
  //     expect(getByTestId('settings-screen')).toBeTruthy();
  //   });
  // });
});

// Fonction utilitaire pour configurer le mot de passe
async function setupPassword(password) {
  const { getByTestId, getByText, getByPlaceholderText } = render(<App />);

  fireEvent.press(getByTestId('settings-button'));
  fireEvent.press(getByTestId('open-password-button'));

  fireEvent.changeText(
    getByPlaceholderText('Enter a password (6+ chars)'),
    password
  );
  fireEvent.changeText(
    getByPlaceholderText('Re-enter password'),
    password
  );

  fireEvent.press(getByText('Ok'));
  await waitFor(() => {
    fireEvent.press(getByTestId('alert-confirm-button'));
  });
}