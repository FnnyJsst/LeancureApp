import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import DeleteWebviewModal from '../../../components/modals/webviews/DeleteWebviewModal';

// Mock du hook useDeviceType
jest.mock('../../../hooks/useDeviceType', () => ({
  useDeviceType: () => ({
    isSmartphonePortrait: false,
    isSmartphoneLandscape: false,
    isSmartphone: false,
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
        'settings.webview.deleteChannel': 'Supprimer le canal',
        'buttons.cancel': 'Annuler',
        'buttons.delete': 'Supprimer',
      };
      return translations[key] || key;
    },
  }),
}));

describe('DeleteWebviewModal', () => {
  const onCloseMock = jest.fn();
  const handleDeleteMock = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('affiche le modal avec ses boutons', () => {
    const { getByText, getByTestId } = render(
      <DeleteWebviewModal
        visible={true}
        onClose={onCloseMock}
        handleDelete={handleDeleteMock}
      />
    );

    expect(getByText('Supprimer le canal')).toBeTruthy();
    expect(getByText('Annuler')).toBeTruthy();
    expect(getByText('Supprimer')).toBeTruthy();
    expect(getByTestId('delete-modal')).toBeTruthy();
  });

  it('gère le bouton d\'annulation', () => {
    const { getByText } = render(
      <DeleteWebviewModal
        visible={true}
        onClose={onCloseMock}
        handleDelete={handleDeleteMock}
      />
    );

    const cancelButton = getByText('Annuler');
    fireEvent.press(cancelButton);
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('gère le bouton de suppression', async () => {
    const { getByText } = render(
      <DeleteWebviewModal
        visible={true}
        onClose={onCloseMock}
        handleDelete={handleDeleteMock}
      />
    );

    const deleteButton = getByText('Supprimer');
    
    await act(async () => {
      fireEvent.press(deleteButton);
    });

    expect(handleDeleteMock).toHaveBeenCalled();
  });

}); 