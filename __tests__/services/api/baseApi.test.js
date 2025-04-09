import { createApiRequest } from '../../../services/api/baseApi';
import CryptoJS from 'crypto-js';

// Mock CryptoJS HmacSHA256
jest.mock('crypto-js', () => ({
  HmacSHA256: jest.fn(() => ({
    toString: jest.fn(() => 'mocked-hash-value')
  })),
  enc: {
    Hex: 'hex'
  }
}));

describe('baseApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Date.now() pour avoir un timestamp constant
    jest.spyOn(Date, 'now').mockImplementation(() => 1234567890);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createApiRequest', () => {
    it('devrait créer une requête API avec les paramètres de base', () => {
      const cmdPayload = {
        test: {
          action: {
            param: 'value'
          }
        }
      };
      const contractNumber = '12345';

      const result = createApiRequest(cmdPayload, contractNumber);

      // Vérifie les champs de base de la requête
      expect(result['api-version']).toBe('2');
      expect(result['api-contract-number']).toBe(contractNumber);
      expect(result['api-signature']).toBe('mocked-hash-value');
      expect(result['api-signature-hash']).toBe('sha256');
      expect(result['api-signature-timestamp']).toBe(1234567890);
      expect(result['client-type']).toBe('mobile');
      expect(result['client-login']).toBe('admin');
      expect(result['client-token-validity']).toBe('1m');

      // Vérifie que cmd est un tableau contenant le payload
      expect(Array.isArray(result.cmd)).toBe(true);
      expect(result.cmd).toHaveLength(1);
      expect(result.cmd[0]).toEqual(cmdPayload);

      // Vérifie que CryptoJS a été appelé avec les bons paramètres
      expect(CryptoJS.HmacSHA256).toHaveBeenCalledWith(
        'test/action/param/1234567890/',
        contractNumber
      );
    });

    it('devrait avoir un client-token vide par défaut', () => {
      const cmdPayload = { test: { action: { param: 'value' } } };
      const contractNumber = '12345';

      const result = createApiRequest(cmdPayload, contractNumber);

      expect(result['client-token']).toBe('');
    });

    it('devrait gérer correctement un objet de commande simple', () => {
      const cmdPayload = {
        test: {
          action: {
            param: 'value'
          }
        }
      };
      const contractNumber = '12345';

      const result = createApiRequest(cmdPayload, contractNumber);

      expect(result.cmd[0]).toEqual(cmdPayload);
    });
  });
});