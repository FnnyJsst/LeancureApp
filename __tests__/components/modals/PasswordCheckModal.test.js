import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import PasswordCheckModal from '../../../components/modals/webviews/PasswordCheckModal';

// Mock du hook useDeviceType
jest.mock('../../../hooks/useDeviceType', () => ({
  useDeviceType: () => ({
    isSmartphone: false,
    isSmartphoneLandscape: false,
    isTabletPortrait: false,
    isLowResTablet: false,
    isLowResTabletPortrait: false,
    isLowResTabletLandscape: false,
  }),
}));

// Mock du hook useTranslation
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'modals.webview.password.enterPassword': 'Entrez le mot de passe',
        'modals.webview.password.enterYourPassword': 'Entrez votre mot de passe',
        'buttons.close': 'Fermer',
        'errors.enterPassword': 'Veuillez entrer un mot de passe',
      };
      return translations[key] || key;
    },
  }),
}));

describe('PasswordCheckModal', () => {
  const onCloseMock = jest.fn();
  const onSubmitMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('affiche le modal avec ses éléments', async () => {
    const { getByText, getByPlaceholderText } = render(
      <PasswordCheckModal
        visible={true}
        onClose={onCloseMock}
        onSubmit={onSubmitMock}
        isFocused={false}
      />
    );

    expect(getByText('Entrez le mot de passe')).toBeTruthy();
    expect(getByPlaceholderText('Entrez votre mot de passe')).toBeTruthy();
    expect(getByText('Fermer')).toBeTruthy();
    expect(getByText('Ok')).toBeTruthy();
  }, 10000);

  it('affiche une erreur si le mot de passe est vide', async () => {
    const { getByText } = render(
      <PasswordCheckModal
        visible={true}
        onClose={onCloseMock}
        onSubmit={onSubmitMock}
        isFocused={false}
      />
    );

    const submitButton = getByText('Ok');
    await act(async () => {
      fireEvent.press(submitButton);
    });

    expect(getByText('Veuillez entrer un mot de passe')).toBeTruthy();
  }, 10000);

  it('soumet le mot de passe quand il est valide', async () => {
    const { getByText, getByPlaceholderText } = render(
      <PasswordCheckModal
        visible={true}
        onClose={onCloseMock}
        onSubmit={onSubmitMock}
        isFocused={false}
      />
    );

    const input = getByPlaceholderText('Entrez votre mot de passe');
    await act(async () => {
      fireEvent.changeText(input, 'password123');
    });

    const submitButton = getByText('Ok');
    await act(async () => {
      fireEvent.press(submitButton);
    });

    expect(onSubmitMock).toHaveBeenCalledWith('password123');
  }, 10000);

  it('gère le bouton de fermeture', async () => {
    const { getByText } = render(
      <PasswordCheckModal
        visible={true}
        onClose={onCloseMock}
        onSubmit={onSubmitMock}
        isFocused={false}
      />
    );

    const closeButton = getByText('Fermer');
    await act(async () => {
      fireEvent.press(closeButton);
    });

    expect(onCloseMock).toHaveBeenCalled();
  }, 10000);

  it('réinitialise le mot de passe lors de la fermeture', async () => {
    const { getByText, getByPlaceholderText, rerender } = render(
      <PasswordCheckModal
        visible={true}
        onClose={onCloseMock}
        onSubmit={onSubmitMock}
        isFocused={false}
      />
    );

    const input = getByPlaceholderText('Entrez votre mot de passe');
    await act(async () => {
      fireEvent.changeText(input, 'password123');
    });

    const closeButton = getByText('Fermer');
    await act(async () => {
      fireEvent.press(closeButton);
    });

    // Réafficher le modal
    rerender(
      <PasswordCheckModal
        visible={true}
        onClose={onCloseMock}
        onSubmit={onSubmitMock}
        isFocused={false}
      />
    );

    const input2 = getByPlaceholderText('Entrez votre mot de passe');
    expect(input2.props.value).toBe('');
  }, 10000);
}); 