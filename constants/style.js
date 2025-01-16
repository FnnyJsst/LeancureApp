/**
 * Constants for the font sizes, border radius, colors  and heights
 **/
export const SIZES = {
  fonts: {
    errorText: 12,
    textSmartphone: 14,
    messageTextSmartphone: 16,
    textTablet: 20,
    inputTitleSmartphone: 16,
    inputTitleTablet: 20,
    subtitleSmartphone: 18,
    subtitleTablet: 24,
    titleSmartphone: 20,
    titleTablet: 24,
    headerSmartphone: 24,
    headerTablet: 30,
  },
  fontWeight: {
    light: '300',
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
  },
  borderRadius: {
    small: 6,
    medium: 8,
    large: 10,
    xLarge: 12,
    xxLarge: 20,
  },
};

export const COLORS = {
  // Brand color
  orange: '#FF6600',
  
  // Dark grays (from darkest to lightest)
  gray900: '#1a1a1a',      // ancien darkGray - fond principal
  gray850: '#1e1e1e',      // ancien black
  gray800: '#232424',      // fond des cards/containers
  gray750: '#27272a',      // ancien buttonGray
  gray700: '#282828',      // ancien gray700
  gray650: '#313135',      // ancien gray650
  
  // Medium grays
  gray600: '#646262',      // ancien gray - texte peu contrasté
  
  // Light grays
  gray300: '#b2b2b2',      // ancien gray300 - texte secondaire
  
  // Base colors
  white: '#ffffff',       
  overlay: 'rgba(0,0,0,0.8)',
  overlayLight: 'rgba(0, 0, 0, 0.1)',
  
  // Status colors
  success: '#24c12f',
  error: '#ff4444',
  
  // Message colors
  messageOut: 'rgba(255, 128, 82, 0.3)',     
  
  // Background colors
  backgroundModal: 'rgba(0, 0, 0, 0.8)',
};

export const MODAL_STYLES = {
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingBottom: '20%',
  },
  content: {
    width: '40%',
    padding: 20,
    backgroundColor: COLORS.gray750,
    borderRadius: SIZES.borderRadius.large,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 15,
    marginTop: 10,
  },
};

