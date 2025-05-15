import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import ReadOnlyModal from '../../../components/modals/webviews/ReadOnlyModal';
import { useDeviceType } from '../../../hooks/useDeviceType';

// Mock des hooks
jest.mock('../../../hooks/useDeviceType', () => ({
  useDeviceType: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'modals.webview.readOnly.readOnly': 'Mode lecture seule',
        'modals.webview.readOnly.settingsSaved': 'Paramètres sauvegardés',
        'buttons.yes': 'Oui',
        'buttons.no': 'Non',
        'tooltips.readOnly.message': 'Message d\'aide pour le mode lecture seule'
      };
      return translations[key] || key;
    },
  }),
}));

describe('ReadOnlyModal', () => {
  const mockOnClose = jest.fn();
  const mockOnToggleReadOnly = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useDeviceType.mockReturnValue({ 
      isSmartphone: false,
      isSmartphonePortrait: false,
      isSmartphoneLandscape: false,
      isTabletPortrait: false,
      isLowResTabletPortrait: false,
      isLowResTabletLandscape: false
    });
  });

  it('affiche correctement la modal et ses éléments', () => {
    const { getByText, getByTestId } = render(
      <ReadOnlyModal
        visible={true}
        onClose={mockOnClose}
        onToggleReadOnly={mockOnToggleReadOnly}
      />
    );

    expect(getByTestId('read-only-modal')).toBeTruthy();
    expect(getByText('Mode lecture seule')).toBeTruthy();
    expect(getByText('Oui')).toBeTruthy();
    expect(getByText('Non')).toBeTruthy();
  });

  it('active le mode lecture seule quand on clique sur Oui', async () => {
    const { getByText } = render(
      <ReadOnlyModal
        visible={true}
        onClose={mockOnClose}
        onToggleReadOnly={mockOnToggleReadOnly}
      />
    );

    const yesButton = getByText('Oui');
    await act(async () => {
      fireEvent.press(yesButton);
    });

    expect(mockOnToggleReadOnly).toHaveBeenCalledWith(true);
  });

  it('désactive le mode lecture seule quand on clique sur Non', async () => {
    const { getByText } = render(
      <ReadOnlyModal
        visible={true}
        onClose={mockOnClose}
        onToggleReadOnly={mockOnToggleReadOnly}
      />
    );

    const noButton = getByText('Non');
    await act(async () => {
      fireEvent.press(noButton);
    });

    expect(mockOnToggleReadOnly).toHaveBeenCalledWith(false);
  });

  it('affiche le tooltip quand on clique sur l\'icône d\'information', async () => {
    const { getByText, getByTestId } = render(
      <ReadOnlyModal
        visible={true}
        onClose={mockOnClose}
        onToggleReadOnly={mockOnToggleReadOnly}
      />
    );

    const tooltipButton = getByTestId('read-only-modal').findByProps({ name: 'information-circle-outline' });
    await act(async () => {
      fireEvent.press(tooltipButton);
    });

    await waitFor(() => {
      expect(getByText('Message d\'aide pour le mode lecture seule')).toBeTruthy();
    });
  });
}); 