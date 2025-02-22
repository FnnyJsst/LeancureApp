// Tests de hooks
import { renderHook, act } from '@testing-library/react-native';
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
    handlePasswordCheck: jest.fn()
  })
}));

describe('useWebViews', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useWebViews());
    expect(result.current.selectedWebviews).toEqual([]);
    expect(result.current.webViewUrl).toBe('');
  });

  it('should load stored webviews', async () => {
    // Préparer les données de test
    const mockWebviews = [{ href: 'https://test.com' }];
    SecureStore.getItemAsync.mockImplementation((key) => {
      switch (key) {
        case 'selectedWebviews':
          return Promise.resolve(JSON.stringify(mockWebviews));
        default:
          return Promise.resolve(null);
      }
    });

    const { result } = renderHook(() => useWebViews());

    // Attendre que les effets soient appliqués
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.selectedWebviews).toEqual(mockWebviews);
  });
});