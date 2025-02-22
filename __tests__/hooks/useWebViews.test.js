// Tests de hooks
import { renderHook, act } from '@testing-library/react-native';
import { useWebViews } from '../../hooks/useWebviews';
import * as SecureStore from 'expo-secure-store';

// Mock React avec un vrai useState
jest.mock('react', () => {
  const originalModule = jest.requireActual('react');

  return {
    ...originalModule,
    useEffect: jest.fn((cb) => cb()),
  };
});

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

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useWebViews(mockSetCurrentScreen));
    expect(result.current.selectedWebviews).toEqual([]);
    expect(result.current.webViewUrl).toBe('');
    expect(result.current.refreshInterval).toBeNull();
    expect(result.current.isReadOnly).toBe(false);
  });

  it('should provide all required functions', () => {
    const { result } = renderHook(() => useWebViews(mockSetCurrentScreen));
    expect(typeof result.current.handleSelectChannels).toBe('function');
    expect(typeof result.current.saveSelectedWebviews).toBe('function');
    expect(typeof result.current.loadSelectedChannels).toBe('function');
    expect(typeof result.current.navigateToWebView).toBe('function');
    expect(typeof result.current.toggleReadOnly).toBe('function');
  });

  it('should handle refresh interval conversion correctly', () => {
    const { result } = renderHook(() => useWebViews(mockSetCurrentScreen));
    expect(result.current.getIntervalInMilliseconds('every minute')).toBe(60000);
    expect(result.current.getIntervalInMilliseconds('every hour')).toBe(3600000);
  });

  it('should toggle read-only mode', async () => {
    const { result } = renderHook(() => useWebViews(mockSetCurrentScreen));

    await act(async () => {
      result.current.toggleReadOnly();
    });

    expect(result.current.isReadOnly).toBe(true);

    await act(async () => {
      result.current.toggleReadOnly();
    });

    expect(result.current.isReadOnly).toBe(false);
  });

  it('should handle refresh option changes', async () => {
    const { result } = renderHook(() => useWebViews(mockSetCurrentScreen));
    const testOption = 'every minute';

    await act(async () => {
      result.current.handleSelectOption(testOption);
    });

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'refreshOption',
      testOption
    );
  });
});