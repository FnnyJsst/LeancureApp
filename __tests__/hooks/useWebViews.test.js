// Tests de hooks
import { renderHook } from '@testing-library/react-native';
import { useWebViews } from '../../hooks/useWebviews';
import * as SecureStore from 'expo-secure-store';

// Mock des dépendances externes
jest.mock('../../hooks/useNavigation', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn()
  })
}));

jest.mock('../../hooks/useWebViewsPassword', () => ({
  useWebViewsPassword: () => ({
    password: null,
    isPasswordRequired: false,
    handlePasswordCheck: jest.fn(),
    loadPasswordFromSecureStore: jest.fn()
  })
}));

describe('useWebViews', () => {
  const mockSetCurrentScreen = jest.fn();

  beforeAll(() => {
    jest.useFakeTimers(); // Utiliser des timers simulés
  });

  afterAll(() => {
    jest.useRealTimers(); // Restaurer les timers réels
  });

  beforeEach(() => {
    jest.clearAllMocks();
    SecureStore.getItemAsync.mockResolvedValue(null);
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useWebViews(mockSetCurrentScreen));
    jest.runAllTimers(); // Exécuter tous les timers en attente

    expect(result.current.selectedWebviews).toEqual([]);
    expect(result.current.webViewUrl).toBe('');
  });

  it('should load stored webviews', () => {
    const mockWebviews = [{ href: 'https://test.com' }];
    SecureStore.getItemAsync.mockImplementation((key) => {
      switch (key) {
        case 'selectedWebviews':
          return Promise.resolve(JSON.stringify(mockWebviews));
        case 'refreshOption':
          return Promise.resolve(null);
        default:
          return Promise.resolve(null);
      }
    });

    const { result } = renderHook(() => useWebViews(mockSetCurrentScreen));
    jest.runAllTimers(); // Exécuter tous les timers en attente

    expect(result.current.selectedWebviews).toEqual(mockWebviews);
  });
});