import axios from 'axios';
import { ENV } from '../../config/env';
import { createApiRequest, createSignature } from './baseApi';
import i18n from '../../i18n';
import { handleError, ErrorType } from '../../utils/errorHandling';

const t = (key) => i18n.t(key);

/**
 * @function fetchUserChannels
 * @description Fetches the user's channels
 * @param {string} contractNumber - The contract number
 * @param {string} login - The login
 * @param {string} password - The password
 * @param {string} accessToken - The access token
 * @param {string} accountApiKey - The account API key
 * @returns {Promise<Object>} - The user's channels
 */
export const fetchUserChannels = async (contractNumber, login, password, accessToken = '', accountApiKey = '') => {
  try {

    // We create the body of the request
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

    // We get the API URL and add the ic.php if it is not already there
    let apiUrl = await ENV.API_URL();
    if (!apiUrl.endsWith('/ic.php')) {
      apiUrl = `${apiUrl}/ic.php`;
    }

    // We send the request to the API
    const response = await axios({
      method: 'POST',
      url: apiUrl,
      data: body,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
      validateStatus: (status) => {
        // We accept 200-299 (success) and also 400 to handle validation errors
        return (status >= 200 && status < 300) || status === 400;
      },
    });

    // We get the data of the response
    const data = response.data?.cmd?.[0]?.amaiia_msg_srv?.client?.get_account_links?.data;

    if (!data?.private?.groups) {
      return { status: 'error', message: t('errors.noGroupsFound') };
    }

    // We format the groups and channels as expected by the Sidebar
    const privateGroups = Object.entries(data.private.groups)
      .map(([groupId, groupData]) => ({
        id: groupId,
        title: groupData.identifier || t('titles.noGroupName'),
        channels: Object.entries(groupData.channels || {})
          .map(([channelId, channel]) => ({
            id: channelId,
            title: channel.identifier || channel.description || t('titles.noNameChannel'),
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
    handleError(error, i18n.t('error.fetchingChannels'), {
      type: ErrorType.SYSTEM
    });
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
    const isFile = typeof messageContent === 'object' && messageContent.type === 'file';
    const messageTitle = isFile ?
      messageContent.fileName :
      (typeof messageContent.message === 'string' ? messageContent.message.substring(0, 50) : 'Message');

    // If the message content is a file, we get the file type
    let fileType = isFile ? messageContent.fileType : null;
    if (fileType === 'application/pdf') {
      fileType = 'pdf';
    } else if (fileType === 'text/csv') {
      fileType = 'csv';
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
            'details': isFile ? messageContent.messageText : messageContent.message,
            'enddatets': timestamp + 99999,
            'file': isFile ? {
              'base64': messageContent.base64,
              'filetype': fileType,
              'filename': messageContent.fileName,
              'filesize': messageContent.fileSize,
            } : null,
            'sentby': userCredentials.accountApiKey,
          }
        }
      }
    }, userCredentials.contractNumber, userCredentials.accessToken || "");

    // We get the API URL and send the request
    const apiUrl = await ENV.API_URL();
    const response = await axios.post(apiUrl, body, {
      timeout: 30000,
    });

    const isSuccess = response.data?.cmd?.[0]?.amaiia_msg_srv?.message?.add?.status === 'ok';

    if (!isSuccess) {
      console.error('Response data:', JSON.stringify(response.data, null, 2));
      throw new Error(t('error.messageNotSaved'));
    }

    const messageData = {
      status: 'ok',
      id: timestamp.toString(),
      message: {
        id: timestamp.toString(),
        title: messageTitle,
        message: isFile ? messageContent.messageText : messageContent.message,
        savedTimestamp: timestamp,
        endTimestamp: timestamp + 99999,
        fileType: isFile ? fileType : 'none',
        login: userCredentials.login,
        isOwnMessage: true,
        isUnread: false,
        username: t('messages.me'),
        ...(isFile && {
          type: 'file',
          fileName: messageContent.fileName,
          fileSize: messageContent.fileSize ? parseInt(messageContent.fileSize, 10) : 0,
          fileType: fileType,
          base64: messageContent.base64,
        }),
      },
    };

    return messageData;
  } catch (error) {
    // If the error is already an Error object, we return it
    if (error instanceof Error) {
      throw error;
    }

    // If the error is a string, we create a new Error object
    if (typeof error === 'string') {
      throw new Error(error);
    }

    // If the error is an object, we try to extract the message
    if (typeof error === 'object' && error !== null) {
      const errorMessage = error.message || error.error || JSON.stringify(error);
      throw new Error(errorMessage);
    }

    // If we cannot determine the type of error, we create a default error
    throw new Error(t('error.unexpectedError'));
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

    // We get the API URL and send the request
    const apiUrl = await ENV.API_URL();
    const response = await axios.post(apiUrl, body, {
      timeout: 10000,
    });

    if (response.status === 200) {
      return {
        status: 'ok',
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

    // We get the API URL and send the request
    const apiUrl = await ENV.API_URL();
    const response = await axios.post(apiUrl, body);

    // If the response is valid, we get the messages
    if (response.status === 200) {
      const data = response.data?.cmd?.[0]?.amaiia_msg_srv?.client?.get_account_links?.data;
      let channelMessages = [];
      if (data?.private?.groups) {
        for (const group of Object.values(data.private.groups)) {
          // We check if the group has channels and loop through them
          if (group.channels) {
            for (const [chId, channel] of Object.entries(group.channels)) {
              // We check if the channel has messages and we loop through them
              if (chId === channelId && channel.messages) {
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
    // We create the salt path and the signature
    const saltPath = `amaiia_msg_srv/message/get_base64/${timestamp}/`;
    const signature = createSignature(saltPath, userCredentials.contractNumber);

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

/**
 * @function editMessageApi
 * @description Edits an existing message in the API
 * @param {string} messageId - The ID of the message to edit
 * @param {Object} messageContent - The new content for the message
 * @param {Object} userCredentials - The user credentials
 * @returns {Promise<Object>} - The result of the edit operation
 */
export const editMessageApi = async (messageId, messageContent, userCredentials) => {
  try {
    const timestamp = Date.now();

    // We create the title from the message content
    const messageTitle = typeof messageContent.text === 'string'
      ? messageContent.text.substring(0, 50)
      : 'Message édité';

    // We get the message text
    const messageText = messageContent.text || '';

    // We create the body of the request for the message edit
    const body = createApiRequest({
      'amaiia_msg_srv': {
        'message': {
          'edit': {
            'messageid': parseInt(messageId, 10),
            'accountapikey': userCredentials.accountApiKey,
            'title': messageTitle,
            'details': messageText
          }
        }
      }
    }, userCredentials.contractNumber, userCredentials.accessToken || "");

    // We send the request to the API
    const apiUrl = await ENV.API_URL();
    const response = await axios.post(apiUrl, body, {
      timeout: 30000,
    });

    // If the response is valid, we return the message data
    if (response.status === 200) {
      if (typeof response.data === 'string' && response.data.includes('xdebug-error')) {
        throw new Error(t('error.serverError'));
      }

      // We return the message data
      return {
        status: 'ok',
        message: {
          id: messageId,
          title: messageTitle,
          text: messageText,
          message: messageText,
          savedTimestamp: timestamp,
          fileType: 'none',
          login: userCredentials.login,
          isOwnMessage: true,
          isUnread: false,
          username: 'Moi',
        },
      };
    }

    throw new Error(t('error.messageNotEdited'));
  } catch (error) {
    throw error;
  }
};