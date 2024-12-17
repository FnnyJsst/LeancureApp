/**
 * Constants for the font sizes, border radius, colors  and heights
 **/
export const SIZES = {
  fonts: {
    xSmall: 14,
    small: 15,
    medium: 18,
    large: 20,
    xLarge: 22,
    xXLarge: 28,
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
  },
};

export const COLORS = {
  orange: '#FF6600',
  darkGray: '#1a1a1a',
  gray: '#646262',
  sidebarGray: '#313135',
  lightGray: '#b2b2b2',
  buttonGray: '#27272a',
  headerGray: '#282828',
  backgroundModal: 'rgba(0,0,0,0.8)',
  error: '#ff4444',
  green: '#24c12f',
};

export const MODAL_STYLES = {
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundModal,
    paddingBottom: '20%',
  },
  content: {
    width: '40%',
    padding: 20,
    backgroundColor: COLORS.darkGray,
    borderRadius: SIZES.borderRadius.xLarge,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 15,
    marginTop: 10,
  },
};