import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, TouchableOpacity, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import InputLogin from '../../../components/inputs/InputLogin';
import CheckBox from '../../../components/inputs/CheckBox';
import SimplifiedLogin from './SimplifiedLogin';
import { COLORS, SIZES } from '../../../constants/style';
import { useDeviceType } from '../../../hooks/useDeviceType';
import { SCREENS } from '../../../constants/screens';
import { loginApi } from '../../../services/api/authApi';
import { fetchUserChannels } from '../../../services/api/messageApi';
import ButtonWithSpinner from '../../../components/buttons/ButtonWithSpinner';
import GradientBackground from '../../../components/backgrounds/GradientBackground';
import { hashPassword } from '../../../utils/encryption';
import { secureStore } from '../../../utils/encryption';
import { Text } from '../../../components/text/CustomText';
import { useTranslation } from 'react-i18next';

/**
 * @component Login
 * @description Component to handle the login process and the persistence of the login data
 *
 * @param {Object} props - The properties of the component
 * @param {Function} props.onNavigate - Function to navigate between screens
 */
export default function Login({ onNavigate, testID }) {

    const { t } = useTranslation();

    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [error, setError] = useState('');
    const [contractNumber, setContractNumber] = useState('');
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [isChecked, setIsChecked] = useState(false);
    const [isSimplifiedLogin, setIsSimplifiedLogin] = useState(false);
    const [savedLoginInfo, setSavedLoginInfo] = useState(null);

    const { isSmartphone, isSmartphoneLandscape, isLandscape } = useDeviceType();

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
    }, [contractNumber, login, password]);


    /**
     * @function handleLogin
     * @description Handle the login process
     */
    const handleLogin = useCallback(async () => {
        try {
            setIsLoading(true);
            setError('');

            // Clean up the SecureStore in case of previous error
            try {
                await SecureStore.deleteItemAsync('userCredentials');
            } catch (error) {
                throw error;
            }

            const validationError = validateInputs();
            if (validationError) {
                setError(validationError);
                return;
            }

            const loginResponse = await loginApi(contractNumber, login, password);
            console.log('🔵 Réponse login:', loginResponse);

            if (loginResponse.success) {
                // Save the new credentials in the SecureStore
                const credentials = {
                    contractNumber,
                    login,
                    password: hashPassword(password),
                    accountApiKey: loginResponse.accountApiKey,
                };

                await SecureStore.setItemAsync('userCredentials', JSON.stringify(credentials));

                // Save the login info if the checkbox is checked
                if (isChecked) {
                    await saveLoginInfo();
                }

                // Fetch the user channels
                console.log('🔵 Récupération des canaux avec:', {
                    contractNumber,
                    login,
                    accountApiKey: loginResponse.accountApiKey
                });

                const channelsResponse = await fetchUserChannels(
                    contractNumber,
                    login,
                    password,
                    '',
                    loginResponse.accountApiKey
                );

                console.log('🔵 Réponse channels:', channelsResponse);

                if (channelsResponse.status === 'ok' && channelsResponse.data?.private?.groups) {
                    onNavigate(SCREENS.CHAT);
                } else {
                    console.error('❌ Erreur channels:', channelsResponse);
                    setError('Erreur lors du chargement des canaux: ' + (channelsResponse.message || 'Erreur inconnue'));
                }
            } else {
                setError('Identifiants invalides');
            }
        } catch (loginError) {
            console.error('🔴 Erreur login:', loginError);
            setError('Échec de la connexion: ' + loginError.message);
        } finally {
            setIsLoading(false);
        }
    }, [contractNumber, login, password, isChecked, onNavigate, saveLoginInfo, validateInputs]);


    /**
     * @function handleSimplifiedLogin
     * @description Handle the simplified login process when the user has saved login info
     */
    const handleSimplifiedLogin = useCallback(async () => {
        if (!savedLoginInfo) {return;}

        setIsLoading(true);
        try {
            const { contractNumber, login, password } = savedLoginInfo;
            const loginResponse = await loginApi(contractNumber, login, password);

            if (loginResponse && loginResponse.status === 200) {
                await secureStore.saveCredentials({
                    contractNumber,
                    login,
                    password: hashPassword(password),
                    accountApiKey: loginResponse.accountApiKey,
                });

                const channelsResponse = await fetchUserChannels(contractNumber, login, password, '', loginResponse.accountApiKey);

                if (channelsResponse.status === 'ok') {
                    onNavigate(SCREENS.CHAT);
                } else {
                    setError(t('errors.errorLoadingChannels'));
                    setIsSimplifiedLogin(false);
                }
            } else {
                setError(t('errors.invalidCredentials'));
                setIsSimplifiedLogin(false);
            }
        } catch (error) {
            setError(t('errors.loginFailed'));
            setIsSimplifiedLogin(false);
        } finally {
            setIsLoading(false);
        }
    }, [savedLoginInfo, onNavigate]);

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
            console.error(t('errors.errorSavingLoginInfo'), error);
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
            } catch (savedLoginError) {
                throw savedLoginError;
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
    loginContainerLandscapeSmartphone: {
        marginTop: 0,
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
