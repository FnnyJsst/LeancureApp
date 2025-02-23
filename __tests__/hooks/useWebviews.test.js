import { renderHook, act } from '@testing-library/react-native';
import { useWebviews } from '../../hooks/useWebviews';
import * as SecureStore from 'expo-secure-store';
import { SCREENS } from '../../constants/screens';

// Mock des modules
jest.mock('expo-secure-store');
jest.mock('../../hooks/useNavigation', () => ({
  useNavigation: () => ({
    navigate: jest.fn()
  })
}));

// Mock de useWebviewsPassword
jest.mock('../../hooks/useWebviewsPassword', () => ({
  useWebviewsPassword: () => ({
    password: null,
    setPassword: jest.fn(),
    isPasswordRequired: false,
    setIsPasswordRequired: jest.fn(),
    isPasswordDefineModalVisible: false,
    setPasswordDefineModalVisible: jest.fn(),
    passwordCheckModalVisible: false,
    setPasswordCheckModalVisible: jest.fn(),
    handlePasswordSubmit: jest.fn(),
    handlePasswordCheck: jest.fn(),
    disablePassword: jest.fn(),
    loadPasswordFromSecureStore: jest.fn(),
    savePasswordInSecureStore: jest.fn(),
    openPasswordDefineModal: jest.fn(),
    closePasswordDefineModal: jest.fn(),
  })
}));

const mockSetInterval = jest.fn();
const mockClearInterval = jest.fn();
global.setInterval = mockSetInterval;
global.clearInterval = mockClearInterval;

//Mock de useNavigation
describe('useWebviews', () => {
  const mockSetCurrentScreen = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    SecureStore.getItemAsync.mockResolvedValue(null);
    SecureStore.setItemAsync.mockResolvedValue();
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useWebviews(mockSetCurrentScreen));

    expect(result.current.channels).toEqual([]);
    expect(result.current.selectedWebviews).toEqual([]);
    expect(result.current.webViewUrl).toEqual('');
    expect(result.current.refreshInterval).toBeNull();
    expect(result.current.refreshOption).toEqual('manual');
    expect(result.current.isReadOnly).toEqual(false);
  });

  it('should handle channel selection correctly', async () => {
    const { result } = renderHook(() => useWebviews(mockSetCurrentScreen));

    await act(async () => {
      await result.current.handleSelectChannels(['channel1', 'channel2']);
    });

    expect(result.current.selectedWebviews).toEqual(['channel1', 'channel2']);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'selectedWebviews',
      JSON.stringify(['channel1', 'channel2'])
    );
  });

  it('should handle interval in milliseconds correctly', () => {
    const { result } = renderHook(() => useWebviews(mockSetCurrentScreen));

    act(() => {
      result.current.handleSelectOption('every minute');
    });

    expect(result.current.refreshInterval).toEqual(60000);
    expect(result.current.refreshOption).toEqual('every minute');
  });

  //Test #2 : We check that the channel selection is handled correctly
  it('should handle channel selection correctly', async () => {
    const { result } = renderHook(() => useWebviews(mockSetCurrentScreen));

    await act(async () => {
      await result.current.handleSelectChannels(['channel1', 'channel2']);
    });

    expect(result.current.selectedWebviews).toEqual(['channel1', 'channel2']);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'selectedWebviews',
      JSON.stringify(['channel1', 'channel2'])
    );
  });

  //Test #3 : We check that the interval in milliseconds is handled correctly
  it('should handle interval in milliseconds correctly', () => {
    const { result } = renderHook(() => useWebviews(mockSetCurrentScreen));

    act(() => {
      result.current.handleSelectOption('every minute');
    });

    expect(result.current.refreshInterval).toEqual(60000);
    expect(result.current.refreshOption).toEqual('every minute');
  });

  //Test #4 : We check that the refresh option is saved correctly
  it('should save refresh option correctly', async () => {
    const { result } = renderHook(() => useWebviews(mockSetCurrentScreen));

    await act(async () => {
      result.current.handleSelectOption('every minute');
    });

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('refreshOption', 'every minute');
  });

  //Test #5 : We check that the selected webviews are saved correctly
  it('should save selected webviews correctly', () => {
    const { result } = renderHook(() => useWebviews(mockSetCurrentScreen));

    act(() => {
      result.current.handleSelectChannels(['channel1', 'channel2']);
    });

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'selectedWebviews',
      JSON.stringify(['channel1', 'channel2'])
    );
  });

  //Test #6 : We check that the refresh option is loaded correctly
  it('should load refresh option correctly', () => {
    const { result } = renderHook(() => useWebviews(mockSetCurrentScreen));

    expect(result.current.refreshOption).toEqual('manual');
  });

  //Test #7 : We check that the selected webviews are loaded correctly
  it('should load selected webviews correctly', () => {
    const { result } = renderHook(() => useWebviews(mockSetCurrentScreen));

    expect(result.current.selectedWebviews).toEqual([]);
  });

  //Test #8 : We check that the navigateToChannelsList function is called correctly
  it('should navigate to channels list correctly', () => {
    const { result } = renderHook(() => useWebviews(mockSetCurrentScreen));

    act(() => {
      result.current.navigateToChannelsList(['channel1', 'channel2']);
    });

    expect(mockSetCurrentScreen).toHaveBeenCalledWith(SCREENS.WEBVIEWS_LIST);
  });

  //Test #9 : We check that the toggle read only mode function is called correctly
  it('should toggle read only mode correctly', () => {
    const { result } = renderHook(() => useWebviews(mockSetCurrentScreen));

    act(() => {
      result.current.toggleReadOnly(true);
    });

    expect(result.current.isReadOnly).toBe(true);
  });

  //Test #10 : We check that the navigate to webview function is called correctly
  it('should navigate to webview correctly', () => {
    const { result } = renderHook(() => useWebviews(mockSetCurrentScreen));
    const url = 'https://example.com';

    act(() => {
      result.current.navigateToWebview(url);
    });

    expect(result.current.webViewUrl).toBe(url);
    expect(mockSetCurrentScreen).toHaveBeenCalledWith(SCREENS.WEBVIEW);
  });

  //Test #11 : We check that the saved webviews are loaded correctly
  // it('should load saved webviews on init', async () => {
  //   SecureStore.getItemAsync
  //     .mockImplementation((key) => {
  //       if (key === 'selectedWebviews') {
  //         return Promise.resolve(JSON.stringify(['channel1']));
  //       }
  //       if (key === 'refreshOption') {
  //         return Promise.resolve('manual');
  //       }
  //       return Promise.resolve(null);
  //     });

  //   const { result, unmount } = renderHook(() => useWebviews(mockSetCurrentScreen));

  //   await act(async () => {
  //     jest.runAllTimers();
  //     await Promise.resolve();
  //   });

  //   expect(result.current.selectedWebviews).toEqual(['channel1']);

  //   unmount();
  // });

  //Test #12 : We check that the error during webviews selection is handled correctly
  it('should handle error during webviews selection', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    SecureStore.setItemAsync.mockRejectedValueOnce(new Error('Storage error'));

    const { result } = renderHook(() => useWebviews(mockSetCurrentScreen));

    await act(async () => {
      await result.current.handleSelectChannels(['channel1']);
    });

    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('should clean up interval on unmount', () => {
    const { result, unmount } = renderHook(() => useWebviews(mockSetCurrentScreen));

    act(() => {
      result.current.handleSelectOption('every minute');
    });

    unmount();
    expect(mockClearInterval).toHaveBeenCalled();
  });
});
