import { View, Text, StyleSheet, PixelRatio } from "react-native";
import { useDeviceType } from "../../hooks/useDeviceType";
import { SIZES, COLORS } from '../../constants/style'
export default function TitleSettings({ title }) {

  // Device type variables
  const { isSmartphone } = useDeviceType();
  
  return (
    <View style={[
      styles.titleContainer,
      isSmartphone && styles.titleContainerSmartphone
    ]}>
      <Text style={[
        styles.text,
        isSmartphone && styles.textSmartphone
      ]}>
        {title}
      </Text>
    </View>
  );
}


const styles = StyleSheet.create({
  //Container styles
  titleContainer: {
    paddingLeft: 25,
    marginTop: 25,
    marginBottom: 10,
  },
  titleContainerSmartphone: {
    paddingLeft: 10,
  },

  //Text styles
  text: {
    fontSize: SIZES.fonts.titleTablet,
    color: "white",
    fontWeight: SIZES.fontWeight.medium,
  },
  textSmartphone: {
    fontSize: SIZES.fonts.titleSmartphone,
    marginLeft: 20,
  }
});