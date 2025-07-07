# Architecture WebSocket - Back-end

## Vue d'ensemble

Le système de messagerie utilise une architecture WebSocket pour permettre la communication en temps réel entre les clients (application React Native) et le serveur. Cette architecture permet la diffusion instantanée des messages et notifications sans nécessiter de polling constant.

## Architecture générale

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

## Composants principaux

### 1. Serveur WebSocket (`websocket_server.php`)

Le serveur WebSocket est le cœur du système de communication en temps réel.

#### Configuration
- **Adresse** : `0.0.0.0` (écoute sur toutes les interfaces)
- **Port** : `8000`
- **Protocole** : WebSocket (RFC 6455)

#### Fonctionnalités principales

##### Gestion des connexions
```php
// Création de la socket serveur
$server = stream_socket_server("tcp://$address:$port", $errno, $errstr);

// Structure des clients connectés
$clients = [
    $socketId => [
        'socket' => $resource,
        'buffer' => '', // Pour les trames fragmentées
        'subscriptions' => [] // Abonnements du client
    ]
];
```

##### Handshake WebSocket
Le serveur gère automatiquement le handshake WebSocket :
1. Réception de la requête HTTP avec `Sec-WebSocket-Key`
2. Calcul de la clé d'acceptation
3. Envoi de la réponse `101 Switching Protocols`

##### Gestion des trames WebSocket
Le serveur implémente le protocole WebSocket complet :
- **Encodage** : `serverEncode()` - Création des trames côté serveur
- **Décodage** : `serverDecode()` - Lecture des trames côté client
- **Types de trames** : Text, Close, Ping, Pong

### 2. Système de souscriptions

#### Principe
Les clients s'abonnent à des notifications spécifiques basées sur :
- **Package** : Module de l'application
- **Page** : Section spécifique
- **Filtres** : Critères de filtrage (canaux, indicateurs, etc.)

#### Format des souscriptions client
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

#### Format des notifications serveur
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

### 3. Algorithme de correspondance (`isSubscribed()`)

La fonction `isSubscribed()` détermine si un client doit recevoir une notification :

#### Critères de correspondance
1. **Package et page** doivent correspondre exactement
2. **Filtres** : Correspondance selon les règles suivantes :
   - **Wildcard** : Si la souscription a `"value": true`, toute valeur est acceptée
   - **Tableau** : Si la souscription définit un tableau, la valeur de la notification doit être dans ce tableau
   - **Valeur simple** : Comparaison directe

#### Exemples de correspondance

**Exemple 1 - Messages par canal :**
```php
// Client s'abonne aux canaux 2, 3, 5
"filters" => ["values" => ["channel" => ["2", "3", "5"]]]

// Notification pour le canal 2
"filters" => ["values" => "2"]
// ✅ Correspondance : 2 est dans [2, 3, 5]
```

**Exemple 2 - Indicateurs OEE :**
```php
// Client s'abonne à tous les indicateurs OEE
"filters" => ["values" => ["oee" => true]]

// Notification avec valeur OEE
"filters" => ["values" => ["oee" => 85.5]]
// ✅ Correspondance : wildcard accepte toute valeur
```

### 4. Intégration avec l'API REST

#### Flux de communication
1. **Client envoie un message** via API REST (`messageApi.js`)
2. **API traite le message** et l'enregistre en base
3. **API envoie une notification** via WebSocket éphémère
4. **Serveur WebSocket diffuse** la notification aux clients abonnés

#### Connexion éphémère pour notifications
```php
// Le serveur API crée une connexion WebSocket temporaire
// pour envoyer une notification, puis se déconnecte
case 'server':
    // Diffusion de la notification
    foreach ($clients as $cid => $clientData) {
        if (isSubscribed($clientData['subscriptions'], $notification)) {
            // Envoi de la notification
            $frame = serverEncode($messageToSend, 'text');
            fwrite($clientData['socket'], $frame);
        }
    }
    // Fermeture de la connexion éphémère
    fclose($socket);
    unset($clients[$clientId]);
```

## Sécurité et robustesse

### Gestion des erreurs
- **Déconnexions propres** : Envoi de trames de fermeture avec codes appropriés
- **Buffer management** : Gestion des trames fragmentées
- **Validation JSON** : Vérification de la validité des messages

### Codes de fermeture WebSocket
- `1000` : Fermeture normale
- `1001` : Client part (Going Away)

### Timeout et monitoring
- **Ping/Pong** : Maintien de la connexion
- **Détection de déconnexion** : Surveillance des sockets
- **Nettoyage automatique** : Suppression des clients déconnectés

## Performance et scalabilité

### Optimisations actuelles
- **Boucle non-bloquante** : `stream_select()` avec timeout de 200ms
- **Buffer intelligent** : Gestion des trames incomplètes
- **Diffusion ciblée** : Envoi uniquement aux clients concernés

### Limitations actuelles
- **Serveur unique** : Pas de clustering
- **Mémoire** : Tous les clients en mémoire
- **Persistance** : Pas de sauvegarde des connexions

## Déploiement

### Prérequis
- PHP 7.4+ avec extensions :
  - `stream_socket_server`
  - `stream_select`
  - `json`
  - `openssl` (pour le handshake)

### Lancement
```bash
php websocket_server.php
```

### Monitoring
Le serveur affiche des logs en temps réel :
- Connexions/déconnexions
- Messages reçus
- Notifications envoyées
- Erreurs de décodage

## Intégration avec l'application React Native

### Côté client
L'application React Native utilise le hook `useWebSocket` pour :
- **Connexion automatique** au serveur WebSocket
- **Gestion des souscriptions** selon les canaux sélectionnés
- **Réception des notifications** en temps réel
- **Reconnexion automatique** en cas de déconnexion

### Flux complet
1. **Utilisateur ouvre un canal** → Souscription WebSocket
2. **Utilisateur envoie un message** → API REST
3. **API notifie via WebSocket** → Diffusion aux abonnés
4. **Clients reçoivent la notification** → Mise à jour de l'interface

## Évolutions possibles

### Améliorations techniques
- **Clustering** : Support multi-instances
- **Redis** : Partage d'état entre serveurs
- **Persistance** : Sauvegarde des connexions
- **SSL/TLS** : Chiffrement des communications

### Fonctionnalités avancées
- **Typage des messages** : Validation des schémas
- **Rate limiting** : Protection contre le spam
- **Authentification** : Vérification des tokens
- **Métriques** : Monitoring des performances