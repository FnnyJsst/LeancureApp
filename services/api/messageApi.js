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
 * @param {string} email - The email
 * @param {string} nom - The nom
 * @param {string} prenom - The prenom
 * @returns {Promise<Object>} - The user's channels
 */
export const fetchUserChannels = async (contractNumber, login, password, email, nom, prenom) => {
  const timestamp = Date.now();
  
  try {
    const body = createApiRequest({
      "msg_srv": {
        "client": {
          "get_account_links": {
            "accountinfos": {
              "login": login,
              "email": email || '',
              "password": password,
              "nom": nom || '',
              "prenom": prenom || ''
            },
            "msg-msgapikey": ENV.MSG_API_KEY,
            "msg-contract-number": contractNumber
          }
        }
      }
    }, contractNumber);

    const response = await axios.post(API_URL, body);
    const cleanData = cleanApiResponse(response);

    if (cleanData.status === "ok") {
      const data = cleanData.cmd?.[0]?.msg_srv?.client?.get_account_links?.data;
      if (!data) {
        return {
          status: 'error',
          error: 'Invalid data structure'
        };
      }

      const publicChannels = Object.entries(data.public || {}).map(([id, channel]) => ({
        id,
        title: channel.identifier || 'Canal sans titre',
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
        error: cleanData.error || 'Error while fetching data'
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
    // console.error('🔴 Error sending message:', error);
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

    // Extract the data from the response
    const allData = response.data?.cmd?.[0]?.msg_srv?.client?.get_account_links?.data;
    let channelMessages = [];

    // Search in public channels
    if (allData?.public?.[channelId]?.messages) {
      const messages = allData.public[channelId].messages;
      channelMessages = Object.entries(messages).map(([id, msg]) => ({
        id,
        title: msg.title,
        message: msg.message,
        savedTimestamp: msg.savedts,
        endTimestamp: msg.enddatets,
        fileType: msg.filetype || 'none',
        login: msg.login,
        // Check if the message is from the user
        isOwnMessage: msg.login === userCredentials.login,
        // Check if the message is unread
        isUnread: msg.status === 'unread'
      }));
    }

    // Search in private groups
    if (allData?.private?.groups) {
      Object.values(allData.private.groups).forEach(group => {
        if (group.channels?.[channelId]?.messages) {
          const messages = group.channels[channelId].messages;
          channelMessages = Object.entries(messages).map(([id, msg]) => ({
            id,
            title: msg.title,
            message: msg.message,
            savedTimestamp: msg.savedts,
            endTimestamp: msg.enddatets,
            fileType: msg.filetype || 'none',
            login: msg.login,
            // Check if the message is from the user
            isOwnMessage: msg.login === userCredentials.login,
            // Check if the message is unread
            isUnread: msg.status === 'unread'
          }));
        }
      });
    }

    // console.log(`📨 Messages found for channel ${channelId}:`, channelMessages.length);
    return channelMessages;

  } catch (error) {
    // console.error('🔴 Detailed error:', error);
    return [];
  }
};

