import axios from 'axios';

const API_URL = 'http://192.168.77.101/ic.php';

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

    // Nettoyer la réponse SQL
    let cleanData = response.data;
    if (typeof response.data === 'string') {
      const jsonStart = response.data.indexOf('{"status"');
      if (jsonStart !== -1) {
        try {
          cleanData = JSON.parse(response.data.substring(jsonStart));
        } catch (e) {
          console.error('❌ Erreur parsing JSON:', e);
          return {
            status: 'error',
            error: 'Invalid JSON response'
          };
        }
      }
    }

    console.log('📥 Réponse nettoyée:', cleanData);

    if (cleanData.status === "ok") {
      const data = cleanData.cmd?.[0]?.msg_srv?.client?.get_account_links?.data;
      console.log('🔍 Data extraite:', data);
      
      if (!data) {
        console.log('❌ Pas de données dans la réponse:', cleanData);
        return {
          status: 'error',
          error: 'Invalid data structure'
        };
      }

      // Traiter les canaux publics
      const publicChannels = Object.entries(data.public || {}).map(([id, channel]) => ({
        id,
        title: channel.identifier || 'Canal sans titre',
        description: channel.description || '',
        messages: formatMessages(channel.messages)
      }));

      // Traiter les groupes privés
      const privateGroups = Object.entries(data.private?.groups || {}).map(([id, group]) => ({
        id,
        title: group.identifier || 'Groupe sans titre',
        description: group.description || '',
        rights: group.rights,
        channels: group.channels === "No channel" ? [] : Object.entries(group.channels || {}).map(([channelId, channel]) => ({
          id: channelId,
          title: channel.identifier || 'Canal sans titre',
          description: channel.description || '',
          messages: formatMessages(channel.messages)
        }))
      }));

      console.log('✅ Données formatées:', { publicChannels, privateGroups });
      
      return {
        status: 'ok',
        publicChannels,
        privateGroups
      };
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
// const formatChannelsData = (data) => {
//   try {
//     console.log('🔄 Données reçues dans formatChannelsData:', data);
    
//     // Formater les messages
//     const formatMessages = (messages) => {
//       if (!messages) return [];
//       return Object.entries(messages).map(([msgId, msg]) => ({
//         id: msgId,
//         title: msg.title,
//         message: msg.message,
//         savedTimestamp: msg.savedts,
//         endTimestamp: msg.enddatets,
//         fileType: msg.filetype
//       }));
//     };

    // Formater les canaux publics
//     const publicChannels = data.public ? Object.entries(data.public).map(([id, channel]) => ({
//       id,
//       title: channel.identifier,
//       description: channel.description,
//       messages: formatMessages(channel.messages)
//     })) : [];

//     // Formater les groupes privés et leurs canaux
//     const privateGroups = data.private?.groups ? Object.entries(data.private.groups).map(([groupId, group]) => ({
//       id: groupId,
//       title: group.identifier,
//       description: group.description,
//       rights: group.rights,
//       channels: group.channels === "No channel" ? [] :
//         Object.entries(group.channels).map(([channelId, channel]) => ({
//           id: channelId,
//           title: channel.identifier,
//           description: channel.description,
//           messages: formatMessages(channel.messages)
//         }))
//     })) : [];

//     console.log('✅ Données formatées:', { publicChannels, privateGroups });

//     return {
//       status: 'ok',
//       publicChannels,
//       privateGroups
//     };
//   } catch (error) {
//     console.error('❌ Erreur lors du formatage:', error);
//     return {
//       status: 'error',
//       error: 'Error formatting data'
//     };
//   }
// };

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

export const sendMessageApi = async (channelId, messageContent, userCredentials) => {
  try {
    const timestamp = Date.now();
    
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
                "title": "Nouveau message",
                "details": messageContent,
                "enddatets": timestamp + 99999
              }
            }
          }
        }
      ]
    };

    const response = await axios({
      method: 'POST',
      url: 'http://192.168.77.101/ic.php',
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
    console.error('🔴 Erreur envoi message:', error);
    throw error;
  }
};

export const fetchChannelMessages = async (channelId, userCredentials) => {
  try {
    const timestamp = Date.now();
    
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
              "get_account_links": {
                "accountinfos": {
                  "login": userCredentials.login,
                  "password": userCredentials.password,
                  "email": "",
                  "nom": "",
                  "prenom": ""
                },
                "msg-msgapikey": "12d0fd-e0bd67-4933ec-5ed14a-6f767b",
                "msg-contract-number": "202501121"
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

    // Extraire les messages du canal spécifique
    const allData = response.data?.cmd?.[0]?.msg_srv?.client?.get_account_links?.data;
    let channelMessages = [];

    // Chercher dans les canaux publics
    if (allData?.public?.[channelId]?.messages) {
      const messages = allData.public[channelId].messages;
      channelMessages = Object.entries(messages).map(([id, msg]) => ({
        id,
        title: msg.title,
        message: msg.message,
        savedTimestamp: msg.savedts,
        endTimestamp: msg.enddatets,
        fileType: msg.filetype || 'none'
      }));
    }

    // Chercher dans les groupes privés
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
            fileType: msg.filetype || 'none'
          }));
        }
      });
    }

    console.log(`📨 Messages trouvés pour le canal ${channelId}:`, channelMessages.length);
    return channelMessages;

  } catch (error) {
    console.error('🔴 Erreur détaillée:', error);
    return [];
  }
};

