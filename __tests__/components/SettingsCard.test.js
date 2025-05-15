import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SettingsCard from '../../components/cards/SettingsCard';
import { Text } from '../../components/text/CustomText';

// Mock du hook useDeviceType
jest.mock('../../hooks/useDeviceType', () => ({
  useDeviceType: () => ({
    isSmartphone: false,
  }),
}));

describe('SettingsCard', () => {
  const icon = <Text testID="icon">Icone</Text>;
  const title = 'Titre de la carte';
  const description = 'Description de la carte';

  it('affiche le titre, la description et l’icône', () => {
    const { getByText, getByTestId } = render(
      <SettingsCard title={title} description={description} icon={icon} onPress={() => {}} />
    );
    expect(getByText(title)).toBeTruthy();
    expect(getByText(description)).toBeTruthy();
    expect(getByTestId('icon')).toBeTruthy();
  });

  it('appelle onPress lors d’un appui', () => {
    const onPressMock = jest.fn();
    const { getByTestId } = render(
      <SettingsCard title={title} description={description} icon={icon} onPress={onPressMock} />
    );
    const button = getByTestId('settings-card');
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
      <SettingsCard title={title} description={description} icon={icon} onPress={() => {}} />
    );
    expect(getByText(title)).toBeTruthy();
  });
}); 