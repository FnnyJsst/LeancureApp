import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ParameterButton from '../../components/buttons/ParameterButton';
import { COLORS } from '../../constants/style';

// Mock du hook useDeviceType
jest.mock('../../hooks/useDeviceType', () => ({
  useDeviceType: () => ({
    isSmartphone: false,
  }),
}));

jest.mock('@expo/vector-icons/Ionicons', () => {
  return ({ color, ...props }) => {
    return <div data-testid={props.testID} data-color={color} />;
  };
});

describe('ParameterButton', () => {
  it('renders correctly', () => {
    const { getByTestId } = render(<ParameterButton onPress={() => {}} testID="parameter-button" />);
    const button = getByTestId('parameter-button');
    expect(button).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPressMock = jest.fn();
    const { getByTestId } = render(<ParameterButton onPress={onPressMock} testID="parameter-button" />);
    const button = getByTestId('parameter-button');
    fireEvent.press(button);
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });
}); 