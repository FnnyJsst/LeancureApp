import { renderHook, act } from '@testing-library/react-native';
import { useWebviewsPassword } from '../../hooks/useWebViewsPassword';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import { SCREENS } from '../../constants/screens';

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

describe('useWebviewsPassword', () => {
  const mockNavigate = jest.fn();

  //We reset all mocks and the SecureStore before each test
  beforeEach(() => {
    jest.clearAllMocks();
    SecureStore.getItemAsync.mockResolvedValue(null);
  });

  //Test #1 : We check that the hook initializes with correct default values
  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useWebviewsPassword(mockNavigate));
    expect(result.current.password).toBeNull();
    expect(result.current.isPasswordRequired).toBe(false);
    expect(result.current.isPasswordDefineModalVisible).toBe(false);
    expect(result.current.passwordCheckModalVisible).toBe(false);
  });

  //Test #2 : We check that the password is submitted correctly
  it('should handle password submission', () => {
    const { result } = renderHook(() => useWebviewsPassword(mockNavigate));

    act(() => {
      //We submit the password
      result.current.handlePasswordSubmit('test123');
    });

    //We check that the password is submitted correctly
    expect(result.current.password).toBe('test123');
    expect(result.current.isPasswordRequired).toBe(true);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('password', 'test123');
  });

  //Test #3 : We check that the password is checked correctly
  it('should handle password check correctly', () => {
    const { result } = renderHook(() => useWebviewsPassword(mockNavigate));

    act(() => {
      result.current.handlePasswordSubmit('test123');
    });

    // Vérifions que le password est bien défini
    expect(result.current.password).toBe('test123');

    act(() => {
      result.current.handlePasswordCheck('test123');
    });

    expect(result.current.passwordCheckModalVisible).toBe(false);
    expect(mockNavigate).toHaveBeenCalledWith(SCREENS.SETTINGS);
  });

  //Test #4 : We check that the alert is shown for incorrect password
  it('should show alert for incorrect password', () => {
    const { result } = renderHook(() => useWebviewsPassword(mockNavigate));

    act(() => {
      result.current.handlePasswordSubmit('test123');
      result.current.handlePasswordCheck('wrong');
    });

    expect(Alert.alert).toHaveBeenCalledWith('Incorrect password');
  });
});