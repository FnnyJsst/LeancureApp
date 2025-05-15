import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AutoRefreshModal from '../../../components/modals/webviews/AutoRefreshModal';

// Mock du hook useDeviceType
jest.mock('../../../hooks/useDeviceType', () => ({
  useDeviceType: () => ({
    isSmartphone: false,
    isSmartphoneLandscape: false,
    isTabletLandscape: false,
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
        'modals.webview.refresh.refreshChannels': 'Rafraîchir les canaux',
        'modals.webview.refresh.never': 'Jamais',
        'modals.webview.refresh.every1min': 'Toutes les minutes',
        'modals.webview.refresh.refreshSettingsSaved': 'Paramètres de rafraîchissement sauvegardés',
        'buttons.close': 'Fermer',
        'buttons.set': 'Définir',
        'tooltips.autoRefresh.message': 'Message du tooltip',
      };
      return translations[key] || key;
    },
  }),
}));

describe('AutoRefreshModal', () => {
  const onCloseMock = jest.fn();
  const onSelectOptionMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('affiche le modal avec ses options', () => {
    const { getByText, getByTestId } = render(
      <AutoRefreshModal
        visible={true}
        onClose={onCloseMock}
        onSelectOption={onSelectOptionMock}
      />
    );

    expect(getByText('Rafraîchir les canaux')).toBeTruthy();
    expect(getByText('Jamais')).toBeTruthy();
    expect(getByText('Toutes les minutes')).toBeTruthy();
    expect(getByTestId('auto-refresh-modal')).toBeTruthy();
  });

  it('sélectionne une option', () => {
    const { getByText } = render(
      <AutoRefreshModal
        visible={true}
        onClose={onCloseMock}
        onSelectOption={onSelectOptionMock}
      />
    );

    const option = getByText('Toutes les minutes');
    fireEvent.press(option);
    expect(getByText('Définir')).toBeTruthy();
  });

  it('gère le bouton de fermeture', () => {
    const { getByText } = render(
      <AutoRefreshModal
        visible={true}
        onClose={onCloseMock}
        onSelectOption={onSelectOptionMock}
      />
    );

    const closeButton = getByText('Fermer');
    fireEvent.press(closeButton);
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('gère le bouton de sauvegarde', () => {
    const { getByText } = render(
      <AutoRefreshModal
        visible={true}
        onClose={onCloseMock}
        onSelectOption={onSelectOptionMock}
      />
    );

    const saveButton = getByText('Définir');
    fireEvent.press(saveButton);
    expect(onSelectOptionMock).toHaveBeenCalled();
  });
}); 