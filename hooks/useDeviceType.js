import { useWindowDimensions, PixelRatio } from 'react-native';

/**
 * Custom hook to determine the device type and orientation
 * @returns {Object} - An object containing the device type and orientation
 */
export const useDeviceType = () => {
  const { width, height } = useWindowDimensions();
  const pixelDensity = PixelRatio.get();

  // Calculate the dimensions in inches
  const widthInches = width / (PixelRatio.get() * 160);
  const heightInches = height / (PixelRatio.get() * 160);
  const diagonalInches = Math.sqrt(Math.pow(widthInches, 2) + Math.pow(heightInches, 2));

  /**
   * @description Check if the device is a low resolution tablet
   */
  const isLowResTablet = (() => {
    const minWidth = 550;
    const minHeight = 700;

    const result = (
      Math.min(width, height) >= minWidth &&
      Math.max(width, height) >= minHeight &&
      pixelDensity > 1.5
    );

    return result;
  })();

  /**
   * @description Check if the device is a tablet
   */
  const isTablet = (() => {
    const minimumTabletDiagonal = 6.0;
    const aspectRatio = Math.max(width, height) / Math.min(width, height);

    const result = (
      isLowResTablet ||
      (diagonalInches >= minimumTabletDiagonal &&
      aspectRatio <= 2.0 &&
      Math.min(width, height) >= 500)
    );

    return result;
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