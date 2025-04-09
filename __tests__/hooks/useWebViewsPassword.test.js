import { renderHook, act } from '@testing-library/react-native';
import { useWebviewsPassword } from '../../hooks/useWebViewsPassword';

// Mocks simplifiés
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
  WHEN_UNLOCKED: 'whenUnlocked'
}));

// Mock pour Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn()
}));

// Mock pour i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => key
  })
}));

// Mock pour console
global.console = {
  ...console,
  error: jest.fn(),
  log: jest.fn()
};

describe('useWebviewsPassword', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('devrait initialiser avec les valeurs par défaut', () => {
    const { result } = renderHook(() => useWebviewsPassword(mockNavigate));

    expect(result.current.password).toBeNull();
    expect(result.current.isPasswordRequired).toBe(false);
    expect(result.current.isPasswordDefineModalVisible).toBe(false);
    expect(result.current.passwordCheckModalVisible).toBe(false);
  });

  it('devrait ouvrir et fermer le modal de définition du mot de passe', () => {
    const { result } = renderHook(() => useWebviewsPassword(mockNavigate));

    act(() => {
      result.current.openPasswordDefineModal();
    });

    expect(result.current.isPasswordDefineModalVisible).toBe(true);

    act(() => {
      result.current.closePasswordDefineModal();
    });

    expect(result.current.isPasswordDefineModalVisible).toBe(false);
  });
});