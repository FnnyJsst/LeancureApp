const isDevelopment = process.env.NODE_ENV === 'development';

export const Logger = {
    error: (source, message, error = null) => {
        if (isDevelopment) {
            console.error(`[${source}] ${message}`, error);
        }
        // TODO: Ajouter ici l'intégration avec un service de tracking d'erreurs
        // Exemple avec Sentry :
        // if (!isDevelopment) {
        //     Sentry.captureException(error, {
        //         extra: { source, message }
        //     });
        // }
    },

    warn: (source, message, data = null) => {
        if (isDevelopment) {
            console.warn(`[${source}] ${message}`, data);
        }
    },

    log: (source, message, data = null) => {
        if (isDevelopment) {
            console.log(`[${source}] ${message}`, data);
        }
    },

    // Méthode pour les erreurs critiques qui doivent toujours être tracées
    critical: (source, message, error = null) => {
        console.error(`[${source}] CRITICAL: ${message}`, error);
        // TODO: Ajouter ici l'intégration avec un service de tracking d'erreurs
    }
};