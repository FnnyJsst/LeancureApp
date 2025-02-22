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

  it('should initialize correctly', () => {
    const { result } = renderHook(() => useWebViews(mockSetCurrentScreen));
    expect(result.current).toBeDefined();
    expect(typeof result.current.handleSelectChannels).toBe('function');
  });
});