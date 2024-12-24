// import { useState, useEffect } from 'react';
// import { ScrollView, View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';
// import ButtonLarge from '../../components/buttons/ButtonLarge';
// import InputLogin from '../../components/InputLogin';
// import Separator from '../../components/Separator';
// import CheckBox from '../../components/CheckBox';
// import SimplifiedLogin from './SimplifiedLogin';
// import { COLORS, SIZES } from '../../constants/style';
// import { useDeviceType } from '../../hooks/useDeviceType';
// import { SCREENS } from '../../constants/screens';

// export default function Login({ onNavigate }) {
//     const { isPortrait, isSmartphone, isTablet, isTabletPortrait, isSmartphoneLandscape } = useDeviceType();
    
//     const [contractNumber, setContractNumber] = useState('');
//     const [login, setLogin] = useState('');
//     const [password, setPassword] = useState('');
//     const [error, setError] = useState('');
//     const [isLoading, setIsLoading] = useState(false);
//     const [isChecked, setIsChecked] = useState(false);
//     const [isSimplifiedLogin, setIsSimplifiedLogin] = useState(false);

//     useEffect(() => {
//         loadLoginInfo();
//     }, []);

//     const handleLogin = async () => {
//         if (!contractNumber || !login || !password) {
//             setError('Veuillez remplir tous les champs');
//             return;
//         }
    
//         setIsLoading(true);
//         setError('');
    
//         try {
//             const response = await axios.post('http://fannyserver.rasp/ic.php', {
//                 cmd: [{
//                     accounts: {
//                         loginmsg: {
//                             get: {
//                                 contractnumber: contractNumber,
//                                 login: login,
//                                 password: password
//                             }
//                         }
//                     }
//                 }]
//             });
    
//             if (response.data.status === 'ok') {
//                 //If the user has checked the "Stay connected" checkbox, save the login info in AsyncStorage
//                 if (isChecked) {
//                     await saveLoginInfo();
//                 }
//                 //Navigate to the chat screen
//                 onNavigate(SCREENS.CHAT);
//             //If credentials are incorrect, set an error message
//             } else {
//                 setError('Incorrect credentials');
//             }
//         //If there is an error, set an error message
//         } catch (error) {
//             console.error('Server connection error:', error);
//             setError('Server connection error');
//         //Finally, set the loading state to false to hide the loading spinner
//         } finally {
//             setIsLoading(false);
//         }
//     };
    
//     // Save login info in AsyncStorage to keep the user logged in when the app is closed
//     const saveLoginInfo = async () => {
//         //If the user has checked the "Stay connected" checkbox, save the login info in AsyncStorage
//         if (isChecked) {
//             try {
//                 //Save the login info in AsyncStorage as a JSON object
//                 await AsyncStorage.setItem('savedLoginInfo', JSON.stringify({
//                     contractNumber,
//                     login,
//                     isSimplifiedLogin: true
//                 }));
//             //If there is an error, set an error message
//             } catch (error) {
//                 console.error('Error saving login info:', error);
//             }
//         }
//     };

//     // Load login info from AsyncStorage if the user has checked the "Stay connected" checkbox
//     const loadLoginInfo = async () => {
//         try {
//             //Get the login info from AsyncStorage
//             const savedInfo = await AsyncStorage.getItem('savedLoginInfo');
//             if (savedInfo) {
//                 //Parse the login info from AsyncStorage to an object 
//                 const { contractNumber: savedContract, login: savedLogin, isSimplifiedLogin } = JSON.parse(savedInfo);
//                 //Set the login info in the state
//                 setContractNumber(savedContract);
//                 setLogin(savedLogin);
//                 setIsSimplifiedLogin(isSimplifiedLogin);
//             }
//         //If there is an error, set an error message
//         } catch (error) {
//             console.error('Error loading login info:', error);
//         }
//     };

