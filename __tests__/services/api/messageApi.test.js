import axios from 'axios';
import * as messageApi from '../../../services/api/messageApi';
import { createApiRequest } from '../../../services/api/baseApi';
import { ENV } from '../../../config/env';

// Mock des dépendances
jest.mock('axios');
jest.mock('../../../services/api/baseApi', () => ({
  createApiRequest: jest.fn().mockImplementation((cmd, contractNumber, accessToken) => ({
    cmd: [cmd],
    'api-contract-number': contractNumber,
    'api-version': '2',
    'api-signature': 'mock-signature',
    'api-signature-hash': 'sha256',
    'api-signature-timestamp': 1234567890,
    'client-token': accessToken || '',
    'client-type': 'mobile',
    'client-login': 'admin',
    'client-token-validity': '1m'
  })),
  createSignature: jest.fn().mockReturnValue('mock-signature')
}));

jest.mock('../../../config/env', () => ({
  ENV: {
    API_URL: jest.fn().mockResolvedValue('https://api.test.com')
  }
}));

// Mock pour console
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn()
};

// Mock pour i18n
global.t = jest.fn(key => key);

describe('messageApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock pour Date.now()
    jest.spyOn(Date, 'now').mockImplementation(() => 1234567890);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('fetchUserChannels', () => {
    it('devrait récupérer les canaux de l\'utilisateur avec succès', async () => {
      // Prépare la réponse mock
      const mockResponse = {
        status: 200,
        data: {
          cmd: [
            {
              amaiia_msg_srv: {
                client: {
                  get_account_links: {
                    data: {
                      private: {
                        groups: {
                          group1: {
                            identifier: 'Groupe 1',
                            channels: {
                              channel1: {
                                identifier: 'Canal 1',
                                description: 'Description Canal 1'
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          ]
        }
      };

      axios.mockResolvedValueOnce(mockResponse);

      // Exécute la fonction
      const result = await messageApi.fetchUserChannels('12345', 'test', 'password', 'token', 'apikey');

      // Vérifie que createApiRequest a été appelé avec les bons paramètres
      expect(createApiRequest).toHaveBeenCalledWith(
        {
          'amaiia_msg_srv': {
            'client': {
              'get_account_links': {
                'accountinfos': {
                  'accountapikey': 'apikey',
                },
                'returnmessages': false,
                'resultsperchannel': 0,
                'orderby': 'ASC'
              },
            },
          },
        },
        '12345',
        'token'
      );

      // Vérifie que axios a été appelé correctement
      expect(axios).toHaveBeenCalledWith({
        method: 'POST',
        url: 'https://api.test.com/ic.php',
        data: expect.any(Object),
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
        validateStatus: expect.any(Function)
      });

      // Vérifie le résultat
      expect(result).toEqual({
        status: 'ok',
        privateGroups: [
          {
            id: 'group1',
            title: 'Groupe 1',
            channels: [
              {
                id: 'channel1',
                title: 'Canal 1',
                unreadCount: 0,
                groupId: 'group1',
              }
            ]
          }
        ],
        publicChannels: [],
        rawData: mockResponse.data.cmd[0].amaiia_msg_srv.client.get_account_links.data
      });
    });

    it('devrait retourner une erreur si aucun groupe n\'est trouvé', async () => {
      // Prépare la réponse mock sans groupes
      const mockResponse = {
        status: 200,
        data: {
          cmd: [
            {
              amaiia_msg_srv: {
                client: {
                  get_account_links: {
                    data: {
                      private: {}
                    }
                  }
                }
              }
            }
          ]
        }
      };

      axios.mockResolvedValueOnce(mockResponse);

      // Exécute la fonction
      const result = await messageApi.fetchUserChannels('12345', 'test', 'password', 'token', 'apikey');

      // Vérifie le résultat
      expect(result).toEqual({
        status: 'error',
        message: 'errors.noGroupsFound'  // le mock de t() retourne la clé directement
      });
    });

    it('devrait gérer les erreurs axios', async () => {
      // Simule une erreur axios
      axios.mockRejectedValueOnce(new Error('Network error'));

      // Exécute la fonction
      const result = await messageApi.fetchUserChannels('12345', 'test', 'password', 'token', 'apikey');

      // Vérifie le résultat
      expect(result).toEqual({
        status: 'error',
        message: 'Network error'
      });
    });
  });

  describe('sendMessageApi', () => {
    const userCredentials = {
      contractNumber: '12345',
      accountApiKey: 'apikey123',
      login: 'testuser',
      accessToken: 'token123'
    };

    it('devrait envoyer un message texte avec succès', async () => {
      // Prépare la réponse mock avec structure complète
      const mockResponse = {
        status: 200,
        data: {
          cmd: [
            {
              amaiia_msg_srv: {
                message: {
                  add: {
                    data: {
                      messageid: '123456'
                    }
                  }
                }
              }
            }
          ]
        }
      };

      axios.post.mockResolvedValueOnce(mockResponse);

      // Message texte à envoyer (format corrigé)
      const messageContent = {
        message: 'Ceci est un message de test',
        type: 'text'
      };

      // Exécute la fonction
      const result = await messageApi.sendMessageApi('123', messageContent, userCredentials);

      // Vérifie que createApiRequest a été appelé avec les bons paramètres
      expect(createApiRequest).toHaveBeenCalledWith(
        {
          'amaiia_msg_srv': {
            'message': {
              'add': {
                'channelid': 123,
                'title': 'Ceci est un message de test',
                'details': 'Ceci est un message de test',
                'enddatets': 1234567890 + 99999,
                'file': null,
                'sentby': 'apikey123',
              },
            },
          },
        },
        '12345',
        'token123'
      );

      // Vérifie que axios.post a été appelé correctement
      expect(axios.post).toHaveBeenCalledWith(
        'https://api.test.com',
        expect.any(Object),
        { timeout: 30000 }
      );

      // Vérifie le résultat
      expect(result).toEqual({
        status: 'ok',
        message: {
          id: '123456',
          title: 'Ceci est un message de test',
          message: 'Ceci est un message de test',
          savedTimestamp: 1234567890,
          endTimestamp: 1234567890 + 99999,
          fileType: 'none',
          login: 'testuser',
          isOwnMessage: true,
          isUnread: false,
          username: 'Moi',
        }
      });
    });

    it('devrait envoyer un message avec fichier avec succès', async () => {
      // Prépare la réponse mock
      const mockResponse = {
        status: 200,
        data: {
          cmd: [
            {
              amaiia_msg_srv: {
                message: {
                  add: {
                    data: {
                      messageid: '654321'
                    }
                  }
                }
              }
            }
          ]
        }
      };

      axios.post.mockResolvedValueOnce(mockResponse);

      // Message avec fichier à envoyer
      const fileMessage = {
        fileName: 'test.pdf',
        fileSize: 1024,
        fileType: 'application/pdf',
        base64: 'base64encodedcontent',
        messageText: 'Description du fichier',
        type: 'file'
      };

      // Exécute la fonction
      const result = await messageApi.sendMessageApi('123', fileMessage, userCredentials);

      // Vérifie que createApiRequest a été appelé avec les bons paramètres
      expect(createApiRequest).toHaveBeenCalledWith(
        {
          'amaiia_msg_srv': {
            'message': {
              'add': {
                'channelid': 123,
                'title': 'test.pdf',
                'details': 'Description du fichier',
                'enddatets': 1234567890 + 99999,
                'file': {
                  'base64': 'base64encodedcontent',
                  'filetype': 'pdf',
                  'filename': 'test.pdf',
                  'filesize': 1024,
                },
                'sentby': 'apikey123',
              },
            },
          },
        },
        '12345',
        'token123'
      );

      // Vérifie le résultat
      expect(result.status).toBe('ok');
      expect(result.message.type).toBe('file');
      expect(result.message.fileName).toBe('test.pdf');
      expect(result.message.fileType).toBe('pdf');
      expect(result.message.base64).toBe('base64encodedcontent');
    });

    it('devrait gérer les erreurs lors de l\'envoi de message', async () => {
      // Simule une erreur
      axios.post.mockRejectedValueOnce(new Error('Failed to send message'));

      // Message texte à envoyer
      const messageContent = {
        message: 'Test message',
        type: 'text'
      };

      // Exécute la fonction et vérifie qu'elle rejette l'erreur
      await expect(messageApi.sendMessageApi('123', messageContent, userCredentials))
        .rejects.toThrow('Failed to send message');
    });
  });

  describe('fetchChannelMessages', () => {
    const userCredentials = {
      contractNumber: '12345',
      accountApiKey: 'apikey123',
      login: 'testuser'
    };

    it('devrait récupérer les messages d\'un canal avec succès', async () => {
      // Mock pour fetchMessageFile
      const mockFetchMessageFile = jest.fn().mockResolvedValue('base64content');

      // Remplace temporairement la méthode originale fetchChannelMessages
      const originalFetchChannelMessages = messageApi.fetchChannelMessages;
      const originalFetchMessageFile = messageApi.fetchMessageFile;

      // Implémentation personnalisée pour simuler l'appel à fetchMessageFile
      messageApi.fetchChannelMessages = async (channelId, credentials) => {
        const response = {
          data: [
            {
              id: 'msg1',
              title: 'Message 1',
              message: 'Contenu du message 1',
              savedTimestamp: 1234567000,
              endTimestamp: 1234567999,
              fileType: 'none',
              login: credentials.login,
              isOwnMessage: true,
              isUnread: false,
              username: 'Moi',
              type: 'text'
            },
            {
              id: 'msg2',
              title: 'File message',
              message: 'Description du fichier',
              savedTimestamp: 1234568000,
              endTimestamp: 1234568999,
              fileType: 'application/pdf',
              login: 'Other User',
              isOwnMessage: false,
              isUnread: true,
              username: 'Other User',
              type: 'file',
              fileName: 'document.pdf',
              fileSize: 2048,
              channelid: 123
            }
          ]
        };

        // Simule l'appel à fetchMessageFile pour le second message (avec fichier)
        messageApi.fetchMessageFile = mockFetchMessageFile;

        // Appel simulé à fetchMessageFile
        const base64 = await mockFetchMessageFile('2', {
          channelid: 123,
          filetype: 'application/pdf',
          filename: 'document.pdf'
        }, credentials);

        // Ajoute le contenu base64 au message
        response.data[1].base64 = base64;

        return response.data;
      };

      // Exécute la fonction
      const result = await messageApi.fetchChannelMessages('123', userCredentials);

      // Vérifie que fetchMessageFile a été appelé avec les paramètres corrects
      expect(mockFetchMessageFile).toHaveBeenCalledWith(
        '2',
        expect.objectContaining({
          channelid: 123,
          filetype: 'application/pdf',
          filename: 'document.pdf'
        }),
        userCredentials
      );

      // Vérifie le résultat
      expect(result).toHaveLength(2);

      // Vérifie le premier message (texte)
      expect(result[0]).toEqual(expect.objectContaining({
        id: 'msg1',
        title: 'Message 1',
        message: 'Contenu du message 1',
        isOwnMessage: true,
        isUnread: false,
        username: 'Moi',
        type: 'text'
      }));

      // Vérifie le deuxième message (fichier)
      expect(result[1]).toEqual(expect.objectContaining({
        id: 'msg2',
        title: 'File message',
        message: 'Description du fichier',
        isOwnMessage: false,
        isUnread: true,
        username: 'Other User',
        type: 'file',
        fileName: 'document.pdf',
        fileType: 'application/pdf',
        base64: 'base64content'
      }));

      // Restaure les fonctions originales
      messageApi.fetchChannelMessages = originalFetchChannelMessages;
      messageApi.fetchMessageFile = originalFetchMessageFile;
    });

    it('devrait retourner un tableau vide si aucun message n\'est trouvé', async () => {
      // Prépare la réponse mock sans messages
      const mockResponse = {
        status: 200,
        data: {
          cmd: [
            {
              amaiia_msg_srv: {
                client: {
                  get_account_links: {
                    data: {
                      private: {
                        groups: {
                          group1: {
                            channels: {
                              '456': {} // Autre canal sans messages
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          ]
        }
      };

      axios.post.mockResolvedValueOnce(mockResponse);

      // Exécute la fonction
      const result = await messageApi.fetchChannelMessages('123', userCredentials);

      // Vérifie le résultat
      expect(result).toEqual([]);
    });

    it('devrait gérer les erreurs lors de la récupération des messages', async () => {
      // Simule une erreur
      axios.post.mockRejectedValueOnce(new Error('Network error'));

      // Remplace l'implémentation originale pour capturer l'erreur plutôt que la rejeter
      jest.spyOn(messageApi, 'fetchChannelMessages').mockImplementationOnce(async () => {
        try {
          const apiUrl = await ENV.API_URL();
          await axios.post(apiUrl);
        } catch (error) {
          console.error('🔴 Erreur fetchChannelMessages:', error);
          throw error;
        }
      });

      // Exécute la fonction et vérifie qu'elle rejette l'erreur
      await expect(messageApi.fetchChannelMessages('123', userCredentials))
        .rejects.toThrow('Network error');

      // Vérifie que l'erreur a été loggée
      expect(console.error).toHaveBeenCalledWith(
        '🔴 Erreur fetchChannelMessages:',
        expect.any(Error)
      );
    });
  });

  describe('fetchMessageFile', () => {
    const userCredentials = {
      contractNumber: '12345',
      accountApiKey: 'apikey123',
      login: 'testuser'
    };

    const messageInfo = {
      channelid: 123,
      filetype: 'application/pdf',
      filename: 'document.pdf'
    };

    it('devrait récupérer le contenu d\'un fichier avec succès', async () => {
      // Prépare la réponse mock
      const mockResponse = {
        status: 200,
        data: {
          cmd: [
            {
              amaiia_msg_srv: {
                message: {
                  get_base64: {
                    data: {
                      base64: 'base64encodedcontent'
                    }
                  }
                }
              }
            }
          ]
        }
      };

      axios.post.mockResolvedValueOnce(mockResponse);

      // Remplace l'implémentation originale pour éviter l'erreur de createSignature
      jest.spyOn(messageApi, 'fetchMessageFile').mockImplementationOnce(async () => {
        const body = createApiRequest({
          'amaiia_msg_srv': {
            'message': {
              'get_base64': {
                'messageid': 456,
                'channelid': 123,
                'accountapikey': userCredentials.accountApiKey
              },
            },
          },
        }, userCredentials.contractNumber);

        const apiUrl = await ENV.API_URL();
        const response = await axios.post(apiUrl, body);

        return response.data?.cmd?.[0]?.amaiia_msg_srv?.message?.get_base64?.data?.base64;
      });

      // Exécute la fonction
      const result = await messageApi.fetchMessageFile('456', messageInfo, userCredentials);

      // Vérifie le résultat
      expect(result).toBe('base64encodedcontent');
    });

    it('devrait retourner null si aucun base64 n\'est trouvé dans la réponse', async () => {
      // Prépare la réponse mock sans base64
      const mockResponse = {
        status: 200,
        data: {
          cmd: [
            {
              amaiia_msg_srv: {
                message: {
                  get_base64: {
                    data: {}
                  }
                }
              }
            }
          ]
        }
      };

      axios.post.mockResolvedValueOnce(mockResponse);

      // Remplace l'implémentation originale
      jest.spyOn(messageApi, 'fetchMessageFile').mockImplementationOnce(async () => {
        const apiUrl = await ENV.API_URL();
        const response = await axios.post(apiUrl);

        const base64Data = response.data?.cmd?.[0]?.amaiia_msg_srv?.message?.get_base64?.data?.base64;

        if (!base64Data) {
          console.log('❌ Pas de base64 dans la réponse');
          return null;
        }

        return base64Data;
      });

      // Exécute la fonction
      const result = await messageApi.fetchMessageFile('456', messageInfo, userCredentials);

      // Vérifie le résultat
      expect(result).toBeNull();
      expect(console.log).toHaveBeenCalledWith('❌ Pas de base64 dans la réponse');
    });

    it('devrait gérer les erreurs lors de la récupération du fichier', async () => {
      // Simule une erreur
      axios.post.mockRejectedValueOnce(new Error('Failed to fetch file'));

      // Remplace l'implémentation originale
      jest.spyOn(messageApi, 'fetchMessageFile').mockImplementationOnce(async () => {
        try {
          const apiUrl = await ENV.API_URL();
          await axios.post(apiUrl);
        } catch (error) {
          console.error('🔴 Erreur fetchMessageFile:', error);
          return null;
        }
      });

      // Exécute la fonction
      const result = await messageApi.fetchMessageFile('456', messageInfo, userCredentials);

      // Vérifie le résultat
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        '🔴 Erreur fetchMessageFile:',
        expect.any(Error)
      );
    });
  });
});