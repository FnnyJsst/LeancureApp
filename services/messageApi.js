import axios from 'axios';

const API_URL = 'http://192.168.77.100/ic.php';

//This API is used to fetch the user's channels
export const fetchUserChannels = async () => {
  const timestamp = Date.now();
  
  try {
    const response = await axios.post(API_URL, {
      //API header  
      "api-version": "2",
      "api-contract-number": "202501121",
      "api-signature": "msgApiKey",
      "api-signature-hash": "sha256", 
      "api-signature-timestamp": timestamp,
      //API command
      "cmd": [{
        "msg_srv": {
          "client": {
            "get_account_links": {
              "accountinfos": {
                "login": "admin",
                "email": "admin@leancure.com",
                "password": "mesadmin",
                "nom": "Admin",
                "prenom": "Leancure"
              },
              "msg-msgapikey": "12d0fd-e0bd67-4933ec-5ed14a-6f767b",
              "msg-contract-number": "202501121"
            }
          }
        }
      }]
    });

    //API response
    let cleanData = response.data;
    if (typeof response.data === 'string') {
      // Trouver le début du JSON après la requête SQL
      const jsonStartIndex = response.data.indexOf('{"status"');
      if (jsonStartIndex !== -1) {
        try {
          const jsonStr = response.data.substring(jsonStartIndex);
          cleanData = JSON.parse(jsonStr);
        } catch (e) {
          console.error('❌ Erreur parsing JSON:', e);
          return {
            status: 'error',
            error: 'Invalid JSON response'
          };
        }
      }
    }

    if (cleanData.status === "ok") {
      console.log('✅ Réponse des canaux:', cleanData);
      const data = cleanData.cmd[0].msg_srv.client.get_account_links.data;
      return formatChannelsData(data);
    } else {
      console.error('❌ Erreur dans la réponse:', cleanData);
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

//Format the channels data
const formatChannelsData = (data) => {
  const formattedData = {
    publicChannels: [],
    privateGroups: [],
    unreadCount: 0
  };

  // Format the public channels
  if (data.public) {
    //If the public channels exist, we format them
    Object.entries(data.public).forEach(([channelId, channelData]) => {
      //We get the unread messages
      const unreadMessages = channelData.messages ? 
        Object.values(channelData.messages).filter(msg => !msg.read).length : 0;
      
      //We add the unread messages to the unread count    
      formattedData.unreadCount += unreadMessages;
      
      //We add the channel to the public channels
      formattedData.publicChannels.push({
        id: channelId,
        name: channelData.identifier,
        description: channelData.description,
        messages: formatMessages(channelData.messages),
        unreadCount: unreadMessages
      });
    });
  }

  // Format the private groups
  if (data.private?.groups) {
    Object.entries(data.private.groups).forEach(([groupId, groupData]) => {
      const groupChannels = [];
      
      // Format channels for this group
      if (groupData.channels && groupData.channels !== "No channel") {
        Object.entries(groupData.channels).forEach(([channelId, channelData]) => {
          const formattedMessages = formatMessages(channelData.messages);
          groupChannels.push({
            id: channelId,
            title: channelData.identifier,
            description: channelData.description,
            messages: formattedMessages,
            groupId: groupId
          });
        });
      }

      const group = {
        id: groupId,
        name: groupData.identifier,
        description: groupData.description,
        rights: groupData.rights,
        channels: groupChannels
      };

      formattedData.privateGroups.push(group);
    });
  }

  return formattedData;
};

//Format the messages data
const formatMessages = (messages) => {
  if (!messages) return [];
  
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

export const loginApi = async (contractNumber, login, password) => {
  try {
    const timestamp = Date.now();
    console.log('🔄 Début de loginApi...', { contractNumber, login });
    
    const body = {
      "api-version": "2",
      "api-contract-number": "202501121",
      "api-signature": "msgApiKey",
      "api-signature-hash": "sha256",
      "api-signature-timestamp": timestamp,
      "cmd": [{
        "msg_srv": {
          "client": {
            "get_account_links": {
              "accountinfos": {
                "login": "admin",
                "email": "admin@leancure.com",
                "password": "$2y$10$.szCk5TjdRc1GNozxtrboecgqW5H1jQSvfL90Hrb.CSAOZceedYuy",
                "nom": "Admin",
                "prenom": "Leancure"
              },
              "msg-msgapikey": "12d0fd-e0bd67-4933ec-5ed14a-6f767b",
              "msg-contract-number": "202501121"
            }
          }
        }
      }]
    };

    console.log('📤 Envoi de la requête login avec:', JSON.stringify(body, null, 2));
    
    const response = await axios.post(API_URL, body);
    console.log('📥 Réponse brute:', {
      data: response.data,
      status: response.status,
      headers: response.headers,
      type: typeof response.data
    });

    // Si la réponse est une string
    let cleanData = response.data;
    if (typeof response.data === 'string') {
      // Extraire la partie JSON après la requête SQL
      const sqlEnd = response.data.indexOf('{');
      if (sqlEnd !== -1) {
        try {
          const jsonStr = response.data.substring(sqlEnd);
          console.log('📝 JSON extrait:', jsonStr);
          cleanData = JSON.parse(jsonStr);
          console.log('✨ JSON parsé:', cleanData);
        } catch (e) {
          console.error('❌ Erreur parsing JSON:', e);
          throw e;
        }
      }
    }

    // Vérifier le status
    if (cleanData.status === 'error') {
      console.error('❌ Erreur de login:', cleanData.error);
      throw new Error(cleanData.error || 'Login failed');
    }

    console.log('✅ Login réussi:', cleanData);
    return cleanData;
  } catch (error) {
    console.error('🔴 Erreur login:', error);
    throw error;
  }
};

