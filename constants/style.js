/**
 * @constant SIZES
 * @description A constant that contains the sizes of the app
 */
export const SIZES = {
  fonts: {
    smallTextSmartphone: 12,
    smallTextTablet: 17,
    textSmartphone: 14,
    textTablet: 20,
    biggerTextSmartphone: 16,
    biggerTextTablet: 18,
    sideBarTextSmartphone: 17,
    inputTitleSmartphone: 16,
    inputTitleTablet: 20,
    subtitleSmartphone: 18,
    subtitleTablet: 22,
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
    xLarge: 16,
    xxLarge: 20,
  },
};

export const COLORS = {
  // Brand color
  orange: '#FF6600',

  // Color of the login forms and modals
  charcoal: '#271E1E',
  
  // Dark grays (from darkest to lightest)
  gray950: '#111111',
  gray900: '#1a1a1a',      
  gray850: '#1e1e1e',      
  gray800: '#232424',      
  gray750: '#27272a',      
  gray700: '#282828',      
  gray650: '#313135',      
  
  // Medium grays
  gray600: '#646262',      
  
  // Light grays
  gray300: '#b2b2b2',      
  
  // Base colors
  white: '#ffffff',       
  overlay: 'rgba(0,0,0,0.8)',
  overlayLight: 'rgba(0, 0, 0, 0.1)',

  // Border colors
  borderColor: '#403430',
  
  red: '#e74242',
  
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
    backgroundColor: COLORS.gray850,
    borderRadius: SIZES.borderRadius.xxLarge,
    borderWidth: 1,
    borderColor: '#403430',
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 15,
    marginTop: 10,
  },
};

