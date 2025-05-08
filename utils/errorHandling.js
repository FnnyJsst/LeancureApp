import { Logger } from './logger';

// Error types
export const ErrorType = {
  SYSTEM: 'SYSTEM',
  CHAT: 'CHAT',
  AUTH: 'AUTH',
  NETWORK: 'NETWORK',
  APP: 'APP',
  NOTIFICATION: 'NOTIFICATION'
};

// Specific chat error codes
export const ChatErrorCodes = {
  NO_CHANNEL: 'CHAT_NO_CHANNEL',
  NO_CREDENTIALS: 'CHAT_NO_CREDENTIALS',
  INVALID_MESSAGE: 'CHAT_INVALID_MESSAGE',
  SEND_FAILED: 'CHAT_SEND_FAILED',
  DELETE_FAILED: 'CHAT_DELETE_FAILED',
  EDIT_FAILED: 'CHAT_EDIT_FAILED',
  WEBSOCKET_ERROR: 'CHAT_WEBSOCKET_ERROR',
  FILE_ERROR: 'CHAT_FILE_ERROR',
  PERMISSION_DENIED: 'CHAT_PERMISSION_DENIED'
};

// Specific app error codes
export const AppErrorCodes = {
  INITIALIZATION_FAILED: 'APP_INIT_FAILED',
  STORAGE_ERROR: 'APP_STORAGE_ERROR',
  DECRYPTION_ERROR: 'APP_DECRYPT_ERROR',
  NOTIFICATION_ERROR: 'APP_NOTIFICATION_ERROR',
  NAVIGATION_ERROR: 'APP_NAVIGATION_ERROR',
  STATE_ERROR: 'APP_STATE_ERROR',
  IMPORT_ERROR: 'APP_IMPORT_ERROR',
  SETTINGS_ERROR: 'APP_SETTINGS_ERROR'
};

// Specific notification error codes
export const NotificationErrorCodes = {
  PERMISSION_DENIED: 'NOTIFICATION_PERMISSION_DENIED',
  REGISTRATION_FAILED: 'NOTIFICATION_REGISTRATION_FAILED',
  TOKEN_ERROR: 'NOTIFICATION_TOKEN_ERROR',
  SYNC_FAILED: 'NOTIFICATION_SYNC_FAILED',
  DISPLAY_ERROR: 'NOTIFICATION_DISPLAY_ERROR',
  CHANNEL_ERROR: 'NOTIFICATION_CHANNEL_ERROR',
  SOUND_ERROR: 'NOTIFICATION_SOUND_ERROR',
  DEVICE_ID_ERROR: 'NOTIFICATION_DEVICE_ID_ERROR',
  CREDENTIALS_ERROR: 'NOTIFICATION_CREDENTIALS_ERROR',
  CONNECTION_ERROR: 'NOTIFICATION_CONNECTION_ERROR'
};

// Severity levels
export const ErrorSeverity = {
  INFO: 'info',      // Non-critical information (optional display)
  WARNING: 'warning', // Warning (recommended display)
  ERROR: 'error',    // Recoverable error (required display)
  CRITICAL: 'critical' // Blocking error (required interruption)
};

/**
 * @function handleError
 * @description Centralized error handling
 * @param {Error|string} error - The error to handle
 * @param {string} source - The source of the error
 * @param {Object} options - Error handling options
 * @returns {Object} Formatted error
 */
export const handleError = (error, source, options = {}) => {
  const {
    type = ErrorType.SYSTEM,
    showAlert = true,
    setAlertMessage = null
  } = options;

  // Determine the error code
  let errorCode = error.code || ChatErrorCodes.SYSTEM;
  let errorMessage = error.message || error;

  // Log the error for debugging
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${type}][${source}] ${errorCode}: ${errorMessage}`);
  }

  // If there is an alert, we use the alert message
  // If there is no alert, we use the error message
  if (showAlert && setAlertMessage) {
    setAlertMessage(errorMessage);
    // Do not log in the console if a UI alert is displayed
    return;
  }

  // Return the formatted error
  return {
    code: errorCode,
    message: errorMessage,
    source,
    type
  };
};

/**
 * @description Handle API errors
 * @param {Error} error - The error
 * @param {string} endpoint - The endpoint
 * @param {object} options - Additional options
 * @returns {object} Formatted error
 */
export const handleApiError = (error, endpoint, options = {}) => {
  const apiError = {
    message: error.message || 'API Error',
    endpoint,
    status: error.response?.status,
    statusText: error.response?.statusText,
    data: error.response?.data
  };

  return handleError(apiError, `api.${endpoint}`, options);
};

/**
 * @description Handle authentication errors
 * @param {Error} error - The error
 * @param {string} action - The action
 * @param {object} options - Additional options
 * @returns {object} Formatted error
 */
export const handleAuthError = (error, action, options = {}) => {
  return handleError(
    error,
    `auth.${action}`,
    { severity: ErrorSeverity.ERROR, toast: true, ...options }
  );
};