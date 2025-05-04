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
    const [error, setError] = useState('');
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
        console.log(`[Login] Erreur dans ${source}:`, error);
        const errorMessage = handleError(error, `login.${source}`, {
            type: ErrorType.AUTH,
            silent: false
        });
        setAlertMessage(errorMessage);
        setShowAlert(true);
        return errorMessage;
    };

    /**
     * @function validateInputs
     * @description Validate the inputs of the login form
     * @returns {string} The error message if the inputs are not valid, otherwise null
     */
    const validateInputs = useCallback(() => {
        console.log('🔍 [Login] Validation des inputs:', {
            contractNumber,
            login,
            password: password ? '***' : ''
        });
        if (!contractNumber || !login || !password) {
            console.log('❌ [Login] Champs requis manquants');
            return t('errors.fieldsRequired');
        }
        console.log('✅ [Login] Validation des inputs réussie');
        return null;
    }, [contractNumber, login, password, t]);


    /**
     * @function handleLogin
     * @description Handle the login process
     */
    const handleLogin = useCallback(async () => {
        try {
            console.log('🚀 [Login] Début du processus de connexion');
            setIsLoading(true);

            try {
                console.log('🧹 [Login] Nettoyage des anciens credentials');
                await SecureStore.deleteItemAsync('userCredentials');
            } catch (error) {
                console.error('⚠️ [Login] Erreur lors du nettoyage des credentials:', error);
                // If it's a decryption error, we clean the SecureStore
                if (error.message && (
                    error.message.includes('decrypt') ||
                    error.message.includes('decipher') ||
                    error.message.includes('decryption')
                )) {
                    console.log('🔐 [Login] Erreur de déchiffrement détectée, nettoyage du SecureStore');
                    await cleanSecureStore();
                    console.log('✅ [Login] SecureStore nettoyé avec succès');
                } else {
                    console.error('❌ [Login] Erreur non liée au déchiffrement:', error);
                    setAlertMessage(t('errors.errorCleaningSecureStore'));
                    setShowAlert(true);
                }
            }

            const validationError = validateInputs();
            if (validationError) {
                console.log('❌ [Login] Erreur de validation:', validationError);
                setAlertMessage(validationError);
                setShowAlert(true);
                return;
            }

            // Première tentative de login
            console.log('🔑 [Login] Tentative de login avec credentials...');
            const loginResponse = await loginApi(contractNumber, login, password, '');

            // If the login is successful, we save the credentials
            if (loginResponse.success) {
                console.log('✅ [Login] Login réussi, tokens reçus:', {
                    accessToken: loginResponse.accessToken?.substring(0, 10) + '...',
                    refreshToken: loginResponse.refreshToken?.substring(0, 10) + '...'
                });

                // Sauvegarde des credentials avec les tokens
                const credentials = {
                    contractNumber,
                    login,
                    password: hashPassword(password),
                    accountApiKey: loginResponse.accountApiKey,
                    refreshToken: loginResponse.refreshToken,
                    accessToken: loginResponse.accessToken
                };

                console.log('💾 [Login] Sauvegarde des credentials dans SecureStore');
                await SecureStore.setItemAsync('userCredentials', JSON.stringify(credentials));
                console.log('✅ [Login] Tokens sauvegardés avec succès');

                // If the user has checked the "Remember me" checkbox, we save the login info
                if (isChecked) {
                    console.log('💾 [Login] Sauvegarde des informations de connexion (Remember me)');
                    await saveLoginInfo();
                }

                // We fetch the user channels
                console.log('📡 [Login] Récupération des canaux utilisateur');
                const channelsResponse = await fetchUserChannels(
                    contractNumber,
                    login,
                    password,
                    loginResponse.accessToken,
                    loginResponse.accountApiKey
                );

                // If the channels are loaded, we get the notification token
                if (channelsResponse.status === 'ok') {
                    console.log('✅ [Login] Canaux récupérés avec succès');
                    const { status: existingStatus } = await Notifications.getPermissionsAsync();
                    let finalStatus = existingStatus;

                    console.log('🔔 [Login] Statut des permissions de notification:', existingStatus);

                    // If the user has not granted the notification permission, we request it
                    if (existingStatus !== 'granted') {
                        console.log('🔔 [Login] Demande de permission de notification');
                        const { status } = await Notifications.requestPermissionsAsync();
                        finalStatus = status;
                        console.log('🔔 [Login] Nouveau statut des permissions:', status);
                    }

                    // If the user has granted the notification permission, we get the token and synchronize it with the API
                    if (finalStatus === 'granted') {
                        console.log('🔑 [Login] Récupération du token de notification');
                        const tokenData = await Notifications.getExpoPushTokenAsync({
                            projectId: ENV.EXPO_PROJECT_ID,
                        });
                        console.log('✅ [Login] Token obtenu:', tokenData.data);

                        // Synchronize the token with the API
                        console.log('🔄 [Login] Synchronisation du token avec l\'API');
                        const syncResult = await synchronizeTokenWithAPI(tokenData.data);
                        if (!syncResult) {
                            console.error('❌ [Login] Échec de la synchronisation du token');
                            handleError(t('error.errorSynchronizingTokenWithAPI'), {
                                type: ErrorType.SYSTEM,
                                silent: false
                            });
                        } else {
                            console.log('✅ [Login] Token synchronisé avec succès');
                        }
                    }

                    // We navigate to the chat screen
                    console.log('🚀 [Login] Navigation vers l\'écran de chat');
                    onNavigate(SCREENS.CHAT);
                } else {
                    console.error('❌ [Login] Échec de la récupération des canaux');
                    handleError(t('errors.errorLoadingChannels'), {
                        type: ErrorType.SYSTEM,
                        silent: false
                    });
                }
            } else {
                console.log('⚠️ [Login] Échec de la première tentative, vérification du refresh token...');

                // Récupération des anciens credentials pour le refresh token
                const oldCredentials = await SecureStore.getItemAsync('userCredentials');
                if (!oldCredentials) {
                    console.log('❌ [Login] Pas d\'anciens credentials trouvés');
                    setAlertMessage(t('errors.invalidCredentials'));
                    setShowAlert(true);
                    return;
                }

                const { refreshToken, accountApiKey } = JSON.parse(oldCredentials);
                console.log('🔑 [Login] Ancien refresh token trouvé:', refreshToken?.substring(0, 10) + '...');

                // Tentative de refresh du token
                console.log('🔄 [Login] Tentative de refresh du token');
                const refreshTokenResponse = await checkRefreshToken(
                    contractNumber,
                    accountApiKey,
                    refreshToken
                );

                // If the refresh token is not successful, we set the error
                if (!refreshTokenResponse.success) {
                    console.log('❌ [Login] Refresh token invalide, connexion impossible');
                    setAlertMessage(t('errors.sessionExpired'));
                    setShowAlert(true);
                    return;
                }

                console.log('✅ [Login] Nouveau refresh token obtenu:', refreshTokenResponse.data.refresh_token?.substring(0, 10) + '...');

                // Nouvelle tentative de login avec le nouveau refresh token
                console.log('🔑 [Login] Nouvelle tentative avec le refresh token...');
                const retryLoginResponse = await loginApi(
                    contractNumber,
                    login,
                    password,
                    refreshTokenResponse.data.refresh_token
                );

                // If the login is successful, we save the credentials
                if (retryLoginResponse.success) {
                    console.log('✅ [Login] Login réussi avec refresh token, nouveaux tokens:', {
                        accessToken: retryLoginResponse.accessToken?.substring(0, 10) + '...',
                        refreshToken: refreshTokenResponse.data.refresh_token?.substring(0, 10) + '...'
                    });

                    const credentials = {
                        contractNumber,
                        login,
                        password: hashPassword(password),
                        accountApiKey: retryLoginResponse.accountApiKey,
                        refreshToken: refreshTokenResponse.data.refresh_token,
                        accessToken: retryLoginResponse.accessToken
                    };

                    console.log('💾 [Login] Sauvegarde des nouveaux tokens');
                    await SecureStore.setItemAsync('userCredentials', JSON.stringify(credentials));
                    console.log('✅ [Login] Nouveaux tokens sauvegardés avec succès');

                    console.log('📡 [Login] Récupération des canaux utilisateur');
                    const channelsResponse = await fetchUserChannels(
                        contractNumber,
                        login,
                        password,
                        retryLoginResponse.accessToken,
                        retryLoginResponse.accountApiKey
                    );

                    // If the channels are loaded, we navigate to the chat screen
                    if (channelsResponse.status === 'ok') {
                        console.log('✅ [Login] Canaux récupérés avec succès');
                        console.log('🚀 [Login] Navigation vers l\'écran de chat');
                        onNavigate(SCREENS.CHAT);
                    } else {
                        console.error('❌ [Login] Échec de la récupération des canaux');
                        handleError(t('errors.errorLoadingChannels'), {
                            type: ErrorType.SYSTEM,
                            silent: false
                        });
                    }
                } else {
                    console.log('❌ [Login] Échec de la connexion avec le refresh token');
                    setAlertMessage(t('errors.invalidCredentials'));
                    setShowAlert(true);
                }
            }
        } catch (error) {
            console.error('❌ [Login] Erreur lors du processus de connexion:', error);
            handleLoginError(error, 'process');
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

                            // Synchroniser le token
                            const syncResult = await synchronizeTokenWithAPI(tokenData.data);
                            if (syncResult) {
                                console.log('[Login] Token de notification synchronisé avec succès');
                            } else {
                                console.log('[Login] Échec de la synchronisation du token de notification');
                            }
                        }

                        onNavigate(SCREENS.CHAT);
                    } else {
                        handleError(t('errors.errorLoad ingChannels'), {
                            type: ErrorType.SYSTEM,
                            silent: false
                        });
                        setIsSimplifiedLogin(false);
                    }
                } catch (error) {
                    handleLoginError(error, 'saveCredentials');
                    setIsSimplifiedLogin(false);
                }
            } else {
                handleError(t('errors.invalidCredentials'), {
                    type: ErrorType.SYSTEM,
                    silent: false
                });
                setIsSimplifiedLogin(false);
            }
        } catch (error) {
            setAlertMessage(t('errors.loginFailed'));
            setShowAlert(true);
            setIsSimplifiedLogin(false);
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
            handleLoginError(error, 'saveLoginInfo');
            throw error;
        }
    }, [isChecked, contractNumber, login, password]);

    /**
     * @function checkSavedLogin
     * @description Check if the login info is saved in the SecureStore
     */
    useEffect(() => {
        const checkSavedLogin = async () => {
            try {
                console.log('🔍 [Login] Vérification des informations de connexion sauvegardées');
                const savedLoginInfo = await SecureStore.getItemAsync('savedLoginInfo');
                if (savedLoginInfo) {
                    console.log('✅ [Login] Informations de connexion trouvées');
                    const parsedInfo = JSON.parse(savedLoginInfo);
                    setContractNumber(parsedInfo.contractNumber);
                    setLogin(parsedInfo.login);
                    setSavedLoginInfo(parsedInfo);
                    setIsSimplifiedLogin(true);
                } else {
                    console.log('ℹ️ [Login] Aucune information de connexion sauvegardée');
                }
            } catch (error) {
                console.error('❌ [Login] Erreur lors de la vérification des informations sauvegardées:', error);
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

                                        {error ? (
                                            <Text style={styles.errorText}>{error}</Text>
                                        ) : null}

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
    errorText: {
        color: COLORS.red,
        fontSize: SIZES.fonts.errorText,
        textAlign: 'center',
        marginTop: 10,
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
