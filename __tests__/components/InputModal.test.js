import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import InputModal from '../../components/inputs/InputModal';
import { COLORS } from '../../constants/style';

// Mock complet des modules
jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => 'Ionicons'
}));

jest.mock('expo-modules-core', () => ({
  NativeModulesProxy: {
    ExpoFont: {
      loadAsync: jest.fn(),
    },
  },
}));

jest.mock('../../hooks/useDeviceType', () => ({
  useDeviceType: () => ({
    isSmartphone: true,
    isLandscape: false,
    isSmartphonePortrait: true
  })
}));

describe('InputModal', () => {
  const mockProps = {
    placeholder: 'Enter password',
    value: '',
    onChangeText: jest.fn(),
    style: {},
    secureTextEntry: true,
    icon: <span>Icon</span>
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { getByPlaceholderText } = render(<InputModal {...mockProps} />);
    expect(getByPlaceholderText('Enter password')).toBeTruthy();
  });

  it('should handle text input changes', () => {
    const { getByPlaceholderText } = render(<InputModal {...mockProps} />);
    const input = getByPlaceholderText('Enter password');
    fireEvent.changeText(input, 'test123');
    expect(mockProps.onChangeText).toHaveBeenCalledWith('test123');
  });

  // it('should toggle password visibility', () => {
  //   const { getByPlaceholderText, getByRole } = render(<InputModal {...mockProps} />);
  //   const input = getByPlaceholderText('Enter password');
  //   const toggleButton = getByRole('button');

  //   // Par défaut, le mot de passe est caché
  //   expect(input.props.secureTextEntry).toBe(true);

  //   // Après le clic sur le bouton, le mot de passe devrait être visible
  //   fireEvent.press(toggleButton);
  //   expect(input.props.secureTextEntry).toBe(false);
  // });

  // it('should handle focus and blur states', () => {
  //   const { getByPlaceholderText } = render(<InputModal {...mockProps} />);
  //   const input = getByPlaceholderText('Enter password');

  //   // Test du focus
  //   fireEvent(input, 'focus');
  //   expect(input.parent.props.style).toContainEqual(
  //     expect.objectContaining({
  //       borderColor: COLORS.orange + '50'
  //     })
  //   );

  //   // Test du blur
  //   fireEvent(input, 'blur');
  //   expect(input.parent.props.style).toContainEqual(
  //     expect.objectContaining({
  //       borderColor: 'transparent'
  //     })
  //   );
  // });

  // it('should render icon with correct color based on focus state', () => {
  //   const { getByPlaceholderText, getByTestId } = render(<InputModal {...mockProps} />);
  //   const input = getByPlaceholderText('Enter password');
  //   const icon = getByTestId('input-icon');

  //   // Test de la couleur de l'icône au focus
  //   fireEvent(input, 'focus');
  //   expect(icon.props.color).toBe(COLORS.orange);

  //   // Test de la couleur de l'icône au blur
  //   fireEvent(input, 'blur');
  //   expect(icon.props.color).toBe(COLORS.gray300);
  // });

  // it('should apply smartphone styles when on smartphone', () => {
  //   const { getByPlaceholderText } = render(<InputModal {...mockProps} />);
  //   const input = getByPlaceholderText('Enter password');

  //   expect(input.props.style).toContainEqual(
  //     expect.objectContaining({
  //       fontSize: expect.any(Number)
  //     })
  //   );
  // });
});
