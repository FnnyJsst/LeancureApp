import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, TouchableOpacity, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import InputLogin from '../../../components/inputs/InputLogin';
import CheckBox from '../../../components/inputs/CheckBox';
import SimplifiedLogin from './SimplifiedLogin';
import { COLORS, SIZES, FONTS } from '../../../constants/style';
import { useDeviceType } from '../../../hooks/useDeviceType';
import { SCREENS } from '../../../constants/screens';
import { loginApi, checkRefreshToken } from '../../../services/api/authApi';
import { cleanSecureStore } from '../../../utils/secureStore';
import { fetchUserChannels } from '../../../services/api/messageApi';
import ButtonWithSpinner from '../../../components/buttons/ButtonWithSpinner';
import GradientBackground from '../../../components/backgrounds/GradientBackground';
import { Text } from '../../../components/text/CustomText';
import { useTranslation } from 'react-i18next';
import * as Notifications from 'expo-notifications';
import { ENV } from '../../../config/env';
import { synchronizeTokenWithAPI } from '../../../services/notification/notificationService';
import CustomAlert from '../../../components/modals/webviews/CustomAlert';
import * as Crypto from 'expo-crypto';

/**
 * @component Login
 * @description Component to handle the login process and the persistence of the login data
 * @param {Function} props.onNavigate - Function to navigate between screens
 */
