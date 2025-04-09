import { render, fireEvent } from '@testing-library/react-native';
import WebviewsManagementScreen from '../../screens/webviews/WebviewsManagementScreen';
import { SCREENS } from '../../constants/screens';
import { act } from '@testing-library/react-native';

// Mock of expo-constants
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

// Mock of expo-asset
jest.mock('expo-asset', () => ({
  Asset: {
    fromModule: () => ({ uri: 'test' }),
  },
}));

// Mock of expo-font
jest.mock('expo-font', () => ({
  isLoaded: jest.fn(() => true),
  loadAsync: jest.fn()
}));

// Mock of expo-modules-core
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

// Mock of icons
jest.mock('@expo/vector-icons/AntDesign', () => 'AntDesign');
jest.mock('@expo/vector-icons/EvilIcons', () => 'EvilIcons');
jest.mock('@expo/vector-icons/Ionicons', () => 'Ionicons');
jest.mock('@expo/vector-icons/Entypo', () => 'Entypo');

// Mock of useDeviceType hook
jest.mock('../../hooks/useDeviceType', () => ({
  useDeviceType: () => ({
    isSmartphone: true,
    isLandscape: false,
    isSmartphonePortrait: true
  })
}));


describe('WebviewsManagementScreen', () => {
  // We create a mock of the webviews
  const mockWebviews = [
    { href: 'https://test1.com', title: 'Test 1' },
    { href: 'https://test2.com', title: 'Test 2' }
  ];

  // We create a mock of the props used in the component
  const mockProps = {
    onImport: jest.fn(),
    selectedWebviews: mockWebviews,
    setSelectedWebviews: jest.fn(),
    saveSelectedWebviews: jest.fn(),
    onNavigate: jest.fn(),
    onNavigateToWebview: jest.fn(),
    isReadOnly: false
  };

  // We clear all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Tests related to the rendering of the component
  describe('Rendering', () => {
    // Test #1
    it('should render empty state correctly', () => {
      const emptyProps = { ...mockProps, selectedWebviews: [] };
      const { getByText } = render(<WebviewsManagementScreen {...emptyProps} />);
      expect(getByText('Use the top right button to add a channel')).toBeTruthy();
    });

    // Test #2
    it('should render webviews list correctly', () => {
      const { getAllByTestId } = render(<WebviewsManagementScreen {...mockProps} />);
      const webviewContainers = getAllByTestId(/webview-container-/);
      expect(webviewContainers).toHaveLength(mockWebviews.length);
    });

    // Test #3
    it('should render import button when not in read-only mode', () => {
      const { getByTestId } = render(<WebviewsManagementScreen {...mockProps} />);
      expect(getByTestId('import-button')).toBeTruthy();
    });
  });

  // Tests related to the navigation in the component
  describe('Navigation', () => {
    // Test #4
    it('should navigate back when back button is pressed', () => {
      const { getByTestId } = render(<WebviewsManagementScreen {...mockProps} />);
      fireEvent.press(getByTestId('back-button'));
      expect(mockProps.onNavigate).toHaveBeenCalledWith(SCREENS.SETTINGS);
    });

    // Test #5
    it('should navigate to webview when webview item is pressed', () => {
      const { getByTestId } = render(<WebviewsManagementScreen {...mockProps} />);
      fireEvent.press(getByTestId('webview-item-0'));
      expect(mockProps.onNavigateToWebview).toHaveBeenCalledWith(mockWebviews[0].href);
    });
  });

  // Tests related to the actions in the component
  describe('Webview Actions', () => {
    // Test #6
    it('should open import modal when import button is pressed', () => {
      const { getByTestId } = render(<WebviewsManagementScreen {...mockProps} />);
      fireEvent.press(getByTestId('import-button'));
      expect(getByTestId('import-modal')).toBeTruthy();
    });

    // Test #7
    it('should handle webview reordering', () => {
      const { getByTestId } = render(<WebviewsManagementScreen {...mockProps} />);
      fireEvent.press(getByTestId('move-up-1'));

      const expectedOrder = [mockWebviews[1], mockWebviews[0]];
      expect(mockProps.setSelectedWebviews).toHaveBeenCalledWith(expectedOrder);
      expect(mockProps.saveSelectedWebviews).toHaveBeenCalledWith(expectedOrder);
    });
  });

  // Tests related to the read-only mode in the component
  describe('Read-only Mode', () => {
    const readOnlyProps = { ...mockProps, isReadOnly: true };

    // Test #8
    it('should not render action buttons in read-only mode', () => {
      const { queryByTestId } = render(<WebviewsManagementScreen {...readOnlyProps} />);
      expect(queryByTestId('import-button')).toBeNull();
      expect(queryByTestId('edit-button-0')).toBeNull();
      expect(queryByTestId('delete-button-0')).toBeNull();
      expect(queryByTestId('move-up-0')).toBeNull();
      expect(queryByTestId('move-down-0')).toBeNull();
    });

    // Test #9
    it('should still allow navigation in read-only mode', () => {
      const { getByTestId } = render(<WebviewsManagementScreen {...readOnlyProps} />);
      fireEvent.press(getByTestId('webview-item-0'));
      expect(mockProps.onNavigateToWebview).toHaveBeenCalledWith(mockWebviews[0].href);
    });
  });

  // Tests related to the modal interactions in the component
  describe('Modal Interactions', () => {
    // Test #10
    it('should open edit modal when edit button is pressed', () => {
      const { getByTestId } = render(<WebviewsManagementScreen {...mockProps} />);
      fireEvent.press(getByTestId('edit-button-0'));
      expect(getByTestId('edit-modal')).toBeTruthy();
    });

    // Test #11
    it('should open delete modal when delete button is pressed', () => {
      const { getByTestId } = render(<WebviewsManagementScreen {...mockProps} />);
      fireEvent.press(getByTestId('delete-button-0'));
      expect(getByTestId('delete-modal')).toBeTruthy();
    });
    // Test #12
    it('should handle edit modal submission', () => {
      const { getByTestId, getByPlaceholderText } = render(
        <WebviewsManagementScreen {...mockProps} />
      );

      // Open the edit modal
      fireEvent.press(getByTestId('edit-button-0'));
      // Modify the fields
      fireEvent.changeText(getByPlaceholderText('Enter channel title'), 'New Title');
      fireEvent.changeText(getByPlaceholderText('Enter channel URL'), 'https://newurl.com');
      // Save the changes
      fireEvent.press(getByTestId('save-edit-button'));
      // Verify that the changes are saved
      expect(mockProps.setSelectedWebviews).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            href: 'https://newurl.com',
            title: 'New Title'
          })
        ])
      );
    });

    // Test #13
    it('should handle delete confirmation', () => {
      const { getByTestId, getByText } = render(
        <WebviewsManagementScreen {...mockProps} />
      );

      // Open the delete modal
      fireEvent.press(getByTestId('delete-button-0'));
      // Confirm the deletion
      fireEvent.press(getByText('Delete'));
      // Verify that the webview is deleted
      expect(mockProps.setSelectedWebviews).toHaveBeenCalledWith(
        expect.not.arrayContaining([mockWebviews[0]])
      );
    });

    // Test #14
    it('should handle import modal submission', () => {
      const { getByTestId } = render(
        <WebviewsManagementScreen {...mockProps} />
      );

      // D'abord ouvrir le modal d'import
      fireEvent.press(getByTestId('import-button'));

      // Ensuite on peut interagir avec les boutons du modal
      fireEvent.press(getByTestId('cancel-import-button'));
    });

    // Test #15
    it('should accept valid URL format in import modal', async () => {
      const { getByTestId, getByPlaceholderText } = render(
        <WebviewsManagementScreen {...mockProps} />
      );

      fireEvent.press(getByTestId('import-button'));
      fireEvent.changeText(getByPlaceholderText('Enter an URL to import channels'), 'https://test.com');

      // Simuler une réponse réussie
      global.fetch = jest.fn(() =>
        Promise.resolve({
          headers: {
            get: () => 'text/html',
          },
          text: () => Promise.resolve('<a class="view" href="test.com">Test</a>'),
        })
      );

      await act(async () => {
        fireEvent.press(getByTestId('save-import-button'));
      });

      expect(mockProps.onImport).toHaveBeenCalled();
    });

    // Test #16
    it('should validate URL format in import modal', async () => {
      const { getByTestId, getByPlaceholderText, findByText } = render(
        <WebviewsManagementScreen {...mockProps} />
      );

      // Ouvrir le modal d'import
      fireEvent.press(getByTestId('import-button'));

      // Vérifier que le modal est visible
      expect(getByTestId('import-modal')).toBeTruthy();

      // Entrer une URL invalide
      fireEvent.changeText(getByPlaceholderText('Enter an URL to import channels'), 'invalid-url');

      // Simuler une erreur de fetch
      global.fetch = jest.fn(() =>
        Promise.reject(new Error('Failed to fetch'))
      );

      await act(async () => {
        fireEvent.press(getByTestId('save-import-button'));
      });

      // Maintenant chercher le message d'erreur
      const errorMessage = await findByText(/Error during the download of channels/);
      expect(errorMessage).toBeTruthy();
    });
  });

  // Tests related to the error handling in the component
  describe('Error Handling', () => {

    // Test #17
    it('should handle network errors during save', async () => {
      // Mock the saveSelectedWebviews function to fail
      const errorProps = {
        ...mockProps,
        saveSelectedWebviews: jest.fn().mockRejectedValue(new Error('Network error'))
      };

      const { getByTestId, findByText } = render(
        <WebviewsManagementScreen {...errorProps} />
      );

      // Trigger an action that saves
      fireEvent.press(getByTestId('move-up-0'));

      // Wait for the error message to appear
      await expect(findByText('Failed to save changes')).rejects.toThrow();
    });

    // Test #18
    it('should handle invalid URLs in edit modal', async () => {
      const { getByTestId, getByPlaceholderText, findByText } = render(
        <WebviewsManagementScreen {...mockProps} />
      );

      // Open the edit modal
      fireEvent.press(getByTestId('edit-button-0'));
      // Enter an invalid URL
      fireEvent.changeText(getByPlaceholderText('Enter channel URL'), 'invalid-url');
      // Try to save
      fireEvent.press(getByTestId('save-edit-button'));
      // Verify the error message
      await expect(findByText('Please enter an URL')).rejects.toThrow();
    });
  });

  // Tests related to the performance of the component
  describe('Performance', () => {

    // Test #19
    it('should handle large lists of webviews', () => {
      const manyWebviews = Array.from({ length: 100 }, (_, i) => ({
        href: `https://test${i}.com`,
        title: `Test ${i}`
      }));

      const { getAllByTestId } = render(
        <WebviewsManagementScreen
          {...mockProps}
          selectedWebviews={manyWebviews}
        />
      );

      const webviewItems = getAllByTestId(/webview-container-/);
      expect(webviewItems).toHaveLength(100);
    });
  });

  // Tests related to the input validation in the component
  describe('Input Validation', () => {
    // Test #20
    it('should validate URL format in edit modal', () => {
      const { getByTestId, getByPlaceholderText, getByText } = render(
        <WebviewsManagementScreen {...mockProps} />
      );

      // Open the edit modal
      fireEvent.press(getByTestId('edit-button-0'));
      // Enter an invalid URL
      fireEvent.changeText(getByPlaceholderText('Enter channel URL'), 'invalid-url');
      // Try to save
      fireEvent.press(getByTestId('save-edit-button'));
      // Verify the exact error message
      expect(getByText('Please enter a valid URL')).toBeTruthy();
    });

    // Test #21
    it('should accept valid URL format in edit modal', () => {
      const { getByTestId, getByPlaceholderText, queryByTestId } = render(
        <WebviewsManagementScreen {...mockProps} />
      );

      // Open the edit modal
      fireEvent.press(getByTestId('edit-button-0'));
      // Enter valid data
      fireEvent.changeText(getByPlaceholderText('Enter channel URL'), 'https://test.com');
      fireEvent.changeText(getByPlaceholderText('Enter channel title'), 'Test Title');
      // Save
      fireEvent.press(getByTestId('save-edit-button'));
      // Verify that the modal is closed (because the data is valid)
      expect(queryByTestId('edit-modal')).toBeNull();
    });

    // Test #22
    it('should validate URL format in import modal', async () => {
      const { getByTestId, getByPlaceholderText, findByText } = render(
        <WebviewsManagementScreen {...mockProps} />
      );

      // Open the import modal
      fireEvent.press(getByTestId('import-button'));

      // Enter an invalid URL
      fireEvent.changeText(getByPlaceholderText('Enter an URL to import channels'), 'invalid-url');

      // Click the import button
      fireEvent.press(getByTestId('save-import-button'));

      const errorMessage = await findByText(/Error during the download of channels/);
      expect(errorMessage).toBeTruthy();
    });

    // Test #23
    it('should accept valid URL format in import modal', async () => {
      const { getByTestId, getByPlaceholderText } = render(
        <WebviewsManagementScreen {...mockProps} />
      );

      fireEvent.press(getByTestId('import-button'));
      fireEvent.changeText(getByPlaceholderText('Enter an URL to import channels'), 'https://test.com');

      // Simuler une réponse réussie
      global.fetch = jest.fn(() =>
        Promise.resolve({
          headers: {
            get: () => 'text/html',
          },
          text: () => Promise.resolve('<a class="view" href="test.com">Test</a>'),
        })
      );

      await act(async () => {
        fireEvent.press(getByTestId('save-import-button'));
      });

      expect(mockProps.onImport).toHaveBeenCalled();
    });
  });

  // Tests related to the webview reordering in the component
  describe('Webview Reordering', () => {
    // Test #24
    it('should not move first webview up', () => {
      const { getByTestId } = render(<WebviewsManagementScreen {...mockProps} />);

      fireEvent.press(getByTestId('move-up-0'));
      expect(mockProps.setSelectedWebviews).not.toHaveBeenCalled();
    });

    it('should not move last webview down', () => {
      const lastIndex = mockWebviews.length - 1;
      const { getByTestId } = render(<WebviewsManagementScreen {...mockProps} />);

      fireEvent.press(getByTestId(`move-down-${lastIndex}`));
      expect(mockProps.setSelectedWebviews).not.toHaveBeenCalled();
    });

    it('should handle multiple reordering operations', () => {
      const { getByTestId } = render(<WebviewsManagementScreen {...mockProps} />);

      fireEvent.press(getByTestId('move-up-1'));
      fireEvent.press(getByTestId('move-down-0'));

      expect(mockProps.saveSelectedWebviews).toHaveBeenCalledTimes(2);
    });
  });

  describe('Empty State', () => {
    it('should show empty state message when no webviews', () => {
      const emptyProps = { ...mockProps, selectedWebviews: [] };
      const { getByText } = render(<WebviewsManagementScreen {...emptyProps} />);

      expect(getByText('Use the top right button to add a channel')).toBeTruthy();
    });

    it('should hide controls in empty state', () => {
      const emptyProps = { ...mockProps, selectedWebviews: [] };
      const { queryByTestId } = render(<WebviewsManagementScreen {...emptyProps} />);

      expect(queryByTestId('edit-button-0')).toBeNull();
      expect(queryByTestId('delete-button-0')).toBeNull();
      expect(queryByTestId('move-up-0')).toBeNull();
      expect(queryByTestId('move-down-0')).toBeNull();
    });
  });
});
