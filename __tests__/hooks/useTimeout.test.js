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

  // Test #3: Handle "never" timeout selection
  it('should handle "never" timeout selection', () => {
    const { result } = renderHook(() => useTimeout());

    act(() => {
      result.current.handleTimeoutSelection('never');
    });

    expect(result.current.timeoutInterval).toBeNull();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('timeoutInterval');
  });

  // Test #4: Load stored timeout interval on init
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

  // Test #5: Handle errors when saving timeout
  it('should handle errors when saving timeout', async () => {
    // Capture console.error calls
    const consoleError = jest.spyOn(console, 'error');
    SecureStore.setItemAsync.mockImplementation(() => {
      throw new Error('Storage error');
    });

    const { result } = renderHook(() => useTimeout());

    await act(async () => {
      result.current.handleTimeoutSelection('after 2 hours');
    });

    // Check that console.error was called with the correct message
    expect(consoleError).toHaveBeenCalled();

    // Clean up the mock
    consoleError.mockRestore();
  });

  // Test #6: Handle errors when loading timeout
  it('should handle errors when loading timeout', async () => {
    const consoleError = jest.spyOn(console, 'error');
    SecureStore.getItemAsync.mockImplementation(() => {
      throw new Error('Loading error');
    });

    const { result } = renderHook(() => useTimeout());

    await act(async () => {
      await result.current.loadTimeoutInterval();
    });

    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
