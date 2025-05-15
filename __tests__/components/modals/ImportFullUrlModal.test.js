import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import ImportFullUrlModal from '../../../components/modals/webviews/ImportFullUrlModal';

// Mock du hook useDeviceType
jest.mock('../../../hooks/useDeviceType', () => ({
  useDeviceType: () => ({
    isSmartphone: false,
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
        'modals.webview.import.importFullUrl': 'Importer une URL complète',
        'modals.webview.import.importUrl': 'Entrez l\'URL à importer',
        'buttons.cancel': 'Annuler',
        'buttons.import': 'Importer',
        'buttons.importing': 'Importation...',
        'errors.fieldsRequired': 'Champ requis',
        'errors.invalidUrlFormat': 'Format d\'URL invalide',
        'errors.errorImportingWebviews': 'Erreur lors de l\'import',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock de ErrorType
const ErrorType = {
  VALIDATION: 'VALIDATION',
  SYSTEM: 'SYSTEM',
};

describe('ImportFullUrlModal', () => {
  const onCloseMock = jest.fn();
  const onImportMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('affiche le modal avec ses éléments', () => {
    const { getByText, getByPlaceholderText, getByTestId } = render(
      <ImportFullUrlModal
        visible={true}
        onClose={onCloseMock}
        onImport={onImportMock}
      />
    );

    expect(getByText('Importer une URL complète')).toBeTruthy();
    expect(getByPlaceholderText('Entrez l\'URL à importer')).toBeTruthy();
    expect(getByTestId('import-modal')).toBeTruthy();
  });

  it('gère le bouton d\'annulation', () => {
    const { getByTestId } = render(
      <ImportFullUrlModal
        visible={true}
        onClose={onCloseMock}
        onImport={onImportMock}
      />
    );

    const cancelButton = getByTestId('cancel-import-button');
    fireEvent.press(cancelButton);
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('affiche une erreur si l\'URL est vide', async () => {
    const { getByTestId } = render(
      <ImportFullUrlModal
        visible={true}
        onClose={onCloseMock}
        onImport={onImportMock}
      />
    );

    const importButton = getByTestId('save-import-button');
    await act(async () => {
      fireEvent.press(importButton);
    });
    expect(getByTestId('error-container')).toBeTruthy();
    expect(onImportMock).not.toHaveBeenCalled();
  });

  it('importe une URL valide', async () => {
    const validUrl = 'https://example.com';
    const { getByTestId, getByPlaceholderText } = render(
      <ImportFullUrlModal
        visible={true}
        onClose={onCloseMock}
        onImport={onImportMock}
      />
    );

    const urlInput = getByPlaceholderText('Entrez l\'URL à importer');
    fireEvent.changeText(urlInput, validUrl);

    const importButton = getByTestId('save-import-button');
    await act(async () => {
      fireEvent.press(importButton);
    });

    expect(onImportMock).toHaveBeenCalledWith(validUrl);
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('affiche une erreur système lors de l\'import', async () => {
    const errorMessage = 'Erreur système';
    onImportMock.mockRejectedValue(new Error(errorMessage));

    const { getByTestId, getByPlaceholderText } = render(
      <ImportFullUrlModal
        visible={true}
        onClose={onCloseMock}
        onImport={onImportMock}
      />
    );

    const urlInput = getByPlaceholderText('Entrez l\'URL à importer');
    fireEvent.changeText(urlInput, 'https://example.com');

    const importButton = getByTestId('save-import-button');
    await act(async () => {
      fireEvent.press(importButton);
    });

    expect(getByTestId('error-container')).toBeTruthy();
  });

  it('affiche une erreur par défaut si le message d\'erreur est vide', async () => {
    onImportMock.mockRejectedValue(new Error(''));

    const { getByTestId, getByPlaceholderText } = render(
      <ImportFullUrlModal
        visible={true}
        onClose={onCloseMock}
        onImport={onImportMock}
      />
    );

    const urlInput = getByPlaceholderText('Entrez l\'URL à importer');
    fireEvent.changeText(urlInput, 'https://example.com');

    const importButton = getByTestId('save-import-button');
    await act(async () => {
      fireEvent.press(importButton);
    });

    expect(getByTestId('error-container')).toBeTruthy();
  });

  it('réinitialise le formulaire à la fermeture', () => {
    const { getByTestId, getByPlaceholderText } = render(
      <ImportFullUrlModal
        visible={true}
        onClose={onCloseMock}
        onImport={onImportMock}
      />
    );

    const urlInput = getByPlaceholderText('Entrez l\'URL à importer');
    fireEvent.changeText(urlInput, 'https://example.com');

    const cancelButton = getByTestId('cancel-import-button');
    fireEvent.press(cancelButton);

    expect(urlInput).toHaveProp('value', '');
  });
}); 