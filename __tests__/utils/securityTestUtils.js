import * as SecureStore from 'expo-secure-store';

/**
 * Utilitaires pour les tests de sécurité
 */

/**
 * Configure l'environnement de test avec des credentials
 * @param {Object} customCredentials - Credentials personnalisés (optionnel)
 */
export const setupSecurityTestEnvironment = async (customCredentials = null) => {
  const credentials = customCredentials || global.testSecurityEnvironment.mockCredentials;
  await SecureStore.setItemAsync('userCredentials', JSON.stringify(credentials));
  await SecureStore.setItemAsync('userRights', global.testSecurityEnvironment.mockUserRights);
};

/**
 * Nettoie l'environnement de test
 */
export const cleanupSecurityTestEnvironment = async () => {
  await SecureStore.deleteItemAsync('userCredentials');
  await SecureStore.deleteItemAsync('userRights');
  await SecureStore.deleteItemAsync('savedLoginInfo');
  global.testSecurityEnvironment.mockSecureStore = {};
};

/**
 * Vérifie si les données sensibles sont correctement chiffrées
 * @param {string} key - Clé de stockage
 * @returns {boolean} - True si les données sont chiffrées
 */
export const isDataEncrypted = (key) => {
  const data = global.testSecurityEnvironment.mockSecureStore[key];
  return data && data.startsWith('encrypted_');
};

/**
 * Simule une tentative de connexion
 * @param {Object} credentials - Credentials à utiliser
 * @returns {Promise<Object>} - Résultat de la connexion
 */
export const simulateLogin = async (credentials) => {
  const { contractNumber, login, password } = credentials;
  return await global.loginApi(contractNumber, login, password);
};

/**
 * Vérifie si les tokens sont correctement stockés
 * @returns {Promise<boolean>} - True si les tokens sont valides
 */
export const areTokensValid = async () => {
  const credentials = await SecureStore.getItemAsync('userCredentials');
  if (!credentials) return false;
  
  const { accessToken, refreshToken } = JSON.parse(credentials);
  return accessToken && refreshToken;
}; 