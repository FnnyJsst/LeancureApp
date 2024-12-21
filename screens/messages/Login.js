// import { useState } from 'react';
// import { ScrollView, View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
// import axios from 'axios';
// import ButtonLarge from '../../components/buttons/ButtonLarge';
// import InputLogin from '../../components/InputLogin';
//import Separator from '../../components/Separator';
// import { COLORS, SIZES } from '../../assets/styles/constants';
// import { useDeviceType } from '../../hooks/useDeviceType';

// export default function Login({ setCurrentScreen }) {
//     const { isPortrait, isSmartphone, isTablet, isTabletPortrait, isSmartphoneLandscape, isTabletLandscape } = useDeviceType();
    
//     const [contractNumber, setContractNumber] = useState('');
//     const [login, setLogin] = useState('');
//     const [password, setPassword] = useState('');
//     const [error, setError] = useState('');
//     const [isLoading, setIsLoading] = useState(false);

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
//                 setCurrentScreen('Chat');
//             } else {
//                 setError('Incorrect credentials');
//             }
//         } catch (error) {
//             console.error('Server connection error:', error);
//             setError('Server connection error');
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     return (
//     <View style={[
//         styles.pageContainer,
//         isTablet && styles.pageContainerTablet,
//         isSmartphoneLandscape && styles.pageContainerSmartphoneLandscape
//     ]}>
//         <View style={[styles.headerContainer, isSmartphoneLandscape && styles.headerContainerSmartphoneLandscape]}>
//             <TouchableOpacity onPress={() => setCurrentScreen('AppMenu')}>
//             <Image source={require('../../assets/images/logo.png')} style={[styles.logo, isSmartphone && styles.logoSmartphone]} />
//             </TouchableOpacity>
            
//         </View>
//         {isPortrait && (<Separator width={'100%'} />)}
//             <ScrollView>
//                  <View style={[
//                     styles.loginContainer,
//                     isTablet && styles.loginContainerTablet,
//                     isSmartphone && styles.loginContainerSmartphone,
//                     isSmartphoneLandscape && styles.loginContainerSmartphoneLandscape
//                 ]}>
//          
                    
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
//                          <Text style={[styles.inputTitle, isSmartphoneLandscape && styles.inputTitleSmartphoneLandscape]}>Login</Text>
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
//                           <Text style={[styles.inputTitle, isSmartphoneLandscape && styles.inputTitleSmartphoneLandscape]}>Password</Text>
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

//                         <ButtonLarge 
//                             title={isLoading ? "Connexion en cours..." : "Connexion"}
//                             onPress={handleLogin}
//                             disabled={isLoading}
//                         />
//                     </View>
//                 </View>
//             </ScrollView>
//         </View>
//     );
// }

import { ScrollView, View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import ButtonLarge from '../../components/buttons/ButtonLarge';
import InputLogin from '../../components/InputLogin';
import Separator from '../../components/Separator';
import { COLORS, SIZES } from '../../assets/styles/constants';
import { useDeviceType } from '../../hooks/useDeviceType';
export default function Login({ setCurrentScreen }) {
    const { isPortrait, isSmartphone, isTablet, isTabletPortrait, isSmartphoneLandscape, isTabletLandscape } = useDeviceType();
    // Version simplifiée pour le développement
    const handleLogin = () => {
        setCurrentScreen('Chat');
    };
    return (
        <View style={[
            styles.pageContainer,
            isTablet && styles.pageContainerTablet,
            isSmartphoneLandscape && styles.pageContainerSmartphoneLandscape
        ]}>

            <ScrollView>
            <View style={[styles.headerContainer, isSmartphoneLandscape && styles.headerContainerSmartphoneLandscape]}>
                <TouchableOpacity onPress={() => setCurrentScreen('AppMenu')}>
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
        fontSize: SIZES.fonts.xxLarge,
    },
    titleSmartphone: {
        fontSize: SIZES.fonts.large,
        marginBottom: 20,
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
        fontWeight: SIZES.fontWeight.medium,
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
    buttonContainer: {
        alignItems: 'center',
        width: '100%',
        marginBottom: 10,
    },
});