import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Button from '../../components/buttons/Button';
import { COLORS } from '../../constants/style';

jest.mock('../../hooks/useDeviceType', () => ({
  useDeviceType: () => ({
    isSmartphone: false,
    isSmartphoneLandscape: false,
  }),
}));

describe('Button Component', () => {
  it('renders correctly with default props', () => {
    const { getByText } = render(<Button title="Test Button" onPress={() => {}} />);
    const button = getByText('Test Button');
    expect(button).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<Button title="Test Button" onPress={onPressMock} />);
    
    fireEvent.press(getByText('Test Button'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('renders with custom colors', () => {
    const { getByText } = render(
      <Button 
        title="Custom Button" 
        onPress={() => {}}
        backgroundColor={COLORS.blue}
        textColor={COLORS.white}
      />
    );
    const button = getByText('Custom Button');
    expect(button).toBeTruthy();
  });

  it('renders with large variant', () => {
    const { getByText } = render(
      <Button 
        title="Large Button" 
        onPress={() => {}}
        variant="large"
      />
    );
    const button = getByText('Large Button');
    expect(button).toBeTruthy();
  });

  it('renders with custom width', () => {
    const { getByTestId } = render(
      <Button 
        title="Width Button" 
        onPress={() => {}}
        width={200}
        testID="custom-width-button"
      />
    );
    const button = getByTestId('custom-width-button');
    expect(button).toBeTruthy();
  });
}); 