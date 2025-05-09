import axios from 'axios';
import * as messageApi from '../../../services/api/messageApi';
import { fetchUserChannels, sendMessageApi } from '../../../services/api/messageApi';

// Mocks existants
jest.mock('axios');
jest.mock('../../../services/api/baseApi');
jest.mock('../../../config/env');

// Nouveau mock pour CustomAlert
jest.mock('../../../components/modals/webviews/CustomAlert', () => ({
  show: jest.fn()
}));

// Mock pour console.error
const mockConsoleError = jest.fn();
console.error = mockConsoleError;

// Mock pour i18n
jest.mock('i18next', () => ({
  use: jest.fn().mockReturnThis(),
  init: jest.fn(),
  t: jest.fn(key => key),
  default: {
    use: jest.fn().mockReturnThis(),
    init: jest.fn()
  }
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key }),
  initReactI18next: {
    type: '3rdParty',
    init: () => {}
  }
}));

jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'android',
  select: jest.fn()
}));

const createMockChannel = (id, title, description) => ({
  identifier: title,
  description
});

const createMockGroup = (identifier, channels) => ({
  identifier,
  channels
});

const createMockResponse = (groups) => ({
  data: {
    private: {
      groups
    }
  }
});

const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

// Mock ENV
jest.mock('../../../config/env', () => ({
  ENV: {
    API_URL: jest.fn().mockResolvedValue('http://test-api.com/ic.php')
  }
}));


describe('messageApi', () => {
  let mockConsoleError;

  beforeEach(() => {
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockConsoleError.mockRestore();
  });

  describe('fetchUserChannels', () => {
    const mockCredentials = {
      contractNumber: '12345',
      login: 'testuser',
      password: 'testpass',
      accessToken: 'test-token',
      accountApiKey: 'test-api-key'
    };

    it('devrait récupérer les canaux de l\'utilisateur avec succès', async () => {
      const mockAxiosResponse = {
        status: 200,
        data: {
          cmd: [{
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
          }]
        }
      };

      axios.mockResolvedValueOnce(mockAxiosResponse);

      const result = await fetchUserChannels(
        mockCredentials.contractNumber,
        mockCredentials.login,
        mockCredentials.password,
        mockCredentials.accessToken,
        mockCredentials.accountApiKey
      );

      expect(axios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: 'http://test-api.com/ic.php',
          timeout: 10000,
          validateStatus: expect.any(Function)
        })
      );

      expect(result).toEqual({
        status: 'ok',
        privateGroups: [{
          id: 'group1',
          title: 'Groupe 1',
          channels: [{
            id: 'channel1',
            groupId: 'group1',
            title: 'Canal 1',
            unreadCount: 0
          }]
        }],
        publicChannels: [],
        rawData: mockAxiosResponse.data.cmd[0].amaiia_msg_srv.client.get_account_links.data
      });
    });

    it('devrait retourner un résultat vide si aucun groupe n\'est trouvé', async () => {
      const mockAxiosResponse = {
        status: 200,
        data: {
          cmd: [{
            amaiia_msg_srv: {
              client: {
                get_account_links: {
                  data: {
                    private: {
                      groups: {}
                    }
                  }
                }
              }
            }
          }]
        }
      };

      axios.mockResolvedValueOnce(mockAxiosResponse);

      const result = await fetchUserChannels(
        mockCredentials.contractNumber,
        mockCredentials.login,
        mockCredentials.password,
        mockCredentials.accessToken,
        mockCredentials.accountApiKey
      );

      expect(result).toEqual({
        status: 'ok',
        privateGroups: [],
        publicChannels: [],
        rawData: {
          private: {
            groups: {}
          }
        }
      });
    });

    it('devrait gérer les erreurs axios', async () => {
      const error = new Error('Network error');
      axios.mockRejectedValueOnce(error);

      const result = await fetchUserChannels(
        mockCredentials.contractNumber,
        mockCredentials.login,
        mockCredentials.password,
        mockCredentials.accessToken,
        mockCredentials.accountApiKey
      );

      expect(mockConsoleError).toHaveBeenCalledWith(
        '[MessageApi] Error while fetching the channels:',
        error
      );

      expect(result).toEqual({
        status: 'error',
        message: error.message
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
      const mockResponse = {
        data: {
          cmd: [{
              amaiia_msg_srv: {
                message: {
                  add: {
                  status: 'ok'
                }
              }
            }
          }]
        }
      };

      axios.post.mockResolvedValueOnce(mockResponse);

      const messageContent = {
        message: 'Test message'
      };

      const result = await messageApi.sendMessageApi('123', messageContent, userCredentials);

      expect(result).toMatchObject({
        status: 'ok',
        message: {
          message: 'Test message',
          isOwnMessage: true,
          username: 'messages.me'
        }
      });
    });

    it('devrait gérer les erreurs lors de l\'envoi du message', async () => {
      const mockResponse = {
        data: {
          cmd: [{
              amaiia_msg_srv: {
                message: {
                  add: {
                  status: 'error'
                }
              }
            }
          }]
        }
      };

      axios.post.mockResolvedValueOnce(mockResponse);

      const messageContent = {
        message: 'Test message'
      };

      await expect(messageApi.sendMessageApi('123', messageContent, userCredentials))
        .rejects
        .toThrow('error.messageNotSaved');

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Response data:',
        expect.any(String)
      );
    });
  });
});