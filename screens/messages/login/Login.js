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
import { fetchUserChannels } from '../../../services/api/messageApi';
import ButtonWithSpinner from '../../../components/buttons/ButtonWithSpinner';
import GradientBackground from '../../../components/backgrounds/GradientBackground';
import { hashPassword } from '../../../utils/encryption';
import { secureStore } from '../../../utils/encryption';
import { Text } from '../../../components/text/CustomText';
import { useTranslation } from 'react-i18next';
import { handleError, ErrorType } from '../../../utils/errorHandling';

/**
 * @component Login
 * @description Component to handle the login process and the persistence of the login data
 * @param {Object} props - The properties of the component
 * @param {Function} props.onNavigate - Function to navigate between screens
 */
export default function Login({ onNavigate, testID }) {

    // We get the translations and the device type
    const { t } = useTranslation();
    const { isSmartphone, isSmartphoneLandscape, isLandscape } = useDeviceType();

    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [error, setError] = useState('');
    const [contractNumber, setContractNumber] = useState('');
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [isChecked, setIsChecked] = useState(false);
    const [isSimplifiedLogin, setIsSimplifiedLogin] = useState(false);
    const [savedLoginInfo, setSavedLoginInfo] = useState(null);

    /**
     * @function handleLoginError
     * @description Handle login-related errors
     */
    const handleLoginError = (error, source) => {
        console.log(`[Login] Erreur dans ${source}:`, error);
        return handleError(error, `login.${source}`, {
            type: ErrorType.AUTH,
            silent: false
        });
    };

    /**
     * @function validateInputs
     * @description Validate the inputs of the login form
     * @returns {string} The error message if the inputs are not valid, otherwise null
     */
    const validateInputs = useCallback(() => {
        console.log('[Login] Validation des inputs:', { contractNumber, login, password: password ? '***' : '' });
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
            console.log('[Login] Début du processus de connexion');
            setIsLoading(true);
            setError('');

            try {
                console.log('[Login] Nettoyage du SecureStore');
                await SecureStore.deleteItemAsync('userCredentials');
            } catch (error) {
                console.log('[Login] Erreur lors du nettoyage du SecureStore:', error);
                throw error;
            }

            const validationError = validateInputs();
            if (validationError) {
                console.log('[Login] Erreur de validation:', validationError);
                setError(validationError);
                return;
            }

            console.log('[Login] Tentative de connexion avec l\'access token');
            const loginResponse = await loginApi(contractNumber, login, password, '');
            console.log('[Login] Réponse de loginApi:', {
                success: loginResponse.success,
                status: loginResponse.status,
                error: loginResponse.error
            });

            if (loginResponse.success) {
                console.log('[Login] Connexion réussie, sauvegarde des credentials');
                const credentials = {
                    contractNumber,
                    login,
                    password: hashPassword(password),
                    accountApiKey: loginResponse.accountApiKey,
                    refreshToken: loginResponse.refreshToken,
                    accessToken: loginResponse.accessToken
                };

                await SecureStore.setItemAsync('userCredentials', JSON.stringify(credentials));
                console.log('[Login] Credentials sauvegardés');

                if (isChecked) {
                    console.log('[Login] Sauvegarde des informations de connexion');
                    await saveLoginInfo();
                }

                console.log('[Login] Récupération des canaux utilisateur');
                const channelsResponse = await fetchUserChannels(
                    contractNumber,
                    login,
                    password,
                    loginResponse.accessToken,
                    loginResponse.accountApiKey
                );
                console.log('[Login] Réponse de fetchUserChannels:', {
                    status: channelsResponse.status,
                    channelsCount: channelsResponse.channels?.length
                });

                if (channelsResponse.status === 'ok') {
                    console.log('[Login] Navigation vers l\'écran de chat');
                    onNavigate(SCREENS.CHAT);
                } else {
                    console.log('[Login] Erreur lors du chargement des canaux');
                    setError(t('errors.errorLoadingChannels'));
                }
            } else {
                console.log('[Login] Échec de la première tentative, tentative avec le refresh token');
                const refreshTokenResponse = await checkRefreshToken(
                    contractNumber,
                    loginResponse.accountApiKey,
                    loginResponse.refreshToken
                );
                console.log('[Login] Réponse de checkRefreshToken:', {
                    success: refreshTokenResponse.success,
                    error: refreshTokenResponse.error
                });

                if (!refreshTokenResponse.success) {
                    console.log('[Login] Échec du refresh token');
                    setError(t('errors.sessionExpired'));
                    return;
                }

                console.log('[Login] Deuxième tentative de connexion avec le nouveau refresh token');
                const retryLoginResponse = await loginApi(
                    contractNumber,
                    login,
                    password,
                    refreshTokenResponse.data.refresh_token
                );
                console.log('[Login] Réponse de la deuxième tentative:', {
                    success: retryLoginResponse.success,
                    status: retryLoginResponse.status,
                    error: retryLoginResponse.error
                });

                if (retryLoginResponse.success) {
                    console.log('[Login] Deuxième tentative réussie, sauvegarde des nouveaux credentials');
                    const credentials = {
                        contractNumber,
                        login,
                        password: hashPassword(password),
                        accountApiKey: retryLoginResponse.accountApiKey,
                        refreshToken: refreshTokenResponse.data.refresh_token,
                        accessToken: retryLoginResponse.accessToken
                    };

                    await SecureStore.setItemAsync('userCredentials', JSON.stringify(credentials));
                    console.log('[Login] Nouveaux credentials sauvegardés');

                    console.log('[Login] Récupération des canaux avec les nouveaux tokens');
                    const channelsResponse = await fetchUserChannels(
                        contractNumber,
                        login,
                        password,
                        retryLoginResponse.accessToken,
                        retryLoginResponse.accountApiKey
                    );
                    console.log('[Login] Réponse de fetchUserChannels (deuxième tentative):', {
                        status: channelsResponse.status,
                        channelsCount: channelsResponse.channels?.length
                    });

                    if (channelsResponse.status === 'ok') {
                        console.log('[Login] Navigation vers l\'écran de chat');
                        onNavigate(SCREENS.CHAT);
                    } else {
                        console.log('[Login] Erreur lors du chargement des canaux (deuxième tentative)');
                        setError(t('errors.errorLoadingChannels'));
                    }
                } else {
                    console.log('[Login] Échec de la deuxième tentative');
                    setError(t('errors.invalidCredentials'));
                }
            }
        } catch (loginError) {
            console.log('[Login] Erreur générale:', loginError);
            setError(t('errors.loginFailed'));
        } finally {
            setIsLoading(false);
        }
    }, [contractNumber, login, password, isChecked, onNavigate, saveLoginInfo, validateInputs, t]);


    /**
     * @function handleSimplifiedLogin
     * @description Handle the simplified login process when the user has saved login info
     */
    const handleSimplifiedLogin = useCallback(async () => {
        // If there is no saved login info, we return nothing
        if (!savedLoginInfo) {
            return;
        }

        // We start the simplified login process
        setIsLoading(true);
        try {
            // We get the saved login info
            const { contractNumber, login, password } = savedLoginInfo;
            // We login with the saved credentials
            const loginResponse = await loginApi(contractNumber, login, password, '');

            // If the login is successful, we save the credentials and navigate to the chat screen
            if (loginResponse && loginResponse.status === 200) {
                try {
                    await secureStore.saveCredentials({
                        contractNumber,
                        login,
                        password: hashPassword(password),
                        accountApiKey: loginResponse.accountApiKey,
                        refreshToken: loginResponse.refreshToken,
                        accessToken: loginResponse.accessToken
                    });

                    const channelsResponse = await fetchUserChannels(
                        contractNumber,
                        login,
                        password,
                        loginResponse.accessToken,
                        loginResponse.accountApiKey
                    );

                    // If the channels are loaded, we navigate to the chat screen
                    if (channelsResponse.status === 'ok') {
                        onNavigate(SCREENS.CHAT);
                    } else {
                        setError(t('errors.errorLoadingChannels'));
                        setIsSimplifiedLogin(false);
                    }
                } catch (error) {
                    handleLoginError(error, 'saveCredentials');
                    setError(t('errors.errorSavingLoginInfo'));
                    setIsSimplifiedLogin(false);
                }
            } else {
                setError(t('errors.invalidCredentials'));
                setIsSimplifiedLogin(false);
            }
        } catch (error) {
            handleLoginError(error, 'simplifiedLogin');
            setError(t('errors.loginFailed'));
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
                const savedInfo = await SecureStore.getItemAsync('savedLoginInfo');
                if (savedInfo) {
                    const parsedInfo = JSON.parse(savedInfo);
                    setSavedLoginInfo(parsedInfo);
                    setIsSimplifiedLogin(true);
                    setContractNumber(parsedInfo.contractNumber);
                }
            } catch (error) {
                handleLoginError(error, 'checkSavedLogin');
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
                                            <Text style={[styles.title, isSmartphone && styles.titleSmartphone, isLandscape && styles.titleLandscape]}>{t('titles.welcome')}</Text>
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
                                                    label={t('auth.stayConnected')}
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
                                        <Text style={[styles.backLinkText, isSmartphone && styles.backLinkTextSmartphone]}>
                                            {t('buttons.returnToTitle')}
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
        width: '55%',
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
