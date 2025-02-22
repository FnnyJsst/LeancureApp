import { renderHook, act } from '@testing-library/react-native';
import { useTimeout } from '../../hooks/useTimeout';
import * as SecureStore from 'expo-secure-store';

// We create a mock for the SecureStore used in the useWebviewsPassword hook
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
}));

// We create a test suite for the useWebviewsPassword hook
describe('useWebviewsPassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    SecureStore.getItemAsync.mockResolvedValue(null);
  });

  it('should initialize with null password', () => {
    const { result } = renderHook(() => useWebviewsPassword());
    expect(result.current.password).toBeNull();
  });
});