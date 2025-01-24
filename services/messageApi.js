import axios from 'axios';

const API_URL = 'http://192.168.77.102/ic.php';

//This API is used to fetch the user's channels
export const fetchUserChannels = async (contractNumber, login, password, email, nom, prenom) => {
  const timestamp = Date.now();
  
  try {
    const response = await axios.post(API_URL, {
      "api-version": "2",
      "api-contract-number": contractNumber,
      "api-signature": "msgApiKey",
      "api-signature-hash": "sha256",
      "api-signature-timestamp": timestamp,
      "cmd": [{
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
              "msg-msgapikey": "12d0fd-e0bd67-4933ec-5ed14a-6f767b",
              "msg-contract-number": contractNumber
            }
          }
        }
      }]
    });

    // Clean response
    let cleanData = response.data;
    // If response is a string, parse it
    if (typeof response.data === 'string') {
      // Find the start of the JSON object
      const jsonStart = response.data.indexOf('{"status"');
      // If JSON object is found, parse it
      if (jsonStart !== -1) {
        try {
          cleanData = JSON.parse(response.data.substring(jsonStart));
        // If parsing fails, return an error
        } catch (e) {
          console.error('❌ Error parsing JSON:', e);
          return {
            status: 'error',
            error: 'Invalid JSON response'
          };
        }
      }
    }
    console.log('📥 Cleaned response:', cleanData);

    // If status is ok, extract the data
    if (cleanData.status === "ok") {
      const data = cleanData.cmd?.[0]?.msg_srv?.client?.get_account_links?.data;
      console.log('🔍 Extracted data:', data);
      // If data is not found, return an error
      if (!data) {
        console.log('❌ No data in the response:', cleanData);
        return {
          status: 'error',
          error: 'Invalid data structure'
        };
      }

      // Process public channels
      const publicChannels = Object.entries(data.public || {}).map(([id, channel]) => ({
        id,
        title: channel.identifier || 'Canal sans titre',
        description: channel.description || '',
        messages: formatMessages(channel.messages)
      }));

      // Process private groups
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

      console.log('✅ Formatted data:', { publicChannels, privateGroups });
      // Return the formatted data
      return {
        status: 'ok',
        publicChannels,
        privateGroups
      };
      // If status is not ok, return an error
    } else {
      console.error('❌ Error in the response:', cleanData);
      return {
        status: 'error',
        error: cleanData.error || 'Error while fetching data'
      };
    }
  } catch (error) {
    console.error("API error:", error);
    return {
      status: 'error',
      error: error.message || 'Error while fetching data'
    };
  }
};

//Format the messages data to be used in the UI
const formatMessages = (messages) => {
  // If messages is not found, return an empty array
  if (!messages) return [];
  // Return the formatted messages
  return Object.entries(messages).map(([id, msg]) => ({
    id,
    title: msg.title,
    message: msg.message,
    savedTimestamp: msg.savedts,
    endTimestamp: msg.enddatets,
    fileType: msg.filetype,
    isOwnMessage: msg.isOwnMessage || false
  }));
};

//Function used to login to the API
export const loginApi = async (contractNumber, login, password) => {
  try {
    const timestamp = Date.now();
    console.log('🔄 Start of loginApi...', { contractNumber, login });
    
    const body = {
      "api-version": "2",
      "api-contract-number": contractNumber,
      "api-signature": "msgApiKey",
      "api-signature-hash": "sha256",
      "api-signature-timestamp": timestamp,
      "cmd": [{
        "accounts": {
          "loginmsg": {
            "get": {
              "contractnumber": contractNumber,
              "login": login,
              "password": password,
              "msg-msgapikey": "12d0fd-e0bd67-4933ec-5ed14a-6f767b"
            }
          }
        }
      }]
    };
    // Log the request body
    console.log('📤 Sending login request with:', JSON.stringify(body, null, 2));
    // Send the request
    const response = await axios.post(API_URL, body);
    // Log the response
    console.log('📥 Raw response:', {
      data: response.data,
      status: response.status,
      headers: response.headers,
      type: typeof response.data
    });

    // If the response is a string
    let cleanData = response.data;
    if (typeof response.data === 'string') {
      // Extract the JSON part after the SQL request
      const sqlEnd = response.data.indexOf('{');
      if (sqlEnd !== -1) {
        try {
          // Extract the JSON part after the SQL request
          const jsonStr = response.data.substring(sqlEnd);
          console.log('📝 Extracted JSON:', jsonStr);
          // Parse the JSON
          cleanData = JSON.parse(jsonStr);
          console.log('✨ Parsed JSON:', cleanData);
        } catch (e) {
          console.error('❌ Error parsing JSON:', e);
          throw e;
        }
      }
    }

    // Check the status
    if (cleanData.status === 'error') {
      console.error('❌ Login error:', cleanData.error);
      throw new Error(cleanData.error || 'Login failed');
    }

    console.log('✅ Login successful:', cleanData);
    // Return the login data
    return cleanData;
  } catch (error) {
    console.error('🔴 Login error:', error);
    throw error;
  }
};

