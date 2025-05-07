import { Logger } from './logger';

// Error types
export const ErrorType = {
  API: 'api',
  WEBSOCKET: 'websocket',
  AUTH: 'auth',
  VALIDATION: 'validation',
  SYSTEM: 'system'
};

// Severity levels
export const ErrorSeverity = {
  INFO: 'info',      // Non-critical information (optional display)
  WARNING: 'warning', // Warning (recommended display)
  ERROR: 'error',    // Recoverable error (required display)
  CRITICAL: 'critical' // Blocking error (required interruption)
};

/**
 * @description Centralized error handler
 * @param {Error|string} error - The error or error message
 * @param {string} source - Where the error comes from (ex: "api.login")
 * @param {object} options - Additional options
 * @returns {object} Formatted error
 */
export const handleError = (error, source, options = {}) => {
  const {
    type = ErrorType.SYSTEM,
    showAlert = false,
    setAlertMessage = null
  } = options;

  // Format the error
  const formattedError = {
    message: typeof error === 'string' ? error : error.message || 'Unknown error',
    source,
    type,
    timestamp: new Date().toISOString(),
    originalError: error
  };

  // If there is an alert, we use the alert message
  // If there is no alert, we use the error message
  if (showAlert && setAlertMessage) {
    setAlertMessage(formattedError.message);
  } else {
    Logger.error(source, formattedError.message, error);
  }

  return formattedError;
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