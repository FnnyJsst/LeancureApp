// We define the error types
export const ErrorTypes = {
  CONNECTION: 'connection',
  WEBSOCKET: 'websocket',
  MESSAGE: 'message',
  AUTHENTICATION: 'authentication',
  PARSING: 'parsing'
};

export const handleWebSocketError = (error, type, context, onError) => {
  // We format the error
  const formattedError = {
    type,
    context,
    message: error.message || 'Erreur inconnue',
    details: error,
    timestamp: new Date().toISOString()
  };

  // We log the error
  console.error(`🔴 [${type}] Erreur ${context}:`, formattedError);

  // We propagate the error via callback
  if (onError) onError(formattedError);

  return formattedError;
};