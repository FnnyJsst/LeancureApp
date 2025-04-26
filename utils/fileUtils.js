/**
 * @function formatFileSize
 * @description Format the file size to display in the chat
 * @param {number} bytes - The size of the file in bytes
 * @param {Object} options - The options of the format
 * @returns {string} The formatted file size
 */
export const formatFileSize = (bytes, options = {}) => {
  const {
    startWithBytes = false,  // If we want to start with bytes
    precision = 1,           // Number of decimals
    defaultUnit = 'Ko'       // Default unit
  } = options;

  // If the value is a string, try to convert it to a number
  if (typeof bytes === 'string') {
    bytes = parseFloat(bytes);
  }
  // If the value is not a valid number
  if (!bytes || isNaN(bytes) || bytes === 0) {
    return '0 ' + defaultUnit;
  }

  const units = startWithBytes ? ['B', 'Ko', 'Mo', 'Go'] : ['Ko', 'Mo', 'Go'];
  let size = startWithBytes ? bytes : bytes / 1024;
  let unitIndex = startWithBytes ? 0 : 0;

  // For very small files
  if (size < 0.1) {
    return '0.1 ' + units[unitIndex];
  }
  // Conversion to the higher units if necessary
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  // Formatting the result
  if (size < 10) {
    return `${size.toFixed(precision)} ${units[unitIndex]}`;
  }

  return `${Math.round(size)} ${units[unitIndex]}`;
};

/**
 * @function formatTimestamp
 * @description Format the timestamp to display in the chat message
 * @param {string} timestamp - The timestamp to format
 * @returns {string} The formatted timestamp
 */
export const formatTimestamp = (timestamp) => {
  if (!timestamp) {return '';}
  const date = new Date(parseInt(timestamp, 10));
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};