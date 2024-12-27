import { View, TextInput, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../constants/style';
import { Ionicons, FontAwesome, MaterialIcons, Feather } from '@expo/vector-icons';

export default function InputLogin({ 
    placeholder, 
    value, 
    onChangeText, 
    secureTextEntry,
    iconName,
    iconLibrary = 'Ionicons' 
}) {
    const renderIcon = () => {
        const iconProps = {
            name: iconName,
            size: 20,
            color: COLORS.gray,
            style: styles.icon
        };

        switch (iconLibrary) {
            case 'Ionicons':
                return <Ionicons {...iconProps} />;
            case 'FontAwesome':
                return <FontAwesome {...iconProps} />;
            case 'MaterialIcons':
                return <MaterialIcons {...iconProps} />;
            case 'Feather':
                return <Feather {...iconProps} />;
            default:
                return <Ionicons {...iconProps} />;
        }
    };

    return (
        <View style={styles.inputContainer}>
            {renderIcon()}
            <TextInput 
                style={styles.input} 
                placeholder={placeholder} 
                value={value} 
                onChangeText={onChangeText} 
                secureTextEntry={secureTextEntry} 
                placeholderTextColor={COLORS.gray}
                fontSize={SIZES.fonts.textSmartphone} 
            />
        </View>
    )
}

const styles = StyleSheet.create({
    inputContainer: {
        width: '95%',
        backgroundColor: COLORS.darkGray,
        borderRadius: SIZES.borderRadius.small,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    icon: {
        marginLeft: 10,
        marginRight: 5,
    },
    input: {
        flex: 1,
        color: 'white',
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
})