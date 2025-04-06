// i18n/translations/fr.js
export default {
  screens: {
    enterSettings: "Veuillez entrer dans les paramètres pour importer des chaînes",
    useButton: "Utilisez le bouton en haut à droite pour importer des chaînes",
    selectChannel: "Sélectionnez un canal pour commencer à discuter",
  },

  sidebar: {
    search: "Rechercher un canal",
    groups: "Groupes",
    settings: "Paramètres",
    loading: "Chargement..."
  },

  alerts: {
    information: "Information",
    allChannelsAlreadyImported: "Toutes les chaînes sont déjà importées",
  },

  auth: {
    signIn: "Connectez-vous à votre compte",
    contractNumber: "Entrez votre numéro de contrat",
    login: "Entrez votre identifiant",
    password: "Entrez votre mot de passe",
    rememberMe: "Se souvenir de moi",
  },

  messages: {
    typeMessage: "Tapez votre message ici...",
    SelectAChannel: "Sélectionnez un canal pour commencer à discuter",
    Me: "Moi",
    GroupWithoutName: "Groupe sans nom",
    ChannelWithoutName: "Canal sans nom",
  },

  dateTime: {
    today: "Aujourd'hui",
    yesterday: "Hier",
    at: "à",
    justNow: "À l'instant",
    minutes: "il y a {{count}} minute",
    minutes_plural: "il y a {{count}} minutes",
    hours: "il y a {{count}} heure",
    hours_plural: "il y a {{count}} heures",
    days: "il y a {{count}} jour",
    days_plural: "il y a {{count}} jours"
  },

  months: {
    full: {
      1: "Janvier",
      2: "Février",
      3: "Mars",
      4: "Avril",
      5: "Mai",
      6: "Juin",
      7: "Juillet",
      8: "Août",
      9: "Septembre",
      10: "Octobre",
      11: "Novembre",
      12: "Décembre"
    },
    short: {
      1: "Jan",
      2: "Fév",
      3: "Mar",
      4: "Avr",
      5: "Mai",
      6: "Juin",
      7: "Juil",
      8: "Août",
      9: "Sep",
      10: "Oct",
      11: "Nov",
      12: "Déc"
    }
  },

  modals: {
    messages: {
      logout: {
        logoutAutomatically: "Déconnexion automatique après",
        never: "Jamais",
        after2h: "Après 2 heures",
        after6h: "Après 6 heures",
        after12h: "Après 12 heures",
        after24h: "Après 24 heures",
      },
    },
    webview: {
      channelTitle: "Entrez le titre de la chaîne",
      channelUrl: "Entrez l'URL de la chaîne",
      import: {
        importChannels: "Importer des chaînes",
        importUrl: "Entrez une URL",
        importFullUrl: "Importer une URL complète",
        importOffline: "Importer des chaînes en mode hors ligne",
      },
      edit: {
        editChannel: "Modifier une chaîne",
        editTitle: "Entrez le titre de la chaîne",
        editUrl: "Entrez l'URL de la chaîne",
      },
      password: {
        enterPassword: "Entrez un mot de passe",
        enterYourPassword: "Entrez votre mot de passe",
        define: "Entrez un mot de passe (6+ caractères)",
        confirm: "Confirmez le mot de passe"
      },
      refresh: {
        refreshChannels: "Actualiser les chaînes",
        never: "Jamais",
        every1min: "Toutes les minutes",
        every2min: "Toutes les 2 minutes",
        every5min: "Toutes les 5 minutes",
        every15min: "Toutes les 15 minutes",
        every30min: "Toutes les 30 minutes",
        every1h: "Toutes les heures",
        every2h: "Toutes les 2 heures",
        every3h: "Toutes les 3 heures",
        every6h: "Toutes les 6 heures",
        everyDay: "Tous les jours",
      },
      readOnly: {
        readOnly: "Voulez-vous définir la gestion des canaux en lecture seule ?",
      }
    },

    server: {
      address: "Entrez la nouvelle adresse du serveur"
    }
  },

  buttons: {
    messages: "Messages",
    webviews: "Chaînes",
    save: "Enregistrer",
    cancel: "Annuler",
    delete: "Supprimer",
    returnToTitle: "Retour à l'écran titre",
    login: "Connexion",
    set: "Définir",
    close: "Fermer",
    show: "Afficher",
    hide: "Masquer",
    no: "Non",
    yes: "Oui",
    import: "Importer",
    importing: "Importation...",
    importChannels: "Importer des chaînes",
    doNotUse: "Ne pas utiliser",
    connecting: "Connexion...",
    switchAccount: "Changer de compte",
    edit: "Modifier",
    download: "Télécharger",
    gotIt: "J'ai compris",
  },

  titles: {
    welcome: "Bienvenue",
    contractNumber: "Numéro de contrat",
    app: "Application",
    login: "Identifiant",
    password: "Définir un mot de passe",
    stayConnected: "Rester connecté",
    messages: "Messages",
    channels: "Canaux",
    security: "Sécurité",
    signIn: "Connectez-vous à votre compte",
    welcomeBack: "Bienvenue",
    noNameGroup: "Groupe sans nom",
    noNameChannel: "Canal sans nom",
  },

  settings: {
    messages: {
      Timeout: "Délai de session",
      DefineTimeout: "Définir le délai après lequel la session sera déconnectée",
    },
    webview: {
      quit: "Quitter l'application",
      quitDescription: "Retourner à l'écran d'accueil",
      management: "Gestion des canaux",
      managementDescription: "Accès aux canaux importés",
      autoRefresh: "Actualisation automatique",
      autoRefreshDescription: "Définir l'intervalle de rafraîchissement",
      readOnly: "Accès en lecture seule",
      readOnlyDescription: "Accès aux canaux sans possibilité de modification",
      password: "Mot de passe",
      passwordDescription: "Pour accéder aux paramètres",
      deleteChannel: "Êtes-vous sûr de vouloir supprimer ce canal ?",
    },
    common: {
      showHide: "Afficher/masquer",
      showHideMessages: "Afficher/masquer les messages de l'application",
      showHideDescription: "Afficher ou masquer la section messages de l'application",
      changeServer: "Changer l'adresse du serveur",
      changeServerDescription: "Modifier l'adresse du serveur de l'application",
    }
  },

  info: {
    websocketAddressWillBeUpdated: "L'adresse de connexion WebSocket est bien mise à jour",
  },

  success: {
    messageDeleted: "Message supprimé avec succès",
    serverAddressChanged: "Adresse du serveur mise à jour avec succès !",
  },

  errors: {
    required: "Ce champ est obligatoire",
    titleRequired: "Le titre est obligatoire",
    invalidUrl: "URL invalide",
    invalidResponse: "Format de réponse invalide - données manquantes",
    errorLoadingLoginInfo: "Erreur lors du chargement des informations de connexion",
    passwordMismatch: "Les mots de passe ne correspondent pas",
    passwordTooShort: "Le mot de passe doit contenir 6+ caractères",
    success: "Succès",
    passwordSuccess: "Le mot de passe a été défini avec succès",
    error: "Erreur",
    enterPassword: "Veuillez entrer un mot de passe",
    fieldsRequired: "Tous les champs doivent être renseignés",
    errorLoadingChannels: "Erreur lors du chargement des canaux",
    invalidCredentials: "Identifiants invalides",
    loginFailed: "Connexion impossible",
    errorSavingLoginInfo: "Erreur lors de l'enregistrement des informations de connexion :",
    errorLoadingFile: "Erreur lors du chargement du fichier :",
    noCredentialsFound: "Aucune information de connexion trouvée",
    errorSendingMessage: "Erreur lors de l'envoi du message :",
    errorSavingPassword: "Erreur lors de la sauvegarde du mot de passe",
    errorLoadingPassword: "Erreur lors du chargement du mot de passe",
    incorrectPassword: "Mot de passe incorrect",
    errorCleaningPassword: "Erreur lors du nettoyage du mot de passe",
    errorDeletingMessage: "Erreur lors de la suppression du message",
    incorrectPassword: "Mot de passe incorrect",
    noGroupsFound: "Aucun groupe trouvé",
    serverError: "Erreur serveur",
    messageNotSaved: "Message non enregistré",
    messageNotDeleted: "Message non supprimé",
    messageFileNotFound: "Fichier non trouvé",
    errorFetchingMessages: "Erreur lors du chargement des messages",
    webSocketNotConnected: "WebSocket non connecté",
    errorSendingSubscription: "Erreur lors de l'envoi de la souscription",
    webSocketUrlNotDefined: "URL WebSocket non définie",
    errorParsingMessage: "Erreur lors de la lecture du message",
    errorWebSocket: "Erreur WebSocket",
    errorLoadingUserData: "Erreur lors du chargement des données de l'utilisateur",
    noChannelSelected: "Aucun canal sélectionné",
    invalidFile: "Fichier invalide",
    invalidMessageText: "Message texte invalide",
    noCredentialsFound: "Aucune information de connexion trouvée",
    noDeletePermission: "Vous n'avez pas les droits pour supprimer ce message",
    invalidChannel: "Canal invalide",
    invalidMessageEdit: "Message invalide pour l'édition",
    errorEditingMessage: "Erreur lors de l'édition du message",
    messageSendError: "Erreur lors de l'envoi du message",
    connectionError: "Erreur de connexion au serveur",
    messageParsingError: "Erreur lors de l'analyse du message",
    subscriptionError: "Erreur lors de l'abonnement aux canaux",
    webSocketClosed: "Connexion au serveur fermée",
    channelSelectError: "Erreur lors de la sélection du canal",
    inputFocusError: "Erreur lors de la mise au point de l'entrée",
    fetchMessagesError: "Erreur lors de la récupération des messages",
    emptyMessage: "Le message ne peut pas être vide",
    fileTypeNotAllowed: "Type de fichier non autorisé",
    filePickError: "Erreur lors de la sélection du fichier",
    fileProcessingError: "Erreur lors du traitement du fichier",
    noCurrentChannel: "Aucun canal actuel",
    channelMismatch: "Incompatibilité de canal",
    noMessageContent: "Aucun contenu de message",
    messageValidationError: "Erreur de validation du message",
    messageProcessingError: "Erreur de traitement du message",
    messageFormatError: "Erreur de format du message",
    appInitializationError: "Erreur lors de l'initialisation de l'application",
    appNavigationError: "Erreur lors de la navigation",
    appLogoutError: "Erreur lors de la déconnexion",
    appSettingsError: "Erreur lors de l'accès aux paramètres",
    appFontLoadingError: "Erreur lors du chargement des polices",
    appSecureStoreError: "Erreur lors de l'accès au stockage sécurisé",
    appDecryptionError: "Erreur lors du déchiffrement des données",
    noGroupsFound: "Aucun groupe trouvé",
    messageNotDeleted: "Message non supprimé",
    messageNotEdited: "Message non modifié",
    hashPasswordError: "Erreur lors du hashage du mot de passe",
    verifyPasswordError: "Erreur lors de la vérification du mot de passe",
    addressCannotBeEmpty: "L'adresse ne peut pas être vide",
    invalidUrlFormat: "Format d'URL invalide",
    invalidProtocol: "Le protocole doit être http ou https",
    saveServerAddressError: "Erreur lors de la sauvegarde de l'adresse du serveur",
    enterUrl: "Veuillez entrer une URL",
    invalidUrl: "URL invalide",
    errorLoadingChannels: "Erreur lors du chargement des canaux",
    sessionExpired: "Session expirée. Veuillez vous reconnecter.",
    loginFailed: "Connexion impossible",
    errorDuringImport: "Erreur lors de l'importation",
    errorDuringDownload: "Erreur lors du téléchargement",
    noChannelsFound: "Aucune chaîne trouvée",
    couldNotDecrypt: "Impossible de déchiffrer les données",
  },

  tooltips: {
    defaultTitle: 'Information',
    defaultMessage: 'Voici une information utile pour vous aider à utiliser cette fonctionnalité.',
    autoRefresh: {
      title: 'Actualisation automatique',
      message: 'Vous pouvez configurer vos canaux pour qu\'ils s\'actualisent automatiquement à intervalle régulier. Pratique pour garder vos informations à jour sans intervention.'
    },
    readOnly: {
      title: 'Accès en lecture seule',
      message: 'Ce mode permet de visualiser les canaux importés sans possibilité de les modifier ou de les supprimer.'
    },
    password: {
      title: 'Protection par mot de passe',
      message: 'Sécurisez l\'accès à l\'application avec un mot de passe. Cette option est recommandée si vous partagez votre appareil avec d\'autres personnes.'
    },
    hideMessages: {
      title: 'Afficher/Masquer les messages',
      message: 'Vous pouvez choisir d\'afficher ou de masquer l\'utilisation des messages dans l\'application.'
    }
  },
}