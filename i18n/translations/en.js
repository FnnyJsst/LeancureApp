// i18n/translations/en.js
export default {
  screens: {
    enterSettings: "Please enter settings to import channels",
    useButton: "Use the top right button to import channels",
    selectChannel: "Select a channel to start chatting",
  },

  sidebar: {
    search: "Search a channel",
    groups: "Groups",
    settings: "Settings",
    loading: "Loading..."
  },

  messages: {
    loadingMessages: "Loading messages...",
    noMessages: "There are no messages in this channel yet",
    selectChannel: "Select a channel to start chatting",
  },

  alerts: {
    information: "Information",
    allChannelsAlreadyImported: "All channels already imported",
  },

  auth: {
    signIn: "Sign in to your account",
    contractNumber: "Enter your contract number",
    login: "Enter your login",
    password: "Enter your password",
    rememberMe: "Remember me",
  },

  messages: {
    typeMessage: "Type your message here...",
    SelectAChannel: "Select a channel to start chatting",
    Me: "Me",
    GroupWithoutName: "Group without name",
    ChannelWithoutName: "Channel without name",
    unknownUser: "Unknown user",
  },

  dateTime: {
    today: "Today",
    yesterday: "Yesterday",
    at: "at",
    justNow: "Just now",
    minutes: "{{count}} minute ago",
    minutes_plural: "{{count}} minutes ago",
    hours: "{{count}} hour ago",
    hours_plural: "{{count}} hours ago",
    days: "{{count}} day ago",
    days_plural: "{{count}} days ago"
  },
  months: {
    full: {
      1: "January",
      2: "February",
      3: "March",
      4: "April",
      5: "May",
      6: "June",
      7: "July",
      8: "August",
      9: "September",
      10: "October",
      11: "November",
      12: "December"
    },
    short: {
      1: "Jan",
      2: "Feb",
      3: "Mar",
      4: "Apr",
      5: "May",
      6: "Jun",
      7: "Jul",
      8: "Aug",
      9: "Sep",
      10: "Oct",
      11: "Nov",
      12: "Dec"
    }
  },

  modals: {
    messages: {
      logout: {
        logoutAutomatically: "Logout automatically after",
        never: "Never",
        after2h: "After 2 hours",
        after6h: "After 6 hours",
        after12h: "After 12 hours",
        after24h: "After 24 hours",
      },
    },
    webview: {
      channelTitle: "Enter channel title",
      channelUrl: "Enter channel URL",
      import: {
        importChannels: "Import channels",
        importUrl: "Enter an URL",
        importFullUrl: "Import full URL",
        importOffline: "Import channels from offline mode",
        degradedImport: "Import channels in degraded mode",
        degradedImportTooltip: "This feature allows you to import channels in degraded mode. Enter an URL respecting one of the following formats: http(s)://LINE.DOMAIN OR http(s)://LINE/a/DOMAIN OR http(s)://IP/a/LINE",
      },
      edit: {
        editChannel: "Edit channel",
        editTitle: "Enter channel title",
        editUrl: "Enter channel URL",
      },
      password: {
        enterPassword: "Enter password",
        enterYourPassword: "Enter your password",
        define: "Enter a password (6+ chars)",
        confirm: "Re-enter password"
      },
      refresh: {
        refreshChannels: "Refresh channels",
        never: "Never",
        every1min: "Every 1 minute",
        every2min: "Every 2 minutes",
        every5min: "Every 5 minutes",
        every15min: "Every 15 minutes",
        every30min: "Every 30 minutes",
        every1h: "Every 1 hour",
        every2h: "Every 2 hours",
        every3h: "Every 3 hours",
        every6h: "Every 6 hours",
        everyDay: "Every day",
        refreshSettingsSaved: "Refresh settings saved",
      },
      readOnly: {
        readOnly: "Do you want to set channel management to read-only?",
        settingsSaved: 'Read-only access settings saved successfully',
      }
    },

    server: {
      address: "Enter the new server address",
      change: "Change the server address",
    }
  },

  buttons: {
    messages: "Messages",
    webviews: "Webviews",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    returnToTitle: "Return to title screen",
    login: "Login",
    set: "Set",
    close: "Close",
    show: "Show",
    hide: "Hide",
    no: "No",
    yes: "Yes",
    import: "Import",
    importing: "Importing...",
    importChannels: "Import channels",
    doNotUse: "Do not use",
    connecting: "Connecting...",
    switchAccount: "Switch account",
    edit: "Edit",
    download: "Download",
    gotIt: "Got it",
  },

  titles: {
    welcome: "Welcome",
    contractNumber: "Contract number",
    login: "Login",
    password: "Password",
    stayConnected: "Stay connected",
    messages: "Messages",
    channels: "Channels",
    security: "Security",
    app: "App",
    signIn: "Sign in to your account",
    welcomeBack: "Welcome back",
    noNameGroup: "Group without name",
    noNameChannel: "Channel without name",
    version: "Version",
    server: "Server",
  },

  settings: {
    messages: {
      Timeout: "Session timeout",
      DefineTimeout: "Define the time after which the session will be logged out",
    },
    webview: {
      quit: "Quit app",
      quitDescription: "Go back to the home screen",
      management: "Channel management",
      managementDescription: "Access to imported channels",
      autoRefresh: "Auto-refresh",
      autoRefreshDescription: "Define the auto-refresh interval for the channels",
      readOnly: "Read-only access",
      readOnlyDescription: "Access to channels without the ability to modify them",
      password: "Password",
      passwordDescription: "To access the settings",
      deleteChannel: "Are you sure you want to delete this channel?",
    },
    common: {
      showHide: "Show/hide",
      showHideMessages: "Show/hide messages of the app",
      showHideDescription: "Show/hide messages section of the app",
      changeServer: "Change server address",
      changeServerDescription: "Change the server address of the app",
    }
  },

  // New section for information messages
  info: {
    websocketAddressWillBeUpdated: "WebSocket connection address will be updated",
  },

  // New section for success messages
  success: {
    serverAddressChanged: "Server address updated successfully!",
    messageDeleted: "Message deleted successfully",
    messagesHidden: "Messages hidden successfully",
    messagesShown: "Messages shown successfully",
  },

  errors: {
    boundary: {
      title: "An error occurred",
      message: "The application encountered an unexpected problem. Please try again.",
      retry: "Try again"
    },
    titleRequired: "Title is required",
    fieldsRequired: "All fields are required",
    addressCannotBeEmpty: "Address cannot be empty",
    invalidUrlFormat: "Invalid URL format",
    invalidProtocol: "Invalid protocol",
    invalidUrl: "Invalid URL",
    invalidCredentials: "Invalid credentials",
    invalidResponse: "Invalid response format - missing data",
    connectionError: "Connection error",
    loginFailed: "Login failed",
    passwordMismatch: "Passwords do not match",
    passwordTooShort: "Password must be at least 6 characters",
    passwordSuccess: "Password has been set successfully",
    enterPassword: "Please enter a password",
    incorrectPassword: "Incorrect password",
    noMessageContent: "No message content",
    messageProcessingError: "Error processing message",
    messageNotSaved: "Message could not be saved",
    messageNotDeleted: "Message could not be deleted",
    messageNotEdited: "Message could not be edited",
    errorSendingMessage: "Error sending message",
    errorDeletingMessage: "Error deleting message",
    errorEditingMessage: "Error editing message",
    fileTypeNotAllowed: "File type not allowed",
    errorSelectingFile: "Error selecting file",
    errorDownloadingFile: "Error downloading file",
    errorLoadingFile: "Error loading file",
    errorLoadingImage: "Error loading image",
    errorRenderingPreview: "Error rendering preview",
    messageFileNotFound: "Message file not found",
    errorCleaningSecureStore: "Error cleaning secure storage",
    errorSavingLoginInfo: "Error saving login information",
    errorLoadingLoginInfo: "Error loading login information",
    noCredentialsFound: "No credentials found",
    errorSavingPassword: "Error saving password",
    errorLoadingPassword: "Error loading password",
    errorCleaningPassword: "Error cleaning password",
    noGroupsFound: "No groups found",
    errorLoadingChannels: "Error loading channels",
    errorDeletingWebview: "Error deleting channel",
    errorImportingWebviews: "Error importing channels",
    errorEditingWebview: "Error editing channel",
    errorRefreshingMessages: "Error refreshing messages",
    saveServerAddressError: "Error saving server address",
    websocket: {
      notConnected: "Not connected to WebSocket",
      maxAttempts: "Maximum connection attempts reached",
      configuration: "WebSocket configuration error",
      connectionError: "WebSocket connection error"
    },
    technicalError: "Technical error",
    serverError: "Server error",
    unexpectedError: "Unexpected error"
  },

  tooltips: {
    defaultTitle: 'Information',
    defaultMessage: 'Here is a useful information to help you use this feature.',
    autoRefresh: {
      title: 'Auto-Refresh',
      message: 'This feature allows you to automatically refresh channels at regular intervals.'
    },
    readOnly: {
      title: 'Read-Only Access',
      message: 'Read-only access prevents users from modifying messages in channels. Only administrators can disable this option.',
    },
    password: {
      title: 'Password',
      message: 'The password protects access to channels. Users will need to enter it to access messages.'
    },
    hideMessages: {
      title: 'Show/Hide Messages',
      message: 'This option allows you to temporarily hide messages in channels. Useful for focusing on a specific task.'
    },
    channels: {
      title: 'Channel Management',
      message: 'This section allows you to manage channels and their auto-refresh settings. Configure the refresh frequency according to your needs.'
    },
    security: {
      title: 'Channel Security',
      message: 'In this section, you can configure channel security by enabling read-only access and setting a password to protect access.'
    },
    server: {
      title: 'Server Configuration',
      message: 'This section allows you to modify the application server address.'
    }
  },

  pagination: {
    page: "Page"
  },
}