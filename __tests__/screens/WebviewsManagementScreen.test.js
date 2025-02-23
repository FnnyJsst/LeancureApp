import { render, fireEvent } from '@testing-library/react-native';
import WebviewsManagementScreen from '../../screens/webviews/WebviewsManagementScreen';

// Mock des modules expo
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock de expo-constants
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        eas: {
          projectId: 'test',
        },
      },
    },
  },
}));

// Mock de expo-asset
jest.mock('expo-asset', () => ({
  Asset: {
    fromModule: () => ({ uri: 'test' }),
  },
}));

// Mock de expo-font
jest.mock('expo-font', () => ({
  loadAsync: jest.fn(),
}));

// Mock de expo-modules-core
jest.mock('expo-modules-core', () => ({
  requireNativeModule: () => ({}),
  requireOptionalNativeModule: () => null,
  NativeModulesProxy: {
    ExpoFont: {
      loadAsync: jest.fn(),
    },
    ExponentConstants: {
      getConstants: () => ({}),
    },
    ExpoAsset: {
      getConstants: () => ({}),
    },
  },
}));

// Mock des icônes
jest.mock('@expo/vector-icons/AntDesign', () => 'AntDesign');
jest.mock('@expo/vector-icons/EvilIcons', () => 'EvilIcons');
jest.mock('@expo/vector-icons/Ionicons', () => 'Ionicons');
jest.mock('@expo/vector-icons/Entypo', () => 'Entypo');

// Mock du hook useDeviceType
jest.mock('../../hooks/useDeviceType', () => ({
  useDeviceType: () => ({
    isSmartphone: true,
    isLandscape: false,
    isSmartphonePortrait: true
  })
}));

describe('WebviewsManagementScreen', () => {
  const mockProps = {
    onImport: jest.fn(),
    selectedWebviews: [],
    setSelectedWebviews: jest.fn(),
    saveSelectedWebviews: jest.fn(),
    onNavigate: jest.fn(),
    onNavigateToWebview: jest.fn(),
    isReadOnly: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle webview selection', () => {
    const { getByTestId } = render(<WebviewsManagementScreen {...mockProps} />);
    const webviewItem = getByTestId('webview-item-0');
    fireEvent.press(webviewItem);
    expect(mockProps.setSelectedWebviews).toHaveBeenCalled();
  });

  it('should handle webview navigation', () => {
    const { getByTestId } = render(<WebviewsManagementScreen {...mockProps} />);
    const navigateButton = getByTestId('navigate-button-0');
    fireEvent.press(navigateButton);
    expect(mockProps.onNavigateToWebview).toHaveBeenCalled();
  });

  it('should handle import action', () => {
    const { getByTestId } = render(<WebviewsManagementScreen {...mockProps} />);
    const importButton = getByTestId('import-button');
    fireEvent.press(importButton);
    expect(mockProps.onImport).toHaveBeenCalled();
  });

  it('should disable actions in read-only mode', () => {
    const { getByTestId } = render(
      <WebviewsManagementScreen {...mockProps} isReadOnly={true} />
    );
    const importButton = getByTestId('import-button');
    expect(importButton).toBeDisabled();
  });

  it('should save webviews after reordering', async () => {
    const { getByTestId } = render(
      <WebviewsManagementScreen
        {...mockProps}
        selectedWebviews={[
          { id: '1', title: 'Webview 1' },
          { id: '2', title: 'Webview 2' }
        ]}
      />
    );

    const moveUpButton = getByTestId('move-up-1');
    fireEvent.press(moveUpButton);

    expect(mockProps.saveSelectedWebviews).toHaveBeenCalled();
    expect(mockProps.setSelectedWebviews).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: '2' }),
        expect.objectContaining({ id: '1' })
      ])
    );
  });

  it('should handle webview deletion', () => {
    const { getByTestId } = render(
      <WebviewsManagementScreen
        {...mockProps}
        selectedWebviews={[{ id: '1', title: 'Webview 1' }]}
      />
    );

    const deleteButton = getByTestId('delete-button-1');
    fireEvent.press(deleteButton);

    expect(mockProps.setSelectedWebviews).toHaveBeenCalledWith([]);
    expect(mockProps.saveSelectedWebviews).toHaveBeenCalledWith([]);
  });

  it('should handle webview editing', () => {
    const { getByTestId } = render(
      <WebviewsManagementScreen
        {...mockProps}
        selectedWebviews={[
          { href: '1', title: 'Webview 1' }
        ]}
      />
    );

    const editButton = getByTestId('edit-button-0');
    fireEvent.press(editButton);

    // Vérifier que le modal d'édition est affiché
    expect(getByTestId('edit-modal')).toBeTruthy();
  });
});
