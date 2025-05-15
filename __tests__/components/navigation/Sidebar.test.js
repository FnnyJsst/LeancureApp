import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import Sidebar from '../../../components/navigation/Sidebar';
import { useDeviceType } from '../../../hooks/useDeviceType';
import { useNotification } from '../../../services/notification/notificationContext';
import { useCredentials } from '../../../hooks/useCredentials';
import { fetchUserChannels } from '../../../services/api/messageApi';

// Mock des hooks
jest.mock('../../../hooks/useDeviceType', () => ({
  useDeviceType: jest.fn(),
}));

jest.mock('../../../services/notification/notificationContext', () => ({
  useNotification: jest.fn(),
}));

jest.mock('../../../hooks/useCredentials', () => ({
  useCredentials: jest.fn(),
}));

jest.mock('../../../services/api/messageApi', () => ({
  fetchUserChannels: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'sidebar.search': 'Rechercher',
        'sidebar.groups': 'Groupes',
        'sidebar.loading': 'Chargement...',
        'errors.errorLoadingChannels': 'Erreur lors du chargement des canaux',
        'errors.couldNotDecrypt': 'Impossible de décrypter'
      };
      return translations[key] || key;
    },
  }),
}));

describe('Sidebar', () => {
  const mockOnChannelSelect = jest.fn();
  const mockOnGroupSelect = jest.fn();
  const mockToggleMenu = jest.fn();
  const mockOnNavigate = jest.fn();
  const mockOnLogout = jest.fn();

  const mockGroups = [
    {
      id: '1',
      title: 'Groupe 1',
      channels: [
        { id: '1', title: 'Canal 1' },
        { id: '2', title: 'Canal 2' }
      ]
    },
    {
      id: '2',
      title: 'Groupe 2',
      channels: [
        { id: '3', title: 'Canal 3' }
      ]
    }
  ];

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    useDeviceType.mockReturnValue({ isSmartphone: false });
    useNotification.mockReturnValue({ unreadChannels: {} });
    useCredentials.mockReturnValue({ 
      credentials: { 
        contractNumber: '123',
        login: 'test',
        password: 'test',
        accountApiKey: 'key'
      },
      isLoading: false 
    });
    fetchUserChannels.mockResolvedValue({
      status: 'ok',
      privateGroups: mockGroups,
      publicChannels: []
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  const renderSidebar = (props = {}) => {
    return render(
      <Sidebar
        onChannelSelect={mockOnChannelSelect}
        selectedGroup={null}
        onGroupSelect={mockOnGroupSelect}
        isExpanded={true}
        toggleMenu={mockToggleMenu}
        onNavigate={mockOnNavigate}
        currentSection="chat"
        onLogout={mockOnLogout}
        {...props}
      />
    );
  };

  it('affiche correctement la sidebar et ses éléments', async () => {
    const { getByText, getByPlaceholderText } = renderSidebar();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(getByText('Groupes')).toBeTruthy();
    expect(getByPlaceholderText('Rechercher')).toBeTruthy();
  });

  it('gère la déconnexion', async () => {
    const { getByTestId } = renderSidebar();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    const logoutButton = getByTestId('logout-button');
    fireEvent.press(logoutButton);

    expect(mockOnLogout).toHaveBeenCalled();
  });
}); 