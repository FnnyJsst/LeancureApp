/**
 * Create an API request object
 * @param {Object} cmd - The command object
 * @param {string} contractNumber - The contract number
 * @returns {Object} - The API request object
 */
export const createApiRequest = (cmd, contractNumber) => ({
  "api-version": "2",
  "api-contract-number": contractNumber,
  "api-signature": "msgApiKey",
  "api-signature-hash": "sha256",
  "api-signature-timestamp": Date.now(),
  cmd: [cmd]
});

/**
 * @function cleanApiResponse
 * @description Clean an API response
 * @param {Object} response - The API response object
 * @returns {Object} - The cleaned API response object
 */

export const cleanApiResponse = (response) => {
  let cleanData = response.data;
  if (typeof response.data === 'string') {

    const jsonStart = response.data.indexOf('{');
    if (jsonStart !== -1) {
      try {
        cleanData = JSON.parse(response.data.substring(jsonStart));
      } catch (e) {
        throw new Error('Invalid JSON response');
      }
    }
  }
  return cleanData;
};