//     return (
//     <View style={[styles.pageContainer, isTablet && styles.pageContainerTablet]}>
//         {/* Header commun */}
//         <View style={[styles.headerContainer, isSmartphoneLandscape && styles.headerContainerSmartphoneLandscape]}>
//             <TouchableOpacity onPress={() => onNavigate(SCREENS.APP_MENU)}>
//                 <Image 
//                     source={require('../../assets/images/logo.png')} 
//                     style={[styles.logo, isSmartphone && styles.logoSmartphone]} 
//                 />
//             </TouchableOpacity>
//         </View>
//         {isPortrait && (<Separator width={'100%'} />)}

//         <ScrollView>
//             {isSimplifiedLogin ? (
//                 <SimplifiedLogin 
//                     contractNumber={contractNumber}
//                     login={login}
//                     onSwitchAccount={() => setIsSimplifiedLogin(false)}
//                 />
//             ) : (
//                 <View style={[
//                     styles.loginContainer,
//                     isTablet && styles.loginContainerTablet,
//                     isSmartphone && styles.loginContainerSmartphone,
//                     isSmartphoneLandscape && styles.loginContainerSmartphoneLandscape
//                 ]}>
//                     <Text style={[
//                         styles.title,
//                         isTabletPortrait && styles.titleTabletPortrait,
//                         isSmartphone && styles.titleSmartphone,
//                         isSmartphoneLandscape && styles.titleSmartphoneLandscape
//                     ]}>
//                         Connexion
//                     </Text>

//                     <View style={styles.inputsContainer}>
//                         <View style={styles.inputGroup}>
//                             <Text style={styles.inputTitle}>Contract number</Text>
//                             <View style={styles.inputWrapper}>
//                                 <InputLogin 
//                                     placeholder="Enter your contract number"
//                                     value={contractNumber}
//                                     onChangeText={setContractNumber}
//                                     iconName="building-o"
//                                     iconLibrary="FontAwesome"
//                                 />
//                             </View>
//                         </View>

//                         <View style={styles.inputGroup}>
//                             <Text style={[styles.inputTitle, isSmartphoneLandscape && styles.inputTitleSmartphoneLandscape]}>
//                                 Login
//                             </Text>
//                             <View style={styles.inputWrapper}>
//                                 <InputLogin 
//                                     placeholder="Enter your login"
//                                     value={login}
//                                     onChangeText={setLogin}
//                                     iconName="person-outline"
//                                 />
//                             </View>
//                         </View>

//                         <View style={styles.inputGroup}>
//                             <Text style={[styles.inputTitle, isSmartphoneLandscape && styles.inputTitleSmartphoneLandscape]}>
//                                 Password
//                             </Text>
//                             <View style={styles.inputWrapper}>
//                                 <InputLogin 
//                                     placeholder="Enter your password"
//                                     value={password}
//                                     onChangeText={setPassword}
//                                     secureTextEntry
//                                     iconName="lock-closed-outline"
//                                 />
//                             </View>
//                         </View>

//                         {error ? (
//                             <Text style={styles.errorText}>{error}</Text>
//                         ) : null}

//                         <View style={styles.checkboxContainer}>
//                             <CheckBox 
//                                 checked={isChecked}
//                                 onPress={() => setIsChecked(!isChecked)}
//                                 label="Stay connected"
//                             />
//                         </View>

//                         <ButtonLarge 
//                             title={isLoading ? "Connexion en cours..." : "Connexion"}
//                             onPress={handleLogin}
//                             disabled={isLoading}
//                         />
//                     </View>
//                 </View>
//             )}
//         </ScrollView>
//     </View>
//     );
// }

