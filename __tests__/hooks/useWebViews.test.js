// Tests de hooks
import { renderHook, act } from '@testing-library/react-native';
import { useWebViews } from '../../hooks/useWebviews';
import * as SecureStore from 'expo-secure-store';

describe('useWebViews', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    SecureStore.getItemAsync.mockResolvedValue(null);
  });

  test('should initialize with empty selectedWebviews', () => {
    const { result } = renderHook(() => useWebViews());
    expect(result.current.selectedWebviews).toEqual([]);
  });

  test('should load stored webviews', async () => {
    const mockWebviews = [{ href: 'https://test.com' }];
    SecureStore.getItemAsync.mockResolvedValue(JSON.stringify(mockWebviews));

    const { result } = renderHook(() => useWebViews());

    // Utilisation de act pour wrapper les mises à jour d'état
    await act(async () => {
      // Attend que toutes les promesses soient résolues
      await new Promise(resolve => setImmediate(resolve));
    });

    expect(result.current.selectedWebviews).toEqual(mockWebviews);
  });
});