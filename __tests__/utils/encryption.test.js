import CryptoJS from 'crypto-js';
import * as SecureStore from 'expo-secure-store';
import { hashPassword, verifyPassword, secureStore } from '../../utils/encryption';

// Mock de expo-secure-store
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock de console.error pour capturer les logs
const mockConsoleError = jest.fn();
console.error = mockConsoleError;

// Configuration pour les tests
global.__DEV__ = true;

describe('Fonctions de cryptage', () => {
  beforeEach(() => {
    // Réinitialiser les mocks avant chaque test
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('devrait générer un hash correct pour un mot de passe', () => {
      const password = 'motDePasse123';
      const hash = hashPassword(password);

      expect(hash).toBeTruthy();
      expect(typeof hash).toBe('string');

      const expectedHash = CryptoJS.SHA256(password).toString();
      expect(hash).toBe(expectedHash);
    });

    it('devrait générer des hashs différents pour des mots de passe différents', () => {
      const password1 = 'motDePasse123';
      const password2 = 'motDePasse124';

      const hash1 = hashPassword(password1);
      const hash2 = hashPassword(password2);

      expect(hash1).not.toBe(hash2);
    });

    it('devrait générer le même hash pour le même mot de passe', () => {
      const password = 'motDePasse123';

      const hash1 = hashPassword(password);
      const hash2 = hashPassword(password);

      expect(hash1).toBe(hash2);
    });

    it('devrait gérer les erreurs lors du hachage', () => {
      // Simuler une erreur dans CryptoJS.SHA256
      const originalSHA256 = CryptoJS.SHA256;
      CryptoJS.SHA256 = jest.fn().mockImplementation(() => {
        throw new Error('Erreur de hachage');
      });

      const result = hashPassword('test');

      expect(mockConsoleError).toHaveBeenCalledWith(
        '[Encryption] Error while hashing the password:',
        expect.any(Error)
      );
      expect(result).toBeUndefined();

      // Restaurer l'implémentation originale
      CryptoJS.SHA256 = originalSHA256;
    });
  });

  describe('verifyPassword', () => {
    it('devrait valider un mot de passe correct', () => {
      const password = 'motDePasse123';
      const hashedPassword = CryptoJS.SHA256(password).toString();

      const isValid = verifyPassword(password, hashedPassword);

      expect(isValid).toBe(true);
    });

    it('devrait rejeter un mot de passe incorrect', () => {
      const correctPassword = 'motDePasse123';
      const incorrectPassword = 'motDePasseIncorrect';
      const hashedPassword = CryptoJS.SHA256(correctPassword).toString();

      const isValid = verifyPassword(incorrectPassword, hashedPassword);

      expect(isValid).toBe(false);
    });

    it('devrait gérer les erreurs lors de la vérification', () => {
      // Simuler une erreur dans CryptoJS.SHA256
      const originalSHA256 = CryptoJS.SHA256;
      CryptoJS.SHA256 = jest.fn().mockImplementation(() => {
        throw new Error('Erreur de hachage');
      });

      const result = verifyPassword('test', 'hashedPassword');

      expect(mockConsoleError).toHaveBeenCalledWith(
        '[Encryption] Error while verifying the password:',
        expect.any(Error)
      );
      expect(result).toBeUndefined();

      // Restaurer l'implémentation originale
      CryptoJS.SHA256 = originalSHA256;
    });
  });

  describe('secureStore', () => {
    describe('saveCredentials', () => {
      it("devrait sauvegarder les informations d'identification", async () => {
        const credentials = {
          username: 'utilisateur',
          password: 'hashedPassword123'
        };

        await secureStore.saveCredentials(credentials);

        expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
          'userCredentials',
          JSON.stringify(credentials)
        );
      });

      it("devrait gérer les erreurs lors de la sauvegarde", async () => {
        SecureStore.setItemAsync.mockRejectedValue(new Error('Erreur de sauvegarde'));

        const credentials = {
          username: 'utilisateur',
          password: 'hashedPassword123'
        };

        await expect(secureStore.saveCredentials(credentials)).rejects.toThrow('Failed to save credentials');

        expect(mockConsoleError).toHaveBeenCalledWith(
          '[Encryption] Error while saving the login info:',
          expect.any(Error)
        );
      });
    });

    describe('getCredentials', () => {
      it("devrait récupérer les informations d'identification stockées", async () => {
        const credentials = {
          username: 'utilisateur',
          password: 'hashedPassword123'
        };

        SecureStore.getItemAsync.mockResolvedValue(JSON.stringify(credentials));

        const result = await secureStore.getCredentials();

        expect(SecureStore.getItemAsync).toHaveBeenCalledWith('userCredentials');
        expect(result).toEqual(credentials);
      });

      it("devrait renvoyer null si aucune information n'est trouvée", async () => {
        SecureStore.getItemAsync.mockResolvedValue(null);

        const result = await secureStore.getCredentials();

        expect(result).toBeNull();
      });

      it('devrait gérer les erreurs lors de la récupération', async () => {
        SecureStore.getItemAsync.mockRejectedValue(new Error('Erreur de récupération'));

        const result = await secureStore.getCredentials();

        expect(result).toBeNull();
        expect(mockConsoleError).toHaveBeenCalledWith(
          '[Encryption] Error while getting the credentials:',
          expect.any(Error)
        );
      });
    });

    describe('deleteCredentials', () => {
      it("devrait supprimer les informations d'identification", async () => {
        await secureStore.deleteCredentials();

        expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('userCredentials');
      });

      it('devrait gérer les erreurs lors de la suppression', async () => {
        SecureStore.deleteItemAsync.mockRejectedValue(new Error('Erreur de suppression'));

        await secureStore.deleteCredentials();

        expect(mockConsoleError).toHaveBeenCalledWith(
          '[Encryption] Error while deleting the credentials:',
          expect.any(Error)
        );
      });
    });
  });
});