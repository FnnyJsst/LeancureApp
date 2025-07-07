import { Dimensions, PixelRatio } from 'react-native';
import { useState, useEffect, useMemo } from 'react';

/**
 * Custom hook to determine the device type and orientation with complete stability
 * @returns {Object} - An object containing the device type and orientation
 * @example - const { isTablet, isSmartphone, isLandscape, isSmartphoneLandscape, isSmartphonePortrait } = useDeviceType();
 */
export const useDeviceType = () => {
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    console.log('[useDeviceType] Initial dimensions:', { width, height });
    return { width, height };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      const { width, height } = window;

      setDimensions(prevDimensions => {
        // Vérifier si c'est un vrai changement (rotation d'écran)
        const isRealChange =
          Math.abs(width - prevDimensions.width) > 50 ||
          Math.abs(height - prevDimensions.height) > 50;

        if (isRealChange) {
          console.log('[useDeviceType] Real orientation change detected:', {
            from: prevDimensions,
            to: { width, height }
          });
          return { width, height };
        } else {
          console.log('[useDeviceType] Ignored minor dimension change:', {
            from: prevDimensions,
            to: { width, height },
            diff: {
              width: Math.abs(width - prevDimensions.width),
              height: Math.abs(height - prevDimensions.height)
            }
          });
          return prevDimensions; // Garde les anciennes dimensions
        }
      });
    });

    return () => subscription?.remove();
  }, []);

  return useMemo(() => {
    const { width, height } = dimensions;

    console.log('[useDeviceType] Calculating device type with dimensions:', { width, height });

    const pixelDensity = PixelRatio.get();

    // Calcul des dimensions en pouces
    const widthInches = width / (PixelRatio.get() * 160);
    const heightInches = height / (PixelRatio.get() * 160);
    const diagonalInches = Math.sqrt(Math.pow(widthInches, 2) + Math.pow(heightInches, 2));

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

    const result = {
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

    console.log('[useDeviceType] Stable result:', result);

    return result;
  }, [dimensions.width, dimensions.height]);
};