import { renderHook, act } from '@testing-library/react-native';
import { useNavigation } from '../../hooks/useNavigation';
import { SCREENS } from '../../constants/screens';

describe('useNavigation', () => {
  const mockSetCurrentScreen = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  //Test #1
  it('should initialize with navigate function', () => {
    const { result } = renderHook(() => useNavigation(mockSetCurrentScreen));
    expect(result.current.navigate).toBeDefined();
    expect(typeof result.current.navigate).toBe('function');
  });

  //Test #2
  it('should navigate to the specified screen', () => {
    const { result } = renderHook(() => useNavigation(mockSetCurrentScreen));

    act(() => {
      result.current.navigate(SCREENS.SETTINGS);
    });

    expect(mockSetCurrentScreen).toHaveBeenCalledWith(SCREENS.SETTINGS);
  });

  //Test #3
  it('should handle navigation to different screens', () => {
    const { result } = renderHook(() => useNavigation(mockSetCurrentScreen));

    act(() => {
      result.current.navigate(SCREENS.WEBVIEW);
    });
    expect(mockSetCurrentScreen).toHaveBeenCalledWith(SCREENS.WEBVIEW);

    act(() => {
      result.current.navigate(SCREENS.NO_URL);
    });
    expect(mockSetCurrentScreen).toHaveBeenCalledWith(SCREENS.NO_URL);
  });

  //Test #4
  it('should not navigate if screen is undefined', () => {
    const { result } = renderHook(() => useNavigation(mockSetCurrentScreen));

    act(() => {
      result.current.navigate(undefined);
    });

    expect(mockSetCurrentScreen).not.toHaveBeenCalled();
  });

  //Test #5
  it('should handle consecutive navigations', () => {
    const { result } = renderHook(() => useNavigation(mockSetCurrentScreen));

    act(() => {
      result.current.navigate(SCREENS.SETTINGS);
      result.current.navigate(SCREENS.WEBVIEW);
      result.current.navigate(SCREENS.NO_URL);
    });

    expect(mockSetCurrentScreen).toHaveBeenCalledTimes(3);
    expect(mockSetCurrentScreen).toHaveBeenNthCalledWith(1, SCREENS.SETTINGS);
    expect(mockSetCurrentScreen).toHaveBeenNthCalledWith(2, SCREENS.WEBVIEW);
    expect(mockSetCurrentScreen).toHaveBeenNthCalledWith(3, SCREENS.NO_URL);
  });

  describe('navigate', () => {
    it('should handle undefined screen', () => {
      const { result } = renderHook(() => useNavigation(mockSetCurrentScreen));

      act(() => {
        result.current.navigate(undefined);
      });

      expect(mockSetCurrentScreen).not.toHaveBeenCalled();
    });

    it('should handle invalid screen name', () => {
      const { result } = renderHook(() => useNavigation(mockSetCurrentScreen));

      act(() => {
        result.current.navigate('INVALID_SCREEN');
      });

      expect(mockSetCurrentScreen).not.toHaveBeenCalled();
    });
  });

  describe('goBack', () => {
    it('should navigate back to previous screen based on hierarchy', () => {
      const { result } = renderHook(() => useNavigation(mockSetCurrentScreen));

      act(() => {
        const goBackHandler = result.current.goBack();
        goBackHandler(SCREENS.WEBVIEWS_MANAGEMENT);
      });

      expect(mockSetCurrentScreen).toHaveBeenCalledWith(SCREENS.SETTINGS);
    });

    it('should navigate to default screen if current screen not in hierarchy', () => {
      const { result } = renderHook(() => useNavigation(mockSetCurrentScreen));

      act(() => {
        const goBackHandler = result.current.goBack(SCREENS.NO_URL);
        goBackHandler('INVALID_SCREEN');
      });

      expect(mockSetCurrentScreen).toHaveBeenCalledWith(SCREENS.NO_URL);
    });

    it('should use APP_MENU as default fallback screen', () => {
      const { result } = renderHook(() => useNavigation(mockSetCurrentScreen));

      act(() => {
        const goBackHandler = result.current.goBack();
        goBackHandler('INVALID_SCREEN');
      });

      expect(mockSetCurrentScreen).toHaveBeenCalledWith(SCREENS.APP_MENU);
    });
  });
});