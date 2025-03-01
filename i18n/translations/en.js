// i18n/translations/en.js
export default {
  screens: {
    enterSettings: "Please enter settings to import channels",
    useButton: "Use the top right button to import channels"
  },

  sidebar: {
    search: "Search a channel",
    groups: "Groups",
    settings: "Settings",
    loading: "Loading..."
  },

  auth: {
    signIn: "Sign in to your account",
    contractNumber: "Enter your contract number",
    login: "Enter your login",
    password: "Enter your password",
  },

  messages: {
    typeMessage: "Type your message here...",
    SelectAChannel: "Select a channel to start chatting",
    Me: "Me",
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
      importUrl: "Enter an URL to import channels",
      },
      password: {
        enter: "Enter your password",
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
    },

    server: {
      address: "Enter the new server address"
    }
  },

  buttons: {
    messages: "Messages",
    webview: "Webview",
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
  },

  titles: {
    Welcome: "Welcome",
    contractNumber: "Contract number",
    login: "Login",
    password: "Password",
    stayConnected: "Stay connected",
    messages: "Messages",
    channels: "Channels",
    security: "Security",
  },

  settings: {
    messages: {
      Timeout: "Session timeout",
      DefineTimeout: "Define the time after which the session will be logged out",
    },
    webview: {
      quit: "Quit app",
      quitDescription: "Quit the app and go back to the home screen",
      management: "Channel management",
      managementDescription: "Access to imported channels",
      autoRefresh: "Auto-refresh",
      autoRefreshDescription: "Define the auto-refresh interval for the channels",
      readOnly: "Read-only access",
      readOnlyDescription: "Access to channels without the ability to modify them",
      password: "Password",
      passwordDescription: "Define a password to access the settings",
    },
    common: {
      showHide: "Show/hide messages",
      showHideDescription: "Show or hide messages section of the app",
      changeServer: "Change server address",
      changeServerDescription: "Change the server address of the app",
    }
  },
  errors: {
    required: "This field is required",
    invalidUrl: "Invalid URL",
    passwordMismatch: "Passwords do not match",
    passwordTooShort: "Password must be at least 6 characters"
  }
}