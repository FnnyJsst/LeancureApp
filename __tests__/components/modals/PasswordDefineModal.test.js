import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import PasswordDefineModal from '../../../components/modals/webviews/PasswordDefineModal';
import { useDeviceType } from '../../../hooks/useDeviceType';

// Mock des hooks
jest.mock('../../../hooks/useDeviceType', () => ({
  useDeviceType: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'modals.webview.password.enterPassword': 'Entrez le mot de passe',
        'modals.webview.password.confirmPassword': 'Confirmez le mot de passe',
        'modals.webview.password.define': 'Entrez le mot de passe',
        'modals.webview.password.confirm': 'Confirmez le mot de passe',
        'buttons.doNotUse': 'Ne pas utiliser',
        'buttons.close': 'Close',
        'buttons.ok': 'Ok',
        'errors.passwordTooShort': 'Le mot de passe doit contenir au moins 6 caractères',
        'errors.passwordMismatch': 'Les mots de passe ne correspondent pas',
        'errors.passwordSuccess': 'Mot de passe défini avec succès'
      };
      return translations[key] || key;
    },
  }),
}));

describe('PasswordDefineModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSubmitPassword = jest.fn();
  const mockOnDisablePassword = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useDeviceType.mockReturnValue({ isTablet: false });
  });

  it('affiche correctement la modal et ses éléments', () => {
    const { getByText, getByPlaceholderText } = render(
      <PasswordDefineModal
        visible={true}
        onClose={mockOnClose}
        onSubmitPassword={mockOnSubmitPassword}
        onDisablePassword={mockOnDisablePassword}
      />
    );

    expect(getByText('Entrez le mot de passe')).toBeTruthy();
    expect(getByPlaceholderText('Entrez le mot de passe')).toBeTruthy();
    expect(getByPlaceholderText('Confirmez le mot de passe')).toBeTruthy();
    expect(getByText('Ne pas utiliser')).toBeTruthy();
    expect(getByText('Ok')).toBeTruthy();
    expect(getByText('Close')).toBeTruthy();
  });

  it('affiche une erreur si le mot de passe est trop court', async () => {
    const { getByText, getByPlaceholderText } = render(
      <PasswordDefineModal
        visible={true}
        onClose={mockOnClose}
        onSubmitPassword={mockOnSubmitPassword}
        onDisablePassword={mockOnDisablePassword}
      />
    );

    const passwordInput = getByPlaceholderText('Entrez le mot de passe');
    const confirmInput = getByPlaceholderText('Confirmez le mot de passe');
    const submitButton = getByText('Ok');

    await act(async () => {
      fireEvent.changeText(passwordInput, '123');
      fireEvent.changeText(confirmInput, '123');
      fireEvent.press(submitButton);
    });

    await waitFor(() => {
      expect(getByText('Le mot de passe doit contenir au moins 6 caractères')).toBeTruthy();
    });
  });

  it('gère correctement le bouton Ne pas utiliser', async () => {
    const { getByText } = render(
      <PasswordDefineModal
        visible={true}
        onClose={mockOnClose}
        onSubmitPassword={mockOnSubmitPassword}
        onDisablePassword={mockOnDisablePassword}
      />
    );

    const disableButton = getByText('Ne pas utiliser');
    await act(async () => {
      fireEvent.press(disableButton);
    });

    expect(mockOnDisablePassword).toHaveBeenCalled();
  });

  it('gère correctement le bouton de fermeture', async () => {
    const { getByText } = render(
      <PasswordDefineModal
        visible={true}
        onClose={mockOnClose}
        onSubmitPassword={mockOnSubmitPassword}
        onDisablePassword={mockOnDisablePassword}
      />
    );

    const closeButton = getByText('Close');
    await act(async () => {
      fireEvent.press(closeButton);
    });

    expect(mockOnClose).toHaveBeenCalled();
  });
}); 