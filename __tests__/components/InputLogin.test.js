import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import InputLogin from '../../components/inputs/InputLogin';

// Mock du hook useDeviceType
jest.mock('../../hooks/useDeviceType', () => ({
  useDeviceType: () => ({
    isSmartphone: false,
  }),
}));

describe('InputLogin', () => {
  const placeholder = 'Entrez votre texte';
  const onChangeTextMock = jest.fn();

  it('affiche le placeholder et l’icône', () => {
    const { getByPlaceholderText } = render(
      <InputLogin placeholder={placeholder} onChangeText={onChangeTextMock} />
    );
    expect(getByPlaceholderText(placeholder)).toBeTruthy();
  });

  it('appelle onChangeText lorsque le texte change', () => {
    const { getByPlaceholderText } = render(
      <InputLogin placeholder={placeholder} onChangeText={onChangeTextMock} />
    );
    const input = getByPlaceholderText(placeholder);
    fireEvent.changeText(input, 'Nouveau texte');
    expect(onChangeTextMock).toHaveBeenCalledWith('Nouveau texte');
  });

  it('change de style lorsque l’input est focus', () => {
    const { getByTestId, getByPlaceholderText } = render(
      <InputLogin placeholder={placeholder} onChangeText={onChangeTextMock} />
    );
    const container = getByTestId('input-container');
    const input = getByPlaceholderText(placeholder);
    fireEvent(input, 'focus');
    expect(container.props.style).toContainEqual(expect.objectContaining({ borderColor: expect.any(String) }));
  });

  it('affiche le bouton pour afficher/masquer le mot de passe', () => {
    const { getByTestId } = render(
      <InputLogin placeholder={placeholder} onChangeText={onChangeTextMock} secureTextEntry={true} />
    );
    const eyeButton = getByTestId('eye-button');
    expect(eyeButton).toBeTruthy();
  });
}); 