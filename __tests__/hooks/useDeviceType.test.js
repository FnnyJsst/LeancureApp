import { renderHook } from '@testing-library/react-native';
import { useDeviceType } from '../../hooks/useDeviceType';
import { useWindowDimensions, PixelRatio } from 'react-native';

// Mock pour React Native hooks et fonctions
jest.mock('react-native', () => ({
  useWindowDimensions: jest.fn(),
  PixelRatio: {
    get: jest.fn()
  }
}));

describe('useDeviceType', () => {
  // Réinitialiser les mocks avant chaque test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('devrait détecter un smartphone en mode portrait', () => {
    // Configuration pour un smartphone en portrait
    useWindowDimensions.mockReturnValue({
      width: 375,
      height: 667
    });
    PixelRatio.get.mockReturnValue(2);

    const { result } = renderHook(() => useDeviceType());

    expect(result.current.isSmartphone).toBe(true);
    expect(result.current.isPortrait).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isLandscape).toBe(false);
    expect(result.current.isSmartphonePortrait).toBe(true);
    expect(result.current.isSmartphoneLandscape).toBe(false);
    expect(result.current.isTabletPortrait).toBe(false);
    expect(result.current.isTabletLandscape).toBe(false);
  });

  it('devrait détecter un smartphone en mode paysage', () => {
    // Configuration pour un smartphone en paysage
    useWindowDimensions.mockReturnValue({
      width: 667,
      height: 375
    });
    PixelRatio.get.mockReturnValue(2);

    const { result } = renderHook(() => useDeviceType());

    expect(result.current.isSmartphone).toBe(true);
    expect(result.current.isLandscape).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isPortrait).toBe(false);
    expect(result.current.isSmartphoneLandscape).toBe(true);
    expect(result.current.isSmartphonePortrait).toBe(false);
    expect(result.current.isTabletPortrait).toBe(false);
    expect(result.current.isTabletLandscape).toBe(false);
  });

  it('devrait détecter une tablette en mode portrait', () => {
    // Configuration pour une tablette en portrait
    useWindowDimensions.mockReturnValue({
      width: 768,
      height: 1024
    });
    PixelRatio.get.mockReturnValue(2);

    const { result } = renderHook(() => useDeviceType());

    expect(result.current.isTablet).toBe(true);
    expect(result.current.isPortrait).toBe(true);
    expect(result.current.isSmartphone).toBe(false);
    expect(result.current.isLandscape).toBe(false);
    expect(result.current.isTabletPortrait).toBe(true);
    expect(result.current.isTabletLandscape).toBe(false);
    expect(result.current.isSmartphonePortrait).toBe(false);
    expect(result.current.isSmartphoneLandscape).toBe(false);
  });

  it('devrait détecter une tablette en mode paysage', () => {
    // Configuration pour une tablette en paysage
    useWindowDimensions.mockReturnValue({
      width: 1024,
      height: 768
    });
    PixelRatio.get.mockReturnValue(2);

    const { result } = renderHook(() => useDeviceType());

    expect(result.current.isTablet).toBe(true);
    expect(result.current.isLandscape).toBe(true);
    expect(result.current.isSmartphone).toBe(false);
    expect(result.current.isPortrait).toBe(false);
    expect(result.current.isTabletLandscape).toBe(true);
    expect(result.current.isTabletPortrait).toBe(false);
    expect(result.current.isSmartphonePortrait).toBe(false);
    expect(result.current.isSmartphoneLandscape).toBe(false);
  });

  it('devrait détecter une tablette basse résolution', () => {
    // Configuration pour une tablette basse résolution
    useWindowDimensions.mockReturnValue({
      width: 600,
      height: 800
    });
    PixelRatio.get.mockReturnValue(1.8);

    const { result } = renderHook(() => useDeviceType());

    expect(result.current.isLowResTablet).toBe(true);
    expect(result.current.isTablet).toBe(true);
    expect(result.current.isPortrait).toBe(true);
    expect(result.current.isSmartphone).toBe(false);
  });

  it('devrait fournir toutes les propriétés attendues', () => {
    useWindowDimensions.mockReturnValue({
      width: 375,
      height: 667
    });
    PixelRatio.get.mockReturnValue(2);

    const { result } = renderHook(() => useDeviceType());

    // Vérifier que toutes les propriétés existent
    expect(result.current).toHaveProperty('isTablet');
    expect(result.current).toHaveProperty('isSmartphone');
    expect(result.current).toHaveProperty('isPortrait');
    expect(result.current).toHaveProperty('isLandscape');
    expect(result.current).toHaveProperty('isLowResTablet');
    expect(result.current).toHaveProperty('isSmartphonePortrait');
    expect(result.current).toHaveProperty('isTabletPortrait');
    expect(result.current).toHaveProperty('isSmartphoneLandscape');
    expect(result.current).toHaveProperty('isTabletLandscape');

    // Vérifier les types
    Object.values(result.current).forEach(value => {
      expect(typeof value).toBe('boolean');
    });
  });
});