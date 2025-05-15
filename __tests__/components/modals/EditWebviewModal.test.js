import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import EditWebviewModal from '../../../components/modals/webviews/EditWebviewModal';

// Mock du hook useDeviceType
jest.mock('../../../hooks/useDeviceType', () => ({
  useDeviceType: () => ({
    isSmartphone: false,
    isTabletLandscape: false,
    isSmartphonePortrait: false,
    isSmartphoneLandscape: false,
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
        'modals.webview.edit.editChannel': 'Modifier le canal',
        'modals.webview.edit.editTitle': 'Modifier le titre',
        'modals.webview.edit.editUrl': 'Modifier l\'URL',
        'buttons.cancel': 'Annuler',
        'buttons.save': 'Enregistrer',
        'errors.titleRequired': 'Le titre est requis',
        'errors.invalidUrl': 'L\'URL n\'est pas valide',
      };
      return translations[key] || key;
    },
  }),
}));

describe('EditWebviewModal', () => {
  const onCloseMock = jest.fn();
  const onSaveMock = jest.fn();
  const initialUrl = 'https://example.com';
  const initialTitle = 'Mon Canal';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('affiche le modal avec les champs initialisés', () => {
    const { getByText, getByPlaceholderText, getByTestId } = render(
      <EditWebviewModal
        visible={true}
        onClose={onCloseMock}
        onSave={onSaveMock}
        initialUrl={initialUrl}
        initialTitle={initialTitle}
      />
    );

    expect(getByText('Modifier le canal')).toBeTruthy();
    expect(getByPlaceholderText('Modifier le titre')).toHaveProp('value', initialTitle);
    expect(getByPlaceholderText('Modifier l\'URL')).toHaveProp('value', initialUrl);
    expect(getByTestId('edit-modal')).toBeTruthy();
  });

  it('gère le bouton d\'annulation', () => {
    const { getByTestId } = render(
      <EditWebviewModal
        visible={true}
        onClose={onCloseMock}
        onSave={onSaveMock}
        initialUrl={initialUrl}
        initialTitle={initialTitle}
      />
    );

    const cancelButton = getByTestId('cancel-button');
    fireEvent.press(cancelButton);
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('affiche une erreur si le titre est vide', () => {
    const { getByTestId, getByText } = render(
      <EditWebviewModal
        visible={true}
        onClose={onCloseMock}
        onSave={onSaveMock}
        initialUrl={initialUrl}
        initialTitle=""
      />
    );

    const saveButton = getByTestId('save-edit-button');
    fireEvent.press(saveButton);
    expect(getByText('Le titre est requis')).toBeTruthy();
    expect(onSaveMock).not.toHaveBeenCalled();
  });

  it('affiche une erreur si l\'URL n\'est pas valide', () => {
    const { getByTestId, getByText } = render(
      <EditWebviewModal
        visible={true}
        onClose={onCloseMock}
        onSave={onSaveMock}
        initialUrl="invalid-url"
        initialTitle={initialTitle}
      />
    );

    const saveButton = getByTestId('save-edit-button');
    fireEvent.press(saveButton);
    expect(getByText('L\'URL n\'est pas valide')).toBeTruthy();
    expect(onSaveMock).not.toHaveBeenCalled();
  });

  it('sauvegarde les modifications avec des données valides', () => {
    const { getByTestId } = render(
      <EditWebviewModal
        visible={true}
        onClose={onCloseMock}
        onSave={onSaveMock}
        initialUrl={initialUrl}
        initialTitle={initialTitle}
      />
    );

    const saveButton = getByTestId('save-edit-button');
    fireEvent.press(saveButton);
    expect(onSaveMock).toHaveBeenCalledWith(initialUrl, initialTitle);
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('met à jour les champs lors de la saisie', () => {
    const { getByPlaceholderText } = render(
      <EditWebviewModal
        visible={true}
        onClose={onCloseMock}
        onSave={onSaveMock}
        initialUrl={initialUrl}
        initialTitle={initialTitle}
      />
    );

    const titleInput = getByPlaceholderText('Modifier le titre');
    const urlInput = getByPlaceholderText('Modifier l\'URL');

    fireEvent.changeText(titleInput, 'Nouveau Titre');
    fireEvent.changeText(urlInput, 'https://nouvelle-url.com');

    expect(titleInput).toHaveProp('value', 'Nouveau Titre');
    expect(urlInput).toHaveProp('value', 'https://nouvelle-url.com');
  });
}); 