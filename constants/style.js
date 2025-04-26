export const FONTS = {
  thin: 'Raleway-Thin',        // 100
  light: 'Raleway-Light',      // 300
  regular: 'Raleway-Regular',  // 400
  medium: 'Raleway-Medium',    // 500
  semiBold: 'Raleway-SemiBold',// 600
  bold: 'Raleway-Bold',        // 700
  extraBold: 'Raleway-ExtraBold',// 800
  black: 'Raleway-Black',       // 900
};

export const SIZES = {
  fonts: {
    smallTextSmartphone: 13,
    smallTextTablet: 17,
    textSmartphone: 15,
    textTablet: 18,
    biggerTextSmartphone: 16,
    biggerTextTablet: 18,
    sideBarTextSmartphone: 17,
    inputTitleSmartphone: 16,
    inputTitleTablet: 20,
    subtitleSmartphone: 18,
    subtitleTablet: 20,
    titleSmartphone: 20,
    titleTablet: 24,
    headerSmartphone: 24,
    headerTablet: 30,
  },
  fontWeight: {
    thin: '100',
    light: '300',
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
    extraBold: '800',
    black: '900',
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
  darkOrange: '#a32f05',

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
  gray600: '#707070',

  // Light grays
  gray300: '#b2b2b2',

  // Base colors
  white: '#ffffff',
  overlay: 'rgba(0,0,0,0.8)',
  overlayLight: 'rgba(0, 0, 0, 0.1)',

  // Border colors
  borderColor: '#403430',

  burgundy: '#502e2e',
  red: '#e74242',

  //success colors
  green: '#008000',

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
    borderColor: COLORS.borderColor,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 15,
    marginTop: 10,
  },
};

