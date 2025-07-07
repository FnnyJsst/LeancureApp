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
    defaultUnit = 'Ko',      // Default unit
    convertToBytes = false   // If true, convert formatted size back to bytes
  } = options;

  // If the value is a string that already contains a unit (e.g. "6.8 Ko")
  if (typeof bytes === 'string') {
    const match = bytes.match(/^([\d.]+)\s*([KMG]o|[B])$/i);
    if (match) {
      const [, size, unit] = match;
      // Conversion to bytes according to the unit
      const multipliers = {
        'B': 1,
        'Ko': 1024,
        'Mo': 1024 * 1024,
        'Go': 1024 * 1024 * 1024
      };
      bytes = parseFloat(size) * multipliers[unit];
      // If we just want the conversion to bytes, we return directly
      if (convertToBytes) {
        return bytes;
      }
    } else {
      // If no unit, we just try to convert to a number
      bytes = parseFloat(bytes);
    }
  }

  // If the value is not a valid number
  if (!bytes || isNaN(bytes) || bytes === 0) {
    return convertToBytes ? 0 : '0 ' + defaultUnit;
  }

  // If we just want the conversion to bytes, we return directly
  if (convertToBytes) {
    return bytes;
  }

  const units = startWithBytes ? ['B', 'Ko', 'Mo', 'Go'] : ['Ko', 'Mo', 'Go'];
  let size = startWithBytes ? bytes : bytes / 1024;
  let unitIndex = startWithBytes ? 0 : 0;

  // Conversion to the higher units if necessary
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  // Formatting the result with appropriate precision
  if (size < 1) {
    // For very small files, we display more decimals
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  } else if (size < 10) {
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