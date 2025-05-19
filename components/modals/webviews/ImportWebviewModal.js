import React, { useState } from 'react';
import { Modal, View, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
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
import TooltipModal from './TooltipModal';

/**
 * @component ImportWebviewModal
 * @description A component that renders a modal for importing channels
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
  const [showTooltip, setShowTooltip] = useState(false);

  // Customized hook to determine the device type and orientation
  const { isSmartphone, isSmartphonePortrait, isSmartphoneLandscape, isTabletPortrait, isLowResTabletPortrait, isLowResTabletLandscape } = useDeviceType();

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

    //We can add more views here if needed
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
    const urls = [];
    const urlObj = new URL(baseUrl);

    // Determine the format of the URL
    const isSubdomainFormat = urlObj.hostname.split('.').length > 2 && !urlObj.hostname.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
    const isIpFormat = urlObj.hostname.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
    const isParamFormat = baseUrl.includes('/a/');

    // Extract the application name according to the format
    let appName;
    if (isSubdomainFormat) {
      appName = urlObj.hostname.split('.')[0];
    } else if (isParamFormat) {
      appName = baseUrl.split('/a/')[1].split('/')[0];
    } else if (isIpFormat) {
      // Pour les adresses IP, on extrait le nom de l'application entre a= et &
      const match = baseUrl.match(/a=([^&]+)/);
      if (match && match[1]) {
        appName = match[1];
      }
    }

    // Validation du nom d'application
    if (!appName || appName === 'undefined') {
      // If no app name is found, we set the error message
      setError(t('errors.wrongUrlFormat'));
      return [];
    }

    AVAILABLE_VIEWS.forEach(view => {
      let fullUrl;
      if (isSubdomainFormat) {
        const baseDomain = urlObj.hostname.replace(`${appName}.`, '');
        fullUrl = `${urlObj.protocol}//${appName}.${baseDomain}/${view.path}`;
      } else if (isIpFormat) {
        // Format 1: Direct IP
        const viewParams = view.path.split('?')[1];
        const cleanParams = viewParams.replace('a=&', ''); // Supprime le a=& existant
        fullUrl = `${urlObj.protocol}//${urlObj.hostname}/player.php?a=${appName}&${cleanParams}`;
      } else {
        // Format 2: Modify the 'a=' parameter
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
        title: `${view.name} (${appName})` // Format plus clair pour le nom
      });
    });

    return urls;
  };

  /**
   * @function handleDownload
   * @description A function to handle the download of channels from URL
   */
    const handleDownload = async () => {

    if (!url) {
      setError(t('errors.enterUrl'));
      return;
    }

    if (!validateUrl(url)) {
      setError(t('errors.invalidUrl'));
      return;
    }

    setIsImporting(true);
    setError('');
    try {
      if (isChecked) {
        const generatedUrls = generateOfflineUrls(url);

        const newUrls = generatedUrls.filter(newUrl =>
          !selectedWebviews.some(existingUrl =>
            existingUrl.href === newUrl.href
          )
        );

        if (newUrls.length === 0) {
          setShowAlert(true);
        } else {
          await onImport(newUrls);
          onClose();
        }
        return;
      }


      // Normal mode
      const fullUrl = `${url}/p/mes_getchannelsxml/action/display`;

      const response = await fetch(fullUrl);

      // We get the content type
      const contentType = response.headers.get('content-type');

      // If the content type is not defined, we throw an error
      if (!contentType) {
        setError(t('errors.contentTypeNotDefined'));
        return;
      }

      let data;
      if (contentType.includes('application/json')) {
        data = await response.json();
        if (!Array.isArray(data)) {
          setError(t('errors.invalidResponseFormat'));
          return;
        }
      } else if (contentType.includes('text/html')) {
        data = await response.text();
      } else {
        setError(t('errors.invalidContentType'));
        return;
      }

      if (typeof data === 'string') {
        const extractedChannels = parseHtml(data);

        if (extractedChannels.length === 0) {
          setError(t('errors.noChannelsFound'));
          return;
        }

        const newChannels = extractedChannels.filter(newChannel =>
          !selectedWebviews.some(existingChannel =>
            existingChannel.href === newChannel.href
          )
        );

        if (newChannels.length === 0) {
          setShowAlert(true);
        } else {
          await onImport(newChannels);
          onClose();
        }
      } else {
        setError(t('errors.invalidResponseFormat'));
      }
    } catch (error) {
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
              isLowResTabletPortrait && styles.modalContentLowResTabletPortrait,
              isLowResTabletLandscape && styles.modalContentLowResTabletLandscape,
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
            <View style={styles.checkboxContainer}>
              <CheckBox
                label={t('modals.webview.import.degradedImport')}
                style={styles.checkBox}
                checked={isChecked}
                onPress={() => setIsChecked(!isChecked)}
              />
              <TouchableOpacity
                onPress={() => setShowTooltip(true)}
                style={styles.tooltipButton}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={isSmartphone ? 16 : 18}
                  color={COLORS.gray300}
                />
              </TouchableOpacity>
            </View>
            <View style={[
              MODAL_STYLES.buttonContainer,
            ]}>
              <Button
                title={t('buttons.cancel')}
                onPress={handleClose}
                backgroundColor={COLORS.gray950}
                textColor={COLORS.gray300}
                width={isSmartphone ? isSmartphonePortrait ? '26%' : '23%' : isLowResTabletPortrait ? '36%' : '33%'}
                testID="cancel-import-button"
              />
              <Button
                title={isImporting ? t('buttons.importing') : t('buttons.import')}
                onPress={handleDownload}
                backgroundColor={COLORS.orange}
                width= {isSmartphone ? isSmartphonePortrait ? '26%' : '23%' : isLowResTabletPortrait ? '36%' : '33%'}
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
        message={t('alerts.allChannelsAlreadyImported')}
        onClose={handleCloseAlert}
        onConfirm={handleCloseAlert}
        type="success"
      />
      <TooltipModal
        visible={showTooltip}
        onClose={() => setShowTooltip(false)}
        message={t('modals.webview.import.degradedImportTooltip')}
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
  modalContentLowResTabletPortrait: {
    width: '80%',
  },
  modalContentLowResTabletLandscape: {
    width: '50%',
  },
  errorContainer: {
    alignItems: 'flex-start',
    paddingHorizontal: '5%',
    marginTop: 10,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingLeft: '1%',
  },
  checkBox: {
    flex: 1,
  },
  tooltipButton: {
    padding: 5,
    marginLeft: 5,
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

