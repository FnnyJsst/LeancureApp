import { createApiRequest, cleanApiResponse, apiClient } from './baseApi';
import { ENV } from '../../config/env';

export const fetchUserChannels = async (contractNumber, login, password) => {
  try {
    const cmd = {
      msg_srv: {
        client: {
          get_account_links: {
            accountinfos: {
              login: login,
              password: password,
              email: "",
              nom: "",
              prenom: ""
            },
            "msg-msgapikey": ENV.MSG_API_KEY,
            "msg-contract-number": contractNumber
          }
        }
      }
    };

    const response = await apiClient.post('', createApiRequest(cmd));
    const cleanData = cleanApiResponse(response);
    
    console.log('🔍 Clean Data:', JSON.stringify(cleanData, null, 2));
    
    // Extraction des données depuis la nouvelle structure
    const msgSrvData = cleanData?.cmd?.[0]?.msg_srv;
    
    if (!msgSrvData) {
      throw new Error('Invalid response structure');
    }

    const publicChannels = [];
    const privateGroups = [];

    // Traitement des données
    if (Array.isArray(msgSrvData)) {
      msgSrvData.forEach(item => {
        if (item.client?.[0]?.get_account_links) {
          const links = item.client[0].get_account_links;
          
          // Traitement des canaux publics
          if (links.public) {
            Object.entries(links.public).forEach(([id, channel]) => {
              publicChannels.push({
                id,
                title: channel.identifier || id,
                description: channel.description || '',
                isPrivate: false
              });
            });
          }
          
          // Traitement des groupes privés
          if (links.private?.groups) {
            Object.entries(links.private.groups).forEach(([groupId, group]) => {
              privateGroups.push({
                id: groupId,
                title: group.identifier || groupId,
                description: group.description || '',
                isPrivate: true
              });
            });
          }
        }
      });
    }

    console.log('📊 Canaux extraits:', { publicChannels, privateGroups });

    return {
      status: 'ok',
      publicChannels,
      privateGroups
    };
  } catch (error) {
    console.error('🔴 Error fetching channels:', error);
    return {
      status: 'error',
      publicChannels: [],
      privateGroups: [],
      error: error.message
    };
  }
};

export const fetchChannelMessages = async (channelId, userCredentials) => {
  try {
    const cmd = {
      msg_srv: {
        client: {
          get_account_links: {
            accountinfos: {
              login: userCredentials.login,
              password: userCredentials.password,
              email: "",
              nom: "",
              prenom: ""
            },
            "msg-msgapikey": ENV.MSG_API_KEY,
            "msg-contract-number": "202501121"
          }
        }
      }
    };

    const response = await apiClient.post('', createApiRequest(cmd));
    const cleanData = cleanApiResponse(response);
    // ... reste du code de traitement des messages
  } catch (error) {
    throw error;
  }
};

