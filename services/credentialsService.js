import * as SecureStore from 'expo-secure-store';

const CREDENTIALS_KEY = 'userCredentials';

export const credentialsService = {
  async save(credentials) {
    try {
      await SecureStore.setItemAsync(CREDENTIALS_KEY, JSON.stringify(credentials));
    } catch (error) {
      console.error('Error saving credentials:', error);
      throw error;
    }
  },

  async get() {
    try {
      const credentials = await SecureStore.getItemAsync(CREDENTIALS_KEY);
      return credentials ? JSON.parse(credentials) : null;
    } catch (error) {
      console.error('Error getting credentials:', error);
      throw error;
    }
  },

  async remove() {
    try {
      await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
    } catch (error) {
      console.error('Error removing credentials:', error);
      throw error;
    }
  }
}; 