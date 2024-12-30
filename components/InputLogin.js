import { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SIZES } from '../constants/style';
import { Ionicons, FontAwesome, MaterialIcons, Feather } from '@expo/vector-icons';
import { useDeviceType } from '../hooks/useDeviceType';

export default function InputLogin({ 
    placeholder, 
    value, 
    onChangeText, 
    secureTextEntry,
    iconName,
    iconLibrary = 'Ionicons' 
}) {
    const { isSmartphone } = useDeviceType();
    const [showPassword, setShowPassword] = useState(false);

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
                style={[
                    styles.input,
                    isSmartphone ? styles.inputSmartphone : styles.inputTablet
                ]} 
                placeholder={placeholder} 
                value={value} 
                onChangeText={onChangeText} 
                secureTextEntry={secureTextEntry && !showPassword} 
                placeholderTextColor={COLORS.gray}
            />
            {secureTextEntry && (
                <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                >
                <Ionicons 
                    name={showPassword ? "eye-outline" : "eye-off-outline"} 
                    size={20} 
                    color={COLORS.gray} 
                />
            </TouchableOpacity>
            )}
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
    eyeIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        color: 'white',
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    inputSmartphone: {
        fontSize: SIZES.fonts.textSmartphone,
    },
    inputTablet: {
        fontSize: SIZES.fonts.textTablet,
    }
});