//Function used to send a message to the API
export const sendMessageApi = async (channelId, messageContent, userCredentials) => {
  try {
    const timestamp = Date.now();
    
    // Vérifier si messageContent est un objet fichier ou un texte simple
    const isFile = typeof messageContent === 'object' && messageContent.base64;
    
    const data = {
      "api-version": "2",
      "api-contract-number": "202501121",
      "api-signature": "msgApiKey",
      "api-signature-hash": "sha256",
      "api-signature-timestamp": timestamp,
      "cmd": [
        {
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
                "msg-msgapikey": "12d0fd-e0bd67-4933ec-5ed14a-6f767b",
                "msg-contract-number": "202501121",
                "channelid": parseInt(channelId),
                "title": isFile ? messageContent.name : "Nouveau message",
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
        }
      ]
    };

    const response = await axios({
      method: 'POST',
      url: API_URL,
      data: data,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Parser la réponse
    let cleanData = response.data;
    if (typeof response.data === 'string') {
      const jsonMatches = response.data.match(/\{(?:[^{}]|(?:\{[^{}]*\}))*\}/g);
      if (jsonMatches) {
        try {
          cleanData = JSON.parse(jsonMatches[jsonMatches.length - 1]);
        } catch (e) {
          console.error('❌ Erreur parsing JSON:', e);
          throw new Error('Format de réponse invalide');
        }
      }
    }

    if (cleanData.status === 'ok' && 
        cleanData.cmd?.[0]?.msg_srv?.client?.add_msg?.status === 'ok') {
      return {
        status: 'ok',
        message: messageContent,
        timestamp: timestamp,
        messageId: cleanData.cmd?.[0]?.msg_srv?.client?.add_msg?.msgid
      };
    } else {
      throw new Error(cleanData.error || 'Erreur lors de l\'envoi du message');
    }
  } catch (error) {
    console.error('🔴 Error sending message:', error);
    throw error;
  }
};

export const fetchChannelMessages = async (channelId, userCredentials) => {
  try {
    const timestamp = Date.now();
    
    const data = {
      "api-version": "2",
      "api-contract-number": userCredentials.contractNumber,
      "api-signature": "msgApiKey",
      "api-signature-hash": "sha256",
      "api-signature-timestamp": timestamp,
      "cmd": [
        {
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
                "msg-msgapikey": "12d0fd-e0bd67-4933ec-5ed14a-6f767b",
                "msg-contract-number": userCredentials.contractNumber
              }
            }
          }
        }
      ]
    };

    const response = await axios({
      method: 'POST',
      url: API_URL,
      data: data,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    let cleanData = response.data;
    if (typeof response.data === 'string') {
      const jsonMatches = response.data.match(/\{(?:[^{}]|(?:\{[^{}]*\}))*\}/g);
      if (jsonMatches) {
        cleanData = JSON.parse(jsonMatches[jsonMatches.length - 1]);
      }
    }

    const allData = cleanData?.cmd?.[0]?.msg_srv?.client?.get_account_links?.data;
    let messages = [];

    // Chercher dans les canaux publics
    if (allData?.public?.[channelId]?.messages) {
      messages = Object.entries(allData.public[channelId].messages).map(([id, msg]) => ({
        id,
        title: msg.title,
        message: msg.message || msg.details,
        savedTimestamp: msg.savedts,
        endTimestamp: msg.enddatets,
        fileType: msg.filetype || 'none',
        isOwnMessage: msg.isOwnMessage || false
      }));
    }

    // Chercher dans les groupes privés
    if (allData?.private?.groups) {
      Object.values(allData.private.groups).forEach(group => {
        if (group.channels?.[channelId]?.messages) {
          messages = Object.entries(group.channels[channelId].messages).map(([id, msg]) => ({
            id,
            title: msg.title,
            message: msg.message || msg.details,
            savedTimestamp: msg.savedts,
            endTimestamp: msg.enddatets,
            fileType: msg.filetype || 'none',
            isOwnMessage: msg.isOwnMessage || false
          }));
        }
      });
    }

    return messages;

  } catch (error) {
    console.error('🔴 Detailed error:', error);
    return [];
  }
};

