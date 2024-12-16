import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, Entypo } from '@expo/vector-icons';
import { useDeviceType } from '../hooks/useDeviceType';
import { SIZES, COLORS } from '../assets/styles/constants';

export default function Header({ title, onBackPress, onDialogPress, showIcons }) {
  const { isTablet, isSmartphonePortrait, isSmartphone } = useDeviceType();

  return (
    <View style={[
      styles.headerContainer, 
      isSmartphone && styles.headerContainerSmartphone
    ]}>
      <TouchableOpacity onPress={onBackPress} style={styles.iconBack}>
        <Ionicons 
          name="arrow-back" 
          size={isTablet ? 30 : 20} 
          style={styles.leftArrowIcon} 
        />
      </TouchableOpacity>
      <Text style={[
        styles.headerText, 
        isSmartphone && styles.headerTextSmartphone,
      ]}>
        {title}
      </Text>
      {showIcons && (
        <View style={[
          styles.iconContainer,
          isSmartphonePortrait && styles.iconContainerSmartphonePortrait
        ]}>
          <TouchableOpacity onPress={onDialogPress}>
            <Entypo 
              name="add-to-list" 
              size={isTablet ? 30 : 20} 
              style={styles.icon} 
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  //Container styles
  headerContainer: {
    width: '100%',
    height: 70,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.headerGray,
    borderRadius: SIZES.borderRadius.large,
  },
  headerContainerSmartphone: {
    height: 50,
  },

  //Text styles
  headerText: {
    fontSize: SIZES.fonts.xLarge,
    marginLeft: 15,
    color: COLORS.lightGray,
    flex: 1.5,
  },
  headerTextSmartphone: {
    fontSize: SIZES.fonts.large,
  },

  //Icon styles
  leftArrowIcon: {
    marginLeft: 10,
    color: COLORS.lightGray,
  },
  iconBack: {
    width: 70,
  },
  iconContainer: {
    flexDirection: 'row',
    marginRight: 25,
  },
  iconContainerSmartphonePortrait: {
    marginRight: 10,
  },
  icon: {
    fontWeight: SIZES.fontWeight.bold,
    color: COLORS.lightGray,
  },
});
