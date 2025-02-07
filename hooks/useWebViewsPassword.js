import { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import { SCREENS } from '../constants/screens';

/**
 * @function useWebViewsPassword
 * @description This hook is used to manage the password used to access the webviews settings
 * @param {function} navigate - The navigation function used to access to the settings screen
 * @returns {object} - The password state and functions
 */
export function useWebViewsPassword(navigate) {

  const [password, setPassword] = useState(null);
  const [isPasswordRequired, setIsPasswordRequired] = useState(false);
  const [isPasswordModalVisible, setPasswordModalVisible] = useState(false);
  const [passwordCheckModalVisible, setPasswordCheckModalVisible] = useState(false);

    /**
   * @function openPasswordModal 
   * @description Opens the password modal
   */
  const openPasswordModal = () => setPasswordModalVisible(true);
  
  /**
   * @function closePasswordModal
   * @description Closes the password modal
   */
  const closePasswordModal = () => setPasswordModalVisible(false);

  /**
   * @function handlePasswordSubmit
   * @description Handles the submission of the password
   * @param {string} enteredPassword - The password entered by the user
   */
  const handlePasswordSubmit = (enteredPassword) => {
    setPassword(enteredPassword);
    setIsPasswordRequired(true);
    savePassword({

      password: enteredPassword,
      isRequired: true
    });
    closePasswordModal();
  };

  /**
   * @function savePassword
   * @description Saves the password in the SecureStore
   * @param {object} passwordData - The password data to save
   */
  const savePassword = async (passwordData) => {
    try {
      if (passwordData.password === null) {

        await SecureStore.deleteItemAsync('password');
        await SecureStore.setItemAsync('isPasswordRequired', 'false');
      } else {
        await SecureStore.setItemAsync('password', passwordData.password);
        await SecureStore.setItemAsync('isPasswordRequired', JSON.stringify(passwordData.isRequired));
      }
    } catch (error) {
      console.error('Failed to save password', error);
    }
  };

  /**
   * @function loadPassword
   * @description Loads the password from the SecureStore
   */
  const loadPassword = async () => {
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
      console.error('Failed to load password', error);
    }
  };

  /**
   * @function handlePasswordCheck
   * @description Handles the check of the password
   * @param {string} enteredPassword - The password entered by the user
   */
  const handlePasswordCheck = (enteredPassword) => {
    if (enteredPassword === password) {
      setPasswordCheckModalVisible(false);
      navigate(SCREENS.SETTINGS);
    } else {
      Alert.alert('Incorrect password');
    }
  };

  /**
   * @function disablePassword
   * @description Disables the password
   */
  const disablePassword = () => {
    setPassword(null);
    setIsPasswordRequired(false);
    savePassword({

      password: null,
      isRequired: false
    });
  };

  /**
   * @function useEffect
   * @description Loads the password from the SecureStore when the component is mounted
   */
  useEffect(() => {
    loadPassword();
  }, []);


  return {
    openPasswordModal,
    closePasswordModal,
    password,
    setPassword,
    isPasswordRequired,
    setIsPasswordRequired,
    isPasswordModalVisible,
    setPasswordModalVisible,
    passwordCheckModalVisible,
    setPasswordCheckModalVisible,
    handlePasswordSubmit,
    handlePasswordCheck,
    disablePassword,
    loadPassword
  };
}
