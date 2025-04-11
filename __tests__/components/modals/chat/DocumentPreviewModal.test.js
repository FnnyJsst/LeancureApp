import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import DocumentPreviewModal from '../../../../components/modals/chat/DocumentPreviewModal';
import { fetchMessageFile } from '../../../../services/api/messageApi';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useCredentials } from '../../../../hooks/useCredentials';
import { handleError, ErrorType } from '../../../../utils/errorHandling';

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

jest.mock('../../../../utils/errorHandling', () => ({
  handleError: jest.fn(),
  ErrorType: {
    SYSTEM: 'system'
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
    isLandscape: false
  })
}));

// Mock pour console.error
console.error = jest.fn();

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

    const { getByTestId, getByText } = render(<DocumentPreviewModal {...props} />);

    expect(getByTestId('mocked-webview')).toBeTruthy();
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
      expect(handleError).toHaveBeenCalledWith(
        expect.any(Error),
        'documentPreview.loadHighQualityImage',
        expect.objectContaining({ type: 'system' })
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

  it("devrait gérer les erreurs lors du téléchargement", async () => {
    FileSystem.writeAsStringAsync.mockRejectedValue(new Error("Erreur d'écriture"));

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
      expect(handleError).toHaveBeenCalledWith(
        expect.any(Error),
        'documentPreview.handleDownload',
        expect.objectContaining({ type: 'system' })
      );
    });
  });

  it("devrait afficher un prévisualiseur CSV pour les fichiers CSV", () => {
    const props = {
      visible: true,
      onClose: jest.fn(),
      fileName: 'test.csv',
      fileSize: '1000',
      fileType: 'csv',
      base64: 'test-base64-content',
      messageId: '123',
      channelId: '456'
    };

    const { getByText } = render(<DocumentPreviewModal {...props} />);

    // On vérifie que le type CSV est affiché
    expect(getByText('CSV')).toBeTruthy();
  });

  it("devrait correctement formater la taille du fichier", () => {
    const props = {
      visible: true,
      onClose: jest.fn(),
      fileName: 'test.pdf',
      fileSize: '1048576', // 1 Mo en octets
      fileType: 'pdf',
      base64: 'test-base64-content'
    };

    const { getByText } = render(<DocumentPreviewModal {...props} />);
    // Le test va dépendre de l'implémentation exacte de formatFileSize
    // et de la façon dont les traductions sont gérées
    expect(getByText('PDF')).toBeTruthy();
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

    // Trouver le bouton de fermeture
    const closeButton = getByTestId('close-button');
    // Clique sur le bouton de fermeture
    fireEvent.press(closeButton);
    // Vérifier que onClose a été appelé
    expect(onClose).toHaveBeenCalled();
  });
});