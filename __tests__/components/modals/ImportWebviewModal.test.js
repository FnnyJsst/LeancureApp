import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import ImportWebviewModal from '../../../components/modals/webviews/ImportWebviewModal';

// Mock du hook useDeviceType
jest.mock('../../../hooks/useDeviceType', () => ({
  useDeviceType: () => ({
    isSmartphone: false,
    isSmartphonePortrait: false,
    isSmartphoneLandscape: false,
    isTabletPortrait: false,
    isLowResTabletPortrait: false,
    isLowResTabletLandscape: false,
  }),
}));

// Mock du hook useTranslation
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'modals.webview.import.importChannels': 'Importer des webviews',
        'modals.webview.import.importUrl': 'Entrez l\'URL',
        'modals.webview.import.degradedImport': 'Mode hors ligne',
        'buttons.cancel': 'Annuler',
        'buttons.import': 'Importer',
        'errors.enterUrl': 'Veuillez entrer une URL',
        'errors.invalidUrl': 'Format d\'URL invalide',
        'errors.wrongUrlFormat': 'Format d\'URL incorrect',
        'errors.errorImportingWebviews': 'Erreur lors de l\'importation des webviews',
        'errors.errorDuringDownload': 'Erreur lors du téléchargement',
        'success.webviewsImported': 'Webviews importées avec succès',
      };
      return translations[key] || key;
    },
  }),
}));

describe('ImportWebviewModal', () => {
  const onCloseMock = jest.fn();
  const onImportMock = jest.fn();
  const selectedWebviewsMock = [];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('affiche le modal avec ses éléments', async () => {
    const { findByText, findByPlaceholderText } = render(
      <ImportWebviewModal
        visible={true}
        onClose={onCloseMock}
        onImport={onImportMock}
        selectedWebviews={selectedWebviewsMock}
      />
    );

    const title = await findByText('Importer des webviews');
    const input = await findByPlaceholderText('Entrez l\'URL');
    const cancelButton = await findByText('Annuler');
    const importButton = await findByText('Importer');

    expect(title).toBeTruthy();
    expect(input).toBeTruthy();
    expect(cancelButton).toBeTruthy();
    expect(importButton).toBeTruthy();
  });

  it('affiche une erreur si l\'URL est vide', async () => {
    const { findByText } = render(
      <ImportWebviewModal
        visible={true}
        onClose={onCloseMock}
        onImport={onImportMock}
        selectedWebviews={selectedWebviewsMock}
      />
    );

    const importButton = await findByText('Importer');
    await act(async () => {
      fireEvent.press(importButton);
    });

    const errorMessage = await findByText('Veuillez entrer une URL');
    expect(errorMessage).toBeTruthy();
  });

  it('génère les URLs pour le mode hors ligne', async () => {
    const { findByText, findByPlaceholderText } = render(
      <ImportWebviewModal
        visible={true}
        onClose={onCloseMock}
        onImport={onImportMock}
        selectedWebviews={selectedWebviewsMock}
      />
    );

    const input = await findByPlaceholderText('Entrez l\'URL');
    await act(async () => {
      fireEvent.changeText(input, 'https://app.example.com');
    });

    const checkbox = await findByText('Mode hors ligne');
    await act(async () => {
      fireEvent.press(checkbox);
    });

    const importButton = await findByText('Importer');
    await act(async () => {
      fireEvent.press(importButton);
    });

    expect(onImportMock).toHaveBeenCalled();
  });

  it('gère le bouton d\'annulation', async () => {
    const { findByText } = render(
      <ImportWebviewModal
        visible={true}
        onClose={onCloseMock}
        onImport={onImportMock}
        selectedWebviews={selectedWebviewsMock}
      />
    );

    const cancelButton = await findByText('Annuler');
    await act(async () => {
      fireEvent.press(cancelButton);
    });

    expect(onCloseMock).toHaveBeenCalled();
  });

  it('affiche une erreur lors du téléchargement', async () => {
    const { findByText, findByPlaceholderText } = render(
      <ImportWebviewModal
        visible={true}
        onClose={onCloseMock}
        onImport={onImportMock}
        selectedWebviews={selectedWebviewsMock}
      />
    );

    const input = await findByPlaceholderText('Entrez l\'URL');
    await act(async () => {
      fireEvent.changeText(input, 'https://app.example.com');
    });

    const importButton = await findByText('Importer');
    await act(async () => {
      fireEvent.press(importButton);
    });

    const errorMessage = await findByText('Erreur lors du téléchargement');
    expect(errorMessage).toBeTruthy();
  });
}); 