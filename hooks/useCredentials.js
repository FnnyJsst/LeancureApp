import { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

export const useCredentials = () => {
    const [credentials, setCredentials] = useState(null);
    const [userRights, setUserRights] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadUserData = async () => {
            try {
                const [credentialsStr, rightsStr] = await Promise.all([
                    SecureStore.getItemAsync('userCredentials'),
                    SecureStore.getItemAsync('userRights')
                ]);

                if (credentialsStr) {
                    const parsedCredentials = JSON.parse(credentialsStr);
                    setCredentials(parsedCredentials);
                    setUserRights(rightsStr ? JSON.parse(rightsStr) : null);
                }
            } catch (error) {
                console.error('[Credentials] Error while loading user data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadUserData();
    }, []);

    return { credentials, userRights, isLoading };
};
