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

  // Détection explicite des tablettes basse résolution d'abord
  const isLowResTablet = (() => {
    const minWidth = 550;  // Réduit de 600 à 550 pour les anciennes tablettes
    const minHeight = 700; // Réduit de 800 à 700 pour les anciennes tablettes
    const maxDensity = 2;  // Densité maximale pour les écrans basse résolution

    return (
      Math.min(width, height) >= minWidth &&
      Math.max(width, height) >= minHeight &&
      pixelDensity < maxDensity
    );
  })();

  // Détection plus robuste des tablettes
  const isTablet = (() => {
    const minimumTabletDiagonal = 6.5;
    const aspectRatio = Math.max(width, height) / Math.min(width, height);

    return (
      // Vérifier d'abord si c'est une tablette basse résolution
      isLowResTablet ||
      // Sinon utiliser les critères standards
      (diagonalInches >= minimumTabletDiagonal &&
       aspectRatio <= 1.6 &&
       Math.min(width, height) >= 400)
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
    isLowResTablet,
  };

  return {
    // Base properties
    isTablet,
    isSmartphone,
    isPortrait,
    isLandscape,
    screenInfo,
    isLowResTablet,

    // Derived properties
    isSmartphonePortrait,
    isTabletPortrait,
    isSmartphoneLandscape,
    isTabletLandscape,

    // Device size properties
    deviceSize,
  };
};
