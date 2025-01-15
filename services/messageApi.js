import axios from 'axios';

const API_URL = 'http://fannyserver.rasp/ic.php';

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

    //API response
    if (response.data.status === "ok") {
      
      //If the response is ok, we get the data
      const data = response.data.cmd[0].msg_srv.client.get_account_links.data;
      return formatChannelsData(data);
    } else {
      throw new Error("Error while fetching data");
    }
  } catch (error) {
    console.error("API error:", error);
    throw error;
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

//Format the messages data
const formatMessages = (messages) => {
  if (!messages) return [];
  
  //We format the messages
  return Object.entries(messages).map(([messageId, messageData]) => ({
    id: messageId,
    title: messageData.title,
    content: messageData.message,
    savedTimestamp: messageData.savedts,
    endTimestamp: messageData.enddatets,
    fileType: messageData.filetype
  }));
};