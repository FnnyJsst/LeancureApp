import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import App from '../../App';
import { SCREENS } from '../../constants/screens';

// Mock pour LogBox de React Native
jest.mock('react-native/Libraries/LogBox/LogBox', () => ({
  __esModule: true,
  default: {
    ignoreLogs: jest.fn(),
    ignoreAllLogs: jest.fn(),
  },
}));

// Mock pour useWebviewsPassword
jest.mock('../../hooks/useWebviewsPassword', () => ({
  useWebviewsPassword: () => ({
    isPasswordRequired: false,
    isPasswordDefineModalVisible: false,
    passwordCheckModalVisible: false,
    handlePasswordSubmit: jest.fn(),
    handlePasswordCheck: jest.fn(),
    disablePassword: jest.fn()
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

describe('Password Management Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should complete the full password setup flow', async () => {
    const { getByTestId, getByText, getByPlaceholderText } = render(<App />);

    // 1. Navigation vers les paramètres
    await waitFor(() => {
      fireEvent.press(getByTestId('settings-button'));
    });

    // 2. Ouverture du modal de définition du mot de passe
    await waitFor(() => {
      fireEvent.press(getByTestId('open-password-button'));
      expect(getByTestId('password-define-modal')).toBeTruthy();
    });

    // 3. Saisie et confirmation du mot de passe
    const password = 'password123';
    fireEvent.changeText(
      getByPlaceholderText('Enter a password (6+ chars)'),
      password
    );
    fireEvent.changeText(
      getByPlaceholderText('Re-enter password'),
      password
    );

    // 4. Soumission du mot de passe
    fireEvent.press(getByText('Ok'));

    // 5. Vérification de l'alerte de succès
    await waitFor(() => {
      expect(getByText('Success')).toBeTruthy();
      expect(getByText('Password has been set successfully')).toBeTruthy();
    });

    // 6. Confirmation de l'alerte
    fireEvent.press(getByTestId('alert-confirm-button'));

    // 7. Vérification que le modal est fermé
    await waitFor(() => {
      expect(() => getByTestId('password-define-modal')).toThrow();
    });
  });

  it('should handle password verification flow', async () => {
    const { getByTestId, getByText, getByPlaceholderText } = render(<App />);

    // 1. Définir d'abord un mot de passe
    const password = 'password123';
    await setupPassword(password);

    // 2. Tenter d'accéder aux paramètres
    fireEvent.press(getByTestId('settings-button'));

    // 3. Vérifier que le modal de vérification apparaît
    await waitFor(() => {
      expect(getByTestId('password-check-modal')).toBeTruthy();
    });

    // 4. Entrer le bon mot de passe
    fireEvent.changeText(
      getByPlaceholderText('Enter password'),
      password
    );
    fireEvent.press(getByText('Confirm'));

    // 5. Vérifier l'accès aux paramètres
    await waitFor(() => {
      expect(getByTestId('settings-screen')).toBeTruthy();
    });
  });

  it('should handle password disable flow', async () => {
    const { getByTestId, getByText } = render(<App />);

    // 1. Accéder aux paramètres
    await waitFor(() => {
      fireEvent.press(getByTestId('settings-button'));
    });

    // 2. Ouvrir le modal de mot de passe
    fireEvent.press(getByTestId('open-password-button'));

    // 3. Cliquer sur "Do not use"
    fireEvent.press(getByTestId('disable-password-button'));

    // 4. Vérifier que le modal est fermé
    await waitFor(() => {
      expect(() => getByTestId('password-define-modal')).toThrow();
    });

    // 5. Vérifier que l'accès aux paramètres ne nécessite plus de mot de passe
    fireEvent.press(getByTestId('back-button'));
    fireEvent.press(getByTestId('settings-button'));

    await waitFor(() => {
      expect(getByTestId('settings-screen')).toBeTruthy();
    });
  });
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