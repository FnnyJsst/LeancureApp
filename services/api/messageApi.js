import axios from 'axios';
import { ENV } from '../../config/env';
import { createApiRequest, createSignature } from './baseApi';
import CryptoJS from 'crypto-js';

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



  // console.log('🔢 Contract Number:', contractNumber);
  // console.log('🔑 Account API Key:', accountApiKey);

  try {
    const body = createApiRequest({
      'amaiia_msg_srv': {
        'client': {
          'get_account_links': {
            'accountinfos': {
              'accountapikey': accountApiKey,
            },
            'returnmessages': true,
            'returnimgsmin': true,
            'resultsperchannel': 0,
            'orderby': 'ASC'
          },
        },
      },
    }, contractNumber, accessToken);

    let apiUrl;
    try {
      apiUrl = await ENV.API_URL();
    } catch (urlError) {
      throw urlError;
    }

    // console.log('🔗 URL API pour les channels:', apiUrl);

    try {
      const response = await axios({
        method: 'POST',
        url: apiUrl,
        data: body,
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      const data = response.data?.cmd?.[0]?.amaiia_msg_srv?.client?.get_account_links?.data;

      if (!data?.private?.groups) {
        return { status: 'error', message: 'No groups found' };
      }

      const privateGroups = Object.entries(data.private.groups)
        .map(([groupId, groupData]) => ({
          id: groupId,
          title: groupData.identifier || 'Groupe sans nom',
          channels: Object.entries(groupData.channels || {})
            .map(([channelId, channel]) => ({
              id: channelId,
              title: channel.identifier || channel.description || 'Canal sans nom',
              unreadCount: 0,
              groupId: groupId,
            })),
        }))
        .filter(group => group.channels.length > 0);

      return {
        status: 'ok',
        privateGroups,
        publicChannels: [],
        rawData: data,
      };

    } catch (axiosError) {
      return { status: 'error', message: axiosError.message };
    }

  } catch (error) {
    return { status: 'error', message: error.message };
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

    const isFile = typeof messageContent === 'object';
    const messageTitle = isFile ? messageContent.fileName : messageContent.substring(0, 50);

    // Simplifier le type de fichier pour les PDF
    let fileType = isFile ? messageContent.fileType : null;
    if (fileType === 'application/pdf') {
      fileType = 'pdf';
    } else if (fileType === 'image/jpeg') {
      fileType = 'jpg';
    } else if (fileType === 'image/png') {
      fileType = 'png';
    }

    // Utiliser createApiRequest comme les autres fonctions
    const body = createApiRequest({
      'amaiia_msg_srv': {
        'message': {
          'add': {
            'channelid': parseInt(channelId, 10),
            'title': messageTitle,
            'details': messageContent.messageText || null,
            'enddatets': timestamp + 99999,
            'file': isFile ? {
              'base64': messageContent.base64,
              'filetype': fileType,
              'filename': messageContent.fileName,
              'filesize': messageContent.fileSize || 0,
            } : null,
            'sentby': userCredentials.accountApiKey,
          }
        }
      }
    }, userCredentials.contractNumber, userCredentials.accessToken || "");

    const apiUrl = await ENV.API_URL();
    const response = await axios.post(apiUrl, body, {
      timeout: 30000,
    });

    if (response.status === 200) {
      // Vérifier si la réponse contient une erreur PHP
      if (typeof response.data === 'string' && response.data.includes('xdebug-error')) {
        // console.error('❌ Erreur PHP détectée dans la réponse');
        throw new Error('Erreur serveur PHP');
      }

      return {
        status: 'ok',
        message: {
          id: timestamp,
          title: messageTitle,
          message: messageContent.messageText || messageContent,
          savedTimestamp: timestamp,
          endTimestamp: timestamp + 99999,
          fileType: isFile ? fileType : 'none',
          login: userCredentials.login,
          isOwnMessage: true,
          isUnread: false,
          username: 'Moi',
          ...(isFile && {
            type: 'file',
            fileName: messageContent.fileName,
            fileSize: messageContent.fileSize,
            fileType: fileType,
            base64: messageContent.base64,
          }),
        },
      };
    }

    throw new Error('Message not saved');
  } catch (error) {
    console.error('❌ ERREUR:', error.message);
    throw error;
  }
};

/**
 * @function deleteMessageApi
 * @description Supprime un message via l'API
 * @param {number} messageId - L'ID du message à supprimer
 * @param {Object} userCredentials - Les credentials de l'utilisateur
 * @returns {Promise<Object>} - Le résultat de la suppression
 */
export const deleteMessageApi = async (messageId, userCredentials) => {
  try {
    const timestamp = Date.now();

    const body = createApiRequest({
      'amaiia_msg_srv': {
        'message': {
          'delete': {
            'messageid': parseInt(messageId, 10),
            'accountapikey': userCredentials.accountApiKey
          }
        }
      }
    }, userCredentials.contractNumber);

    console.log('🗑️ Tentative de suppression du message:', {
      messageId,
      timestamp
    });

    const apiUrl = await ENV.API_URL();
    const response = await axios.post(apiUrl, body, {
      timeout: 10000, // 10 secondes max
    });

    if (response.status === 200) {
      return {
        status: 'ok',
        message: 'Message supprimé avec succès'
      };
    }

    throw new Error('Message non supprimé');
  } catch (error) {
    console.error('🔴 Erreur deleteMessageApi:', error);
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

    const body = createApiRequest({
      'amaiia_msg_srv': {
        'client': {
          'get_account_links': {
            'accountinfos': {
              'accountapikey': userCredentials.accountApiKey,
            },
            'returnmessages': true,
            'returnimgsmin': true,
            'resultsperchannel': 0,
            'orderby': 'ASC'
          },
        },
      },
    }, userCredentials.contractNumber);

    const apiUrl = await ENV.API_URL();
    const response = await axios.post(apiUrl, body);
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

                    const isOwnMessage = msg.accountapikey === userCredentials.accountApiKey;
                    const hasFile = msg.filename && msg.filetype && msg.filetype !== 'none';

                    let base64 = null;
                    if (hasFile) {
                      base64 = msg.img_minimized;
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
                      text: msg.message && msg.message !== msg.title ? msg.message : null,
                      ...(hasFile && {
                        fileName: msg.filename,
                        fileSize: msg.filesize,
                        fileType: msg.filetype,
                        base64: base64 || null,
                      }),
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

    const timestamp = Date.now();
    const saltPath = `amaiia_msg_srv/message/get_base64/${timestamp}/`;
    createSignature(saltPath, userCredentials.contractNumber);

    const body = createApiRequest({
      'amaiia_msg_srv': {
        'message': {
          'get_base64': {
            'messageid': parseInt(messageId, 10),
            'channelid': parseInt(msg.channelid, 10),
            'accountapikey': userCredentials.accountApiKey
          },
        },
      },
    }, userCredentials.contractNumber);


    const apiUrl = await ENV.API_URL();
    const response = await axios.post(apiUrl, body);

    // Extraction correcte du base64
    const base64Data = response.data?.cmd?.[0]?.amaiia_msg_srv?.message?.get_base64?.data?.base64;


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

export const fetchHighQualityFile = async (messageId, msg, userCredentials) => {
  try {
    const timestamp = Date.now();
    // Exactement comme dans Postman
    const saltPath = `amaiia_msg_srv/message/get_base64/${timestamp}/`;
    const hash = CryptoJS.HmacSHA256(saltPath, userCredentials.contractNumber);
    const hashHex = hash.toString(CryptoJS.enc.Hex);

    // Structure exacte de la requête Postman
    const body = {
      "api-version": "2",
      "api-contract-number": userCredentials.contractNumber,
      "api-signature": hashHex,
      "api-signature-hash": "sha256",
      "api-signature-timestamp": timestamp,
      "client-type": "mobile",
      "client-login": "admin",
      "client-token": userCredentials.accessToken,
      "cmd": [
        {
          "amaiia_msg_srv": {
            "message": {
              "get_base64": {
                "messageid": parseInt(messageId, 10),
                "channelid": parseInt(msg.channelid, 10),
                "accountapikey": userCredentials.accountApiKey
              }
            }
          }
        }
      ]
    };

    console.log('📤 Requête envoyée:', {
      url: await ENV.API_URL(),
      body: JSON.stringify(body, null, 2)
    });

    const apiUrl = await ENV.API_URL();
    const response = await axios.post(apiUrl, body);

    // Vérifions d'abord la structure complète de la réponse
    const base64Data = response.data?.cmd?.[0]?.amaiia_msg_srv?.message?.get_base64?.base64;

    if (!base64Data) {
      console.log('❌ Structure de la réponse:', {
        hasCmd: !!response.data?.cmd,
        hasFirstCmd: !!response.data?.cmd?.[0],
        hasAmaiia: !!response.data?.cmd?.[0]?.amaiia_msg_srv,
        hasMessage: !!response.data?.cmd?.[0]?.amaiia_msg_srv?.message,
        hasGetBase64: !!response.data?.cmd?.[0]?.amaiia_msg_srv?.message?.get_base64,
        hasBase64: !!response.data?.cmd?.[0]?.amaiia_msg_srv?.message?.get_base64?.base64
      });
      return null;
    }

    return base64Data;
  } catch (error) {
    console.error('🔴 Erreur fetchHighQualityFile:', {
      message: error.message,
      response: error.response?.data,
      request: error.config
    });
    return null;
  }
};
