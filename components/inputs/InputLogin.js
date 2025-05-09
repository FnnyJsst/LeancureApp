import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SIZES, FONTS } from '../../constants/style';
import { Ionicons, FontAwesome, MaterialIcons, Feather } from '@expo/vector-icons';
import { useDeviceType } from '../../hooks/useDeviceType';

/**
 * @component InputLogin
 * @description A component that renders an input for the login screen
 * @param {string} props.placeholder - The placeholder of the input
 * @param {string} props.value - The value of the input
 * @param {Function} props.onChangeText - The function to call when the input changes
 * @param {boolean} props.secureTextEntry - Whether the input is secure
 * @param {string} props.iconName - The name of the icon to display in the input
 * @param {string} props.iconLibrary - The library to use for the icon
 */
export default function InputLogin({
    placeholder,
    value,
    onChangeText,
    secureTextEntry,
    iconName,
    iconLibrary = 'Ionicons',
    testID,
}) {

    const { isSmartphone } = useDeviceType();
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
            style: styles.icon,
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
            isSmartphone && styles.inputContainerSmartphone,
            isFocused && styles.inputContainerFocused,
        ]}>
            {renderIcon()}
            <TextInput
                style={[
                    styles.input,
                    isSmartphone && styles.inputSmartphone,
                ]}
                placeholder={placeholder}
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry && !showPassword}
                placeholderTextColor={COLORS.gray600}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                testID={testID}
            />
            {secureTextEntry && (
                <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                >
                    <Ionicons
                        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color={COLORS.gray600}
                    />
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    inputContainer: {
        width: '95%',
        backgroundColor: COLORS.gray950,
        borderRadius: SIZES.borderRadius.large,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
        transition: 'all 0.3s ease',
    },
    inputContainerSmartphone: {
        width: '98%',
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
        fontFamily: FONTS.regular,
        paddingHorizontal: 10,
        paddingVertical: 10,
        fontSize: SIZES.fonts.textTablet,
    },
    inputSmartphone: {
        fontSize: SIZES.fonts.textSmartphone,
    },
});
