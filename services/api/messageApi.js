import axios from 'axios';
import { ENV } from '../../config/env';
import { createApiRequest, createSignature } from './baseApi';
import { secureStore } from '../../utils/encryption';
import CryptoJS from 'crypto-js';

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
      // console.log('🔍 Réponse complète:', JSON.stringify(response.data, null, 2));
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
    const timestamp = Date.now();
    const saltPath = `amaiia_msg_srv/client/add_msg/${timestamp}/`;
    
    const isFile = typeof messageContent === 'object';
    const messageTitle = isFile ? messageContent.fileName : messageContent.substring(0, 50);

    const body = createApiRequest({
      "amaiia_msg_srv": {
        "client": {
          "add_msg": {
            "channelid": parseInt(channelId),
            "title": messageTitle,
            "details": messageContent,
            "enddatets": timestamp + 99999,
            "file": isFile ? {
              "base64": messageContent.base64,
              "filetype": messageContent.fileType,
              "filename": messageContent.fileName,
              "filesize": messageContent.fileSize
            } : null,
            "sentby": userCredentials.accountApiKey
          }
        }
      }
    }, userCredentials.contractNumber);

    console.log('📤 Requête envoyée:', {
      channelId,
      title: messageTitle,
      details: typeof messageContent === 'string' ? messageContent : messageContent.fileName,
      isFile
    });

    const response = await axios.post(API_URL, body, {
      timeout: 30000 // 30 secondes max
    });
    
    if (response.status === 200) {
      return {
        status: 'ok',
        message: {
          id: timestamp,
          title: messageTitle,
          message: messageContent,
          savedTimestamp: timestamp,
          endTimestamp: timestamp + 99999,
          fileType: isFile ? messageContent.fileType : 'none',
          login: userCredentials.login,
          isOwnMessage: true,
          isUnread: false,
          username: 'Me',
          ...(isFile && {
            type: 'file',
            fileName: messageContent.fileName,
            fileSize: messageContent.fileSize,
            fileType: messageContent.fileType,
            base64: messageContent.base64
          })
        }
      };
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
    // console.log('📥 Récupération messages - Credentials:', {
    //   accountApiKey: userCredentials.accountApiKey,
    //   login: userCredentials.login
    // });

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
    // console.log('📥 Structure complète des messages:', JSON.stringify(response.data?.cmd?.[0]?.amaiia_msg_srv?.client?.get_account_links?.data?.private?.groups, null, 2));


    if (response.status === 200) {
      const data = response.data?.cmd?.[0]?.amaiia_msg_srv?.client?.get_account_links?.data;
      let channelMessages = [];

      if (data?.private?.groups) {
        for (const group of Object.values(data.private.groups)) {
          if (group.channels) {
            for (const [chId, channel] of Object.entries(group.channels)) {
              if (chId === channelId && channel.messages) {
                channelMessages = await Promise.all(
                  Object.entries(channel.messages).map(async ([id, msg]) => {
                    // console.log('📥 Message reçu:', msg);
                    // console.log('📥 Structure d\'un message:', JSON.stringify(msg, null, 2));
                    
                    const isOwnMessage = msg.accountapikey === userCredentials.accountApiKey;
                    const hasFile = msg.filename && msg.filetype && msg.filetype !== 'none';
                    
                    let base64 = null;
                    if (hasFile) {
                      console.log('📥 Tentative récupération fichier:', {
                        messageId: msg.messageid,
                        fileType: msg.filetype,
                        fileName: msg.filename
                      });
                      
                      base64 = await fetchMessageFile(msg.messageid, {
                        ...msg,
                        channelid: parseInt(channelId)
                      }, userCredentials);
                      
                      console.log('📥 Résultat récupération fichier:', {
                        messageId: msg.messageid,
                        hasBase64: !!base64,
                        base64Length: base64?.length
                      });
                    }

                    return {
                      id,
                      title: msg.title || '',
                      message: msg.message || msg.title || '',
                      savedTimestamp: msg.savedts,
                      endTimestamp: msg.enddatets,
                      fileType: (msg.filetype || 'none').toLowerCase(),
                      login: isOwnMessage ? userCredentials.login : `${msg.firstname} ${msg.lastname}`,
                      isOwnMessage,
                      isUnread: msg.status === 'unread',
                      username: isOwnMessage ? 'Moi' : `${msg.firstname} ${msg.lastname}`,
                      type: hasFile ? 'file' : 'text',
                      text: msg.message || msg.title || '',
                      ...(hasFile && {
                        fileName: msg.filename,
                        fileSize: msg.filesize,
                        fileType: msg.filetype,
                        base64: base64 || null
                      })
                    };
                  })
                );
              }
            }
          }
        }
      }

      return channelMessages;
    }
    return [];
  } catch (error) {
    console.error('🔴 Erreur fetchChannelMessages:', error);
    throw error;
  }
};

/**
 * Récupère le contenu d'un fichier attaché à un message
 */
export const fetchMessageFile = async (messageId, msg, userCredentials) => {
  try {
    // console.log('📥 Début fetchMessageFile:', {
    //   messageId,
    //   channelId: msg.channelid,
    //   credentials: !!userCredentials
    // });

    const timestamp = Date.now();
    const saltPath = `amaiia_msg_srv/client/get_base64/${timestamp}/`;
    const signature = createSignature(saltPath, userCredentials.contractNumber);

    const body = createApiRequest({
      "amaiia_msg_srv": {
        "client": {
          "get_base64": {
            "messageid": parseInt(messageId),
            "channelid": parseInt(msg.channelid)
          }
        }
      }
    }, userCredentials.contractNumber);

    const response = await axios.post(API_URL, body);
    
    // Extraction correcte du base64
    const base64Data = response.data?.cmd?.[0]?.amaiia_msg_srv?.client?.get_base64?.data?.base64;
    
    // console.log('📥 Réponse get_base64:', {
    //   status: response.status,
    //   hasData: !!response.data,
    //   hasBase64: !!base64Data,
    //   base64Length: base64Data?.length
    // });

    if (!base64Data) {
      console.log('❌ Pas de base64 dans la réponse');
      return null;
    }

    return base64Data;
  } catch (error) {
    console.error('🔴 Erreur fetchMessageFile:', error);
    return null;
  }
};

// const credentials = await secureStore.getCredentials();
// const channelsResponse = await fetchUserChannels(contractNumber, login, password, '', credentials.accountApiKey);