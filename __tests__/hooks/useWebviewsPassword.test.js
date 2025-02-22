import { renderHook, act } from '@testing-library/react-native';
import { useWebViewsPassword } from '../../hooks/useWebviewsPassword';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';

// Mock de Alert.alert
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn()
  }
}));

// Mock de SecureStore
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
}));

describe('useWebViewsPassword', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    SecureStore.getItemAsync.mockResolvedValue(null);
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useWebViewsPassword(mockNavigate));
    expect(result.current.password).toBeNull();
    expect(result.current.isPasswordRequired).toBe(false);
    expect(result.current.isPasswordDefineModalVisible).toBe(false);
    expect(result.current.passwordCheckModalVisible).toBe(false);
  });

  it('should handle password submission', () => {
    const { result } = renderHook(() => useWebViewsPassword(mockNavigate));

    act(() => {
      result.current.handlePasswordSubmit('test123');
    });

    expect(result.current.password).toBe('test123');
    expect(result.current.isPasswordRequired).toBe(true);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('password', 'test123');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('isPasswordRequired', 'true');
  });

  it('should handle password check correctly', () => {
    const { result } = renderHook(() => useWebViewsPassword(mockNavigate));

    act(() => {
      result.current.handlePasswordSubmit('test123');
      result.current.handlePasswordCheck('test123');
    });

    expect(result.current.passwordCheckModalVisible).toBe(false);
    expect(mockNavigate).toHaveBeenCalled();
  });

  it('should show alert for incorrect password', () => {
    const { result } = renderHook(() => useWebViewsPassword(mockNavigate));

    act(() => {
      result.current.handlePasswordSubmit('test123');
      result.current.handlePasswordCheck('wrong');
    });

    expect(Alert.alert).toHaveBeenCalledWith('Incorrect password');
  });
});