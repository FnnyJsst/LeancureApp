# Documentation WebSocket - Système de Messagerie

## 📋 Vue d'ensemble

Cette documentation explique l'architecture WebSocket de votre application de messagerie, qui permet la communication en temps réel entre les clients React Native et le serveur PHP.

## 📚 Documentation disponible

### 1. [Architecture WebSocket](./WEBSOCKET_ARCHITECTURE.md)
Documentation complète de l'architecture WebSocket incluant :
- Vue d'ensemble du système
- Composants principaux (serveur, souscriptions, algorithmes)
- Intégration avec l'API REST
- Sécurité et robustesse
- Performance et scalabilité

### 2. [Diagrammes de séquence](./WEBSOCKET_SEQUENCE.md)
Diagrammes Mermaid illustrant :
- Connexion initiale et souscription
- Envoi de messages et notifications
- Gestion des déconnexions
- Ping/Pong pour maintenir la connexion
- Gestion des erreurs et reconnexion
- Flux complet d'une session de messagerie

### 3. [Guide de développement](./WEBSOCKET_DEVELOPMENT.md)
Guide pratique pour :
- Comprendre la structure du code
- Ajouter de nouveaux types de notifications
- Gérer les erreurs et le debugging
- Tester et valider le système
- Déployer en production
- Évolutions futures

## 🚀 Démarrage rapide

### Prérequis
- PHP 7.4+
- Extensions PHP : `stream_socket_server`, `stream_select`, `json`, `openssl`

### Lancement du serveur WebSocket
```bash
cd /path/to/websocket
php websocket_server.php
```

### Test de connectivité
```bash
# Installation de wscat
npm install -g wscat

# Test de connexion
wscat -c ws://localhost:8000

# Envoi d'une souscription de test
{"sender": "client", "subscriptions": [{"package": "test", "page": "test", "filters": {"values": {"test": true}}}]}
```

## 🔧 Configuration

### Serveur WebSocket (`websocket_server.php`)
```php
$address = '0.0.0.0';  // Écoute sur toutes les interfaces
$port = 8000;          // Port WebSocket
```

### Client React Native
```javascript
// Configuration dans useWebSocket.js
const WS_URL = 'ws://your-server:8000';
```

## 📊 Architecture en résumé

```
┌─────────────────┐    WebSocket     ┌─────────────────┐
│   Client RN     │ ◄──────────────► │  Serveur WS     │
│  (React Native) │                  │   (PHP)         │
└─────────────────┘                  └─────────────────┘
                                              │
                                              ▼
                                    ┌─────────────────┐
                                    │   API REST      │
                                    │   (PHP)         │
                                    └─────────────────┘
```

## 🔑 Fonctionnalités clés

### 1. **Communication en temps réel**
- Connexions WebSocket persistantes
- Diffusion instantanée des messages
- Pas de polling nécessaire

### 2. **Système de souscriptions**
- Abonnement dynamique aux canaux
- Filtrage intelligent des notifications
- Réduction du trafic réseau

### 3. **Gestion robuste des erreurs**
- Reconnexion automatique côté client
- Nettoyage propre des ressources
- Gestion des timeouts et déconnexions

### 4. **Performance optimisée**
- Diffusion ciblée (seuls les clients concernés)
- Buffer intelligent pour les trames fragmentées
- Boucle non-bloquante avec timeout

## 📝 Formats de messages

### Souscription client
```json
{
  "sender": "client",
  "subscriptions": [
    {
      "package": "amaiia_msg_srv",
      "page": "messages",
      "filters": {
        "values": {
          "channel": ["2", "3", "5"]
        }
      }
    }
  ]
}
```

### Notification serveur
```json
{
  "sender": "server",
  "notification": {
    "package": "amaiia_msg_srv",
    "page": "messages",
    "filters": {
      "values": "2"
    },
    "data": {
      "messageId": "12345",
      "channelId": "2"
    },
    "message": "Nouveau message reçu"
  }
}
```

## 🛠️ Développement

### Ajout d'un nouveau type de notification

1. **Définir les constantes** dans `amaiia_msg_srv_const.php`
2. **Créer la fonction de notification** dans `amaiia_msg_srv_cmd.php`
3. **Mettre à jour le client** React Native

### Debugging

#### Côté serveur
```bash
# Logs en temps réel
php websocket_server.php

# Exemple de sortie
Serveur WebSocket démarré sur ws://0.0.0.0:8000
Nouveau client connecté
Client 123 mis à jour avec ses souscriptions.
Notification envoyée à client 456 : {...}
```

#### Côté client
```javascript
socket.onopen = () => console.log('WebSocket connecté');
socket.onmessage = (event) => console.log('Message reçu:', event.data);
socket.onerror = (error) => console.error('Erreur WebSocket:', error);
socket.onclose = (event) => console.log('WebSocket fermé:', event.code);
```

## 🔒 Sécurité

### Mesures actuelles
- Validation des messages JSON
- Gestion propre des déconnexions
- Codes de fermeture appropriés

### Améliorations recommandées
- Authentification par token JWT
- Rate limiting
- Chiffrement SSL/TLS
- Validation des schémas de messages

## 📈 Monitoring

### Métriques à surveiller
- Nombre de clients connectés
- Messages reçus/envoyés
- Taux d'erreurs
- Temps de réponse

### Outils recommandés
- Logs système
- Métriques PHP
- Monitoring réseau
- Alertes automatiques

## 🚀 Déploiement

### Production
- Service systemd pour la persistance
- Supervisor pour le monitoring
- Configuration des limites système
- Logs structurés

### Évolutions futures
- Clustering avec Redis
- Load balancing
- Monitoring avancé
- Compression des messages

## 📞 Support

Pour toute question ou problème :
1. Consultez les logs du serveur WebSocket
2. Vérifiez la connectivité réseau
3. Testez avec les outils de diagnostic fournis
4. Consultez la documentation détaillée

---

**Note** : Cette documentation est mise à jour régulièrement. Pour les dernières modifications, consultez les fichiers source et les commits Git.