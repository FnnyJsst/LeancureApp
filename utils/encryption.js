import CryptoJS from 'crypto-js';
import * as SecureStore from 'expo-secure-store';
import { handleError, ErrorType } from './errorHandling';

/**
 * @function hashPassword
 * @description Hash a password using SHA-256
 * @param {string} password - The password to hash
 * @returns {string} - The SHA-256 hash of the password
 */

export const hashPassword = (password) => {
    try {
        // Create the SHA-256 hash
        const hashedPassword = CryptoJS.SHA256(password).toString();
        return hashedPassword;
    } catch (error) {
        handleError(error, 'error.hashPasswordError', {
            type: ErrorType.SYSTEM,
            silent: false
        });
    }
};

/**
 * @function verifyPassword
 * @description Verify if a password matches a hash
 * @param {string} password - The password to verify
 * @param {string} hashedPassword - The stored hash
 * @returns {boolean} - True if the password matches
 */

export const verifyPassword = (password, hashedPassword) => {
    try {
        const hashToVerify = CryptoJS.SHA256(password).toString();
        return hashToVerify === hashedPassword;
    } catch (error) {
        handleError(error, 'error.verifyPassword', {
            type: ErrorType.SYSTEM,
            silent: false
        });
    }
};

/**
 * @function secureStore
 * @description Secure storage for credentials
 * @param {object} credentials - The credentials to store
 * @returns {object} - The credentials
 */

export const secureStore = {
    async saveCredentials(credentials) {
        try {
            await SecureStore.setItemAsync('userCredentials', JSON.stringify(credentials));
        } catch (error) {
            handleError(error, 'error.errorSavingLoginInfo', {
                type: ErrorType.SYSTEM,
                silent: false
            });
            throw new Error('Failed to save credentials');
        }
    },

    /**
     * @function getCredentials
     * @description Get credentials from secure storage
     * @returns {object} - The credentials
     */
    async getCredentials() {
        try {
            // Get the credentials from the secure storage
            const credentials = await SecureStore.getItemAsync('userCredentials');
            // Return the credentials and parse them
            return credentials ? JSON.parse(credentials) : null;
        } catch (error) {
            handleError(error, 'encryption.secureStore.getCredentials', {
                type: ErrorType.SYSTEM,
                silent: false
            });
            return null;
        }
    },

    /**
     * @function deleteCredentials
     * @description Delete credentials from secure storage
     */
    async deleteCredentials() {
        try {
            await SecureStore.deleteItemAsync('userCredentials');
        } catch (error) {
            handleError(error, 'encryption.secureStore.deleteCredentials', {
                type: ErrorType.SYSTEM,
                silent: false
            });
        }
    },
};
