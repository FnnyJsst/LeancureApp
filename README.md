# Leancure View Application

## Description and Features:

Mobile application developed with React Native and Expo consisting of two parts:

1/ Webviews:
Features:
- Import, view, modify, delete webviews
- Set their refresh interval
- "Read-only" mode available to view webviews without modifying them
- Password protection for webviews settings

2/ Messages:
- Secure authentication
- Simplified login form
- Communication through a chat system with public and private groups and channels
- Send text messages, PDFs, images, CSV files
- Push notifications

## Installation
- Install dependencies: `npm install`
- Launch in development: `npx expo start`

## Project Structure:
├── components/ # Reusable components
├── screens/ # Application screens
├── services/ # Services (API, notifications...)
├── hooks/ # Custom hooks
├── constants/ # Constants and configuration
└── assets/ # Images and resources

## Main Hooks
- `useWebViews`: Webviews management
- `useWebViewsPassword`: Password management
- `useDeviceType`: Device type detection
- `usePushNotifications`: Notifications management
- `useNavigation`: Application navigation

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