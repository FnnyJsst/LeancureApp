import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import DocumentPreviewModal from '../../../../components/modals/chat/DocumentPreviewModal';
import { fetchMessageFile } from '../../../../services/api/messageApi';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useCredentials } from '../../../../hooks/useCredentials';
import * as ScreenOrientation from 'expo-screen-orientation';
import CustomAlert from '../../../../components/modals/webviews/CustomAlert';

// Mock des dépendances
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file://test-directory/',
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  EncodingType: { Base64: 'Base64' }
}));

jest.mock('expo-sharing', () => ({
  shareAsync: jest.fn().mockResolvedValue(undefined),
  isAvailableAsync: jest.fn().mockResolvedValue(true)
}));

jest.mock('../../../../services/api/messageApi', () => ({
  fetchMessageFile: jest.fn()
}));

jest.mock('../../../../hooks/useCredentials', () => ({
  useCredentials: jest.fn()
}));

jest.mock('expo-screen-orientation', () => ({
  getOrientationAsync: jest.fn().mockResolvedValue(1),
  lockAsync: jest.fn().mockResolvedValue(undefined),
  unlockAsync: jest.fn().mockResolvedValue(undefined),
  OrientationLock: {
    LANDSCAPE: 'LANDSCAPE',
    PORTRAIT: 'PORTRAIT'
  }
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => key
  })
}));

jest.mock('../../../../hooks/useDeviceType', () => ({
  useDeviceType: jest.fn().mockReturnValue({
    isSmartphone: false,
    isLandscape: false,
    isLowResTablet: false,
    isLowResTabletPortrait: false,
    isLowResTabletLandscape: false
  })
}));

// Ajouter le mock pour CustomAlert
jest.mock('../../../../components/modals/webviews/CustomAlert', () => ({
  show: jest.fn()
}));

// Mock pour console.error
const mockConsoleError = jest.fn();
console.error = mockConsoleError;

describe("DocumentPreviewModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCredentials.mockReturnValue({
      credentials: { token: 'test-token' },
      isLoading: false
    });
  });

  it("devrait afficher le prévisualiseur de document avec un fichier PDF", () => {
    const props = {
      visible: true,
      onClose: jest.fn(),
      fileName: 'test.pdf',
      fileSize: '1000',
      fileType: 'pdf',
      base64: 'test-base64-content',
      messageId: '123',
      channelId: '456'
    };

    const { getByText } = render(<DocumentPreviewModal {...props} />);
    expect(getByText('PDF')).toBeTruthy();
  });

  it("devrait afficher un prévisualiseur d'image pour les fichiers images", () => {
    const props = {
      visible: true,
      onClose: jest.fn(),
      fileName: 'test.jpg',
      fileSize: '1000',
      fileType: 'jpg',
      base64: 'test-base64-content',
      messageId: '123',
      channelId: '456'
    };

    const { getByText } = render(<DocumentPreviewModal {...props} />);
    expect(getByText('Image')).toBeTruthy();
  });

  it("devrait charger l'image en haute qualité quand visible", async () => {
    fetchMessageFile.mockResolvedValue('high-quality-base64');

    const props = {
      visible: true,
      onClose: jest.fn(),
      fileName: 'test.jpg',
      fileSize: '1000',
      fileType: 'jpg',
      base64: 'test-base64-content',
      messageId: '123',
      channelId: '456'
    };

    render(<DocumentPreviewModal {...props} />);

    await waitFor(() => {
      expect(fetchMessageFile).toHaveBeenCalledWith('123', { channelid: '456' }, { token: 'test-token' });
    });
  });

  it("devrait gérer les erreurs lors du chargement de l'image", async () => {
    fetchMessageFile.mockRejectedValue(new Error("Erreur de chargement"));

    const props = {
      visible: true,
      onClose: jest.fn(),
      fileName: 'test.jpg',
      fileSize: '1000',
      fileType: 'jpg',
      base64: 'test-base64-content',
      messageId: '123',
      channelId: '456'
    };

    render(<DocumentPreviewModal {...props} />);

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        '[DocumentPreview] Error while loading the high quality image:',
        expect.any(Error)
      );
    });
  });

  it("devrait télécharger le fichier quand on clique sur le bouton de téléchargement", async () => {
    const props = {
      visible: true,
      onClose: jest.fn(),
      fileName: 'test.pdf',
      fileSize: '1000',
      fileType: 'pdf',
      base64: 'test-base64-content',
      messageId: '123',
      channelId: '456'
    };

    const { getByText } = render(<DocumentPreviewModal {...props} />);

    fireEvent.press(getByText('buttons.download'));

    await waitFor(() => {
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
        'file://test-directory/test.pdf',
        'test-base64-content',
        { encoding: 'Base64' }
      );
      expect(Sharing.shareAsync).toHaveBeenCalledWith('file://test-directory/test.pdf');
    });
  });

  it("devrait afficher un prévisualiseur CSV pour les fichiers CSV", () => {
    const props = {
      visible: true,
      onClose: jest.fn(),
      fileName: 'test.csv',
      fileSize: '1000',
      fileType: 'csv',
      base64: 'dGVzdCxkYXRhCjEsMgozLDQ=', // Contenu CSV encodé en base64
      messageId: '123',
      channelId: '456'
    };

    const { getByText } = render(<DocumentPreviewModal {...props} />);
    expect(getByText('CSV')).toBeTruthy();
  });

  it("devrait verrouiller l'orientation de l'écran quand le modal est visible", async () => {
    const props = {
      visible: true,
      onClose: jest.fn(),
      fileName: 'test.pdf',
      fileSize: '1000',
      fileType: 'pdf',
      base64: 'test-base64-content'
    };

    render(<DocumentPreviewModal {...props} />);

    await waitFor(() => {
      expect(ScreenOrientation.lockAsync).toHaveBeenCalled();
    });
  });

  it("devrait déverrouiller l'orientation de l'écran quand le modal est fermé", async () => {
    const props = {
      visible: false,
      onClose: jest.fn(),
      fileName: 'test.pdf',
      fileSize: '1000',
      fileType: 'pdf',
      base64: 'test-base64-content'
    };

    render(<DocumentPreviewModal {...props} />);

    await waitFor(() => {
      expect(ScreenOrientation.unlockAsync).toHaveBeenCalled();
    });
  });

  it("devrait fermer le modal quand on clique sur le bouton de fermeture", () => {
    const onClose = jest.fn();
    const props = {
      visible: true,
      onClose,
      fileName: 'test.pdf',
      fileSize: '1000',
      fileType: 'pdf',
      base64: 'test-base64-content'
    };

    const { getByTestId } = render(<DocumentPreviewModal {...props} />);
    fireEvent.press(getByTestId('close-button'));
    expect(onClose).toHaveBeenCalled();
  });
});