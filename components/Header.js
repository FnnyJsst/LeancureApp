import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Separator from './Separator';
import { Ionicons, Entypo } from '@expo/vector-icons';
import { useDeviceType } from '../hooks/useDeviceType';
import { SIZES, COLORS } from '../constants/style';

export default function Header({ title, onBackPress, onDialogPress, showIcons }) {
  const { isTablet, isSmartphonePortrait, isSmartphone } = useDeviceType();

  return (
    <View>
      <View style={[
        styles.headerContainer, 
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
      <Separator width='150%' />
    </View>
  );
}

const styles = StyleSheet.create({
  //Container styles
  headerContainer: {
    width: '100%',
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  //Text styles
  headerText: {
    fontSize: SIZES.fonts.xLarge,
    color: COLORS.lightGray,
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
    // width: 40,
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
