import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../../constants/style';

export default function ButtonLarge({ title, onPress, width }) {

    return (
        <TouchableOpacity 
            style={[styles.button, { width: width }]}
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2, 
    },
    buttonText: {
        color: 'white',
        fontSize: SIZES.fonts.subtitleSmartphone,
        fontWeight: SIZES.fontWeight.bold,
    }
});
