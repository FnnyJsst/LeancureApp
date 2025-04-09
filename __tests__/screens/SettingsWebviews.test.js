import { render, fireEvent } from '@testing-library/react-native';
import { BackHandler } from 'react-native';
import SettingsWebviews from '../../screens/webviews/SettingsWebviews';
import { SCREENS } from '../../constants/screens';

// Mock BackHandler
jest.mock('react-native/Libraries/Utilities/BackHandler', () => ({
  exitApp: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: jest.fn(),
}));

// Mock du hook useDeviceType
jest.mock('../../hooks/useDeviceType', () => ({
  useDeviceType: () => ({
    isSmartphone: true,
    isLandscape: false,
    isSmartphonePortrait: true
  })
}));

describe('SettingsWebviews', () => {

  const mockProps = {
    onNavigate: jest.fn(),
    selectedWebviews: [],
    refreshOption: 'never',
    handlePasswordSubmit: jest.fn(),
    isPasswordRequired: false,
    disablePassword: jest.fn(),
    isReadOnly: false,
    toggleReadOnly: jest.fn(),
    handleSelectOption: jest.fn(),
    isMessagesHidden: false,
    onToggleHideMessages: jest.fn(),
    testID: 'settings-webviews'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });


  describe('render', () => {
    // Test #1
    it('should render correctly', () => {
      const { getByText } = render(<SettingsWebviews {...mockProps} />);
      expect(getByText('App')).toBeTruthy();
      expect(getByText('Channels')).toBeTruthy();
      expect(getByText('Security')).toBeTruthy();
      expect(getByText('Messages')).toBeTruthy();
    });
  });

  describe('navigation', () => {
    // Test #2
    it('should call BackHandler.exitApp when quit button is pressed', () => {
      const { getByTestId } = render(<SettingsWebviews {...mockProps} />);
      const quitButton = getByTestId('quit-button');
      fireEvent.press(quitButton);
      expect(BackHandler.exitApp).toHaveBeenCalled();
    });

    // Test #3
    it('should navigate back when back button is pressed', () => {
      const { getByTestId } = render(<SettingsWebviews {...mockProps} />);
      const backButton = getByTestId('back-button');
      fireEvent.press(backButton);
      expect(mockProps.onNavigate).toHaveBeenCalledWith('NO_URL');
    });
  });

  describe('modals', () => {
    // Test #4
    it('should open password define modal when password button is pressed', () => {
      const { getByTestId } = render(<SettingsWebviews {...mockProps} />);
      const passwordButton = getByTestId('open-password-button');
      fireEvent.press(passwordButton);
      expect(getByTestId('password-define-modal')).toBeTruthy();
    });

    it("should open read only modal when read only button is pressed", () => {
      const { getByTestId } = render(<SettingsWebviews {...mockProps} />);
      const readOnlyButton = getByTestId('open-read-only-button');
      fireEvent.press(readOnlyButton);
      expect(getByTestId('read-only-modal')).toBeTruthy();
    });

    it("should open auto refresh modal when auto refresh button is pressed", () => {
      const { getByTestId } = render(<SettingsWebviews {...mockProps} />);
      const autoRefreshButton = getByTestId('open-auto-refresh-button');
      fireEvent.press(autoRefreshButton);
      expect(getByTestId('auto-refresh-modal')).toBeTruthy();
    });


    it("should open hide messages modal when hide messages button is pressed", () => {
      const { getByTestId } = render(<SettingsWebviews {...mockProps} />);
      const hideMessagesButton = getByTestId('open-hide-messages-button');
      fireEvent.press(hideMessagesButton);
      expect(getByTestId('hide-messages-modal')).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    it('should navigate back to webview when back button is pressed and webviews exist', () => {
      const propsWithWebviews = {
        ...mockProps,
        selectedWebviews: [{ href: 'test.com', title: 'Test' }]
      };
      const { getByTestId } = render(<SettingsWebviews {...propsWithWebviews} />);

      fireEvent.press(getByTestId('back-button'));
      expect(mockProps.onNavigate).toHaveBeenCalledWith(SCREENS.WEBVIEW);
    });

    it('should navigate to NO_URL when back button is pressed and no webviews exist', () => {
      const { getByTestId } = render(<SettingsWebviews {...mockProps} />);

      fireEvent.press(getByTestId('back-button'));
      expect(mockProps.onNavigate).toHaveBeenCalledWith(SCREENS.NO_URL);
    });
  });

  describe('Auto-refresh settings', () => {
    it('should display current refresh option', () => {
      const propsWithRefresh = {
        ...mockProps,
        refreshOption: 'every hour'
      };
      const { getByText } = render(<SettingsWebviews {...propsWithRefresh} />);

      expect(getByText('1h')).toBeTruthy();
    });

    it('should open auto-refresh modal', () => {
      const { getByTestId } = render(<SettingsWebviews {...mockProps} />);

      fireEvent.press(getByTestId('open-auto-refresh-button'));
      expect(getByTestId('auto-refresh-modal')).toBeTruthy();
    });
  });

  describe('Security settings', () => {
    it('should display current read-only status', () => {
      const propsWithReadOnly = {
        ...mockProps,
        isReadOnly: true
      };
      const { getByText } = render(<SettingsWebviews {...propsWithReadOnly} />);

      expect(getByText('Yes')).toBeTruthy();
    });

    it('should display current password status', () => {
      const propsWithPassword = {
        ...mockProps,
        isPasswordRequired: true
      };
      const { getByText } = render(<SettingsWebviews {...propsWithPassword} />);

      expect(getByText('Yes')).toBeTruthy();
    });
  });

  describe('Messages settings', () => {
    it('should display current messages visibility status', () => {
      const propsWithHiddenMessages = {
        ...mockProps,
        isMessagesHidden: true
      };
      const { getByText } = render(<SettingsWebviews {...propsWithHiddenMessages} />);

      expect(getByText('Hide')).toBeTruthy();
    });

    it('should open hide messages modal', () => {
      const { getByTestId } = render(<SettingsWebviews {...mockProps} />);

      fireEvent.press(getByTestId('open-hide-messages-button'));
      expect(getByTestId('hide-messages-modal')).toBeTruthy();
    });
  });

  describe('App quit functionality', () => {
    it('should handle quit app action', () => {
      const mockExitApp = jest.spyOn(BackHandler, 'exitApp');
      const { getByTestId } = render(<SettingsWebviews {...mockProps} />);

      fireEvent.press(getByTestId('quit-button'));
      expect(mockExitApp).toHaveBeenCalled();
    });
  });
});
