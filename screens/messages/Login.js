import { ScrollView,View, Text, StyleSheet } from 'react-native';
import ButtonLarge from '../../components/buttons/ButtonLarge';
import InputLogin from '../../components/InputLogin';
import ChatScreen from '../messages/ChatScreen';
import { COLORS, SIZES } from '../../assets/styles/constants';

export default function Login({ setCurrentScreen }) {

    return (
        <View style={styles.pageContainer}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.loginContainer}>
                    <Text style={styles.title}>Connexion</Text>
                    
                    <View style={styles.inputsContainer}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputTitle}>Contract number</Text>
                            <View style={styles.inputWrapper}>
                                <InputLogin 
                                    placeholder="Enter your contract number"
                                    iconName="building-o"
                                    iconLibrary="FontAwesome"
                                />
                            </View>
                        </View>
                        
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputTitle}>Email</Text>
                            <View style={styles.inputWrapper}>
                                <InputLogin 
                                    placeholder="Enter your email"
                                    iconName="person-outline"
                                />
                            </View>
                        </View>
                        
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputTitle}>Password</Text>
                            <View style={styles.inputWrapper}>
                                <InputLogin 
                                    placeholder="Enter your password"
                                    iconName="lock-closed-outline"
                                    iconLibrary="Ionicons"
                                />
                            </View>
                        </View>
                    </View>

                    <ButtonLarge title="Connexion" onPress={() => setCurrentScreen('Chat')} />
                    <Text style={styles.passwordText}>Forgot your password?</Text>
                </View>
                <View style={styles.contactContainer}>
                    <Text style={styles.noAccountText}>Don't have an account? </Text>
                    <Text style={styles.contactText}>Contact us</Text>
                </View>
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    pageContainer: {
        // flex: 1,
        padding: 20,
    },
    loginContainer: {
        // flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.buttonGray,
        marginTop: 80,
        marginBottom: 50,
        paddingVertical: 20,
    },
    inputsContainer: {
        width: '90%',
        marginBottom: 20,
        gap: 10,
    },
    inputGroup: {
        width: '100%',
    },
    inputWrapper: {
        alignItems: 'center',
    },
    title: {
        fontSize: SIZES.fonts.xXLarge,
        fontWeight: SIZES.fontWeight.medium,
        color: "white",
        marginTop: 50,
        marginBottom: 50,
    },
    inputTitle: {
        fontSize: SIZES.fonts.medium,
        color: COLORS.lightGray,
        marginBottom: 10,
        alignSelf: 'flex-start', 
        marginLeft: 20,
    },
    passwordText: {
        fontSize: SIZES.fonts.medium,
        fontWeight: SIZES.fontWeight.regular,
        color: COLORS.orange,
        marginTop: 15,
        marginBottom: 30,
    },
    contactContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
    },
    noAccountText: {
      color: COLORS.lightGray,
      fontSize: SIZES.fonts.medium,
    },
    contactText: {
        color: COLORS.orange,
        fontSize: SIZES.fonts.medium,
        textAlign: 'center',
    }
})