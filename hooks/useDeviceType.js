import { useWindowDimensions, PixelRatio, Platform } from 'react-native';

/**
 * Custom hook to determine the device type and orientation
 * @returns {Object} - An object containing the device type and orientation
 *
 * @example
 * const { isTablet, isSmartphone, isLandscape, isSmartphoneLandscape, isSmartphonePortrait } = useDeviceType();
 */
export const useDeviceType = () => {
  const { width, height } = useWindowDimensions();
  const pixelDensity = PixelRatio.get();

  // Calcul plus précis de la taille réelle en pouces
  const widthInches = width / (PixelRatio.get() * 160);
  const heightInches = height / (PixelRatio.get() * 160);
  const diagonalInches = Math.sqrt(Math.pow(widthInches, 2) + Math.pow(heightInches, 2));

  // Détection plus robuste des tablettes
  const isTablet = (() => {
    // Critères multiples pour la détection
    const minimumTabletDiagonal = 6.5; // 6.5 pouces minimum pour une tablette
    const aspectRatio = Math.max(width, height) / Math.min(width, height);

    // Ajout d'une condition spéciale pour les tablettes basse résolution
    const isLowResTablet = width >= 600 && height >= 800 && pixelDensity < 2;

    return (
      // Condition originale
      (diagonalInches >= minimumTabletDiagonal &&
      aspectRatio <= 1.6 &&
      Math.min(width, height) >= 400) ||
      // OU condition pour tablettes basse résolution
      isLowResTablet
    );
  })();

  const isSmartphone = !isTablet;
  const isPortrait = height > width;
  const isLandscape = width > height;

  // Dimensions utiles pour le style
  const screenInfo = {
    width,
    height,
    pixelDensity,
    diagonalInches,
    aspectRatio: width / height,
  };

  // Derived device types
  const isSmartphonePortrait = isSmartphone && isPortrait;
  const isTabletPortrait = isTablet && isPortrait;
  const isSmartphoneLandscape = isSmartphone && isLandscape;
  const isTabletLandscape = isTablet && isLandscape;

  const deviceSize = {
    isSmallTablet: isTablet && diagonalInches < 8,
    isMediumTablet: isTablet && diagonalInches >= 8 && diagonalInches < 10,
    isLargeTablet: isTablet && diagonalInches >= 10,
  };

  return {
    // Base properties
    isTablet,
    isSmartphone,
    isPortrait,
    isLandscape,
    screenInfo,

    // Derived properties
    isSmartphonePortrait,
    isTabletPortrait,
    isSmartphoneLandscape,
    isTabletLandscape,

    // Device size properties
    deviceSize,
  };
};
