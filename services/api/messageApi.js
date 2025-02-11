import axios from 'axios';
import { ENV } from '../../config/env';
import { createApiRequest, createSignature } from './baseApi';
import { secureStore } from '../../utils/encryption';

const API_URL = ENV.API_URL;

/**
 * @function fetchUserChannels
 * @description Fetches the user's channels
 * @param {string} contractNumber - The contract number
 * @param {string} login - The login
 * @param {string} password - The password
 * @param {string} accessToken - The access token
 * @returns {Promise<Object>} - The user's channels
 */
export const fetchUserChannels = async (contractNumber, login, password, accessToken = '', accountApiKey = '') => {
  console.log('🔢 Contract Number:', contractNumber);
  
  try {
    const timestamp = Date.now();
    const saltPath = `amaiia_msg_srv/client/get_account_links/${timestamp}/`;
    
    const body = createApiRequest({
      "amaiia_msg_srv": {
        "client": {
          "get_account_links": {
            "accountinfos": {
              "accountapikey": accountApiKey
            }
          }
        }
      }
    }, contractNumber, accessToken);

    console.log('📦 Requête complète:', JSON.stringify(body, null, 2));

    const response = await axios.post(API_URL, body);

    if (response.status === 200) {
      console.log('🔍 Réponse complète:', JSON.stringify(response.data, null, 2));
      const data = response.data?.cmd?.[0]?.amaiia_msg_srv?.client?.get_account_links?.data;
      if (!data) {
        console.error('❌ Structure de données invalide:', response.data);
        return {
          status: 'error',
          error: 'Invalid data structure'
        };
      }

      const publicChannels = data.public === "No channel" ? [] : Object.entries(data.public || {}).map(([id, channel]) => ({
        id,
        title: channel.identifier || 'Channel without title',
        description: channel.description || '',
        messages: channel.messages || []
      }));

      const privateGroups = data.private?.groups ? Object.entries(data.private.groups).map(([id, group]) => ({
        id,
        title: group.identifier || 'Group without title',
        description: group.description || '',
        rights: group.rights,
        channels: group.channels ? Object.entries(group.channels).map(([channelId, channel]) => ({
          id: channelId,
          title: channel.identifier || 'Channel without title',
          description: channel.description || '',
          messages: channel.messages || []
        })) : []
      })) : [];

      console.log('📊 Données formatées - Public:', publicChannels);
      console.log('📊 Données formatées - Groups:', privateGroups);

      return {
        status: 'ok',
        publicChannels,
        privateGroups
      };
    } else {
      return {
        status: 'error',
        error: 'Error while fetching data'
      };
    }
  } catch (error) {
    return {
      status: 'error',
      error: error.message || 'Error while fetching data'
    };
  }
};

/**
 * @function formatMessages
 * @description Formats the messages data to be used in the UI
 * @param {Object} messages - The messages
 * @returns {Array} - The formatted messages
 */
const formatMessages = (messages) => {
  // If messages is not found, return an empty array
  if (!messages) return [];
  // Return the formatted messages
  return Object.entries(messages).map(([id, msg]) => ({
    id,
    title: msg.details || '',
    message: msg.details || '',
    savedTimestamp: msg.savedts,
    endTimestamp: msg.enddatets,
    fileType: msg.filetype,
    isOwnMessage: msg.isOwnMessage || false
  }));
};

/**
 * @function sendMessageApi
 * @description Sends a message to the API
 * @param {string} channelId - The channel ID
 * @param {string} messageContent - The message content
 * @param {Object} userCredentials - The user credentials
 * @returns {Promise<Object>} - The message data
 */
export const sendMessageApi = async (channelId, messageContent, userCredentials) => {
  try {
    const timestamp = Date.now();
    
    // Check if messageContent is a file or a simple text
    const isFile = typeof messageContent === 'object' && messageContent.base64;
    
    const data = createApiRequest({
      "msg_srv": {
        "client": {
          "add_msg": {
            "accountinfos": {
              "login": userCredentials.login,
              "password": userCredentials.password,
              "email": "",
              "nom": "",
              "prenom": ""
            },
            "msg-msgapikey": ENV.MSG_API_KEY,
            "msg-contract-number": userCredentials.contractNumber,
            "channelid": parseInt(channelId),

            "title": isFile ? messageContent.name : messageContent.substring(0, 50),
            "details": isFile ? "" : messageContent,
            "enddatets": timestamp + 99999,
            ...(isFile && {
              "filetype": messageContent.type.split('/')[1],
              "img": {
                "base64": messageContent.base64,
                "type": messageContent.type.split('/')[1],
                "real_name": messageContent.name
              }
            })
          }
        }
      }
    }, userCredentials.contractNumber);

    const response = await axios({
      method: 'POST',
      url: API_URL,
      data: data,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return {
      status: 'ok',
      message: messageContent,
      timestamp: timestamp
    };

  } catch (error) {
    throw error;
  }
};

/**
 * @function fetchChannelMessages
 * @description Fetches the messages of a channel
 * @param {string} channelId - The channel ID
 * @param {Object} userCredentials - The user credentials
 * @returns {Promise<Array>} - The messages
 */
export const fetchChannelMessages = async (channelId, userCredentials) => {
  try {
    const timestamp = Date.now();
    const saltPath = `amaiia_msg_srv/client/get_account_links/${timestamp}/`;
    
    const body = createApiRequest({
      "amaiia_msg_srv": {
        "client": {
          "get_account_links": {
            "accountinfos": {
              "accountapikey": userCredentials.accountApiKey
            }
          }
        }
      }
    }, userCredentials.contractNumber);

    const response = await axios.post(API_URL, body);

    if (response.status === 200) {
      const data = response.data?.cmd?.[0]?.amaiia_msg_srv?.client?.get_account_links?.data;
      let channelMessages = [];

      // Recherche dans les groupes privés
      if (data?.private?.groups) {
        Object.values(data.private.groups).forEach(group => {
          if (group.channels) {
            Object.entries(group.channels).forEach(([chId, channel]) => {
              if (chId === channelId && channel.messages) {
                channelMessages = Object.entries(channel.messages).map(([id, msg]) => ({
                  id,
                  title: msg.title || '',
                  message: msg.message || msg.title || '',
                  savedTimestamp: msg.savedts,
                  endTimestamp: msg.enddatets,
                  fileType: msg.filetype || 'none',
                  login: msg.login || userCredentials.login,
                  isOwnMessage: msg.login === userCredentials.login,
                  isUnread: msg.status === 'unread'
                }));
              }
            });
          }
        });
      }

      return channelMessages;
    }
    return [];
  } catch (error) {
    console.error('🔴 Erreur fetchChannelMessages:', error);
    return [];
  }
};

// const credentials = await secureStore.getCredentials();
// const channelsResponse = await fetchUserChannels(contractNumber, login, password, '', credentials.accountApiKey);

