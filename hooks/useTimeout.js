import { useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { handleError, ErrorType } from '../utils/errorHandling';

export const useTimeout = () => {
    const [timeoutInterval, setTimeoutInterval] = useState(null);

    /**
   * @function gettimeoutInSeconds
   * @description Gets the timeout in seconds
   * @param {string} value - The value to get
   * @returns {number} - The timeout in seconds
   */
    const getTimeoutInSeconds = (value) => {
        switch (value) {
            case 'after 2 hours': return 7200;
            case 'after 6 hours': return 21600;
            case 'after 12 hours': return 43200;
            case 'after 24 hours': return 86400;
            case 'never': return null;
            default: return null;
        }
    };

    /**
   * @function handleTimeoutSelection
   * @description Handles the selection of the timeout
   * @param {string} value - The value to handle
   * @returns {void}
   */
    const handleTimeoutSelection = (value) => {
        const timeoutInSeconds = getTimeoutInSeconds(value);

        if (value === 'never') {
            setTimeoutInterval(null);
            try {
                SecureStore.deleteItemAsync('timeoutInterval');
            } catch (error) {
                handleError(error, 'timeout.delete', {
                    type: ErrorType.SYSTEM,
                    userMessageKey: 'errors.timeout.delete',
                    silent: true
                });
            }
        } else {
            setTimeoutInterval(timeoutInSeconds * 1000);
            try {
                SecureStore.setItemAsync('timeoutInterval', String(timeoutInSeconds));
            } catch (error) {
                handleError(error, 'timeout.save', {
                    type: ErrorType.SYSTEM,
                    userMessageKey: 'errors.timeout.save',
                    silent: true
                });
            }
        }
    };

    const loadTimeoutInterval = useCallback(async () => {
        try {
            const storedTimeout = await SecureStore.getItemAsync('timeoutInterval');
            if (storedTimeout) {
                setTimeoutInterval(Number(storedTimeout) * 1000);
            }
        } catch (error) {
            handleError(error, 'timeout.load', {
                type: ErrorType.SYSTEM,
                userMessageKey: 'errors.timeout.load',
                silent: true
            });
        }
    }, []);

    return {
        timeoutInterval,
        handleTimeoutSelection,
        loadTimeoutInterval,
    };
};
