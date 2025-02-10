import { useState, useEffect } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import InputLogin from '../../../components/inputs/InputLogin';
import CheckBox from '../../../components/inputs/CheckBox';
import SimplifiedLogin from './SimplifiedLogin';
import { COLORS, SIZES } from '../../../constants/style';
import { useDeviceType } from '../../../hooks/useDeviceType';
import { SCREENS } from '../../../constants/screens';
// import { loginApi, fetchUserChannels } from '../../../services/api/messageApi';
import { loginApi } from '../../../services/api/authApi';
import { fetchUserChannels } from '../../../services/api/messageApi';
import ButtonWithSpinner from '../../../components/buttons/ButtonWithSpinner';
import GradientBackground from '../../../components/backgrounds/GradientBackground';
import { hashPassword } from '../../../utils/encryption';
import { secureStore } from '../../../utils/encryption';
// import { Network } from '@react-native-community/netinfo';
import * as Network from 'expo-network';


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
    const [savedLoginInfo, setSavedLoginInfo] = useState(null);

    const handleSimplifiedLogin = async () => {
        if (!savedLoginInfo) return;
        
        setIsLoading(true);
        try {
            const { contractNumber, login, password } = savedLoginInfo;
            const loginResponse = await loginApi(contractNumber, login, password);
            
            if (loginResponse && loginResponse.status === 'ok') {
                await secureStore.saveCredentials({
                    contractNumber,
                    login,
                    password: hashPassword(password)
                });
                onNavigate(SCREENS.CHAT);
            }
        } catch (error) {
            console.error('Login error:', error);
            setError('Login failed');
            setIsSimplifiedLogin(false);
        } finally {
            setIsLoading(false);
        }
    };

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
                console.error('Error checking saved login:', error);
            } finally {
                setIsInitialLoading(false);
            }
        };
        
        checkSavedLogin();
    }, []);

    useEffect(() => {
        if (isSimplifiedLogin && savedLoginInfo) {
            handleSimplifiedLogin();
        }
    }, [isSimplifiedLogin, savedLoginInfo]);

    // If on is in initial loading, we don't render anything
    if (isInitialLoading) {
        return null;
    }

    /**
     * @function handleLogin
     * @description Handles the login process 
     */
    const handleLogin = async () => {
        try {
            // Vérification de la connexion Internet
            const netInfo = await Network.getNetworkStateAsync();
            if (!netInfo.isConnected || !netInfo.isInternetReachable) {
                setError('Pas de connexion Internet');
                return;
            }

            // console.log('🌐 État de la connexion:', netInfo);
            
            // We validate the inputs
            const validationError = validateInputs();
            if (validationError) {
                setError(validationError);
                return;
            }

            // We set the loading state to true
            setIsLoading(true);
            setError('');

            const loginResponse = await loginApi(contractNumber, login, password);
            // console.log('✅ Réponse du serveur:', loginResponse);

            if (loginResponse && loginResponse.status === 'ok') {
                // console.log('🔑 Sauvegarde des identifiants...');
                
                // Sauvegarder d'abord les identifiants
                await secureStore.saveCredentials({
                    contractNumber,
                    login,
                    password: hashPassword(password)
                });
                
                // console.log('✅ Identifiants sauvegardés');

                // Ensuite sauvegarder les infos de connexion simplifiée si nécessaire
                if (isChecked) {
                    await saveLoginInfo();
                }

                // Load the channels immediately after login
                const channelsResponse = await fetchUserChannels(contractNumber, login, password);
                // console.log('📊 Réponse des channels:', channelsResponse);

                if (channelsResponse.status === 'ok') {
                    onNavigate(SCREENS.CHAT);
                } else {
                    // console.log('❌ Erreur channels:', channelsResponse);
                    setError('Error loading channels');
                }
            } else {
                // console.log('❌ Erreur login:', loginResponse);
                setError(loginResponse.error || 'Invalid credentials');
            }
        } catch (error) {
            // console.log('🔴 Erreur détaillée:', {
            //     message: error.message,
            //     config: error.config,
            //     url: error.config?.url,
            //     method: error.config?.method,
            //     headers: error.config?.headers
            // });
            if (error.message === 'Network Error') {
                setError('Impossible de joindre le serveur. Vérifiez votre connexion.');
            } else {
                setError('Erreur de connexion au serveur');
            }
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
            // Sauvegarder les identifiants de connexion
            await secureStore.saveCredentials({
                contractNumber,
                login,
                password: hashPassword(password)
            });

            // Sauvegarder les infos de connexion simplifiée si la case est cochée
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
            throw error; // Propager l'erreur pour la gérer dans handleLogin
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