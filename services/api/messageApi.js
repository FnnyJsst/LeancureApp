import axios from 'axios';
import { ENV } from '../../config/env';
import { createApiRequest, createSignature } from './baseApi';
import { useTranslation } from 'react-i18next';

/**
 * @function fetchUserChannels
 * @description Fetches the user's channels
 * @param {string} contractNumber - The contract number
 * @param {string} login - The login (unused)
 * @param {string} password - The password (unused)
 * @param {string} accessToken - The access token
 * @param {string} accountApiKey - The account API key
 * @returns {Promise<Object>} - The user's channels
 */
export const fetchUserChannels = async (contractNumber, login, password, accessToken = '', accountApiKey = '') => {
  try {
    console.log('🔵 Récupération des canaux pour:', { contractNumber, accountApiKey });

    const body = createApiRequest({
      'amaiia_msg_srv': {
        'client': {
          'get_account_links': {
            'accountinfos': {
              'accountapikey': accountApiKey,
            },
            'returnmessages': false,
            'resultsperchannel': 0,
            'orderby': 'ASC'
          },
        },
      },
    }, contractNumber, accessToken);

    let apiUrl = await ENV.API_URL();
    if (!apiUrl.endsWith('/ic.php')) {
      apiUrl = `${apiUrl}/ic.php`;
    }

    console.log('🔵 URL API pour les channels:', apiUrl);

    const response = await axios({
      method: 'POST',
      url: apiUrl,
      data: body,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
      validateStatus: function (status) {
        console.log('🔵 Status reçu pour les channels:', status);
        return true;
      },
    });

    console.log('🔵 Réponse des channels:', JSON.stringify(response.data, null, 2));

    const data = response.data?.cmd?.[0]?.amaiia_msg_srv?.client?.get_account_links?.data;

    if (!data?.private?.groups) {
      console.error('❌ Pas de groupes trouvés dans la réponse');
      return { status: 'error', message: 'No groups found' };
    }

    // Formater les groupes et canaux comme attendu par la Sidebar
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
      privateGroups: privateGroups,
      publicChannels: [],
      rawData: data
    };

  } catch (error) {
    console.error('🔴 Error fetchUserChannels:', error);
    return {
      status: 'error',
      message: error.message
    };
  }
}

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

    // We check if the message content is a file
    const isFile = typeof messageContent === 'object';

    // We get the message title
    const messageTitle = isFile ? messageContent.fileName : messageContent.substring(0, 50);

    // If the message content is a file, we get the file type
    let fileType = isFile ? messageContent.fileType : null;
    if (fileType === 'application/pdf') {
      fileType = 'pdf';
    } else if (fileType === 'image/jpeg') {
      fileType = 'jpg';
    } else if (fileType === 'image/png') {
      fileType = 'png';
    }

    // We create the body of the request
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

    // We get the API URL
    const apiUrl = await ENV.API_URL();

    // We send the request to the API
    const response = await axios.post(apiUrl, body, {
      timeout: 30000,
    });

    // We check if the response is valid
    if (response.status === 200) {
      // We check if the response contains a PHP error
      if (typeof response.data === 'string' && response.data.includes('xdebug-error')) {
        // If it does, we throw an error
        throw new Error(t('error.serverError'));
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

    throw new Error(t('error.messageNotSaved'));
  } catch (error) {
    throw error;
  }
};

/**
 * @function deleteMessageApi
 * @description Deletes a message
 * @param {number} messageId - The message ID
 * @param {Object} userCredentials - The user credentials
 * @returns {Promise<Object>} - The result of the deletion
 */
export const deleteMessageApi = async (messageId, userCredentials) => {
  try {

    // We create the body of the request
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

    // We get the API URL
    const apiUrl = await ENV.API_URL();

    // We send the request to the API
    const response = await axios.post(apiUrl, body, {
      timeout: 10000, // 10 secondes max
    });

    if (response.status === 200) {
      return {
        status: 'ok',
        // message: t('success.messageDeleted')
      };
    }

    throw new Error(t('error.messageNotDeleted'));
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

    // We create the body of the request
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

    // We get the API URL
    const apiUrl = await ENV.API_URL();

    // We send the request to the API
    const response = await axios.post(apiUrl, body);

    // We check if the response is valid


    // If the response is valid, we get the messages
    if (response.status === 200) {
      // We get the data of the response
      const data = response.data?.cmd?.[0]?.amaiia_msg_srv?.client?.get_account_links?.data;
      let channelMessages = [];

      // We check if the data is valid
      if (data?.private?.groups) {
        // We loop through the groups
        for (const group of Object.values(data.private.groups)) {
          // We check if the group has channels
          if (group.channels) {
            // We loop through the channels
            for (const [chId, channel] of Object.entries(group.channels)) {
              // We check if the channel has messages
              if (chId === channelId && channel.messages) {
                // We loop through the messages
                channelMessages = await Promise.all(
                  Object.entries(channel.messages).map(async ([id, msg]) => {
                    // We check if the message is our own message
                    const isOwnMessage = msg.accountapikey === userCredentials.accountApiKey;
                    // We check if the message has a file
                    const hasFile = msg.filename && msg.filetype && msg.filetype !== 'none';

                    // We get the low quality version of the image
                    let base64 = null;
                    if (hasFile) {
                      base64 = msg.img_minimized;
                    }

                    // We return the message
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
    throw error;
  }
};

/**
 * @function fetchMessageFile
 * @description Fetches the file of a message
 * @param {string} messageId - The message ID
 * @param {Object} msg - The message
 * @param {Object} userCredentials - The user credentials
 * @returns {Promise<string>} - The file
 */
export const fetchMessageFile = async (messageId, msg, userCredentials) => {
  try {

    const timestamp = Date.now();
    // We create the salt path
    const saltPath = `amaiia_msg_srv/message/get_base64/${timestamp}/`;
    // We create the signature
    createSignature(saltPath, userCredentials.contractNumber);

    // We create the body of the request
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

    // We extract the base64 data
    const base64Data = response.data?.cmd?.[0]?.amaiia_msg_srv?.message?.get_base64?.data?.base64;

    // If the base64 data is not found, we throw an error
    if (!base64Data) {
      throw new Error(t('error.messageFileNotFound'));
    }

    return base64Data;
  } catch (error) {
    throw error;
  }
};
