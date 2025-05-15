import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AppMenuCard from '../../components/cards/AppMenuCard';
import { Text } from '../../components/text/CustomText';

// Mock du hook useDeviceType
jest.mock('../../hooks/useDeviceType', () => ({
  useDeviceType: () => ({
    isSmartphone: false,
  }),
}));

describe('AppMenuCard', () => {
  const icon = <Text testID="icon">Icone</Text>;
  const title = 'Titre de la carte';

  it('affiche le titre et l’icône', () => {
    const { getByText, getByTestId } = render(
      <AppMenuCard title={title} icon={icon} onPress={() => {}} />
    );
    expect(getByText(title)).toBeTruthy();
    expect(getByTestId('icon')).toBeTruthy();
  });

  it('appelle onPress lors d’un appui', () => {
    const onPressMock = jest.fn();
    const { getByTestId } = render(
      <AppMenuCard title={title} icon={icon} onPress={onPressMock} />
    );
    const button = getByTestId('app-menu-card');
    fireEvent.press(button);
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('applique les styles smartphone', () => {
    jest.mock('../../hooks/useDeviceType', () => ({
      useDeviceType: () => ({
        isSmartphone: true,
      }),
    }));
    const { getByText } = render(
      <AppMenuCard title={title} icon={icon} onPress={() => {}} />
    );
    expect(getByText(title)).toBeTruthy();
  });
}); 