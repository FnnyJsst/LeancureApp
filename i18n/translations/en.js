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
      },
      readOnly: {
        readOnly: "Do you want to set channel management to read-only?",
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
    password: "Define a password",
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
    required: "This field is required",
    titleRequired: "Title is required",
    invalidUrl: "Invalid URL",
    invalidResponse: "Invalid response format - missing data",
    errorLoadingLoginInfo: "Error loading login info",
    passwordMismatch: "Passwords do not match",
    passwordTooShort: "Password must be at least 6 characters",
    success: "Success",
    passwordSuccess: "Password has been set successfully",
    error: "Error",
    enterPassword: "Please enter a password",
    fieldsRequired: "All fields are required",
    errorLoadingChannels: "Error loading channels",
    invalidCredentials: "Invalid credentials",
    loginFailed: "Login failed",
    errorSavingLoginInfo: "Error saving login info:",
    errorLoadingFile: "Error loading file:",
    noCredentialsFound: "No credentials found",
    errorSendingMessage: "Error sending message:",
    errorSavingPassword: "Error saving password",
    errorLoadingPassword: "Error loading password",
    incorrectPassword: "Incorrect password",
    errorCleaningPassword: "Error cleaning password",
    incorrectPassword: "Incorrect password",
    noGroupsFound: "No groups found",
    serverError: "Server error",
    messageNotSaved: "Message not saved",
    messageNotDeleted: "Message not deleted",
    messageFileNotFound: "Message file not found",
    errorFetchingMessages: "Error fetching messages",
    webSocketNotConnected: "WebSocket not connected",
    errorSendingSubscription: "Error sending subscription",
    webSocketUrlNotDefined: "WebSocket URL not defined",
    errorParsingMessage: "Error parsing message",
    errorWebSocket: "Error WebSocket",
    errorLoadingUserData: "Error loading user data",
    noChannelSelected: "No channel selected",
    invalidFile: "Invalid file",
    invalidMessageText: "Invalid message text",
    noCredentialsFound: "No credentials found",
    invalidChannel: "Invalid channel",
    invalidMessageEdit: "Invalid message for editing",
    errorEditingMessage: "Error editing message",
    messageSendError: "Error sending message",
    connectionError: "Error connecting to server",
    messageParsingError: "Error parsing message",
    subscriptionError: "Error subscribing to channels",
    webSocketClosed: "Server connection closed",
    channelSelectError: "Error selecting channel",
    inputFocusError: "Error focusing input",
    fetchMessagesError: "Error fetching messages",
    emptyMessage: "Message cannot be empty",
    fileTypeNotAllowed: "File type not allowed",
    filePickError: "Error picking file",
    fileProcessingError: "Error processing file",
    noCurrentChannel: "No current channel",
    channelMismatch: "Channel mismatch",
    noMessageContent: "No message content",
    messageValidationError: "Message validation error",
    messageProcessingError: "Message processing error",
    messageFormatError: "Message format error",
    appInitializationError: "Error initializing application",
    appNavigationError: "Navigation error",
    appLogoutError: "Error during logout",
    appSettingsError: "Error accessing settings",
    appFontLoadingError: "Error loading fonts",
    appSecureStoreError: "Error accessing secure storage",
    appDecryptionError: "Error decrypting data",
    noGroupsFound: "No groups found",
    messageNotDeleted: "Message not deleted",
    messageNotEdited: "Message not edited",
    hashPasswordError: "Error hashing password",
    verifyPasswordError: "Error verifying password",
    addressCannotBeEmpty: "Address cannot be empty",
    invalidUrlFormat: "Invalid URL format",
    invalidProtocol: "The protocol must be http or https",
    saveServerAddressError: "Error saving the server address",
    enterUrl: "Please enter an URL",
    invalidUrl: "Invalid URL",
    errorLoadingChannels: "Error loading channels",
    sessionExpired: "Session expired. Please reconnect.",
    loginFailed: "Login failed",
    errorDuringImport: "Error during import",
    errorDuringDownload: "Error during download",
    noChannelsFound: "No channels found",
    couldNotDecrypt: "Could not decrypt data",
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
      message: 'Read-only access prevents users from modifying messages in channels. Only administrators can disable this option.'
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
}