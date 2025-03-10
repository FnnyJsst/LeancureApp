import CryptoJS from 'crypto-js';
/**
 * Create an API request object
 * @param {string} saltPath - The salt path, ex : "amaiia_msg_srv/message/add/1713024000000/"
 * @param {string} contractNumber - The contract number
 * @returns {Object} - The API request object
 */
export const createSignature = (saltPath, contractNumber) => {
  //We use the saltPath and the contractNumber to create a signature
  const hash = CryptoJS.HmacSHA256(saltPath, contractNumber);
  //We convert the hash to a hexadecimal string using the CryptoJS library
  const signature = hash.toString(CryptoJS.enc.Hex);
  return signature;
};

/**
 * @function createApiRequest
 * @description Create an API request object we can the reuse for all the API requests
 * @param {Object} cmd - The command object
 * @param {string} contractNumber - The contract number
 * @param {string} accessToken - The access token
 * @returns {Object} - The API request object
 */
export const createApiRequest = (cmd, contractNumber, accessToken = '') => {
  const timestamp = Date.now();
  const saltPath = getSaltPath(cmd, timestamp);
  const signature = createSignature(saltPath, contractNumber);

  return {
    'api-version': '2',
    'api-contract-number': contractNumber,
    'api-signature': signature,
    'api-signature-hash': 'sha256',
    'api-signature-timestamp': timestamp,
    'client-type': 'mobile',
    'client-login': 'admin',
    'client-token': '',
    'client-token-validity': '1m',
    cmd: [cmd],
  };
};

/**
 * @function getSaltPath
 * @description Get the salt path
 * @param {Object} cmd - The command object
 * @param {number} timestamp - The timestamp
 * @returns {string} - The salt path
 */
const getSaltPath = (cmd, timestamp) => {
  //Get the first key of the command object ex for a command : {"accounts":{"loginmsg":{"get":{...}}}}
  const firstKey = Object.keys(cmd)[0]; //"accounts"
  const secondKey = Object.keys(cmd[firstKey])[0]; //"loginmsg"
  const thirdKey = Object.keys(cmd[firstKey][secondKey])[0]; //"get"
  //Return the salt path "accounts/loginmsg/get/1713024000000/"
  return `${firstKey}/${secondKey}/${thirdKey}/${timestamp}/`;
};
