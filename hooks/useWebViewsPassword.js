import { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import { SCREENS } from '../constants/screens';
import { useTranslation } from 'react-i18next';

/**
 * @function useWebviewsPassword
 * @description This hook is used to manage the password used to access the webviews settings
 * @param {function} navigate - The navigation function used to access to the settings screen
 * @returns {object} - The password state and functions
 */
export const useWebviewsPassword = (navigate) => {

  // We get the translation function
  const { t } = useTranslation();

  // We define the password state and functions
  const [password, setPassword] = useState(null);
  const [isPasswordRequired, setIsPasswordRequired] = useState(false);
  const [isPasswordDefineModalVisible, setPasswordDefineModalVisible] = useState(false);
  const [passwordCheckModalVisible, setPasswordCheckModalVisible] = useState(false);

    /**
   * @function openPasswordDefineModal
   * @description Opens the modals used to set the password
   */
  const openPasswordDefineModal = () => setPasswordDefineModalVisible(true);

  /**
   * @function closePasswordDefineModal
   * @description Closes the modals used to set the password
   */
  const closePasswordDefineModal = () => setPasswordDefineModalVisible(false);

  /**
   * @function handlePasswordSubmit
   * @description Handles the submission of the password in the modals used to set the password
   * @param {string} enteredPassword - The password entered by the user
   */
  const handlePasswordSubmit = (enteredPassword) => {
    // We save the password and the isPasswordRequired state in the SecureStore
    setPassword(enteredPassword);
    setIsPasswordRequired(true);
    savePasswordInSecureStore({

      password: enteredPassword,
      isRequired: true,
    });
    // We close the modal
    closePasswordDefineModal();
  };

  /**
   * @function savePasswordInSecureStore
   * @description Saves the password chosen by the user in the SecureStore
   * @param {object} passwordData - The password data to save
   */
  const savePasswordInSecureStore = async (passwordData) => {
    try {
      // If the password is null, we delete the password and the isPasswordRequired state in the SecureStore
      if (passwordData.password === null) {

        await SecureStore.deleteItemAsync('password');
        await SecureStore.setItemAsync('isPasswordRequired', 'false');
      } else {
        await SecureStore.setItemAsync('password', passwordData.password);
        await SecureStore.setItemAsync('isPasswordRequired', JSON.stringify(passwordData.isRequired));
      }
    } catch (error) {
      console.error('[useWebviewsPassword] Error while saving the password in the SecureStore:', error);
    }
  };

  /**
   * @function loadPasswordFromSecureStore
   * @description Loads the password from the SecureStore
   */
  const loadPasswordFromSecureStore = async () => {
    try {
      const storedPassword = await SecureStore.getItemAsync('password');

      const storedIsRequired = await SecureStore.getItemAsync('isPasswordRequired');

      if (storedPassword) {
        setPassword(storedPassword);
      }
      if (storedIsRequired !== null) {
        setIsPasswordRequired(JSON.parse(storedIsRequired));
      }
    } catch (error) {
      console.error(t('errors.errorLoadingPassword'), error);

      // If the error is related to the decryption, we reset the data
      if (error.message.includes('Could not decrypt')) {
        try {
          // Delete the corrupted data
          await SecureStore.deleteItemAsync('password');
          await SecureStore.deleteItemAsync('isPasswordRequired');

          // Reset the state
          setPassword(null);
          setIsPasswordRequired(false);
        } catch (cleanupError) {
          console.error('[useWebviewsPassword] Error while cleaning the password:', cleanupError);
        }
      }
    }
  };

  /**
   * @function handlePasswordCheck
   * @description Handles the check of the password when the user wants to access the settings
   * @param {string} enteredPassword - The password entered by the user
   */
  const handlePasswordCheck = (inputPassword) => {
    if (inputPassword === password) {
      setPasswordCheckModalVisible(false);
      navigate(SCREENS.SETTINGS);
    } else {
      Alert.alert(t('errors.incorrectPassword'));
    }
  };

  // Disable the password
  const disablePassword = () => {
    setPassword(null);
    setIsPasswordRequired(false);
    savePasswordInSecureStore({

      password: null,
      isRequired: false,
    });
  };

  // Loads the password from the SecureStore when the component is mounted
  useEffect(() => {
    loadPasswordFromSecureStore();
  }, []);


  return {
    openPasswordDefineModal,
    closePasswordDefineModal,
    password,
    setPassword,
    isPasswordRequired,
    setIsPasswordRequired,
    isPasswordDefineModalVisible,
    setPasswordDefineModalVisible,
    passwordCheckModalVisible,
    setPasswordCheckModalVisible,
    handlePasswordSubmit,
    handlePasswordCheck,
    disablePassword,
    loadPasswordFromSecureStore,
  };
}
