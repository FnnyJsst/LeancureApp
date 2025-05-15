import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Header from '../../components/Header';
import { COLORS } from '../../constants/style';

// Mock des composants d'icônes
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  Entypo: 'Entypo',
}));

// Mock du hook useDeviceType
jest.mock('../../hooks/useDeviceType', () => ({
  useDeviceType: () => ({
    isSmartphone: false,
  }),
}));

describe('Header Component', () => {
  it('renders correctly with title', () => {
    const { getByText } = render(<Header title="Test Header" />);
    const header = getByText('Test Header');
    expect(header).toBeTruthy();
  });

  it('renders with back button and handles press', () => {
    const onBackPressMock = jest.fn();
    const { getByTestId } = render(
      <Header 
        title="Test Header" 
        showBackButton={true}
        onBackPress={onBackPressMock}
      />
    );
    
    const backButton = getByTestId('back-button');
    fireEvent.press(backButton);
    expect(onBackPressMock).toHaveBeenCalledTimes(1);
  });

  it('renders with menu icon and handles press', () => {
    const toggleMenuMock = jest.fn();
    const { getByTestId } = render(
      <Header 
        title="Test Header" 
        showMenuIcon={true}
        toggleMenu={toggleMenuMock}
      />
    );
    
    const menuButton = getByTestId('menu-button');
    fireEvent.press(menuButton);
    expect(toggleMenuMock).toHaveBeenCalledTimes(1);
  });

  it('renders with right icon and handles press', () => {
    const onRightIconPressMock = jest.fn();
    const { getByTestId } = render(
      <Header 
        title="Test Header" 
        rightIcon="plus"
        onRightIconPress={onRightIconPressMock}
      />
    );
    
    const rightIconButton = getByTestId('right-icon-button');
    fireEvent.press(rightIconButton);
    expect(onRightIconPressMock).toHaveBeenCalledTimes(1);
  });

  it('renders in transparent mode', () => {
    const { getByTestId } = render(
      <Header 
        title="Test Header" 
        transparent={true}
      />
    );
    
    const headerContainer = getByTestId('header-container');
    expect(headerContainer.props.style).toContainEqual({ backgroundColor: 'transparent' });
  });

  it('renders without border when not in chat section', () => {
    const { getByTestId } = render(
      <Header 
        title="Test Header" 
        currentSection="settings"
      />
    );
    
    const headerContainer = getByTestId('header-container');
    expect(headerContainer.props.style).toContainEqual({ borderBottomWidth: 0 });
  });

  it('renders without icons when showIcons is false', () => {
    const { queryByTestId } = render(
      <Header 
        title="Test Header" 
        showIcons={false}
        rightIcon="plus"
      />
    );
    
    const rightIconButton = queryByTestId('right-icon-button');
    expect(rightIconButton).toBeNull();
  });
}); 