import axios from 'axios';
import { ENV } from '../../config/env';
import { createApiRequest, createSignature } from './baseApi';

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

    console.log('🔗 URL API pour les channels:', apiUrl);

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

    console.log('📤 Envoi message - données:', {
      channelId,
      isFile,
      fileDetails: isFile ? {
        fileName: messageContent.fileName,
        fileType: messageContent.fileType,
        fileSize: messageContent.fileSize,
        hasBase64: !!messageContent.base64
      } : null
    });

    const messageTitle = isFile ? messageContent.fileName : messageContent.substring(0, 50);

    const body = createApiRequest({
      'amaiia_msg_srv': {
        'client': {
          'add_msg': {
            'channelid': parseInt(channelId, 10),
            'title': messageTitle,
            'details': messageContent,
            'enddatets': timestamp + 99999,
            'file': isFile ? {
              'base64': messageContent.base64,
              'filetype': messageContent.fileType,
              'filename': messageContent.fileName,
              'filesize': messageContent.fileSize,
            } : null,
            'sentby': userCredentials.accountApiKey,
          },
        },
      },
    }, userCredentials.contractNumber);

    console.log('📤 Requête envoyée:', {
      channelId,
      title: messageTitle,
      details: isFile ? messageContent.fileName : messageContent,
      isFile,
      fileInfo: isFile ? {
        fileType: messageContent.fileType,
        fileName: messageContent.fileName,
        fileSize: messageContent.fileSize
      } : null
    });

    const apiUrl = await ENV.API_URL();
    const response = await axios.post(apiUrl, body, {
      timeout: 30000,
    });

    // Log de la réponse
    console.log('📤 Réponse du serveur:', {
      status: response.status,
      data: response.data
    });

    if (response.status === 200) {
      const messageData = {
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
          base64: messageContent.base64,
        }),
      };

      return {
        status: 'ok',
        message: messageData,
      };
    }

    throw new Error('Message not saved');
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

    const body = createApiRequest({
      'amaiia_msg_srv': {
        'client': {
          'get_account_links': {
            'accountinfos': {
              'accountapikey': userCredentials.accountApiKey,
            },
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
                    const isPDF = msg.filetype?.toLowerCase().includes('pdf');

                    console.log('📥 Traitement message:', {
                      id,
                      type: hasFile ? 'file' : 'text',
                      fileType: msg.filetype,
                      isPDF,
                      fileName: msg.filename
                    });

                    let base64 = null;
                    if (hasFile) {
                      base64 = await fetchMessageFile(msg.messageid, {
                        ...msg,
                        channelid: parseInt(channelId, 10),
                      }, userCredentials);
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
    // console.log('📥 Début fetchMessageFile:', {
    //   messageId,
    //   channelId: msg.channelid,
    //   credentials: !!userCredentials
    // });

    const timestamp = Date.now();
    const saltPath = `amaiia_msg_srv/client/get_base64/${timestamp}/`;
    createSignature(saltPath, userCredentials.contractNumber);

    const body = createApiRequest({
      'amaiia_msg_srv': {
        'client': {
          'get_base64': {
            'messageid': parseInt(messageId, 10),
            'channelid': parseInt(msg.channelid, 10),
          },
        },
      },
    }, userCredentials.contractNumber);

    const apiUrl = await ENV.API_URL();
    const response = await axios.post(apiUrl, body);

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
