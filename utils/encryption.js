import CryptoJS from 'crypto-js';
import * as SecureStore from 'expo-secure-store';

/**
 * Hash a password using SHA-256
 * @param {string} password - The password to hash
 * @returns {string} - The SHA-256 hash of the password
 */
export const hashPassword = (password) => {
    try {
        // Create the SHA-256 hash
        const hashedPassword = CryptoJS.SHA256(password).toString();
        return hashedPassword;
    } catch (error) {
        console.error('Error hashing the password:', error);
        throw new Error('Failed to hash the password');
    }
};

/**
 * Verify if a password matches a hash
 * @param {string} password - The password to verify
 * @param {string} hashedPassword - The stored hash
 * @returns {boolean} - True if the password matches
 */
export const verifyPassword = (password, hashedPassword) => {
    try {
        const hashToVerify = CryptoJS.SHA256(password).toString();
        return hashToVerify === hashedPassword;
    } catch (error) {
        console.error('Error verifying the password:', error);
        throw new Error('Failed to verify the password');
    }
};

/**
 * Secure storage for credentials
 * @param {object} credentials - The credentials to store
 */
export const secureStore = {
    async saveCredentials(credentials) {
        await SecureStore.setItemAsync('userCredentials', JSON.stringify(credentials));
    },

    async getCredentials() {
        try {
            const credentials = await SecureStore.getItemAsync('userCredentials');
            return credentials ? JSON.parse(credentials) : null;
        } catch (error) {
            console.error('Error retrieving credentials:', error);
            return null;
        }
    },

    async deleteCredentials() {
        try {
            await SecureStore.deleteItemAsync('userCredentials');
        } catch (error) {
            console.error('Error deleting credentials:', error);
        }
    }
};
