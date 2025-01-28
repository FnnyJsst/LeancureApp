import CryptoJS from 'crypto-js';

/**
 * Transform a password into a SHA-256 hash
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
