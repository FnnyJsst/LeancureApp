import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import ChangeServerAddressModal from '../../../components/modals/common/ChangeServerAddressModal';
import { ENV } from '../../../config/env';

// Mock du hook useDeviceType
jest.mock('../../../hooks/useDeviceType', () => ({
  useDeviceType: () => ({
    isSmartphone: false,
    isSmartphonePortrait: false,
    isSmartphoneLandscape: false,
    isTabletLandscape: false,
    isLowResTabletPortrait: false,
    isLowResTabletLandscape: false,
    isLowResTablet: false,
  }),
}));

// Mock du hook useTranslation
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'modals.server.change': 'Changer l\'adresse du serveur',
        'settings.common.changeServer': 'Entrez l\'adresse du serveur',
        'buttons.cancel': 'Annuler',
        'buttons.save': 'Enregistrer',
        'errors.addressCannotBeEmpty': 'L\'adresse ne peut pas être vide',
        'errors.invalidUrlFormat': 'Format d\'URL invalide',
        'errors.invalidProtocol': 'Protocole invalide',
        'errors.saveServerAddressError': 'Erreur lors de la sauvegarde de l\'adresse',
        'success.serverAddressChanged': 'Adresse du serveur modifiée avec succès',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock de ENV
jest.mock('../../../config/env', () => ({
  ENV: {
    API_URL: jest.fn(),
    setCustomApiUrl: jest.fn(),
  },
}));

describe('ChangeServerAddressModal', () => {
  const onCloseMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    ENV.API_URL.mockResolvedValue('https://example.com/ic.php');
  });

  it('affiche le modal avec ses éléments', async () => {
    const { getByText, getByPlaceholderText } = render(
      <ChangeServerAddressModal
        visible={true}
        onClose={onCloseMock}
      />
    );

    await waitFor(() => {
      expect(getByText('Changer l\'adresse du serveur')).toBeTruthy();
      expect(getByPlaceholderText('Entrez l\'adresse du serveur')).toBeTruthy();
      expect(getByText('Annuler')).toBeTruthy();
      expect(getByText('Enregistrer')).toBeTruthy();
    });
  });

  it('charge l\'adresse du serveur actuelle au chargement', async () => {
    const { getByPlaceholderText } = render(
      <ChangeServerAddressModal
        visible={true}
        onClose={onCloseMock}
      />
    );

    await waitFor(() => {
      const input = getByPlaceholderText('Entrez l\'adresse du serveur');
      expect(input.props.value).toBe('https://example.com');
    });
  });

  it('affiche une erreur si l\'adresse est vide', async () => {
    const { findByText, getByPlaceholderText } = render(
      <ChangeServerAddressModal
        visible={true}
        onClose={onCloseMock}
      />
    );

    await waitFor(() => {
      const input = getByPlaceholderText('Entrez l\'adresse du serveur');
      expect(input.props.value).toBe('https://example.com');
    });

    const input = getByPlaceholderText('Entrez l\'adresse du serveur');
    await act(async () => {
      fireEvent.changeText(input, '');
    });

    const saveButton = await findByText('Enregistrer');
    await act(async () => {
      fireEvent.press(saveButton);
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const errorMessage = await findByText('L\'adresse ne peut pas être vide');
    expect(errorMessage).toBeTruthy();
  });

  it('affiche une erreur si le protocole n\'est pas valide', async () => {
    const { findByText, getByPlaceholderText } = render(
      <ChangeServerAddressModal
        visible={true}
        onClose={onCloseMock}
      />
    );

    await waitFor(() => {
      const input = getByPlaceholderText('Entrez l\'adresse du serveur');
      expect(input.props.value).toBe('https://example.com');
    });

    const input = getByPlaceholderText('Entrez l\'adresse du serveur');
    await act(async () => {
      fireEvent.changeText(input, 'ftp://example.com');
    });

    const saveButton = await findByText('Enregistrer');
    await act(async () => {
      fireEvent.press(saveButton);
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const errorMessage = await findByText('Protocole invalide');
    expect(errorMessage).toBeTruthy();
  });

  it('sauvegarde l\'adresse du serveur avec succès', async () => {
    const { getByText, getByPlaceholderText } = render(
      <ChangeServerAddressModal
        visible={true}
        onClose={onCloseMock}
      />
    );

    await waitFor(() => {
      const input = getByPlaceholderText('Entrez l\'adresse du serveur');
      expect(input.props.value).toBe('https://example.com');
    });

    const input = getByPlaceholderText('Entrez l\'adresse du serveur');
    await act(async () => {
      fireEvent.changeText(input, 'https://new-server.com');
    });

    const saveButton = getByText('Enregistrer');
    await act(async () => {
      fireEvent.press(saveButton);
    });

    expect(ENV.setCustomApiUrl).toHaveBeenCalledWith('https://new-server.com/ic.php');
    await waitFor(() => {
      expect(getByText('Adresse du serveur modifiée avec succès')).toBeTruthy();
    });
  });

  it('gère le bouton d\'annulation', async () => {
    const { getByText } = render(
      <ChangeServerAddressModal
        visible={true}
        onClose={onCloseMock}
      />
    );

    await waitFor(() => {
      expect(getByText('Annuler')).toBeTruthy();
    });

    const cancelButton = getByText('Annuler');
    await act(async () => {
      fireEvent.press(cancelButton);
    });
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('ferme le modal après la confirmation de l\'alerte de succès', async () => {
    const { getByText, getByPlaceholderText } = render(
      <ChangeServerAddressModal
        visible={true}
        onClose={onCloseMock}
      />
    );

    await waitFor(() => {
      const input = getByPlaceholderText('Entrez l\'adresse du serveur');
      expect(input.props.value).toBe('https://example.com');
    });

    const input = getByPlaceholderText('Entrez l\'adresse du serveur');
    await act(async () => {
      fireEvent.changeText(input, 'https://new-server.com');
    });

    const saveButton = getByText('Enregistrer');
    await act(async () => {
      fireEvent.press(saveButton);
    });

    await waitFor(() => {
      expect(getByText('Adresse du serveur modifiée avec succès')).toBeTruthy();
    });

    const confirmButton = getByText('OK');
    await act(async () => {
      fireEvent.press(confirmButton);
    });

    expect(onCloseMock).toHaveBeenCalled();
  });
}); 