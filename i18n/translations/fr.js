// i18n/translations/fr.js
export default {
  screens: {
    enterSettings: "Veuillez entrer dans les paramètres pour importer des chaînes",
    useButton: "Utilisez le bouton en haut à droite pour importer des chaînes"
  },

  sidebar: {
    search: "Rechercher un canal de discussion",
    groups: "Groupes",
    settings: "Paramètres",
    loading: "Chargement..."
  },

  auth: {
    signIn: "Connectez-vous à votre compte",
    contractNumber: "Entrez votre numéro de contrat",
    login: "Entrez votre identifiant",
    password: "Entrez votre mot de passe",
  },

  messages: {
    typeMessage: "Tapez votre message ici...",
    SelectAChannel: "Sélectionnez un canal pour commencer à discuter",
    Me: "Moi",
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
        importChannels: "Importer ses chaînes",
        importUrl: "Entrez une URL pour importer des chaînes",
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
    webview: "Webview",
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
    importChannels: "Importer des chaînes",
    doNotUse: "Ne pas utiliser",
  },

  titles: {
    Welcome: "Bienvenue",
    contractNumber: "Numéro de contrat",
    app: "Application",
    login: "Identifiant",
    password: "Mot de passe",
    stayConnected: "Rester connecté",
    messages: "Messages",
    channels: "Canaux",
    security: "Sécurité",
  },

  settings: {
    messages: {
      Timeout: "Délai de session",
      DefineTimeout: "Définir le délai après lequel la session sera déconnectée",
    },
    webview: {
      quit: "Quitter l'application",
      quitDescription: "Quitter l'application et retourner à l'écran d'accueil",
      management: "Gestion des canaux",
      managementDescription: "Accès aux canaux importés",
      autoRefresh: "Actualisation automatique",
      autoRefreshDescription: "Définir l'intervalle d'actualisation automatique des canaux",
      readOnly: "Accès en lecture seule",
      readOnlyDescription: "Accès aux canaux sans possibilité de modification",
      password: "Mot de passe",
      passwordDescription: "Définir un mot de passe pour accéder aux paramètres",
    },
    common: {
      showHide: "Afficher/masquer les messages",
      showHideDescription: "Afficher ou masquer la section messages de l'application",
      changeServer: "Changer l'adresse du serveur",
      changeServerDescription: "Modifier l'adresse du serveur de l'application",
    }
  },

  errors: {
    required: "Ce champ est obligatoire",
    titleRequired: "Le titre est obligatoire",
    invalidUrl: "URL invalide",
    passwordMismatch: "Les mots de passe ne correspondent pas",
    passwordTooShort: "Le mot de passe doit contenir 6+ caractères",
    success: "Succès",
    passwordSuccess: "Le mot de passe a été défini avec succès",
    error: "Erreur",
    enterPassword: "Veuillez entrer un mot de passe",
  }
}