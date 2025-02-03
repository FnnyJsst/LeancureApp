import { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SIZES } from '../../constants/style';
import { Ionicons, FontAwesome, MaterialIcons, Feather } from '@expo/vector-icons';
import { useDeviceType } from '../../hooks/useDeviceType';

/**
 * @component InputLogin
 * @description A component that renders an input for the login screen
 * 
 * @param {Object} props - The properties of the component
 * @param {string} props.placeholder - The placeholder of the input
 * @param {string} props.value - The value of the input
 * @param {Function} props.onChangeText - The function to call when the input changes
 * @param {boolean} props.secureTextEntry - Whether the input is secure
 * @param {string} props.iconName - The name of the icon to display in the input
 * @param {string} props.iconLibrary - The library to use for the icon
 * 
 * @example
 * <InputLogin placeholder="Placeholder" value="Value" onChangeText={() => console.log('Input changed')} secureTextEntry={true} iconName="iconName" iconLibrary="Ionicons" />
 */
export default function InputLogin({ 
    placeholder, 
    value, 
    onChangeText, 
    secureTextEntry,
    iconName,
    iconLibrary = 'Ionicons' 
}) {

    // Get device type
    const { isSmartphone } = useDeviceType();

    // State management
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    /**
     * @function renderIcon
     * @description A function to render the icon
     * @returns {React.ReactNode} The icon
     */
    const renderIcon = () => {
        const iconProps = {
            name: iconName,
            size: 20,
            color: isFocused ? COLORS.orange : COLORS.gray600,
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
        <View style={[
            styles.inputContainer,
            isFocused && styles.inputContainerFocused
        ]}>
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
                placeholderTextColor={"#808080"}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
            />
            {secureTextEntry && (
                <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                >
                    <Ionicons 
                        name={showPassword ? "eye-outline" : "eye-off-outline"} 
                        size={20} 
                        color={COLORS.gray600} 
                    />
                </TouchableOpacity>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    inputContainer: {
        width: '95%',
        backgroundColor: "#111111",
        borderRadius: SIZES.borderRadius.medium,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
        transition: 'all 0.3s ease',
    },
    inputContainerFocused: {
        borderColor: COLORS.orange + '50', 
        shadowColor: COLORS.orange,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        elevation: 1,
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
        color: COLORS.white,
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