import { renderHook, act } from '@testing-library/react-native';
import { useTimeout } from '../../hooks/useTimeout';
import * as SecureStore from 'expo-secure-store';

// Mock SecureStore
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
}));

describe('useTimeout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    SecureStore.getItemAsync.mockResolvedValue(null);
  });

  it('should initialize with null timeout interval', () => {
    const { result } = renderHook(() => useTimeout());
    expect(result.current.timeoutInterval).toBeNull();
  });

  it('should handle timeout selection correctly', () => {
    const { result } = renderHook(() => useTimeout());

    act(() => {
      result.current.handleTimeoutSelection('after 2 hours');
    });

    expect(result.current.timeoutInterval).toBe(7200 * 1000); // 2 hours in milliseconds
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('timeoutInterval', '7200');
  });

  it('should handle "never" timeout selection', () => {
    const { result } = renderHook(() => useTimeout());

    act(() => {
      result.current.handleTimeoutSelection('never');
    });

    expect(result.current.timeoutInterval).toBeNull();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('timeoutInterval');
  });

  it('should load stored timeout interval on init', async () => {
    SecureStore.getItemAsync.mockResolvedValue('7200'); // 2 hours stored

    const { result } = renderHook(() => useTimeout());

    // Attendre que le loadTimeoutInterval soit exécuté
    await act(async () => {
      await result.current.loadTimeoutInterval();
    });

    expect(result.current.timeoutInterval).toBe(7200 * 1000);
  });

  it('should handle errors when saving timeout', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    SecureStore.setItemAsync.mockRejectedValue(new Error('Storage error'));

    const { result } = renderHook(() => useTimeout());

    act(() => {
      result.current.handleTimeoutSelection('after 2 hours');
    });

    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('should handle errors when loading timeout', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    SecureStore.getItemAsync.mockRejectedValue(new Error('Loading error'));

    const { result } = renderHook(() => useTimeout());

    await act(async () => {
      await result.current.loadTimeoutInterval();
    });

    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});