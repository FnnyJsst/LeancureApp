import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, TouchableOpacity, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import InputLogin from '../../../components/inputs/InputLogin';
import CheckBox from '../../../components/inputs/CheckBox';
import SimplifiedLogin from './SimplifiedLogin';
import { COLORS, SIZES } from '../../../constants/style';
import { useDeviceType } from '../../../hooks/useDeviceType';
import { SCREENS } from '../../../constants/screens';
import { loginApi, checkRefreshToken } from '../../../services/api/authApi';
import { cleanSecureStore } from '../../../utils/secureStore';
import { fetchUserChannels } from '../../../services/api/messageApi';
import ButtonWithSpinner from '../../../components/buttons/ButtonWithSpinner';
import GradientBackground from '../../../components/backgrounds/GradientBackground';
import { hashPassword } from '../../../utils/encryption';
import { Text } from '../../../components/text/CustomText';
import { useTranslation } from 'react-i18next';
import { handleError, ErrorType } from '../../../utils/errorHandling';
import * as Notifications from 'expo-notifications';
import { ENV } from '../../../config/env';
import { synchronizeTokenWithAPI } from '../../../services/notification/notificationService';
import CustomAlert from '../../../components/modals/webviews/CustomAlert';

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

    /**
     * @function handleLoginError
     * @description Handle login-related errors
     */
    const handleLoginError = (error, source) => {
        return handleError(error, source, {
            type: ErrorType.AUTH,
            showAlert: true,
            setAlertMessage: (message) => {
                setAlertMessage(message);
                setShowAlert(true);
            }
        });
    };

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
     * @function handleLogin
     * @description Handle the login process
     */
    const handleLogin = useCallback(async () => {
        try {
            setIsLoading(true);

            try {
                await SecureStore.deleteItemAsync('userCredentials');
            } catch (error) {
                if (error.message && (
                    error.message.includes('decrypt') ||
                    error.message.includes('decipher') ||
                    error.message.includes('decryption')
                )) {
                    await cleanSecureStore();
                } else {
                    handleError(error, 'login.cleanCredentials', {
                        type: ErrorType.SYSTEM,
                        showAlert: true,
                        setAlertMessage: (message) => {
                            setAlertMessage(t('errors.errorCleaningSecureStore'));
                            setShowAlert(true);
                        }
                    });
                }
            }

            const validationError = validateInputs();
            if (validationError) {
                handleError(validationError, 'login.validation', {
                    type: ErrorType.VALIDATION,
                    // showAlert: true,
                    setAlertMessage: (message) => {
                        setAlertMessage(message);
                        setShowAlert(true);
                    }
                });
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

                handleError(errorMessage, 'login.attempt', {
                    type: ErrorType.AUTH,
                    showAlert: true,
                    setAlertMessage: (message) => {
                        setAlertMessage(message);
                        setShowAlert(true);
                    }
                });
                return;
            }

            // If the login is successful, we save the credentials
            if (loginResponse.success) {
                // Save the credentials with the tokens
                const credentials = {
                    contractNumber,
                    login,
                    password: hashPassword(password),
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
                                    handleError(new Error(t('errors.errorSynchronizingTokenWithAPI')), 'login.tokenSync', {
                                        type: ErrorType.SYSTEM,
                                        showAlert: false // On ne bloque pas la navigation même si la synchro échoue
                                    });
                                }
                            } catch (error) {
                                handleError(error, 'login.tokenGeneration', {
                                    type: ErrorType.SYSTEM,
                                    showAlert: false
                                });
                            }
                        }

                        onNavigate(SCREENS.CHAT);
                    } catch (error) {
                        handleError(error, 'login.notification', {
                            type: ErrorType.SYSTEM,
                            showAlert: true,
                            setAlertMessage: (message) => {
                                setAlertMessage(message);
                                setShowAlert(true);
                            }
                        });
                    }
                } else {
                    handleError(t('errors.errorLoadingChannels'), 'login.channels', {
                        type: ErrorType.SYSTEM,
                        showAlert: true,
                        setAlertMessage: (message) => {
                            setAlertMessage(message);
                            setShowAlert(true);
                        }
                    });
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
                        password: hashPassword(password),
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
                        handleError(t('errors.errorLoadingChannels'), 'login.channels', {
                            type: ErrorType.SYSTEM,
                            showAlert: true,
                            setAlertMessage: (message) => {
                                setAlertMessage(message);
                                setShowAlert(true);
                            }
                        });
                    }
                } else {
                    setAlertMessage(t('errors.invalidCredentials'));
                    setShowAlert(true);
                }
            }
        } catch (error) {
            handleError(t('errors.connectionError'), 'login.process', {
                type: ErrorType.AUTH,
                showAlert: true,
                setAlertMessage: (message) => {
                    setAlertMessage(message);
                    setShowAlert(true);
                }
            });
        } finally {
            setIsLoading(false);
        }
    }, [contractNumber, login, password, isChecked, onNavigate, t]);


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
                        password: hashPassword(password),
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

                            // Synchronize the token
                            await synchronizeTokenWithAPI(tokenData.data);
                        }

                        onNavigate(SCREENS.CHAT);
                    } else {
                        handleError(t('errors.errorLoadingChannels'), 'login.channels', {
                            type: ErrorType.SYSTEM,
                            showAlert: true,
                            setAlertMessage: (message) => {
                                setAlertMessage(message);
                                setShowAlert(true);
                            }
                        });
                        setIsSimplifiedLogin(false);
                    }
                } catch (error) {
                    handleLoginError(error, 'login.saveCredentials');
                    setIsSimplifiedLogin(false);
                }
            } else {
                handleError(t('errors.invalidCredentials'), {
                    type: ErrorType.SYSTEM,
                    showAlert: true,
                    setAlertMessage: (message) => {
                        setAlertMessage(message);
                        setShowAlert(true);
                    }
                });
                setIsSimplifiedLogin(false);
            }
        } catch (error) {
            handleLoginError(error, 'login.simplified');
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
            handleError(error, 'login.saveInfo', {
                type: ErrorType.SYSTEM,
                showAlert: true,
                setAlertMessage: (message) => {
                    setAlertMessage(message);
                    setShowAlert(true);
                }
            });
        }
    }, [isChecked, contractNumber, login, password]);

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
                handleError(error, 'login.checkSavedLogin', {
                    type: ErrorType.SYSTEM,
                    showAlert: true,
                    setAlertMessage: (message) => {
                        setAlertMessage(message);
                        setShowAlert(true);
                    }
                });
            } finally {
                setIsInitialLoading(false);
            }
        };

        checkSavedLogin();
    }, []);

    if (isInitialLoading) {
        return null; // Ne rien afficher pendant le chargement initial
    }

    if (isSimplifiedLogin) {
        return (
            <SimplifiedLogin
                contractNumber={contractNumber}
                onSwitchAccount={() => {
                    setIsSimplifiedLogin(false);
                    setSavedLoginInfo(null);
                }}
                handleLogin={handleSimplifiedLogin}
                isLoading={isLoading}
            />
        );
    }

    return (
        <>
            <GradientBackground>
                <ScrollView>
                    <View style={styles.container} testID="login-screen">
                        <View style={[isSmartphone && styles.formContainerSmartphone]}>
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
                                                    onChangeText={setContractNumber}
                                                    iconName="document-text-outline"
                                                    iconLibrary="Ionicons"
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
                                                    onChangeText={setLogin}
                                                    iconName="person-outline"
                                                    testID="login-input"
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
                                                    onChangeText={setPassword}
                                                    secureTextEntry
                                                    iconName="lock-closed-outline"
                                                    testID="password-input"
                                                />
                                            </View>
                                        </View>

                                        <View style={styles.checkboxContainer}>
                                            <CheckBox
                                                checked={isChecked}
                                                onPress={() => setIsChecked(!isChecked)}
                                                label={t('auth.rememberMe')}
                                            />
                                        </View>

                                        <View style={styles.buttonContainer}>
                                            <ButtonWithSpinner
                                                variant="large"
                                                title={t('buttons.login')}
                                                isLoading={isLoading}
                                                onPress={handleLogin}
                                                width="100%"
                                                testID="login-button"
                                            />
                                        </View>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    style={styles.backLink}
                                    onPress={() => onNavigate(SCREENS.APP_MENU)}
                                >
                                    <Text
                                        style={[styles.backLinkText, isSmartphone && styles.backLinkTextSmartphone]}
                                        testID="login-back">
                                        {t('buttons.returnToTitle')}
                                    </Text>
                                </TouchableOpacity>
                            </>
                        </View>
                    </View>
                </ScrollView>
            </GradientBackground>
            <CustomAlert
                visible={showAlert}
                message={alertMessage}
                onClose={() => setShowAlert(false)}
                onConfirm={() => setShowAlert(false)}
                type="error"
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
        fontWeight: SIZES.fontWeight.semibold,
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
        fontWeight: SIZES.fontWeight.regular,
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
        color: COLORS.gray300,
        fontSize: SIZES.fonts.subtitleTablet,
        fontWeight: SIZES.fontWeight.regular,
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
