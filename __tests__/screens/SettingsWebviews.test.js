import { render, fireEvent } from '@testing-library/react-native';
import { BackHandler } from 'react-native';
import SettingsWebviews from '../../screens/webviews/SettingsWebviews';

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
    refreshOption: 'manual',
    handlePasswordSubmit: jest.fn(),
    isPasswordRequired: false,
    disablePassword: jest.fn(),
    isReadOnly: false,
    toggleReadOnly: jest.fn(),
    handleSelectOption: jest.fn(),
    isMessagesHidden: false,
    onToggleHideMessages: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test #1
  it('should render correctly', () => {
    const { getByText } = render(<SettingsWebviews {...mockProps} />);
    expect(getByText('App')).toBeTruthy();
    expect(getByText('Channels')).toBeTruthy();
    expect(getByText('Security')).toBeTruthy();
    expect(getByText('Messages')).toBeTruthy();
  });

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


