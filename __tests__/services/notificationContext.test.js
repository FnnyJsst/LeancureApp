import React from 'react';
import { render, act } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import {
  NotificationProvider,
  useNotification,
  getCurrentlyViewedChannel,
  setCurrentlyViewedChannel
} from '../../services/notificationContext';

// Mock de SecureStore
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  getItemAsync: jest.fn().mockResolvedValue(null),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined)
}));

// Mock pour console
global.console = {
  ...console,
  error: jest.fn(),
  log: jest.fn()
};

// Composant test pour accéder au contexte
const TestComponent = ({ onContextReady }) => {
  const context = useNotification();
  React.useEffect(() => {
    if (context) {
      onContextReady(context);
    }
  }, [context, onContextReady]);
  return null;
};

describe('NotificationContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Réinitialiser la variable globale
    setCurrentlyViewedChannel(null);

    // Reset les mocks de SecureStore
    SecureStore.getItemAsync.mockResolvedValue(null);
    SecureStore.setItemAsync.mockResolvedValue(undefined);
    SecureStore.deleteItemAsync.mockResolvedValue(undefined);
  });

  describe('Provider et Hook', () => {
    it('devrait fournir le contexte avec les valeurs initiales', async () => {
      let capturedContext;
      const handleContextReady = (context) => {
        capturedContext = context;
      };

      const wrapper = render(
        <NotificationProvider>
          <TestComponent onContextReady={handleContextReady} />
        </NotificationProvider>
      );

      // Attendre que le useEffect s'exécute
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(capturedContext).toBeDefined();
      expect(capturedContext.activeChannelId).toBeNull();
      expect(capturedContext.lastSentMessageTimestamp).toBeNull();
      expect(capturedContext.unreadChannels).toEqual({});
      expect(typeof capturedContext.updateActiveChannel).toBe('function');
      expect(typeof capturedContext.recordSentMessage).toBe('function');
      expect(typeof capturedContext.markChannelAsUnread).toBe('function');

      wrapper.unmount();
    });

    it('devrait lancer une erreur si useNotification est utilisé en dehors du Provider', () => {
      const TestInvalidComponent = () => {
        useNotification();
        return null;
      };

      expect(() => {
        render(<TestInvalidComponent />);
      }).toThrow('useNotification must be used within a NotificationProvider');
    });
  });

  describe('getCurrentlyViewedChannel et setCurrentlyViewedChannel', () => {
    it('devrait permettre de définir et récupérer le canal actuellement affiché', () => {
      expect(getCurrentlyViewedChannel()).toBeNull();

      setCurrentlyViewedChannel('123');
      expect(getCurrentlyViewedChannel()).toBe('123');

      setCurrentlyViewedChannel(null);
      expect(getCurrentlyViewedChannel()).toBeNull();
    });

    it('devrait convertir l\'ID du canal en chaîne de caractères', () => {
      setCurrentlyViewedChannel(123);
      expect(getCurrentlyViewedChannel()).toBe('123');
    });

    it('devrait mettre à jour la variable globale si disponible', () => {
      global.currentlyViewedChannel = undefined;

      setCurrentlyViewedChannel('456');
      expect(global.currentlyViewedChannel).toBe('456');
    });
  });

  describe('updateActiveChannel', () => {
    it('devrait mettre à jour le canal actif et enregistrer le nom du canal', async () => {
      let capturedContext;
      const handleContextReady = (context) => {
        capturedContext = context;
      };

      const wrapper = render(
        <NotificationProvider>
          <TestComponent onContextReady={handleContextReady} />
        </NotificationProvider>
      );

      // Attendre que le useEffect s'exécute
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        capturedContext.updateActiveChannel('789', 'Canal Test');
      });

      expect(capturedContext.activeChannelId).toBe('789');
      expect(getCurrentlyViewedChannel()).toBe('789');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('viewedChannelName', 'Canal Test');

      wrapper.unmount();
    });

    it('devrait supprimer le nom du canal lorsque le canal actif est désactivé', async () => {
      let capturedContext;
      const handleContextReady = (context) => {
        capturedContext = context;
      };

      const wrapper = render(
        <NotificationProvider>
          <TestComponent onContextReady={handleContextReady} />
        </NotificationProvider>
      );

      // Attendre que le useEffect s'exécute
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        capturedContext.updateActiveChannel('789', 'Canal Test');
      });

      await act(async () => {
        capturedContext.updateActiveChannel(null);
      });

      expect(capturedContext.activeChannelId).toBeNull();
      expect(getCurrentlyViewedChannel()).toBeNull();
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('viewedChannelName');

      wrapper.unmount();
    });

    it('devrait marquer le canal comme lu si c\'était un canal non lu', async () => {
      // Simuler des canaux non lus préexistants
      SecureStore.getItemAsync.mockResolvedValueOnce(JSON.stringify({
        '789': { timestamp: 1234567890, count: 3 }
      }));

      let capturedContext;
      const handleContextReady = (context) => {
        capturedContext = context;
      };

      const wrapper = render(
        <NotificationProvider>
          <TestComponent onContextReady={handleContextReady} />
        </NotificationProvider>
      );

      // Attendre que le useEffect s'exécute
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Vérifier que les canaux non lus ont été chargés
      expect(capturedContext.unreadChannels).toEqual({
        '789': { timestamp: 1234567890, count: 3 }
      });

      await act(async () => {
        capturedContext.updateActiveChannel('789', 'Canal Test');
      });

      // Vérifier que le canal a été marqué comme lu
      expect(capturedContext.unreadChannels).toEqual({});
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('unreadChannels', '{}');

      wrapper.unmount();
    });
  });

  describe('recordSentMessage', () => {
    it('devrait enregistrer l\'horodatage du dernier message envoyé', async () => {
      let capturedContext;
      const handleContextReady = (context) => {
        capturedContext = context;
      };

      const wrapper = render(
        <NotificationProvider>
          <TestComponent onContextReady={handleContextReady} />
        </NotificationProvider>
      );

      // Attendre que le useEffect s'exécute
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const timestamp = 1615478520000; // 2021-03-11T15:42:00.000Z

      await act(async () => {
        capturedContext.recordSentMessage(timestamp);
      });

      expect(capturedContext.lastSentMessageTimestamp).toBe(timestamp);

      wrapper.unmount();
    });

    it('devrait utiliser Date.now() si aucun horodatage n\'est fourni', async () => {
      let capturedContext;
      const handleContextReady = (context) => {
        capturedContext = context;
      };

      // Mock Date.now()
      const originalDateNow = Date.now;
      const mockTimestamp = 1615478520000;
      Date.now = jest.fn(() => mockTimestamp);

      const wrapper = render(
        <NotificationProvider>
          <TestComponent onContextReady={handleContextReady} />
        </NotificationProvider>
      );

      // Attendre que le useEffect s'exécute
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        capturedContext.recordSentMessage();
      });

      expect(capturedContext.lastSentMessageTimestamp).toBe(mockTimestamp);

      // Restaurer Date.now
      Date.now = originalDateNow;

      wrapper.unmount();
    });
  });

  describe('markChannelAsUnread', () => {
    it('ne devrait pas marquer le canal actif comme non lu', async () => {
      let capturedContext;
      const handleContextReady = (context) => {
        capturedContext = context;
      };

      const wrapper = render(
        <NotificationProvider>
          <TestComponent onContextReady={handleContextReady} />
        </NotificationProvider>
      );

      // Attendre que le useEffect s'exécute
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        capturedContext.updateActiveChannel('123', 'Canal Actif');
      });

      await act(async () => {
        capturedContext.markChannelAsUnread('123');
      });

      expect(capturedContext.unreadChannels).toEqual({});

      wrapper.unmount();
    });

    it('devrait marquer un canal comme non lu et incrémenter le compteur', async () => {
      let capturedContext;
      const handleContextReady = (context) => {
        capturedContext = context;
      };

      // Mock Date.now()
      const originalDateNow = Date.now;
      const mockTimestamp = 1615478520000;
      Date.now = jest.fn(() => mockTimestamp);

      const wrapper = render(
        <NotificationProvider>
          <TestComponent onContextReady={handleContextReady} />
        </NotificationProvider>
      );

      // Attendre que le useEffect s'exécute
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        capturedContext.markChannelAsUnread('456');
      });

      expect(capturedContext.unreadChannels).toEqual({
        '456': { timestamp: mockTimestamp, count: 1 }
      });

      // Marquer à nouveau le même canal
      await act(async () => {
        capturedContext.markChannelAsUnread('456');
      });

      // Le compte ne devrait pas changer car nous substituons l'ancien état
      expect(capturedContext.unreadChannels).toEqual({
        '456': { timestamp: mockTimestamp, count: 1 }
      });

      // Restaurer Date.now
      Date.now = originalDateNow;

      wrapper.unmount();
    });

    it('devrait supprimer un canal de la liste des non lus lorsque marqué comme lu', async () => {
      let capturedContext;
      const handleContextReady = (context) => {
        capturedContext = context;
      };

      // Simuler des canaux non lus préexistants
      SecureStore.getItemAsync.mockResolvedValueOnce(JSON.stringify({
        '456': { timestamp: 1234567890, count: 2 }
      }));

      const wrapper = render(
        <NotificationProvider>
          <TestComponent onContextReady={handleContextReady} />
        </NotificationProvider>
      );

      // Attendre que le useEffect s'exécute
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        capturedContext.markChannelAsUnread('456', false);
      });

      expect(capturedContext.unreadChannels).toEqual({});
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('unreadChannels', '{}');

      wrapper.unmount();
    });
  });

  describe('Chargement et sauvegarde des états', () => {
    it('devrait charger l\'état des canaux non lus depuis SecureStore au montage', async () => {
      const unreadChannels = {
        '123': { timestamp: 1234567890, count: 1 },
        '456': { timestamp: 1234567891, count: 3 }
      };

      SecureStore.getItemAsync.mockResolvedValueOnce(JSON.stringify(unreadChannels));

      let capturedContext;
      const handleContextReady = (context) => {
        capturedContext = context;
      };

      const wrapper = render(
        <NotificationProvider>
          <TestComponent onContextReady={handleContextReady} />
        </NotificationProvider>
      );

      // Attendre que le useEffect s'exécute
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('unreadChannels');
      expect(capturedContext.unreadChannels).toEqual(unreadChannels);

      wrapper.unmount();
    });

    it('devrait gérer les erreurs lors du chargement de l\'état depuis SecureStore', async () => {
      SecureStore.getItemAsync.mockRejectedValueOnce(new Error('Failed to load'));

      const wrapper = render(
        <NotificationProvider>
          <TestComponent onContextReady={() => {}} />
        </NotificationProvider>
      );

      // Attendre que le useEffect s'exécute
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(console.error).toHaveBeenCalledWith(
        '❌ Erreur lors du chargement des canaux non lus:',
        expect.any(Error)
      );

      wrapper.unmount();
    });

    it('devrait nettoyer les ressources lors du démontage', async () => {
      const { unmount } = render(
        <NotificationProvider>
          <TestComponent onContextReady={() => {}} />
        </NotificationProvider>
      );

      // Attendre que le useEffect s'exécute
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        unmount();
      });

      expect(getCurrentlyViewedChannel()).toBeNull();
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('viewedChannelName');
    });
  });
});