import axios from 'axios';

const API_URL = 'http://fannyserver.rasp/ic.php';

export const fetchUserChannels = async () => {
  const timestamp = Date.now();
  
  try {
    const response = await axios.post(API_URL, {
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
    });

    if (response.data.status === "ok") {
      const data = response.data.cmd[0].msg_srv.client.get_account_links.data;
      return formatChannelsData(data);
    } else {
      throw new Error("Erreur lors de la récupération des données");
    }
  } catch (error) {
    console.error("Erreur API:", error);
    throw error;
  }
};

const formatChannelsData = (data) => {
  const formattedData = {
    publicChannels: [],
    privateGroups: [],
    unreadCount: 0
  };

  // Format the public channels
  if (data.public) {
    Object.entries(data.public).forEach(([channelId, channelData]) => {
      const unreadMessages = channelData.messages ? 
        Object.values(channelData.messages).filter(msg => !msg.read).length : 0;
      
      formattedData.unreadCount += unreadMessages;
      
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
      const group = {
        id: groupId,
        name: groupData.identifier,
        description: groupData.description,
        rights: groupData.rights,
        channels: []
      };

      if (groupData.channels && groupData.channels !== "No channel") {
        Object.entries(groupData.channels).forEach(([channelId, channelData]) => {
          const unreadMessages = channelData.messages ? 
            Object.values(channelData.messages).filter(msg => !msg.read).length : 0;
          
          formattedData.unreadCount += unreadMessages;
          
          group.channels.push({
            id: channelId,
            name: channelData.identifier,
            description: channelData.description,
            messages: formatMessages(channelData.messages),
            unreadCount: unreadMessages
          });
        });
      }

      formattedData.privateGroups.push(group);
    });
  }

  return formattedData;
};

const formatMessages = (messages) => {
  if (!messages) return [];
  
  return Object.entries(messages).map(([messageId, messageData]) => ({
    id: messageId,
    title: messageData.title,
    content: messageData.message,
    savedTimestamp: messageData.savedts,
    endTimestamp: messageData.enddatets,
    fileType: messageData.filetype
  }));
};