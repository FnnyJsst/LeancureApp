import { useState, useEffect } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import InputLogin from '../../../components/inputs/InputLogin';
import CheckBox from '../../../components/inputs/CheckBox';
import SimplifiedLogin from './SimplifiedLogin';
import { COLORS, SIZES } from '../../../constants/style';
import { useDeviceType } from '../../../hooks/useDeviceType';
import { SCREENS } from '../../../constants/screens';
import { loginApi, fetchUserChannels } from '../../../services/messageApi';
import ButtonWithSpinner from '../../../components/buttons/ButtonWithSpinner';
import GradientBackground from '../../../components/backgrounds/GradientBackground';
import { hashPassword } from '../../../utils/encryption';
import { secureStore } from '../../../utils/encryption';

/**
 * @component Login
 * @description Component to handle the login process and the persistence of the login data 
 * 
 * @param {Object} props - The properties of the component
 * @param {Function} props.onNavigate - Function to navigate between screens
 * 
 * @example
 * <Login onNavigate={(screen) => navigate(screen)} />
 */
    export default function Login({ onNavigate }) {

    // Customized hook to determine the device type and orientation
    const { isSmartphone, isSmartphoneLandscape, isLandscape } = useDeviceType();
    
    // States related to the login form
    const [contractNumber, setContractNumber] = useState('');
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isChecked, setIsChecked] = useState(false);
    const [isSimplifiedLogin, setIsSimplifiedLogin] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    /**
     * @function loadLoginInfo
     * @description Loads the login info from Secure store
     */
    const loadLoginInfo = async () => {
        try {
            const savedInfo = await SecureStore.getItemAsync('savedLoginInfo');
            if (savedInfo) {
                const { 
                    contractNumber: savedContract, 
                    login: savedLogin, 
                    password: savedPassword,
                    wasChecked
                } = JSON.parse(savedInfo);
                // If the "Stay connected" checkbox is checked, we load the login info from Secure store

                if (wasChecked === true) {
                    setContractNumber(savedContract);
                    setLogin(savedLogin);
                    setPassword(savedPassword);
                    setIsChecked(true);
                    setIsSimplifiedLogin(true);
                } else {
                    // If the "Stay connected" checkbox is not checked, we remove the login info from Secure store
                    setContractNumber('');
                    setLogin('');
                    setPassword('');
                    setIsChecked(false);
                    setIsSimplifiedLogin(false);
                    await SecureStore.deleteItemAsync('savedLoginInfo');
                }
            }
        } catch (error) {
            console.error('Error loading login info:', error);
        }
    };

    /**
     * @function loadLoginInfo
     * @description Loads the login info from Secure store when the component is mounted
     */
    useEffect(() => {
        const init = async () => {
            try {
                await loadLoginInfo();
            } catch (error) {
                console.error('Error during initialization:', error);
            } finally {
                setIsInitialLoading(false);
            }
        };
        init();
    }, []);

    // If on is in initial loading, we don't render anything
    if (isInitialLoading) {
        return null;
    }

    /**
     * @function handleLogin
     * @description Handles the login process 
     */
    const handleLogin = async () => {
        // We validate the inputs
        const validationError = validateInputs();
        if (validationError) {
            setError(validationError);
            return;
        }

        // We set the loading state to true
        setIsLoading(true);
        setError('');

        try {
            // console.log('🔄 Trying to login...');
            const loginResponse = await loginApi(contractNumber, login, password);

            if (loginResponse && loginResponse.status === 'ok') {
                // If the "Stay connected" checkbox is not checked, we remove the login info from Secure store
                if (!isChecked) {
                    await SecureStore.deleteItemAsync('savedLoginInfo');
                    setIsSimplifiedLogin(false);
                // If the "Stay connected" checkbox is checked, we save the login info in Secure store
                } else {
                    await saveLoginInfo();
                }

                // Save the credentials for the current session
                await secureStore.saveCredentials({
                    contractNumber,
                    login,
                    password: hashPassword(password)
                });

                // Load the channels immediately after login
                const channelsResponse = await fetchUserChannels(contractNumber, login, password);
                // console.log('📊 Loading channels...');

                if (channelsResponse.status === 'ok') {
                    onNavigate(SCREENS.CHAT);
                } else {
                    setError('Error loading channels');
                }
            } else {
                setError(loginResponse.error || 'Invalid credentials');
            }
        } catch (error) {
            // console.error('🔴 Connection error:', error);
            setError('Connection error to the server');
        } finally {
            setIsLoading(false);
        }
    };
    
    /**
     * @function saveLoginInfo
     * @description Saves the login info in Secure store
     */
    const saveLoginInfo = async () => {
        try {
            if (isChecked) {
                await SecureStore.setItemAsync('savedLoginInfo', JSON.stringify({
                    contractNumber,
                    login,
                    password,
                    wasChecked: true
                }));
            } else {
                await SecureStore.deleteItemAsync('savedLoginInfo');
                setIsSimplifiedLogin(false);
            }
        } catch (error) {
            console.error('Error saving login info:', error);
        }
    };

    /**
     * @function validateInputs
     * @description Validates the inputs
     * @returns {string | null} - The error message or null if the inputs are valid
     */
    const validateInputs = () => {
        //If the contract number is not filled, we return an error
        if (!contractNumber.trim()) return 'Contract number required';
        //If the login is not filled, we return an error
        if (!login.trim()) return 'Login required';
        //If the password is less than 8 characters, we return an error
        if (password.length < 8) return 'Password must be at least 8 characters';
        return null;
    };

    return (
        <>
            <StatusBar 
                backgroundColor="#121212"
                barStyle="light-content"
                translucent={true}
            />
            <GradientBackground>
                <ScrollView>
                    <View style={styles.contentContainer}>
                        <View style={styles.titleContainer}>
                            <Text style={[styles.title, isSmartphone && styles.titleSmartphone, isLandscape && styles.titleLandscape]}>Welcome</Text>
                            <Text style={[styles.subtitle, isSmartphone && styles.subtitleSmartphone, isLandscape && styles.subtitleLandscape]}>Sign in to your account</Text>
                        </View>
                        <View style={[styles.formContainerPortrait, isSmartphone && styles.formContainerSmartphonePortrait]}>
                            {/* If the user has checked the "Stay connected" checkbox, we show the simplified login screen */}
                            {isSimplifiedLogin ? (
                                <SimplifiedLogin 
                                    contractNumber={contractNumber}
                                    login={login}
                                    onSwitchAccount={() => setIsSimplifiedLogin(false)}
                                    handleLogin={handleLogin}
                                    isLoading={isLoading}
                                />
                            ) : (
                                <>
                                    {/* If the user has not checked the "Stay connected" checkbox, we show the login form */}
                                    <View style={[
                                        styles.loginContainer,
                                        isSmartphone && styles.loginContainerSmartphone,
                                        isLandscape && styles.loginContainerLandscape
                                    ]}>
                                        
                                        <View style={styles.inputsContainer}>
                                            <View style={styles.inputGroup}>
                                                <Text style={[
                                                    styles.inputTitle,
                                                    isSmartphone && styles.inputTitleSmartphone,
                                                    isSmartphoneLandscape && styles.inputTitleSmartphoneLandscape
                                                ]}>Contract number</Text>
                                                <View style={styles.inputWrapper}>
                                                    <InputLogin 
                                                        placeholder="Enter your contract number"
                                                        value={contractNumber}
                                                        onChangeText={setContractNumber}
                                                        iconName="document-text-outline"
                                                        iconLibrary="Ionicons"
                                                    />
                                                </View>
                                            </View>

                                            <View style={styles.inputGroup}>
                                                <Text style={[
                                                    styles.inputTitle,
                                                    isSmartphone && styles.inputTitleSmartphone,
                                                    isSmartphoneLandscape && styles.inputTitleSmartphoneLandscape
                                                ]}>
                                                    Login
                                                </Text>
                                                <View style={styles.inputWrapper}>
                                                    <InputLogin 
                                                        placeholder="Enter your login"
                                                        value={login}
                                                        onChangeText={setLogin}
                                                        iconName="person-outline"
                                                    />
                                                </View>
                                            </View>

                                            <View style={styles.inputGroup}>
                                                <Text style={[
                                                    styles.inputTitle, 
                                                    isSmartphone && styles.inputTitleSmartphone,
                                                    isSmartphoneLandscape && styles.inputTitleSmartphoneLandscape]}>
                                                    Password
                                                </Text>
                                                <View style={styles.inputWrapper}>
                                                    <InputLogin 
                                                        placeholder="Enter your password"
                                                        value={password}
                                                        onChangeText={setPassword}
                                                        secureTextEntry
                                                        iconName="lock-closed-outline"
                                                    />
                                                </View>
                                            </View>

                                            {error ? (
                                                <Text style={styles.errorText}>{error}</Text>
                                            ) : null}

                                            <View style={styles.checkboxContainer}>
                                                <CheckBox 
                                                    checked={isChecked}
                                                    onPress={() => setIsChecked(!isChecked)}
                                                    label="Stay connected"
                                                />
                                            </View>

                                            <View style={styles.buttonContainer}>
                                                <ButtonWithSpinner 
                                                    variant="large"
                                                    title="Login"
                                                    isLoading={isLoading}
                                                    onPress={handleLogin}
                                                    width="100%"
                                                />
                                            </View>
                                        </View>
                                    </View>
                                    <TouchableOpacity 
                                        style={styles.backLink}
                                        onPress={() => onNavigate(SCREENS.APP_MENU)}
                                    >
                                        <Text style={[styles.backLinkText, isSmartphone && styles.backLinkTextSmartphone]}>
                                            Return to title screen
                                        </Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </View>
                </ScrollView>
            </GradientBackground>
        </>
    );
}

const styles = StyleSheet.create({
    contentContainer: {
        flex: 1,
        paddingTop: 20,
    },
    titleContainer: {
        alignItems: 'center',
        width: '100%',
        paddingVertical: 40,
    },
    title: {
        color: COLORS.white,
        fontSize: SIZES.fonts.headerTablet,
        fontWeight: SIZES.fontWeight.bold,
        textAlign: 'center',
        marginBottom: 10,
        marginTop: 50
    },
    titleLandscape: {
        marginTop: 0,
    },
    titleSmartphone: {
        fontSize: SIZES.fonts.headerSmartphone,
    },
    subtitle: {
        color: COLORS.gray300,
        fontSize: SIZES.fonts.subtitleTablet,
        fontWeight: SIZES.fontWeight.regular,
        textAlign: 'center',
        marginBottom: 20
    },
    subtitleSmartphone: {
        fontSize: SIZES.fonts.subtitleSmartphone,  
    },
    subtitleLandscape: {
        marginBottom: 0,
    },
    formContainerSmartphonePortrait: {
        paddingHorizontal: '5%',
    },
    loginContainer: {
        flex: 1,
        backgroundColor: COLORS.charcoal,
        padding: 30,
        borderRadius: SIZES.borderRadius.xxLarge,
        alignSelf: 'center',
        width: '70%',
        borderWidth: 1,
        borderColor: '#403430',
    },
    loginContainerSmartphone: {
        width: '95%',
    },
    loginContainerLandscape: {
        width: '50%',
    },
    inputsContainer: {
        width: '100%',
        gap: 20,
    },
    inputGroup: {
        gap: 5,
    },
    inputTitle: {
        color: COLORS.gray300,
        fontSize: SIZES.fonts.subtitleTablet,
        fontWeight: SIZES.fontWeight.regular,
        marginLeft: 10,
    },
    inputTitleSmartphone: {
        fontSize: 14,
        fontWeight: SIZES.fontWeight.medium,
    },
    inputTitleSmartphoneLandscape: {
        marginLeft: 15,
    },
    inputWrapper: {
        width: '100%',
        alignItems: 'center',
    },
    errorText: {
        color: COLORS.error,
        fontSize: SIZES.fonts.errorText,
        textAlign: 'center',
        marginTop: 10,
    },
    checkboxContainer: {
        marginLeft: 15,
    },
    checkboxLabel: {
        fontSize: SIZES.fonts.subtitleTablet,
    },
    checkboxLabelSmartphone: {
        fontSize: SIZES.fonts.subtitleSmartphone,
    },
    buttonContainer: {
        alignSelf: 'center',
        width: '95%',
        marginBottom: 10,
    },
    backLink: {
        padding: 15,
        alignItems: 'center',
        marginTop: 10, 
    },
    backLinkText: {
        color: COLORS.orange,
        fontSize: SIZES.fonts.textTablet,
        fontWeight: SIZES.fontWeight.regular,
        textDecorationLine: 'underline',
    },
    backLinkTextSmartphone: {
        fontSize: SIZES.fonts.textSmartphone,
    },
});