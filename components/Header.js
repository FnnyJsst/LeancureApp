import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Separator from './Separator';
import { Ionicons, Entypo } from '@expo/vector-icons';
import { useDeviceType } from '../hooks/useDeviceType';
import { SIZES, COLORS } from '../constants/style';

export default function Header({ title, onBackPress, onDialogPress, showIcons }) {
  const { isTablet, isSmartphonePortrait, isSmartphone } = useDeviceType();

  return (
    <View>
      <View style={styles.headerContainer}>
        {/* Left section - Back button */}
        <View style={styles.section}>
          <TouchableOpacity onPress={onBackPress}>
            <Ionicons 
              name="arrow-back" 
              size={isTablet ? 30 : 20} 
              style={styles.leftArrowIcon} 
            />
          </TouchableOpacity>
        </View>

        {/* Middle section - Title */}
        <View style={styles.titleSection}>
          <Text style={[
            styles.headerText, 
            isSmartphone && styles.headerTextSmartphone,
          ]}>
            {title}
          </Text>
        </View>

        {/* Right section - Add button or empty space */}
        <View style={styles.section}>
          {showIcons ? (
            <TouchableOpacity onPress={onDialogPress}>
              <Entypo 
                name="add-to-list" 
                size={isTablet ? 30 : 20} 
                style={styles.icon} 
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
      <Separator width='150%' />
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    width: '100%',
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
  },
  section: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleSection: {
    flex: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: SIZES.fonts.xLarge,
    color: COLORS.lightGray,
  },
  headerTextSmartphone: {
    fontSize: SIZES.fonts.large,
  },
  leftArrowIcon: {
    color: COLORS.lightGray,
  },
  icon: {
    color: COLORS.lightGray,
  },
});
