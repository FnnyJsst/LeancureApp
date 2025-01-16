import { useState, useEffect } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Button from '../../../components/buttons/Button';
import InputLogin from '../../../components/InputLogin';
import CheckBox from '../../../components/inputs/CheckBox';
import SimplifiedLogin from './SimplifiedLogin';
import { COLORS, SIZES } from '../../../constants/style';
import { useDeviceType } from '../../../hooks/useDeviceType';
import { SCREENS } from '../../../constants/screens';
import { Ionicons } from '@expo/vector-icons';

export default function Login({ onNavigate }) {

    // Customized hook to determine the device type and orientation
    const { isSmartphone, isTablet, isTabletPortrait, isSmartphoneLandscape, isTabletLandscape, isLandscape } = useDeviceType();
    
    // States related to the login form
    const [contractNumber, setContractNumber] = useState('');
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isChecked, setIsChecked] = useState(false);
    const [isSimplifiedLogin, setIsSimplifiedLogin] = useState(false);

    // UseEffect to load the login info from AsyncStorage when the component is mounted
    useEffect(() => {
        loadLoginInfo();
    }, []);

    // Function to handle the login process
    const handleLogin = async () => {
        // If the user has checked the "Stay connected" checkbox, use the saved password
        if (isSimplifiedLogin) {
            setIsLoading(true);
            setError('');
            
            try {
                // Send the login request to the server
                const response = await axios.post('http://fannyserver.rasp/ic.php', {
                    cmd: [{
                        accounts: {
                            loginmsg: {
                                // We get the login info from the server
                                get: {
                                    contractnumber: contractNumber,
                                    login: login,
                                    password: password
                                }
                            }
                        }
                    }]
                });
        
                // If the login is successful, navigate to the chat screen
                if (response.data.status === 'ok') {
                    onNavigate(SCREENS.CHAT);
                // If the login is not successful, set an error message
                } else {
                    setError('Incorrect credentials');
                }
            // If there is an error, set an error message
            } catch (error) {
                console.error('Server connection error:', error);
                setError('Server connection error');
            } finally {
                // Finally, set the loading state to false to hide the loading spinner
                setIsLoading(false);
            }
            return;
        }
        // If the user has not checked the "Stay connected" checkbox, we need to check if all fields are filled
        if (!contractNumber || !login || !password) {
            setError('Please fill in all fields');
            return;
        }
        // Set the loading state to true to show the loading spinner
        setIsLoading(true);
        // Reset the error message
        setError('');
    
        try {
            // Send the login request to the server
            const response = await axios.post('http://fannyserver.rasp/ic.php', {
                cmd: [{
                    accounts: {
                        loginmsg: {
                            get: {
                                contractnumber: contractNumber,
                                login: login,
                                password: password
                            }
                        }
                    }
                }]
            });
    
            if (response.data.status === 'ok') {
                //If the user has checked the "Stay connected" checkbox, save the login info in AsyncStorage
                if (isChecked) {
                    await saveLoginInfo();
                }
                //Navigate to the chat screen
                onNavigate(SCREENS.CHAT);
            //If credentials are incorrect, set an error message
            } else {
                setError('Incorrect credentials');
            }
        //If there is an error, set an error message
        } catch (error) {
            setError('Server connection error');
        //Finally, set the loading state to false to hide the loading spinner
        } finally {
            setIsLoading(false);
        }
    };
    
    // Save login info in AsyncStorage to keep the user logged in when the app is closed
    const saveLoginInfo = async () => {
        if (isChecked) {
            try {
                // Save the login info in AsyncStorage
                await AsyncStorage.setItem('savedLoginInfo', JSON.stringify({
                    contractNumber,
                    login,
                    password,
                    isSimplifiedLogin: true,
                    wasChecked: isChecked
                }));
            // If there is an error, set an error message
            } catch (error) {
                console.error('Error saving login info:', error);
            }
        } else {
            // If the case is not checked, we remove the login info from AsyncStorage
            try {
                await AsyncStorage.removeItem('savedLoginInfo');
                setIsSimplifiedLogin(false);
            } catch (error) {
                console.error('Error removing login info:', error);
            }
        }
    };

    // Load login info from AsyncStorage if the user has checked the "Stay connected" checkbox
    const loadLoginInfo = async () => {
        try {
            //Get the login info from AsyncStorage
            const savedInfo = await AsyncStorage.getItem('savedLoginInfo');
            if (savedInfo) {
                //Parse the login info from AsyncStorage to an object 
                const { 
                    contractNumber: savedContract, 
                    login: savedLogin, 
                    password: savedPassword,
                    isSimplifiedLogin,
                    wasChecked
                } = JSON.parse(savedInfo);
                
                // If the case was checked, load the login info
                if (wasChecked) {
                    setContractNumber(savedContract);
                    setLogin(savedLogin);
                    setPassword(savedPassword);
                    setIsSimplifiedLogin(isSimplifiedLogin);
                    setIsChecked(true);  
                } else {
                    // If the case was not checked, reset everything
                    await AsyncStorage.removeItem('savedLoginInfo');
                    setIsSimplifiedLogin(false);
                }
            }
        } catch (error) {
            console.error('Error loading login info:', error);
        }
    };

    return (
    <View style={[styles.pageContainer, isTablet && styles.pageContainerTablet]}>
        <View style={styles.headerContainer}>
            <TouchableOpacity onPress={() => onNavigate(SCREENS.APP_MENU)}>
                <Ionicons name="chevron-back-outline" size={isSmartphone ? 30 : 40} color={COLORS.gray300} />
            </TouchableOpacity>
        </View>
        <View style={[styles.formContainerPortrait, isSmartphone && styles.formContainerSmartphonePortrait]}>
            <ScrollView>
                {/* If the user has checked the "Stay connected" checkbox, we show the simplified login screen */}
                {isSimplifiedLogin ? (
                    <SimplifiedLogin 
                        contractNumber={contractNumber}
                        login={login}
                        onSwitchAccount={() => setIsSimplifiedLogin(false)}
                        handleLogin={handleLogin}
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
                                    <Button 
                                        variant="large"
                                        // If the login is in progress, we show "Connecting..."
                                        title={isLoading ? "Connecting..." : "Login"}
                                        onPress={handleLogin}
                                        width="100%"
                                    />
                                </View>
                            </View>
                        </View>
                    </>
                )}
            </ScrollView>
        </View>
    </View>
    );
}

const styles = StyleSheet.create({
    pageContainer: {
        flex: 1,
        backgroundColor: COLORS.gray900,
    },
    formContainer: {
        flex: 1,
        paddingHorizontal: '15%',
    },
    formContainerSmartphonePortrait: {
        paddingHorizontal: '5%',
    },
    headerContainer: {
        justifyContent: 'flex-start',
        paddingTop: 15,
        marginLeft: 20,
    },
    loginContainer: {
        flex: 1,
        backgroundColor: COLORS.gray800,
        padding: 25,
        borderRadius: SIZES.borderRadius.large,
        alignSelf: 'center',
        marginTop: 100,
        width: '70%',
    },
    loginContainerSmartphone: {
        width: '95%',
    },
    loginContainerLandscape: {
        width: '50%',
        marginTop: 70
    },
    loginContainerTabletPortrait: {
        marginTop: 50,
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
        fontSize: SIZES.fonts.inputTitleSmartphone,
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
});