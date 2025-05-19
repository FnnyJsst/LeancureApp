# Procédure de Déploiement Android - LeancureApp

## Versions de l'Application 📱

### Version 1 (Branche V1)
- Package : `com.leancure.app`
- Fonctionnalités :
  - Webviews uniquement
- Déploiement : Via la branche `V1` du repository

### Version 2 (Branche main)
- Package : `com.leancure.app.v2`
- Fonctionnalités :
  - Webviews
  - Messages
- Déploiement : Via la branche `main` du repository

⚠️ **Important** : Assurez-vous de bien être sur la bonne branche avant de commencer le déploiement.

# Pour déployer la V1 (webviews uniquement)
git checkout V1

# Pour déployer la V2 (application complète)
git checkout main


## 1. Prérequis

# Versions requises
node -v  # >= 12.5.1 (selon eas.json)
eas -v   # >= 12.5.1

### Accès Requis
- Compte Google Play Console de Cloudspreader
- Accès au projet Firebase "Leancure App"(pour les notifications)
- Fichier `.secrets/google-services.json`

## 2. Environnements de Build

Les builds sont gérés via EAS (Expo Application Services) avec trois environnements :
- Development : Pour le développement local
- Preview : Pour les tests internes
- Production : Pour le déploiement Play Store

## 3. Étapes de Déploiement

### 3.1 Préparation

0. **Vérifier la version à déployer**
# Vérifier la branche actuelle
git branch

# Si V1 (webviews uniquement)
- Vérifier que le package dans app.json est "com.leancure.app"
- Les variables Firebase ne sont pas nécessaires

# Si V2 (application complète)
- Vérifier que le package dans app.json est "com.leancure.app.v2"
- Suivre toutes les étapes de configuration Firebase

1. **Vérifier les variables d'environnement**
# Vérifier la présence des fichiers secrets
ls .secrets/google-services.json

# Vérifier les variables Firebase dans eas.json
FIREBASE_API_KEY
FIREBASE_PROJECT_ID
FIREBASE_STORAGE_BUCKET
FIREBASE_MESSAGING_SENDER_ID
FIREBASE_APP_ID

2. **Vérifier la version dans app.json**
{
  "expo": {
    "version": "X.Y.Z",
    "android": {
      "package": "com.leancure.app.v2"
    }
  }
}

### 3.2 Build de l'Application

**Vérifier les dépendances du projet**
npx expo-doctor

**Development (Debug)**
eas build --profile development --platform android

**Preview (Test interne)**
eas build --profile preview --platform android

**Production**
eas build --profile production --platform android

### 3.3 Soumission sur le Play Store

- Importer le fichier .aab dans le Google Play Console
- Créer une nouvelle version
- Soumettre la version pour test/publication

## 4. Vérifications Post-déploiement

Après chaque déploiement, vérifier :

### Pour la V1 (webviews uniquement)
- [ ] Accès aux webviews
- [ ] Mode lecture seule fonctionnel
- [ ] Protection par mot de passe des paramètres
- [ ] Rafraîchissement des webviews

### Pour la V2 (application complète)
- [ ] Toutes les vérifications de la V1
- [ ] Notifications Firebase fonctionnelles
- [ ] Connexion API
- [ ] Stockage sécurisé (expo-secure-store)
- [ ] Gestion des documents (expo-document-picker)
- [ ] Gestion des images (expo-image-picker)
- [ ] Système de messagerie
- [ ] Envoi de fichiers

## 5. Procédure de Rollback

En cas de problème :

1. Dans Google Play Console :
   - Arrêter le déploiement
   - Revenir à la version précédente

2. Si nécessaire, rebuild version précédente :

- Télécharger le build précédent sur le site de EAS

## 6. Notes Importantes

1. **Sécurité**
   - Ne jamais commiter les fichiers `.secrets`
   - Vérifier les variables Firebase dans `eas.json`
   - Utiliser les variables d'environnement pour les clés sensibles

2. **Versioning**
   - La version est gérée dans `app.json`
   - L'incrémentation automatique est activée dans le profil production
   - Le track par défaut est "internal" pour plus de sécurité

3. **Build Android**
   - Type de build : APK
   - NDK Path configuré : `/opt/android/ndk/25c`
   - Credentials source : remote pour la production