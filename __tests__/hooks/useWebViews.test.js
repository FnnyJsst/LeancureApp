// Tests de hooks
import { renderHook } from '@testing-library/react-native';
import { useWebViews } from '../../hooks/useWebviews';
import * as SecureStore from 'expo-secure-store';

describe('useWebViews', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    SecureStore.getItemAsync.mockResolvedValue(null);
  });

  test('should initialize with empty selectedWebviews', async () => {
    const { result } = renderHook(() => useWebViews());
    expect(result.current.selectedWebviews).toEqual([]);
  });

  test('should load stored webviews', async () => {
    const mockWebviews = [{ href: 'https://test.com' }];
    SecureStore.getItemAsync.mockResolvedValue(JSON.stringify(mockWebviews));

    const { result } = renderHook(() => useWebViews());

    // Wait for the async operation to complete
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(result.current.selectedWebviews).toEqual(mockWebviews);
  });
});