// const styles = StyleSheet.create({
//     pageContainer: {
//         flex: 1,
//         backgroundColor: COLORS.darkGray,
//     },
//     pageContainerTablet: {
//         paddingHorizontal: '15%',
//     },
//     pageContainerSmartphoneLandscape: {
//         paddingHorizontal: '12%',
//     },
//     headerContainer: {
//         alignItems: 'center',
//         justifyContent: 'center',
//         paddingTop: 10,
//     },
//     headerContainerSmartphoneLandscape: {
//         paddingTop: 0,
//     },
//     logo: {
//         width: 150,
//         height: 50,
//         resizeMode: 'contain',
//     },
//     logoSmartphone: {
//         width: 120,
//         height: 90,
//         objectFit: 'contain',
//         margin: -8,
//     },
//     loginContainer: {
//         flex: 1,
//         marginTop: 100,    
//         backgroundColor: '#232424',
//         margin: 20,
//         padding: 20,
//         borderRadius: SIZES.borderRadius.large,
//     },
//     loginContainerTablet: {
//         margin: 40,
//         padding: 30,
//     },
//     loginContainerSmartphone: {
//         marginTop: 75,
//         margin: 10,
//         padding: 15,
//         paddingVertical: 30,
//     },
//     loginContainerSmartphoneLandscape: {
//         marginTop: 10,
//     },
//     title: {
//         fontSize: SIZES.fonts.xLarge,
//         fontWeight: SIZES.fontWeight.bold,
//         color: COLORS.lightGray,
//         marginBottom: 30,
//     },
//     titleTabletPortrait: {
//         fontSize: SIZES.fonts.xXLarge,
//     },
//     titleSmartphone: {
//         fontSize: SIZES.fonts.large,
//         marginBottom: 35,
//         alignSelf: 'center',
//     },
//     titleSmartphoneLandscape: {
//         marginBottom: 15,
//     },
//     inputsContainer: {
//         width: '100%',
//         gap: 20,
//     },
//     inputGroup: {
//         gap: 5,
//     },
//     inputTitle: {
//         color: COLORS.lightGray,
//         fontSize: SIZES.fonts.medium,
//         fontWeight: SIZES.fontWeight.regular,
//         marginLeft: 10,
//     },
//     inputTitleSmartphoneLandscape: {
//         marginLeft: 15,
//     },
//     inputWrapper: {
//         width: '100%',
//         alignItems: 'center',
//     },
//     errorText: {
//         color: 'red',
//         fontSize: SIZES.fonts.small,
//         textAlign: 'center',
//         marginTop: 10,
//     },
//     checkboxContainer: {
//         marginLeft: 15,
//     },
//     buttonContainer: {
//         alignItems: 'center',
//         width: '100%',
//         marginBottom: 10,
//     },
// });

import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import ButtonLarge from '../../components/buttons/ButtonLarge';
import InputLogin from '../../components/InputLogin';
import Separator from '../../components/Separator';
import CheckBox from '../../components/CheckBox';
import { COLORS, SIZES } from '../../constants/style';
import { useDeviceType } from '../../hooks/useDeviceType';
import { SCREENS } from '../../constants/screens';