export default function Login({ onNavigate }) {

    // We get the translations and the device type
    const { t } = useTranslation();
    const { isSmartphone, isSmartphoneLandscape, isLandscape, isLowResTabletPortrait, isLowResTabletLandscape, isLowResTablet } = useDeviceType();

    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [contractNumber, setContractNumber] = useState('');
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [isChecked, setIsChecked] = useState(false);
    const [isSimplifiedLogin, setIsSimplifiedLogin] = useState(false);
    const [savedLoginInfo, setSavedLoginInfo] = useState(null);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    const handleContractNumberChange = useCallback((text) => {
        setContractNumber(text);
    }, []);

    const handleLoginChange = useCallback((text) => {
        setLogin(text);
    }, []);

    const handlePasswordChange = useCallback((text) => {
        setPassword(text);
    }, []);

    const handleCheckboxChange = useCallback(() => {
        setIsChecked(!isChecked);
    }, [isChecked]);

    /**
     * @function validateInputs
     * @description Validate the inputs of the login form
     * @returns {string} The error message if the inputs are not valid, otherwise null
     */
    const validateInputs = useCallback(() => {

        if (!contractNumber || !login || !password) {
            return t('errors.fieldsRequired');
        }

        return null;
    }, [contractNumber, login, password, t]);

    /**
     * @function hashPassword
     * @description Hash a password using SHA-256
     * @param {string} password - The password to hash
     * @returns {Promise<string>} - The SHA-256 hash of the password
     */
    const hashPassword = async (password) => {
        try {
            // Create the SHA-256 hash
            const hashedPassword = await Crypto.digestStringAsync(
                Crypto.CryptoDigestAlgorithm.SHA256,
                password,
                { encoding: Crypto.CryptoEncoding.HEX }
            );
            return hashedPassword;
        } catch (error) {
            console.error('[Encryption] Error while hashing the password:', error);
        }
    };


    /**
     * @function handleLogin
     * @description Handle the login process
     */
    const handleLogin = useCallback(async () => {
        try {
            setIsLoading(true);

            try {
                await SecureStore.deleteItemAsync('userCredentials');
            } catch (error) {
                console.error('[Login] Error while cleaning the credentials:', error);
                if (error.message && (
                    error.message.includes('decrypt') ||
                    error.message.includes('decipher') ||
                    error.message.includes('decryption')
                )) {
                    await cleanSecureStore();
                } else {
                    setAlertMessage(t('errors.errorCleaningSecureStore'));
                    setShowAlert(true);
                    return;
                }
            }

            const validationError = validateInputs();
            if (validationError) {
                setAlertMessage(validationError);
                setShowAlert(true);
                return;
            }

            // First login attempt
            const loginResponse = await loginApi(contractNumber, login, password, '');

            if (!loginResponse.success) {
                let errorMessage;
                switch (loginResponse.error) {
                    case 'LOGIN_FAILED':
                        errorMessage = t('errors.invalidCredentials');
                        break;
                    default:
                        errorMessage = t('errors.connectionError');
                }
                setAlertMessage(errorMessage);
                setShowAlert(true);
                return;
            }

            // If the login is successful, we save the credentials
            if (loginResponse.success) {
                // Save the credentials with the tokens
                const credentials = {
                    contractNumber,
                    login,
                    password: await hashPassword(password),
                    accountApiKey: loginResponse.accountApiKey,
                    refreshToken: loginResponse.refreshToken,
                    accessToken: loginResponse.accessToken
                };

                await SecureStore.setItemAsync('userCredentials', JSON.stringify(credentials));

                // If the user has checked the "Remember me" checkbox, we save the login info
                if (isChecked) {
                    await saveLoginInfo();
                }

                // We fetch the user channels
                const channelsResponse = await fetchUserChannels(
                    contractNumber,
                    login,
                    password,
                    loginResponse.accessToken,
                    loginResponse.accountApiKey
                );

                // If the channels are loaded, we get the notification token
                if (channelsResponse.status === 'ok') {
                    try {
                        const { status: existingStatus } = await Notifications.getPermissionsAsync();
                        let finalStatus = existingStatus;

                        if (existingStatus !== 'granted') {
                            const { status } = await Notifications.requestPermissionsAsync();
                            finalStatus = status;
                        }

                        if (finalStatus === 'granted') {
                            try {
                                const tokenData = await Notifications.getExpoPushTokenAsync({
                                    projectId: ENV.EXPO_PROJECT_ID,
                                });

                                // Synchroniser le token avec l'API
                                const syncResult = await synchronizeTokenWithAPI(tokenData.data);
                                if (!syncResult) {
                                    console.error('[Login] Failed to synchronize the notification token');
                                }
                            } catch (error) {
                                console.error('[Login] Error generating notification token:', error);
                            }
                        } else {
                            console.log('[Login] Notification permissions not granted:', finalStatus);
                        }

                        onNavigate(SCREENS.CHAT);
                    } catch (error) {
                        console.error('[Login] Error in notification handling:', error);
                        setAlertMessage(t('errors.technicalError'));
                        setShowAlert(true);
                    }
                } else {
                    console.error('[Login] Error loading channels:', channelsResponse);
                    setAlertMessage(t('errors.errorLoadingChannels'));
                    setShowAlert(true);
                }
            } else {
                // We get the old credentials for the refresh token
                const oldCredentials = await SecureStore.getItemAsync('userCredentials');
                if (!oldCredentials) {
                    setAlertMessage(t('errors.invalidCredentials'));
                    setShowAlert(true);
                    return;
                }

                const { refreshToken, accountApiKey } = JSON.parse(oldCredentials);

                // Tentative de refresh du token
                const refreshTokenResponse = await checkRefreshToken(
                    contractNumber,
                    accountApiKey,
                    refreshToken
                );

                // If the refresh token is not successful, we set the error
                if (!refreshTokenResponse.success) {
                    setAlertMessage(t('errors.sessionExpired'));
                    setShowAlert(true);
                    return;
                }

                // New login attempt with the new refresh token
                const retryLoginResponse = await loginApi(
                    contractNumber,
                    login,
                    password,
                    refreshTokenResponse.data.refresh_token
                );

                // If the login is successful, we save the credentials
                if (retryLoginResponse.success) {
                    const credentials = {
                        contractNumber,
                        login,
                        password: await hashPassword(password),
                        accountApiKey: retryLoginResponse.accountApiKey,
                        refreshToken: refreshTokenResponse.data.refresh_token,
                        accessToken: retryLoginResponse.accessToken
                    };

                    await SecureStore.setItemAsync('userCredentials', JSON.stringify(credentials));

                    const channelsResponse = await fetchUserChannels(
                        contractNumber,
                        login,
                        password,
                        retryLoginResponse.accessToken,
                        retryLoginResponse.accountApiKey
                    );

                    // If the channels are loaded, we navigate to the chat screen
                    if (channelsResponse.status === 'ok') {
                        onNavigate(SCREENS.CHAT);
                    } else {
                        setAlertMessage(t('errors.errorLoadingChannels'));
                        setShowAlert(true);
                    }
                } else {
                    setAlertMessage(t('errors.invalidCredentials'));
                    setShowAlert(true);
                }
            }
        } catch (error) {
            setAlertMessage(t('errors.loginFailed'));
            setShowAlert(true);
        } finally {
            setIsLoading(false);
        }
    }, [contractNumber, login, password, isChecked, onNavigate, t]);

    // Helper function to handle notifications
    const handleNotifications = async () => {
        try {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus === 'granted') {
                const tokenData = await Notifications.getExpoPushTokenAsync({
                    projectId: ENV.EXPO_PROJECT_ID,
                });

                const syncResult = await synchronizeTokenWithAPI(tokenData.data);
                if (!syncResult) {
                    console.error('[Login] Failed to synchronize the token with the API');
                }
            }
        } catch (error) {
            console.error('[Login] Error handling notifications:', error);
        }
    };

    /**
     * @function handleSimplifiedLogin
     * @description Handle the simplified login process when the user has saved login info
     */
    const handleSimplifiedLogin = useCallback(async () => {
        // If there is no saved login info, we return nothing
        if (!savedLoginInfo) {
            return;
        }

        setIsLoading(true);
        try {
            // We get the saved login info
            const { contractNumber, login, password } = savedLoginInfo;
            // We clean the SecureStore first
            try {
                await SecureStore.deleteItemAsync('userCredentials');
            } catch (error) {
                throw error;
            }

            // We login with the saved credentials
            const loginResponse = await loginApi(contractNumber, login, password, '');
            // If the login is successful, we save the credentials and navigate to the chat screen
            if (loginResponse && loginResponse.success) {
                try {
                    const credentials = {
                        contractNumber,
                        login,
                        password: await hashPassword(password),
                        accountApiKey: loginResponse.accountApiKey,
                        refreshToken: loginResponse.refreshToken,
                        accessToken: loginResponse.accessToken
                    };

                    await SecureStore.setItemAsync('userCredentials', JSON.stringify(credentials));
                    // We fetch the user channels
                    const channelsResponse = await fetchUserChannels(
                        contractNumber,
                        login,
                        password,
                        loginResponse.accessToken,
                        loginResponse.accountApiKey
                    );

                    // If the channels are loaded, we navigate to the chat screen
                    if (channelsResponse.status === 'ok') {
                        // We get the notification token
                        const { status: existingStatus } = await Notifications.getPermissionsAsync();
                        let finalStatus = existingStatus;

                        if (existingStatus !== 'granted') {
                            const { status } = await Notifications.requestPermissionsAsync();
                            finalStatus = status;
                        }

                        if (finalStatus === 'granted') {
                            const tokenData = await Notifications.getExpoPushTokenAsync({
                                projectId: ENV.EXPO_PROJECT_ID,
                            });

                            // Synchroniser le token
                            const syncResult = await synchronizeTokenWithAPI(tokenData.data);
                            if (!syncResult) {
                                console.error('[Login] Failed to synchronize the notification token');
                            }
                        }

                        onNavigate(SCREENS.CHAT);
                    } else {
                        setAlertMessage(t('errors.errorLoadingChannels'));
                        setShowAlert(true);
                        setIsSimplifiedLogin(false);
                    }
                } catch (error) {
                    setAlertMessage(t('errors.technicalError'));
                    setShowAlert(true);
                    setIsSimplifiedLogin(false);
                }
            } else {
                setAlertMessage(t('errors.invalidCredentials'));
                setShowAlert(true);
                setIsSimplifiedLogin(false);
            }
        } catch (error) {
            console.error('[Login] Error while handling the simplified login:', error);
        } finally {
            setIsLoading(false);
        }
    }, [savedLoginInfo, onNavigate, t]);

    /**
     * @function saveLoginInfo
     * @description Save the login info in the SecureStore
     */
    const saveLoginInfo = useCallback(async () => {
        try {
            if (isChecked) {
                await SecureStore.setItemAsync('savedLoginInfo', JSON.stringify({
                    contractNumber,
                    login,
                    password,
                    wasChecked: true,
                }));
            } else {
                await SecureStore.deleteItemAsync('savedLoginInfo');
                setIsSimplifiedLogin(false);
            }
        } catch (error) {
            setAlertMessage(t('errors.errorSavingLoginInfo'));
            setShowAlert(true);
        }
    }, [isChecked, contractNumber, login, password, t]);

    /**
     * @function checkSavedLogin
     * @description Check if the login info is saved in the SecureStore
     */
    useEffect(() => {
        const checkSavedLogin = async () => {
            try {
                const savedLoginInfo = await SecureStore.getItemAsync('savedLoginInfo');
                if (savedLoginInfo) {
                    const parsedInfo = JSON.parse(savedLoginInfo);
                    setContractNumber(parsedInfo.contractNumber);
                    setLogin(parsedInfo.login);
                    setSavedLoginInfo(parsedInfo);
                    setIsSimplifiedLogin(true);
                }
            } catch (error) {
                console.error('[Login] Error while checking saved login info:', error);
            } finally {
                setIsInitialLoading(false);
            }
        };

        checkSavedLogin();
    }, []);

    if (isInitialLoading) {
        return null;
    }

    return (
        <>
            <GradientBackground>
                <ScrollView>
                    <View style={styles.container} testID="login-screen">
                        <View style={[isSmartphone && styles.formContainerSmartphone]}>
                            {isSimplifiedLogin ? (
                                <SimplifiedLogin
                                    contractNumber={contractNumber}
                                    login={login}
                                    onSwitchAccount={() => setIsSimplifiedLogin(false)}
                                    handleLogin={handleSimplifiedLogin}
                                    isLoading={isLoading}
                                />
                            ) : (
                                <>
                                    <View style={[
                                        styles.loginContainer,
                                        isSmartphone && styles.loginContainerSmartphone,
                                        isLandscape && styles.loginContainerLandscape,
                                    ]}>
                                        <View style={styles.titleContainer}>
                                            <Text style={[
                                                styles.title,
                                                isSmartphone && styles.titleSmartphone,
                                                isLandscape && styles.titleLandscape,
                                                isLowResTablet && styles.titleLowResTablet,
                                            ]}>{t('titles.welcome')}</Text>
                                            <Text style={[styles.subtitle, isSmartphone && styles.subtitleSmartphone, isLandscape && styles.subtitleLandscape]}>{t('titles.signIn')}</Text>
                                        </View>

                                        <View style={styles.inputsContainer}>
                                            <View style={styles.inputGroup}>
                                                <Text style={[
                                                    styles.inputTitle,
                                                    isSmartphone && styles.inputTitleSmartphone,
                                                    isSmartphoneLandscape && styles.inputTitleSmartphoneLandscape,
                                                ]}>{t('titles.contractNumber')}</Text>
                                                <View style={styles.inputWrapper}>
                                                    <InputLogin
                                                        placeholder={t('auth.contractNumber')}
                                                        value={contractNumber}
                                                        onChangeText={handleContractNumberChange}
                                                        iconName="business-outline"
                                                        testID="contract-number-input"
                                                    />
                                                </View>
                                            </View>

                                            <View style={styles.inputGroup}>
                                                <Text style={[
                                                    styles.inputTitle,
                                                    isSmartphone && styles.inputTitleSmartphone,
                                                    isSmartphoneLandscape && styles.inputTitleSmartphoneLandscape,
                                                ]}>
                                                    {t('titles.login')}
                                                </Text>
                                                <View style={styles.inputWrapper}>
                                                    <InputLogin
                                                        placeholder={t('auth.login')}
                                                        value={login}
                                                        onChangeText={handleLoginChange}
                                                        iconName="person-outline"
                                                        testID="username-input"
                                                    />
                                                </View>
                                            </View>

                                            <View style={styles.inputGroup}>
                                                <Text style={[
                                                    styles.inputTitle,
                                                    isSmartphone && styles.inputTitleSmartphone,
                                                    isSmartphoneLandscape && styles.inputTitleSmartphoneLandscape]}>
                                                    {t('titles.password')}
                                                </Text>
                                                <View style={styles.inputWrapper}>
                                                    <InputLogin
                                                        placeholder={t('auth.password')}
                                                        value={password}
                                                        onChangeText={handlePasswordChange}
                                                        secureTextEntry
                                                        iconName="lock-closed-outline"
                                                        testID="password-input"
                                                    />
                                                </View>
                                            </View>

                                            <View style={styles.checkboxContainer}>
                                                <CheckBox
                                                    checked={isChecked}
                                                    onPress={handleCheckboxChange}
                                                    label={t('auth.rememberMe')}
                                                    testID="remember-me-checkbox"
                                                />
                                            </View>

                                            <View style={styles.buttonContainer}>
                                                <ButtonWithSpinner
                                                    variant="large"
                                                    title={t('buttons.login')}
                                                    isLoading={isLoading}
                                                    onPress={handleLogin}
                                                    width="100%"
                                                    testID="submit-button"
                                                />
                                            </View>
                                        </View>
                                    </View>
                                </>
                            )}
                        </View>
                        <TouchableOpacity
                            style={styles.backLink}
                            onPress={() => onNavigate(SCREENS.APP_MENU)}
                            testID="login-back-button"
                        >
                            <Text
                                style={[styles.backLinkText, isSmartphone && styles.backLinkTextSmartphone]}
                            >
                                {t('buttons.returnToTitle')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </GradientBackground>
            <CustomAlert
                visible={showAlert}
                message={alertMessage}
                onClose={() => setShowAlert(false)}
                onConfirm={() => setShowAlert(false)}
                type="error"
                testID="custom-alert"
            />
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingTop: 20,
    },
    titleContainer: {
        alignItems: 'center',
        width: '100%',
        paddingBottom: 30,
    },
    title: {
        color: COLORS.white,
        fontSize: SIZES.fonts.headerTablet,
        fontFamily: FONTS.medium,
        textAlign: 'center',
        marginBottom: 10,
    },
    titleLowResTablet: {
        fontSize: SIZES.fonts.headerSmartphone,
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
        fontFamily: FONTS.medium,
        textAlign: 'center',
        marginBottom: 20,
    },
    subtitleSmartphone: {
        fontSize: SIZES.fonts.subtitleSmartphone,
    },
    subtitleLandscape: {
        marginBottom: 0,
    },
    formContainerSmartphone: {
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
        borderColor: COLORS.borderColor,
        marginTop: 50,
    },
    loginContainerSmartphone: {
        width: '98%',
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
        color: COLORS.white,
        fontSize: SIZES.fonts.subtitleTablet,
        fontFamily: FONTS.regular,
        marginLeft: 10,
    },
    inputTitleSmartphone: {
        fontSize: SIZES.fonts.textSmartphone,
        fontWeight: SIZES.fontWeight.medium,
    },
    inputTitleSmartphoneLandscape: {
        marginLeft: 15,
    },
    inputWrapper: {
        width: '100%',
        alignItems: 'center',
    },
    checkboxContainer: {
        marginLeft: 15,
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
