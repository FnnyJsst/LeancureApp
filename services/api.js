import axios from 'axios';

const API_URL = 'http://fannyserver.rasp/ic.php';

export const loginApi = async (contractNumber, login, password) => {
  try {
    const response = await axios.post(API_URL, {
      cmd: [{
        accounts: {
          loginmsg: {
            get: {
              contractnumber: contractNumber,
              login: login,
              password: password
            }
          }
        }
      }]
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};