export default function Login({ onNavigate }) {

    const { isPortrait, isSmartphone, isTablet, isTabletPortrait, isSmartphoneLandscape, isTabletLandscape } = useDeviceType();
    const [isChecked, setIsChecked] = useState(false); 

    const handleLogin = () => {
        onNavigate(SCREENS.CHAT);
      };
    return (
        <View style={[
            styles.pageContainer,
            isTablet && styles.pageContainerTablet,
            isSmartphoneLandscape && styles.pageContainerSmartphoneLandscape
        ]}>

            <ScrollView>
            <View style={[styles.headerContainer, isSmartphoneLandscape && styles.headerContainerSmartphoneLandscape]}>
                <TouchableOpacity onPress={() => onNavigate(SCREENS.APP_MENU)}>
                    <Image source={require('../../assets/images/logo.png')} style={[styles.logo, isSmartphone && styles.logoSmartphone]} />
                </TouchableOpacity>
                
            </View>
            {isPortrait && (<Separator width={'100%'} />)}
                <View style={[
                    styles.loginContainer,
                    isTablet && styles.loginContainerTablet,
                    isSmartphone && styles.loginContainerSmartphone,
                    isSmartphoneLandscape && styles.loginContainerSmartphoneLandscape
                ]}>
                    <Text style={[
                        styles.title,
                        isTabletPortrait && styles.titleTabletPortrait,
                        isSmartphone && styles.titleSmartphone,
                        isSmartphoneLandscape && styles.titleSmartphoneLandscape
                    ]}>
                        Connexion
                    </Text>
                    <View style={styles.inputsContainer}>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputTitle, isSmartphoneLandscape && styles.inputTitleSmartphoneLandscape]}>Contract number</Text>
                            <View style={styles.inputWrapper}>
                                <InputLogin 
                                    placeholder="Enter your contract number"
                                    iconName="building-o"
                                    iconLibrary="FontAwesome"
                                />
                            </View>
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputTitle, isSmartphoneLandscape && styles.inputTitleSmartphoneLandscape]}>Login</Text>
                            <View style={styles.inputWrapper}>
                                <InputLogin 
                                    placeholder="Enter your login"
                                    iconName="person-outline"
                                />
                            </View>
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputTitle, isSmartphoneLandscape && styles.inputTitleSmartphoneLandscape]}>Password</Text>
                            <View style={styles.inputWrapper}>
                                <InputLogin 
                                    placeholder="Enter your password"
                                    secureTextEntry
                                    iconName="lock-closed-outline"
                                />
                            </View>
                        </View>
                        <View style={styles.checkboxContainer}>
                            <CheckBox 
                                checked={isChecked}
                                onPress={() => setIsChecked(!isChecked)}
                                label="Stay connected"
                            />
                        </View>
                        <View style={styles.buttonContainer}>
                            <ButtonLarge 
                                title="Connexion"
                                onPress={handleLogin}
                                width="94%"
                            />
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    pageContainer: {
        flex: 1,
        backgroundColor: COLORS.darkGray,
    },
    pageContainerTablet: {
        paddingHorizontal: '15%',
    },
    pageContainerSmartphoneLandscape: {
        paddingHorizontal: '12%',
    },
    headerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 10,
    },
    headerContainerSmartphoneLandscape: {
        paddingTop: 0,
    },
    logo: {
        width: 150,
        height: 50,
        resizeMode: 'contain',
    },
    logoSmartphone: {
        width: 120,
        height: 90,
        objectFit: 'contain',
        margin: -8,
    },
    loginContainer: {
        flex: 1,
        marginTop: 100,    
        backgroundColor: '#232424',
        margin: 20,
        padding: 20,
        borderRadius: SIZES.borderRadius.large,
    },
    loginContainerTablet: {
        margin: 40,
        padding: 30,
    },
    loginContainerSmartphone: {
        marginTop: 75,
        margin: 10,
        padding: 15,
        paddingVertical: 30,
    },
    loginContainerSmartphoneLandscape: {
        marginTop: 10,
    },
    title: {
        fontSize: SIZES.fonts.xLarge,
        fontWeight: SIZES.fontWeight.bold,
        color: COLORS.lightGray,
        marginBottom: 30,
    },
    titleTabletPortrait: {
        fontSize: SIZES.fonts.xXLarge,
    },
    titleSmartphone: {
        fontSize: SIZES.fonts.large,
        marginBottom: 35,
        alignSelf: 'center',
    },
    titleSmartphoneLandscape: {
        marginBottom: 15,
    },
    inputsContainer: {
        width: '100%',
        gap: 20,
    },
    inputGroup: {
        gap: 5,
    },
    inputTitle: {
        color: COLORS.lightGray,
        fontSize: SIZES.fonts.medium,
        fontWeight: SIZES.fontWeight.regular,
        marginLeft: 10,
    },
    inputTitleSmartphoneLandscape: {
        marginLeft: 15,
    },
    inputWrapper: {
        width: '100%',
        alignItems: 'center',
    },
    errorText: {
        color: 'red',
        fontSize: SIZES.fonts.small,
        textAlign: 'center',
        marginTop: 10,
    },
    checkboxContainer: {
        marginLeft: 15,
    },
    buttonContainer: {
        alignItems: 'center',
        width: '100%',
        marginBottom: 10,
    },
});