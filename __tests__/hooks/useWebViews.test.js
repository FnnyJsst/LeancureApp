// Tests de hooks
import { renderHook } from '@testing-library/react-native';
import { useWebViews } from '../../hooks/useWebviews';
import * as SecureStore from 'expo-secure-store';

// Mock tous les hooks et dépendances
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useEffect: jest.fn((cb) => cb()),
  useState: jest.fn((initial) => [initial, jest.fn()]),
}));

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

  beforeEach(() => {
    jest.clearAllMocks();
    SecureStore.getItemAsync.mockResolvedValue(null);
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useWebViews(mockSetCurrentScreen));

    // Vérifie les valeurs initiales
    expect(result.current.selectedWebviews).toEqual([]);
    expect(result.current.webViewUrl).toBe('');
    expect(result.current.refreshInterval).toBeNull();
    expect(result.current.isReadOnly).toBe(false);
  });

  it('should provide all required functions', () => {
    const { result } = renderHook(() => useWebViews(mockSetCurrentScreen));

    // Vérifie que toutes les fonctions nécessaires sont présentes
    expect(typeof result.current.handleSelectChannels).toBe('function');
    expect(typeof result.current.saveSelectedWebviews).toBe('function');
    expect(typeof result.current.loadSelectedChannels).toBe('function');
    expect(typeof result.current.navigateToWebView).toBe('function');
    expect(typeof result.current.toggleReadOnly).toBe('function');
  });

  it('should handle refresh interval conversion correctly', () => {
    const { result } = renderHook(() => useWebViews(mockSetCurrentScreen));

    // Vérifie la conversion des intervalles
    expect(result.current.getIntervalInMilliseconds('every minute')).toBe(60000);
    expect(result.current.getIntervalInMilliseconds('every hour')).toBe(3600000);
  });

  it('should save webviews to SecureStore', () => {
    const { result } = renderHook(() => useWebViews(mockSetCurrentScreen));
    const testWebviews = [{ href: 'https://test.com' }];

    result.current.saveSelectedWebviews(testWebviews);

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'selectedWebviews',
      JSON.stringify(testWebviews)
    );
  });

  it('should handle navigation to webview', () => {
    const { result } = renderHook(() => useWebViews(mockSetCurrentScreen));
    const testUrl = 'https://test.com';

    result.current.navigateToWebView(testUrl);

    expect(result.current.webViewUrl).toBe(testUrl);
    expect(mockSetCurrentScreen).toHaveBeenCalledWith('WEBVIEW');
  });

  it('should toggle read-only mode', () => {
    const { result } = renderHook(() => useWebViews(mockSetCurrentScreen));

    result.current.toggleReadOnly();
    expect(result.current.isReadOnly).toBe(true);

    result.current.toggleReadOnly();
    expect(result.current.isReadOnly).toBe(false);
  });

  it('should handle refresh option changes', () => {
    const { result } = renderHook(() => useWebViews(mockSetCurrentScreen));
    const testOption = 'every minute';

    result.current.handleSelectOption(testOption);

    expect(result.current.refreshOption).toBe(testOption);
    expect(result.current.refreshInterval).toBe(60000);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'refreshOption',
      testOption
    );
  });
});