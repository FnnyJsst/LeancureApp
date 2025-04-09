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
  }))
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
        url: 'https://api.test.com',
        data: expect.any(Object),
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
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
        message: 'No groups found'
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
      login: 'testuser'
    };

    it('devrait envoyer un message texte avec succès', async () => {
      // Prépare la réponse mock
      axios.mockResolvedValueOnce({ status: 200 });

      // Message texte à envoyer
      const messageContent = 'Ceci est un message de test';

      // Exécute la fonction
      const result = await messageApi.sendMessageApi('123', messageContent, userCredentials);

      // Vérifie que createApiRequest a été appelé avec les bons paramètres
      expect(createApiRequest).toHaveBeenCalledWith(
        {
          'amaiia_msg_srv': {
            'client': {
              'add_msg': {
                'channelid': 123,
                'title': messageContent,
                'details': messageContent,
                'enddatets': 1234567890 + 99999,
                'file': null,
                'sentby': 'apikey123',
              },
            },
          },
        },
        '12345'
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
          id: 1234567890,
          title: messageContent,
          message: messageContent,
          savedTimestamp: 1234567890,
          endTimestamp: 1234567890 + 99999,
          fileType: 'none',
          login: 'testuser',
          isOwnMessage: true,
          isUnread: false,
          username: 'Me',
        }
      });
    });

    it('devrait envoyer un message avec fichier avec succès', async () => {
      // Prépare la réponse mock
      axios.mockResolvedValueOnce({ status: 200 });

      // Message avec fichier à envoyer
      const fileMessage = {
        fileName: 'test.pdf',
        fileSize: 1024,
        fileType: 'application/pdf',
        base64: 'base64encodedcontent'
      };

      // Exécute la fonction
      const result = await messageApi.sendMessageApi('123', fileMessage, userCredentials);

      // Vérifie que createApiRequest a été appelé avec les bons paramètres
      expect(createApiRequest).toHaveBeenCalledWith(
        {
          'amaiia_msg_srv': {
            'client': {
              'add_msg': {
                'channelid': 123,
                'title': 'test.pdf',
                'details': fileMessage,
                'enddatets': 1234567890 + 99999,
                'file': {
                  'base64': 'base64encodedcontent',
                  'filetype': 'application/pdf',
                  'filename': 'test.pdf',
                  'filesize': 1024,
                },
                'sentby': 'apikey123',
              },
            },
          },
        },
        '12345'
      );

      // Vérifie le résultat
      expect(result.status).toBe('ok');
      expect(result.message.type).toBe('file');
      expect(result.message.fileName).toBe('test.pdf');
      expect(result.message.fileType).toBe('application/pdf');
      expect(result.message.base64).toBe('base64encodedcontent');
    });

    it('devrait gérer les erreurs lors de l\'envoi de message', async () => {
      // Simule une erreur
      axios.mockRejectedValueOnce(new Error('Failed to send message'));

      // Exécute la fonction et vérifie qu'elle rejette l'erreur
      await expect(messageApi.sendMessageApi('123', 'test', userCredentials))
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
      jest.spyOn(messageApi, 'fetchMessageFile').mockResolvedValue('base64content');

      // Prépare la réponse mock avec un message sans fichier et un avec fichier
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
                              '123': {
                                messages: {
                                  'msg1': {
                                    messageid: '1',
                                    title: 'Message 1',
                                    message: 'Contenu du message 1',
                                    savedts: 1234567000,
                                    enddatets: 1234567999,
                                    accountapikey: 'apikey123',
                                    status: 'read',
                                    firstname: 'Test',
                                    lastname: 'User',
                                    filetype: 'none'
                                  },
                                  'msg2': {
                                    messageid: '2',
                                    title: 'File message',
                                    message: 'Description du fichier',
                                    savedts: 1234568000,
                                    enddatets: 1234568999,
                                    accountapikey: 'other_apikey',
                                    status: 'unread',
                                    firstname: 'Other',
                                    lastname: 'User',
                                    filetype: 'application/pdf',
                                    filename: 'document.pdf',
                                    filesize: 2048
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
              }
            }
          ]
        }
      };

      axios.mockResolvedValueOnce(mockResponse);

      // Exécute la fonction
      const result = await messageApi.fetchChannelMessages('123', userCredentials);

      // Vérifie que createApiRequest a été appelé avec les bons paramètres
      expect(createApiRequest).toHaveBeenCalledWith(
        {
          'amaiia_msg_srv': {
            'client': {
              'get_account_links': {
                'accountinfos': {
                  'accountapikey': 'apikey123',
                },
              },
            },
          },
        },
        '12345'
      );

      // Vérifie que fetchMessageFile a été appelé pour le message avec fichier
      expect(messageApi.fetchMessageFile).toHaveBeenCalledWith(
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

      axios.mockResolvedValueOnce(mockResponse);

      // Exécute la fonction
      const result = await messageApi.fetchChannelMessages('123', userCredentials);

      // Vérifie le résultat
      expect(result).toEqual([]);
    });

    it('devrait gérer les erreurs lors de la récupération des messages', async () => {
      // Simule une erreur
      axios.mockRejectedValueOnce(new Error('Network error'));

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
                client: {
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

      axios.mockResolvedValueOnce(mockResponse);

      // Exécute la fonction
      const result = await messageApi.fetchMessageFile('456', messageInfo, userCredentials);

      // Vérifie que createApiRequest a été appelé avec les bons paramètres
      expect(createApiRequest).toHaveBeenCalledWith(
        {
          'amaiia_msg_srv': {
            'client': {
              'get_base64': {
                'messageid': 456,
                'channelid': 123,
              },
            },
          },
        },
        '12345'
      );

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
                client: {
                  get_base64: {
                    data: {}
                  }
                }
              }
            }
          ]
        }
      };

      axios.mockResolvedValueOnce(mockResponse);

      // Exécute la fonction
      const result = await messageApi.fetchMessageFile('456', messageInfo, userCredentials);

      // Vérifie le résultat
      expect(result).toBeNull();
      expect(console.log).toHaveBeenCalledWith('❌ Pas de base64 dans la réponse');
    });

    it('devrait gérer les erreurs lors de la récupération du fichier', async () => {
      // Simule une erreur
      axios.mockRejectedValueOnce(new Error('Failed to fetch file'));

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