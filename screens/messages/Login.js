import { ScrollView,View, Text, StyleSheet } from 'react-native';
import ButtonLarge from '../../components/buttons/ButtonLarge';
import InputLogin from '../../components/InputLogin';
import { COLORS, SIZES } from '../../assets/styles/constants';
import { useDeviceType } from '../../hooks/useDeviceType';

export default function Login({ setCurrentScreen }) {

    const { isSmartphone, isTablet, isTabletPortrait, isSmartphoneLandscape, isTabletLandscape } = useDeviceType();

    return (
        <View style={[styles.pageContainer, 
            isTablet && styles.pageContainerTablet,
            isSmartphoneLandscape && styles.pageContainerSmartphoneLandscape]}>
            <ScrollView>
                <View style={[styles.loginContainer, 
                    isTabletPortrait && styles.loginContainerTabletPortrait,
                    isTabletLandscape && styles.loginContainerTabletLandscape,
                    isSmartphone && styles.loginContainerSmartphone,
                    isSmartphoneLandscape && styles.loginContainerSmartphoneLandscape]}>
                    <Text style={[styles.title, 
                        isTabletPortrait && styles.titleTabletPortrait,
                        isSmartphone && styles.titleSmartphone,
                        isSmartphoneLandscape && styles.titleSmartphoneLandscape]}>Connexion</Text>
                    
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
                    <Text style={[styles.passwordText, 
                        isTabletPortrait && styles.passwordTextTabletPortrait,
                        isSmartphone && styles.passwordTextSmartphone]}>Forgot your password?</Text>
                </View>
                <View style={styles.contactContainer}>
                    <Text style={[
                        styles.noAccountText,
                        isSmartphone && styles.textSmartphone
                    ]}>Don't have an account? </Text>
                    <Text style={[
                        styles.contactText,
                        isSmartphone && styles.textSmartphone
                    ]}>Contact us</Text>
                </View>
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    pageContainer: {
        paddingHorizontal: 20,
    },
    pageContainerTablet : {
        padding: 40,
        paddingTop: 30,
    },
    pageContainerSmartphoneLandscape: {
        paddingHorizontal: 60,
    },
    loginContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.buttonGray,
        marginTop: 80,
        marginBottom: 50,
        paddingVertical: 20,
    },
    loginContainerTabletPortrait: {
        height: 750,
        marginTop: 100,
    },
    loginContainerTabletLandscape: {
        height: 600,
        marginHorizontal: 100,
        marginTop: 10,
        paddingVertical: 0,
    },
    loginContainerSmartphone: {
        height: 550,
        marginBottom: 20,
    },
    loginContainerSmartphoneLandscape: {
        marginTop: 20,
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
        marginVertical: 40,
    },
    titleTabletPortrait: {
        marginTop: 0,
    },
    titleSmartphone: {
        fontSize: SIZES.fonts.xLarge,
    },
    titleSmartphoneLandscape: {
        marginTop: 20,
        marginBottom: 20,
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
        marginVertical: 20,
    },
    passwordTextTabletPortrait: {
        marginTop: 30,
        marginBottom: 20,
    },
    passwordTextSmartphone: {
        fontSize: SIZES.fonts.small,
        marginBottom: 20,
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
    },
    textSmartphone: {
        fontSize: SIZES.fonts.small,
    },
})