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

    // console.log('📦 Requête complète:', JSON.stringify(body, null, 2));

    const response = await axios.post(API_URL, body);

    if (response.status === 200) {
      console.log('🔍 Réponse complète:', JSON.stringify(response.data, null, 2));
      const data = response.data?.cmd?.[0]?.amaiia_msg_srv?.client?.get_account_links?.data;
      if (!data) {
        // console.error('❌ Structure de données invalide:', response.data);
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

      // console.log('📊 Données formatées - Public:', publicChannels);
      // console.log('📊 Données formatées - Groups:', privateGroups);

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
 * @function sendMessageApi
 * @description Sends a message to the API
 * @param {string} channelId - The channel ID
 * @param {string} messageContent - The message content
 * @param {Object} userCredentials - The user credentials
 * @returns {Promise<Object>} - The message data
 */
export const sendMessageApi = async (channelId, messageContent, userCredentials) => {
  try {
    console.log('📤 Envoi message - Credentials:', {
      accountApiKey: userCredentials.accountApiKey,
      login: userCredentials.login
    });

    const timestamp = Date.now();
    const saltPath = `amaiia_msg_srv/client/add_msg/${timestamp}/`;
    
    const isFile = typeof messageContent === 'object' && messageContent.base64;
    const messageTitle = isFile ? 
      messageContent.name : 
      (typeof messageContent === 'string' ? messageContent.substring(0, 50) : '');
    const messageDetails = typeof messageContent === 'string' ? messageContent : '';
    
    const body = createApiRequest({
      "amaiia_msg_srv": {
        "client": {
          "add_msg": {
            "channelid": parseInt(channelId),
            "title": messageTitle,
            "details": messageDetails,
            "enddatets": timestamp + 99999,
            ...(isFile && {
              "file": {
                "base64": messageContent.base64,
                "filetype": messageContent.type,
                "filename": messageContent.name
              }
            }),
            "sentby": userCredentials.accountApiKey
          }
        }
      }
    }, userCredentials.contractNumber);

    const response = await axios.post(API_URL, body);
    console.log('📤 Réponse API sendMessage:', JSON.stringify(response.data, null, 2));

    if (response.data?.cmd?.[0]?.amaiia_msg_srv?.client?.add_msg?.status === 'ok') {
      const messageResponse = {
        status: 'ok',
        message: {
          id: timestamp.toString(),
          title: messageTitle,
          message: messageDetails,
          savedTimestamp: timestamp,
          endTimestamp: timestamp + 99999,
          fileType: isFile ? messageContent.type : 'none',
          login: userCredentials.login,
          sentby: userCredentials.accountApiKey,
          isOwnMessage: true,
          isUnread: false,
          username: 'Moi'
        }
      };
      console.log('📤 Message envoyé avec succès:', messageResponse);
      return messageResponse;
    }
    
    throw new Error('Message non enregistré');
  } catch (error) {
    console.error('🔴 Erreur sendMessageApi:', error);
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
    console.log('📥 Récupération messages - Credentials:', {
      accountApiKey: userCredentials.accountApiKey,
      login: userCredentials.login
    });

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

      if (data?.private?.groups) {
        Object.values(data.private.groups).forEach(group => {
          if (group.channels) {
            Object.entries(group.channels).forEach(([chId, channel]) => {
              if (chId === channelId && channel.messages) {
                channelMessages = Object.entries(channel.messages).map(([id, msg]) => {
                  console.log('📥 Message reçu:', {
                    msgAccountApiKey: msg.accountapikey,
                    userAccountApiKey: userCredentials.accountApiKey,
                    isMatch: msg.accountapikey === userCredentials.accountApiKey
                  });
                  
                  const isOwnMessage = msg.accountapikey === userCredentials.accountApiKey;
                  return {
                    id,
                    title: msg.title || '',
                    message: msg.message || msg.title || '',
                    savedTimestamp: msg.savedts,
                    endTimestamp: msg.enddatets,
                    fileType: msg.filetype || 'none',
                    login: isOwnMessage ? userCredentials.login : `${msg.firstname} ${msg.lastname}`,
                    isOwnMessage,
                    isUnread: msg.status === 'unread',
                    username: isOwnMessage ? 'Moi' : `${msg.firstname} ${msg.lastname}`
                  };
                });
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
    throw error;
  }
};

// const credentials = await secureStore.getCredentials();
// const channelsResponse = await fetchUserChannels(contractNumber, login, password, '', credentials.accountApiKey);