// Tests de hooks
import { renderHook } from '@testing-library/react-native';
import { useWebViews } from '../../hooks/useWebviews';

describe('useWebViews', () => {
  test('should load selected channels', async () => {
    const { result } = renderHook(() => useWebViews());
    expect(result.current.selectedWebviews).toEqual([]);
  });
});