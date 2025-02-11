import axios from 'axios';
import { ENV } from '../../config/env';
import { createApiRequest, cleanApiResponse } from './baseApi';

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
export const fetchUserChannels = async (contractNumber, login, password, accessToken = '') => {
  console.log('🔢 Contract Number dans fetchUserChannels:', contractNumber);
  console.log('🔑 Login:', login);
  console.log('🔒 Password:', password ? '****' : 'empty');
  
  try {
    const body = createApiRequest({
      "accounts": {
        "loginmsg": {
          "get": {
            "login": login,
            "password": password
          }
        }
      }
    }, contractNumber, accessToken);

    console.log('📦 Requête complète:', JSON.stringify(body, null, 2));

    const response = await axios.post(API_URL, body);

    if (response.status === 200) {
      const data = response.data?.cmd?.[0]?.accounts?.loginmsg?.get?.data;
      if (!data) {
        return {
          status: 'error',
          error: 'Invalid data structure'
        };
      }

      // We format the data to be used in the UI
      const publicChannels = Object.entries(data.public || {}).map(([id, channel]) => ({
        id,
        title: channel.identifier || 'Channel without title',
        description: channel.description || '',
        messages: formatMessages(channel.messages)
      }));

      const privateGroups = Object.entries(data.private?.groups || {}).map(([id, group]) => ({
        id,
        title: group.identifier || 'Group without title',
        description: group.description || '',
        rights: group.rights,
        channels: group.channels === "No channel" ? [] : Object.entries(group.channels || {}).map(([channelId, channel]) => ({
          id: channelId,
          title: channel.identifier || 'Channel without title',
          description: channel.description || '',
          messages: formatMessages(channel.messages)
        }))
      }));

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
  try {;
    const data = createApiRequest({
      "msg_srv": {
        "client": {
          "get_account_links": {
            "accountinfos": {
              "login": userCredentials.login,
              "password": userCredentials.password,
              "email": "",
              "nom": "",
              "prenom": ""
            },
            "msg-msgapikey": ENV.MSG_API_KEY,
            "msg-contract-number": userCredentials.contractNumber
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

    const allData = response.data?.cmd?.[0]?.msg_srv?.client?.get_account_links?.data;
    let channelMessages = [];

    // We search for the messages in the private groups
    if (allData?.private?.groups) {
      Object.values(allData.private.groups).forEach(group => {
        // We search for the messages in the channels of the group  
        Object.entries(group.channels || {}).forEach(([chId, channel]) => {
          // If the channel ID is the same as the channel ID we are looking for and the channel has messages, we format the messages
          if (chId === channelId && channel.messages && typeof channel.messages === 'object') {
            channelMessages = Object.entries(channel.messages)
              // We format the messages
              .map(([id, msg]) => {
                if (!msg || !msg.savedts) {
                  return null;
                }
                // We return the formatted messages
                return {
                  id,
                  title: msg.title || '',
                  message: msg.message || msg.title || '',
                  savedTimestamp: msg.savedts,
                  endTimestamp: msg.enddatets,
                  fileType: msg.filetype || 'none',
                  login: msg.login || userCredentials.login,
                  isOwnMessage: msg.login === userCredentials.login,
                  isUnread: msg.status === 'unread'
                };
              })
              .filter(msg => msg !== null);
          }
        });
      });
    }

    return channelMessages;

  } catch (error) {
    return [];
  }
};

