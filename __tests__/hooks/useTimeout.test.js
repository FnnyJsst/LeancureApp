import { renderHook, act } from '@testing-library/react-native';
import { useTimeout } from '../../hooks/useTimeout';
import * as SecureStore from 'expo-secure-store';

// We create a mock for the SecureStore used in the useTimeout hook
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
}));

// We create a test suite for the useTimeout hook
describe('useTimeout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    SecureStore.getItemAsync.mockResolvedValue(null);
  });

  // Test #1: Initialize with null timeout interval
  it('should initialize with null timeout interval', () => {
    const { result } = renderHook(() => useTimeout());
    expect(result.current.timeoutInterval).toBeNull();
  });

  // Test #2: Handle timeout selection correctly
  it('should handle timeout selection correctly', () => {
    const { result } = renderHook(() => useTimeout());

    // We select the timeout interval to be 2 hours
    act(() => {
      result.current.handleTimeoutSelection('after 2 hours');
    });

    // We expect the result to be 2 hours in milliseconds
    expect(result.current.timeoutInterval).toBe(7200 * 1000); // 2 hours in milliseconds
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('timeoutInterval', '7200');
  });

  // Test #3: Load stored timeout interval on init
  it('should load stored timeout interval on init', async () => {
    // We mock the SecureStore to return 2 hours
    SecureStore.getItemAsync.mockResolvedValue('7200'); // 2 hours stored

    // We render the hook
    const { result } = renderHook(() => useTimeout());

    // We wait for the loadTimeoutInterval to be executed
    await act(async () => {
      await result.current.loadTimeoutInterval();
    });

    // We expect the result to be 2 hours in milliseconds
    expect(result.current.timeoutInterval).toBe(7200 * 1000);
  });

  // Test #4: Handle errors when saving timeout
  it('should handle errors when saving timeout', async () => {
    // We mock the console to log errors
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    // We mock the SecureStore to return an error
    SecureStore.setItemAsync.mockRejectedValue(new Error('Storage error'));

    // We render the hook
    const { result } = renderHook(() => useTimeout());

    // We select the timeout interval to be 2 hours
    await act(async () => {
      await result.current.handleTimeoutSelection('after 2 hours');
    });

    expect(consoleError).toHaveBeenCalledWith('Error during the saving of the timeout:', expect.any(Error));
    consoleError.mockRestore();
  });

  // Test #5: Handle errors when loading timeout
  it('should handle errors when loading timeout', async () => {
    // We mock the console to log errors
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    // We mock the SecureStore to return an error
    SecureStore.getItemAsync.mockRejectedValue(new Error('Loading error'));

    // We render the hook
    const { result } = renderHook(() => useTimeout());

    // We wait for the loadTimeoutInterval to be executed
    await act(async () => {
      await result.current.loadTimeoutInterval();
    });

    // We expect the console to log an error
    expect(consoleError).toHaveBeenCalledWith('Error during the loading of the timeout:', expect.any(Error));
    consoleError.mockRestore();
  });
});