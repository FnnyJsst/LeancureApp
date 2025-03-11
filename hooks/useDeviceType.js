import { useWindowDimensions, PixelRatio } from 'react-native';

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

  // We calculate the diagonal in inches to determine the device size
  const widthInches = width / (PixelRatio.get() * 160);
  const heightInches = height / (PixelRatio.get() * 160);
  const diagonalInches = Math.sqrt(Math.pow(widthInches, 2) + Math.pow(heightInches, 2));

  // Explicit detection of low resolution tablets first
  const isLowResTablet = (() => {
    const minWidth = 550;
    const minHeight = 700;
    const maxDensity = 2;

    return (
      Math.min(width, height) >= minWidth &&
      Math.max(width, height) >= minHeight &&
      pixelDensity < maxDensity
    );
  })();

  // Detection of
  const isTablet = (() => {
    const minimumTabletDiagonal = 6.5;
    const aspectRatio = Math.max(width, height) / Math.min(width, height);

    return (
      // We first check if it's a low resolution tablet
      isLowResTablet ||
      // Then we use the standard criteria
      (diagonalInches >= minimumTabletDiagonal &&
       aspectRatio <= 1.6 &&
       Math.min(width, height) >= 400)
    );
  })();

  // If a device is not a tablet, it's a smartphone
  const isSmartphone = !isTablet;

  // We determine the orientation of the device
  const isPortrait = height > width;
  const isLandscape = width > height;

  // Derived device types
  const isSmartphonePortrait = isSmartphone && isPortrait;
  const isTabletPortrait = isTablet && isPortrait;
  const isSmartphoneLandscape = isSmartphone && isLandscape;
  const isTabletLandscape = isTablet && isLandscape;

  return {
    // Base properties
    isTablet,
    isSmartphone,
    isPortrait,
    isLandscape,
    isLowResTablet,

    // Derived properties
    isSmartphonePortrait,
    isTabletPortrait,
    isSmartphoneLandscape,
    isTabletLandscape,
  };
};
