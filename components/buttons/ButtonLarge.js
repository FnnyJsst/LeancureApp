import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../../constants/style';
import { useDeviceType } from '../../hooks/useDeviceType';

export default function ButtonLarge({ title, onPress, width }) {

    const { isSmartphonePortrait, isSmartphoneLandscape } = useDeviceType();

    return (
        <TouchableOpacity 
            style={[styles.button, isSmartphonePortrait && styles.buttonSmartphonePortrait, isSmartphoneLandscape && styles.buttonSmartphoneLandscape, { width: width }]}
            onPress={onPress}
        >
            <Text style={styles.buttonText}>{title}</Text>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    button: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.orange,
        borderRadius: SIZES.borderRadius.medium,
        paddingVertical: 15,
        paddingHorizontal: 10,
        marginVertical: 10,
    },
    buttonText: {
        color: 'white',
        fontSize: SIZES.fonts.subtitleSmartphone,
        fontWeight: SIZES.fontWeight.bold,
    }
});
