import { useWindowDimensions, PixelRatio } from 'react-native';

export const useDeviceType = () => {
  const { width, height } = useWindowDimensions();
  const pixelDensity = PixelRatio.get();
  const dpWidth = width / pixelDensity;
  
  // Base device types
  const isTablet = dpWidth >= 500;
  const isSmartphone = !isTablet;
  const isPortrait = height > width;
  const isLandscape = width > height;

  // Derived device types
  const isSmartphonePortrait = isSmartphone && isPortrait;
  const isTabletPortrait = isTablet && isPortrait;
  const isSmartphoneLandscape = isSmartphone && !isPortrait;
  const isTabletLandscape = isTablet && !isPortrait;
  
  return {
    // Base properties
    isTablet,
    isSmartphone,
    isPortrait,
    isLandscape,
    dpWidth,
    density: pixelDensity,
    
    // Derived properties
    isSmartphonePortrait,
    isTabletPortrait,
    isSmartphoneLandscape,
    isTabletLandscape
  };
};