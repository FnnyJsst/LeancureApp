# LeancureApp

Application React Native pour Leancure.


## Structure du Projet

Le dossier v1 contient la première version de l'application. Elle est une réplique de l'ancienne application Android

src/
├── components/    # Composants réutilisables
├── screens/       # Vues
├── constants/     # Constantes pour les styles et les vues
├── hooks/         # Hooks permettant notamment de gérer les formats d'écran et la navigation
├── i18n/          # Traductions
├── assets/        # Images et polices
├── plugins/		# Contient withAndroidSecurityConfig.js, qui permet de d'utiliser des URL en HTTP malgré les limitations d'Android
├── docs/        	# Contient DEPLOYMENT.md, qui explique la procédure pour déployer l'application
└── App.js			# Point d'entrée de l'application


## Fichiers de Configuration

- app.json : Fichier de configuration principal pour l'application, il contient notamment les versions et permissions requises
- babel.config.js : Configure le transpileur Babel qui convertit le code JavaScript moderne en version compatible avec tous les environnements.
- eas.json : Fichier de configuration pour Expo Application Services. Il gère les builds et la configuration des différents environnements (development, preview, production)
- metro.config.js : Configure Metro, le bundler JavaScript de React Native.
- package.json : Définit les dépendances du projet
- package-lock.json : Verrouille les versions exactes des dépendances pour garantir des installations cohérentes entre les développeurs.
- polyfills.js : Ajoute le support de fonctionnalités JavaScript modernes sur les anciennes versions de navigateurs/environnements, nécessaire depuis la dernière mise-à-jour Android


## Prérequis

- Node.js
- npm ou yarn, 
- Expo : npm install -g expo
- Expo CLI, l'interface en ligne de commande d'Expo : npm install -g expo-cli
- L'Application Expo Go installée sur un smartphone ou une tablette
- La création d'un compte Expo pour Leancure, transférer l'application sur ce compte : 
# Se connecter avec le compte entreprise 
npx expo login --username compte-entreprise@domaine.com

# Transférer le projet
npx eas project:transfer --project-id [ID_DU_PROJET] --target-account [COMPTE_ENTREPRISE]


## Installation

Installer les dépendances : npm install ou yarn install


## Options de Lancement

### OPTION 1 : Expo Go (Si pas de build de développement)

1. Lancer la commande : npx expo start --go
2. Scanner le QR Code généré depuis l'application Expo Go


### OPTION 2 Development Build (Pour tester l'application en conditions réelles)

1. Créer un build développement (cf docs.DEPLYMENT.md)
2. Installer l'APK créée sur un smartphone ou une tablette physique (pas d'émulateur)
3. lancer la commande : npx expo start --dev-client
4. Scanner le QR Code ou lancer l'APK
En cas de changement dans les dépendances, un nouveau build développement doit être créé

