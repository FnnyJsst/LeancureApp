import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useTimeout } from '../../hooks/useTimeout';
import * as SecureStore from 'expo-secure-store';

// Mock pour SecureStore
jest.mock('expo-secure-store', () => ({
    setItemAsync: jest.fn(),
    deleteItemAsync: jest.fn(),
    getItemAsync: jest.fn(),
}));

// Mock pour console.error
const mockConsoleError = jest.fn();
console.error = mockConsoleError;

describe('useTimeout', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        SecureStore.getItemAsync.mockResolvedValue(null);
    });

    it('devrait initialiser avec un intervalle de timeout nul', () => {
        const { result } = renderHook(() => useTimeout());
        expect(result.current.timeoutInterval).toBeNull();
    });

    it('devrait gérer la sélection du timeout correctement', () => {
        const { result } = renderHook(() => useTimeout());

        act(() => {
            result.current.handleTimeoutSelection('after 2 hours');
        });

        expect(result.current.timeoutInterval).toBe(7200 * 1000);
        expect(SecureStore.setItemAsync).toHaveBeenCalledWith('timeoutInterval', '7200');
    });

    it('devrait gérer la sélection "never"', () => {
        const { result } = renderHook(() => useTimeout());

        act(() => {
            result.current.handleTimeoutSelection('never');
        });

        expect(result.current.timeoutInterval).toBeNull();
        expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('timeoutInterval');
    });

    it('devrait charger l\'intervalle de timeout stocké à l\'initialisation', async () => {
        SecureStore.getItemAsync.mockResolvedValue('7200');

        const { result } = renderHook(() => useTimeout());

        await act(async () => {
            await result.current.loadTimeoutInterval();
        });

        expect(result.current.timeoutInterval).toBe(7200 * 1000);
    });

    it('devrait gérer les erreurs lors de la sauvegarde du timeout', async () => {
        const error = new Error('Storage error');
        SecureStore.setItemAsync.mockRejectedValue(error);

        const { result } = renderHook(() => useTimeout());

        await act(async () => {
            await result.current.handleTimeoutSelection('after 2 hours');
        });

        expect(mockConsoleError).toHaveBeenCalledWith(
            '[Timeout] Error while saving the timeout interval:',
            error
        );
    });

    it('devrait gérer les erreurs lors du chargement du timeout', () => {
        const error = new Error('Loading error');
        SecureStore.getItemAsync.mockRejectedValue(error);

        const { result } = renderHook(() => useTimeout());

        result.current.loadTimeoutInterval();

        return waitFor(() => {
            expect(mockConsoleError).toHaveBeenCalledWith(
                '[Timeout] Error while loading the timeout interval:',
                error
            );
        });
    });
});
