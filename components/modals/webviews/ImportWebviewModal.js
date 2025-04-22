import React, { useState } from 'react';
import { Modal, View, StyleSheet, ActivityIndicator } from 'react-native';
import Button from '../../buttons/Button';
import TitleModal from '../../text/TitleModal';
import InputModal from '../../inputs/InputModal';
import CustomAlert from './CustomAlert';
import { useDeviceType } from '../../../hooks/useDeviceType';
import { SIZES, COLORS, MODAL_STYLES } from '../../../constants/style';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../text/CustomText';
import { useTranslation } from 'react-i18next';
import CheckBox from '../../inputs/CheckBox';

/**
 * @component ImportWebviewModal
 * @description A component that renders a modal for importing channels
 * @param {Object} props - The properties of the component
 * @param {boolean} props.visible - Whether the modal is visible
 * @param {Function} props.onClose - The function to call when the modal is closed
 * @param {Function} props.onImport - The function to call when the channels are imported
 * @param {Array} props.selectedWebviews - The currently selected webviews
 */
const ImportWebviewModal = ({ visible, onClose, onImport, selectedWebviews = [], testID }) => {

  // Translation
  const { t } = useTranslation();

  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  // Customized hook to determine the device type and orientation
  const { isSmartphone, isSmartphoneLandscape, isTabletPortrait, isLowResTablet } = useDeviceType();

  const AVAILABLE_VIEWS = [
    {
      name: 'Production view',
      path: 'player.php?a=&screen=defaultscreen&display=disp_production&actor=produnit1'
    },
    {
      name: 'Broadcast view',
      path: 'player.php?a=&screen=defaultscreen&display=disp_broadcast&actor=produnit1'
    },
    {name: 'Quality view',
      path: 'player.php?a=&screen=defaultscreen&display=disp_quality&actor=produnit1'
    },
    {name: 'Quality view',
      path: 'player.php?a=&screen=defaultscreen&display=disp_quality&actor=qualunit1'
    },
    {name: 'Comments view',
      path: 'player.php?a=&screen=defaultscreen&display=disp_comments&actor=produnit1'
    },
    {name: 'Administration view',
      path: 'player.php?a=&screen=defaultscreen&display=disp_admin&actor=produnit1'
    },
    {name: 'Traceability view',
      path: 'player.php?a=&screen=defaultscreen&display=disp_traceability&actor=produnit1'
    },
    {name: 'PPM view',
      path: 'player.php?a=&screen=defaultscreen&display=disp_ppm&actor=produnit1'
    },

    // Ajoutez d'autres vues ici si nécessaire
  ];

  /**
   * @function validateUrl
   * @description A function to validate the URL
   * @param {string} urlToValidate - The URL to validate
   * @returns {boolean} - Whether the URL is valid
   */
  const validateUrl = (urlToValidate) => {
    const pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|' + // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    return !!pattern.test(urlToValidate);
  };

  /**
   * @function handleUrlChange
   * @description A function to handle the URL input change
   * @param {string} newUrl - The new URL
   */
  const handleUrlChange = (newUrl) => {
    setUrl(newUrl);
    setError(''); // Reset error when user types
  };

  /**
   * @function parseHtml
   * @description A function to parse the HTML to extract channels links and titles
   * @param {string} html - The HTML to parse
   * @returns {Array} - The links and titles
   */
  const parseHtml = (html) => {
    const regex = /<a[^>]+class="view"[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
    let match;
    const links = [];

    // Extract the links and titles from the HTML
    while ((match = regex.exec(html)) !== null) {
      links.push({ href: match[1], title: match[2] });
    }

    // Return the links and titles
    return links;
  };

  const generateOfflineUrls = (baseUrl) => {
    console.log('[ImportWebviewModal] Génération des URLs en mode dégradé pour:', baseUrl);
    const urls = [];
    const urlObj = new URL(baseUrl);

    // Détermine le format de l'URL
    const isSubdomainFormat = urlObj.hostname.split('.').length > 2 && !urlObj.hostname.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
    const isIpFormat = urlObj.hostname.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
    const isParamFormat = baseUrl.includes('/a/');

    // Extrait le nom de l'application selon le format
    let appName;
    if (isSubdomainFormat) {
      appName = urlObj.hostname.split('.')[0];
    } else if (isParamFormat) {
      appName = baseUrl.split('/a/')[1].split('/')[0];
    }

    AVAILABLE_VIEWS.forEach(view => {
      let fullUrl;
      if (isSubdomainFormat) {
        const baseDomain = urlObj.hostname.replace(`${appName}.`, '');
        fullUrl = `${urlObj.protocol}//${appName}.${baseDomain}/${view.path}`;
      } else if (isIpFormat) {
        // Format 3: IP directe
        const viewParams = view.path.split('?')[1];
        const cleanParams = viewParams.replace('a=&', ''); // Supprime le a=& existant
        fullUrl = `${urlObj.protocol}//${urlObj.hostname}/player.php?a=${appName}&${cleanParams}`;
      } else {
        // Format 2: modifie le paramètre 'a='
        let basePath = view.path;
        if (basePath.includes('a=&')) {
          basePath = basePath.replace('a=&', `a=${appName}&`);
        }
        if (basePath.startsWith('player.php')) {
          basePath = '/' + basePath;
        }
        fullUrl = `${urlObj.protocol}//${urlObj.hostname}${basePath}`;
      }

      urls.push({
        href: fullUrl,
        title: `${view.name} - ${appName}`
      });
    });

    console.log('[ImportWebviewModal] URLs générées:', urls);
    return urls;
  };

  /**
   * @function handleDownload
   * @description A function to handle the download of channels from URL
   */
    const handleDownload = async () => {
    console.log('[ImportWebviewModal] Début du téléchargement avec URL:', url);

    if (!url) {
      console.log('[ImportWebviewModal] Erreur: URL vide');
      setError(t('errors.enterUrl'));
      return;
    }

    if (!validateUrl(url)) {
      console.log('[ImportWebviewModal] Erreur: URL invalide');
      setError(t('errors.invalidUrl'));
      return;
    }

    setIsImporting(true);
    setError('');
    try {
      if (isChecked) {
        console.log('[ImportWebviewModal] Mode dégradé activé, génération des URLs');
        const generatedUrls = generateOfflineUrls(url);

        const newUrls = generatedUrls.filter(newUrl =>
          !selectedWebviews.some(existingUrl =>
            existingUrl.href === newUrl.href
          )
        );

        if (newUrls.length === 0) {
          console.log('[ImportWebviewModal] Aucune nouvelle URL à importer');
          setShowAlert(true);
        } else {
          console.log('[ImportWebviewModal] Import des nouvelles URLs...');
          await onImport(newUrls);
          console.log('[ImportWebviewModal] Import réussi');
          onClose();
        }
        return;
      }


      // Mode normal
      const fullUrl = `${url}/p/mes_getchannelsxml/action/display`;
      console.log('[ImportWebviewModal] Tentative de fetch avec URL complète:', fullUrl);

      const response = await fetch(fullUrl);
      console.log('[ImportWebviewModal] Réponse reçue, status:', response.status);
      console.log('[ImportWebviewModal] Headers:', response.headers);

      // We get the content type
      const contentType = response.headers.get('content-type');
      console.log('[ImportWebviewModal] Content-Type:', contentType);

      // If the content type is not defined, we throw an error
      if (!contentType) {
        console.log('[ImportWebviewModal] Erreur: Content-Type non défini');
        setError(t('errors.contentTypeNotDefined'));
        return;
      }

      let data;
      if (contentType.includes('application/json')) {
        console.log('[ImportWebviewModal] Parsing JSON...');
        data = await response.json();
        console.log('[ImportWebviewModal] Données JSON reçues:', data);
        if (!Array.isArray(data)) {
          console.log('[ImportWebviewModal] Erreur: Format de réponse invalide (pas un tableau)');
          setError(t('errors.invalidResponseFormat'));
          return;
        }
      } else if (contentType.includes('text/html')) {
        console.log('[ImportWebviewModal] Parsing HTML...');
        data = await response.text();
        console.log('[ImportWebviewModal] Données HTML reçues:', data);
      } else {
        setError(t('errors.invalidContentType'));
        return;
      }

      if (typeof data === 'string') {
        const extractedChannels = parseHtml(data);
        console.log('[ImportWebviewModal] Chaînes extraites:', extractedChannels);

        if (extractedChannels.length === 0) {
          console.log('[ImportWebviewModal] Erreur: Aucune chaîne trouvée');
          setError(t('errors.noChannelsFound'));
          return;
        }

        const newChannels = extractedChannels.filter(newChannel =>
          !selectedWebviews.some(existingChannel =>
            existingChannel.href === newChannel.href
          )
        );
        console.log('[ImportWebviewModal] Nouvelles chaînes filtrées:', newChannels);

        if (newChannels.length === 0) {
          console.log('[ImportWebviewModal] Aucune nouvelle chaîne à importer');
          setShowAlert(true);
        } else {
          console.log('[ImportWebviewModal] Import des nouvelles chaînes...');
          await onImport(newChannels);
          console.log('[ImportWebviewModal] Import réussi');
          onClose();
        }
      } else {
        console.log('[ImportWebviewModal] Erreur: Format de données invalide');
        setError(t('errors.invalidResponseFormat'));
      }
    } catch (error) {
      console.error('[ImportWebviewModal] Erreur détaillée:', error);
      console.error('[ImportWebviewModal] Stack trace:', error.stack);
      setError(t('errors.errorDuringDownload'));
    } finally {
      setIsImporting(false);
    }
  };

  const handleCloseAlert = () => {
    setShowAlert(false);
    handleClose();
  };

  /**
   * @function handleClose
   * @description A function to handle the modal close
   */
  const handleClose = () => {
    setUrl('');
    setError('');
    onClose();
  };

  return (
    <>
      <Modal
        animationType="fade"
        transparent={true}
        visible={visible}
        onRequestClose={handleClose}
        statusBarTranslucent={true}
        testID="import-modal"
      >
        <View style={MODAL_STYLES.modalContainer}>
          <View style={[
              MODAL_STYLES.content,
              isSmartphone && styles.modalContentSmartphone,
              isSmartphoneLandscape && styles.modalContentSmartphoneLandscape,
              isTabletPortrait && styles.modalContentTabletPortrait,
            ]}>
            <TitleModal title={t('modals.webview.import.importChannels')}/>
            <InputModal
              placeholder={t('modals.webview.import.importUrl')}
              value={url}
              onChangeText={handleUrlChange}
              // We set the secureTextEntry to false so the user can see the URL
              secureTextEntry={false}
              icon={
                <Ionicons
                  name="link-outline"
                  size={20}
                  color={isFocused ? COLORS.orange : COLORS.gray300}
                />
              }
            />
            {error ? (
              <View style={[
                styles.errorContainer,
              ]}>
                <Text style={[
                  styles.errorText,
                  isSmartphone && styles.smallTextSmartphone,
                ]}>{error}</Text>
              </View>
            ) : null}
            <CheckBox
              label={t('modals.webview.import.degradedImport')}
              style={styles.checkBox}
              checked={isChecked}
              onPress={() => setIsChecked(!isChecked)}
            />
            <View style={[
              MODAL_STYLES.buttonContainer,
            ]}>
              <Button
                title={t('buttons.cancel')}
                onPress={handleClose}
                backgroundColor={COLORS.gray950}
                textColor={COLORS.gray300}
                width={isSmartphone ? '23%' : '26%'}
                testID="cancel-import-button"
              />
              <Button
                title={isImporting ? t('buttons.importing') : t('buttons.import')}
                onPress={handleDownload}
                backgroundColor={COLORS.orange}
                width= '33%'
                disabled={isImporting}
                icon={isImporting ?
                  <ActivityIndicator size="small" color={COLORS.white} /> :
                  null
                }
                testID="save-import-button"
              />
            </View>
          </View>
        </View>
      </Modal>
      <CustomAlert
        visible={showAlert}
        title={t('alerts.information')}
        message={t('alerts.allChannelsAlreadyImported')}
        onClose={handleCloseAlert}
        onConfirm={handleCloseAlert}
        type="success"
      />
    </>
  );
};


const styles = StyleSheet.create({
  modalContentSmartphone: {
    width: '95%',
  },
  modalContentSmartphoneLandscape: {
    width: '50%',
  },
  modalContentTabletPortrait: {
    width: '60%',
  },

  errorContainer: {
    alignItems: 'flex-start',
    paddingHorizontal: '5%',
    marginTop: 10,
  },
  checkBox: {
    paddingVertical: 10,
  },
  errorText: {
    color: COLORS.red,
    fontSize: SIZES.fonts.errorText,
  },
  smallTextSmartphone: {
    fontSize: SIZES.fonts.errorText,
  },
});

export default ImportWebviewModal;
