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
            console.log('🔵 ===== DÉBUT DU PROCESSUS DE CONNEXION =====');
            console.log('🔵 Paramètres de connexion:', {
                contractNumber,
                login,
                hasPassword: !!password
            });
            setIsLoading(true);
            setError('');

            // Clean up the SecureStore in case of previous error
            try {
                console.log('🔵 Nettoyage du SecureStore...');
                await SecureStore.deleteItemAsync('userCredentials');
                console.log('✅ SecureStore nettoyé avec succès');
            } catch (error) {
                console.log('❌ Erreur lors du nettoyage du SecureStore:', error.message);
                throw error;
            }

            const validationError = validateInputs();
            if (validationError) {
                console.log('❌ Erreur de validation:', validationError);
                setError(validationError);
                return;
            }
            console.log('✅ Validation des champs réussie');

            // Première tentative de connexion avec accessToken vide
            console.log('🔵 Première tentative de connexion (sans accessToken)...');
            const loginResponse = await loginApi(contractNumber, login, password, '');
            console.log('🔵 Réponse de la première tentative:', {
                success: loginResponse.success,
                status: loginResponse.status,
                hasAccountApiKey: !!loginResponse.accountApiKey,
                hasRefreshToken: !!loginResponse.refreshToken,
                refreshToken: loginResponse.refreshToken ? `${loginResponse.refreshToken.substring(0, 10)}...${loginResponse.refreshToken.substring(loginResponse.refreshToken.length - 10)}` : 'absent',
                accessToken: loginResponse.accessToken ? `${loginResponse.accessToken.substring(0, 10)}...${loginResponse.accessToken.substring(loginResponse.accessToken.length - 10)}` : 'absent'
            });

            if (loginResponse.success) {
                console.log('✅ Login réussi:', {
                    status: loginResponse.status,
                    accountApiKey: loginResponse.accountApiKey,
                    hasRights: !!loginResponse.rights,
                    refreshToken: loginResponse.refreshToken ? `${loginResponse.refreshToken.substring(0, 10)}...${loginResponse.refreshToken.substring(loginResponse.refreshToken.length - 10)}` : 'absent',
                    accessToken: loginResponse.accessToken ? `${loginResponse.accessToken.substring(0, 10)}...${loginResponse.accessToken.substring(loginResponse.accessToken.length - 10)}` : 'absent'
                });

                // Sauvegarde des credentials avec le refresh token et l'access token
                const credentials = {
                    contractNumber,
                    login,
                    password: hashPassword(password),
                    accountApiKey: loginResponse.accountApiKey,
                    refreshToken: loginResponse.refreshToken,
                    accessToken: loginResponse.accessToken
                };

                console.log('🔵 Sauvegarde des credentials...');
                await SecureStore.setItemAsync('userCredentials', JSON.stringify(credentials));
                console.log('✅ Credentials sauvegardés avec succès');

                // Save the login info if the checkbox is checked
                if (isChecked) {
                    console.log('🔵 Sauvegarde des informations de connexion...');
                    await saveLoginInfo();
                    console.log('✅ Informations de connexion sauvegardées avec succès');
                }

                // Fetch the user channels with the access token
                console.log('🔵 Chargement des canaux...');
                const channelsResponse = await fetchUserChannels(
                    contractNumber,
                    login,
                    password,
                    loginResponse.accessToken,
                    loginResponse.accountApiKey
                );
                console.log('🔵 Réponse du chargement des canaux:', {
                    status: channelsResponse.status,
                    hasChannels: !!channelsResponse.channels
                });

                // Navigate to the chat screen if the channels are loaded
                if (channelsResponse.status === 'ok') {
                    console.log('✅ Canaux chargés avec succès, navigation vers le chat');
                    onNavigate(SCREENS.CHAT);
                } else {
                    console.log('❌ Erreur lors du chargement des canaux:', channelsResponse);
                    setError('Error loading channels');
                }
            } else {
                // Si la première tentative échoue, on essaie avec le refresh token
                console.log('🔵 Première tentative échouée, vérification du refresh token...');
                const refreshTokenResponse = await checkRefreshToken(
                    contractNumber,
                    loginResponse.accountApiKey,
                    loginResponse.refreshToken
                );
                console.log('🔵 Réponse de la vérification du refresh token:', {
                    success: refreshTokenResponse.success,
                    hasData: !!refreshTokenResponse.data,
                    hasRefreshToken: !!refreshTokenResponse.data?.refresh_token,
                    refreshToken: refreshTokenResponse.data?.refresh_token ? `${refreshTokenResponse.data.refresh_token.substring(0, 10)}...${refreshTokenResponse.data.refresh_token.substring(refreshTokenResponse.data.refresh_token.length - 10)}` : 'absent',
                    accessToken: refreshTokenResponse.data?.access_token ? `${refreshTokenResponse.data.access_token.substring(0, 10)}...${refreshTokenResponse.data.access_token.substring(refreshTokenResponse.data.access_token.length - 10)}` : 'absent'
                });

                if (!refreshTokenResponse.success) {
                    console.log('❌ Refresh token invalide:', refreshTokenResponse.error);
                    setError('Session expirée. Veuillez vous reconnecter.');
                    return;
                }
                console.log('✅ Refresh token valide, nouvelle tentative de connexion...');

                // Deuxième tentative avec le nouveau refresh token et access token
                const retryLoginResponse = await loginApi(
                    contractNumber,
                    login,
                    password,
                    refreshTokenResponse.data.refresh_token
                );
                console.log('🔵 Réponse de la deuxième tentative:', {
                    success: retryLoginResponse.success,
                    status: retryLoginResponse.status,
                    hasAccountApiKey: !!retryLoginResponse.accountApiKey,
                    accessToken: retryLoginResponse.accessToken ? `${retryLoginResponse.accessToken.substring(0, 10)}...${retryLoginResponse.accessToken.substring(retryLoginResponse.accessToken.length - 10)}` : 'absent'
                });

                if (retryLoginResponse.success) {
                    // Sauvegarde des nouveaux credentials
                    const credentials = {
                        contractNumber,
                        login,
                        password: hashPassword(password),
                        accountApiKey: retryLoginResponse.accountApiKey,
                        refreshToken: refreshTokenResponse.data.refresh_token,
                        accessToken: retryLoginResponse.accessToken
                    };

                    console.log('🔵 Sauvegarde des nouveaux credentials...');
                    await SecureStore.setItemAsync('userCredentials', JSON.stringify(credentials));
                    console.log('✅ Nouveaux credentials sauvegardés avec succès');

                    // Chargement des canaux avec le nouveau refresh token et access token
                    console.log('🔵 Chargement des canaux avec le nouveau refresh token et access token...');
                    const channelsResponse = await fetchUserChannels(
                        contractNumber,
                        login,
                        password,
                        retryLoginResponse.accessToken,
                        retryLoginResponse.accountApiKey
                    );
                    console.log('🔵 Réponse du chargement des canaux:', {
                        status: channelsResponse.status,
                        hasChannels: !!channelsResponse.channels
                    });

                    if (channelsResponse.status === 'ok') {
                        console.log('✅ Canaux chargés avec succès, navigation vers le chat');
                        onNavigate(SCREENS.CHAT);
                    } else {
                        console.log('❌ Erreur lors du chargement des canaux:', channelsResponse);
                        setError('Error loading channels');
                    }
                } else {
                    console.log('❌ Échec de la deuxième tentative de connexion');
                    setError('Invalid credentials');
                }
            }
        } catch (loginError) {
            console.log('❌ Erreur lors du processus de connexion:', {
                message: loginError.message,
                stack: loginError.stack
            });
            setError('Login failed');
        } finally {
            setIsLoading(false);
            console.log('🔵 ===== FIN DU PROCESSUS DE CONNEXION =====');
        }
    }, [contractNumber, login, password, isChecked, onNavigate, saveLoginInfo, validateInputs]);


    /**
     * @function handleSimplifiedLogin
     * @description Handle the simplified login process when the user has saved login info
     */
    const handleSimplifiedLogin = useCallback(async () => {
        if (!savedLoginInfo) {
            console.log('❌ Pas d\'informations de connexion sauvegardées');
            return;
        }

        console.log('🔵 ===== DÉBUT DU PROCESSUS DE CONNEXION SIMPLIFIÉE =====');
        console.log('🔵 Informations de connexion sauvegardées:', {
            contractNumber: savedLoginInfo.contractNumber,
            login: savedLoginInfo.login,
            hasPassword: !!savedLoginInfo.password
        });

        setIsLoading(true);
        try {
            const { contractNumber, login, password } = savedLoginInfo;
            console.log('🔵 Tentative de connexion avec les informations sauvegardées...');
            const loginResponse = await loginApi(contractNumber, login, password, '');
            console.log('🔵 Réponse de la tentative de connexion:', {
                success: loginResponse.success,
                status: loginResponse.status,
                hasAccountApiKey: !!loginResponse.accountApiKey,
                hasRefreshToken: !!loginResponse.refreshToken,
                refreshToken: loginResponse.refreshToken ? `${loginResponse.refreshToken.substring(0, 10)}...${loginResponse.refreshToken.substring(loginResponse.refreshToken.length - 10)}` : 'absent',
                accessToken: loginResponse.accessToken ? `${loginResponse.accessToken.substring(0, 10)}...${loginResponse.accessToken.substring(loginResponse.accessToken.length - 10)}` : 'absent'
            });

            if (loginResponse && loginResponse.status === 200) {
                try {
                    console.log('🔵 Sauvegarde des credentials...');
                    await secureStore.saveCredentials({
                        contractNumber,
                        login,
                        password: hashPassword(password),
                        accountApiKey: loginResponse.accountApiKey,
                        refreshToken: loginResponse.refreshToken,
                        accessToken: loginResponse.accessToken
                    });
                    console.log('✅ Credentials sauvegardés avec succès');

                    console.log('🔵 Chargement des canaux...');
                    const channelsResponse = await fetchUserChannels(
                        contractNumber,
                        login,
                        password,
                        loginResponse.accessToken,
                        loginResponse.accountApiKey
                    );
                    console.log('🔵 Réponse du chargement des canaux:', {
                        status: channelsResponse.status,
                        hasChannels: !!channelsResponse.channels
                    });

                    if (channelsResponse.status === 'ok') {
                        console.log('✅ Canaux chargés avec succès, navigation vers le chat');
                        onNavigate(SCREENS.CHAT);
                    } else {
                        console.log('❌ Erreur lors du chargement des canaux:', channelsResponse);
                        setError(t('errors.errorLoadingChannels'));
                        setIsSimplifiedLogin(false);
                    }
                } catch (error) {
                    console.log('❌ Erreur lors de la sauvegarde des credentials:', error.message);
                    handleLoginError(error, 'saveCredentials');
                    setError(t('errors.errorSavingLoginInfo'));
                    setIsSimplifiedLogin(false);
                }
            } else {
                console.log('❌ Échec de la connexion:', loginResponse);
                setError(t('errors.invalidCredentials'));
                setIsSimplifiedLogin(false);
            }
        } catch (error) {
            console.log('❌ Erreur lors du processus de connexion simplifiée:', error.message);
            handleLoginError(error, 'simplifiedLogin');
            setError(t('errors.loginFailed'));
            setIsSimplifiedLogin(false);
        } finally {
            setIsLoading(false);
            console.log('🔵 ===== FIN DU PROCESSUS DE CONNEXION SIMPLIFIÉE =====');
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
