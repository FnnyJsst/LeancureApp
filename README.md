# Leancure View Application

## Description and Features:

Mobile application developed with React Native and Expo consisting of two parts:

1/ Webviews:

The webview part is used to duplicate views from the Leancure software so the operators on the production lines can interact with it. 

Features:
- Import, view, modify, delete webviews
- Choose when to refresh them
- "Read-only" mode available to view webviews without modifying them
- Password protection for webviews settings

2/ Chat:

The other part of the app is a messaging service allowing users to send text messages, images and files.

- Secure authentication
- Simplified login form
- Communication through a chat system with public and private groups and channels
- Send text messages, PDFs, images, CSV files
- Edit and delete a message
- Push notifications

## Installation
- Install dependencies: `npm install`
- Launch in development: `npx expo start`

## Prerequisites
- Node.js (version 14 or higher)
- npm or yarn
- Expo CLI
- An iOS/Android emulator or a physical device for testing

## Configuration
1. Create a `.env` at the root of the project
2. Copy les environement variables from `.env.example`
3. Fill values for:
   - API_URL (URL of the API)
   - WS_URL (URL of the Websocket server)

## Scripts disponibles
- `npm start` : Starts the application in development mode
- `npm test` : Starts the tests
- `npm run lint` : Checks the quality of the code with Eslint

## Troubleshooting
Common problems ans solutions
- Si the app doesn't start, try cleaning the cache : `npx expo start -c`
- For dependency problems : `rm -rf node_modules && npm install`
- En cas d'erreur de build : `npx expo prebuild --clean`

## Project Structure:
├── assets/ # Fonts, images and other ressources
├── components/ # Reusable components
├── config/ # .env file
├── constants/ # Constants and configuration for screens and styles
├── i18n/ # Translation files
├── screens/ # Application screens
├── services/ # Services (API, notifications, websocket...)
├── hooks/ # Custom hooks
└── utils/ # Error and encryption related functions

## Main Hooks
- `useDeviceType`: Device type detection
- `useNavigation`: Application navigation
- `useTimeout`: Application timeout management
- `useWebSocket`: WebSocket connection
- `useWebviews`: Webviews management
- `useWebviewsPassword`: Password management

## Technologies Used
- React Native
- Expo
- SecureStore
- React Navigation
- Expo FileSystem
- Expo Notifications

## Security
- Secure credentials storage with SecureStore
- Password protection for settings
- Read-only mode for webviews

## Contribution
1. Fork the project
2. Create a branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -m 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Create Pull Request

## Future upgrades 
1. Automatic alerts to inform the operators of various envent hapening in the factory (machine breakind down, low efficiency rate...)

## Documentation 📚

### Architecture
Pour comprendre l'organisation du code et la structure du projet, consultez [l'architecture détaillée](docs/ARCHITECTURE.md).

### Déploiement
Pour les instructions détaillées de déploiement Android, consultez [la procédure de déploiement](docs/DEPLOYMENT.md).