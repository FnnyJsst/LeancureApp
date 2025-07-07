import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
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
    const [iconColor, setIconColor] = useState(COLORS.gray600); // État simple pour la couleur de l'icône

    // Utiliser des refs pour éviter les re-renders et cycle de focus
    const containerRef = useRef(null);
    const renderCountRef = useRef(0);
    const lastDeviceTypeRef = useRef(isSmartphone);

    // Log seulement les changements significatifs, pas à chaque render
    useEffect(() => {
        renderCountRef.current += 1;
        // Log seulement les 3 premiers renders pour éviter le spam
        if (renderCountRef.current <= 3) {
            console.log(`[InputLogin-${testID}] Rendered (${renderCountRef.current})`);
        }
    });

    // Log seulement si le device type change vraiment
    useEffect(() => {
        if (lastDeviceTypeRef.current !== isSmartphone) {
            console.log(`[InputLogin-${testID}] Device type changed:`, { isSmartphone });
            lastDeviceTypeRef.current = isSmartphone;
        }
    }, [isSmartphone, testID]);

    // Callbacks qui modifient directement le style du container et l'état de l'icône
    const handleFocus = useCallback(() => {
        console.log(`[InputLogin-${testID}] Input focused - DIRECT STYLE`);

        // Modifier directement le style du container via ref
        if (containerRef.current) {
            containerRef.current.setNativeProps({
                style: [
                    styles.inputContainer,
                    isSmartphone && styles.inputContainerSmartphone,
                    styles.inputContainerFocused, // Ajouter le style focus
                ]
            });
        }

        // Changer la couleur de l'icône via état
        setIconColor(COLORS.orange);
    }, [testID, isSmartphone]);

    const handleBlur = useCallback(() => {
        console.log(`[InputLogin-${testID}] Input blurred - DIRECT STYLE`);

        // Remettre le style normal via ref
        if (containerRef.current) {
            containerRef.current.setNativeProps({
                style: [
                    styles.inputContainer,
                    isSmartphone && styles.inputContainerSmartphone,
                    // Ne pas ajouter le style focus
                ]
            });
        }

        // Remettre la couleur normale de l'icône via état
        setIconColor(COLORS.gray600);
    }, [testID, isSmartphone]);

    const handlePasswordToggle = useCallback(() => {
        console.log(`[InputLogin-${testID}] Password toggled:`, { showPassword: !showPassword });
        setShowPassword(!showPassword);
    }, [showPassword, testID]);

    /**
     * @function renderIcon
     * @description A function to render the icon - version stable avec état pour couleur
     */
    const renderIcon = useMemo(() => {
        const iconProps = {
            name: iconName,
            size: 20,
            color: iconColor,
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
    }, [iconName, iconLibrary, iconColor]);

    // Styles stables - sans état focus
    const containerStyle = useMemo(() => {
        return [
            styles.inputContainer,
            isSmartphone && styles.inputContainerSmartphone,
        ];
    }, [isSmartphone]);

    const inputStyle = useMemo(() => {
        return [
            styles.input,
            isSmartphone && styles.inputSmartphone,
        ];
    }, [isSmartphone]);

    // Props stables pour TextInput
    const textInputProps = useMemo(() => ({
        style: inputStyle,
        placeholder,
        value,
        onChangeText,
        secureTextEntry: secureTextEntry && !showPassword,
        placeholderTextColor: COLORS.gray600,
        onFocus: handleFocus,
        onBlur: handleBlur,
        testID,
        // Props pour stabiliser le comportement
        autoCorrect: false,
        autoCapitalize: 'none',
        editable: true,
        selectTextOnFocus: false,
        autoFocus: false,
    }), [inputStyle, placeholder, value, onChangeText, secureTextEntry, showPassword, handleFocus, handleBlur, testID]);

    return (
        <View
            ref={containerRef}
            style={containerStyle}
            testID="input-container"
        >
            {renderIcon}
            <TextInput {...textInputProps} />
            {secureTextEntry && (
                <TouchableOpacity
                    onPress={handlePasswordToggle}
                    style={styles.eyeIcon}
                    testID="eye-button"
                    activeOpacity={0.7}
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
