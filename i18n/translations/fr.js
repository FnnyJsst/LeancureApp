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

  messages: {
    loadingMessages: "Chargement des messages...",
    noMessages: "Il n'y a pas encore de messages dans ce canal",
    selectChannel: "Sélectionnez un canal pour commencer à discuter",
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
    unknownUser: "Utilisateur inconnu",
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
        degradedImport: "Importer les chaînes en mode dégradé",
        degradedImportTooltip: "Le mode dégradé permet d'importer les chaînes en mode hors ligne. Rentrez une URL en respectant l'un des formats suivants :\n\n• http(s)://LIGNE.DOMAINE\n• http(s)://LIGNE/a/DOMAINE\n• http(s)://ADRESSEIP/a/LIGNE",
      },
      edit: {
        editChannel: "Modifier une chaîne",
        editTitle: "Entrez le titre de la chaîne",
        editUrl: "Entrez l'URL de la chaîne",
      },
      password: {
        enterPassword: "Entrez un mot de passe",
        enterYourPassword: "Entrez votre mot de passe",
        define: "Entrez un mot de passe (6+ car)",
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
        refreshSettingsSaved: "Paramètres d'actualisation automatique enregistrés",
      },
      readOnly: {
        readOnly: "Voulez-vous définir la gestion des chaînes en lecture seule ?",
        settingsSaved: 'Paramètres d\'accès en lecture seule enregistrés avec succès',
      }
    },

    server: {
      address: "Entrez la nouvelle adresse du serveur",
      change: "Changer l'adresse du serveur",
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
    password: "Mot de passe",
    stayConnected: "Rester connecté",
    messages: "Messages",
    channels: "Canaux",
    security: "Sécurité",
    signIn: "Connectez-vous à votre compte",
    welcomeBack: "Bienvenue",
    noNameGroup: "Groupe sans nom",
    noNameChannel: "Canal sans nom",
    server: "Serveur",
  },

  settings: {
    messages: {
      Timeout: "Délai de session",
      DefineTimeout: "Définir le délai après lequel la session sera déconnectée",
    },
    webview: {
      quit: "Quitter l'application",
      quitDescription: "Retourner à l'écran d'accueil",
      management: "Gestion des chaînes",
      managementDescription: "Accès aux chaînes importées",
      autoRefresh: "Actualisation automatique",
      autoRefreshDescription: "Définir l'intervalle de rafraîchissement des chaînes",
      readOnly: "Accès en lecture seule",
      readOnlyDescription: "Accès aux chaînes sans possibilité de modification",
      password: "Mot de passe",
      passwordDescription: "Pour accéder aux paramètres",
      deleteChannel: "Êtes-vous sûr de vouloir supprimer cette chaîne ?",
      refreshSettingsSaved: "Paramètres d'actualisation automatique enregistrés",
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
    title: "Succès",
    messagesHidden: "Les messages ont été masqués avec succès",
    messagesShown: "Les messages ont été affichés avec succès"
  },

  errors: {
    boundary: {
      title: "Une erreur est survenue",
      message: "L'application a rencontré un problème inattendu. Veuillez réessayer.",
      retry: "Réessayer"
    },
    titleRequired: "Le titre est obligatoire",
    fieldsRequired: "Tous les champs doivent être renseignés",
    addressCannotBeEmpty: "L'adresse ne peut pas être vide",
    invalidUrlFormat: "Format d'URL invalide",
    invalidProtocol: "Protocole invalide",
    invalidUrl: "URL invalide",
    invalidCredentials: "Identifiants invalides",
    invalidResponse: "Format de réponse invalide - données manquantes",
    connectionError: "Erreur de connexion",
    loginFailed: "Connexion impossible",
    passwordMismatch: "Les mots de passe ne correspondent pas",
    passwordTooShort: "Le mot de passe doit contenir 6+ caractères",
    passwordSuccess: "Le mot de passe a été défini avec succès",
    enterPassword: "Veuillez entrer un mot de passe",
    incorrectPassword: "Mot de passe incorrect",
    noMessageContent: "Aucun contenu de message",
    messageProcessingError: "Erreur lors du traitement du message",
    messageNotSaved: "Le message n'a pas pu être sauvegardé",
    messageNotDeleted: "Le message n'a pas pu être supprimé",
    messageNotEdited: "Le message n'a pas pu être modifié",
    errorSendingMessage: "Erreur lors de l'envoi du message",
    errorDeletingMessage: "Erreur lors de la suppression du message",
    errorEditingMessage: "Erreur lors de la modification du message",
    fileTypeNotAllowed: "Type de fichier non autorisé",
    errorSelectingFile: "Erreur lors de la sélection du fichier",
    errorDownloadingFile: "Erreur lors du téléchargement du fichier",
    errorLoadingFile: "Erreur lors du chargement du fichier",
    errorLoadingImage: "Erreur lors du chargement de l'image",
    errorRenderingPreview: "Erreur lors de l'affichage de l'aperçu",
    messageFileNotFound: "Fichier du message non trouvé",
    errorCleaningSecureStore: "Erreur lors du nettoyage du stockage sécurisé",
    errorSavingLoginInfo: "Erreur lors de l'enregistrement des informations de connexion",
    errorLoadingLoginInfo: "Erreur lors du chargement des informations de connexion",
    noCredentialsFound: "Aucune information de connexion trouvée",
    errorSavingPassword: "Erreur lors de la sauvegarde du mot de passe",
    errorLoadingPassword: "Erreur lors du chargement du mot de passe",
    errorCleaningPassword: "Erreur lors du nettoyage du mot de passe",
    noGroupsFound: "Aucun groupe trouvé",
    errorLoadingChannels: "Erreur lors du chargement des canaux",
    errorDeletingWebview: "Erreur lors de la suppression de la chaîne",
    errorImportingWebviews: "Erreur lors de l'importation des chaînes",
    errorEditingWebview: "Erreur lors de la modification de la chaîne",
    errorRefreshingMessages: "Erreur lors de l'actualisation des messages",
    saveServerAddressError: "Erreur lors de la sauvegarde de l'adresse du serveur",
    websocket: {
      notConnected: "Non connecté au WebSocket",
      maxAttempts: "Nombre maximum de tentatives de connexion atteint",
      configuration: "Erreur de configuration WebSocket",
      connectionError: "Erreur de connexion WebSocket"
    },
    technicalError: "Erreur technique",
    serverError: "Erreur serveur",
    unexpectedError: "Erreur inattendue"
  },

  tooltips: {
    defaultTitle: 'Information',
    defaultMessage: 'Voici une information utile pour vous aider à utiliser cette fonctionnalité.',
    autoRefresh: {
      title: 'Actualisation automatique',
      message: 'Cette fonctionnalité permet de rafraîchir automatiquement les chaînes à intervalles réguliers.'
    },
    readOnly: {
      title: 'Accès en lecture seule',
      message: 'L\'accès en lecture seule empêche les utilisateurs de modifier les messages dans les canaux.',
    },
    password: {
      title: 'Mot de passe',
      message: 'Le mot de passe protège l\'accès aux canaux. Les utilisateurs devront le saisir pour accéder aux messages.'
    },
    hideMessages: {
      title: 'Afficher/Masquer les messages',
      message: 'Cette option permet de masquer les messages de l\'application.'
    },
    channels: {
      title: 'Gestion des chaînes',
      message: 'Cette section vous permet de gérer les chaînes et leurs paramètres d\'actualisation automatique. Configurez la fréquence de rafraîchissement selon vos besoins.'
    },
    security: {
      title: 'Sécurité des canaux',
      message: 'Dans cette section, vous pouvez configurer la sécurité des canaux en activant l\'accès en lecture seule et en définissant un mot de passe pour protéger l\'accès.'
    },
    server: {
      title: 'Configuration du serveur',
      message: 'Cette section vous permet de modifier l\'adresse du serveur de l\'application.'
    }
  },

  pagination: {
    page: "Page"
  },
}