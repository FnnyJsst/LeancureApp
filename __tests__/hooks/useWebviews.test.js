import { renderHook, act } from '@testing-library/react-native';
import { useWebviews } from '../../hooks/useWebviews';
import * as SecureStore from 'expo-secure-store';
import { SCREENS } from '../../constants/screens';

// Mock des dépendances
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
  WHEN_UNLOCKED: 'whenUnlocked'
}));

// Mock pour useNavigation
const mockNavigate = jest.fn();
jest.mock('../../hooks/useNavigation', () => ({
  useNavigation: () => ({
    navigate: mockNavigate
  })
}));

// Mock pour useWebviewsPassword
jest.mock('../../hooks/useWebViewsPassword', () => ({
  useWebviewsPassword: () => ({
    loadPasswordFromSecureStore: jest.fn()
  })
}));

// Mock pour console
global.console = {
  ...console,
  error: jest.fn(),
  log: jest.fn()
};

// Mock pour __DEV__
global.__DEV__ = true;

describe('useWebviews', () => {
  const mockSetCurrentScreen = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('devrait initialiser avec les valeurs par défaut', () => {
    const { result } = renderHook(() => useWebviews(mockSetCurrentScreen));

    expect(result.current.channels).toEqual([]);
    expect(result.current.selectedWebviews).toEqual([]);
    expect(result.current.webViewUrl).toBe('');
    expect(result.current.refreshInterval).toBeNull();
    expect(result.current.refreshOption).toBe('never');
    expect(result.current.isReadOnly).toBe(false);
  });

  it('devrait basculer le mode lecture seule', () => {
    const { result } = renderHook(() => useWebviews(mockSetCurrentScreen));

    act(() => {
      result.current.toggleReadOnly();
    });

    expect(result.current.isReadOnly).toBe(true);

    act(() => {
      result.current.toggleReadOnly();
    });

    expect(result.current.isReadOnly).toBe(false);
  });

  it('devrait naviguer vers la liste des webviews', () => {
    const { result } = renderHook(() => useWebviews(mockSetCurrentScreen));

    const mockChannels = [
      { id: '1', name: 'Channel 1', href: 'https://test1.com' }
    ];

    act(() => {
      result.current.navigateToChannelsList(mockChannels);
    });

    expect(result.current.channels).toEqual(mockChannels);
    expect(mockNavigate).toHaveBeenCalledWith(SCREENS.WEBVIEWS_LIST);
  });

  it('devrait naviguer vers une webview', () => {
    const { result } = renderHook(() => useWebviews(mockSetCurrentScreen));

    const mockUrl = 'https://test.com';

    act(() => {
      result.current.navigateToWebview(mockUrl);
    });

    expect(result.current.webViewUrl).toBe(mockUrl);
    expect(mockNavigate).toHaveBeenCalledWith(SCREENS.WEBVIEW);
  });
});