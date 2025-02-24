import { render, fireEvent } from '@testing-library/react-native';
import PasswordDefineModal from '../../../components/modals/webviews/PasswordDefineModal';

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


describe('PasswordDefineModal', () => {
  const mockProps = {
    visible: true,
    onClose: jest.fn(),
    onSubmitPassword: jest.fn(),
    onDisablePassword: jest.fn(),
    testID: 'password-define-modal'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly when visible', () => {
    const { getByTestId, getByText, getAllByTestId } = render(
      <PasswordDefineModal {...mockProps} />
    );

    expect(getByTestId('password-define-modal')).toBeTruthy();
    expect(getByText('Enter password')).toBeTruthy();
    expect(getByText('Do not use')).toBeTruthy();
    expect(getByText('Ok')).toBeTruthy();
    expect(getByText('Close')).toBeTruthy();
  });

  it('should handle password submission with valid passwords', () => {
    const { getByPlaceholderText, getByText } = render(
      <PasswordDefineModal {...mockProps} />
    );

    const password = 'password123';
    fireEvent.changeText(getByPlaceholderText('Enter a password (6+ chars)'), password);
    fireEvent.changeText(getByPlaceholderText('Re-enter password'), password);
    fireEvent.press(getByText('Ok'));

    // Vérifier que l'alerte de succès est affichée
    expect(getByText('Success')).toBeTruthy();
    expect(getByText('Password has been set successfully')).toBeTruthy();
  });

  it('should show error for password less than 6 characters', () => {
    const { getByPlaceholderText, getByText } = render(
      <PasswordDefineModal {...mockProps} />
    );

    fireEvent.changeText(getByPlaceholderText('Enter a password (6+ chars)'), '12345');
    fireEvent.press(getByText('Ok'));

    expect(getByText('Error')).toBeTruthy();
    expect(getByText('Password must contain at least 6 characters')).toBeTruthy();
  });

  it('should show error when passwords do not match', () => {
    const { getByPlaceholderText, getByText } = render(
      <PasswordDefineModal {...mockProps} />
    );

    fireEvent.changeText(getByPlaceholderText('Enter a password (6+ chars)'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Re-enter password'), 'password456');
    fireEvent.press(getByText('Ok'));

    expect(getByText('Error')).toBeTruthy();
    expect(getByText('Passwords do not match')).toBeTruthy();
  });

  it('should handle disable password button press', () => {
    const { getByTestId } = render(
      <PasswordDefineModal {...mockProps} />
    );

    fireEvent.press(getByTestId('disable-password-button'));

    expect(mockProps.onDisablePassword).toHaveBeenCalled();
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('should handle close button press', () => {
    const { getByTestId } = render(
      <PasswordDefineModal {...mockProps} />
    );

    fireEvent.press(getByTestId('close-password-button'));
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('should clear password fields when closing modal', () => {
    const { getByPlaceholderText, getByTestId } = render(
      <PasswordDefineModal {...mockProps} />
    );

    fireEvent.changeText(getByPlaceholderText('Enter a password (6+ chars)'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Re-enter password'), 'password123');
    fireEvent.press(getByTestId('close-password-button'));

    expect(getByPlaceholderText('Enter a password (6+ chars)')).toHaveProperty('props.value', '');
    expect(getByPlaceholderText('Re-enter password')).toHaveProperty('props.value', '');
  });

  describe('Alert handling', () => {
    it('should handle successful password submission through alert confirmation', () => {
      const { getByPlaceholderText, getByText, getByTestId } = render(
        <PasswordDefineModal {...mockProps} />
      );

      const password = 'password123';
      fireEvent.changeText(getByPlaceholderText('Enter a password (6+ chars)'), password);
      fireEvent.changeText(getByPlaceholderText('Re-enter password'), password);
      fireEvent.press(getByText('Ok'));

      // Vérifier que l'alerte de succès est affichée
      expect(getByText('Success')).toBeTruthy();
      expect(getByText('Password has been set successfully')).toBeTruthy();

      // Confirmer l'alerte
      fireEvent.press(getByTestId('alert-confirm-button'));

      // Vérifier que le mot de passe a été soumis et le modal fermé
      expect(mockProps.onSubmitPassword).toHaveBeenCalledWith(password);
      expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('should close alert without submitting on error alert confirmation', () => {
      const { getByPlaceholderText, getByText, getByTestId } = render(
        <PasswordDefineModal {...mockProps} />
      );

      // Déclencher une erreur avec des mots de passe différents
      fireEvent.changeText(getByPlaceholderText('Enter a password (6+ chars)'), 'password123');
      fireEvent.changeText(getByPlaceholderText('Re-enter password'), 'password456');
      fireEvent.press(getByText('Ok'));

      // Vérifier que l'alerte d'erreur est affichée
      expect(getByText('Error')).toBeTruthy();
      expect(getByText('Passwords do not match')).toBeTruthy();

      // Confirmer l'alerte
      fireEvent.press(getByTestId('alert-close-button'));

      // Vérifier que le mot de passe n'a pas été soumis
      expect(mockProps.onSubmitPassword).not.toHaveBeenCalled();
      expect(mockProps.onClose).not.toHaveBeenCalled();
    });

    it('should close alert when clicking close button', () => {
      const { getByPlaceholderText, getByText, getByTestId } = render(
        <PasswordDefineModal {...mockProps} />
      );

      // Déclencher une alerte
      fireEvent.changeText(getByPlaceholderText('Enter a password (6+ chars)'), 'pass');
      fireEvent.press(getByText('Ok'));

      // Vérifier que l'alerte est affichée
      expect(getByText('Error')).toBeTruthy();
      expect(getByText('Password must contain at least 6 characters')).toBeTruthy();

      // Fermer l'alerte
      fireEvent.press(getByTestId('alert-close-button'));

      // Vérifier que l'alerte n'est plus visible
      expect(() => getByText('Error')).toThrow();
    });

    it('should reset password fields after successful submission', () => {
      const { getByPlaceholderText, getByText, getByTestId } = render(
        <PasswordDefineModal {...mockProps} />
      );

      // Entrer et soumettre un mot de passe valide
      fireEvent.changeText(getByPlaceholderText('Enter a password (6+ chars)'), 'password123');
      fireEvent.changeText(getByPlaceholderText('Re-enter password'), 'password123');
      fireEvent.press(getByText('Ok'));

      // Confirmer l'alerte de succès
      fireEvent.press(getByTestId('alert-confirm-button'));

      // Vérifier que les champs sont réinitialisés
      expect(getByPlaceholderText('Enter a password (6+ chars)')).toHaveProperty('props.value', '');
      expect(getByPlaceholderText('Re-enter password')).toHaveProperty('props.value', '');
    });
  });
});